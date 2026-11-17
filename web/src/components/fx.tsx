import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

const REVEAL = '.card, .panel, .step, .feature, .sport-tile, .net-center, .trainer-chip, .block-head, .stat-cell, .tier-card';

// scroll reveal for content blocks
export function useReveal(root: React.RefObject<HTMLElement | null>) {
  const { pathname } = useLocation();
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      }),
      { rootMargin: '0px 0px -40px 0px' },
    );
    const scan = () => {
      el.querySelectorAll<HTMLElement>(REVEAL).forEach((n) => {
        if (n.dataset.rv) return;
        n.dataset.rv = '1';
        const idx = n.parentElement ? Array.prototype.indexOf.call(n.parentElement.children, n) : 0;
        n.style.setProperty('--rv-delay', `${Math.min(idx, 8) * 55}ms`);
        n.classList.add('reveal');
        io.observe(n);
      });
    };
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(el, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [root, pathname]);
}

// cursor spotlight on cards
export function useSpotlight() {
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const t = (e.target as HTMLElement | null)?.closest<HTMLElement>('.card, .net-hall, .step, .stat-cell');
      if (!t) return;
      const r = t.getBoundingClientRect();
      t.style.setProperty('--mx', `${e.clientX - r.left}px`);
      t.style.setProperty('--my', `${e.clientY - r.top}px`);
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, []);
}

export function ScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const on = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setP(h > 0 ? window.scrollY / h : 0);
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
    };
  }, []);
  return <div className="scroll-progress" style={{ transform: `scaleX(${p})` }} />;
}

export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 600);
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <button
      type="button"
      className={`to-top${show ? ' show' : ''}`}
      aria-label="Нагору"
      tabIndex={show ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 19V5M5 12l7-7 7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
  );
}

// 3D tilt following the pointer
export function Tilt({ children, className, style, max = 8 }: { children: ReactNode; className?: string; style?: CSSProperties; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className={`tilt ${className ?? ''}`}
      style={style}
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(700px) rotateX(${-y * max}deg) rotateY(${x * max}deg) translateY(-4px)`;
      }}
      onPointerLeave={() => {
        if (ref.current) ref.current.style.transform = '';
      }}
    >
      {children}
    </div>
  );
}

// animated number
export function CountUp({ value, format = (v) => String(v) }: { value: number; format?: (v: number) => string }) {
  const [v, setV] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const step = (now: number) => {
        const k = Math.min(1, (now - start) / 1100);
        setV(Math.round(value * (1 - Math.pow(1 - k, 3))));
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);
  return <span ref={ref}>{format(v)}</span>;
}

// dark band behind the page title
export function usePageBand(main: React.RefObject<HTMLElement | null>, enabled: boolean) {
  const { pathname, search } = useLocation();
  const [height, setHeight] = useState(140);
  useEffect(() => {
    const el = main.current;
    if (!el || !enabled) return;
    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.querySelectorAll('.on-band').forEach((n) => n.classList.remove('on-band'));
        const h1 = el.querySelector('h1');
        const top = el.getBoundingClientRect().top;
        if (!h1 || h1.closest('.panel, .detail') || h1.getBoundingClientRect().top - top > 160) {
          setHeight(140);
          return;
        }
        h1.classList.add('on-band');
        let last: Element = h1;
        const next = h1.nextElementSibling;
        if (next && next.tagName === 'P') {
          next.classList.add('on-band');
          last = next;
        }
        setHeight(Math.round(last.getBoundingClientRect().bottom - top + 34));
      });
    };
    measure();
    const mo = new MutationObserver(measure);
    mo.observe(el, { childList: true, subtree: true });
    window.addEventListener('resize', measure);
    return () => {
      mo.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
    };
  }, [main, enabled, pathname, search]);
  return height;
}
