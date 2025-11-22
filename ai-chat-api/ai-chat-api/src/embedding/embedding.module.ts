import { Module } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';

@Module({
  providers: [EmbeddingService],
  exports: [EmbeddingService], // ✅ must be exported
})
export class EmbeddingModule {}
