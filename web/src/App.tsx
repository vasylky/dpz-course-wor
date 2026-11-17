import { useEffect, useState, type ReactNode } from 'react';
import { Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { api } from './api';
import { useAuth } from './auth';
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
      Сповіщення{count > 0 && <span className="badge" data-testid="unread-count">{count}</span>}
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

export default function App() {
  const { user, logout } = useAuth();
  const isLanding = useLocation().pathname === '/';
  return (
    <>
      <header className="topbar">
        <div className="container topbar-inner">
          <Link to="/" className="logo">Арена</Link>
          <nav>
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
                <span className="muted">{user.fullName}</span>
                <button className="btn link" onClick={logout}>Вийти</button>
              </>
            ) : (
              <>
                <NavLink to="/login">Увійти</NavLink>
                <NavLink to="/register" className="btn primary small">Реєстрація</NavLink>
              </>
            )}
          </div>
        </div>
      </header>
      <main className={isLanding ? '' : 'container'}>
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
      <footer className="footer">
        <div className="container footer-inner">
          <div>
            <strong className="logo">Арена</strong>
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
      </footer>
    </>
  );
}
