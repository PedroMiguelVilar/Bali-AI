import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Conversation } from '../conversation/conversation.entity';
import { LongTermMemory } from '../long-term-memory/long-term-memory.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column({ nullable: true })
  email?: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Conversation, (convo) => convo.user)
  conversations: Conversation[];

  @OneToMany(() => LongTermMemory, (memory) => memory.user)
  longTermMemories: LongTermMemory[];
}
