import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import { CatalogService } from '../catalog/catalog.service';
import { Hall } from '../catalog/entities/hall.entity';
import { SectionSession } from '../catalog/entities/section-session.entity';
import { Sport } from '../catalog/entities/sport.entity';
import { DomainEventPublisher } from '../common/events/event-publisher';
import { kyivToUtc } from '../common/time';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { MembershipsService } from '../memberships/memberships.service';
import { CardDto } from '../payments/payment.dto';
import { PaymentsService } from '../payments/payments.service';
import { User } from '../users/user.entity';
import { CreateBookingDto } from './booking.dto';
import { Booking } from './booking.entity';
import { buildPriceCalculator } from './pricing/price-component';
import { BookingStateMachine } from './state/booking-state';

interface Slot {
  kind: Booking['kind'];
  hall: Hall | null;
  session: SectionSession | null;
  sport: Sport | null;
  startsAt: Date;
  endsAt: Date;
  basePrice: number;
}

// Facade: single entry point over catalog, pricing, memberships, payments, events
@Injectable()
export class BookingFacade {
  private readonly calculator = buildPriceCalculator();

  constructor(
    @InjectRepository(Booking) private readonly bookings: Repository<Booking>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(SectionSession) private readonly sessions: Repository<SectionSession>,
    private readonly catalog: CatalogService,
    private readonly loyalty: LoyaltyService,
    private readonly memberships: MembershipsService,
    private readonly payments: PaymentsService,
    private readonly events: DomainEventPublisher,
  ) {}

  async quote(userId: number, dto: CreateBookingDto) {
    const user = await this.users.findOneByOrFail({ id: userId });
    const slot = await this.resolveSlot(dto, userId);
    const { price, membership } = await this.price(user, slot, dto);
    return { ...price, basePrice: slot.basePrice, startsAt: slot.startsAt, endsAt: slot.endsAt, membership };
  }

  async create(userId: number, dto: CreateBookingDto) {
    const user = await this.users.findOneByOrFail({ id: userId });
    const slot = await this.resolveSlot(dto, userId);
    const { price, membership } = await this.price(user, slot, dto);

    if (price.bonusSpent) {
      await this.users.decrement({ id: userId }, 'bonusPoints', price.bonusSpent);
    }
    if (membership && price.lines.some((l) => l.label.startsWith('Абонемент'))) {
      await this.memberships.consume(membership);
    }

    let booking = await this.bookings.save(
      this.bookings.create({
        user,
        kind: slot.kind,
        hall: slot.hall,
        session: slot.session,
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        basePrice: slot.basePrice,
        finalPrice: price.total,
        priceLines: price.lines,
        bonusSpent: price.bonusSpent,
        membership: price.lines.some((l) => l.label.startsWith('Абонемент')) ? membership : null,
        status: 'pending',
      }),
    );
    await this.events.publish({ type: 'booking.created', booking });

    if (booking.finalPrice === 0) {
      booking = await this.confirm(booking);
    }
    return this.view(await this.findOwned(userId, booking.id));
  }

  async pay(userId: number, bookingId: number, card: CardDto) {
    const booking = await this.findOwned(userId, bookingId);
    BookingStateMachine.of(booking).pay(booking, new Date());
    await this.payments.charge(userId, 'booking', booking.id, booking.finalPrice, card, `Бронювання #${booking.id}`);
    await this.confirm(booking);
    return this.view(await this.findOwned(userId, bookingId));
  }

  async cancel(userId: number, bookingId: number, asAdmin = false) {
    const booking = asAdmin ? await this.find(bookingId) : await this.findOwned(userId, bookingId);
    const wasConfirmed = booking.status === 'confirmed';
    BookingStateMachine.apply(booking, 'cancel');
    await this.bookings.save(booking);
    const refunded = wasConfirmed && booking.finalPrice > 0 ? await this.payments.refund('booking', booking.id) : false;
    if (booking.membership) await this.memberships.restore(booking.membership);
    await this.events.publish({ type: 'booking.cancelled', booking, refunded });
    return this.view(booking);
  }

  async mine(userId: number) {
    const list = await this.bookings.find({
      where: { user: { id: userId } },
      order: { startsAt: 'DESC' },
    });
    return list.map((b) => this.view(b));
  }

  async one(userId: number, id: number) {
    return this.view(await this.findOwned(userId, id));
  }

  async completeFinished(now = new Date()) {
    const due = await this.bookings.find({ where: { status: 'confirmed', endsAt: LessThan(now) } });
    for (const b of due) {
      BookingStateMachine.apply(b, 'complete', now);
      await this.bookings.save(b);
      await this.events.publish({ type: 'booking.completed', booking: b });
    }
    return due.length;
  }

  async expireUnpaid(now = new Date()) {
    const stale = await this.bookings.find({
      where: { status: 'pending', createdAt: LessThan(new Date(now.getTime() - 30 * 60_000)) },
    });
    for (const b of stale) await this.cancel(b.user.id, b.id, true);
    return stale.length;
  }

  view(b: Booking) {
    return { ...b, actions: BookingStateMachine.of(b).actions(b, new Date()) };
  }

  private async confirm(booking: Booking) {
    BookingStateMachine.apply(booking, 'pay');
    const saved = await this.bookings.save(booking);
    await this.events.publish({ type: 'booking.confirmed', booking: saved });
    return saved;
  }

  private async price(user: User, slot: Slot, dto: CreateBookingDto) {
    const membership =
      dto.useMembership === false ? null : await this.memberships.findApplicable(user.id, slot.kind, slot.startsAt);
    const price = this.calculator.calculate({
      kind: slot.kind,
      basePrice: slot.basePrice,
      startsAt: slot.startsAt,
      sport: slot.sport,
      loyalty: this.loyalty.strategyFor(user.loyaltyTier),
      membership,
      availableBonus: user.bonusPoints,
      useBonus: Boolean(dto.useBonus),
    });
    return { price, membership };
  }

  private async resolveSlot(dto: CreateBookingDto, userId: number): Promise<Slot> {
    return dto.kind === 'section' ? this.sectionSlot(dto.sessionId!, userId) : this.hallSlot(dto);
  }

  private async sectionSlot(sessionId: number, userId: number): Promise<Slot> {
    const session = await this.sessions.findOne({ where: { id: sessionId }, relations: { section: true } });
    if (!session) throw new NotFoundException('Заняття не знайдено');
    const { section } = session;
    if (!section.active) throw new BadRequestException('Секція неактивна');
    if (session.startsAt <= new Date()) throw new BadRequestException('Заняття вже розпочалось');
    const taken = (await this.catalog.takenSeats([session.id])).get(session.id) ?? 0;
    if (taken >= section.capacity) throw new ConflictException('Немає вільних місць');
    const duplicate = await this.bookings.existsBy({
      user: { id: userId },
      session: { id: session.id },
      status: In(['pending', 'confirmed']),
    });
    if (duplicate) throw new ConflictException('Ви вже записані на це заняття');
    return {
      kind: 'section',
      hall: null,
      session,
      sport: section.sport,
      startsAt: session.startsAt,
      endsAt: new Date(session.startsAt.getTime() + session.durationMin * 60_000),
      basePrice: section.pricePerVisit,
    };
  }

  private async hallSlot(dto: CreateBookingDto): Promise<Slot> {
    const hall = await this.catalog.hall(dto.hallId!);
    const hours = dto.hours ?? 1;
    const hour = dto.hour!;
    if (hour < hall.openHour || hour + hours > hall.closeHour) {
      throw new BadRequestException(`Зал працює з ${hall.openHour}:00 до ${hall.closeHour}:00`);
    }
    const startsAt = kyivToUtc(dto.date!, hour);
    const endsAt = new Date(startsAt.getTime() + hours * 3600_000);
    if (startsAt <= new Date()) throw new BadRequestException('Оберіть час у майбутньому');
    const busy = await this.catalog.busyIntervals(hall.id, startsAt, endsAt);
    if (busy.length) throw new ConflictException('Зал зайнятий у вибраний час');
    return {
      kind: 'hall',
      hall,
      session: null,
      sport: hall.sport,
      startsAt,
      endsAt,
      basePrice: hall.pricePerHour * hours,
    };
  }

  private async find(id: number) {
    const b = await this.bookings.findOneBy({ id });
    if (!b) throw new NotFoundException('Бронювання не знайдено');
    return b;
  }

  private async findOwned(userId: number, id: number) {
    const b = await this.find(id);
    if (b.user.id !== userId) throw new ForbiddenException();
    return b;
  }

  listAll(status?: Booking['status']) {
    return this.bookings.find({
      where: status ? { status } : {},
      order: { startsAt: 'DESC' },
      take: 200,
    });
  }
}
