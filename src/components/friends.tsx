import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { person } from '../data/core';
import { itemPhoto, placePhoto } from '../assets/photos';
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
/** Follow state for one person and a toggle that says what happened. */
export function useFollow(personId: string) {
  const { data, toggle } = useAppData();
  const toast = useToast();
  const following = data.following.includes(personId);
  const friend = isFriend(data, personId);
  const followsMe = profileInfo(personId).followsMe;
  const name = person(personId).name.split(' ')[0];
  const label = following ? (friend ? 'Friends' : 'Following') : followsMe ? 'Follow back' : 'Follow';
  const flip = () => {
    const on = toggle('following', personId);
    toast(on ? `You're following ${name}` : `Unfollowed ${name}`);
  };
  return { following, friend, label, flip };
}

export function FollowButton({ personId, size = 'sm' }: { personId: string; size?: 'sm' | 'md' }) {
  const { following, friend, label, flip } = useFollow(personId);
  return (
    <button type="button" className={`btn ${size === 'sm' ? 'btn--sm' : ''} ${following ? 'btn--secondary' : 'btn--primary'}`} aria-pressed={following} onClick={flip}>
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
      <button type="button" className="icon-btn icon-btn--ghost" aria-pressed={on} aria-label={on ? 'On your Want to try list' : 'Add to Want to try'} onClick={click} style={{ width: 32, height: 32, color: on ? 'var(--accent)' : 'var(--ink)' }}>
        <WantGlyph size={19} active={on} />
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
export function CheckInCard({ c, showPlace = true, footer, layout = 'card' }: { c: CheckIn; showPlace?: boolean; footer?: ReactNode; layout?: 'card' | 'hero' }) {
  const navigate = useNavigate();
  const { settings } = useSettings();
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
  const photoSrc = itemPhoto(c.items[0], c.placeId, c.eventId);
  if (!canSee(data, c)) return null;

  const hero = layout === 'hero';
  const profile = c.authorId === 'me' ? '/me' : `/people/${c.authorId}`;
  const spend = c.spend === undefined ? undefined : c.spend === 0 ? 'Free' : `~${rupees(c.spend)} pp`;
  const facts = [
    c.city ? `In ${c.city}` : place?.origin.outsideCity ? `Outside ${settings.location.city}` : undefined,
    c.invited ? 'Invited · not counted' : undefined,
    spend,
    c.withIds?.length ? `With ${c.withIds.map((w) => person(w).name.split(' ')[0]).join(', ')}` : undefined,
    ...c.tags.filter((t) => t.toLowerCase() !== spend?.toLowerCase()).slice(0, 3),
  ].filter(Boolean);

  const media = (
    <>
      {photoSrc ? (
        <img src={photoSrc} alt="" loading={hero ? undefined : 'lazy'} decoding="async" />
      ) : (
        <span className="feed-post__glyph">
          <NamedGlyph name={glyph} size={hero ? 48 : 36} duo />
        </span>
      )}
      <span className="feed-post__tags">
        {c.items.map((i) => (
          <span key={i} className="feed-post__tag">
            {i}
          </span>
        ))}
      </span>
    </>
  );

  return (
    <article className={`feed-post${hero ? ' feed-post--hero' : ''}`}>
      <div className="feed-post__head">
        <Link to={profile} aria-label={author.name} style={{ textDecoration: 'none' }}>
          <Avatar who={author} size={34} />
        </Link>
        <div className="feed-post__who">
          <span className="feed-post__line">
            <Link to={profile} className="feed-post__name">
              {c.authorId === 'me' ? 'You' : author.name}
            </Link>{' '}
            <span className="muted">{showPlace ? verb : c.kind === 'ate' ? 'had' : 'did'}</span>
            {showPlace ? (
              <>
                {' '}
                {c.placeId ? (
                  <Link to={`/place/${c.placeId}`} className="feed-post__name">
                    {c.placeName}
                  </Link>
                ) : c.eventId ? (
                  <Link to={`/event/${c.eventId}`} className="feed-post__name">
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
        <VerdictBadge verdict={c.verdict} kind={c.kind} size="sm" />
      </div>

      {hero ? (
        <div className={`feed-post__media tone-${tone}`} role="img" aria-label={`${c.items.join(', ')} at ${c.placeName}`}>
          {media}
        </div>
      ) : (
        <button type="button" className={`feed-post__media tone-${tone}`} onClick={() => navigate(`/checkin/${c.id}`)} aria-label={`Open check-in: ${c.items.join(', ')}`}>
          {media}
        </button>
      )}

      <div className="feed-post__actions">
        <button
          type="button"
          className="feed-action"
          aria-pressed={liked}
          aria-label={`Like, ${likes}`}
          style={liked ? { color: 'var(--red)' } : undefined}
          onClick={() => toggle('likedCheckIns', c.id)}
        >
          <HeartGlyph size={21} active={liked} />
          {likes}
        </button>
        <Link to={`/checkin/${c.id}`} className="feed-action" aria-label={`Comments, ${comments}`}>
          <ReplyGlyph size={20} />
          {comments}
        </Link>
        <span className="grow" />
        {c.authorId !== 'me' ? <WantButton item={wantFromCheckIn(c)} variant="icon" /> : null}
        <ShareButton title={`${author.name}: ${c.items.join(', ')} at ${c.placeName}`} path={`/checkin/${c.id}`} />
      </div>

      {c.note ? <p className={hero ? 'feed-post__text feed-post__text--lg' : 'feed-post__text'}>{c.note}</p> : null}

      <p className="feed-post__facts">
        {c.verifiedVisit ? (
          <span className="feed-post__verified" title="Confirmed at the venue">
            <ShieldGlyph size={13} />
            Verified visit
          </span>
        ) : (
          <span>Unverified</span>
        )}
        {facts.map((f) => (
          <span key={f}>{f}</span>
        ))}
      </p>
      {footer}
    </article>
  );
}

/* ---------- Photo grid of check-ins (profiles) ---------- */
export function CheckInGrid({ items }: { items: CheckIn[] }) {
  return (
    <div className="checkin-grid">
      {items.map((c) => {
        const place = c.placeId ? placeById(c.placeId) : undefined;
        const src = itemPhoto(c.items[0], c.placeId, c.eventId);
        const meta = VERDICT_META[c.verdict];
        return (
          <Link
            key={c.id}
            to={`/checkin/${c.id}`}
            className={`checkin-tile tone-${place?.tone ?? (c.kind === 'ate' ? 'peach' : 'teal')}`}
            aria-label={`${c.items.join(', ')} at ${c.placeName}, ${VERDICT_LABEL[c.verdict][c.kind]}, ${c.ago}`}
          >
            {src ? (
              <img src={src} alt="" loading="lazy" decoding="async" />
            ) : (
              <span className="checkin-tile__glyph">
                <NamedGlyph name={place?.glyph ?? (c.kind === 'ate' ? 'food' : 'events')} size={34} duo />
              </span>
            )}
            <span className={`checkin-tile__verdict tone-${meta.tone}`} aria-hidden="true">
              <NamedGlyph name={meta.glyph} size={12} duo />
            </span>
          </Link>
        );
      })}
    </div>
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
          <PlusGlyph size={22} />
          <span className="friend-strip__plus" aria-hidden="true">
            <PlusGlyph size={11} />
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
            <Avatar who={{ ...person(p.id), verified: false }} size={49} />
            {p.seen ? null : <span className="friend-strip__online" aria-hidden="true" />}
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
        <Avatar who={p} size={40} />
        <span className="list-row__body">
          <span className="list-row__title">{p.name}</span>
          <span className="list-row__meta">{meta ?? `@${info.handle} · ${info.checkIns} check-ins`}</span>
        </span>
      </Link>
      <FollowButton personId={personId} />
    </div>
  );
}

/** Suggestion card with a cover photo, for "Suggested for you". */
export function PersonCard({ personId, reason, cover }: { personId: string; reason: string; cover?: string }) {
  const p = person(personId);
  const info = profileInfo(personId);
  return (
    <article className="person-card">
      <Link to={`/people/${personId}`} className="person-card__link" aria-label={`${p.name}, ${reason}`}>
        <span className="person-card__cover">{cover ? <img src={cover} alt="" loading="lazy" decoding="async" /> : null}</span>
        <span className="person-card__avatar">
          <Avatar who={p} size={52} />
        </span>
        <span className="person-card__name">{p.name}</span>
        <span className="meta person-card__handle">@{info.handle}</span>
        <span className="person-card__reason">{reason}</span>
      </Link>
      <FollowButton personId={personId} />
    </article>
  );
}

/* ---------- Curated list card ---------- */
export function CollectionCard({ col }: { col: Collection }) {
  const owner = person(col.ownerId);
  const places = col.placeIds.map((id) => placeById(id)).filter(Boolean);
  return (
    <Link to={`/lists/${col.id}`} className="collection-card glyph-host">
      <span className={`collection-card__mosaic collection-card__mosaic--${Math.min(places.length, 3)}`} aria-hidden="true">
        {places.slice(0, 3).map((p) => (
          <span key={p!.id} className={`tone-${p!.tone}`}>
            {placePhoto(p!.id) ? <img src={placePhoto(p!.id)} alt="" loading="lazy" decoding="async" /> : <NamedGlyph name={p!.glyph} size={24} duo />}
          </span>
        ))}
      </span>
      <span className="collection-card__body">
        <span className="photo-card__title">{col.title}</span>
        <span className="row" style={{ gap: 6 }}>
          <Avatar who={{ ...owner, verified: false }} size={18} />
          <span className="meta truncate">
            {col.ownerId === 'me' ? 'You' : owner.name.split(' ')[0]} · {places.length} places · {compact(col.followers)} followers
          </span>
        </span>
      </span>
    </Link>
  );
}
