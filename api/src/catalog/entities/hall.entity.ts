import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { numeric } from '../../common/numeric.transformer';
import { Section } from './section.entity';
import { Sport } from './sport.entity';
import { SportsCenter } from './sports-center.entity';

@Entity('halls')
export class Hall {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => SportsCenter, (c) => c.halls, {
    onDelete: 'CASCADE',
    eager: true,
  })
  center: SportsCenter;

  @ManyToOne(() => Sport, { eager: true, nullable: true, onDelete: 'SET NULL' })
  sport: Sport | null;

  @Column({ type: 'int' })
  capacity: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, transformer: numeric })
  pricePerHour: number;

  @Column({ type: 'int', default: 8 })
  openHour: number;

  @Column({ type: 'int', default: 22 })
  closeHour: number;

  @Column({ type: 'text', default: '' })
  description: string;

  @OneToMany(() => Section, (s) => s.hall)
  sections: Section[];
}
