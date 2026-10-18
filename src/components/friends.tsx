import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { person } from '../data/core';
import { placeById } from '../data/places';
import type { CheckIn, Collection, Tone, Verdict, WantItem } from '../data/types';
import { CheckGlyph, HeartGlyph, NamedGlyph, PlusGlyph, ReplyGlyph, ShieldGlyph, WantGlyph, type GlyphName } from '../icons';
import { compact, rupees } from '../lib/format';
import { canSee, isFriend, isWanted, profileInfo, storyPeople, tasteMatch, VERDICT_LABEL, type PlaceCommunity } from '../lib/friends';
import { DEFAULT_APP_DATA, useAppData } from '../state/appData';
import { useSettings } from '../state/settings';
import { useToast } from '../state/toast';
import { Avatar, ShareButton } from './cards';

/* Shared pieces of the friends layer. Styles live in styles/pages/friends.css. */

export const VERDICT_META: Record<Verdict, { tone: Tone; glyph: GlyphName }> = {
  must: { tone: 'mint', glyph: 'must' },
  good: { tone: 'violet', glyph: 'good' },
  skip: { tone: 'peach', glyph: 'skip' },
};

export function VerdictBadge({ verdict, kind = 'ate', size = 'md' }: { verdict: Verdict; kind?: CheckIn['kind']; size?: 'sm' | 'md' }) {
  const meta = VERDICT_META[verdict];
  return (
    <span className={`badge tone-${meta.tone}${size === 'sm' ? ' badge--sm' : ''}`} style={{ gap: 5 }}>
      <NamedGlyph name={meta.glyph} size={size === 'sm' ? 13 : 15} duo />
      {VERDICT_LABEL[verdict][kind]}
    </span>
  );
}

/** Must try / Good / Skip shares as one bar, with how many locals and how many verified. */
export function VerdictBar({ c, compactLegend }: { c: PlaceCommunity; compactLegend?: boolean }) {
  if (c.total === 0) return <p className="meta">No check-ins yet. Be the first to share.</p>;
  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="verdict-bar" role="img" aria-label={`${c.mustPct}% must try, ${c.goodPct}% good, ${c.skipPct}% skip, from ${c.total} locals`}>
        <span className="verdict-bar__must" style={{ width: `${c.mustPct}%` }} />
        <span className="verdict-bar__good" style={{ width: `${c.goodPct}%` }} />
        <span className="verdict-bar__skip" style={{ width: `${c.skipPct}%` }} />
      </div>
      <div className="row row--wrap" style={{ gap: 12, fontSize: '0.78125rem' }}>
        <span className="verdict-key verdict-key--must">
          <b>{c.mustPct}%</b> Must try
        </span>
        <span className="verdict-key verdict-key--good">
          <b>{c.goodPct}%</b> Good
        </span>
        <span className="verdict-key verdict-key--skip">
          <b>{c.skipPct}%</b> Skip
        </span>
      </div>
      {compactLegend ? null : (
        <span className="meta row" style={{ gap: 5 }}>
          <ShieldGlyph size={14} />
          {compact(c.total)} locals · {c.verifiedPct}% verified visits{c.excluded ? ` · ${c.excluded} invited or unverified not counted` : ''}
        </span>
      )}
    </div>
  );
}

/** Small "must try %" chip used in place rows and cards. */
export function MustPctChip({ c }: { c: PlaceCommunity }) {
  if (!c.total) return <span className="badge">New</span>;
  return (
    <span className="badge tone-mint" style={{ gap: 4 }} aria-label={`${c.mustPct}% of ${c.total} locals say must try`}>
      <NamedGlyph name="must" size={13} duo />
      {c.mustPct}% · {compact(c.total)}
    </span>
  );
}

export function AvatarStack({ ids, size = 24, max = 4 }: { ids: string[]; size?: number; max?: number }) {
  const shown = ids.slice(0, max);
  return (
    <span className="avatar-stack" aria-label={ids.map((i) => person(i).name).join(', ')}>
      {shown.map((id) => (
        <Avatar key={id} who={{ ...person(id), verified: false }} size={size} />
      ))}
      {ids.length > max ? <span className="avatar-stack__more">+{ids.length - max}</span> : null}
    </span>
  );
}

export function TasteMatchPill({ personId }: { personId: string }) {
  const { settings } = useSettings();
  const m = tasteMatch(settings, personId);
  return <span className="badge tone-violet">{m}% taste match</span>;
}

/* ---------- Follow ---------- */
export function FollowButton({ personId, size = 'sm' }: { personId: string; size?: 'sm' | 'md' }) {
  const { data, toggle } = useAppData();
  const toast = useToast();
  const following = data.following.includes(personId);
  const friend = isFriend(data, personId);
  const followsMe = profileInfo(personId).followsMe;
  const name = person(personId).name.split(' ')[0];
  const label = following ? (friend ? 'Friends' : 'Following') : followsMe ? 'Follow back' : 'Follow';
  return (
    <button
      type="button"
      className={`btn ${size === 'sm' ? 'btn--sm' : ''} ${following ? 'btn--secondary' : 'btn--primary'}`}
      aria-pressed={following}
      onClick={() => {
        const on = toggle('following', personId);
        toast(on ? `You're following ${name}` : `Unfollowed ${name}`);
      }}
    >
      {friend ? <CheckGlyph size={14} /> : null}
      {label}
    </button>
  );
}

/* ---------- Want to try ---------- */
export function wantFromCheckIn(c: CheckIn): WantItem {
  const first = c.items[0];
  if (first && c.placeId) {
    return { id: `w-${c.id}`, kind: c.kind === 'ate' ? 'dish' : 'activity', refId: c.placeId, title: first, sub: `at ${c.placeName}`, fromId: c.authorId };
  }
  return { id: `w-${c.id}`, kind: c.eventId ? 'event' : 'place', refId: c.placeId ?? c.eventId, title: c.placeName, sub: c.area, fromId: c.authorId };
}

export function WantButton({ item, variant = 'chip' }: { item: WantItem; variant?: 'chip' | 'button' | 'icon' }) {
  const { data, toggleWant } = useAppData();
  const toast = useToast();
  const on = isWanted(data, item);
  const click = () => {
    const added = toggleWant(item);
    toast(added ? `Added "${item.title}" to Want to try` : 'Removed from Want to try');
  };
  if (variant === 'icon') {
    return (
      <button type="button" className="icon-btn icon-btn--ghost" aria-pressed={on} aria-label={on ? 'On your Want to try list' : 'Add to Want to try'} onClick={click} style={{ width: 38, height: 38, color: on ? 'var(--accent)' : 'var(--muted)' }}>
        <WantGlyph size={18} active={on} />
      </button>
    );
  }
  return (
    <button type="button" className={`btn btn--sm ${on ? 'btn--secondary' : variant === 'button' ? 'btn--soft' : 'btn--outline'}`} aria-pressed={on} onClick={click}>
      <WantGlyph size={16} active={on} />
      {on ? 'On your list' : 'Want to try'}
    </button>
  );
}

/* ---------- Check-in card ---------- */
export function CheckInCard({ c, showPlace = true, footer }: { c: CheckIn; showPlace?: boolean; footer?: ReactNode }) {
  const navigate = useNavigate();
  const { data, has, toggle } = useAppData();
  const author = person(c.authorId);
  const place = c.placeId ? placeById(c.placeId) : undefined;
  const liked = has('likedCheckIns', c.id);
  const likes = c.likes + (liked ? 1 : 0) - (DEFAULT_APP_DATA.likedCheckIns.includes(c.id) ? 1 : 0);
  const comments = c.comments.length + (data.checkInComments[c.id]?.length ?? 0);
  const verb = c.kind === 'ate' ? 'ate at' : 'went to';
  const tone = place?.tone ?? (c.kind === 'ate' ? 'peach' : 'teal');
  const glyph: GlyphName = place?.glyph ?? (c.kind === 'ate' ? 'food' : 'events');
  const friend = data.following.includes(c.authorId);
  if (!canSee(data, c)) return null;

  return (
    <article className="card checkin-card">
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <Link to={c.authorId === 'me' ? '/me' : `/people/${c.authorId}`} aria-label={author.name} style={{ textDecoration: 'none' }}>
          <Avatar who={author} />
        </Link>
        <div className="grow stack" style={{ gap: 1 }}>
          <span style={{ fontSize: '0.90625rem' }}>
            <Link to={c.authorId === 'me' ? '/me' : `/people/${c.authorId}`} className="strong checkin-card__link">
              {c.authorId === 'me' ? 'You' : author.name}
            </Link>{' '}
            <span className="muted">{showPlace ? verb : c.kind === 'ate' ? 'had' : 'did'}</span>
            {showPlace ? (
              <>
                {' '}
                {c.placeId ? (
                  <Link to={`/place/${c.placeId}`} className="strong checkin-card__link">
                    {c.placeName}
                  </Link>
                ) : c.eventId ? (
                  <Link to={`/event/${c.eventId}`} className="strong checkin-card__link">
                    {c.placeName}
                  </Link>
                ) : (
                  <b>{c.placeName}</b>
                )}
              </>
            ) : null}
          </span>
          <span className="meta">
            {friend && c.authorId !== 'me' ? 'Friend · ' : ''}
            {c.ago}
            {c.audience === 'friends' ? ' · Friends only' : ''}
          </span>
        </div>
        <VerdictBadge verdict={c.verdict} kind={c.kind} />
      </div>

      <button type="button" className={`checkin-card__plate tone-${tone}`} onClick={() => navigate(`/checkin/${c.id}`)} aria-label={`Open check-in: ${c.items.join(', ')}`}>
        <span className="checkin-card__glyph">
          <NamedGlyph name={glyph} size={26} duo />
        </span>
        <span className="checkin-card__items">
          {c.items.map((i) => (
            <span key={i} className="checkin-card__item">
              {i}
            </span>
          ))}
        </span>
      </button>

      {c.note ? (
        <p className="body" style={{ fontSize: '0.9375rem' }}>
          {c.note}
        </p>
      ) : null}

      <div className="row row--wrap" style={{ gap: 6 }}>
        {c.verifiedVisit ? (
          <span className="badge badge--sm tone-mint" title="Confirmed at the venue">
            <ShieldGlyph size={12} />
            Verified visit
          </span>
        ) : (
          <span className="badge badge--sm">Unverified</span>
        )}
        {c.invited ? <span className="badge badge--sm tone-amber">Invited · not counted</span> : null}
        {c.spend !== undefined ? <span className="badge badge--sm">{c.spend === 0 ? 'Free' : `~${rupees(c.spend)} pp`}</span> : null}
        {c.withIds?.length ? <span className="badge badge--sm">With {c.withIds.map((w) => person(w).name.split(' ')[0]).join(', ')}</span> : null}
        {c.tags.slice(0, 3).map((t) => (
          <span key={t} className="badge badge--sm">
            {t}
          </span>
        ))}
      </div>

      <div className="row" style={{ gap: 2, color: 'var(--muted)' }}>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          aria-pressed={liked}
          aria-label={`Like, ${likes}`}
          style={{ color: liked ? 'var(--red)' : 'var(--muted)', padding: '0 10px', gap: 6, fontWeight: liked ? 700 : 500 }}
          onClick={() => toggle('likedCheckIns', c.id)}
        >
          <HeartGlyph size={18} active={liked} />
          {likes}
        </button>
        <Link to={`/checkin/${c.id}`} className="btn btn--ghost btn--sm" style={{ color: 'var(--muted)', padding: '0 10px', gap: 6, fontWeight: 500 }}>
          <ReplyGlyph size={18} />
          {comments}
        </Link>
        <span className="grow" />
        {c.authorId !== 'me' ? <WantButton item={wantFromCheckIn(c)} variant="icon" /> : null}
        <ShareButton title={`${author.name}: ${c.items.join(', ')} at ${c.placeName}`} path={`/checkin/${c.id}`} />
      </div>
      {footer}
    </article>
  );
}

/* ---------- Friends strip (top of Home) ---------- */
export function FriendStrip() {
  const navigate = useNavigate();
  const { data, add } = useAppData();
  const people = storyPeople(data);
  return (
    <nav aria-label="Friends today" className="friend-strip">
      <Link to="/checkin" className="friend-strip__item">
        <span className="friend-strip__ring friend-strip__ring--me">
          <Avatar who={{ ...person('me'), verified: false }} size={52} />
          <span className="friend-strip__plus" aria-hidden="true">
            <PlusGlyph size={12} />
          </span>
        </span>
        <span className="friend-strip__name">Check in</span>
      </Link>
      {people.map((p) => (
        <button
          key={p.id}
          type="button"
          className="friend-strip__item"
          onClick={() => {
            add('seenStories', p.id);
            navigate(`/checkin/${p.latest.id}`);
          }}
          aria-label={`${person(p.id).name}: ${p.latest.items.join(', ')} at ${p.latest.placeName}${p.seen ? '' : ', new'}`}
        >
          <span className={`friend-strip__ring${p.seen ? ' is-seen' : ''}`}>
            <Avatar who={{ ...person(p.id), verified: false }} size={52} />
            <span className={`friend-strip__verdict tone-${VERDICT_META[p.latest.verdict].tone}`} aria-hidden="true">
              <NamedGlyph name={VERDICT_META[p.latest.verdict].glyph} size={12} />
            </span>
          </span>
          <span className="friend-strip__name">{person(p.id).name.split(' ')[0]}</span>
        </button>
      ))}
      <Link to="/friends?tab=find" className="friend-strip__item">
        <span className="friend-strip__ring is-seen friend-strip__ring--find">
          <NamedGlyph name="friends" size={24} />
        </span>
        <span className="friend-strip__name">Find friends</span>
      </Link>
    </nav>
  );
}

/* ---------- People ---------- */
export function PersonRow({ personId, meta }: { personId: string; meta?: ReactNode }) {
  const p = person(personId);
  const info = profileInfo(personId);
  return (
    <div className="list-row">
      <Link to={`/people/${personId}`} className="row grow" style={{ textDecoration: 'none', color: 'inherit', minWidth: 0 }}>
        <Avatar who={p} size={44} />
        <span className="list-row__body">
          <span className="list-row__title">{p.name}</span>
          <span className="list-row__meta">{meta ?? `@${info.handle} · ${info.checkIns} check-ins`}</span>
        </span>
      </Link>
      <FollowButton personId={personId} />
    </div>
  );
}

/* ---------- Curated list card ---------- */
export function CollectionCard({ col }: { col: Collection }) {
  const owner = person(col.ownerId);
  const places = col.placeIds.map((id) => placeById(id)).filter(Boolean);
  return (
    <Link to={`/lists/${col.id}`} className="card collection-card glyph-host">
      <span className="collection-card__tiles" aria-hidden="true">
        {places.slice(0, 3).map((p) => (
          <span key={p!.id} className={`tile tone-${p!.tone}`}>
            <NamedGlyph name={p!.glyph} size={20} duo />
          </span>
        ))}
      </span>
      <span className="strong" style={{ fontSize: '0.96875rem', lineHeight: 1.3 }}>
        {col.title}
      </span>
      <span className="meta">
        by {col.ownerId === 'me' ? 'you' : owner.name} · {places.length} places · {compact(col.followers)} followers
      </span>
    </Link>
  );
}
