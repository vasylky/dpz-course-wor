import type { AgeGroup, BookingStatus, Level, Tier } from './api';

export const LEVELS: Record<Level, string> = {
  beginner: 'Початковий',
  intermediate: 'Середній',
  advanced: 'Просунутий',
};

export const AGE_GROUPS: Record<AgeGroup, string> = {
  kids: 'Діти',
  teens: 'Підлітки',
  adults: 'Дорослі',
  seniors: '55+',
};

export const STATUSES: Record<BookingStatus, string> = {
  pending: 'Очікує оплати',
  confirmed: 'Підтверджено',
  completed: 'Завершено',
  cancelled: 'Скасовано',
};

export const TIERS: Record<Tier, string> = {
  standard: 'Стандартна',
  premium: 'Преміум',
  corporate: 'Корпоративна',
};

const TZ = 'Europe/Kyiv';

export const fmtDateTime = (iso: string) =>
  new Intl.DateTimeFormat('uk-UA', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

export const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat('uk-UA', { timeZone: TZ, day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));

export const fmtTime = (iso: string) =>
  new Intl.DateTimeFormat('uk-UA', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

export const money = (v: number) => `${Number(v).toLocaleString('uk-UA', { maximumFractionDigits: 2 })} грн`;

export const kyivToday = (offsetDays = 0) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(Date.now() + offsetDays * 86400_000));

export const describeBooking = (b: { kind: string; hall: { name: string } | null; session: { section?: { name: string } } | null }) =>
  b.kind === 'section' ? `Секція: ${b.session?.section?.name ?? ''}` : `Оренда залу: ${b.hall?.name ?? ''}`;

const SPORT_IMAGES: Record<string, string[]> = {
  football: ['/img/football.jpg'],
  yoga: ['/img/yoga.jpg', '/img/yoga-home.jpg'],
  fitness: ['/img/fitness.jpg', '/img/abs.jpg', '/img/training.jpg', '/img/group.jpg'],
  swimming: ['/img/swimming.jpg'],
  boxing: ['/img/boxing.jpg'],
};

export const sportImage = (slug?: string | null, seed = 0) => {
  const list = (slug && SPORT_IMAGES[slug]) || ['/img/interior.jpg'];
  return list[seed % list.length];
};

const CENTER_IMAGES = ['/img/interior.jpg', '/img/group.jpg', '/img/training.jpg'];
export const centerImage = (id: number) => CENTER_IMAGES[(id - 1) % CENTER_IMAGES.length];
