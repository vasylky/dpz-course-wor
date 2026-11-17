import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, qs, type Center, type Hall, type Section, type Sport } from '../api';
import { Alert, Loading, Tabs, useLoad } from '../components/ui';
import { AGE_GROUPS, LEVELS, money, sportImage } from '../labels';

export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as 'sections' | 'halls') ?? 'sections';
  const filters = {
    sport: params.get('sport') ?? '',
    level: params.get('level') ?? '',
    ageGroup: params.get('ageGroup') ?? '',
    centerId: params.get('centerId') ?? '',
    q: params.get('q') ?? '',
    trainerId: params.get('trainerId') ?? '',
  };
  const [q, setQ] = useState(filters.q);
  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };

  const meta = useLoad(() => Promise.all([api<Sport[]>('/catalog/sports'), api<Center[]>('/catalog/centers')]));
  const sections = useLoad(
    () => (tab === 'sections' ? api<Section[]>(`/catalog/sections${qs(filters)}`) : Promise.resolve([])),
    [tab, filters.sport, filters.level, filters.ageGroup, filters.centerId, filters.q, filters.trainerId],
  );
  const halls = useLoad(
    () => (tab === 'halls' ? api<Hall[]>(`/catalog/halls${qs({ sport: filters.sport, centerId: filters.centerId })}`) : Promise.resolve([])),
    [tab, filters.sport, filters.centerId],
  );
  const [sports, centers] = meta.data ?? [[], []];

  return (
    <>
      <section className="hero">
        <h1>Каталог</h1>
        <p>Обирайте заняття із тренером або орендуйте зал на потрібний час.</p>
      </section>
      <Tabs tabs={[['sections', 'Секції'], ['halls', 'Оренда залів']]} value={tab} onChange={(t) => update({ tab: t === 'sections' ? '' : t })} />
      <div className="filters panel">
        <label>
          Вид спорту
          <select value={filters.sport} onChange={(e) => update({ sport: e.target.value })}>
            <option value="">Усі</option>
            {sports.map((s) => <option key={s.id} value={s.slug}>{s.name}</option>)}
          </select>
        </label>
        <label>
          Центр
          <select value={filters.centerId} onChange={(e) => update({ centerId: e.target.value })}>
            <option value="">Усі</option>
            {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        {tab === 'sections' && (
          <>
            <label>
              Рівень
              <select value={filters.level} onChange={(e) => update({ level: e.target.value })}>
                <option value="">Будь-який</option>
                {Object.entries(LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label>
              Вік
              <select value={filters.ageGroup} onChange={(e) => update({ ageGroup: e.target.value })}>
                <option value="">Будь-який</option>
                {Object.entries(AGE_GROUPS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <form className="search" onSubmit={(e) => { e.preventDefault(); update({ q }); }}>
              <label>
                Пошук
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Назва секції" />
              </label>
            </form>
          </>
        )}
      </div>

      {filters.trainerId && (
        <p className="small">Показано секції обраного тренера. <button className="btn link" onClick={() => update({ trainerId: '' })}>Скинути</button></p>
      )}
      {tab === 'sections' ? (
        sections.loading ? <Loading /> : (
          <>
            <Alert>{sections.error}</Alert>
            {sections.data?.length === 0 && <p className="muted">Нічого не знайдено за цими фільтрами.</p>}
            <div className="grid" data-testid="section-list">
              {sections.data?.map((s) => (
                <Link key={s.id} to={`/sections/${s.id}`} className="card media-card">
                  <img src={sportImage(s.sport.slug, s.id)} alt="" loading="lazy" />
                  <div className="media-body">
                  <div className="card-top">
                    <span className="tag">{s.sport.name}</span>
                    <span className="price-tag">{money(s.pricePerVisit)}</span>
                  </div>
                  <h3>{s.name}</h3>
                  <p className="muted">{s.hall.center.name}, {s.hall.name}</p>
                  <div className="chips">
                    <span>{LEVELS[s.level]}</span>
                    <span>{AGE_GROUPS[s.ageGroup]}</span>
                    {s.sport.premiumIncluded && <span className="chip-accent">Преміум безкоштовно</span>}
                  </div>
                  {s.trainer && <p className="small">Тренер: {s.trainer.fullName}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )
      ) : halls.loading ? <Loading /> : (
        <div className="grid" data-testid="hall-list">
          {halls.data?.map((h) => (
            <Link key={h.id} to={`/halls/${h.id}`} className="card media-card">
              <img src={sportImage(h.sport?.slug, h.id)} alt="" loading="lazy" />
              <div className="media-body">
              <div className="card-top">
                <span className="tag">{h.sport?.name ?? 'Універсальний'}</span>
                <span className="price-tag">{money(h.pricePerHour)}/год</span>
              </div>
              <h3>{h.name}</h3>
              <p className="muted">{h.center.name}, {h.center.address}</p>
              <p className="small">До {h.capacity} осіб, {h.openHour}:00–{h.closeHour}:00</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
