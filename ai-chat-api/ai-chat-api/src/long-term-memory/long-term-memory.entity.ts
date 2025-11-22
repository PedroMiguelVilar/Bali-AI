import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Conversation } from 'src/conversation/conversation.entity';

@Entity()
export class LongTermMemory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.longTermMemories)
  user: User;

  @Column()
  key: string;

  @Column()
  value: string;

  @Column({ nullable: true })
  sourceMessage?: string;

  @Column({ nullable: true })
  type?: string;

  @Column({ type: 'float', nullable: true })
  confidence?: number;

  @Column({ type: 'text', nullable: true })
  embedding: string;

  @ManyToOne(() => Conversation, { nullable: true })
  conversation?: Conversation;

  @CreateDateColumn()
  createdAt: Date;
}
