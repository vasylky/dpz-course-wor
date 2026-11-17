import { useState } from 'react';
import { api, type Booking, type Center, type Hall, type Section, type Session, type Sport, type Trainer, type User } from '../api';
import { Alert, Loading, Tabs, useLoad } from '../components/ui';
import { AGE_GROUPS, describeBooking, fmtDateTime, LEVELS, money, STATUSES, TIERS } from '../labels';

type Tab = 'stats' | 'sections' | 'sessions' | 'halls' | 'centers' | 'trainers' | 'sports' | 'promotions' | 'users' | 'bookings';

export default function Admin() {
  const [tab, setTab] = useState<Tab>('stats');
  return (
    <>
      <h1>Адміністрування</h1>
      <Tabs<Tab>
        tabs={[['stats', 'Статистика'], ['sections', 'Секції'], ['sessions', 'Розклад'], ['halls', 'Зали'], ['centers', 'Центри'], ['trainers', 'Тренери'], ['sports', 'Види спорту'], ['promotions', 'Акції'], ['users', 'Користувачі'], ['bookings', 'Бронювання']]}
        value={tab}
        onChange={setTab}
      />
      {tab === 'stats' && <Stats />}
      {tab === 'sections' && <SectionsAdmin />}
      {tab === 'sessions' && <SessionsAdmin />}
      {tab === 'halls' && <HallsAdmin />}
      {tab === 'centers' && <CentersAdmin />}
      {tab === 'trainers' && <TrainersAdmin />}
      {tab === 'sports' && <SportsAdmin />}
      {tab === 'promotions' && <PromotionsAdmin />}
      {tab === 'users' && <UsersAdmin />}
      {tab === 'bookings' && <BookingsAdmin />}
    </>
  );
}

interface Stats {
  byStatus: { status: keyof typeof STATUSES; count: number }[];
  revenue: { purpose: string; amount: number }[];
  topSections: { name: string; count: number }[];
  byTier: { tier: keyof typeof TIERS; count: number }[];
  clients: number;
}

function Stats() {
  const { data } = useLoad(() => api<Stats>('/admin/stats'));
  if (!data) return <Loading />;
  const purposes: Record<string, string> = { booking: 'Бронювання', membership: 'Абонементи', loyalty_card: 'Картки лояльності' };
  const total = data.revenue.reduce((s, r) => s + r.amount, 0);
  return (
    <div className="grid">
      <div className="card"><p className="muted">Клієнтів</p><p className="kpi">{data.clients}</p></div>
      <div className="card"><p className="muted">Дохід</p><p className="kpi">{money(total)}</p>
        {data.revenue.map((r) => <p key={r.purpose} className="small">{purposes[r.purpose]}: {money(r.amount)}</p>)}</div>
      <div className="card"><p className="muted">Бронювання</p>
        {data.byStatus.map((s) => <p key={s.status} className="small">{STATUSES[s.status]}: {s.count}</p>)}</div>
      <div className="card"><p className="muted">Картки лояльності</p>
        {data.byTier.map((t) => <p key={t.tier} className="small">{TIERS[t.tier]}: {t.count}</p>)}</div>
      <div className="card"><p className="muted">Популярні секції</p>
        {data.topSections.length ? data.topSections.map((s) => <p key={s.name} className="small">{s.name}: {s.count}</p>) : <p className="small muted">Ще немає даних</p>}</div>
    </div>
  );
}

type Field = {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'select' | 'checkbox' | 'textarea' | 'datetime';
  options?: [string | number, string][];
  required?: boolean;
};

type FormValue = Record<string, string | number | boolean | null>;

function Editor<T extends { id: number }>({
  title, endpoint, items, fields, columns, toForm, reload, editable = true, creatable = true, deletable = true,
}: {
  editable?: boolean;
  creatable?: boolean;
  deletable?: boolean;
  title: string;
  endpoint: string;
  items: T[] | null;
  fields: Field[];
  columns: [string, (item: T) => React.ReactNode][];
  toForm: (item: T) => FormValue;
  reload: () => Promise<void>;
}) {
  const empty = Object.fromEntries(fields.map((f) => [f.key, f.type === 'checkbox' ? false : ''])) as FormValue;
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<FormValue>(empty);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = Object.fromEntries(
      fields.map((f) => {
        const v = form[f.key];
        if (f.type === 'number' || (f.type === 'select' && typeof f.options?.[0]?.[0] === 'number')) {
          return [f.key, v === '' || v === null ? null : Number(v)];
        }
        if (f.type === 'datetime') return [f.key, v ? new Date(String(v)).toISOString() : undefined];
        return [f.key, v === '' ? undefined : v];
      }),
    );
    try {
      await api(editing ? `${endpoint}/${editing}` : endpoint, { method: editing ? 'PATCH' : 'POST', body });
      setOpen(false);
      setErr('');
      await reload();
    } catch (er) {
      setErr((er as Error).message);
    }
  };

  return (
    <div className="panel">
      <div className="row between">
        <h3>{title}</h3>
        {creatable && <button className="btn primary small" onClick={() => { setEditing(null); setForm(empty); setOpen(true); }}>Додати</button>}
      </div>
      {open && (
        <form className="admin-form" onSubmit={submit} aria-label={`Форма: ${title}`}>
          {fields.map((f) => (
            <label key={f.key} className={f.type === 'checkbox' ? 'check' : f.type === 'textarea' ? 'span2' : ''}>
              {f.type !== 'checkbox' && f.label}
              {f.type === 'select' ? (
                <select value={String(form[f.key] ?? '')} required={f.required} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}>
                  <option value="">—</option>
                  {f.options?.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              ) : f.type === 'checkbox' ? (
                <input type="checkbox" checked={Boolean(form[f.key])} onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })} />
              ) : f.type === 'textarea' ? (
                <textarea value={String(form[f.key] ?? '')} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
              ) : (
                <input
                  type={f.type === 'number' ? 'number' : f.type === 'datetime' ? 'datetime-local' : 'text'}
                  step={f.type === 'number' ? 'any' : undefined}
                  value={String(form[f.key] ?? '')}
                  required={f.required}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                />
              )}
              {f.type === 'checkbox' && f.label}
            </label>
          ))}
          <Alert>{err}</Alert>
          <div className="row span2">
            <button className="btn primary">{editing ? 'Зберегти' : 'Створити'}</button>
            <button type="button" className="btn" onClick={() => setOpen(false)}>Скасувати</button>
          </div>
        </form>
      )}
      {!items ? <Loading /> : (
        <table className="table">
          <thead><tr>{columns.map(([h]) => <th key={h}>{h}</th>)}<th /></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                {columns.map(([h, render]) => <td key={h}>{render(item)}</td>)}
                <td className="actions">
                  {editable && <button className="btn link" onClick={() => { setEditing(item.id); setForm({ ...empty, ...toForm(item) }); setOpen(true); }}>Редагувати</button>}
                  {deletable && <button className="btn link danger" onClick={async () => {
                    if (!confirm('Видалити?')) return;
                    try { await api(`${endpoint}/${item.id}`, { method: 'DELETE' }); await reload(); } catch (er) { alert((er as Error).message); }
                  }}>Видалити</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const useRefs = () => useLoad(() => Promise.all([
  api<Sport[]>('/catalog/sports'),
  api<Center[]>('/catalog/centers'),
  api<Hall[]>('/catalog/halls'),
  api<Trainer[]>('/catalog/trainers'),
]));

function SectionsAdmin() {
  const refs = useRefs();
  const list = useLoad(() => api<Section[]>('/admin/sections'));
  const [sports, , halls, trainers] = refs.data ?? [[], [], [], []];
  return (
    <Editor<Section>
      title="Секції"
      endpoint="/admin/sections"
      items={list.data}
      reload={list.reload}
      fields={[
        { key: 'name', label: 'Назва', required: true },
        { key: 'sportId', label: 'Вид спорту', type: 'select', required: true, options: sports.map((s) => [s.id, s.name]) },
        { key: 'hallId', label: 'Зал', type: 'select', required: true, options: halls.map((h) => [h.id, `${h.center.name}: ${h.name}`]) },
        { key: 'trainerId', label: 'Тренер', type: 'select', options: trainers.map((t) => [t.id, t.fullName]) },
        { key: 'level', label: 'Рівень', type: 'select', required: true, options: Object.entries(LEVELS) },
        { key: 'ageGroup', label: 'Вікова група', type: 'select', required: true, options: Object.entries(AGE_GROUPS) },
        { key: 'capacity', label: 'Місць', type: 'number', required: true },
        { key: 'pricePerVisit', label: 'Ціна за заняття', type: 'number', required: true },
        { key: 'active', label: 'Активна', type: 'checkbox' },
        { key: 'description', label: 'Опис', type: 'textarea' },
      ]}
      toForm={(s) => ({ name: s.name, sportId: s.sport.id, hallId: s.hall.id, trainerId: s.trainer?.id ?? '', level: s.level, ageGroup: s.ageGroup, capacity: s.capacity, pricePerVisit: s.pricePerVisit, active: s.active, description: s.description })}
      columns={[
        ['Назва', (s) => s.name],
        ['Спорт', (s) => s.sport.name],
        ['Зал', (s) => `${s.hall.center.name}: ${s.hall.name}`],
        ['Рівень', (s) => LEVELS[s.level]],
        ['Вік', (s) => AGE_GROUPS[s.ageGroup]],
        ['Ціна', (s) => money(s.pricePerVisit)],
        ['Активна', (s) => (s.active ? 'так' : 'ні')],
      ]}
    />
  );
}

function SessionsAdmin() {
  const sections = useLoad(() => api<Section[]>('/admin/sections'));
  const [sectionId, setSectionId] = useState<number | null>(null);
  const sessions = useLoad(() => (sectionId ? api<Session[]>(`/admin/sessions?sectionId=${sectionId}`) : Promise.resolve([])), [sectionId]);
  const [form, setForm] = useState({ startsAt: '', durationMin: 60, repeatWeeks: 1 });
  const [err, setErr] = useState('');
  return (
    <div className="panel">
      <label>
        Секція
        <select value={sectionId ?? ''} onChange={(e) => setSectionId(Number(e.target.value) || null)}>
          <option value="">Оберіть секцію</option>
          {sections.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </label>
      {sectionId && (
        <>
          <form
            className="admin-form"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api('/admin/sessions', { body: { sectionId, startsAt: new Date(form.startsAt).toISOString(), durationMin: Number(form.durationMin), repeatWeeks: Number(form.repeatWeeks) } });
                setErr('');
                await sessions.reload();
              } catch (er) {
                setErr((er as Error).message);
              }
            }}
          >
            <label>Початок<input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} required /></label>
            <label>Тривалість, хв<input type="number" value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) })} /></label>
            <label>Повторити тижнів<input type="number" min={1} max={12} value={form.repeatWeeks} onChange={(e) => setForm({ ...form, repeatWeeks: Number(e.target.value) })} /></label>
            <Alert>{err}</Alert>
            <div className="row span2"><button className="btn primary">Додати заняття</button></div>
          </form>
          <table className="table">
            <thead><tr><th>Дата</th><th>Тривалість</th><th /></tr></thead>
            <tbody>
              {sessions.data?.map((s) => (
                <tr key={s.id}>
                  <td>{fmtDateTime(s.startsAt)}</td>
                  <td>{s.durationMin} хв</td>
                  <td><button className="btn link danger" onClick={async () => { await api(`/admin/sessions/${s.id}`, { method: 'DELETE' }); await sessions.reload(); }}>Видалити</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

function HallsAdmin() {
  const refs = useRefs();
  const [sports, centers, halls] = refs.data ?? [[], [], null];
  return (
    <Editor<Hall>
      title="Зали"
      endpoint="/admin/halls"
      items={halls}
      reload={refs.reload}
      fields={[
        { key: 'name', label: 'Назва', required: true },
        { key: 'centerId', label: 'Центр', type: 'select', required: true, options: centers.map((c) => [c.id, c.name]) },
        { key: 'sportId', label: 'Вид спорту', type: 'select', options: sports.map((s) => [s.id, s.name]) },
        { key: 'capacity', label: 'Місткість', type: 'number', required: true },
        { key: 'pricePerHour', label: 'Ціна за годину', type: 'number', required: true },
        { key: 'openHour', label: 'Відкриття (год)', type: 'number' },
        { key: 'closeHour', label: 'Закриття (год)', type: 'number' },
        { key: 'description', label: 'Опис', type: 'textarea' },
      ]}
      toForm={(h) => ({ name: h.name, centerId: h.center.id, sportId: h.sport?.id ?? '', capacity: h.capacity, pricePerHour: h.pricePerHour, openHour: h.openHour, closeHour: h.closeHour, description: h.description })}
      columns={[
        ['Назва', (h) => h.name],
        ['Центр', (h) => h.center.name],
        ['Спорт', (h) => h.sport?.name ?? '—'],
        ['Місткість', (h) => h.capacity],
        ['Ціна/год', (h) => money(h.pricePerHour)],
        ['Години', (h) => `${h.openHour}:00–${h.closeHour}:00`],
      ]}
    />
  );
}

function CentersAdmin() {
  const list = useLoad(() => api<Center[]>('/catalog/centers'));
  return (
    <Editor<Center>
      title="Спортивні центри"
      endpoint="/admin/centers"
      items={list.data}
      reload={list.reload}
      fields={[
        { key: 'name', label: 'Назва', required: true },
        { key: 'city', label: 'Місто', required: true },
        { key: 'address', label: 'Адреса', required: true },
        { key: 'description', label: 'Опис', type: 'textarea' },
      ]}
      toForm={(c) => ({ name: c.name, city: c.city, address: c.address, description: c.description })}
      columns={[['Назва', (c) => c.name], ['Місто', (c) => c.city], ['Адреса', (c) => c.address]]}
    />
  );
}

function TrainersAdmin() {
  const refs = useRefs();
  const [sports, , , trainers] = refs.data ?? [[], [], [], null];
  return (
    <Editor<Trainer>
      title="Тренери"
      endpoint="/admin/trainers"
      items={trainers}
      reload={refs.reload}
      fields={[
        { key: 'fullName', label: 'ПІБ', required: true },
        { key: 'sportId', label: 'Вид спорту', type: 'select', options: sports.map((s) => [s.id, s.name]) },
        { key: 'experienceYears', label: 'Досвід, років', type: 'number' },
        { key: 'bio', label: 'Про тренера', type: 'textarea' },
      ]}
      toForm={(t) => ({ fullName: t.fullName, sportId: t.sport?.id ?? '', experienceYears: t.experienceYears, bio: t.bio })}
      columns={[['ПІБ', (t) => t.fullName], ['Спорт', (t) => t.sport?.name ?? '—'], ['Досвід', (t) => `${t.experienceYears} р.`]]}
    />
  );
}

function SportsAdmin() {
  const list = useLoad(() => api<Sport[]>('/catalog/sports'));
  return (
    <Editor<Sport>
      title="Види спорту"
      endpoint="/admin/sports"
      items={list.data}
      reload={list.reload}
      fields={[
        { key: 'name', label: 'Назва', required: true },
        { key: 'slug', label: 'Код (латиницею)', required: true },
        { key: 'premiumIncluded', label: 'Безкоштовно для Преміум', type: 'checkbox' },
      ]}
      toForm={(s) => ({ name: s.name, slug: s.slug, premiumIncluded: s.premiumIncluded })}
      columns={[['Назва', (s) => s.name], ['Код', (s) => s.slug], ['Преміум безкоштовно', (s) => (s.premiumIncluded ? 'так' : 'ні')]]}
    />
  );
}

function PromotionsAdmin() {
  const list = useLoad(() => api<{ id: number; title: string; description: string; validTo: string | null }[]>('/promotions'));
  return (
    <Editor
      title="Акції (при створенні клієнти отримують сповіщення)"
      editable={false}
      endpoint="/admin/promotions"
      items={list.data}
      reload={list.reload}
      fields={[
        { key: 'title', label: 'Заголовок', required: true },
        { key: 'validTo', label: 'Діє до', type: 'datetime' },
        { key: 'description', label: 'Опис', type: 'textarea' },
      ]}
      toForm={(p) => ({ title: p.title, description: p.description, validTo: '' })}
      columns={[['Заголовок', (p) => p.title], ['Опис', (p) => p.description], ['До', (p) => (p.validTo ? fmtDateTime(p.validTo) : '—')]]}
    />
  );
}

function UsersAdmin() {
  const list = useLoad(() => api<User[]>('/admin/users'));
  return (
    <Editor<User>
      title="Користувачі"
      creatable={false}
      deletable={false}
      endpoint="/admin/users"
      items={list.data}
      reload={list.reload}
      fields={[
        { key: 'role', label: 'Роль', type: 'select', options: [['client', 'Клієнт'], ['admin', 'Адміністратор']] },
        { key: 'loyaltyTier', label: 'Картка', type: 'select', options: Object.entries(TIERS) },
        { key: 'bonusPoints', label: 'Бонуси', type: 'number' },
        { key: 'companyName', label: 'Компанія' },
      ]}
      toForm={(u) => ({ role: u.role, loyaltyTier: u.loyaltyTier, bonusPoints: u.bonusPoints, companyName: u.companyName ?? '' })}
      columns={[
        ['ПІБ', (u) => u.fullName],
        ['Email', (u) => u.email],
        ['Роль', (u) => (u.role === 'admin' ? 'Адмін' : 'Клієнт')],
        ['Картка', (u) => TIERS[u.loyaltyTier]],
        ['Бонуси', (u) => u.bonusPoints],
      ]}
    />
  );
}

function BookingsAdmin() {
  const [status, setStatus] = useState('');
  const list = useLoad(() => api<Booking[]>(`/admin/bookings${status ? `?status=${status}` : ''}`), [status]);
  return (
    <div className="panel">
      <label>
        Статус
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Усі</option>
          {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </label>
      {!list.data ? <Loading /> : (
        <table className="table">
          <thead><tr><th>#</th><th>Клієнт</th><th>Що</th><th>Коли</th><th>Сума</th><th>Статус</th><th /></tr></thead>
          <tbody>
            {list.data.map((b) => (
              <tr key={b.id}>
                <td>{b.id}</td>
                <td>{b.user?.fullName}</td>
                <td>{describeBooking(b)}</td>
                <td>{fmtDateTime(b.startsAt)}</td>
                <td>{money(b.finalPrice)}</td>
                <td><span className={`status status-${b.status}`}>{STATUSES[b.status]}</span></td>
                <td>
                  {(b.status === 'pending' || b.status === 'confirmed') && (
                    <button className="btn link danger" onClick={async () => {
                      if (!confirm('Скасувати бронювання?')) return;
                      try { await api(`/admin/bookings/${b.id}/cancel`, { method: 'POST' }); await list.reload(); } catch (e) { alert((e as Error).message); }
                    }}>Скасувати</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
