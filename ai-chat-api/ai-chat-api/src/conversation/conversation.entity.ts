import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, OneToMany } from 'typeorm';
import { User } from '../user/user.entity';
import { Personality } from '../personality/personality.entity';
import { Message } from '../message/message.entity';

@Entity()
export class Conversation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.conversations)
  user: User;

  @ManyToOne(() => Personality, personality => personality.conversations, { onDelete: 'CASCADE' })
  personality: Personality;

  @CreateDateColumn()
  startedAt: Date;

  @OneToMany(() => Message, message => message.conversation, { cascade: true, onDelete: 'CASCADE' })
  messages: Message[];
  
}
