import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api, type Booking, type Quote } from '../api';
import { useAuth } from '../auth';
import { Alert, PriceBreakdown } from './ui';

type Target = { kind: 'section'; sessionId: number } | { kind: 'hall'; hallId: number; date: string; hour: number; hours: number };

export default function BookingPanel({ target }: { target: Target | null }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [useBonus, setUseBonus] = useState(false);
  const [useMembership, setUseMembership] = useState(true);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const key = JSON.stringify(target);

  useEffect(() => {
    setQuote(null);
    setError('');
    if (!target || !user) return;
    api<Quote>('/bookings/quote', { body: { ...target, useBonus, useMembership } })
      .then(setQuote)
      .catch((e: Error) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, useBonus, useMembership, user]);

  if (!target) return <div className="panel booking-panel muted">Оберіть час, щоб побачити вартість.</div>;
  if (!user) {
    return (
      <div className="panel booking-panel">
        <p>Щоб забронювати, <Link to={`/login?next=${encodeURIComponent(location.pathname)}`}>увійдіть</Link> або зареєструйтесь.</p>
      </div>
    );
  }

  return (
    <div className="panel booking-panel" data-testid="booking-panel">
      <h3>Бронювання</h3>
      <label className="check">
        <input type="checkbox" checked={useBonus} onChange={(e) => setUseBonus(e.target.checked)} />
        Списати бонуси (доступно {user.bonusPoints})
      </label>
      <label className="check">
        <input type="checkbox" checked={useMembership} onChange={(e) => setUseMembership(e.target.checked)} />
        Використати абонемент, якщо є
      </label>
      {quote && <PriceBreakdown lines={quote.lines} total={quote.total} />}
      <Alert>{error}</Alert>
      <button
        className="btn primary wide"
        disabled={!quote || busy}
        onClick={async () => {
          setBusy(true);
          try {
            const b = await api<Booking>('/bookings', { body: { ...target, useBonus, useMembership } });
            window.dispatchEvent(new Event('notifications'));
            nav(`/bookings/${b.id}`);
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        Забронювати
      </button>
    </div>
  );
}
