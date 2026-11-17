import type { Sport } from '../../catalog/entities/sport.entity';
import { LOYALTY_STRATEGIES } from '../../loyalty/strategies/loyalty-strategy';
import type { Membership } from '../../memberships/membership.entity';
import { buildPriceCalculator, PricingContext } from './price-component';

const pool = { id: 1, name: 'Плавання', slug: 'swimming', premiumIncluded: true } as Sport;
const yoga = { id: 2, name: 'Йога', slug: 'yoga', premiumIncluded: false } as Sport;
const tuesday10 = new Date('2026-11-10T08:00:00Z');
const tuesday19 = new Date('2026-11-10T17:00:00Z');
const saturday10 = new Date('2026-11-14T08:00:00Z');

const ctx = (patch: Partial<PricingContext> = {}): PricingContext => ({
  kind: 'section',
  basePrice: 200,
  startsAt: tuesday10,
  sport: yoga,
  loyalty: LOYALTY_STRATEGIES.standard,
  membership: null,
  availableBonus: 0,
  useBonus: false,
  ...patch,
});

describe('price decorators', () => {
  const calc = buildPriceCalculator();

  it('standard tier pays base price', () => {
    expect(calc.calculate(ctx()).total).toBe(200);
  });

  it('evening surcharge applies to hall rental only', () => {
    expect(calc.calculate(ctx({ kind: 'hall', startsAt: tuesday19 })).total).toBe(240);
    expect(calc.calculate(ctx({ kind: 'section', startsAt: tuesday19 })).total).toBe(200);
  });

  it('premium gets 10% off and free pool', () => {
    expect(calc.calculate(ctx({ loyalty: LOYALTY_STRATEGIES.premium })).total).toBe(180);
    expect(calc.calculate(ctx({ loyalty: LOYALTY_STRATEGIES.premium, sport: pool })).total).toBe(0);
  });

  it('corporate discount depends on weekday', () => {
    expect(calc.calculate(ctx({ loyalty: LOYALTY_STRATEGIES.corporate })).total).toBe(170);
    expect(calc.calculate(ctx({ loyalty: LOYALTY_STRATEGIES.corporate, startsAt: saturday10 })).total).toBe(190);
  });

  it('membership covers the whole price', () => {
    const r = calc.calculate(ctx({ membership: { title: 'Місячний' } as Membership, useBonus: true, availableBonus: 50 }));
    expect(r.total).toBe(0);
    expect(r.bonusSpent).toBe(0);
  });

  it('bonus pays at most half', () => {
    const r = calc.calculate(ctx({ useBonus: true, availableBonus: 500 }));
    expect(r.bonusSpent).toBe(100);
    expect(r.total).toBe(100);
  });
});

describe('loyalty strategies', () => {
  it('awards bonus points by tier', () => {
    expect(LOYALTY_STRATEGIES.standard.bonusPoints(220)).toBe(11);
    expect(LOYALTY_STRATEGIES.standard.bonusPoints(0)).toBe(5);
    expect(LOYALTY_STRATEGIES.premium.bonusPoints(300)).toBe(30);
  });
});
