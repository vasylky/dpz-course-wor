import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type Section, type Session } from '../api';
import BookingPanel from '../components/BookingPanel';
import { Alert, Loading, useLoad } from '../components/ui';
import { AGE_GROUPS, fmtDateTime, LEVELS, money, sportImage } from '../labels';

export default function SectionPage() {
  const { id } = useParams();
  const { data, error, loading } = useLoad(() => api<Section & { sessions: Session[] }>(`/catalog/sections/${id}`), [id]);
  const [sessionId, setSessionId] = useState<number | null>(null);
  if (loading) return <Loading />;
  if (!data) return <Alert>{error}</Alert>;
  return (
    <div className="detail">
      <div>
        <Link to="/catalog" className="back">Каталог</Link>
        <img src={sportImage(data.sport.slug, data.id)} alt="" className="cover" />
        <h1>{data.name}</h1>
        <div className="chips">
          <span className="tag">{data.sport.name}</span>
          <span>{LEVELS[data.level]}</span>
          <span>{AGE_GROUPS[data.ageGroup]}</span>
          <span>{money(data.pricePerVisit)} / заняття</span>
        </div>
        <p>{data.description}</p>
        <dl className="facts">
          <dt>Центр</dt><dd>{data.hall.center.name}, {data.hall.center.address}</dd>
          <dt>Зал</dt><dd>{data.hall.name}</dd>
          <dt>Тренер</dt><dd>{data.trainer ? `${data.trainer.fullName}, досвід ${data.trainer.experienceYears} р.` : 'не призначено'}</dd>
          <dt>Група</dt><dd>до {data.capacity} осіб</dd>
        </dl>
        <h2>Розклад</h2>
        {data.sessions.length === 0 && <p className="muted">Найближчих занять немає.</p>}
        <div className="slots" data-testid="sessions">
          {data.sessions.map((s) => (
            <button
              key={s.id}
              className={`slot ${sessionId === s.id ? 'selected' : ''}`}
              disabled={!s.freeSeats}
              onClick={() => setSessionId(s.id)}
            >
              <strong>{fmtDateTime(s.startsAt)}</strong>
              <span>{s.freeSeats ? `вільно ${s.freeSeats}` : 'місць немає'}</span>
            </button>
          ))}
        </div>
      </div>
      <BookingPanel target={sessionId ? { kind: 'section', sessionId } : null} />
    </div>
  );
}
