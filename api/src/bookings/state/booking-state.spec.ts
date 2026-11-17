import { BadRequestException } from '@nestjs/common';
import type { Booking } from '../booking.entity';
import { BookingStateMachine } from './booking-state';

const booking = (status: Booking['status'], startsInH: number) => {
  const now = Date.now();
  return {
    status,
    startsAt: new Date(now + startsInH * 3600_000),
    endsAt: new Date(now + (startsInH + 1) * 3600_000),
    confirmedAt: null,
  } as Booking;
};

describe('booking state', () => {
  it('pending -> confirmed -> cancelled', () => {
    const b = booking('pending', 24);
    expect(BookingStateMachine.of(b).actions(b, new Date())).toEqual(['pay', 'cancel']);
    BookingStateMachine.apply(b, 'pay');
    expect(b.status).toBe('confirmed');
    expect(b.confirmedAt).toBeInstanceOf(Date);
    BookingStateMachine.apply(b, 'cancel');
    expect(b.status).toBe('cancelled');
  });

  it('confirmed booking cannot be cancelled less than 2h before start', () => {
    const b = booking('confirmed', 1);
    expect(BookingStateMachine.of(b).actions(b, new Date())).toEqual([]);
    expect(() => BookingStateMachine.apply(b, 'cancel')).toThrow(BadRequestException);
  });

  it('terminal states reject transitions', () => {
    expect(() => BookingStateMachine.apply(booking('cancelled', 5), 'pay')).toThrow(BadRequestException);
    expect(() => BookingStateMachine.apply(booking('completed', -5), 'cancel')).toThrow(BadRequestException);
  });

  it('completes only after end', () => {
    expect(() => BookingStateMachine.apply(booking('confirmed', 3), 'complete')).toThrow(BadRequestException);
    const done = BookingStateMachine.apply(booking('confirmed', -3), 'complete');
    expect(done.status).toBe('completed');
  });
});
