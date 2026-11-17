import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth';
import { Alert } from '../components/ui';

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  return (
    <div className="auth-box panel">
      <h1>Вхід</h1>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            const user = await login(email, password);
            nav(params.get('next') ?? (user.role === 'admin' ? '/admin' : '/cabinet'));
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      >
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Пароль<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        <Alert>{error}</Alert>
        <button className="btn primary">Увійти</button>
      </form>
      <p className="muted">Немає акаунта? <Link to="/register">Зареєструватися</Link></p>
      <p className="hint">Демо: user@sport.local / user123, premium@sport.local / premium123, admin@sport.local / admin123</p>
    </div>
  );
}

export function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });
  return (
    <div className="auth-box panel">
      <h1>Реєстрація</h1>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await register({ ...form, phone: form.phone || undefined });
            nav('/cabinet');
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      >
        <label>ПІБ<input value={form.fullName} onChange={set('fullName')} required /></label>
        <label>Email<input type="email" value={form.email} onChange={set('email')} required /></label>
        <label>Телефон<input value={form.phone} onChange={set('phone')} /></label>
        <label>Пароль<input type="password" value={form.password} onChange={set('password')} minLength={6} required /></label>
        <Alert>{error}</Alert>
        <button className="btn primary">Створити акаунт</button>
      </form>
    </div>
  );
}
