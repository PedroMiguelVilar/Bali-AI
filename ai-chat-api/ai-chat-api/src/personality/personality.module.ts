import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Personality } from './personality.entity';
import { PersonalityService } from './personality.service';
import { PersonalityController } from './personality.controller';
import { Model } from '../model/model.entity';
import { ModelModule } from '../model/model.module';
import { Conversation } from '../conversation/conversation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Personality, Model, Conversation]), ModelModule],
  providers: [PersonalityService],
  controllers: [PersonalityController],
  exports: [PersonalityService],
})
export class PersonalityModule {}
