import { useState, type CSSProperties, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { eventPhoto, groupPhoto, personPhoto, placePhoto } from '../assets/photos';
import { ALERT_KIND_META } from '../data/city';
import { person, SOURCES } from '../data/core';
import type { CityAlert, CityEvent, Deal, Group, Person, Place, Post, SourceId, Tone } from '../data/types';
import { useT } from '../i18n';
import {
  AlertGlyph,
  CheckGlyph,
  ChevronRightGlyph,
  FlagGlyph,
  KebabGlyph,
  NamedGlyph,
  ReplyGlyph,
  SaveGlyph,
  ShareGlyph,
  ShieldGlyph,
  SparkGlyph,
  TrustRing,
  UpvoteGlyph,
  type GlyphName,
} from '../icons';
import { compact, km, price, priceLevel } from '../lib/format';
import { placeCommunity } from '../lib/friends';
import { DEFAULT_APP_DATA, useAppData } from '../state/appData';
import { enabledSources, useSettings } from '../state/settings';
import { useToast } from '../state/toast';
import { RichText, Sheet } from './ui';

/* ---------- Avatar: a real photo when we have one, initials otherwise ---------- */
export function Avatar({ who, size = 40, ring }: { who: Person; size?: number; ring?: boolean }) {
  const src = personPhoto(who.id);
  return (
    <span
      className={`avatar tone-${who.tone}${ring ? ' avatar--ring' : ''}`}
      style={{ ['--avatar-size' as string]: `${size}px` }}
      aria-hidden="true"
    >
      {src ? <img src={src} alt="" loading="lazy" decoding="async" /> : who.initials}
      {who.verified ? (
        <span className="avatar__tick">
          <CheckGlyph size={Math.max(8, Math.round(size * 0.22))} />
        </span>
      ) : null}
    </span>
  );
}

/** Overlapping faces, e.g. "based on 18 local replies". */
export function FaceStack({ ids, size = 26, max = 3 }: { ids: string[]; size?: number; max?: number }) {
  return (
    <span className="face-stack" aria-hidden="true">
      {ids.slice(0, max).map((id) => (
        <Avatar key={id} who={{ ...person(id), verified: false }} size={size} />
      ))}
    </span>
  );
}

/** A cover photo with a glyph fallback so nothing ever renders empty. */
export function Cover({
  src,
  glyph,
  tone = 'violet',
  className = '',
  style,
  children,
  alt = '',
}: {
  src?: string;
  glyph: GlyphName;
  tone?: Tone;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  alt?: string;
}) {
  return (
    <span className={`photo-frame tone-${tone} ${className}`} style={{ background: src ? undefined : 'var(--tone-bg)', color: 'var(--tone-ink)', ...style }}>
      {src ? (
        <img src={src} alt={alt} loading="lazy" decoding="async" />
      ) : (
        <span className="photo-frame__glyph">
          <NamedGlyph name={glyph} size={34} duo />
        </span>
      )}
      {children}
    </span>
  );
}

/* ---------- Where information came from ---------- */
const SOURCE_GLYPH: Record<SourceId, GlyphName> = {
  tickets: 'events',
  instagram: 'reel',
  maps: 'pin',
  news: 'news',
  neighbours: 'users',
  police: 'police',
  cyber: 'shield',
  amc: 'services',
  utility: 'bolt',
  imd: 'cloud',
  cpcb: 'air',
};

export function SourceChips({ sources, label }: { sources: SourceId[]; label?: string }) {
  const t = useT();
  if (sources.length === 0) return null;
  return (
    <div className="row row--wrap" style={{ gap: 6 }}>
      <span className="meta" style={{ marginRight: 2 }}>
        {label ?? t('answer.mergedFrom')}
      </span>
      {sources.map((s) => (
        <span key={s} className="badge badge--sm" style={{ fontWeight: 600, gap: 5 }}>
          <NamedGlyph name={SOURCE_GLYPH[s]} size={13} />
          {SOURCES[s].label}
        </span>
      ))}
    </div>
  );
}

/* ---------- Nearhood says (merged answer) ---------- */
export function AnswerCard({
  text,
  sources,
  agree,
  thinking,
  footer,
}: {
  text: string;
  sources: SourceId[];
  agree?: number;
  thinking?: boolean;
  footer?: ReactNode;
}) {
  const t = useT();
  const { settings } = useSettings();
  if (!settings.ai.answers) return null;
  return (
    <section aria-label={t('answer.label')} className="answer-card fade-up">
      <div className="row" style={{ gap: 10 }}>
        <span className="tile tone-violet" style={{ width: 38, height: 38, borderRadius: 13 }}>
          <SparkGlyph size={20} thinking={thinking} />
        </span>
        <span className="answer-inline__label grow" style={{ fontSize: '1rem' }}>
          {t('answer.label')}
        </span>
        {agree ? <TrustRing agree={Math.min(agree, 4)} size={26} title={t('answer.sourcesAgree', { n: agree })} /> : null}
      </div>
      <p className="answer-text" aria-live="polite">
        <RichText text={text} />
      </p>
      {settings.ai.showSources ? <SourceChips sources={sources} /> : null}
      {footer}
    </section>
  );
}

/* ---------- Feed post ---------- */
const TOPIC_TONE: Record<Post['type'], Tone> = {
  question: 'peach',
  recommendation: 'mint',
  alert: 'amber',
  lostfound: 'blue',
  event: 'violet',
  giveaway: 'teal',
};

export function PostCard({ post }: { post: Post }) {
  const t = useT();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { has, toggle, data } = useAppData();
  const toast = useToast();
  const author = person(post.authorId);
  const up = has('upvoted', post.id);
  const saved = has('savedPosts', post.id);
  // Sample counts for posts upvoted in the seed data already include this person's vote.
  const upCount = post.upvotes + (up ? 1 : 0) - (DEFAULT_APP_DATA.upvoted.includes(post.id) ? 1 : 0);
  const myReplies = data.myReplies[post.id]?.length ?? 0;
  const helpful = post.replies.find((r) => r.helpful) ?? post.replies[0];
  const showAnswer = settings.ai.answers && settings.ai.summariseThreads && post.answer;
  const repliers = Array.from(new Set(post.replies.map((r) => r.authorId)));
  const open = () => navigate(`/post/${post.id}`);

  return (
    <article className="feed-post">
      <div className="feed-post__head">
        <Link to={post.authorId === 'me' ? '/me' : `/people/${post.authorId}`} aria-label={author.name}>
          <Avatar who={author} size={34} />
        </Link>
        <div className="feed-post__who">
          <span className="feed-post__name">{author.name}</span>
          <span className="meta">
            {settings.privacy.showArea || post.authorId !== 'me' ? `${post.area} · ` : ''}
            {post.ago}
          </span>
        </div>
        <span className={`badge badge--sm tone-${TOPIC_TONE[post.type]}`}>{post.topic}</span>
        <PostMenu post={post} />
      </div>
      <p className="feed-post__text" onClick={open}>
        {post.text}
      </p>
      {showAnswer && post.answer ? (
        <Link to={`/post/${post.id}`} className="answer-inline" style={{ textDecoration: 'none', color: 'inherit' }}>
          <span className="answer-inline__label">
            <SparkGlyph size={15} />
            {t('answer.label')}
          </span>
          <span className="answer-text">
            <RichText text={post.answer.text} />
          </span>
          <span className="row" style={{ gap: 6 }}>
            {repliers.length ? <FaceStack ids={repliers} size={18} /> : null}
            <span className="meta">Based on {post.answer.basis.replace(/^from /, '')}</span>
          </span>
        </Link>
      ) : helpful ? (
        <Link to={`/post/${post.id}`} className="post-card__reply">
          <Avatar who={person(helpful.authorId)} size={22} />
          <span className="body-sm">
            <b>{person(helpful.authorId).name}</b> {helpful.text}
          </span>
        </Link>
      ) : null}
      <div className="feed-post__actions">
        <button
          type="button"
          className="feed-action"
          aria-pressed={up}
          aria-label={`Upvote, ${upCount}`}
          style={up ? { color: 'var(--accent)' } : undefined}
          onClick={() => toggle('upvoted', post.id)}
        >
          <UpvoteGlyph size={20} active={up} />
          {upCount}
        </button>
        <Link to={`/post/${post.id}`} className="feed-action" aria-label={t('common.replies', { n: post.replyCount + myReplies })}>
          <ReplyGlyph size={20} />
          {post.replyCount + myReplies}
        </Link>
        {post.seenInReels ? <span className="feed-post__note">Seen in {post.seenInReels} reels</span> : null}
        <span className="grow" />
        <button
          type="button"
          className="feed-action"
          aria-pressed={saved}
          aria-label={saved ? t('common.saved') : t('common.save')}
          style={saved ? { color: 'var(--accent)' } : undefined}
          onClick={() => {
            const on = toggle('savedPosts', post.id);
            toast(on ? 'Saved to your list' : 'Removed from saved');
          }}
        >
          <SaveGlyph size={20} active={saved} />
        </button>
      </div>
    </article>
  );
}

/** The ⋮ menu on a post: save, share, open the thread or flag it. */
function PostMenu({ post }: { post: Post }) {
  const t = useT();
  const navigate = useNavigate();
  const toast = useToast();
  const { has, toggle } = useAppData();
  const [open, setOpen] = useState(false);
  const saved = has('savedPosts', post.id);
  const share = async () => {
    setOpen(false);
    const url = `${window.location.origin}${window.location.pathname}#/post/${post.id}`;
    try {
      if (navigator.share) await navigator.share({ title: 'Nearhood', text: post.text, url });
      else {
        await navigator.clipboard.writeText(url);
        toast('Link copied');
      }
    } catch {
      /* dismissed */
    }
  };
  const rows: Array<{ label: string; glyph: ReactNode; onClick: () => void; danger?: boolean }> = [
    {
      label: saved ? 'Remove from saved' : t('common.save'),
      glyph: <SaveGlyph size={20} active={saved} />,
      onClick: () => {
        const on = toggle('savedPosts', post.id);
        toast(on ? 'Saved to your list' : 'Removed from saved');
        setOpen(false);
      },
    },
    { label: t('common.share'), glyph: <ShareGlyph size={20} />, onClick: share },
    { label: 'Open the thread', glyph: <ReplyGlyph size={20} />, onClick: () => navigate(`/post/${post.id}`) },
    {
      label: t('social.reportPost'),
      glyph: <FlagGlyph size={20} />,
      danger: true,
      onClick: () => {
        setOpen(false);
        toast(t('social.reportThanks'));
      },
    },
  ];
  return (
    <>
      <button
        type="button"
        className="icon-btn icon-btn--ghost post-card__menu"
        aria-label="Post options"
        aria-haspopup="dialog"
        style={{ width: 28, height: 32, marginRight: -8, color: 'var(--muted)' }}
        onClick={() => setOpen(true)}
      >
        <KebabGlyph size={20} />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Post options">
        <div className="list">
          {rows.map((r) => (
            <button key={r.label} type="button" className="list-row" onClick={r.onClick} style={r.danger ? { color: 'var(--red)' } : undefined}>
              <span className="tile" style={r.danger ? { background: 'var(--red-tint)', color: 'var(--red)' } : undefined}>
                {r.glyph}
              </span>
              <span className="list-row__body">
                <span className="list-row__title">{r.label}</span>
              </span>
            </button>
          ))}
        </div>
      </Sheet>
    </>
  );
}

export function ShareButton({ title, path, label }: { title: string; path: string; label?: boolean }) {
  const toast = useToast();
  const t = useT();
  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}#${path}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Nearhood', text: title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast('Link copied');
    } catch {
      toast('Could not share right now');
    }
  };
  return label ? (
    <button type="button" className="btn btn--outline" onClick={share}>
      <ShareGlyph size={18} />
      {t('common.share')}
    </button>
  ) : (
    <button type="button" className="icon-btn icon-btn--ghost" aria-label={t('common.share')} style={{ width: 40, height: 40, color: 'var(--muted)' }} onClick={share}>
      <ShareGlyph size={18} />
    </button>
  );
}

/* ---------- Events ---------- */
export function eventStatus(e: CityEvent): { text: string; tone: 'mint' | 'muted' | 'amber' } {
  if (!e.confirmed) return { text: e.unconfirmedNote ?? 'Unconfirmed', tone: 'amber' };
  if (e.fillingFast) return { text: `${compact(e.going)} going · filling fast`, tone: 'mint' };
  if (e.seatsLeft !== undefined && e.seatsLeft <= 12) return { text: `${e.seatsLeft} seats left`, tone: 'muted' };
  if (e.going > 0) return { text: `${compact(e.going)} going`, tone: 'mint' };
  return { text: `${compact(e.interested ?? 0)} interested`, tone: 'muted' };
}

/** Where an event was found, e.g. "From BookMyShow + 2 more". Nearhood lists events; it never sells them. */
export function eventSourceLine(event: CityEvent) {
  const first = SOURCES[event.sources[0]]?.label ?? 'the web';
  return event.sources.length > 1 ? `From ${first} + ${event.sources.length - 1} more` : `From ${first}`;
}

export function EventTile({ event, width = 200 }: { event: CityEvent; width?: number }) {
  const when = `${event.day} · ${event.time.split(' – ')[0]}`;
  return (
    <Link to={`/event/${event.id}`} className="photo-card" style={{ width }}>
      <Cover src={eventPhoto(event.id)} glyph={event.glyph} tone={event.tone} className="photo-card__media" alt="">
        <span className="photo-pill" style={{ top: 8, left: 8 }}>
          {when}
        </span>
      </Cover>
      <span className="photo-card__body">
        <span className="photo-card__title">{event.title}</span>
        <span className="meta">
          {event.area} · {price(event.price)}
        </span>
        <span className="meta" style={{ color: event.confirmed ? 'var(--accent)' : 'var(--amber-ink)', fontWeight: 600 }}>
          {event.confirmed ? eventSourceLine(event) : (event.unconfirmedNote ?? 'Unconfirmed')}
        </span>
      </span>
    </Link>
  );
}

export function EventRow({ event }: { event: CityEvent }) {
  const { settings } = useSettings();
  const allowed = enabledSources(settings);
  const agree = event.sources.filter(allowed).length;
  return (
    <Link to={`/event/${event.id}`} className={`media-row${event.confirmed ? '' : ' media-row--unconfirmed'}`}>
      <Cover src={eventPhoto(event.id)} glyph={event.glyph} tone={event.tone} className="media-row__thumb" />
      <span className="stack grow" style={{ gap: 5, minWidth: 0 }}>
        <span className="strong" style={{ fontSize: '0.9063rem', lineHeight: 1.3 }}>
          {event.title}
        </span>
        <span className="meta">
          {event.day}, {event.time} · {event.area} · {price(event.price)}
        </span>
        {event.confirmed ? (
          <span className="row meta" style={{ gap: 5 }}>
            <TrustRing agree={Math.min(agree, 4)} size={16} />
            {eventSourceLine(event)} · {agree} sources agree
          </span>
        ) : (
          <span className="badge badge--sm tone-amber" style={{ alignSelf: 'flex-start' }}>
            {event.unconfirmedNote ?? 'Unconfirmed'}
          </span>
        )}
      </span>
    </Link>
  );
}

/* ---------- City update ---------- */
const SEVERITY_TONE: Record<CityAlert['severity'], Tone> = { info: 'teal', advisory: 'amber', warning: 'peach', critical: 'red' };

export function AlertCard({ alert }: { alert: CityAlert }) {
  const t = useT();
  const tone = SEVERITY_TONE[alert.severity];
  const meta = ALERT_KIND_META[alert.kind];
  return (
    <Link to={`/city/alerts/${alert.id}`} className={`city-update tone-${tone} glyph-host`}>
      <span className="city-update__icon">
        {alert.kind === 'safety' ? (
          <ShieldGlyph size={19} duo />
        ) : alert.severity === 'info' ? (
          <NamedGlyph name={meta.glyph} size={19} duo />
        ) : (
          <AlertGlyph size={19} live={alert.active} duo />
        )}
      </span>
      <span className="stack grow" style={{ gap: 3, minWidth: 0 }}>
        <span className="eyebrow" style={{ color: 'var(--tone-ink)' }}>
          {t('home.cityAlert')} · {alert.ago}
        </span>
        <span className="strong" style={{ fontSize: '0.875rem', lineHeight: 1.35 }}>
          {alert.title}
        </span>
        <span className="meta">
          {SOURCES[alert.source].label}
          {alert.verified ? ` · ${t('common.verified')}` : ''}
        </span>
      </span>
      <ChevronRightGlyph size={18} style={{ color: 'var(--tone-ink)', flexShrink: 0 }} />
    </Link>
  );
}

/* ---------- Deal ---------- */
export function DealCard({ deal }: { deal: Deal }) {
  const t = useT();
  return (
    <Link to={`/deals/${deal.id}`} className="media-row glyph-host">
      <Cover src={deal.placeId ? placePhoto(deal.placeId) : undefined} glyph={deal.glyph} tone={deal.tone} className="media-row__thumb media-row__thumb--sm">
        <span className="deal-ribbon">{deal.discount}</span>
      </Cover>
      <span className="stack grow" style={{ gap: 4, minWidth: 0 }}>
        <span className="eyebrow" style={{ color: 'var(--accent)' }}>
          {t('home.deal')} · {deal.ends}
        </span>
        <span className="strong" style={{ fontSize: '0.9063rem', lineHeight: 1.3 }}>
          {deal.title}
        </span>
        <span className="meta">
          {deal.merchant} · {km(deal.distanceKm)}
        </span>
      </span>
      <ChevronRightGlyph size={18} style={{ color: 'var(--muted)', flexShrink: 0 }} />
    </Link>
  );
}

/* ---------- Place row ---------- */
export function PlaceRow({ place, last }: { place: Place; last?: boolean }) {
  const { data } = useAppData();
  const { settings } = useSettings();
  // Community verdicts from local check-ins replace star ratings.
  const community = placeCommunity(place.id, data, settings);
  const friends = community.friendIds;
  return (
    <Link to={`/place/${place.id}`} className="list-row glyph-host" style={last ? { borderBottom: 'none' } : undefined}>
      <Cover src={placePhoto(place.id)} glyph={place.glyph} tone={place.tone} className="place-thumb" />
      <span className="list-row__body">
        <span className="list-row__title">{place.name}</span>
        <span className="list-row__meta">
          {place.kind} · {place.area} · <span style={{ whiteSpace: 'nowrap' }}>{priceLevel(place.price)}</span>
        </span>
        {friends.length ? (
          <span className="row" style={{ gap: 6 }}>
            <FaceStack ids={friends} size={20} />
            <span className="list-row__meta" style={{ color: 'var(--accent)', fontWeight: 700 }}>
              {friends.length === 1 ? `${person(friends[0]).name.split(' ')[0]} has been` : `${friends.length} friends have been`}
            </span>
          </span>
        ) : null}
      </span>
      <span className="stack" style={{ gap: 4, alignItems: 'flex-end', flexShrink: 0 }}>
        {community.total === 0 ? (
          <span className="badge">New</span>
        ) : (
          <span className="badge tone-mint" style={{ gap: 4 }} aria-label={`${community.mustPct}% of ${community.total} locals say must try`}>
            <NamedGlyph name="must" size={13} duo />
            {community.mustPct}%
          </span>
        )}
        <span className="meta">{km(place.distanceKm)}</span>
      </span>
    </Link>
  );
}

/* ---------- Group row ---------- */
export function GroupRow({ group }: { group: Group }) {
  const t = useT();
  const { has, toggle } = useAppData();
  const toast = useToast();
  const joined = has('joinedGroups', group.id);
  return (
    <div className="row group-row" style={{ gap: 12 }}>
      <Cover src={groupPhoto(group.id)} glyph={group.glyph} tone={group.tone} className="place-thumb" />
      <Link to={`/clubs/${group.id}`} className="stack grow" style={{ gap: 2, textDecoration: 'none', color: 'inherit', minWidth: 0 }}>
        <span className="strong" style={{ fontSize: '0.9688rem' }}>
          {group.name}
        </span>
        <span className="meta">
          {compact(group.members)} members · {group.area}
        </span>
        {group.meetups?.[0] ? (
          <span className="meta" style={{ color: 'var(--accent)', fontWeight: 600 }}>
            Next: {group.meetups[0].title} · {group.meetups[0].when}
          </span>
        ) : null}
      </Link>
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
    </div>
  );
}
