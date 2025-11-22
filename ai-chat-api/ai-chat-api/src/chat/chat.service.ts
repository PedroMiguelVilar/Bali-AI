import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { Conversation } from '../conversation/conversation.entity';
import { Message } from '../message/message.entity';
import { Personality } from '../personality/personality.entity';
import { LongTermMemory } from '../long-term-memory/long-term-memory.entity';
import { MemoryService } from 'src/memory/memory.service';
import { LlmService } from 'src/llm/llm.service';
import { annotateActionText } from '../utils/action-text.util';
import {
  APPEARANCE_PRESETS,
  TRAIT_PRESETS,
} from '../personality/personality.presets';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Conversation) private convoRepo: Repository<Conversation>,
    @InjectRepository(Message) private messageRepo: Repository<Message>,
    @InjectRepository(LongTermMemory)
    private longTermRepo: Repository<LongTermMemory>,
    private memoryService: MemoryService,
    private llmService: LlmService,
  ) {}

  readonly maxMemoryMessages = 10;
  private readonly traitPromptByKey = new Map(
    TRAIT_PRESETS.map((t) => [t.key, t.prompt]),
  );

  private getAppearancePrompt(id?: string | null): string {
    if (!id) return '';
    const preset = APPEARANCE_PRESETS.find((p) => p.id === id);
    if (!preset) return '';
    return `Adopt the "${preset.label}" vibe (${preset.description}).`;
  }

  async talkToModel(
    prompt: string,
    personality: Personality,
    userId: number,
    conversationId?: number,
  ): Promise<{
    text: string;
    tokens: number;
    conversationId: number;
    messageId: number;
  }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    let conversation: Conversation | null = null;
    const normalizedConversationId =
      conversationId !== undefined && conversationId !== null
        ? Number(conversationId)
        : undefined;

    if (normalizedConversationId) {
      conversation = await this.convoRepo.findOne({
        where: {
          id: normalizedConversationId,
          user: { id: user.id },
        },
        relations: ['personality', 'user'],
      });

      if (!conversation) {
        throw new BadRequestException('Conversation not found for this user');
      }

      if (conversation.personality.id !== personality.id) {
        throw new BadRequestException(
          'Conversation does not belong to this personality',
        );
      }
    } else {
      const [latestConversation] = await this.convoRepo.find({
        where: {
          user: { id: user.id },
          personality: { id: personality.id },
        },
        relations: ['personality', 'user'],
        order: { startedAt: 'DESC' },
        take: 1,
      });

      conversation = latestConversation ?? null;
    }

    if (!conversation) {
      conversation = await this.convoRepo.save(
        this.convoRepo.create({ user, personality }),
      );
    }

    const previousMessages = await this.messageRepo.find({
      where: { conversation: { id: conversation.id } },
      order: { createdAt: 'DESC' },
      take: this.maxMemoryMessages,
    });
    previousMessages.sort((a, b) => {
      const aTime = a.createdAt ? a.createdAt.getTime() : 0;
      const bTime = b.createdAt ? b.createdAt.getTime() : 0;
      return aTime - bTime;
    });

    const allMemories = await this.longTermRepo.find({
      where: { user: { id: user.id } },
      relations: ['conversation'],
    });

    const longTermMemories = allMemories.filter(
      (m) => m.type !== 'identity' || m.conversation?.id === conversation.id,
    );

    const longTermFacts = longTermMemories
      .map((m) => `- ${m.key}: ${m.value}`)
      .join('\n');

    const similarMemories = await this.memoryService.getSimilarMemories(
      user,
      prompt,
    );

    const embeddedMemories = similarMemories.map((m) => `- ${m.value}`).join('\n');

    const traitPrompts = (personality.traits || [])
      .map((t) => this.traitPromptByKey.get(t))
      .filter(Boolean)
      .join('\n');

    const appearancePrompt = this.getAppearancePrompt(
      personality.appearancePreset,
    );

    const systemPrompt = [
      personality.basePrompt.trim(),
      traitPrompts ? `Style:\n${traitPrompts}` : '',
      appearancePrompt ? `Persona mood:\n${appearancePrompt}` : '',
      embeddedMemories ? `Relevant context:\n${embeddedMemories}` : '',
      longTermFacts ? `Long-term memory:\n${longTermFacts}` : '',
      `Rules:
- Reply only as the assistant for this single turn.
- Do not invent or include future user messages (no "User:" lines).
- Keep the reply grounded in provided context and ask if unsure.`,
    ]
      .filter(Boolean)
      .join('\n\n');

    const historyMessages = previousMessages.map((msg) => ({
      role: msg.sender === 'user' ? ('user' as const) : ('assistant' as const),
      content: msg.content ?? msg.text,
    }));

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...historyMessages,
      { role: 'user' as const, content: prompt },
    ];

    const stopSequences = [
      '<|start_header_id|>',
      '<|end_header_id|>',
      '<|eot_id|>',
      'User:',
      '\nUser:',
    ];

    const llmModel = personality.model || 'fluffy/l3-8b-stheno-v3.2:q8_0';

    const result = await this.llmService.generate(
      messages,
      llmModel,
      0.4,
      1024,
      stopSequences,
    );
    const text = result.content.trim();
    const formattedPrompt = annotateActionText(prompt);
    const formattedResponse = annotateActionText(text);

    const userMessage = await this.messageRepo.save(
      this.messageRepo.create({
        conversation,
        sender: 'user',
        text: formattedPrompt,
        content: prompt,
      }),
    );

    const aiMessage = await this.messageRepo.save(
      this.messageRepo.create({
        conversation,
        sender: 'ai',
        text: formattedResponse,
        content: text,
      }),
    );

    const facts = await this.memoryService.extractMemoryCandidates(prompt);
    for (const fact of facts) {
      await this.memoryService.storeStructuredMemory(
        user,
        userMessage,
        fact.type,
        fact.key,
        fact.value,
        fact.confidence,
      );
    }

    await this.memoryService.reviseMemoryFacts(user, prompt);

    return {
      text: formattedResponse,
      tokens: 0,
      conversationId: conversation.id,
      messageId: aiMessage.id,
    };
  }
}
