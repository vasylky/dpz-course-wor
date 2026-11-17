import type { Booking } from '../../bookings/booking.entity';
import type { Section } from '../../catalog/entities/section.entity';
import { kyivDateTime } from '../../common/time';
import type { Membership } from '../../memberships/membership.entity';
import type { Promotion } from '../../promotions/promotion.entity';
import type { User } from '../../users/user.entity';

export interface RenderedNotification {
  type: string;
  title: string;
  body: string;
}

// Template Method: fixed message skeleton, steps overridden per type
export abstract class NotificationTemplate<T> {
  protected abstract readonly type: string;

  render(data: T, recipient: User): RenderedNotification {
    return {
      type: this.type,
      title: this.title(data),
      body: [this.greeting(recipient), this.content(data), this.footer(data)]
        .filter(Boolean)
        .join('\n'),
    };
  }

  protected greeting(recipient: User) {
    return `${recipient.fullName}, вітаємо!`;
  }

  protected abstract title(data: T): string;
  protected abstract content(data: T): string;

  protected footer(_data: T) {
    return '';
  }
}

export const describeBooking = (b: Booking) => {
  const what = b.kind === 'section' ? `секція "${b.session?.section.name}"` : `зал "${b.hall?.name}"`;
  return `${what}, ${kyivDateTime(b.startsAt)}`;
};

export class BookingCreatedTemplate extends NotificationTemplate<Booking> {
  protected readonly type = 'booking';
  protected title(b: Booking) {
    return `Бронювання #${b.id} створено`;
  }
  protected content(b: Booking) {
    return `${describeBooking(b)}. До сплати: ${b.finalPrice} грн.`;
  }
  protected footer() {
    return 'Неоплачене бронювання скасовується через 30 хвилин.';
  }
}

export class BookingConfirmedTemplate extends NotificationTemplate<Booking> {
  protected readonly type = 'booking';
  protected title(b: Booking) {
    return `Бронювання #${b.id} підтверджено`;
  }
  protected content(b: Booking) {
    return `${describeBooking(b)}. Сплачено: ${b.finalPrice} грн.`;
  }
}

export class BookingCancelledTemplate extends NotificationTemplate<{ booking: Booking; refunded: boolean }> {
  protected readonly type = 'booking';
  protected title({ booking }: { booking: Booking }) {
    return `Бронювання #${booking.id} скасовано`;
  }
  protected content({ booking }: { booking: Booking }) {
    return describeBooking(booking);
  }
  protected footer({ booking, refunded }: { booking: Booking; refunded: boolean }) {
    return refunded ? `Кошти ${booking.finalPrice} грн повернуто на картку.` : '';
  }
}

export class BookingReminderTemplate extends NotificationTemplate<Booking> {
  protected readonly type = 'reminder';
  protected title() {
    return 'Нагадування про тренування';
  }
  protected content(b: Booking) {
    return `Незабаром: ${describeBooking(b)}.`;
  }
  protected footer() {
    return 'Візьміть зручний одяг і воду.';
  }
}

export class BonusAccruedTemplate extends NotificationTemplate<{ points: number; total: number }> {
  protected readonly type = 'bonus';
  protected title({ points }: { points: number }) {
    return `Нараховано ${points} бонусних балів`;
  }
  protected content({ total }: { total: number }) {
    return `Баланс бонусів: ${total}. Бонусами можна оплатити до 50% бронювання.`;
  }
}

export class MembershipPurchasedTemplate extends NotificationTemplate<Membership> {
  protected readonly type = 'membership';
  protected title(m: Membership) {
    return `Абонемент "${m.title}" активовано`;
  }
  protected content(m: Membership) {
    const visits = m.visitsTotal === null ? 'безлімітно' : `${m.visitsTotal} відвідувань`;
    return `${visits}, діє до ${kyivDateTime(m.validTo)}.`;
  }
}

export class LoyaltyUpgradedTemplate extends NotificationTemplate<User> {
  protected readonly type = 'bonus';
  protected title() {
    return 'Картку лояльності оновлено';
  }
  protected content(u: User) {
    return `Тепер у вас картка рівня "${u.loyaltyTier}".`;
  }
}

export class NewSectionTemplate extends NotificationTemplate<Section> {
  protected readonly type = 'news';
  protected title(s: Section) {
    return `Нова секція: ${s.name}`;
  }
  protected content(s: Section) {
    return `${s.sport.name}, ${s.hall.center.name}. Ціна від ${s.pricePerVisit} грн за заняття.`;
  }
}

export class PromotionTemplate extends NotificationTemplate<Promotion> {
  protected readonly type = 'promo';
  protected title(p: Promotion) {
    return `Акція: ${p.title}`;
  }
  protected content(p: Promotion) {
    return p.description;
  }
  protected footer(p: Promotion) {
    return p.validTo ? `Діє до ${kyivDateTime(p.validTo)}.` : '';
  }
}
