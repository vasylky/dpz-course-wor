import { Link } from 'react-router-dom';
import { api, type Trainer } from '../api';
import { Loading, useLoad } from '../components/ui';

export default function Trainers() {
  const { data } = useLoad(() => api<Trainer[]>('/catalog/trainers'));
  if (!data) return <Loading />;
  return (
    <>
      <h1>Тренери</h1>
      <div className="grid">
        {data.map((t) => (
          <div key={t.id} className="card">
            <div className="avatar placeholder small">{t.fullName.split(' ').map((p) => p[0]).join('')}</div>
            <h3>{t.fullName}</h3>
            <p className="tag">{t.sport?.name}</p>
            <p>{t.bio}</p>
            <p className="small muted">Досвід: {t.experienceYears} р.</p>
            <Link to={`/catalog?trainerId=${t.id}&sport=${t.sport?.slug ?? ''}`} className="small">Секції</Link>
          </div>
        ))}
      </div>
    </>
  );
}
