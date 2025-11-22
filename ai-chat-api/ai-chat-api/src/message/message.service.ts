import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, MessageFeedback } from './message.entity';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message) private messageRepo: Repository<Message>,
  ) {}

  async leaveFeedback(
    messageId: number,
    feedback: MessageFeedback | null,
    userId: number,
    comment?: string,
  ) {
    const message = await this.messageRepo.findOne({
      where: { id: messageId },
      relations: ['conversation', 'conversation.user'],
    });

    if (!message) throw new NotFoundException('Message not found');
    if (message.sender !== 'ai') {
      throw new BadRequestException('Only AI responses can be rated');
    }

    const ownerId = message.conversation?.user?.id;
    if (ownerId && ownerId !== userId) {
      throw new BadRequestException(
        'Message does not belong to this user conversation',
      );
    }

    message.feedback = feedback ?? null;
    message.feedbackComment =
      feedback === null ? null : comment?.trim() || null;
    message.feedbackAt = feedback === null ? null : new Date();

    return this.messageRepo.save(message);
  }
}
