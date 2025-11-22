import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './conversation.entity';
import { User } from '../user/user.entity';
import { Personality } from '../personality/personality.entity';
import { Message } from '../message/message.entity'; // ✅ import Message
import { ConversationController } from './conversation.controller';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, User, Personality, Message]),
    LlmModule,
  ],
  controllers: [ConversationController],
})
export class ConversationModule {}
