export type Level = 'beginner' | 'intermediate' | 'advanced';
export type AgeGroup = 'kids' | 'teens' | 'adults' | 'seniors';
export type Tier = 'standard' | 'premium' | 'corporate';
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Sport { id: number; name: string; slug: string; premiumIncluded: boolean }
export interface Center { id: number; name: string; city: string; address: string; description: string }
export interface Hall {
  id: number; name: string; center: Center; sport: Sport | null; capacity: number;
  pricePerHour: number; openHour: number; closeHour: number; description: string;
}
export interface Trainer { id: number; fullName: string; bio: string; experienceYears: number; photoUrl: string | null; sport: Sport | null }
export interface Section {
  id: number; name: string; description: string; sport: Sport; hall: Hall; trainer: Trainer | null;
  level: Level; ageGroup: AgeGroup; capacity: number; pricePerVisit: number; active: boolean;
}
export interface Session { id: number; startsAt: string; durationMin: number; freeSeats?: number; section?: Section }
export interface User {
  id: number; email: string; fullName: string; phone: string | null; photoUrl: string | null;
  role: 'client' | 'admin'; loyaltyTier: Tier; bonusPoints: number; companyName: string | null;
  preferences: { sports?: string[]; remindBeforeHours?: number; promoNotifications?: boolean };
}
export interface PriceLine { label: string; amount: number }
export interface Quote { total: number; basePrice: number; lines: PriceLine[]; bonusSpent: number; startsAt: string; endsAt: string }
export interface Membership {
  id: number; type: 'single' | 'monthly' | 'corporate'; title: string; price: number;
  visitsTotal: number | null; visitsLeft: number | null; validFrom: string; validTo: string; status: string;
}
export interface Booking {
  id: number; kind: 'hall' | 'section'; hall: Hall | null; session: Session | null; startsAt: string; endsAt: string;
  basePrice: number; finalPrice: number; priceLines: PriceLine[]; bonusSpent: number; bonusAwarded: number;
  membership: Membership | null; status: BookingStatus; createdAt: string; actions: ('pay' | 'cancel')[]; user?: User;
}
export interface Notification { id: number; type: string; title: string; body: string; read: boolean; createdAt: string }
export interface Plan { type: Membership['type']; title: string; description: string; price: number; visits: number | null; validityDays: number }
export interface LoyaltyCard { tier: Tier; title: string; price: number; perks: string[] }
export interface Promotion { id: number; title: string; description: string; validTo: string | null; createdAt: string }
export interface Card { number: string; holder: string; expiry: string; cvc: string }

const TOKEN_KEY = 'arena_token';

export const token = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string | null) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY)),
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, init: { method?: string; body?: unknown; form?: FormData } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const t = token.get();
  if (t) headers.Authorization = `Bearer ${t}`;
  if (init.body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`/api${path}`, {
    method: init.method ?? (init.body !== undefined || init.form ? 'POST' : 'GET'),
    headers,
    body: init.form ?? (init.body !== undefined ? JSON.stringify(init.body) : undefined),
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const msg = Array.isArray(data?.message) ? data.message.join('; ') : data?.message;
    if (res.status === 401) token.set(null);
    throw new ApiError(res.status, msg ?? `Помилка ${res.status}`);
  }
  return data as T;
}

export const qs = (params: Record<string, string | number | undefined>) => {
  const s = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '') as [string, string][],
  ).toString();
  return s ? `?${s}` : '';
};
