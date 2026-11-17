import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { numeric } from '../common/numeric.transformer';
import { Hall } from '../catalog/entities/hall.entity';
import { SectionSession } from '../catalog/entities/section-session.entity';
import { Membership } from '../memberships/membership.entity';
import { User } from '../users/user.entity';
import type { PriceLine } from './pricing/price-component';

export type BookingKind = 'hall' | 'section';
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'varchar' })
  kind: BookingKind;

  @ManyToOne(() => Hall, { eager: true, nullable: true, onDelete: 'CASCADE' })
  hall: Hall | null;

  @ManyToOne(() => SectionSession, {
    eager: true,
    nullable: true,
    onDelete: 'CASCADE',
  })
  session: SectionSession | null;

  @Column({ type: 'timestamptz' })
  startsAt: Date;

  @Column({ type: 'timestamptz' })
  endsAt: Date;

  @Column({ type: 'numeric', precision: 10, scale: 2, transformer: numeric })
  basePrice: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, transformer: numeric })
  finalPrice: number;

  @Column({ type: 'jsonb', default: [] })
  priceLines: PriceLine[];

  @Column({ type: 'int', default: 0 })
  bonusSpent: number;

  @Column({ type: 'int', default: 0 })
  bonusAwarded: number;

  @ManyToOne(() => Membership, { eager: true, nullable: true, onDelete: 'SET NULL' })
  membership: Membership | null;

  @Column({ type: 'varchar', default: 'pending' })
  status: BookingStatus;

  @Column({ default: false })
  reminderSent: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  confirmedAt: Date | null;
}
