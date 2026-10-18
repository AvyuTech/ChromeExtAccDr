import { useCallback, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { eventPhoto, groupPhoto, photo, placePhoto, scenePhoto } from '../assets/photos';
import { person } from '../data/core';
import { eventById } from '../data/events';
import { placeById } from '../data/places';
import { GROUPS } from '../data/social';
import type { AppData } from '../state/appData';
import type { Collection, Group, Person, Tone, WantItem } from '../data/types';
import { useT } from '../i18n';
import { CheckGlyph, StarGlyph, TrashGlyph, type GlyphName } from '../icons';
import { useAppData } from '../state/appData';
import { Avatar, Cover } from './cards';
import { AvatarStack, TasteMatchPill, WantButton } from './friends';
import { levelTitle, useBoardContext, useLevel } from './helpful';
import { EntityMark } from './entity';
import { IdentityRows, useIdentity } from './identity';
import { Sheet } from './ui';
import { isFullyVerified } from '../data/identity';
import { compact } from '../lib/format';
import { rankOf, topStrengths } from '../lib/helpful';
import { pagesRunBy } from '../lib/places';
import { HelpfulInfo } from './helpGuide';

/* Pieces shared by the Friends hub, profiles, lists and Me. */

/** Link to a 1:1 chat, optionally with a message ready to send. */
export function chatLink(personId: string, draft?: string) {
  return `/messages/c-${personId}${draft ? `?draft=${encodeURIComponent(draft)}` : ''}`;
}

/** Where a list entry leads, and which glyph and tone it wears. */
export function wantTarget(item: WantItem): { to?: string; glyph: GlyphName; tone: Tone } {
  const place = item.refId ? placeById(item.refId) : undefined;
  const event = item.refId ? eventById(item.refId) : undefined;
  if (item.kind === 'event' && event) return { to: `/event/${event.id}`, glyph: event.glyph, tone: event.tone };
  if (place) {
    const glyph: GlyphName = item.kind === 'dish' ? (place.category === 'cafe' ? 'cafe' : 'food') : item.kind === 'activity' ? 'checkin' : place.glyph;
    return { to: `/place/${place.id}`, glyph, tone: place.tone };
  }
  const fallback: Record<WantItem['kind'], GlyphName> = { place: 'pin', event: 'events', dish: 'food', activity: 'checkin' };
  return { glyph: fallback[item.kind], tone: 'violet' };
}

/** Photo for a list entry: the event, else the place. */
export function wantPhoto(item: WantItem): string | undefined {
  if (item.kind === 'event' && item.refId) return eventPhoto(item.refId);
  return item.refId ? placePhoto(item.refId) : undefined;
}

/* ---------- Profile header ---------- */

/** A cover photo for each profile, picked from where they spend their time. */
const COVER: Record<string, string> = {
  me: 'scene-promenade',
  riya: 'place-quiet-cup',
  karan: 'place-pickle-play',
  aditi: 'place-seoul-bowl',
  nikhil: 'place-brew-lab',
  farah: 'event-sunrise-yoga',
  meera: 'place-spice-courtyard',
  harsh: 'place-corner-table',
  sana: 'place-manek-chowk',
  dev: 'place-law-garden',
  kavya: 'place-vastrapur-lake',
  arjun: 'scene-concert',
  zoya: 'dish-spicy-ramen',
  priyank: 'place-polo-forest',
};

export const coverPhoto = (personId: string) => photo(COVER[personId] ?? '') ?? scenePhoto('sunset-friends');

/** Labels for the "Into" tags on profiles. */
export const TASTE_LABEL: Record<string, string> = {
  cafes: 'Cafés',
  brunch: 'Brunch',
  korean: 'Korean',
  gujarati: 'Gujarati food',
  'street food': 'Street food',
  heritage: 'Heritage',
  sports: 'Sports',
  getaways: 'Getaways',
  workshops: 'Workshops',
  kids: 'Kids & family',
  nature: 'Parks & lakes',
  wellness: 'Wellness',
  shopping: 'Shopping',
  family: 'Family outings',
};

/** A stat under the follower count, or the follower count itself: a link, a button or plain text. */
export interface HeroStat {
  label: string;
  value: ReactNode;
  to?: string;
  onClick?: () => void;
}

function StatTarget({ stat, className, children }: { stat: HeroStat; className: string; children: ReactNode }) {
  if (stat.to)
    return (
      <Link to={stat.to} className={className}>
        {children}
      </Link>
    );
  if (stat.onClick)
    return (
      <button type="button" className={className} onClick={stat.onClick}>
        {children}
      </button>
    );
  return <span className={className}>{children}</span>;
}

/** The small round tick after a name: phone, ID and home all checked. */
export function VerifiedTick({ personId }: { personId: string }) {
  const identity = useIdentity(personId);
  if (!isFullyVerified(identity)) return null;
  return (
    <span className="verified-tick" role="img" aria-label="Verified: phone, ID and home" title="Verified: phone, ID and home">
      <CheckGlyph size={10} />
    </span>
  );
}

/** Where someone stands, as a small neutral pill: "★ City hero", "Regular". */
export function LevelPill({ personId, to, onClick }: { personId: string; to?: string; onClick?: () => void }) {
  const info = useLevel(personId);
  const inner = (
    <>
      {info.level.id === 'hero' ? <StarGlyph size={11} /> : null}
      {info.level.name}
    </>
  );
  return to ? (
    <Link to={to} className="level-pill" aria-label={`${info.level.name}: see your impact`}>
      {inner}
    </Link>
  ) : (
    <button type="button" className="level-pill" onClick={onClick} aria-haspopup="dialog" aria-label={`${info.level.name}: about`}>
      {inner}
    </button>
  );
}

/**
 * Profile top, kept short: cover, avatar, the follower count as the one big number
 * (with following and check-ins small beside it), then name with tick and level,
 * one line for work and area, the pages they run, bio, and one row of actions.
 * Everything else lives in About.
 */
export function ProfileHero({
  who,
  label,
  name,
  bio,
  area,
  followsMe,
  actions,
  followers,
  helpful,
  minor,
  online,
  level,
}: {
  who: Person;
  label: string;
  name: string;
  bio?: string;
  area: string;
  followsMe?: boolean;
  /** An ActionBar: one main action, then small icons. */
  actions: ReactNode;
  followers: HeroStat;
  /** Helpful points: the second headline number, how much they've helped. */
  helpful: HeroStat;
  /** Following and check-ins, small, under the follower count. */
  minor: HeroStat[];
  online?: boolean;
  /** Where the level pill goes: About for others, Your impact for you. */
  level: { to?: string; onClick?: () => void };
}) {
  const identity = useIdentity(who.id);
  const runs = pagesRunBy(who.id);
  const meta = [identity.work?.title, area, followsMe ? 'Follows you' : undefined].filter(Boolean).join(' · ');
  return (
    <section className="profile-hero" aria-label={label}>
      <div className="profile-hero__cover">
        <img src={coverPhoto(who.id)} alt="" />
      </div>
      <div className="profile-hero__top">
        <span className="profile-hero__avatar">
          <Avatar who={{ ...who, verified: false }} size={76} />
          {online ? <span className="profile-hero__online" aria-hidden="true" /> : null}
        </span>
        <div className="profile-hero__reach">
          {/* Two headline numbers: how many follow you, and how much you've helped. */}
          <span className="profile-hero__big">
            <StatTarget stat={followers} className="profile-hero__followers">
              <b className="num">{followers.value}</b>
              <span>{followers.label}</span>
            </StatTarget>
            <span className="profile-hero__helpful">
              <StatTarget stat={helpful} className="profile-hero__followers">
                <b className="num">{helpful.value}</b>
                <span>{helpful.label}</span>
              </StatTarget>
              <HelpfulInfo size={14} />
            </span>
          </span>
          <span className="profile-hero__minor">
            {minor.map((st, i) => (
              <span key={st.label}>
                {i ? <span aria-hidden="true"> · </span> : null}
                <StatTarget stat={st} className="profile-hero__minor-stat">
                  <b className="num">{st.value}</b> {st.label}
                </StatTarget>
              </span>
            ))}
          </span>
        </div>
      </div>
      <div className="profile-hero__body">
        <h2 className="profile-hero__name">
          <span>{name}</span>
          <VerifiedTick personId={who.id} />
          <LevelPill personId={who.id} {...level} />
        </h2>
        {meta ? <span className="profile-hero__meta">{meta}</span> : null}
        {runs.length ? (
          // Said plainly, so people know when someone recommending a café runs one.
          <span className="profile-hero__runs">
            <EntityMark kind="page" size={13} />
            <span className="grow">
              Runs{' '}
              {runs.map((p, i) => (
                <span key={p.id}>
                  {i ? ' · ' : ''}
                  <Link to={`/place/${p.id}`}>{p.name}</Link>
                </span>
              ))}
            </span>
          </span>
        ) : null}
        {bio ? <p className="profile-hero__bio">{bio}</p> : null}
      </div>
      <div className="profile-hero__actions">{actions}</div>
    </section>
  );
}

/**
 * About someone, in one sheet: where they stand, what they're known for and happy
 * to be asked about, what they're into, the checks behind "Verified", their clubs.
 */
export function ProfileAbout({
  open,
  onClose,
  personId,
  name,
  area,
  since,
  followsMe,
  tasteTags,
  clubs,
  adminIds = [],
}: {
  open: boolean;
  onClose: () => void;
  personId: string;
  name: string;
  area: string;
  since: string;
  followsMe?: boolean;
  tasteTags: string[];
  clubs: Group[];
  adminIds?: string[];
}) {
  const mine = personId === 'me';
  const first = name.split(' ')[0];
  const identity = useIdentity(personId);
  const info = useLevel(personId);
  const ctx = useBoardContext();
  const rank = rankOf(personId, { scope: 'area', area, period: 'month', sortBy: 'points' }, ctx);
  const strengths = topStrengths(personId, 3);
  const ask = identity.askMeAbout ?? [];
  return (
    <Sheet open={open} onClose={onClose} title={mine ? 'About you' : `About ${first}`}>
      <div className="about" onClick={(e) => (e.target as HTMLElement).closest('a') && onClose()}>
        <section className="about-sec">
          <h3 className="about-sec__title">Where {mine ? 'you stand' : `${first} stands`}</h3>
          <Link to={mine ? '/me/impact' : '/heroes'} className="about-standing">
            <span className="about-standing__level">
              {info.level.id === 'hero' ? <StarGlyph size={13} /> : null}
              {levelTitle(personId, info)}
            </span>
            <span className="meta">
              {info.points.toLocaleString('en-IN')} helpful points
              {rank ? ` · #${rank.rank} in ${area} this month` : ''}
            </span>
            <span className="section__link">{mine ? 'Your impact' : 'See City heroes'}</span>
          </Link>
        </section>

        {strengths.length || ask.length ? (
          <section className="about-sec">
            {strengths.length ? (
              <>
                <h3 className="about-sec__title">Known for</h3>
                <div className="about-chips">
                  {strengths.map((st) => (
                    <Link key={st.topic} to={`/ask?q=${encodeURIComponent(st.topic)}`} className="id-ask__chip">
                      {st.topic} <span className="muted num">{compact(st.points)}</span>
                    </Link>
                  ))}
                </div>
              </>
            ) : null}
            {ask.length ? (
              <>
                <h3 className="about-sec__title">{mine ? 'Happy to be asked about' : `Ask ${first} about`}</h3>
                <div className="about-chips">
                  {ask.map((topic) => (
                    <Link key={topic} to={`/ask?q=${encodeURIComponent(topic)}`} className="id-ask__chip">
                      {topic}
                    </Link>
                  ))}
                </div>
              </>
            ) : null}
          </section>
        ) : null}

        {tasteTags.length ? (
          <section className="about-sec">
            <h3 className="about-sec__title">Into</h3>
            <div className="about-chips">
              {tasteTags.map((tag) => (
                <span key={tag} className="id-ask__chip">
                  {TASTE_LABEL[tag] ?? tag}
                </span>
              ))}
            </div>
            {mine ? null : (
              <span>
                <TasteMatchPill personId={personId} />
              </span>
            )}
          </section>
        ) : null}

        <section className="about-sec">
          <h3 className="about-sec__title">Checks</h3>
          <IdentityRows identity={identity} area={area} />
          {mine ? (
            <Link to="/settings/identity" className="section__link">
              Edit identity and work
            </Link>
          ) : null}
        </section>

        {clubs.length ? (
          <section className="about-sec">
            <h3 className="about-sec__title">Clubs</h3>
            <ClubRows clubs={clubs} adminIds={adminIds} />
          </section>
        ) : null}

        <p className="meta about-foot">
          On Nearhood since {since}
          {followsMe ? ' · Follows you' : ''}
          <br />
          Only verified people count as followers. Followers can’t be bought.
        </p>
      </div>
    </Sheet>
  );
}

/** Grid / list switch for check-in tabs. */
export function ViewToggle({ value, onChange }: { value: 'grid' | 'list'; onChange: (v: 'grid' | 'list') => void }) {
  return (
    <div className="view-toggle" role="radiogroup" aria-label="Layout">
      <button type="button" role="radio" aria-checked={value === 'grid'} aria-label="Photo grid" onClick={() => onChange('grid')}>
        <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
          <rect x="1.5" y="1.5" width="4.4" height="4.4" rx="1" fill="currentColor" />
          <rect x="6.8" y="1.5" width="4.4" height="4.4" rx="1" fill="currentColor" />
          <rect x="12.1" y="1.5" width="4.4" height="4.4" rx="1" fill="currentColor" />
          <rect x="1.5" y="6.8" width="4.4" height="4.4" rx="1" fill="currentColor" />
          <rect x="6.8" y="6.8" width="4.4" height="4.4" rx="1" fill="currentColor" />
          <rect x="12.1" y="6.8" width="4.4" height="4.4" rx="1" fill="currentColor" />
          <rect x="1.5" y="12.1" width="4.4" height="4.4" rx="1" fill="currentColor" />
          <rect x="6.8" y="12.1" width="4.4" height="4.4" rx="1" fill="currentColor" />
          <rect x="12.1" y="12.1" width="4.4" height="4.4" rx="1" fill="currentColor" />
        </svg>
      </button>
      <button type="button" role="radio" aria-checked={value === 'list'} aria-label="Full posts" onClick={() => onChange('list')}>
        <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
          <rect x="1.5" y="1.5" width="15" height="9.5" rx="1.6" fill="currentColor" />
          <rect x="1.5" y="13" width="15" height="1.8" rx=".9" fill="currentColor" opacity=".6" />
          <rect x="1.5" y="16" width="9" height="1.5" rx=".75" fill="currentColor" opacity=".4" />
        </svg>
      </button>
    </div>
  );
}

/** A small "x of y" progress ring. */
export function DoneRing({ done, total, size = 44 }: { done: number; total: number; size?: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const p = total ? done / total : 0;
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" role="img" aria-label={`${done} of ${total} done`} className="done-ring">
      <circle cx="22" cy="22" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="4" />
      <circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        stroke={p >= 1 ? 'var(--mint-strong)' : 'var(--accent-fill)'}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - p)}
        transform="rotate(-90 22 22)"
        className="done-ring__arc"
      />
      <text x="22" y="26" textAnchor="middle" className="done-ring__text" fill="var(--ink)">
        {done}/{total}
      </text>
    </svg>
  );
}

/**
 * One entry on a "Want to try" list.
 * - mine: a tick box and a remove button
 * - theirs: a "Copy to my list" button
 */
export function WantRow({
  item,
  mode,
  onToggleDone,
  onRemove,
}: {
  item: WantItem;
  mode: 'mine' | 'theirs';
  onToggleDone?: (done: boolean) => void;
  onRemove?: () => void;
}) {
  const t = useT();
  const target = wantTarget(item);
  const from = item.fromId ? person(item.fromId) : undefined;
  const title = target.to ? (
    <Link to={target.to} className="want-row__title">
      {item.title}
    </Link>
  ) : (
    <span className="want-row__title">{item.title}</span>
  );
  return (
    <div className={`list-row want-row${item.done ? ' is-done' : ''}`}>
      {mode === 'mine' ? (
        <button
          type="button"
          role="checkbox"
          aria-checked={!!item.done}
          aria-label={item.done ? `Mark "${item.title}" as not done` : `Mark "${item.title}" as done`}
          className="want-check"
          onClick={() => onToggleDone?.(!item.done)}
        >
          {item.done ? <CheckGlyph size={16} /> : null}
        </button>
      ) : null}
      <Cover src={wantPhoto(item)} glyph={target.glyph} tone={target.tone} className={`want-row__thumb${mode === 'mine' ? ' want-row__thumb--sm' : ''}`} />
      <span className="list-row__body">
        {title}
        <span className="list-row__meta">
          {item.done ? `${t('people.done')}${item.doneAgo ? ` · ${item.doneAgo}` : ''}` : item.sub ?? t(`people.kind.${item.kind}`)}
        </span>
        {from && mode === 'mine' ? (
          <span className="want-row__from">
            <Avatar who={{ ...from, verified: false }} size={18} />
            {t('people.from', { name: from.name.split(' ')[0] })}
          </span>
        ) : null}
      </span>
      {mode === 'mine' ? (
        <button type="button" className="icon-btn icon-btn--ghost" aria-label={`${t('people.remove')}: ${item.title}`} onClick={onRemove} style={{ width: 32, height: 32, color: 'var(--muted)' }}>
          <TrashGlyph size={17} />
        </button>
      ) : item.done ? null : (
        <WantButton item={{ ...item, id: `copy-${item.id}`, done: false, doneAgo: undefined }} variant="icon" />
      )}
    </div>
  );
}

/** "You and Riya both want to try Polo Forest" with a Plan it button. */
export function PlanCard({ personId, items }: { personId: string; items: WantItem[] }) {
  const t = useT();
  const p = person(personId);
  const first = p.name.split(' ')[0];
  // Name the place for dishes and activities: friends may want different things at the same spot.
  const titles = Array.from(
    new Set(items.map((i) => (i.kind === 'dish' || i.kind === 'activity') && i.refId ? (placeById(i.refId)?.name ?? i.title) : i.title)),
  );
  const text = titles.length > 1 ? `${titles.slice(0, -1).join(', ')} and ${titles[titles.length - 1]}` : titles[0];
  const target = wantTarget(items[0]);
  return (
    <div className="plan-together">
      <span className="plan-together__media">
        <Cover src={wantPhoto(items[0])} glyph={target.glyph} tone={target.tone} className="plan-together__photo" />
        <AvatarStack ids={['me', personId]} size={22} />
      </span>
      <p className="plan-together__text">
        You and <b>{first}</b> both want to try <b>{text}</b>.
      </p>
      <Link to={chatLink(personId, `Want to do ${text} together this weekend?`)} className="btn btn--sm btn--primary">
        {t('people.planIt')}
      </Link>
    </div>
  );
}

/** A tab strip whose selection lives in the URL (?tab=), so tabs can be linked to. */
export function TabStrip<T extends string>({
  tabs,
  value,
  onChange,
  label,
  idPrefix,
}: {
  tabs: Array<{ id: T; label: ReactNode }>;
  value: T;
  onChange: (v: T) => void;
  label: string;
  idPrefix: string;
}) {
  return (
    <div className="tabs people-tabs" role="tablist" aria-label={label}>
      {tabs.map((x) => (
        <button
          key={x.id}
          id={`${idPrefix}-tab-${x.id}`}
          type="button"
          role="tab"
          className="tab"
          aria-selected={value === x.id}
          aria-controls={`${idPrefix}-panel`}
          onClick={() => onChange(x.id)}
        >
          {x.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Edits to your own lists ---------- */

type ListEdit = Partial<Pick<Collection, 'title' | 'description' | 'placeIds'>>;

/** Edits to lists (rename, description, removed places), stored with the rest of your app data. */
export function useListEdits() {
  const { data, editCollection } = useAppData();
  const apply = useCallback((c: Collection): Collection => ({ ...c, ...(data.collectionEdits[c.id] ?? {}) }), [data.collectionEdits]);
  const save = useCallback((id: string, patch: ListEdit) => editCollection(id, patch), [editCollection]);
  return { apply, save };
}

/** Share text through the system sheet, or copy it. Returns what happened. */
export async function shareOrCopy(text: string, url: string): Promise<'shared' | 'copied' | 'cancelled' | 'failed'> {
  try {
    if (navigator.share) {
      await navigator.share({ title: 'Nearhood', text, url });
      return 'shared';
    }
    await navigator.clipboard.writeText(`${text} ${url}`);
    return 'copied';
  } catch (e) {
    return e instanceof DOMException && e.name === 'AbortError' ? 'cancelled' : 'failed';
  }
}

/* ---------- Clubs on profiles ---------- */

/** Clubs this person started or joined on this device, then the sample clubs they belong to. */
export function myClubs(data: AppData): Group[] {
  const all = [...data.myClubs, ...GROUPS.filter((g) => !data.myClubs.some((m) => m.id === g.id))];
  return all.filter((g) => data.joinedGroups.includes(g.id));
}

/** Clubs someone runs, or shows up in through a meetup or a group buy. */
export function clubsOf(personId: string): Array<{ club: Group; admin: boolean }> {
  return GROUPS.flatMap((g) => {
    const admin = g.admins.includes(personId);
    const active = admin || g.meetups?.some((m) => m.hostId === personId || m.going.includes(personId)) || g.buys?.some((b) => b.hostId === personId || b.joined.includes(personId));
    return active ? [{ club: g, admin }] : [];
  }).sort((a, b) => Number(b.admin) - Number(a.admin));
}

/** Flat rows: club photo, name, what it is, and its next meetup. */
export function ClubRows({ clubs, adminIds = [] }: { clubs: Group[]; adminIds?: string[] }) {
  return (
    <div className="club-rows">
      {clubs.map((g) => {
        const next = g.meetups?.[0];
        return (
          <Link key={g.id} to={`/clubs/${g.id}`} className="club-row">
            <Cover src={groupPhoto(g.id)} glyph={g.glyph} tone={g.tone} className="club-row__photo" />
            <span className="club-row__body">
              <span className="club-row__name">
                {g.name}
                {adminIds.includes(g.id) ? <span className="badge badge--sm tone-violet">Admin</span> : null}
              </span>
              <span className="meta">
                {g.area} · {g.members.toLocaleString('en-IN')} members
              </span>
              {next ? (
                <span className="club-row__next">
                  {next.title} · {next.when}
                </span>
              ) : null}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
