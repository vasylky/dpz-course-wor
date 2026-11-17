import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, type Booking, type Card, type LoyaltyCard, type Membership, type Notification, type Plan, type Sport, type Tier, type User } from '../api';
import { useAuth } from '../auth';
import { Alert, CardForm, Loading, Tabs, useLoad } from '../components/ui';
import { describeBooking, fmtDate, fmtDateTime, money, STATUSES, TIERS } from '../labels';

type Tab = 'bookings' | 'profile' | 'memberships' | 'loyalty' | 'notifications';

export default function Cabinet() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) ?? 'bookings';
  return (
    <>
      <h1>Особистий кабінет</h1>
      <Tabs<Tab>
        tabs={[['bookings', 'Бронювання'], ['memberships', 'Абонементи'], ['loyalty', 'Картка лояльності'], ['notifications', 'Сповіщення'], ['profile', 'Профіль']]}
        value={tab}
        onChange={(t) => setParams({ tab: t })}
      />
      {tab === 'bookings' && <Bookings />}
      {tab === 'profile' && <Profile />}
      {tab === 'memberships' && <Memberships />}
      {tab === 'loyalty' && <Loyalty />}
      {tab === 'notifications' && <Notifications />}
    </>
  );
}

function Bookings() {
  const { data, loading, error } = useLoad(() => api<Booking[]>('/bookings/me'));
  const [filter, setFilter] = useState<'upcoming' | 'all'>('upcoming');
  if (loading) return <Loading />;
  const now = Date.now();
  const list = (data ?? []).filter((b) => filter === 'all' || (new Date(b.endsAt).getTime() > now && b.status !== 'cancelled'));
  return (
    <div className="panel">
      <Alert>{error}</Alert>
      <div className="row between">
        <div className="seg">
          <button className={filter === 'upcoming' ? 'active' : ''} onClick={() => setFilter('upcoming')}>Майбутні</button>
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Вся історія</button>
        </div>
        <Link to="/catalog" className="btn small">Нове бронювання</Link>
      </div>
      {list.length === 0 ? <p className="muted">Бронювань немає.</p> : (
        <table className="table" data-testid="bookings-table">
          <thead><tr><th>#</th><th>Що</th><th>Коли</th><th>Сума</th><th>Статус</th><th /></tr></thead>
          <tbody>
            {list.map((b) => (
              <tr key={b.id}>
                <td>{b.id}</td>
                <td>{describeBooking(b)}</td>
                <td>{fmtDateTime(b.startsAt)}</td>
                <td>{money(b.finalPrice)}</td>
                <td><span className={`status status-${b.status}`}>{STATUSES[b.status]}</span></td>
                <td><Link to={`/bookings/${b.id}`}>{b.actions.includes('pay') ? 'Оплатити' : 'Деталі'}</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Profile() {
  const { user, refresh } = useAuth();
  const sports = useLoad(() => api<Sport[]>('/catalog/sports'));
  const [form, setForm] = useState({
    fullName: user!.fullName,
    phone: user!.phone ?? '',
    sports: user!.preferences.sports ?? [],
    remindBeforeHours: user!.preferences.remindBeforeHours ?? 24,
    promoNotifications: user!.preferences.promoNotifications ?? true,
  });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const toggleSport = (slug: string) =>
    setForm({ ...form, sports: form.sports.includes(slug) ? form.sports.filter((s) => s !== slug) : [...form.sports, slug] });

  return (
    <div className="two-col">
      <div className="panel">
        <h3>Контактні дані та вподобання</h3>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await api<User>('/users/me', {
                method: 'PATCH',
                body: {
                  fullName: form.fullName,
                  phone: form.phone,
                  preferences: { sports: form.sports, remindBeforeHours: Number(form.remindBeforeHours), promoNotifications: form.promoNotifications },
                },
              });
              await refresh();
              setMsg('Профіль збережено');
              setErr('');
            } catch (e) {
              setErr((e as Error).message);
            }
          }}
        >
          <label>ПІБ<input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></label>
          <label>Телефон<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          <label>Email<input value={user!.email} disabled /></label>
          <fieldset>
            <legend>Улюблені види спорту (сповіщення про нові секції)</legend>
            {sports.data?.map((s) => (
              <label key={s.id} className="check">
                <input type="checkbox" checked={form.sports.includes(s.slug)} onChange={() => toggleSport(s.slug)} />
                {s.name}
              </label>
            ))}
          </fieldset>
          <label>
            Нагадувати за, годин
            <input type="number" min={1} max={48} value={form.remindBeforeHours} onChange={(e) => setForm({ ...form, remindBeforeHours: Number(e.target.value) })} />
          </label>
          <label className="check">
            <input type="checkbox" checked={form.promoNotifications} onChange={(e) => setForm({ ...form, promoNotifications: e.target.checked })} />
            Отримувати інформацію про акції та нові секції
          </label>
          <Alert kind="success">{msg}</Alert>
          <Alert>{err}</Alert>
          <button className="btn primary">Зберегти</button>
        </form>
      </div>
      <div className="panel">
        <h3>Фото</h3>
        {user!.photoUrl ? <img src={user!.photoUrl} alt="Фото профілю" className="avatar" /> : <div className="avatar placeholder">{user!.fullName[0]}</div>}
        <label>
          Завантажити фото
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const form = new FormData();
              form.append('photo', file);
              try {
                await api('/users/me/photo', { form });
                await refresh();
                setMsg('Фото оновлено');
              } catch (er) {
                setErr((er as Error).message);
              }
            }}
          />
        </label>
      </div>
    </div>
  );
}

function Memberships() {
  const plans = useLoad(() => api<Plan[]>('/memberships/plans'));
  const mine = useLoad(() => api<Membership[]>('/memberships/me'));
  const [selected, setSelected] = useState<Plan | null>(null);
  const [company, setCompany] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const buy = async (card: Card) => {
    setBusy(true);
    setErr('');
    try {
      await api('/memberships', { body: { type: selected!.type, card, companyName: company || undefined } });
      setMsg(`Абонемент "${selected!.title}" придбано`);
      setSelected(null);
      await mine.reload();
      window.dispatchEvent(new Event('notifications'));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="panel">
        <h3>Мої абонементи</h3>
        {mine.loading ? <Loading /> : mine.data?.length ? (
          <table className="table" data-testid="memberships-table">
            <thead><tr><th>Тип</th><th>Залишок</th><th>Діє до</th><th>Статус</th></tr></thead>
            <tbody>
              {mine.data.map((m) => (
                <tr key={m.id}>
                  <td>{m.title}</td>
                  <td>{m.visitsLeft === null ? 'безлімітно' : `${m.visitsLeft} з ${m.visitsTotal}`}</td>
                  <td>{fmtDate(m.validTo)}</td>
                  <td>{{ active: 'Активний', expired: 'Минув', used_up: 'Використано' }[m.status] ?? m.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="muted">Абонементів ще немає.</p>}
      </div>
      <Alert kind="success">{msg}</Alert>
      <div className="grid">
        {plans.data?.map((p) => (
          <div key={p.type} className={`card plan ${selected?.type === p.type ? 'selected' : ''}`}>
            <h3>{p.title}</h3>
            <p className="price-tag big">{money(p.price)}</p>
            <p>{p.description}</p>
            <button className="btn" onClick={() => { setSelected(p); setMsg(''); }}>Обрати</button>
          </div>
        ))}
      </div>
      {selected && (
        <div className="panel narrow">
          <h3>Купівля: {selected.title}</h3>
          {selected.type === 'corporate' && (
            <label>Компанія<input value={company} onChange={(e) => setCompany(e.target.value)} /></label>
          )}
          <Alert>{err}</Alert>
          <CardForm busy={busy} submitLabel={`Сплатити ${selected.price} грн`} onSubmit={buy} />
        </div>
      )}
    </>
  );
}

function Loyalty() {
  const { refresh } = useAuth();
  const me = useLoad(() => api<{ tier: Tier; title: string; perks: string[]; bonusPoints: number; companyName: string | null }>('/loyalty/me'));
  const cards = useLoad(() => api<LoyaltyCard[]>('/loyalty/cards'));
  const [target, setTarget] = useState<LoyaltyCard | null>(null);
  const [company, setCompany] = useState('');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  if (!me.data) return <Loading />;
  const rank = { standard: 0, premium: 1, corporate: 2 };
  return (
    <>
      <div className={`panel loyalty-card tier-${me.data.tier}`} data-testid="loyalty-card">
        <p className="muted">Ваша картка</p>
        <h2>{me.data.title}</h2>
        <p className="points"><strong data-testid="bonus-points">{me.data.bonusPoints}</strong> бонусних балів</p>
        <ul>{me.data.perks.map((p) => <li key={p}>{p}</li>)}</ul>
      </div>
      <Alert kind="success">{msg}</Alert>
      <div className="grid">
        {cards.data?.map((c) => (
          <div key={c.tier} className="card plan">
            <h3>{TIERS[c.tier]}</h3>
            <p className="price-tag big">{c.price ? money(c.price) : 'Безкоштовно'}</p>
            <ul>{c.perks.map((p) => <li key={p}>{p}</li>)}</ul>
            {rank[c.tier] > rank[me.data!.tier] && <button className="btn" onClick={() => setTarget(c)}>Оформити</button>}
            {c.tier === me.data!.tier && <span className="tag">Поточна</span>}
          </div>
        ))}
      </div>
      {target && (
        <div className="panel narrow">
          <h3>Оформлення картки {TIERS[target.tier]}</h3>
          {target.tier === 'corporate' && <label>Компанія<input value={company} onChange={(e) => setCompany(e.target.value)} /></label>}
          <Alert>{err}</Alert>
          <CardForm
            busy={busy}
            submitLabel={`Сплатити ${target.price} грн`}
            onSubmit={async (card) => {
              setBusy(true);
              try {
                await api('/loyalty/upgrade', { body: { tier: target.tier, card, companyName: company || undefined } });
                setTarget(null);
                setMsg('Картку оновлено');
                await Promise.all([me.reload(), refresh()]);
                window.dispatchEvent(new Event('notifications'));
              } catch (e) {
                setErr((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          />
        </div>
      )}
    </>
  );
}

function Notifications() {
  const { data, loading, reload } = useLoad(() => api<Notification[]>('/notifications'));
  if (loading) return <Loading />;
  const markAll = async () => {
    await api('/notifications/read-all', { method: 'POST' });
    await reload();
    window.dispatchEvent(new Event('notifications'));
  };
  return (
    <div className="panel">
      <div className="row between">
        <h3>Сповіщення</h3>
        <button className="btn small" onClick={markAll}>Позначити всі прочитаними</button>
      </div>
      {data?.length === 0 && <p className="muted">Сповіщень немає.</p>}
      <ul className="notifications" data-testid="notifications">
        {data?.map((n) => (
          <li key={n.id} className={n.read ? '' : 'unread'}>
            <div className="row between">
              <strong>{n.title}</strong>
              <span className="small muted">{fmtDateTime(n.createdAt)}</span>
            </div>
            <p className="pre">{n.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
