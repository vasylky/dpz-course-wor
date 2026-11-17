import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { Card, PriceLine } from '../api';
import { money } from '../labels';

export function useLoad<T>(load: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(load, deps);
  const reload = useCallback(() => {
    setLoading(true);
    return run()
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [run]);
  useEffect(() => {
    void reload();
  }, [reload]);
  return { data, error, loading, reload, setData };
}

export const Alert = ({ kind = 'error', children }: { kind?: 'error' | 'success' | 'info'; children: ReactNode }) =>
  children ? <div className={`alert alert-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>{children}</div> : null;

export const Loading = () => <p className="muted">Завантаження...</p>;

export function PriceBreakdown({ lines, total }: { lines: PriceLine[]; total: number }) {
  return (
    <table className="price">
      <tbody>
        {lines.map((l, i) => (
          <tr key={i}>
            <td>{l.label}</td>
            <td className={l.amount < 0 ? 'discount' : ''}>{l.amount > 0 && i > 0 ? '+' : ''}{money(l.amount)}</td>
          </tr>
        ))}
        <tr className="total">
          <td>До сплати</td>
          <td data-testid="price-total">{money(total)}</td>
        </tr>
      </tbody>
    </table>
  );
}

export const TEST_CARD: Card = { number: '4242 4242 4242 4242', holder: 'TEST USER', expiry: '12/29', cvc: '123' };

export function CardForm({ submitLabel, onSubmit, busy }: { submitLabel: string; onSubmit: (c: Card) => void; busy?: boolean }) {
  const [card, setCard] = useState<Card>(TEST_CARD);
  const set = (k: keyof Card) => (e: React.ChangeEvent<HTMLInputElement>) => setCard({ ...card, [k]: e.target.value });
  return (
    <form
      className="card-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(card);
      }}
    >
      <label>
        Номер картки
        <input value={card.number} onChange={set('number')} inputMode="numeric" required />
      </label>
      <label>
        Власник
        <input value={card.holder} onChange={set('holder')} required />
      </label>
      <div className="row">
        <label>
          Термін дії
          <input value={card.expiry} onChange={set('expiry')} placeholder="MM/YY" required />
        </label>
        <label>
          CVC
          <input value={card.cvc} onChange={set('cvc')} required />
        </label>
      </div>
      <p className="hint">Тестові картки: 4242 4242 4242 4242 успішна, 4000 0000 0000 0002 відхиляється.</p>
      <button className="btn primary" disabled={busy}>{busy ? 'Обробка...' : submitLabel}</button>
    </form>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: [T, string][]; value: T; onChange: (t: T) => void }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map(([k, label]) => (
        <button key={k} role="tab" aria-selected={value === k} className={value === k ? 'active' : ''} onClick={() => onChange(k)}>
          {label}
        </button>
      ))}
    </div>
  );
}
