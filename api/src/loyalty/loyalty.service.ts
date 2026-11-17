import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../bookings/booking.entity';
import { DomainEvent } from '../common/events/domain-events';
import { DomainEventListener, DomainEventPublisher } from '../common/events/event-publisher';
import { CardDto } from '../payments/payment.dto';
import { PaymentsService } from '../payments/payments.service';
import { LoyaltyTier, User } from '../users/user.entity';
import { LOYALTY_STRATEGIES, LoyaltyStrategy } from './strategies/loyalty-strategy';

const TIER_RANK: Record<LoyaltyTier, number> = { standard: 0, premium: 1, corporate: 2 };

@Injectable()
export class LoyaltyService implements OnModuleInit, DomainEventListener {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Booking) private readonly bookings: Repository<Booking>,
    private readonly payments: PaymentsService,
    private readonly events: DomainEventPublisher,
  ) {}

  onModuleInit() {
    this.events.subscribe(['booking.confirmed', 'booking.cancelled'], this);
  }

  strategyFor(tier: LoyaltyTier): LoyaltyStrategy {
    return LOYALTY_STRATEGIES[tier];
  }

  cards() {
    return Object.values(LOYALTY_STRATEGIES).map((s) => ({
      tier: s.tier,
      title: s.title,
      price: s.upgradePrice,
      perks: s.perks(),
    }));
  }

  async summary(userId: number) {
    const user = await this.users.findOneByOrFail({ id: userId });
    const s = this.strategyFor(user.loyaltyTier);
    return {
      tier: s.tier,
      title: s.title,
      perks: s.perks(),
      bonusPoints: user.bonusPoints,
      companyName: user.companyName,
    };
  }

  async upgrade(userId: number, tier: LoyaltyTier, card: CardDto, companyName?: string) {
    const user = await this.users.findOneByOrFail({ id: userId });
    if (TIER_RANK[tier] <= TIER_RANK[user.loyaltyTier]) {
      throw new BadRequestException('Ця картка вже активна або нижча за поточну');
    }
    if (tier === 'corporate' && !companyName?.trim()) {
      throw new BadRequestException('Для корпоративної картки вкажіть компанію');
    }
    const s = this.strategyFor(tier);
    await this.payments.charge(userId, 'loyalty_card', userId, s.upgradePrice, card, `Картка ${s.title}`);
    user.loyaltyTier = tier;
    if (tier === 'corporate') user.companyName = companyName!.trim();
    await this.users.save(user);
    await this.events.publish({ type: 'loyalty.upgraded', user });
    return this.summary(userId);
  }

  // Observer: reacts to booking lifecycle
  async handle(event: DomainEvent) {
    if (event.type === 'booking.confirmed') {
      const { booking } = event;
      const points = this.strategyFor(booking.user.loyaltyTier).bonusPoints(booking.finalPrice);
      await this.bookings.update(booking.id, { bonusAwarded: points });
      await this.users.increment({ id: booking.user.id }, 'bonusPoints', points);
      booking.bonusAwarded = points;
      const user = await this.users.findOneByOrFail({ id: booking.user.id });
      await this.events.publish({ type: 'bonus.accrued', user, points, total: user.bonusPoints });
    }
    if (event.type === 'booking.cancelled') {
      const { booking } = event;
      const delta = booking.bonusSpent - booking.bonusAwarded;
      if (delta !== 0) {
        await this.users
          .createQueryBuilder()
          .update()
          .set({ bonusPoints: () => `GREATEST(0, "bonusPoints" + ${delta})` })
          .where('id = :id', { id: booking.user.id })
          .execute();
      }
    }
  }
}
