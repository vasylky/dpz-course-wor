import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { numeric } from '../../common/numeric.transformer';
import { Hall } from './hall.entity';
import { SectionSession } from './section-session.entity';
import { Sport } from './sport.entity';
import { Trainer } from './trainer.entity';

export const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export const AGE_GROUPS = ['kids', 'teens', 'adults', 'seniors'] as const;
export type Level = (typeof LEVELS)[number];
export type AgeGroup = (typeof AGE_GROUPS)[number];

@Entity('sections')
export class Section {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @ManyToOne(() => Sport, { eager: true, onDelete: 'CASCADE' })
  sport: Sport;

  @ManyToOne(() => Hall, (h) => h.sections, { eager: true, onDelete: 'CASCADE' })
  hall: Hall;

  @ManyToOne(() => Trainer, { eager: true, nullable: true, onDelete: 'SET NULL' })
  trainer: Trainer | null;

  @Column({ type: 'varchar' })
  level: Level;

  @Column({ type: 'varchar' })
  ageGroup: AgeGroup;

  @Column({ type: 'int' })
  capacity: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, transformer: numeric })
  pricePerVisit: number;

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => SectionSession, (s) => s.section)
  sessions: SectionSession[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
