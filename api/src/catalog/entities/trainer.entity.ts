import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Sport } from './sport.entity';

@Entity('trainers')
export class Trainer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fullName: string;

  @Column({ type: 'text', default: '' })
  bio: string;

  @Column({ type: 'int', default: 0 })
  experienceYears: number;

  @Column({ type: 'varchar', nullable: true })
  photoUrl: string | null;

  @ManyToOne(() => Sport, { eager: true, nullable: true, onDelete: 'SET NULL' })
  sport: Sport | null;
}
