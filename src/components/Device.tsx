import { useEffect, useState, type CSSProperties } from 'react';
import { photo } from '../assets/photos';
import { Logo, Wordmark } from '../icons';

/* Presentation chrome. On desktop the app sits in a phone with a live status
   bar; on phones these render nothing visible (see .device rules in components.css). */

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);
  return now.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\s?[ap]m$/i, '');
}

export function StatusBar() {
  const time = useClock();
  return (
    <div className="status-bar" aria-hidden="true">
      <span>{time}</span>
      <span className="status-bar__icons">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor">
          <rect x="0" y="8" width="3" height="4" rx="1" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
          <rect x="10" y="3" width="3" height="9" rx="1" />
          <rect x="15" y="0" width="3" height="12" rx="1" />
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
          <path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.3-1.4A10.3 10.3 0 0 0 8 .3 10.3 10.3 0 0 0 .7 3.2L2 4.6a8.4 8.4 0 0 1 6-2.4zm0 3.6c1.3 0 2.5.5 3.4 1.3l1.3-1.4A7 7 0 0 0 8 3.9a7 7 0 0 0-4.7 1.8l1.3 1.4A5 5 0 0 1 8 5.8zm0 3.5a1.5 1.5 0 0 0-1.1.5L8 11.6l1.1-1.8A1.5 1.5 0 0 0 8 9.3z" />
        </svg>
        <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
          <rect x="0.5" y="0.5" width="22" height="12" rx="3.5" stroke="currentColor" opacity=".45" />
          <rect x="2" y="2" width="17" height="9" rx="2.2" fill="currentColor" />
          <path d="M24.5 4.5v4c.9-.3 1.5-1.1 1.5-2s-.6-1.7-1.5-2z" fill="currentColor" opacity=".45" />
        </svg>
      </span>
    </div>
  );
}

const SPLASH_KEY = 'nearhood.splash.v2';

/** Faces and places that drift in around the mark: the city, a little closer. */
const ORBIT: Array<{ key: string; x: number; y: number; size: number; round?: boolean }> = [
  { key: 'person-riya', x: -118, y: -214, size: 62, round: true },
  { key: 'place-quiet-cup', x: 112, y: -236, size: 76 },
  { key: 'person-karan', x: 146, y: -96, size: 50, round: true },
  { key: 'dish-cold-brew', x: -150, y: -52, size: 58 },
  { key: 'event-rooftop-acoustic', x: -118, y: 196, size: 72 },
  { key: 'person-aditi', x: 128, y: 214, size: 58, round: true },
  { key: 'place-vastrapur-lake', x: 8, y: 300, size: 48 },
];

/** Brand splash: the arch draws itself, the lime dot drops in, then it fades. Once per visit. */
export function Splash() {
  const [show] = useState(() => {
    try {
      if (sessionStorage.getItem(SPLASH_KEY)) return false;
      sessionStorage.setItem(SPLASH_KEY, '1');
    } catch {
      /* no session storage: show once per load */
    }
    return true;
  });
  const [gone, setGone] = useState(false);
  useEffect(() => {
    if (!show) return;
    const id = window.setTimeout(() => setGone(true), 2300);
    return () => window.clearTimeout(id);
  }, [show]);
  if (!show || gone) return null;
  return (
    <div className="splash" role="presentation">
      <span className="splash__orbit" aria-hidden="true">
        {ORBIT.map((o, i) => (
          <img
            key={o.key}
            src={photo(o.key)}
            alt=""
            className={`splash__photo${o.round ? ' splash__photo--round' : ''}`}
            style={{ '--x': `${o.x}px`, '--y': `${o.y}px`, width: o.size, height: o.size, animationDelay: `${0.15 + i * 0.07}s` } as CSSProperties}
          />
        ))}
      </span>
      <Logo size={96} />
      <Wordmark size={40} />
      <p className="splash__tag">A little closer to your city.</p>
      <span className="splash__dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </div>
  );
}

const SWATCHES = [
  { name: 'Porcelain', hex: '#F7F7F2' },
  { name: 'Ink', hex: '#1D2330' },
  { name: 'Violet', hex: '#6C52EE' },
  { name: 'Lime', hex: '#DFFF8A' },
];

/** Brand notes beside the phone on wide screens. */
export function StageCaption({ side }: { side: 'left' | 'right' }) {
  if (side === 'left') {
    return (
      <aside className="stage-caption" aria-label="About this preview">
        <span className="row" style={{ gap: 12 }}>
          <Logo size={44} animated={false} />
          <Wordmark size={34} />
        </span>
        <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: 'var(--muted)' }}>A little closer to your city.</p>
        <p className="body-sm muted" style={{ margin: 0 }}>
          A working prototype for Ahmedabad. Tap around: every screen, setting and flow is live, with sample content.
        </p>
      </aside>
    );
  }
  return (
    <aside className="stage-caption stage-caption--right" aria-label="Brand palette">
      <span className="eyebrow muted">Colours</span>
      <span className="stage-swatches">
        {SWATCHES.map((s) => (
          <span key={s.name} className="stage-swatch">
            <span style={{ background: s.hex }} />
            <b>{s.name}</b>
            <small>{s.hex}</small>
          </span>
        ))}
      </span>
      <span className="eyebrow muted" style={{ marginTop: 8 }}>
        Typography
      </span>
      <span className="row" style={{ gap: 14, alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '3rem', letterSpacing: '-0.04em', lineHeight: 1 }}>Aa</span>
        <span className="stack" style={{ gap: 2 }}>
          <b style={{ fontFamily: 'var(--font-display)' }}>Plus Jakarta Sans</b>
          <span className="meta">Manrope for body text</span>
        </span>
      </span>
    </aside>
  );
}
