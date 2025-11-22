import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Conversation } from '../conversation/conversation.entity';

export type MessageFeedback = 'up' | 'down';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  conversation: Conversation;

  @Column()
  sender: 'user' | 'ai';

  @Column('text')
  text: string;

  @Column()
  content: string;

  @Column({ type: 'varchar', length: 8, nullable: true })
  feedback?: MessageFeedback | null;

  @Column({ type: 'text', nullable: true })
  feedbackComment?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  feedbackAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
