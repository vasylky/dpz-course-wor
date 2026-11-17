import { BadRequestException } from '@nestjs/common';
import type { BookingKind } from '../../bookings/booking.entity';
import type { Membership, MembershipType } from '../membership.entity';

export interface MembershipPlan {
  type: MembershipType;
  title: string;
  description: string;
  price: number;
  visits: number | null;
  validityDays: number;
  covers: BookingKind[];
}

// Factory Method: subclasses decide which plan to create
export abstract class MembershipFactory {
  protected abstract createPlan(): MembershipPlan;

  get plan(): MembershipPlan {
    return this.createPlan();
  }

  protected validate(_companyName?: string): void {}

  issue(userId: number, now: Date, companyName?: string): Partial<Membership> {
    this.validate(companyName);
    const plan = this.createPlan();
    return {
      user: { id: userId } as Membership['user'],
      type: plan.type,
      title: plan.title,
      price: plan.price,
      visitsTotal: plan.visits,
      visitsLeft: plan.visits,
      validFrom: now,
      validTo: new Date(now.getTime() + plan.validityDays * 86400_000),
      companyName: companyName?.trim() || null,
      status: 'active',
    };
  }
}

export class SingleVisitFactory extends MembershipFactory {
  protected createPlan(): MembershipPlan {
    return {
      type: 'single',
      title: 'Разовий',
      description: 'Одне відвідування секції протягом 14 днів',
      price: 250,
      visits: 1,
      validityDays: 14,
      covers: ['section'],
    };
  }
}

export class MonthlyFactory extends MembershipFactory {
  protected createPlan(): MembershipPlan {
    return {
      type: 'monthly',
      title: 'Місячний',
      description: 'Безлімітні відвідування секцій 30 днів',
      price: 1400,
      visits: null,
      validityDays: 30,
      covers: ['section'],
    };
  }
}

export class CorporateFactory extends MembershipFactory {
  protected createPlan(): MembershipPlan {
    return {
      type: 'corporate',
      title: 'Корпоративний',
      description: '20 відвідувань секцій або оренди залу на 90 днів',
      price: 6000,
      visits: 20,
      validityDays: 90,
      covers: ['section', 'hall'],
    };
  }

  protected validate(companyName?: string) {
    if (!companyName?.trim()) {
      throw new BadRequestException('Вкажіть назву компанії');
    }
  }
}

export const MEMBERSHIP_FACTORIES: Record<MembershipType, MembershipFactory> = {
  single: new SingleVisitFactory(),
  monthly: new MonthlyFactory(),
  corporate: new CorporateFactory(),
};
