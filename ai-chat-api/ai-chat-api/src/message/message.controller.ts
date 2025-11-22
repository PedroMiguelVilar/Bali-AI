import {
  BadRequestException,
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { MessageFeedback } from './message.entity';
import { MessageService } from './message.service';

@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post(':id/feedback')
  async rateMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      feedback: MessageFeedback | null;
      userId?: number;
      comment?: string;
    },
  ) {
    const feedback = body?.feedback ?? null;
    if (feedback !== 'up' && feedback !== 'down' && feedback !== null) {
      throw new BadRequestException('Feedback must be "up", "down", or null');
    }

    const userId = body?.userId ?? 1;
    const updatedMessage = await this.messageService.leaveFeedback(
      id,
      feedback,
      userId,
      body?.comment,
    );

    return {
      messageId: updatedMessage.id,
      feedback: updatedMessage.feedback,
      feedbackComment: updatedMessage.feedbackComment,
      feedbackAt: updatedMessage.feedbackAt,
    };
  }
}
