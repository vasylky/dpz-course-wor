import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThanOrEqual, Repository } from 'typeorm';
import type { BookingKind } from '../bookings/booking.entity';
import { DomainEventPublisher } from '../common/events/event-publisher';
import { CardDto } from '../payments/payment.dto';
import { PaymentsService } from '../payments/payments.service';
import { User } from '../users/user.entity';
import { MEMBERSHIP_FACTORIES } from './factories/membership-factory';
import { Membership, MembershipType } from './membership.entity';

@Injectable()
export class MembershipsService {
  constructor(
    @InjectRepository(Membership) private readonly repo: Repository<Membership>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly payments: PaymentsService,
    private readonly events: DomainEventPublisher,
  ) {}

  plans() {
    return Object.values(MEMBERSHIP_FACTORIES).map((f) => f.plan);
  }

  async mine(userId: number) {
    await this.repo.update(
      { user: { id: userId }, status: 'active', validTo: LessThan(new Date()) },
      { status: 'expired' },
    );
    return this.repo.find({ where: { user: { id: userId } }, order: { createdAt: 'DESC' } });
  }

  async purchase(userId: number, type: MembershipType, card: CardDto, companyName?: string) {
    const factory = MEMBERSHIP_FACTORIES[type];
    const draft = factory.issue(userId, new Date(), companyName);
    await this.payments.charge(userId, 'membership', null, draft.price!, card, `Абонемент ${draft.title}`);
    const membership = await this.repo.save(this.repo.create(draft));
    const user = await this.users.findOneByOrFail({ id: userId });
    await this.events.publish({ type: 'membership.purchased', membership, user });
    return membership;
  }

  async findApplicable(userId: number, kind: BookingKind, at: Date) {
    const active = await this.repo.find({
      where: { user: { id: userId }, status: 'active', validTo: MoreThanOrEqual(at) },
      order: { validTo: 'ASC' },
    });
    return (
      active.find(
        (m) =>
          m.validFrom <= at &&
          MEMBERSHIP_FACTORIES[m.type].plan.covers.includes(kind) &&
          (m.visitsLeft === null || m.visitsLeft > 0),
      ) ?? null
    );
  }

  async consume(m: Membership) {
    if (m.visitsLeft === null) return;
    m.visitsLeft -= 1;
    if (m.visitsLeft <= 0) m.status = 'used_up';
    await this.repo.save(m);
  }

  async restore(m: Membership) {
    if (m.visitsLeft === null) return;
    m.visitsLeft += 1;
    if (m.status === 'used_up') m.status = 'active';
    await this.repo.save(m);
  }
}
