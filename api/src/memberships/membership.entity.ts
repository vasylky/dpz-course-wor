import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { numeric } from '../common/numeric.transformer';
import { User } from '../users/user.entity';

export type MembershipType = 'single' | 'monthly' | 'corporate';
export type MembershipStatus = 'active' | 'expired' | 'used_up';

@Entity('memberships')
export class Membership {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'varchar' })
  type: MembershipType;

  @Column()
  title: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, transformer: numeric })
  price: number;

  @Column({ type: 'int', nullable: true })
  visitsTotal: number | null;

  @Column({ type: 'int', nullable: true })
  visitsLeft: number | null;

  @Column({ type: 'timestamptz' })
  validFrom: Date;

  @Column({ type: 'timestamptz' })
  validTo: Date;

  @Column({ type: 'varchar', nullable: true })
  companyName: string | null;

  @Column({ type: 'varchar', default: 'active' })
  status: MembershipStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
