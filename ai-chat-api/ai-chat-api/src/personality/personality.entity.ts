import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Conversation } from '../conversation/conversation.entity';

@Entity()
export class Personality {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  slug: string;

  @Column()
  name: string;

  @Column({ default: 'fluffy/l3-8b-stheno-v3.2:q8_0' })
  model: string;

  @Column({ type: 'text' })
  basePrompt: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  accentColor?: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  avatar?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  traits?: string[] | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  appearancePreset?: string | null;

  @OneToMany(() => Conversation, convo => convo.personality)
  conversations: Conversation[];
}
