import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { Booking } from '../bookings/booking.entity';
import { Hall } from '../catalog/entities/hall.entity';
import { SectionSession } from '../catalog/entities/section-session.entity';
import { Section } from '../catalog/entities/section.entity';
import { Sport } from '../catalog/entities/sport.entity';
import { SportsCenter } from '../catalog/entities/sports-center.entity';
import { Trainer } from '../catalog/entities/trainer.entity';
import { DomainEventPublisher } from '../common/events/event-publisher';
import { Payment } from '../payments/payment.entity';
import { Promotion } from '../promotions/promotion.entity';
import { User } from '../users/user.entity';
import {
  AdminUserDto,
  CenterDto,
  HallDto,
  PromotionDto,
  SectionDto,
  SessionDto,
  SportDto,
  TrainerDto,
} from './admin.dto';

const ref = (id?: number | null) => (id ? { id } : null);

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Sport) readonly sports: Repository<Sport>,
    @InjectRepository(SportsCenter) readonly centers: Repository<SportsCenter>,
    @InjectRepository(Hall) readonly halls: Repository<Hall>,
    @InjectRepository(Trainer) readonly trainers: Repository<Trainer>,
    @InjectRepository(Section) readonly sections: Repository<Section>,
    @InjectRepository(SectionSession) readonly sessions: Repository<SectionSession>,
    @InjectRepository(Promotion) readonly promotions: Repository<Promotion>,
    @InjectRepository(User) readonly users: Repository<User>,
    @InjectRepository(Booking) private readonly bookings: Repository<Booking>,
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
    private readonly events: DomainEventPublisher,
  ) {}

  async upsert<T extends ObjectLiteral>(repo: Repository<T>, id: number | null, data: Partial<T>): Promise<T> {
    if (id !== null) {
      const existing = await repo.findOneBy({ id } as never);
      if (!existing) throw new NotFoundException();
      return repo.save(repo.merge(existing, data as never));
    }
    return repo.save(repo.create(data as never) as unknown as T);
  }

  async remove<T extends ObjectLiteral>(repo: Repository<T>, id: number) {
    const res = await repo.delete(id);
    if (!res.affected) throw new NotFoundException();
    return { deleted: id };
  }

  saveSport(dto: SportDto, id: number | null = null) {
    return this.upsert(this.sports, id, dto);
  }

  saveCenter(dto: CenterDto, id: number | null = null) {
    return this.upsert(this.centers, id, dto);
  }

  saveHall({ centerId, sportId, ...dto }: HallDto, id: number | null = null) {
    if ((dto.openHour ?? 8) >= (dto.closeHour ?? 22)) {
      throw new BadRequestException('Година відкриття має бути меншою за годину закриття');
    }
    return this.upsert(this.halls, id, {
      ...dto,
      center: { id: centerId } as SportsCenter,
      sport: ref(sportId) as Sport | null,
    });
  }

  saveTrainer({ sportId, ...dto }: TrainerDto, id: number | null = null) {
    return this.upsert(this.trainers, id, { ...dto, sport: ref(sportId) as Sport | null });
  }

  async saveSection({ sportId, hallId, trainerId, ...dto }: SectionDto, id: number | null = null) {
    const saved: Section = await this.upsert<Section>(this.sections, id, {
      ...dto,
      sport: { id: sportId } as Sport,
      hall: { id: hallId } as Hall,
      trainer: ref(trainerId) as Trainer | null,
    });
    const section = await this.sections.findOneByOrFail({ id: saved.id });
    if (id === null) await this.events.publish({ type: 'section.created', section });
    return section;
  }

  listSessions(sectionId: number) {
    return this.sessions.find({ where: { section: { id: sectionId } }, order: { startsAt: 'ASC' } });
  }

  async createSessions(dto: SessionDto) {
    await this.sections.findOneByOrFail({ id: dto.sectionId });
    const start = new Date(dto.startsAt);
    const items = Array.from({ length: dto.repeatWeeks ?? 1 }, (_, i) =>
      this.sessions.create({
        section: { id: dto.sectionId },
        startsAt: new Date(start.getTime() + i * 7 * 86400_000),
        durationMin: dto.durationMin ?? 60,
      }),
    );
    return this.sessions.save(items);
  }

  async createPromotion(dto: PromotionDto) {
    const promotion = await this.promotions.save(
      this.promotions.create({ ...dto, validTo: dto.validTo ? new Date(dto.validTo) : null }),
    );
    await this.events.publish({ type: 'promotion.created', promotion });
    return promotion;
  }

  listUsers() {
    return this.users.find({ order: { createdAt: 'DESC' } });
  }

  updateUser(id: number, dto: AdminUserDto) {
    return this.upsert(this.users, id, dto);
  }

  async stats() {
    const [byStatus, revenue, top, byTier, users] = await Promise.all([
      this.bookings
        .createQueryBuilder('b')
        .select('b.status', 'status')
        .addSelect('COUNT(*)::int', 'count')
        .groupBy('b.status')
        .getRawMany<{ status: string; count: number }>(),
      this.payments
        .createQueryBuilder('p')
        .select('p.purpose', 'purpose')
        .addSelect('COALESCE(SUM(p.amount),0)::float', 'amount')
        .where("p.status = 'succeeded'")
        .groupBy('p.purpose')
        .getRawMany<{ purpose: string; amount: number }>(),
      this.bookings
        .createQueryBuilder('b')
        .innerJoin('b.session', 'ss')
        .innerJoin('ss.section', 's')
        .select('s.name', 'name')
        .addSelect('COUNT(*)::int', 'count')
        .where("b.status IN ('confirmed','completed')")
        .groupBy('s.name')
        .orderBy('count', 'DESC')
        .limit(5)
        .getRawMany<{ name: string; count: number }>(),
      this.users
        .createQueryBuilder('u')
        .select('u.loyaltyTier', 'tier')
        .addSelect('COUNT(*)::int', 'count')
        .where("u.role = 'client'")
        .groupBy('u.loyaltyTier')
        .getRawMany<{ tier: string; count: number }>(),
      this.users.countBy({ role: 'client' }),
    ]);
    return { byStatus, revenue, topSections: top, byTier, clients: users };
  }
}
