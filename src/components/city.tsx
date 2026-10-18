import { Link } from 'react-router-dom';
import { ALERT_KIND_META, ISSUE_TYPES, REPORTS } from '../data/city';
import { SOURCES } from '../data/core';
import type { CityAlert, CityPulse, CivicReport, Corridor, IssueCategory, Tone } from '../data/types';
import { useT } from '../i18n';
import {
  AlertGlyph,
  CheckGlyph,
  ChevronRightGlyph,
  NamedGlyph,
  PowerGlyph,
  ShieldGlyph,
  TrafficGlyph,
  TRAFFIC_LABEL,
  WaterGlyph,
  type WeatherCondition,
} from '../icons';
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

export const SEVERITY_TONE: Record<CityAlert['severity'], Tone> = { info: 'teal', advisory: 'amber', warning: 'peach', critical: 'red' };

/** A city update as a flat row: tinted round icon, kind and age, title, source. */
export function AlertRow({ alert }: { alert: CityAlert }) {
  const t = useT();
  const tone = SEVERITY_TONE[alert.severity];
  const kind = ALERT_KIND_META[alert.kind];
  return (
    <Link to={`/city/alerts/${alert.id}`} className={`list-row alert-row glyph-host tone-${tone}`}>
      <span className="alert-row__icon">
        {alert.kind === 'safety' ? (
          <ShieldGlyph size={18} duo />
        ) : alert.severity === 'info' ? (
          <NamedGlyph name={kind.glyph} size={18} duo />
        ) : (
          <AlertGlyph size={18} live={alert.active} duo />
        )}
      </span>
      <span className="list-row__body">
        <span className="alert-row__eyebrow">
          {kind.label} · {alert.ago}
        </span>
        <span className="list-row__title">{alert.title}</span>
        <span className="list-row__meta">
          {SOURCES[alert.source].label}
          {alert.verified ? ` · ${t('common.verified')}` : ''}
        </span>
      </span>
      <ChevronRightGlyph size={16} style={{ color: 'var(--muted)', flexShrink: 0 }} />
    </Link>
  );
}

export function CorridorRow({ c }: { c: Corridor }) {
  const delay = c.minutes - c.usual;
  return (
    <div className="list-row">
      <span className={`city-card__icon city-card__icon--sm tone-${TRAFFIC_TONE[c.level]}`}>
        <TrafficGlyph level={c.level} size={19} duo title={`${c.name}: ${TRAFFIC_LABEL[c.level]}`} />
      </span>
      <span className="list-row__body">
        <span className="list-row__title">{c.name}</span>
        <span className="list-row__meta">
          {c.stretch}
          {c.cause ? ` · ${c.cause}` : ''}
        </span>
      </span>
      <span className="city-trail">
        <span className="num" style={{ fontSize: '0.9375rem' }}>
          {c.minutes} min
        </span>
        <span className={`badge badge--sm tone-${TRAFFIC_TONE[c.level]}`}>{delay > 0 ? `+${delay} · ${TRAFFIC_LABEL[c.level]}` : TRAFFIC_LABEL[c.level]}</span>
      </span>
    </div>
  );
}

export function WaterRow({ w }: { w: CityPulse['water'][number] }) {
  const label = WATER_LABEL[w.status];
  return (
    <div className="list-row">
      <span className="city-card__icon city-card__icon--sm tone-blue">
        <WaterGlyph level={WATER_LEVEL[w.status]} size={19} title={`${w.ward} water: ${label.text}`} />
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
      <span className="city-card__icon city-card__icon--sm tone-yellow">
        <PowerGlyph status={p.status === 'restored' ? 'ok' : p.status} size={19} duo title={`${p.area}: ${label.text}`} />
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
      <span className="city-card__icon city-card__icon--sm tone-violet">
        <NamedGlyph name="parking" size={18} duo />
      </span>
      <span className="list-row__body">
        <span className="list-row__title">{p.name}</span>
        <span className="list-row__meta">{p.area}</span>
        <span className={`progress tone-${tone}`} style={{ height: 6, marginTop: 4 }} role="img" aria-label={`${p.free} of ${p.total} spaces free`}>
          <span style={{ width: `${Math.max(4, share * 100)}%`, background: 'var(--tone-dot)' }} />
        </span>
      </span>
      <span className="city-trail">
        <span className="num" style={{ fontSize: '0.9375rem' }}>
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
