import { Link } from 'react-router-dom';
import { ISSUE_TYPES, REPORTS } from '../data/city';
import type { CityPulse, CivicReport, Corridor, IssueCategory, TransitArrival, Tone } from '../data/types';
import { CheckGlyph, CountdownRing, NamedGlyph, PowerGlyph, TrafficGlyph, TRAFFIC_LABEL, WaterGlyph, type WeatherCondition } from '../icons';
import type { AppData } from '../state/appData';

/* ---------- Helpers shared by the City screens ---------- */

export const CONDITION_LABEL: Record<WeatherCondition, string> = {
  sunny: 'Sunny',
  partly: 'Partly cloudy',
  cloudy: 'Cloudy',
  rain: 'Rain',
  storm: 'Thunderstorm',
  haze: 'Hazy',
  night: 'Clear night',
};

export const TRAFFIC_TONE: Record<Corridor['level'], Tone> = { 0: 'mint', 1: 'amber', 2: 'peach', 3: 'red' };

export function issueMeta(category: IssueCategory) {
  return ISSUE_TYPES.find((i) => i.id === category) ?? ISSUE_TYPES[0];
}

/** Sample reports plus the ones this person filed. */
export function allReports(data: AppData): CivicReport[] {
  return [...data.myReports, ...REPORTS];
}

export function findReport(id: string, data: AppData) {
  return allReports(data).find((r) => r.id === id);
}

/** Neighbour +1s, counting this person's own +1. */
export function plusOneCount(r: CivicReport, data: AppData) {
  return r.plusOnes + (data.plusOned.includes(r.id) ? 1 : 0);
}

const WATER_LEVEL: Record<CityPulse['water'][number]['status'], number> = {
  'on-schedule': 0.85,
  delayed: 0.55,
  'low-pressure': 0.32,
  'no-supply': 0.06,
};

const WATER_LABEL: Record<CityPulse['water'][number]['status'], { text: string; tone: Tone }> = {
  'on-schedule': { text: 'On schedule', tone: 'mint' },
  delayed: { text: 'Delayed', tone: 'amber' },
  'low-pressure': { text: 'Low pressure', tone: 'amber' },
  'no-supply': { text: 'No supply', tone: 'red' },
};

/** "09:00" minus minutes → "8:56 am". */
export function shiftClock(hhmm: string, deltaMin: number) {
  const [h, m] = hhmm.split(':').map(Number);
  const total = (((h * 60 + m + deltaMin) % 1440) + 1440) % 1440;
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  const suffix = hh >= 12 ? 'pm' : 'am';
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${String(mm).padStart(2, '0')} ${suffix}`;
}

/* ---------- Rows ---------- */

export function CorridorRow({ c }: { c: Corridor }) {
  const delay = c.minutes - c.usual;
  return (
    <div className="list-row">
      <span className={`tile tone-${TRAFFIC_TONE[c.level]}`}>
        <TrafficGlyph level={c.level} size={22} duo title={`${c.name}: ${TRAFFIC_LABEL[c.level]}`} />
      </span>
      <span className="list-row__body">
        <span className="list-row__title">{c.name}</span>
        <span className="list-row__meta">
          {c.stretch}
          {c.cause ? ` · ${c.cause}` : ''}
        </span>
      </span>
      <span className="city-trail">
        <span className="num" style={{ fontSize: '1rem' }}>
          {c.minutes} min
        </span>
        <span className={`badge badge--sm tone-${TRAFFIC_TONE[c.level]}`}>{delay > 0 ? `+${delay} · ${TRAFFIC_LABEL[c.level]}` : TRAFFIC_LABEL[c.level]}</span>
      </span>
    </div>
  );
}

const CROWD_TONE: Record<TransitArrival['crowd'], Tone> = { Light: 'mint', Moderate: 'amber', Busy: 'peach' };
const MODE_GLYPH: Record<TransitArrival['mode'], 'transit' | 'bus'> = { metro: 'transit', brts: 'bus', amts: 'bus' };

export function DepartureRow({ a, linkTo }: { a: TransitArrival; linkTo?: string }) {
  const body = (
    <>
      <span className={`tone-${a.lineTone}`} style={{ display: 'inline-flex' }}>
        <CountdownRing value={a.minutes} max={a.mode === 'metro' ? 8 : 12} size={48} />
      </span>
      <span className="list-row__body">
        <span className="list-row__title row" style={{ gap: 6 }}>
          <span className={`tone-${a.lineTone}`} style={{ display: 'inline-flex', color: 'var(--tone-ink)' }}>
            <NamedGlyph name={MODE_GLYPH[a.mode]} size={16} />
          </span>
          {a.line} → {a.towards}
        </span>
        <span className="list-row__meta">
          {a.stop} · {a.walkMin} min walk
        </span>
      </span>
      <span className={`badge badge--sm tone-${CROWD_TONE[a.crowd]}`}>{a.crowd}</span>
    </>
  );
  return linkTo ? (
    <Link to={linkTo} className="list-row">
      {body}
    </Link>
  ) : (
    <div className="list-row">{body}</div>
  );
}

export function WaterRow({ w }: { w: CityPulse['water'][number] }) {
  const label = WATER_LABEL[w.status];
  return (
    <div className="list-row">
      <span className="tile tone-blue">
        <WaterGlyph level={WATER_LEVEL[w.status]} size={22} title={`${w.ward} water: ${label.text}`} />
      </span>
      <span className="list-row__body">
        <span className="list-row__title">{w.ward}</span>
        <span className="list-row__meta">
          {w.slot}
          {w.note ? ` · ${w.note}` : ''}
        </span>
      </span>
      <span className={`badge badge--sm tone-${label.tone}`}>{label.text}</span>
    </div>
  );
}

const POWER_LABEL: Record<CityPulse['power'][number]['status'], { text: string; tone: Tone }> = {
  scheduled: { text: 'Planned', tone: 'amber' },
  outage: { text: 'Outage', tone: 'red' },
  restored: { text: 'Restored', tone: 'mint' },
};

export function PowerRow({ p }: { p: CityPulse['power'][number] }) {
  const label = POWER_LABEL[p.status];
  return (
    <div className="list-row">
      <span className="tile tone-yellow">
        <PowerGlyph status={p.status === 'restored' ? 'ok' : p.status} size={22} duo title={`${p.area}: ${label.text}`} />
      </span>
      <span className="list-row__body">
        <span className="list-row__title">{p.area}</span>
        <span className="list-row__meta">
          {p.window} · {p.reason}
        </span>
      </span>
      <span className={`badge badge--sm tone-${label.tone}`}>{label.text}</span>
    </div>
  );
}

export function ParkingRow({ p }: { p: CityPulse['parking'][number] }) {
  const share = p.free / p.total;
  const tone: Tone = share > 0.25 ? 'mint' : share > 0.08 ? 'amber' : 'red';
  return (
    <div className="list-row">
      <span className="tile tone-violet">
        <NamedGlyph name="parking" size={20} duo />
      </span>
      <span className="list-row__body">
        <span className="list-row__title">{p.name}</span>
        <span className="list-row__meta">{p.area}</span>
        <span className={`progress tone-${tone}`} style={{ height: 6, marginTop: 4 }} role="img" aria-label={`${p.free} of ${p.total} spaces free`}>
          <span style={{ width: `${Math.max(4, share * 100)}%`, background: 'var(--tone-dot)' }} />
        </span>
      </span>
      <span className="city-trail">
        <span className="num" style={{ fontSize: '1rem' }}>
          {p.free}
        </span>
        <span className="meta">free</span>
      </span>
    </div>
  );
}

/* ---------- Sparkline ---------- */

export function Sparkline({ values, label, width = 140, height = 40 }: { values: number[]; label: string; width?: number; height?: number }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 4;
  const pts = values.map((v, i) => [pad + (i * (width - pad * 2)) / (values.length - 1), pad + (1 - (v - min) / span) * (height - pad * 2)] as const);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)} ${height} L${pts[0][0].toFixed(1)} ${height} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className="sparkline">
      <path d={area} fill="var(--accent)" opacity="0.1" />
      <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2" />
    </svg>
  );
}

/* ---------- Vertical timeline ---------- */

export interface TimelineItem {
  title: string;
  time?: string;
  note?: string;
  state: 'done' | 'current' | 'pending';
}

export function Timeline({ items, label }: { items: TimelineItem[]; label: string }) {
  return (
    <ol className="timeline" aria-label={label}>
      {items.map((it, i) => (
        <li key={i} className={`timeline__item is-${it.state}`}>
          <span className="timeline__dot" aria-hidden="true">
            {it.state === 'done' ? <CheckGlyph size={12} /> : null}
          </span>
          <span className="stack" style={{ gap: 2 }}>
            <span className="strong" style={{ fontSize: '0.90625rem' }}>
              {it.title}
              {it.state === 'current' ? <span className="sr-only"> (next step)</span> : null}
            </span>
            {it.time || it.note ? (
              <span className="meta">
                {[it.time, it.note].filter(Boolean).join(' · ')}
              </span>
            ) : null}
          </span>
        </li>
      ))}
    </ol>
  );
}
