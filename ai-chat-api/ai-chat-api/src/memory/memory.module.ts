import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LongTermMemory } from 'src/long-term-memory/long-term-memory.entity';
import { MemoryService } from './memory.service';
import { EmbeddingModule } from 'src/embedding/embedding.module';
import { LlmService } from 'src/llm/llm.service'
@Module({
  imports: [
    TypeOrmModule.forFeature([LongTermMemory]),
    EmbeddingModule,
  ],
  providers: [MemoryService, LlmService],
  exports: [MemoryService],
})
export class MemoryModule {}
