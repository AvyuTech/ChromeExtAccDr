import { useCallback, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { person } from '../data/core';
import { eventById } from '../data/events';
import { placeById } from '../data/places';
import type { Collection, WantItem } from '../data/types';
import { useT } from '../i18n';
import { CheckGlyph, NamedGlyph, TrashGlyph, type GlyphName } from '../icons';
import { useAppData } from '../state/appData';
import { Avatar } from './cards';
import { AvatarStack, WantButton } from './friends';

/* Pieces shared by the Friends hub, profiles, lists and Me. */

/** Link to a 1:1 chat, optionally with a message ready to send. */
export function chatLink(personId: string, draft?: string) {
  return `/messages/c-${personId}${draft ? `?draft=${encodeURIComponent(draft)}` : ''}`;
}

/** Where a list entry leads, and which glyph and tone it wears. */
export function wantTarget(item: WantItem): { to?: string; glyph: GlyphName; tone: string } {
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
      ) : (
        <span className={`tile tone-${target.tone}`} aria-hidden="true">
          <NamedGlyph name={target.glyph} size={20} duo />
        </span>
      )}
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
        <button type="button" className="icon-btn icon-btn--ghost" aria-label={`${t('people.remove')}: ${item.title}`} onClick={onRemove} style={{ width: 40, height: 40, color: 'var(--muted)' }}>
          <TrashGlyph size={18} />
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
  return (
    <div className="plan-together">
      <AvatarStack ids={['me', personId]} size={32} />
      <p className="body-sm grow">
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
    <div className="tabs" role="tablist" aria-label={label}>
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
