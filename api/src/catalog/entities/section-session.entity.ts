import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Section } from './section.entity';

@Entity('section_sessions')
export class SectionSession {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Section, (s) => s.sessions, { onDelete: 'CASCADE', eager: true })
  section: Section;

  @Column({ type: 'timestamptz' })
  startsAt: Date;

  @Column({ type: 'int', default: 60 })
  durationMin: number;
}
