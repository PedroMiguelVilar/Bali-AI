import {
  Controller,
  Post,
  Body,
  Param,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { PersonalityService } from '../personality/personality.service';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly personalityService: PersonalityService,
  ) {}

  @Post(':slug')
  async chat(
    @Param('slug') slug: string,
    @Body()
    body: { message: string; conversationId?: number; userId?: number },
  ) {
    const personality = await this.personalityService.findBySlug(slug);
    if (!personality) throw new NotFoundException('Personality not found');

    const message = body?.message?.trim();
    if (!message) {
      throw new BadRequestException('Message is required');
    }

    const userId = body?.userId ?? 1;

    const response = await this.chatService.talkToModel(
      message,
      personality,
      userId,
      body?.conversationId,
    );
    return {
      text: response.text,
      tokens: response.tokens,
      conversationId: response.conversationId,
      messageId: response.messageId,
    };
  }
}
