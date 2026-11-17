import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { api } from './api';
import { useAuth } from './auth';
import { BackToTop, ScrollProgress, usePageBand, useReveal, useSpotlight } from './components/fx';
import Admin from './pages/Admin';
import BookingPage from './pages/BookingPage';
import Cabinet from './pages/Cabinet';
import Catalog from './pages/Catalog';
import HallPage from './pages/HallPage';
import Landing from './pages/Landing';
import { Login, Register } from './pages/Login';
import Network from './pages/Network';
import Promotions from './pages/Promotions';
import SectionPage from './pages/SectionPage';
import Trainers from './pages/Trainers';

function Bell() {
  const [count, setCount] = useState(0);
  const location = useLocation();
  useEffect(() => {
    let alive = true;
    const load = () => api<{ count: number }>('/notifications/unread').then((r) => alive && setCount(r.count)).catch(() => {});
    load();
    const t = setInterval(load, 20000);
    window.addEventListener('notifications', load);
    return () => {
      alive = false;
      clearInterval(t);
      window.removeEventListener('notifications', load);
    };
  }, [location.pathname, location.search]);
  return (
    <Link to="/cabinet?tab=notifications" className="bell" aria-label={`Сповіщення: ${count}`}>
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Zm4 4h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      <span className="bell-text">Сповіщення</span>
      {count > 0 && <span className="badge" data-testid="unread-count">{count}</span>}
    </Link>
  );
}

function RequireAuth({ children, admin }: { children: ReactNode; admin?: boolean }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return null;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

const MENU = [
  { to: '/catalog', label: 'Секції', note: 'Заняття із тренером', img: '/img/yoga.jpg' },
  { to: '/catalog?tab=halls', label: 'Оренда залів', note: 'Зал на потрібну годину', img: '/img/football.jpg' },
  { to: '/network', label: 'Центри', note: 'Мережа у Львові та Києві', img: '/img/interior.jpg' },
  { to: '/trainers', label: 'Тренери', note: 'Досвід від 4 до 11 років', img: '/img/boxing.jpg' },
  { to: '/promotions', label: 'Акції', note: 'Знижки та бонуси', img: '/img/swimming.jpg' },
];

function MenuOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, logout } = useAuth();
  const [hover, setHover] = useState(0);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', key);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', key);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
  const items = [
    ...MENU,
    ...(user ? [{ to: '/cabinet', label: 'Кабінет', note: 'Бронювання, абонементи, бонуси', img: '/img/fitness.jpg' }] : []),
    ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Адмін-панель', note: 'Керування мережею', img: '/img/group.jpg' }] : []),
  ];
  return (
    <div className={`menu-overlay${open ? ' open' : ''}`} aria-hidden={!open} inert={!open}>
      <div className="menu-media">
        {items.map((m, i) => (
          <img key={m.to} src={m.img} alt="" className={i === hover ? 'on' : ''} />
        ))}
      </div>
      <div className="menu-body">
        <nav className="menu-links">
          {items.map((m, i) => (
            <Link key={m.to} to={m.to} onClick={onClose} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} style={{ '--i': i } as React.CSSProperties}>
              <span className="menu-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="menu-label">{m.label}</span>
              <span className="menu-note">{m.note}</span>
            </Link>
          ))}
        </nav>
        <div className="menu-foot">
          <div>
            <p className="menu-cap">Графік</p>
            <p>Щодня 7:00–23:00</p>
          </div>
          <div>
            <p className="menu-cap">Телефон</p>
            <p>+380 32 000 00 00</p>
          </div>
          <div>
            {user ? (
              <button className="btn lime" onClick={() => { logout(); onClose(); }}>Вийти з акаунта</button>
            ) : (
              <Link to="/register" className="btn lime" onClick={onClose}>Приєднатися</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  useReveal(mainRef);
  useSpotlight();
  const band = usePageBand(mainRef, !isLanding);

  useEffect(() => {
    setMenu(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 10);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  return (
    <>
      <div className="bg-fx" aria-hidden="true"><i /><i /><i /></div>
      <header className={`topbar${scrolled || !isLanding ? ' solid' : ''}${isLanding ? ' over' : ''}${menu ? ' menu-open' : ''}`}>
        <div className="container topbar-inner">
          <Link to="/" className="logo"><span className="logo-mark" />Арена</Link>
          <nav className="main-nav">
            <NavLink to="/catalog">Каталог</NavLink>
            <NavLink to="/network">Мережа</NavLink>
            <NavLink to="/trainers">Тренери</NavLink>
            <NavLink to="/promotions">Акції</NavLink>
            {user && <NavLink to="/cabinet">Кабінет</NavLink>}
            {user?.role === 'admin' && <NavLink to="/admin">Адмін</NavLink>}
          </nav>
          <div className="user-box">
            {user ? (
              <>
                <Bell />
                <span className="user-chip"><span className="user-dot">{user.fullName.split(' ').map((p) => p[0]).slice(0, 2).join('')}</span><span className="user-name">{user.fullName}</span></span>
                <button className="btn link" onClick={logout}>Вийти</button>
              </>
            ) : (
              <>
                <NavLink to="/login">Увійти</NavLink>
                <NavLink to="/register" className="btn primary small">Реєстрація</NavLink>
              </>
            )}
            <button type="button" className={`burger${menu ? ' open' : ''}`} aria-label="Меню" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
              <span /><span /><span />
            </button>
          </div>
        </div>
        <ScrollProgress />
      </header>
      <MenuOverlay open={menu} onClose={() => setMenu(false)} />
      <div className="page-wrap">
        {!isLanding && <div className="page-band" style={{ height: band }} aria-hidden="true" />}
        <main ref={mainRef} key={location.pathname} className={isLanding ? 'page-anim' : 'container page-anim inner'}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/sections/:id" element={<SectionPage />} />
            <Route path="/halls/:id" element={<HallPage />} />
            <Route path="/network" element={<Network />} />
            <Route path="/trainers" element={<Trainers />} />
            <Route path="/promotions" element={<Promotions />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/bookings/:id" element={<RequireAuth><BookingPage /></RequireAuth>} />
            <Route path="/cabinet" element={<RequireAuth><Cabinet /></RequireAuth>} />
            <Route path="/admin" element={<RequireAuth admin><Admin /></RequireAuth>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <footer className="footer">
        <div className="container footer-inner">
          <div>
            <strong className="logo"><span className="logo-mark" />Арена</strong>
            <p className="small muted">Мережа спортивних центрів. Львів, Київ.</p>
          </div>
          <nav className="small">
            <Link to="/catalog">Секції</Link>
            <Link to="/catalog?tab=halls">Оренда залів</Link>
            <Link to="/network">Центри</Link>
            <Link to="/trainers">Тренери</Link>
            <Link to="/promotions">Акції</Link>
          </nav>
          <p className="small muted">Щодня 7:00–23:00<br />+380 32 000 00 00</p>
        </div>
        <div className="footer-giant" aria-hidden="true">АРЕНА</div>
      </footer>
      <BackToTop />
    </>
  );
}
