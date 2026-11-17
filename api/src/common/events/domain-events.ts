import type { Booking } from '../../bookings/booking.entity';
import type { Section } from '../../catalog/entities/section.entity';
import type { Membership } from '../../memberships/membership.entity';
import type { Promotion } from '../../promotions/promotion.entity';
import type { User } from '../../users/user.entity';

export type DomainEvent =
  | { type: 'booking.created'; booking: Booking }
  | { type: 'booking.confirmed'; booking: Booking }
  | { type: 'booking.cancelled'; booking: Booking; refunded: boolean }
  | { type: 'booking.completed'; booking: Booking }
  | { type: 'booking.reminder'; booking: Booking }
  | { type: 'bonus.accrued'; user: User; points: number; total: number }
  | { type: 'membership.purchased'; membership: Membership; user: User }
  | { type: 'loyalty.upgraded'; user: User }
  | { type: 'section.created'; section: Section }
  | { type: 'promotion.created'; promotion: Promotion };

export type DomainEventType = DomainEvent['type'];

export type EventOf<T extends DomainEventType> = Extract<DomainEvent, { type: T }>;
