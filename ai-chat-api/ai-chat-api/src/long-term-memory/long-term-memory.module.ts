import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LongTermMemory } from './long-term-memory.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LongTermMemory])],
  exports: [TypeOrmModule],
})
export class LongTermMemoryModule {}
