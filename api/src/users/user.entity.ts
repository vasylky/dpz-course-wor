import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type UserRole = 'client' | 'admin';
export type LoyaltyTier = 'standard' | 'premium' | 'corporate';

export interface UserPreferences {
  sports?: string[];
  remindBeforeHours?: number;
  promoNotifications?: boolean;
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  passwordHash: string;

  @Column()
  fullName: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', nullable: true })
  photoUrl: string | null;

  @Column({ type: 'jsonb', default: {} })
  preferences: UserPreferences;

  @Column({ type: 'varchar', default: 'client' })
  role: UserRole;

  @Column({ type: 'varchar', default: 'standard' })
  loyaltyTier: LoyaltyTier;

  @Column({ type: 'varchar', nullable: true })
  companyName: string | null;

  @Column({ type: 'int', default: 0 })
  bonusPoints: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
