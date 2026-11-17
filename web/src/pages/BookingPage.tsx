import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type Booking, type Card } from '../api';
import { useAuth } from '../auth';
import { Alert, CardForm, Loading, PriceBreakdown, useLoad } from '../components/ui';
import { describeBooking, fmtDateTime, fmtTime, STATUSES } from '../labels';

export default function BookingPage() {
  const { id } = useParams();
  const { refresh } = useAuth();
  const { data: b, error, loading, setData } = useLoad(() => api<Booking>(`/bookings/${id}`), [id]);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  if (loading) return <Loading />;
  if (!b) return <Alert>{error}</Alert>;

  const act = async (fn: () => Promise<Booking>, ok: string) => {
    setBusy(true);
    setErr('');
    try {
      setData(await fn());
      setMsg(ok);
      await refresh();
      window.dispatchEvent(new Event('notifications'));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="detail">
      <div className="panel">
        <p className="muted">Бронювання #{b.id}</p>
        <h1>{describeBooking(b)}</h1>
        <p>{fmtDateTime(b.startsAt)} – {fmtTime(b.endsAt)}</p>
        <p>Статус: <span className={`status status-${b.status}`} data-testid="booking-status">{STATUSES[b.status]}</span></p>
        <PriceBreakdown lines={b.priceLines} total={b.finalPrice} />
        {b.bonusAwarded > 0 && <p className="small">Нараховано бонусів: {b.bonusAwarded}</p>}
        <Alert kind="success">{msg}</Alert>
        <Alert>{err}</Alert>
        {b.actions.includes('cancel') && (
          <button className="btn danger" disabled={busy} onClick={() => confirm('Скасувати бронювання?') && act(() => api(`/bookings/${b.id}/cancel`, { method: 'POST' }), 'Бронювання скасовано')}>
            Скасувати бронювання
          </button>
        )}
        <p><Link to="/cabinet">Мої бронювання</Link></p>
      </div>
      {b.actions.includes('pay') && (
        <div className="panel">
          <h3>Оплата</h3>
          <CardForm
            busy={busy}
            submitLabel={`Сплатити ${b.finalPrice} грн`}
            onSubmit={(card: Card) => act(() => api(`/bookings/${b.id}/pay`, { body: { card } }), 'Оплата успішна, бронювання підтверджено')}
          />
        </div>
      )}
    </div>
  );
}
