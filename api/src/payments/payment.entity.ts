import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { numeric } from '../common/numeric.transformer';
import { User } from '../users/user.entity';

export type PaymentPurpose = 'booking' | 'membership' | 'loyalty_card';
export type PaymentStatus = 'succeeded' | 'failed' | 'refunded';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'varchar' })
  purpose: PaymentPurpose;

  @Column({ type: 'int', nullable: true })
  referenceId: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, transformer: numeric })
  amount: number;

  @Column()
  provider: string;

  @Column({ type: 'varchar', nullable: true })
  transactionId: string | null;

  @Column({ type: 'varchar' })
  status: PaymentStatus;

  @Column({ type: 'varchar', nullable: true })
  error: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
