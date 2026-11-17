import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { DomainEventPublisher } from '../common/events/event-publisher';
import { Booking } from './booking.entity';
import { BookingFacade } from './booking.facade';

@Injectable()
export class BookingScheduler {
  private readonly logger = new Logger(BookingScheduler.name);

  constructor(
    @InjectRepository(Booking) private readonly bookings: Repository<Booking>,
    private readonly facade: BookingFacade,
    private readonly events: DomainEventPublisher,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async tick() {
    const now = new Date();
    const reminded = await this.sendReminders(now);
    const completed = await this.facade.completeFinished(now);
    const expired = await this.facade.expireUnpaid(now);
    if (reminded || completed || expired) {
      this.logger.log(`reminders=${reminded} completed=${completed} expired=${expired}`);
    }
  }

  async sendReminders(now = new Date()) {
    const upcoming = await this.bookings.find({
      where: {
        status: 'confirmed',
        reminderSent: false,
        startsAt: Between(now, new Date(now.getTime() + 48 * 3600_000)),
      },
    });
    let sent = 0;
    for (const b of upcoming) {
      const hours = b.user.preferences?.remindBeforeHours ?? 24;
      if (b.startsAt.getTime() - now.getTime() > hours * 3600_000) continue;
      await this.bookings.update(b.id, { reminderSent: true });
      await this.events.publish({ type: 'booking.reminder', booking: b });
      sent++;
    }
    return sent;
  }
}
