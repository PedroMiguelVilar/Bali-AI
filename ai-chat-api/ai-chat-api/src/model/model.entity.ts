import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Model {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Identifier used by the LLM backend, e.g. "fluffy/l3-8b-stheno-v3.2:q8_0".
   */
  @Column({ unique: true })
  name: string;

  /**
   * Human-friendly label for the UI.
   */
  @Column()
  label: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  provider?: string | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ default: true })
  active: boolean;
}
