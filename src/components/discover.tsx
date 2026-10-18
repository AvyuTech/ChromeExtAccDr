import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { eventPhoto, groupPhoto, placePhoto } from '../assets/photos';
import { EMERGENCY, FACILITIES, ISSUE_TYPES, REPORT_STEPS, reportById } from '../data/city';
import { eventById } from '../data/events';
import { placeById } from '../data/places';
import { groupById, postById } from '../data/social';
import { alertById } from '../data/city';
import type { CityEvent, CityPulse, Corridor, Group, Place, Tone } from '../data/types';
import { CheckGlyph, ChevronRightGlyph, ClockGlyph, EditGlyph, NamedGlyph, PhoneGlyph, ShieldGlyph, TrafficGlyph, UsersGlyph } from '../icons';
import type { OwnerReply, PageUpdate } from '../data/pages';
import { TRAFFIC_LABEL } from '../icons/live';
import type { ResultRef } from '../lib/askEngine';
import { compact, km } from '../lib/format';
import { pageHistory, runsPage } from '../lib/places';
import { allCheckIns, profileInfo } from '../lib/friends';
import { person, SOURCES } from '../data/core';
import { collectionById } from '../data/friends';
import { AlertCard, Avatar, Cover, FaceStack, GroupRow, PlaceRow, PostCard } from './cards';
import { CheckInCard } from './friends';
import { checkInById } from '../data/friends';
import { useAppData, type AppData } from '../state/appData';
import { useToast } from '../state/toast';
import { useT } from '../i18n';
import { LinkRow, Sheet, Tile } from './ui';

/* ---------- Rows for live city results ---------- */

const TRAFFIC_TONE: Record<number, Tone> = { 0: 'mint', 1: 'amber', 2: 'peach', 3: 'red' };

export function CorridorRow({ corridor }: { corridor: Corridor }) {
  const slower = corridor.minutes - corridor.usual;
  return (
    <Link to="/city/traffic" className="list-row">
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

/* ---------- Render any answer result ---------- */

const LIST_TYPES = new Set<ResultRef['type']>(['place', 'corridor', 'emergency', 'facility', 'report', 'event']);

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
    case 'event': {
      const e = eventById(ref.id);
      return e ? <EventLinkRow key={ref.id} event={e} /> : null;
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
          meta={`${REPORT_STEPS[r.status]} · ${r.area} · ▲ ${r.plusOnes}`}
        />
      );
    }
    default:
      return null;
  }
}

function renderCard(ref: ResultRef): ReactNode {
  switch (ref.type) {
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

/** Renders a mixed list of results: list-style rows are grouped into one flat list per run. */
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
  return <div className="results">{blocks}</div>;
}

/* ---------- City events: found on the web, never sold here ---------- */

/** Friends who want to go (on their list) or already went (checked in). */
export function eventFriends(eventId: string, data: AppData) {
  const went = data.following.filter((fid) => allCheckIns(data).some((c) => c.authorId === fid && c.eventId === eventId));
  const want = data.following.filter((fid) => !went.includes(fid) && profileInfo(fid).wantToTry.some((w) => w.refId === eventId && !w.done));
  return { want, went };
}

/** "Riya and Aditi want to go", "Karan went". */
export function friendsLine(ids: string[], verb: { one: string; many: string }) {
  const names = ids.map((id) => person(id).name.split(' ')[0]);
  if (!names.length) return '';
  const who = names.length > 2 ? `${names.slice(0, 2).join(', ')} and ${names.length - 2} more` : names.join(' and ');
  return `${who} ${names.length === 1 ? verb.one : verb.many}`;
}

/** Brand names keep their capital mid-sentence; generic sources ("Local news") don't. */
const PROPER_SOURCES = new Set(['instagram', 'maps']);

/** Where an event was found, e.g. "ticketing sites · Instagram". */
export function eventSourceLine(e: CityEvent) {
  return e.sources
    .filter((s) => s !== 'neighbours' && s !== 'maps')
    .map((s) => (PROPER_SOURCES.has(s) ? SOURCES[s].label : SOURCES[s].label.charAt(0).toLowerCase() + SOURCES[s].label.slice(1)))
    .join(' · ');
}

/** A city event as a flat row: when and where, then friends, else where it was found. */
export function EventLinkRow({ event }: { event: CityEvent }) {
  const { data } = useAppData();
  const { want, went } = eventFriends(event.id, data);
  const friends = [...went, ...want];
  const from = eventSourceLine(event);
  return (
    <Link to={`/event/${event.id}`} className={`list-row glyph-host event-link-row${event.confirmed ? '' : ' event-link-row--unconfirmed'}`}>
      <Cover src={eventPhoto(event.id)} glyph={event.glyph} tone={event.tone} className="event-link-row__thumb" />
      <span className="list-row__body">
        <span className="list-row__title">{event.title}</span>
        <span className="list-row__meta">
          {event.day}, {event.time.split(' – ')[0]} · {event.area}
        </span>
        {friends.length ? (
          <span className="row" style={{ gap: 6 }}>
            <FaceStack ids={friends} size={18} />
            <span className="event-link-row__friends">
              {went.length ? friendsLine(went, { one: 'went', many: 'went' }) : friendsLine(want, { one: 'wants to go', many: 'want to go' })}
            </span>
          </span>
        ) : (
          <span className="event-link-row__from">{event.confirmed ? `From ${from || 'the web'}` : (event.unconfirmedNote ?? 'Not confirmed yet')}</span>
        )}
      </span>
      <ChevronRightGlyph size={16} style={{ color: 'var(--muted)', flexShrink: 0 }} />
    </Link>
  );
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
      <div className="group-row">
        <Link to={`/groups/${group.id}`} className="group-row__link">
          <Cover src={src} glyph={group.glyph} tone={group.tone} className="group-row__thumb" />
          <span className="stack grow" style={{ gap: 3, minWidth: 0 }}>
            <span className="group-card__name" style={{ fontSize: '0.9063rem' }}>
              {group.name}
            </span>
            {meta}
          </span>
        </Link>
        {join}
      </div>
    );
  }
  return (
    <article className="group-card">
      <Link to={`/groups/${group.id}`} className="group-card__link">
        <Cover src={src} glyph={group.glyph} tone={group.tone} className="group-card__media">
          <span className="group-card__mark">
            <NamedGlyph name={group.glyph} size={20} />
          </span>
        </Cover>
      </Link>
      <div className="group-card__foot">
        <Link to={`/groups/${group.id}`} className="group-card__body grow" style={{ color: 'inherit', textDecoration: 'none', minWidth: 0 }}>
          <span className="group-card__name">{group.name}</span>
          {meta}
        </Link>
        {join}
      </div>
      <span className="body-sm group-card__desc">{group.description}</span>
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
 * Top-of-page hero for places, events and clubs. With a photo it runs
 * edge to edge with a soft scrim; without one, a tinted panel with the glyph.
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
          <span className="photo-pill" style={{ top: 12, left: 'var(--gutter)' }}>
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

/* ---------- Profile-style head: cover, round icon, stats ---------- */

export interface HeadStat {
  value: ReactNode;
  label: string;
  tone?: 'mint';
}

/**
 * The top of a place, event or group page: the cover runs edge to edge, a round
 * icon overlaps its lower edge with a few numbers beside it, then the name.
 */
export function ProfileHead({
  cover,
  coverBadge,
  icon,
  tone,
  stats,
  eyebrow,
  title,
  sub,
  children,
}: {
  cover?: string;
  coverBadge?: ReactNode;
  icon: ReactNode;
  tone: Tone;
  stats?: HeadStat[];
  eyebrow?: ReactNode;
  title: string;
  sub?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <>
      {cover ? (
        <div className="detail-hero detail-hero--photo profile-cover">
          <img src={cover} alt="" />
          {coverBadge}
        </div>
      ) : (
        <div className={`profile-cover profile-cover--plain tone-${tone}`} aria-hidden="true" />
      )}
      <section className="profile-head" aria-label={title}>
        <div className="profile-head__top">
          <span className={`profile-head__icon tone-${tone}`}>{icon}</span>
          {stats?.length ? (
            <dl className="profile-head__stats">
              {stats.map((st) => (
                <div key={st.label} className={st.tone ? `is-${st.tone}` : undefined}>
                  <dt>{st.label}</dt>
                  <dd>{st.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
        {eyebrow ? <span className="eyebrow muted">{eyebrow}</span> : null}
        <h1 className="profile-head__title">{title}</h1>
        {sub ? <p className="profile-head__sub">{sub}</p> : null}
        {children}
      </section>
    </>
  );
}

/** One round outline icon with a tiny label. `primary` fills it violet. */
export function IconAction({
  icon,
  label,
  onClick,
  to,
  href,
  pressed,
  primary,
  ariaLabel,
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  to?: string;
  href?: string;
  pressed?: boolean;
  primary?: boolean;
  ariaLabel?: string;
}) {
  const cls = `icon-action${primary ? ' icon-action--primary' : ''}`;
  const inner = (
    <>
      <span className="icon-action__icon">{icon}</span>
      <span className="icon-action__label">{label}</span>
    </>
  );
  if (to)
    return (
      <Link to={to} className={cls} aria-label={ariaLabel}>
        {inner}
      </Link>
    );
  if (href)
    return (
      <a href={href} className={cls} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel}>
        {inner}
      </a>
    );
  return (
    <button type="button" className={cls} aria-pressed={pressed} aria-label={ariaLabel} onClick={onClick}>
      {inner}
    </button>
  );
}

/* ---------- Where a place came from, and claiming it ---------- */

const ORIGIN_RULES = [
  'Verified residents add pages: from the + button, from search, or while checking in. Nothing is imported or bought.',
  'A new page is listed after 3 verified visits, or once a Nearhood guide checks it.',
  'Every page is built the same way, whether it’s a café, a court or a lake.',
  'Owners claim a page with a licence and a code to the venue’s phone, then fix facts and post updates.',
  'Owners can’t post verdicts, pay for placement or hide reviews.',
  'Every fact an owner changes is listed in the page’s history, for anyone to read.',
  'Parks, lakes, markets and streets belong to everyone and can’t be claimed.',
  'AI only merges duplicates and flags fakes. It never adds pages or reviews.',
];

/** "Added by Riya S. · Jan 2024 · Confirmed by 39 locals": opens the page's history. */
export function PlaceOriginLine({ place }: { place: Place }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const o = place.origin;
  const adder = person(o.addedBy);
  return (
    <>
      <button type="button" className="origin-line" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <Avatar who={{ ...adder, verified: false }} size={18} />
        <span className="grow">
          {t('discover.origin.addedBy', { name: adder.name })} · {o.addedWhen} · {t('discover.origin.confirmedShort', { n: o.confirmedBy })}
        </span>
        <ChevronRightGlyph size={14} />
      </button>
      <PageHistorySheet place={place} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

const HISTORY_NOTE = {
  added: 'discover.origin.addedNote',
  confirmed: 'discover.origin.confirmedNote',
  guide: 'discover.origin.guideNote',
  public: 'discover.origin.publicNote',
  claimed: 'discover.origin.claimedNote',
  owner: 'discover.history.ownerNote',
} as const;

/**
 * A page's public history: who added it, who confirmed and checked it, who claimed it
 * and every fact the owner changed. Anyone can read it and nobody can delete from it.
 */
export function PageHistorySheet({ place, open, onClose }: { place: Place; open: boolean; onClose: () => void }) {
  const t = useT();
  const { data } = useAppData();
  const entries = pageHistory(place, data.pageEdits[place.id]);
  return (
    <Sheet open={open} onClose={onClose} title={t('discover.history.title', { name: place.name })}>
      <ol className="page-history">
        {entries.map((e, i) => (
          <li key={`${e.kind}-${i}`} className={`page-history__item page-history__item--${e.kind}`}>
            {e.who && (e.kind === 'added' || e.kind === 'guide' || e.kind === 'claimed') ? (
              <Avatar who={{ ...person(e.who), verified: false }} size={28} />
            ) : (
              <span className="page-history__icon" aria-hidden="true">
                {e.kind === 'owner' ? <EditGlyph size={14} /> : e.kind === 'claimed' ? <ShieldGlyph size={14} /> : <UsersGlyph size={14} />}
              </span>
            )}
            <span className="page-history__body">
              <b>{e.what}</b>
              <small>
                {e.when} · {t(HISTORY_NOTE[e.kind])}
              </small>
            </span>
          </li>
        ))}
      </ol>
      <p className="meta" style={{ margin: 0 }}>
        {t('discover.history.note')}
      </p>
      <span className="field__label">{t('discover.origin.how')}</span>
      <ol className="rules">
        {ORIGIN_RULES.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ol>
    </Sheet>
  );
}

/** Who runs the page: the claimed owner, "public place", your pending claim, or a quiet link to claim it. */
export function PlaceClaim({ place }: { place: Place }) {
  const t = useT();
  const { data } = useAppData();
  const o = place.origin;
  const mine = data.myClaims[place.id];
  if (o.publicPlace) {
    return (
      <span className="claim-line">
        <UsersGlyph size={13} />
        {t('discover.claim.public')}
      </span>
    );
  }
  if (o.claimed && runsPage(place)) {
    return (
      <span className="claim-own">
        <span className="claim-chip" title={`Since ${o.claimed.since}`}>
          <CheckGlyph size={13} />
          {t('discover.claim.runByYou', { role: o.claimed.role })}
        </span>
        <Link to={`/place/${place.id}/manage`} className="claim-link">
          {t('discover.claim.manage')}
        </Link>
      </span>
    );
  }
  if (o.claimed) {
    return (
      <span className="claim-chip" title={`Since ${o.claimed.since}`}>
        <CheckGlyph size={13} />
        {t('discover.claim.claimed', { name: o.claimed.name, role: o.claimed.role.toLowerCase() })}
      </span>
    );
  }
  if (mine) {
    return (
      <Link to={`/claim/${place.id}`} className="claim-chip claim-chip--pending">
        <ClockGlyph size={13} />
        {t(mine.status === 'approved' ? 'discover.claim.yours' : 'discover.claim.pending')}
      </Link>
    );
  }
  return (
    <Link to={`/claim/${place.id}`} className="claim-link">
      {t('discover.claim.ask')}
    </Link>
  );
}

/** One post from a claimed page: who wrote it for the page, the words, an optional photo and a link out. */
export function PageUpdateRow({ update, place, photo }: { update: PageUpdate; place: Place; photo?: string }) {
  return (
    <article className="page-update">
      <div className="page-update__head">
        <span className={`page-update__icon tone-${place.tone}`}>
          {placePhoto(place.id) ? <img src={placePhoto(place.id)} alt="" /> : <NamedGlyph name={place.glyph} size={16} />}
        </span>
        <span className="stack grow" style={{ gap: 0, minWidth: 0 }}>
          <span className="page-update__name">{place.name}</span>
          <span className="meta">
            {update.by} · {update.ago}
          </span>
        </span>
      </div>
      <p className="page-update__text">{update.text}</p>
      {photo ? <img className="page-update__photo" src={photo} alt="" loading="lazy" /> : null}
      {update.link ? (
        <a className="page-update__link" href={update.link.url} target="_blank" rel="noopener noreferrer">
          {update.link.label}
          <ChevronRightGlyph size={14} />
        </a>
      ) : null}
    </article>
  );
}

/** The owner's one public reply to a check-in, shown under it for everyone. */
export function OwnerReplyView({ reply, place }: { reply: OwnerReply; place: Place }) {
  const t = useT();
  const name = reply.byId === 'me' ? 'You' : reply.by.split(',')[0];
  return (
    <div className="owner-reply">
      <span className={`owner-reply__icon tone-${place.tone}`} aria-hidden="true">
        {placePhoto(place.id) ? <img src={placePhoto(place.id)} alt="" /> : <NamedGlyph name={place.glyph} size={14} />}
      </span>
      <span className="owner-reply__body">
        <span className="owner-reply__by">
          <b>{name}</b>
          <span className="owner-reply__tag">{t('discover.owner.tag', { name: place.name })}</span>
          <span className="meta">· {reply.ago}</span>
        </span>
        <span className="owner-reply__text">{reply.text}</span>
      </span>
    </div>
  );
}

/** For places outside the city: how it reached you, not "near you". */
export function AwayLine({ place }: { place: Place }) {
  const t = useT();
  const list = place.origin.viaList ? collectionById(place.origin.viaList) : undefined;
  return (
    <p className="away-line">
      <span className="away-line__tag">{t('discover.origin.outside')}</span>
      {list ? (
        <span>
          {t('discover.origin.fromList', { name: person(list.ownerId).name.split(' ')[0] })}{' '}
          <Link to={`/lists/${list.id}`}>‘{list.title}’</Link>
        </span>
      ) : null}
    </p>
  );
}
