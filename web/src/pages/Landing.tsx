import { Link } from 'react-router-dom';
import { api, type Center, type LoyaltyCard, type Promotion, type Sport, type Trainer } from '../api';
import { useAuth } from '../auth';
import { useLoad } from '../components/ui';
import { centerImage, fmtDate, money, sportImage } from '../labels';

interface Structure { sectionCount: number; capacity: number; minPrice: number | null; children: { id: number }[] }

const FEATURES = [
  { title: 'Онлайн-бронювання', text: 'Місце на занятті або зал на потрібну годину за хвилину, без дзвінків і черг.' },
  { title: 'Прозора ціна', text: 'Перед оплатою видно кожну складову: тариф, знижку картки, абонемент і бонуси.' },
  { title: 'Абонементи', text: 'Разовий, місячний безліміт або корпоративний пакет для команди.' },
  { title: 'Бонуси за кожне тренування', text: 'Бали нараховуються після оплати і покривають до половини наступного бронювання.' },
  { title: 'Нагадування', text: 'Сповіщення перед тренуванням, про нові секції та акції у вашому кабінеті.' },
  { title: 'Професійні тренери', text: 'Тренери з досвідом від 4 до 11 років для дітей, дорослих і груп 55+.' },
];

const STEPS = [
  ['Оберіть заняття', 'Фільтруйте секції за видом спорту, рівнем і віком або оберіть зал.'],
  ['Забронюйте час', 'Вкажіть зручне заняття чи годину і перевірте вартість.'],
  ['Оплатіть онлайн', 'Підтвердження та бонуси приходять одразу після оплати.'],
];

export default function Landing() {
  const { user } = useAuth();
  const sports = useLoad(() => api<Sport[]>('/catalog/sports'));
  const centers = useLoad(() => api<Center[]>('/catalog/centers'));
  const structure = useLoad(() => api<Structure>('/catalog/structure'));
  const trainers = useLoad(() => api<Trainer[]>('/catalog/trainers'));
  const cards = useLoad(() => api<LoyaltyCard[]>('/loyalty/cards'));
  const promos = useLoad(() => api<Promotion[]>('/promotions'));

  return (
    <div className="landing">
      <section className="landing-hero" style={{ backgroundImage: 'url(/img/hero.jpg)' }}>
        <div className="container hero-content">
          <p className="eyebrow">Мережа спортивних центрів</p>
          <h1>Тренуйтеся там, де зручно, і тоді, коли зручно</h1>
          <p className="lead">Футбол, йога, фітнес, плавання та бокс у центрах Львова і Києва. Бронюйте заняття із тренером або орендуйте зал онлайн.</p>
          <div className="hero-actions">
            <Link to="/catalog" className="btn primary big">Обрати секцію</Link>
            <Link to="/catalog?tab=halls" className="btn ghost big">Орендувати зал</Link>
          </div>
        </div>
      </section>

      <div className="container">
        <section className="stats-strip" data-testid="landing-stats">
          <div><strong>{structure.data?.children.length ?? '–'}</strong><span>центри</span></div>
          <div><strong>{structure.data?.sectionCount ?? '–'}</strong><span>секцій</span></div>
          <div><strong>{trainers.data?.length ?? '–'}</strong><span>тренерів</span></div>
          <div><strong>{structure.data?.minPrice ? money(structure.data.minPrice) : '–'}</strong><span>заняття від</span></div>
        </section>

        <section className="block">
          <div className="block-head">
            <h2>Напрями</h2>
            <Link to="/catalog">Усі секції</Link>
          </div>
          <div className="sport-grid">
            {sports.data?.map((s) => (
              <Link key={s.id} to={`/catalog?sport=${s.slug}`} className="sport-tile" style={{ backgroundImage: `url(${sportImage(s.slug)})` }}>
                <span>{s.name}</span>
                {s.premiumIncluded && <em>Безкоштовно з Преміум</em>}
              </Link>
            ))}
          </div>
        </section>

        <section className="block split">
          <img src="/img/group.jpg" alt="Групове заняття" className="split-img" />
          <div>
            <h2>Чому Арена</h2>
            <div className="features">
              {FEATURES.map((f) => (
                <div key={f.title} className="feature">
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="block">
          <h2>Як це працює</h2>
          <div className="steps">
            {STEPS.map(([title, text], i) => (
              <div key={title} className="step">
                <span className="step-num">{i + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="block">
          <div className="block-head">
            <h2>Наші центри</h2>
            <Link to="/network">Структура мережі</Link>
          </div>
          <div className="grid">
            {centers.data?.map((c) => (
              <div key={c.id} className="card media-card">
                <img src={centerImage(c.id)} alt={c.name} />
                <div className="media-body">
                  <h3>{c.name}</h3>
                  <p className="muted">{c.city}, {c.address}</p>
                  <p className="small">{c.description}</p>
                  <Link to={`/catalog?centerId=${c.id}`} className="small">Секції центру</Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="block">
          <div className="block-head">
            <h2>Картки лояльності</h2>
            <Link to={user ? '/cabinet?tab=loyalty' : '/register'}>{user ? 'Моя картка' : 'Отримати картку'}</Link>
          </div>
          <div className="grid">
            {cards.data?.map((c) => (
              <div key={c.tier} className={`card tier-card tier-${c.tier}`}>
                <h3>{c.title}</h3>
                <p className="price-tag big">{c.price ? money(c.price) : 'Безкоштовно'}</p>
                <ul>{c.perks.map((p) => <li key={p}>{p}</li>)}</ul>
              </div>
            ))}
          </div>
        </section>

        <section className="block">
          <div className="block-head">
            <h2>Тренери</h2>
            <Link to="/trainers">Усі тренери</Link>
          </div>
          <div className="trainer-row">
            {trainers.data?.slice(0, 6).map((t) => (
              <div key={t.id} className="trainer-chip">
                <div className="avatar placeholder small">{t.fullName.split(' ').map((p) => p[0]).join('')}</div>
                <div>
                  <strong>{t.fullName}</strong>
                  <p className="small muted">{t.sport?.name}, {t.experienceYears} р.</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {promos.data && promos.data.length > 0 && (
          <section className="block">
            <div className="block-head">
              <h2>Акції</h2>
              <Link to="/promotions">Усі акції</Link>
            </div>
            <div className="grid">
              {promos.data.slice(0, 3).map((p) => (
                <div key={p.id} className="card promo">
                  <h3>{p.title}</h3>
                  <p>{p.description}</p>
                  {p.validTo && <p className="small muted">До {fmtDate(p.validTo)}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="cta" style={{ backgroundImage: 'url(/img/training.jpg)' }}>
          <div>
            <h2>Перше тренування вже цього тижня</h2>
            <p>Зареєструйтеся, оберіть заняття і отримайте бонуси за перше бронювання.</p>
            <Link to={user ? '/catalog' : '/register'} className="btn primary big">{user ? 'До каталогу' : 'Створити акаунт'}</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
