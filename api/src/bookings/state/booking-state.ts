import { BadRequestException } from '@nestjs/common';
import type { Booking, BookingStatus } from '../booking.entity';

export type BookingAction = 'pay' | 'cancel' | 'complete';

const CANCEL_DEADLINE_MS = 2 * 3600_000;

// State: allowed transitions depend on current status
export abstract class BookingState {
  abstract readonly status: BookingStatus;

  pay(_b: Booking, _now: Date): BookingState {
    throw this.denied('оплатити');
  }

  cancel(_b: Booking, _now: Date): BookingState {
    throw this.denied('скасувати');
  }

  complete(_b: Booking, _now: Date): BookingState {
    throw this.denied('завершити');
  }

  actions(_b: Booking, _now: Date): BookingAction[] {
    return [];
  }

  protected denied(action: string) {
    return new BadRequestException(`Неможливо ${action} бронювання у статусі "${this.status}"`);
  }
}

class PendingState extends BookingState {
  readonly status = 'pending';

  pay(b: Booking, now: Date) {
    if (b.startsAt <= now) throw new BadRequestException('Час бронювання вже минув');
    b.confirmedAt = now;
    return STATES.confirmed;
  }

  cancel() {
    return STATES.cancelled;
  }

  actions(): BookingAction[] {
    return ['pay', 'cancel'];
  }
}

class ConfirmedState extends BookingState {
  readonly status = 'confirmed';

  cancel(b: Booking, now: Date) {
    if (b.startsAt.getTime() - now.getTime() < CANCEL_DEADLINE_MS) {
      throw new BadRequestException('Скасувати можна не пізніше ніж за 2 години до початку');
    }
    return STATES.cancelled;
  }

  complete(b: Booking, now: Date) {
    if (b.endsAt > now) throw new BadRequestException('Тренування ще не завершилось');
    return STATES.completed;
  }

  actions(b: Booking, now: Date): BookingAction[] {
    return b.startsAt.getTime() - now.getTime() >= CANCEL_DEADLINE_MS ? ['cancel'] : [];
  }
}

class CompletedState extends BookingState {
  readonly status = 'completed';
}

class CancelledState extends BookingState {
  readonly status = 'cancelled';
}

const STATES: Record<BookingStatus, BookingState> = {
  pending: new PendingState(),
  confirmed: new ConfirmedState(),
  completed: new CompletedState(),
  cancelled: new CancelledState(),
};

export class BookingStateMachine {
  static of(b: Booking) {
    return STATES[b.status];
  }

  static apply(b: Booking, action: BookingAction, now = new Date()) {
    const from = STATES[b.status];
    b.status = from[action](b, now).status;
    return b;
  }
}
