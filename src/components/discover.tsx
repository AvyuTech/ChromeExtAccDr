import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { groupPhoto } from '../assets/photos';
import { EMERGENCY, FACILITIES, ISSUE_TYPES, REPORT_STEPS, reportById, SERVICES } from '../data/city';
import { eventById } from '../data/events';
import { placeById } from '../data/places';
import { dealById, groupById, postById } from '../data/social';
import { alertById } from '../data/city';
import type { CityEvent, CityPulse, Corridor, Group, Tone, TransitArrival } from '../data/types';
import { ChevronRightGlyph, CountdownRing, NamedGlyph, PhoneGlyph, TrafficGlyph } from '../icons';
import { TRAFFIC_LABEL } from '../icons/live';
import type { ResultRef } from '../lib/askEngine';
import { compact, km, rupees } from '../lib/format';
import { AlertCard, Cover, DealCard, EventRow, GroupRow, PlaceRow, PostCard } from './cards';
import { CheckInCard } from './friends';
import { checkInById } from '../data/friends';
import { useAppData } from '../state/appData';
import { useToast } from '../state/toast';
import { useT } from '../i18n';
import { LinkRow, Tile } from './ui';

/* ---------- Rows for live city results ---------- */

const TRAFFIC_TONE: Record<number, Tone> = { 0: 'mint', 1: 'amber', 2: 'peach', 3: 'red' };

export function CorridorRow({ corridor }: { corridor: Corridor }) {
  const slower = corridor.minutes - corridor.usual;
  return (
    <Link to="/city/transit" className="list-row">
      <span className={`tile tone-${TRAFFIC_TONE[corridor.level]}`}>
        <TrafficGlyph level={corridor.level} size={22} />
      </span>
      <span className="list-row__body">
        <span className="list-row__title">{corridor.name}</span>
        <span className="list-row__meta">
          {corridor.stretch} · {TRAFFIC_LABEL[corridor.level]}
        </span>
      </span>
      <span className="stack" style={{ gap: 1, alignItems: 'flex-end', flexShrink: 0 }}>
        <span className="num" style={{ fontSize: '0.9375rem' }}>
          {corridor.minutes} min
        </span>
        <span className="meta" style={{ color: slower > 0 ? 'var(--peach-ink)' : 'var(--mint-ink)', fontWeight: 600 }}>
          {slower > 0 ? `+${slower} vs usual` : 'Usual pace'}
        </span>
      </span>
    </Link>
  );
}

export function ArrivalRow({ arrival }: { arrival: TransitArrival }) {
  return (
    <Link to="/city/transit" className="list-row">
      <span className={`tone-${arrival.lineTone}`} style={{ display: 'inline-flex' }}>
        <CountdownRing value={arrival.minutes} max={12} size={46} />
      </span>
      <span className="list-row__body">
        <span className="list-row__title">
          {arrival.line} → {arrival.towards}
        </span>
        <span className="list-row__meta">
          {arrival.stop} · {arrival.walkMin} min walk · {arrival.crowd}
        </span>
      </span>
      <ChevronRightGlyph size={16} style={{ color: 'var(--muted)' }} />
    </Link>
  );
}

/* ---------- Render any answer result ---------- */

const LIST_TYPES = new Set<ResultRef['type']>(['place', 'corridor', 'arrival', 'emergency', 'facility', 'service', 'report']);

function renderListItem(ref: ResultRef, pulse: CityPulse, last: boolean): ReactNode {
  switch (ref.type) {
    case 'place': {
      const p = placeById(ref.id);
      return p ? <PlaceRow key={ref.id} place={p} last={last} /> : null;
    }
    case 'corridor': {
      const c = pulse.corridors.find((x) => x.id === ref.id);
      return c ? <CorridorRow key={ref.id} corridor={c} /> : null;
    }
    case 'arrival': {
      const a = pulse.arrivals.find((x) => x.id === ref.id);
      return a ? <ArrivalRow key={ref.id} arrival={a} /> : null;
    }
    case 'emergency': {
      const e = EMERGENCY.find((x) => x.id === ref.id);
      return e ? (
        <a key={ref.id} href={`tel:${e.number}`} className="list-row glyph-host" aria-label={`Call ${e.name}, ${e.number}`}>
          <Tile glyph={e.glyph} tone={e.tone} size="sm" />
          <span className="list-row__body">
            <span className="list-row__title">{e.name}</span>
            <span className="list-row__meta">{e.description}</span>
          </span>
          <span className="badge tone-red" style={{ gap: 6, fontSize: '0.875rem' }}>
            <PhoneGlyph size={14} />
            {e.number}
          </span>
        </a>
      ) : null;
    }
    case 'facility': {
      const f = FACILITIES.find((x) => x.id === ref.id);
      return f ? (
        <Link key={ref.id} to="/city/safety" className="list-row">
          <Tile glyph={f.glyph} tone="blue" size="sm" />
          <span className="list-row__body">
            <span className="list-row__title">{f.name}</span>
            <span className="list-row__meta">
              {f.kind} · {f.area} · {km(f.distanceKm)}
            </span>
          </span>
          {f.open24h ? <span className="badge tone-mint">24h</span> : null}
        </Link>
      ) : null;
    }
    case 'service': {
      const s = SERVICES.find((x) => x.id === ref.id);
      return s ? (
        <LinkRow
          key={ref.id}
          to="/city/services"
          glyph={s.glyph}
          tone={s.tone}
          title={s.name}
          meta={s.due ? `${s.provider} · ${s.due}` : s.provider}
          trail={s.amount ? <span className="strong" style={{ color: 'var(--ink)' }}>{rupees(s.amount)}</span> : undefined}
        />
      ) : null;
    }
    case 'report': {
      const r = reportById(ref.id);
      if (!r) return null;
      const type = ISSUE_TYPES.find((x) => x.id === r.category);
      return (
        <LinkRow
          key={ref.id}
          to={`/city/reports/${r.id}`}
          glyph={type?.glyph ?? 'report'}
          tone={type?.tone ?? 'amber'}
          title={r.title}
          meta={`${REPORT_STEPS[r.status]} · ${r.area} · +${r.plusOnes}`}
        />
      );
    }
    default:
      return null;
  }
}

function renderCard(ref: ResultRef): ReactNode {
  switch (ref.type) {
    case 'event': {
      const e = eventById(ref.id);
      return e ? <EventRow key={ref.id} event={e} /> : null;
    }
    case 'deal': {
      const d = dealById(ref.id);
      return d ? <DealCard key={ref.id} deal={d} /> : null;
    }
    case 'alert': {
      const a = alertById(ref.id);
      return a ? <AlertCard key={ref.id} alert={a} /> : null;
    }
    case 'group': {
      const g = groupById(ref.id);
      return g ? <GroupRow key={ref.id} group={g} /> : null;
    }
    case 'post': {
      const p = postById(ref.id);
      return p ? <PostCard key={ref.id} post={p} /> : null;
    }
    case 'checkin': {
      const c = checkInById(ref.id);
      return c ? <CheckInCard key={ref.id} c={c} /> : null;
    }
    default:
      return null;
  }
}

/** Renders a mixed list of results: list-style rows are grouped into one rounded list per run. */
export function ResultList({ refs, pulse }: { refs: ResultRef[]; pulse: CityPulse }) {
  const blocks: ReactNode[] = [];
  let i = 0;
  while (i < refs.length) {
    const ref = refs[i];
    if (LIST_TYPES.has(ref.type)) {
      const run: ResultRef[] = [];
      while (i < refs.length && refs[i].type === ref.type) run.push(refs[i++]);
      blocks.push(
        <div key={`list-${blocks.length}`} className="list">
          {run.map((r, j) => renderListItem(r, pulse, j === run.length - 1))}
        </div>,
      );
    } else {
      blocks.push(renderCard(ref));
      i++;
    }
  }
  return <div className="stack">{blocks}</div>;
}

/* ---------- Groups ---------- */

/** A group with its cover photo: a photo card, or a compact row for groups you're in. */
export function GroupCard({ group, compact: small }: { group: Group; compact?: boolean }) {
  const t = useT();
  const toast = useToast();
  const { has, toggle } = useAppData();
  const joined = has('joinedGroups', group.id);
  const src = groupPhoto(group.id);
  const join = (
    <button
      type="button"
      className={`btn btn--sm ${joined ? 'btn--secondary' : 'btn--primary'}`}
      aria-pressed={joined}
      onClick={() => {
        const on = toggle('joinedGroups', group.id);
        toast(on ? `Joined ${group.name}` : `Left ${group.name}`);
      }}
    >
      {joined ? t('common.joined') : t('common.join')}
    </button>
  );
  const meta = (
    <span className="meta">
      {compact(group.members)} members · <span style={{ color: 'var(--mint-ink)', fontWeight: 700, whiteSpace: 'nowrap' }}>{group.postsToday} posts today</span>
    </span>
  );
  if (small) {
    return (
      <div className="card group-row">
        <Link to={`/groups/${group.id}`} className="group-row__link">
          <Cover src={src} glyph={group.glyph} tone={group.tone} className="group-row__thumb" />
          <span className="stack grow" style={{ gap: 3, minWidth: 0 }}>
            <span className="group-card__name">{group.name}</span>
            {meta}
          </span>
        </Link>
        {join}
      </div>
    );
  }
  return (
    <article className="card group-card">
      <Link to={`/groups/${group.id}`} className="group-card__link">
        <Cover src={src} glyph={group.glyph} tone={group.tone} className="group-card__media">
          <span className="group-card__mark">
            <NamedGlyph name={group.glyph} size={20} />
          </span>
        </Cover>
        <span className="group-card__body">
          <span className="group-card__name">{group.name}</span>
          {meta}
          <span className="body-sm group-card__desc">{group.description}</span>
        </span>
      </Link>
      <div className="group-card__foot">
        <span className="meta grow">{group.area}</span>
        {join}
      </div>
    </article>
  );
}

/* ---------- Calendar export ---------- */

const DAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function parseClock(text: string): { h: number; m: number } | null {
  const match = text.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (!match) return null;
  let h = Number(match[1]) % 12;
  if (match[3].toLowerCase() === 'pm') h += 12;
  return { h, m: Number(match[2] ?? 0) };
}

function eventDate(e: CityEvent): Date {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (e.day === 'Tomorrow') d.setDate(d.getDate() + 1);
  else if (e.day !== 'Today') {
    const target = DAY_INDEX[e.day.slice(0, 3)] ?? 6;
    const diff = (target - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + diff);
  }
  return d;
}

const pad = (n: number) => String(n).padStart(2, '0');
const stamp = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
const escapeIcs = (s: string) => s.replace(/\\/g, '\\\\').replace(/[,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');

/** Builds an .ics file for the event and starts a download. Returns false if the browser refused. */
export function downloadEventIcs(e: CityEvent): boolean {
  try {
    const [startText, endText] = e.time.split(/\s*–\s*/);
    const day = eventDate(e);
    const start = new Date(day);
    const s = parseClock(startText) ?? { h: 18, m: 0 };
    start.setHours(s.h, s.m);
    const end = new Date(start);
    const en = endText ? parseClock(endText) : null;
    if (en) end.setHours(en.h, en.m);
    else end.setHours(start.getHours() + 2);
    const body = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Nearhood//City app//EN',
      'BEGIN:VEVENT',
      `UID:${e.id}@nearhood.app`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:${escapeIcs(e.title)}`,
      `LOCATION:${escapeIcs(`${e.venue}, ${e.area}, Ahmedabad`)}`,
      `DESCRIPTION:${escapeIcs(e.description)}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([body], { type: 'text/calendar' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${e.id}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}

/**
 * Top-of-page hero for places, events, deals and groups. With a photo it is a
 * rounded photo card with a soft scrim; without one, a tinted panel with the glyph.
 */
export function DetailHero({
  tone,
  glyph,
  src,
  children,
  badge,
  height,
}: {
  tone: Tone;
  glyph: Parameters<typeof NamedGlyph>[0]['name'];
  src?: string;
  children?: ReactNode;
  badge?: ReactNode;
  height?: number;
}) {
  if (src) {
    return (
      <div className="detail-hero detail-hero--photo" style={height ? { height } : undefined}>
        <img src={src} alt="" />
        {badge ? (
          <span className="photo-pill" style={{ top: 14, left: 14 }}>
            {badge}
          </span>
        ) : null}
        {children}
      </div>
    );
  }
  return (
    <div className={`detail-hero tone-${tone}`} style={height ? { height } : undefined}>
      <NamedGlyph name={glyph} size={64} duo={tone !== 'night'} live />
      {badge ? <span className="detail-hero__badge">{badge}</span> : null}
      {children}
    </div>
  );
}

/** Share a path in the app: system share sheet when available, otherwise copy the link. */
export function useShare() {
  const toast = useToast();
  return async (title: string, path: string) => {
    const url = `${window.location.origin}${window.location.pathname}#${path}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Nearhood', text: title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast('Link copied');
    } catch (err) {
      if ((err as DOMException)?.name !== 'AbortError') toast('Could not share right now');
    }
  };
}
