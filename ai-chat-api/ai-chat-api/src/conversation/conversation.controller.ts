import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Conversation } from 'src/conversation/conversation.entity';
import { User } from 'src/user/user.entity';
import { Personality } from 'src/personality/personality.entity';
import { Message } from 'src/message/message.entity';
import { annotateActionText } from '../utils/action-text.util';
import { LlmService } from 'src/llm/llm.service';
import {
  APPEARANCE_PRESETS,
  TRAIT_PRESETS,
} from 'src/personality/personality.presets';

@Controller('conversation')
export class ConversationController {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepo: Repository<Conversation>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(Personality)
    private personalityRepo: Repository<Personality>,

    @InjectRepository(Message)
    private messageRepo: Repository<Message>,

    private readonly dataSource: DataSource,

    private readonly llmService: LlmService,
  ) {}

  // Prevent multiple simultaneous intro generations per user/personality
  private readonly creationLocks = new Map<string, Promise<Conversation | null>>();

  private readonly traitPromptByKey = new Map(
    TRAIT_PRESETS.map((t) => [t.key, t.prompt]),
  );

  @Get('user/:userId/personality/:personalityId')
  async getConversationsForPersonality(
    @Param('userId') userId: number,
    @Param('personalityId') personalityId: number,
  ) {
    const conversations = await this.conversationRepo.find({
      where: {
        user: { id: userId },
        personality: { id: personalityId },
      },
      order: { startedAt: 'DESC' },
      relations: ['messages'],
    });

    return conversations.map((conversation) =>
      this.annotateConversationMessages(conversation),
    );
  }

  @Post()
  async createConversation(
    @Body() body: { userId: number; personalityId: number },
  ) {
    const lockKey = `${body.userId}:${body.personalityId}`;
    const existingCreation = this.creationLocks.get(lockKey);
    if (existingCreation) {
      return existingCreation;
    }

    const creationPromise = (async () => {
      const user = await this.userRepo.findOneBy({ id: body.userId });
      const personality = await this.personalityRepo.findOneBy({
        id: body.personalityId,
      });

      if (!user || !personality) {
        throw new Error('Invalid user or personality ID');
      }

      const introText = await this.generateIntroMessage(personality);

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const conversation = queryRunner.manager.create(Conversation, {
          user,
          personality,
        });

        const savedConversation = await queryRunner.manager.save(conversation);

        const message = queryRunner.manager.create(Message, {
          sender: 'ai',
          text: annotateActionText(introText),
          content: introText,
          conversation: savedConversation,
        });

        await queryRunner.manager.save(message);

        await queryRunner.commitTransaction();
        await queryRunner.release();

        const fullConversation = await this.conversationRepo.findOne({
          where: { id: savedConversation.id },
          relations: ['messages'],
        });
        if (!fullConversation) {
          return fullConversation;
        }
        return this.annotateConversationMessages(fullConversation);
      } catch (err) {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        throw new Error(`Conversation creation failed: ${err.message}`);
      }
    })();

    this.creationLocks.set(lockKey, creationPromise);
    try {
      return await creationPromise;
    } finally {
      this.creationLocks.delete(lockKey);
    }
  }

  @Get(':id')
  async getConversation(@Param('id') id: number) {
    const conversation = await this.conversationRepo.findOne({
      where: { id },
      relations: ['user', 'personality', 'messages'],
    });
    if (!conversation) {
      return conversation;
    }
    return this.annotateConversationMessages(conversation);
  }

  @Get(':id/messages')
  async getMessagesForConversation(
    @Param('id') id: number,
  ): Promise<Message[]> {
    const messages = await this.messageRepo.find({
      where: { conversation: { id } },
      order: { createdAt: 'ASC' },
    });
    return this.annotateMessages(messages);
  }

  @Delete(':id')
  async deleteConversation(@Param('id') id: number) {
    return this.conversationRepo.delete(id);
  }

  @Put(':id')
  async updateConversation(
    @Param('id') id: number,
    @Body() body: Partial<Conversation>,
  ) {
    await this.conversationRepo.update(id, body);
    return this.conversationRepo.findOne({ where: { id } });
  }

  private annotateConversationMessages<T extends { messages?: Message[] }>(
    conversation: T,
  ): T {
    if (conversation.messages?.length) {
      conversation.messages = this.annotateMessages(conversation.messages);
    }
    return conversation;
  }

  private annotateMessages(messages: Message[]): Message[] {
    return messages.map((message) => {
      message.text = annotateActionText(message.text);
      message.content = annotateActionText(message.content);
      return message;
    });
  }

  private async generateIntroMessage(personality: Personality): Promise<string> {
    const traitPrompts = (personality.traits || [])
      .map((t) => this.traitPromptByKey.get(t))
      .filter(Boolean)
      .join('\n');

    const appearancePrompt = this.getAppearancePrompt(
      personality.appearancePreset,
    );

    const introPrompt = [
      personality.basePrompt?.trim() || '',
      traitPrompts ? `Style:\n${traitPrompts}` : '',
      appearancePrompt ? `Persona mood:\n${appearancePrompt}` : '',
      'Open the conversation with a short introduction (1-3 sentences). Greet the user, mention how you can help, and invite them to share what they need.',
    ]
      .filter(Boolean)
      .join('\n\n');

    const model = personality.model || 'fluffy/l3-8b-stheno-v3.2:q8_0';

    try {
      const response = await this.llmService.prompt(
        introPrompt,
        model,
        `You are a helpful but cautious assistant. 
        Do not assume things the user hasn't told you explicitly. 
        If you're unsure, ask the user to clarify. 
        Keep the greeting concise and in the persona's voice.`,
      );
      const trimmed = response.trim();
      if (trimmed) {
        return trimmed;
      }
    } catch (err) {
      // If the LLM call fails, fall back to a simple introduction.
    }

    return `Hi, I'm ${personality.name}. I'm here to help—what would you like to explore?`;
  }

  private getAppearancePrompt(id?: string | null): string {
    if (!id) return '';
    const preset = APPEARANCE_PRESETS.find((p) => p.id === id);
    if (!preset) return '';
    return `Adopt the "${preset.label}" vibe (${preset.description}).`;
  }
}
