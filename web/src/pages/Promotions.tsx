import { api, type Promotion } from '../api';
import { Loading, useLoad } from '../components/ui';
import { fmtDate } from '../labels';

export default function Promotions() {
  const { data } = useLoad(() => api<Promotion[]>('/promotions'));
  if (!data) return <Loading />;
  return (
    <>
      <h1>Акції</h1>
      {data.length === 0 && <p className="muted">Активних акцій немає.</p>}
      <div className="grid">
        {data.map((p) => (
          <div key={p.id} className="card promo">
            <h3>{p.title}</h3>
            <p>{p.description}</p>
            {p.validTo && <p className="small muted">До {fmtDate(p.validTo)}</p>}
          </div>
        ))}
      </div>
    </>
  );
}
