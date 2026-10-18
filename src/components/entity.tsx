import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Place } from '../data/types';
import { GroupsGlyph, StoreGlyph, TreeGlyph, UserGlyph, type GlyphProps } from '../icons';

/**
 * Nearhood has three kinds of thing, and each always looks like itself:
 * people are round, pages are square with a shop-front mark (a tree for public
 * places like lakes and parks), and clubs are a stack of squares with a people mark.
 */
export type EntityKind = 'person' | 'page' | 'public' | 'club';

export const ENTITY: Record<EntityKind, { G: (p: GlyphProps) => ReactNode; label: string }> = {
  person: { G: UserGlyph, label: 'Person' },
  page: { G: StoreGlyph, label: 'Business page' },
  public: { G: TreeGlyph, label: 'Public place' },
  club: { G: GroupsGlyph, label: 'Club' },
};

export const placeKind = (place: Pick<Place, 'origin'>): EntityKind => (place.origin.publicPlace ? 'public' : 'page');

/** The small mark that says what something is, before its name. */
export function EntityMark({ kind, size = 13 }: { kind: EntityKind; size?: number }) {
  const { G, label } = ENTITY[kind];
  return (
    <span className={`entity-mark entity-mark--${kind}`} role="img" aria-label={label} title={label}>
      <G size={size} />
    </span>
  );
}

/** A photo in the shape of what it is, with its mark in the corner. */
export function EntityPic({ kind, src, size = 40, fallback, badge = true }: { kind: EntityKind; src?: string; size?: number; fallback?: ReactNode; badge?: boolean }) {
  const { G } = ENTITY[kind];
  return (
    <span className={`entity-pic entity-pic--${kind}`} style={{ width: size, height: size }}>
      <span className="entity-pic__img">{src ? <img src={src} alt="" loading="lazy" decoding="async" /> : fallback}</span>
      {badge && kind !== 'person' ? (
        <span className="entity-pic__badge" aria-hidden="true">
          <G size={Math.max(10, Math.round(size * 0.26))} />
        </span>
      ) : null}
    </span>
  );
}

/** "Business page · Coffee roastery · Navrangpura", "Club · 2.4k members · Bodakdev". */
export function EntityLine({ kind, children }: { kind: EntityKind; children?: ReactNode }) {
  return (
    <span className="entity-line">
      <EntityMark kind={kind} size={13} />
      <b>{ENTITY[kind].label}</b>
      {children ? <span className="entity-line__rest">· {children}</span> : null}
    </span>
  );
}

/* ---------- Actions: one main action, then a few small icons ---------- */

type Target = { to?: string; href?: string; onClick?: () => void };

function Act({ to, href, onClick, className, label, pressed, children }: Target & { className: string; label?: string; pressed?: boolean; children: ReactNode }) {
  if (to)
    return (
      <Link to={to} className={className} aria-label={label}>
        {children}
      </Link>
    );
  if (href)
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} aria-label={label}>
        {children}
      </a>
    );
  return (
    <button type="button" className={className} aria-label={label} aria-pressed={pressed} onClick={onClick}>
      {children}
    </button>
  );
}

export function ActionBar({ children, label }: { children: ReactNode; label: string }) {
  return (
    <nav className="action-bar" aria-label={label}>
      {children}
    </nav>
  );
}

/** The one thing you'd most likely do here: Check in, Join, Follow, Edit profile. */
export function MainAction({ icon, label, pressed, ...t }: Target & { icon?: ReactNode; label: string; pressed?: boolean }) {
  return (
    <Act {...t} pressed={pressed} className={`action-main${pressed ? ' is-on' : ''}`}>
      {icon}
      {label}
    </Act>
  );
}

/** Everything else as a small round icon, named for screen readers and on hover. */
export function IconButton({ icon, label, pressed, ...t }: Target & { icon: ReactNode; label: string; pressed?: boolean }) {
  return (
    <Act {...t} pressed={pressed} label={label} className={`action-icon${pressed ? ' is-on' : ''}`}>
      {icon}
      <span className="action-icon__tip" aria-hidden="true">
        {label}
      </span>
    </Act>
  );
}
