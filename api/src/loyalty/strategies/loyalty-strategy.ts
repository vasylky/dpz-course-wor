import type { Sport } from '../../catalog/entities/sport.entity';
import { isWeekend } from '../../common/time';
import type { LoyaltyTier } from '../../users/user.entity';

export interface LoyaltyContext {
  startsAt: Date;
  sport: Sport | null;
}

// Strategy: tier-specific discount and bonus rules
export interface LoyaltyStrategy {
  readonly tier: LoyaltyTier;
  readonly title: string;
  readonly upgradePrice: number;
  discountPercent(ctx: LoyaltyContext): number;
  isFree(ctx: LoyaltyContext): boolean;
  bonusPoints(paidAmount: number): number;
  perks(): string[];
}

export class StandardLoyalty implements LoyaltyStrategy {
  readonly tier = 'standard';
  readonly title = 'Стандартна';
  readonly upgradePrice = 0;
  discountPercent() {
    return 0;
  }
  isFree() {
    return false;
  }
  bonusPoints(paid: number) {
    return Math.max(5, Math.floor(paid * 0.05));
  }
  perks() {
    return ['5% від суми бронювання бонусами', 'Мінімум 5 балів за бронювання'];
  }
}

export class PremiumLoyalty implements LoyaltyStrategy {
  readonly tier = 'premium';
  readonly title = 'Преміум';
  readonly upgradePrice = 900;
  discountPercent() {
    return 10;
  }
  isFree(ctx: LoyaltyContext) {
    return Boolean(ctx.sport?.premiumIncluded);
  }
  bonusPoints(paid: number) {
    return Math.max(10, Math.floor(paid * 0.1));
  }
  perks() {
    return [
      'Знижка 10% на всі бронювання',
      'Безкоштовний доступ до басейну',
      '10% від суми бронювання бонусами',
    ];
  }
}

export class CorporateLoyalty implements LoyaltyStrategy {
  readonly tier = 'corporate';
  readonly title = 'Корпоративна';
  readonly upgradePrice = 2500;
  discountPercent(ctx: LoyaltyContext) {
    return isWeekend(ctx.startsAt) ? 5 : 15;
  }
  isFree() {
    return false;
  }
  bonusPoints(paid: number) {
    return Math.max(5, Math.floor(paid * 0.07));
  }
  perks() {
    return [
      'Знижка 15% у будні, 5% у вихідні',
      '7% від суми бронювання бонусами',
    ];
  }
}

export const LOYALTY_STRATEGIES: Record<LoyaltyTier, LoyaltyStrategy> = {
  standard: new StandardLoyalty(),
  premium: new PremiumLoyalty(),
  corporate: new CorporateLoyalty(),
};
