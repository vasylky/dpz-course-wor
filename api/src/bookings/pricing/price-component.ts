import type { Sport } from '../../catalog/entities/sport.entity';
import { round2 } from '../../common/numeric.transformer';
import { kyivHour } from '../../common/time';
import type { LoyaltyStrategy } from '../../loyalty/strategies/loyalty-strategy';
import type { Membership } from '../../memberships/membership.entity';

export interface PriceLine {
  label: string;
  amount: number;
}

export interface PricingContext {
  kind: 'hall' | 'section';
  basePrice: number;
  startsAt: Date;
  sport: Sport | null;
  loyalty: LoyaltyStrategy;
  membership: Membership | null;
  availableBonus: number;
  useBonus: boolean;
}

export interface PriceResult {
  total: number;
  lines: PriceLine[];
  bonusSpent: number;
}

export interface PriceComponent {
  calculate(ctx: PricingContext): PriceResult;
}

export class BasePrice implements PriceComponent {
  calculate(ctx: PricingContext): PriceResult {
    return {
      total: ctx.basePrice,
      lines: [{ label: 'Базова вартість', amount: ctx.basePrice }],
      bonusSpent: 0,
    };
  }
}

// Decorator: each layer adjusts the wrapped price
export abstract class PriceDecorator implements PriceComponent {
  constructor(private readonly inner: PriceComponent) {}

  calculate(ctx: PricingContext): PriceResult {
    return this.apply(this.inner.calculate(ctx), ctx);
  }

  protected abstract apply(r: PriceResult, ctx: PricingContext): PriceResult;

  protected adjust(r: PriceResult, label: string, delta: number): PriceResult {
    if (delta === 0) return r;
    const amount = round2(delta);
    return {
      ...r,
      total: Math.max(0, round2(r.total + amount)),
      lines: [...r.lines, { label, amount }],
    };
  }
}

export class PeakHourSurcharge extends PriceDecorator {
  protected apply(r: PriceResult, ctx: PricingContext) {
    const hour = kyivHour(ctx.startsAt);
    if (ctx.kind !== 'hall' || hour < 18) return r;
    return this.adjust(r, 'Вечірній час (+20%)', r.total * 0.2);
  }
}

export class MembershipCoverage extends PriceDecorator {
  protected apply(r: PriceResult, ctx: PricingContext) {
    if (!ctx.membership) return r;
    return this.adjust(r, `Абонемент: ${ctx.membership.title}`, -r.total);
  }
}

export class LoyaltyDiscount extends PriceDecorator {
  protected apply(r: PriceResult, ctx: PricingContext) {
    if (r.total === 0) return r;
    const { loyalty } = ctx;
    if (loyalty.isFree(ctx)) {
      return this.adjust(r, `Картка ${loyalty.title}: безкоштовно`, -r.total);
    }
    const pct = loyalty.discountPercent(ctx);
    if (!pct) return r;
    return this.adjust(
      r,
      `Картка ${loyalty.title} (-${pct}%)`,
      (-r.total * pct) / 100,
    );
  }
}

export class BonusRedemption extends PriceDecorator {
  protected apply(r: PriceResult, ctx: PricingContext) {
    if (!ctx.useBonus || r.total === 0) return r;
    const spend = Math.min(ctx.availableBonus, Math.floor(r.total / 2));
    if (spend <= 0) return r;
    return {
      ...this.adjust(r, `Бонусні бали (${spend})`, -spend),
      bonusSpent: spend,
    };
  }
}

export const buildPriceCalculator = (): PriceComponent =>
  new BonusRedemption(
    new LoyaltyDiscount(
      new MembershipCoverage(new PeakHourSurcharge(new BasePrice())),
    ),
  );
