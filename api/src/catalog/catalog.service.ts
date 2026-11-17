import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, MoreThan, Repository } from 'typeorm';
import { Booking } from '../bookings/booking.entity';
import { kyivToUtc } from '../common/time';
import { buildCatalogTree } from './composite/catalog-node';
import { Hall } from './entities/hall.entity';
import { SectionSession } from './entities/section-session.entity';
import { Section } from './entities/section.entity';
import { Sport } from './entities/sport.entity';
import { SportsCenter } from './entities/sports-center.entity';
import { Trainer } from './entities/trainer.entity';
import { SectionFilters, SectionQueryBuilder } from './section-query.builder';

const ACTIVE = In(['pending', 'confirmed']);

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Sport) private readonly sports: Repository<Sport>,
    @InjectRepository(SportsCenter) private readonly centers: Repository<SportsCenter>,
    @InjectRepository(Hall) private readonly halls: Repository<Hall>,
    @InjectRepository(Trainer) private readonly trainers: Repository<Trainer>,
    @InjectRepository(Section) private readonly sections: Repository<Section>,
    @InjectRepository(SectionSession) private readonly sessions: Repository<SectionSession>,
    @InjectRepository(Booking) private readonly bookings: Repository<Booking>,
  ) {}

  listSports() {
    return this.sports.find({ order: { name: 'ASC' } });
  }

  listCenters() {
    return this.centers.find({ order: { name: 'ASC' } });
  }

  listTrainers() {
    return this.trainers.find({ order: { fullName: 'ASC' } });
  }

  listHalls(sport?: string, centerId?: number) {
    return this.halls.find({
      where: {
        ...(sport ? { sport: { slug: sport } } : {}),
        ...(centerId ? { center: { id: centerId } } : {}),
      },
      order: { name: 'ASC' },
    });
  }

  listSections(filters: SectionFilters) {
    return SectionQueryBuilder.fromFilters(this.sections, filters).getMany();
  }

  async section(id: number) {
    const section = await this.sections.findOneBy({ id });
    if (!section) throw new NotFoundException('Секцію не знайдено');
    const sessions = await this.sessions.find({
      where: { section: { id }, startsAt: MoreThan(new Date()) },
      order: { startsAt: 'ASC' },
      take: 30,
    });
    const taken = await this.takenSeats(sessions.map((s) => s.id));
    return {
      ...section,
      sessions: sessions.map((s) => ({
        ...s,
        freeSeats: section.capacity - (taken.get(s.id) ?? 0),
      })),
    };
  }

  async takenSeats(sessionIds: number[]) {
    if (!sessionIds.length) return new Map<number, number>();
    const rows = await this.bookings
      .createQueryBuilder('b')
      .select('b.sessionId', 'id')
      .addSelect('COUNT(*)', 'cnt')
      .where('b.sessionId IN (:...ids)', { ids: sessionIds })
      .andWhere("b.status IN ('pending','confirmed')")
      .groupBy('b.sessionId')
      .getRawMany<{ id: number; cnt: string }>();
    return new Map(rows.map((r) => [Number(r.id), Number(r.cnt)]));
  }

  async hall(id: number) {
    const hall = await this.halls.findOneBy({ id });
    if (!hall) throw new NotFoundException('Зал не знайдено');
    return hall;
  }

  async busyIntervals(hallId: number, from: Date, to: Date) {
    const [bookings, sessions] = await Promise.all([
      this.bookings.find({
        where: { hall: { id: hallId }, status: ACTIVE, startsAt: Between(new Date(from.getTime() - 86400_000), to) },
      }),
      this.sessions.find({
        where: { section: { hall: { id: hallId } }, startsAt: Between(new Date(from.getTime() - 86400_000), to) },
      }),
    ]);
    return [
      ...bookings.map((b) => ({ start: b.startsAt, end: b.endsAt })),
      ...sessions.map((s) => ({
        start: s.startsAt,
        end: new Date(s.startsAt.getTime() + s.durationMin * 60_000),
      })),
    ].filter((i) => i.end > from && i.start < to);
  }

  async hallAvailability(id: number, day: string) {
    const hall = await this.hall(id);
    const from = kyivToUtc(day, hall.openHour);
    const to = kyivToUtc(day, hall.closeHour);
    const busy = await this.busyIntervals(id, from, to);
    const now = new Date();
    const slots: { hour: number; free: boolean }[] = [];
    for (let h = hall.openHour; h < hall.closeHour; h++) {
      const start = kyivToUtc(day, h);
      const end = new Date(start.getTime() + 3600_000);
      const free = start > now && !busy.some((b) => b.start < end && b.end > start);
      slots.push({ hour: h, free });
    }
    return { hall, day, slots };
  }

  async structure() {
    const [centers, sections] = await Promise.all([
      this.centers.find({ relations: { halls: true }, order: { name: 'ASC', halls: { name: 'ASC' } } }),
      this.sections.find({ where: { active: true }, order: { name: 'ASC' } }),
    ]);
    return buildCatalogTree(centers, sections).view();
  }
}
