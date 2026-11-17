import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { Hall } from '../catalog/entities/hall.entity';
import { SectionSession } from '../catalog/entities/section-session.entity';
import { AgeGroup, Level, Section } from '../catalog/entities/section.entity';
import { Sport } from '../catalog/entities/sport.entity';
import { SportsCenter } from '../catalog/entities/sports-center.entity';
import { Trainer } from '../catalog/entities/trainer.entity';
import { kyivToUtc } from '../common/time';
import { Promotion } from '../promotions/promotion.entity';
import { User } from '../users/user.entity';

const isoDay = (d: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv' }).format(d);

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly ds: DataSource,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    if (this.config.get('SEED') === 'false') return;
    if (await this.ds.getRepository(Sport).count()) return;
    await this.seed();
    this.logger.log('Demo data seeded');
  }

  private async seed() {
    const m = this.ds.manager;
    const sports = await m.save(Sport, [
      { name: 'Футбол', slug: 'football' },
      { name: 'Йога', slug: 'yoga' },
      { name: 'Фітнес', slug: 'fitness' },
      { name: 'Плавання', slug: 'swimming', premiumIncluded: true },
      { name: 'Бокс', slug: 'boxing' },
    ]);
    const sport = (slug: string) => sports.find((s) => s.slug === slug)!;

    const [center, sykhiv, podil] = await m.save(SportsCenter, [
      { name: 'Арена Центр', city: 'Львів', address: 'вул. Городоцька, 120', description: 'Флагманський центр з басейном і футбольним манежем' },
      { name: 'Арена Сихів', city: 'Львів', address: 'пр. Червоної Калини, 60', description: 'Зали для йоги, фітнесу та єдиноборств' },
      { name: 'Арена Поділ', city: 'Київ', address: 'вул. Межигірська, 15', description: 'Сучасний центр біля метро' },
    ]);

    const halls = await m.save(Hall, [
      { name: 'Футбольний манеж', center, sport: sport('football'), capacity: 22, pricePerHour: 1200, openHour: 8, closeHour: 23, description: 'Штучне покриття, 40x20 м' },
      { name: 'Басейн 25 м', center, sport: sport('swimming'), capacity: 24, pricePerHour: 900, openHour: 7, closeHour: 22, description: '6 доріжок' },
      { name: 'Фітнес-зал', center, sport: sport('fitness'), capacity: 30, pricePerHour: 600 },
      { name: 'Зал йоги', center: sykhiv, sport: sport('yoga'), capacity: 16, pricePerHour: 450, description: 'Килимки та реквізит включено' },
      { name: 'Ринг', center: sykhiv, sport: sport('boxing'), capacity: 12, pricePerHour: 700 },
      { name: 'Мультизал', center: podil, sport: sport('fitness'), capacity: 25, pricePerHour: 650 },
      { name: 'Міні-поле', center: podil, sport: sport('football'), capacity: 14, pricePerHour: 950 },
    ]);
    const hall = (name: string) => halls.find((h) => h.name === name)!;

    const trainers = await m.save(Trainer, [
      { fullName: 'Андрій Коваль', sport: sport('football'), experienceYears: 9, bio: 'Тренер з футболу, UEFA C' },
      { fullName: 'Олена Мороз', sport: sport('yoga'), experienceYears: 7, bio: 'Хатха та аштанга йога' },
      { fullName: 'Ігор Савчук', sport: sport('fitness'), experienceYears: 6, bio: 'Функціональний тренінг' },
      { fullName: 'Марта Дорош', sport: sport('swimming'), experienceYears: 11, bio: 'Майстер спорту з плавання' },
      { fullName: 'Тарас Бойко', sport: sport('boxing'), experienceYears: 8, bio: 'КМС з боксу' },
      { fullName: 'Наталія Грищук', sport: sport('fitness'), experienceYears: 4, bio: 'Пілатес, стретчинг' },
    ] as Partial<Trainer>[]);
    const trainer = (name: string) => trainers.find((t) => t.fullName === name)!;

    const def: [string, string, string, string, Level, AgeGroup, number, number, number[], number][] = [
      ['Футбол для дітей', 'football', 'Футбольний манеж', 'Андрій Коваль', 'beginner', 'kids', 16, 180, [1, 3, 5], 16],
      ['Футбол аматори', 'football', 'Міні-поле', 'Андрій Коваль', 'intermediate', 'adults', 14, 250, [2, 4], 20],
      ['Хатха-йога ранок', 'yoga', 'Зал йоги', 'Олена Мороз', 'beginner', 'adults', 14, 220, [1, 3, 5], 8],
      ['Йога 55+', 'yoga', 'Зал йоги', 'Олена Мороз', 'beginner', 'seniors', 10, 160, [2, 4], 11],
      ['Аштанга', 'yoga', 'Зал йоги', 'Олена Мороз', 'advanced', 'adults', 12, 280, [6], 10],
      ['Функціональний тренінг', 'fitness', 'Фітнес-зал', 'Ігор Савчук', 'intermediate', 'adults', 20, 200, [1, 2, 4], 19],
      ['Пілатес', 'fitness', 'Мультизал', 'Наталія Грищук', 'beginner', 'adults', 18, 210, [3, 6], 12],
      ['Плавання для дітей', 'swimming', 'Басейн 25 м', 'Марта Дорош', 'beginner', 'kids', 12, 230, [2, 4, 6], 15],
      ['Плавання: техніка кролю', 'swimming', 'Басейн 25 м', 'Марта Дорош', 'intermediate', 'adults', 12, 260, [1, 3], 7],
      ['Бокс для підлітків', 'boxing', 'Ринг', 'Тарас Бойко', 'beginner', 'teens', 12, 190, [1, 3, 5], 17],
      ['Бокс спаринги', 'boxing', 'Ринг', 'Тарас Бойко', 'advanced', 'adults', 10, 300, [2, 4], 19],
    ];
    const sections = await m.save(
      Section,
      def.map(([name, s, h, t, level, ageGroup, capacity, pricePerVisit]) => ({
        name,
        description: `${name}. Заняття у групі до ${capacity} осіб.`,
        sport: sport(s),
        hall: hall(h),
        trainer: trainer(t),
        level,
        ageGroup,
        capacity,
        pricePerVisit,
      })),
    );

    const sessions: Partial<SectionSession>[] = [];
    const now = new Date();
    for (let d = 0; d < 21; d++) {
      const date = new Date(now.getTime() + d * 86400_000);
      const day = isoDay(date);
      const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
      def.forEach(([, , , , , , , , days, hour], i) => {
        if (!days.includes(weekday)) return;
        const startsAt = kyivToUtc(day, hour);
        if (startsAt > now) sessions.push({ section: sections[i], startsAt, durationMin: 60 });
      });
    }
    await m.save(SectionSession, sessions);

    const hash = (p: string) => bcrypt.hash(p, 10);
    await m.save(User, [
      { email: 'admin@sport.local', fullName: 'Адміністратор', role: 'admin', passwordHash: await hash('admin123') },
      { email: 'user@sport.local', fullName: 'Іван Петренко', phone: '+380671112233', passwordHash: await hash('user123'), bonusPoints: 120, preferences: { remindBeforeHours: 24, promoNotifications: true } },
      { email: 'premium@sport.local', fullName: 'Оксана Левченко', loyaltyTier: 'premium', passwordHash: await hash('premium123'), bonusPoints: 300, preferences: { remindBeforeHours: 24, promoNotifications: true } },
    ] as Partial<User>[]);

    await m.save(Promotion, {
      title: 'Тиждень плавання',
      description: 'Знижка 20% на перше заняття у басейні для нових клієнтів.',
      validTo: new Date(now.getTime() + 14 * 86400_000),
    });
  }
}
