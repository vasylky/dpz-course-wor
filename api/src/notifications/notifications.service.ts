import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DomainEvent } from '../common/events/domain-events';
import { DomainEventListener, DomainEventPublisher } from '../common/events/event-publisher';
import { User } from '../users/user.entity';
import { Notification } from './notification.entity';
import {
  BonusAccruedTemplate,
  BookingCancelledTemplate,
  BookingConfirmedTemplate,
  BookingCreatedTemplate,
  BookingReminderTemplate,
  LoyaltyUpgradedTemplate,
  MembershipPurchasedTemplate,
  NewSectionTemplate,
  PromotionTemplate,
  RenderedNotification,
} from './templates/notification-template';

const t = {
  created: new BookingCreatedTemplate(),
  confirmed: new BookingConfirmedTemplate(),
  cancelled: new BookingCancelledTemplate(),
  reminder: new BookingReminderTemplate(),
  bonus: new BonusAccruedTemplate(),
  membership: new MembershipPurchasedTemplate(),
  loyalty: new LoyaltyUpgradedTemplate(),
  section: new NewSectionTemplate(),
  promo: new PromotionTemplate(),
};

// Observer: turns domain events into user notifications
@Injectable()
export class NotificationsService implements OnModuleInit, DomainEventListener {
  constructor(
    @InjectRepository(Notification) private readonly repo: Repository<Notification>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly events: DomainEventPublisher,
  ) {}

  onModuleInit() {
    this.events.subscribe(
      [
        'booking.created',
        'booking.confirmed',
        'booking.cancelled',
        'booking.reminder',
        'bonus.accrued',
        'membership.purchased',
        'loyalty.upgraded',
        'section.created',
        'promotion.created',
      ],
      this,
    );
  }

  async handle(e: DomainEvent) {
    switch (e.type) {
      case 'booking.created':
        if (e.booking.finalPrice > 0) await this.send(e.booking.user, t.created.render(e.booking, e.booking.user));
        return;
      case 'booking.confirmed':
        return this.send(e.booking.user, t.confirmed.render(e.booking, e.booking.user));
      case 'booking.cancelled':
        return this.send(e.booking.user, t.cancelled.render(e, e.booking.user));
      case 'booking.reminder':
        return this.send(e.booking.user, t.reminder.render(e.booking, e.booking.user));
      case 'bonus.accrued':
        return this.send(e.user, t.bonus.render(e, e.user));
      case 'membership.purchased':
        return this.send(e.user, t.membership.render(e.membership, e.user));
      case 'loyalty.upgraded':
        return this.send(e.user, t.loyalty.render(e.user, e.user));
      case 'section.created': {
        const slug = e.section.sport.slug;
        const users = await this.subscribers();
        const targets = users.filter((u) => !u.preferences?.sports?.length || u.preferences.sports.includes(slug));
        return this.broadcast(targets, (u) => t.section.render(e.section, u));
      }
      case 'promotion.created':
        return this.broadcast(await this.subscribers(), (u) => t.promo.render(e.promotion, u));
    }
  }

  private subscribers() {
    return this.users
      .createQueryBuilder('u')
      .where("u.role = 'client'")
      .andWhere("COALESCE((u.preferences->>'promoNotifications')::boolean, true) = true")
      .getMany();
  }

  private async send(user: User, n: RenderedNotification) {
    await this.repo.save(this.repo.create({ ...n, user: { id: user.id } }));
  }

  private async broadcast(users: User[], render: (u: User) => RenderedNotification) {
    if (!users.length) return;
    await this.repo.insert(users.map((u) => ({ ...render(u), user: { id: u.id } })));
  }

  list(userId: number) {
    return this.repo.find({ where: { user: { id: userId } }, order: { createdAt: 'DESC' }, take: 100 });
  }

  async unread(userId: number) {
    return { count: await this.repo.countBy({ user: { id: userId }, read: false }) };
  }

  async markRead(userId: number, id?: number) {
    await this.repo.update({ user: { id: userId }, ...(id ? { id } : { read: false }) }, { read: true });
    return this.unread(userId);
  }
}
