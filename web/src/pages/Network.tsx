import { Link } from 'react-router-dom';
import { api } from '../api';
import { Loading, useLoad } from '../components/ui';
import { centerImage, money } from '../labels';

interface Node {
  kind: 'network' | 'center' | 'hall' | 'section';
  id: number | null;
  name: string;
  details: string;
  sectionCount: number;
  capacity: number;
  minPrice: number | null;
  children: Node[];
}

function HallCard({ hall }: { hall: Node }) {
  return (
    <div className="net-hall">
      <div className="net-hall-head">
        <Link to={`/halls/${hall.id}`} className="net-hall-name">{hall.name}</Link>
        {hall.minPrice !== null && <span className="tag">від {money(hall.minPrice)}</span>}
      </div>
      <p className="small muted">{hall.details}</p>
      {hall.children.length > 0 ? (
        <ul className="net-sections">
          {hall.children.map((s) => (
            <li key={s.id}>
              <Link to={`/sections/${s.id}`}>{s.name}</Link>
              <span className="small muted">{s.details}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="small muted">Лише оренда</p>
      )}
    </div>
  );
}

function CenterCard({ center }: { center: Node }) {
  return (
    <article className="net-center panel">
      <div className="net-center-top">
        <img src={centerImage(center.id ?? 1)} alt={center.name} />
        <div>
          <h2>{center.name}</h2>
          <p className="muted">{center.details}</p>
          <div className="net-figures">
            <span><b>{center.children.length}</b> залів</span>
            <span><b>{center.sectionCount}</b> секцій</span>
            <span><b>{center.capacity}</b> місць</span>
            {center.minPrice !== null && <span>від <b>{money(center.minPrice)}</b></span>}
          </div>
        </div>
      </div>
      <div className="net-halls">
        {center.children.map((h) => <HallCard key={h.id} hall={h} />)}
      </div>
    </article>
  );
}

export default function Network() {
  const { data } = useLoad(() => api<Node>('/catalog/structure'));
  if (!data) return <Loading />;
  const halls = data.children.reduce((n, c) => n + c.children.length, 0);
  return (
    <div data-testid="network-tree">
      <h1>Мережа центрів</h1>
      <p className="muted">{data.name}: зали та секції в кожному центрі.</p>
      <div className="net-summary">
        <div><b>{data.children.length}</b><span>центри</span></div>
        <div><b>{halls}</b><span>залів</span></div>
        <div><b>{data.sectionCount}</b><span>секцій</span></div>
        <div><b>{data.capacity}</b><span>місць у групах</span></div>
      </div>
      {data.children.map((c) => <CenterCard key={c.id} center={c} />)}
    </div>
  );
}
