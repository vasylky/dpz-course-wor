import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type Hall } from '../api';
import BookingPanel from '../components/BookingPanel';
import { Alert, Loading, useLoad } from '../components/ui';
import { kyivToday, money, sportImage } from '../labels';

interface Availability { hall: Hall; slots: { hour: number; free: boolean }[] }

export default function HallPage() {
  const { id } = useParams();
  const [date, setDate] = useState(kyivToday(1));
  const [hour, setHour] = useState<number | null>(null);
  const [hours, setHours] = useState(1);
  const { data, error, loading } = useLoad(() => api<Availability>(`/catalog/halls/${id}/availability?date=${date}`), [id, date]);
  if (loading && !data) return <Loading />;
  if (!data) return <Alert>{error}</Alert>;
  const { hall, slots } = data;
  const fits = (h: number) => Array.from({ length: hours }, (_, i) => slots.find((s) => s.hour === h + i)?.free).every(Boolean);
  return (
    <div className="detail">
      <div>
        <Link to="/catalog?tab=halls" className="back">Оренда залів</Link>
        <img src={sportImage(hall.sport?.slug, hall.id)} alt="" className="cover" />
        <h1>{hall.name}</h1>
        <div className="chips">
          <span className="tag">{hall.sport?.name ?? 'Універсальний'}</span>
          <span>{money(hall.pricePerHour)} / год</span>
          <span>до {hall.capacity} осіб</span>
        </div>
        <p>{hall.description}</p>
        <p className="muted">{hall.center.name}, {hall.center.address}. Після 18:00 діє вечірній тариф +20%.</p>
        <div className="row">
          <label>
            Дата
            <input type="date" value={date} min={kyivToday()} onChange={(e) => { setDate(e.target.value); setHour(null); }} />
          </label>
          <label>
            Тривалість
            <select value={hours} onChange={(e) => { setHours(Number(e.target.value)); setHour(null); }}>
              {[1, 2, 3].map((h) => <option key={h} value={h}>{h} год</option>)}
            </select>
          </label>
        </div>
        <div className="slots hours" data-testid="hours">
          {slots.map((s) => (
            <button
              key={s.hour}
              className={`slot ${hour === s.hour ? 'selected' : ''}`}
              disabled={!fits(s.hour) || s.hour + hours > hall.closeHour}
              onClick={() => setHour(s.hour)}
            >
              {String(s.hour).padStart(2, '0')}:00
            </button>
          ))}
        </div>
      </div>
      <BookingPanel target={hour !== null ? { kind: 'hall', hallId: hall.id, date, hour, hours } : null} />
    </div>
  );
}
