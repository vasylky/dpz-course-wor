import { Repository, SelectQueryBuilder } from 'typeorm';
import { AgeGroup, Level, Section } from './entities/section.entity';

export interface SectionFilters {
  sport?: string;
  level?: Level;
  ageGroup?: AgeGroup;
  centerId?: number;
  trainerId?: number;
  q?: string;
  includeInactive?: boolean;
}

// Builder: step-by-step catalog query composition
export class SectionQueryBuilder {
  private readonly qb: SelectQueryBuilder<Section>;

  constructor(repo: Repository<Section>) {
    this.qb = repo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.sport', 'sport')
      .leftJoinAndSelect('s.hall', 'hall')
      .leftJoinAndSelect('hall.center', 'center')
      .leftJoinAndSelect('s.trainer', 'trainer')
      .where('1 = 1');
  }

  onlyActive(active = true) {
    if (active) this.qb.andWhere('s.active = true');
    return this;
  }

  sport(slug?: string) {
    if (slug) this.qb.andWhere('sport.slug = :slug', { slug });
    return this;
  }

  level(level?: Level) {
    if (level) this.qb.andWhere('s.level = :level', { level });
    return this;
  }

  ageGroup(ageGroup?: AgeGroup) {
    if (ageGroup) this.qb.andWhere('s.ageGroup = :ageGroup', { ageGroup });
    return this;
  }

  center(id?: number) {
    if (id) this.qb.andWhere('center.id = :centerId', { centerId: id });
    return this;
  }

  trainer(id?: number) {
    if (id) this.qb.andWhere('trainer.id = :trainerId', { trainerId: id });
    return this;
  }

  search(q?: string) {
    if (q?.trim()) {
      this.qb.andWhere('(s.name ILIKE :q OR s.description ILIKE :q)', { q: `%${q.trim()}%` });
    }
    return this;
  }

  build() {
    return this.qb.orderBy('sport.name').addOrderBy('s.name');
  }

  static fromFilters(repo: Repository<Section>, f: SectionFilters) {
    return new SectionQueryBuilder(repo)
      .onlyActive(!f.includeInactive)
      .sport(f.sport)
      .level(f.level)
      .ageGroup(f.ageGroup)
      .center(f.centerId)
      .trainer(f.trainerId)
      .search(f.q)
      .build();
  }
}
