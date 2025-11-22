import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { User } from '../user/user.entity';
import { Conversation } from '../conversation/conversation.entity';
import { Message } from '../message/message.entity';
import { Personality } from '../personality/personality.entity';
import { PersonalityModule } from '../personality/personality.module';
import { LongTermMemory } from '../long-term-memory/long-term-memory.entity';
import { MemoryModule } from '../memory/memory.module';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Conversation,
      Message,
      Personality,
      LongTermMemory,
    ]),
    PersonalityModule,
    MemoryModule,
    LlmModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
