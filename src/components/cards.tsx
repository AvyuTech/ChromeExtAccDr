import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ALERT_KIND_META } from '../data/city';
import { person, SOURCES } from '../data/core';
import type { CityAlert, CityEvent, Deal, Group, Person, Place, Post, SourceId, Tone } from '../data/types';
import { useT } from '../i18n';
import {
  AlertGlyph,
  ChevronRightGlyph,
  CheckGlyph,
  NamedGlyph,
  ReplyGlyph,
  SaveGlyph,
  ShareGlyph,
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
import { RichText, Tile } from './ui';

/* ---------- Avatar ---------- */
export function Avatar({ who, size = 38 }: { who: Person; size?: number }) {
  return (
    <span className={`avatar tone-${who.tone}`} style={{ ['--avatar-size' as string]: `${size}px` }} aria-hidden="true">
      {who.initials}
      {who.verified ? (
        <span
          style={{
            position: 'absolute',
            right: -2,
            bottom: -2,
            width: 15,
            height: 15,
            borderRadius: 8,
            background: 'var(--mint-strong)',
            border: '2px solid var(--surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#062a1f',
          }}
        >
          <CheckGlyph size={9} />
        </span>
      ) : null}
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
  metro: 'transit',
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

/* ---------- The Nearhood answer ---------- */
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
      <div className="row" style={{ gap: 8 }}>
        <span className="tile tone-solid" style={{ width: 34, height: 34, borderRadius: 11 }}>
          <SparkGlyph size={18} thinking={thinking} />
        </span>
        <span className="display strong grow" style={{ fontSize: '0.9375rem' }}>
          {t('answer.label')}
        </span>
        {agree ? <TrustRing agree={Math.min(agree, 4)} size={24} title={t('answer.sourcesAgree', { n: agree })} /> : null}
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
  question: 'violet',
  recommendation: 'mint',
  alert: 'amber',
  lostfound: 'peach',
  event: 'blue',
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
  const open = () => navigate(`/post/${post.id}`);

  return (
    <article className="card stack" style={{ gap: 12 }}>
      <div className="row">
        <Avatar who={author} />
        <div className="grow" style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="strong" style={{ fontSize: '0.90625rem' }}>
            {author.name}
          </span>
          <span className="meta">
            {settings.privacy.showArea || post.authorId !== 'me' ? `${post.area} · ` : ''}
            {post.ago}
          </span>
        </div>
        <span className={`badge tone-${TOPIC_TONE[post.type]}`} style={{ fontWeight: 600 }}>
          {post.topic}
        </span>
      </div>
      <p className="body" style={{ cursor: 'pointer' }} onClick={open}>
        {post.text}
      </p>
      {showAnswer && post.answer ? (
        <Link to={`/post/${post.id}`} className="answer-inline" style={{ textDecoration: 'none', color: 'inherit' }}>
          <span className="row" style={{ gap: 6 }}>
            <SparkGlyph size={15} style={{ color: 'var(--accent)' }} />
            <span className="answer-inline__label">
              {t('answer.label')} · {post.answer.basis}
            </span>
          </span>
          <span className="body-sm">
            <RichText text={post.answer.text} />
          </span>
        </Link>
      ) : helpful ? (
        <Link to={`/post/${post.id}`} className="row" style={{ alignItems: 'flex-start', padding: 12, background: 'var(--surface-2)', borderRadius: 16, textDecoration: 'none', color: 'inherit' }}>
          <Avatar who={person(helpful.authorId)} size={28} />
          <span className="body-sm">
            <b>{person(helpful.authorId).name}</b> {helpful.text}
          </span>
        </Link>
      ) : null}
      <div className="row" style={{ gap: 4, color: 'var(--muted)', fontSize: '0.84375rem', fontWeight: 500 }}>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          aria-pressed={up}
          aria-label={`Upvote, ${upCount}`}
          style={{ color: up ? 'var(--accent)' : 'var(--muted)', fontWeight: up ? 700 : 500, padding: '0 10px', gap: 6 }}
          onClick={() => toggle('upvoted', post.id)}
        >
          <UpvoteGlyph size={18} active={up} />
          {upCount}
        </button>
        <Link to={`/post/${post.id}`} className="btn btn--ghost btn--sm" style={{ color: 'var(--muted)', fontWeight: 500, padding: '0 10px', gap: 6 }}>
          <ReplyGlyph size={18} />
          {t('common.replies', { n: post.replyCount + myReplies })}
        </Link>
        <span className="grow" />
        {post.seenInReels ? (
          <span className="badge tone-mint">Seen in {post.seenInReels} reels</span>
        ) : (
          <>
            <button
              type="button"
              className="icon-btn icon-btn--ghost"
              aria-pressed={saved}
              aria-label={saved ? t('common.saved') : t('common.save')}
              style={{ width: 38, height: 38, color: saved ? 'var(--accent)' : 'var(--muted)' }}
              onClick={() => {
                const on = toggle('savedPosts', post.id);
                toast(on ? 'Saved to your list' : 'Removed from saved');
              }}
            >
              <SaveGlyph size={18} active={saved} />
            </button>
            <ShareButton title={post.text} path={`/post/${post.id}`} />
          </>
        )}
      </div>
    </article>
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
    <button type="button" className="icon-btn icon-btn--ghost" aria-label={t('common.share')} style={{ width: 38, height: 38, color: 'var(--muted)' }} onClick={share}>
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

export function EventTile({ event }: { event: CityEvent }) {
  const status = eventStatus(event);
  const when = `${event.day.toUpperCase()} · ${event.time.split(' – ')[0].toUpperCase()}`;
  return (
    <Link to={`/event/${event.id}`} className="card glyph-host" style={{ flexShrink: 0, width: 210, padding: 0, overflow: 'hidden', textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}>
      <div className={`tone-${event.tone}`} style={{ height: 110, background: 'var(--tone-bg)', color: 'var(--tone-ink)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <NamedGlyph name={event.glyph} size={46} live />
        <span className="badge badge--sm" style={{ position: 'absolute', top: 10, left: 10, background: '#fff', color: '#17142b' }}>
          {when}
        </span>
      </div>
      <div className="stack" style={{ gap: 6, padding: 12 }}>
        <span className="strong" style={{ fontSize: '0.90625rem', lineHeight: 1.3 }}>
          {event.title}
        </span>
        <span className="meta">
          {event.area} · {price(event.price)}
        </span>
        <span className="row" style={{ gap: 6, fontSize: '0.78125rem', fontWeight: 600, color: status.tone === 'mint' ? 'var(--mint-ink)' : status.tone === 'amber' ? 'var(--amber-ink)' : 'var(--muted)' }}>
          <span className={`live-dot${status.tone === 'muted' ? ' live-dot--muted' : status.tone === 'amber' ? ' live-dot--amber' : ''}`} />
          {status.text}
        </span>
      </div>
    </Link>
  );
}

export function EventRow({ event }: { event: CityEvent }) {
  const { settings } = useSettings();
  const allowed = enabledSources(settings);
  const agree = event.sources.filter(allowed).length;
  return (
    <Link
      to={`/event/${event.id}`}
      className="card card--tight glyph-host"
      style={{ display: 'flex', gap: 12, padding: 12, textDecoration: 'none', color: 'inherit', borderStyle: event.confirmed ? 'solid' : 'dashed', borderColor: event.confirmed ? undefined : 'var(--amber-line)' }}
    >
      <span className={`tile tile--xl tone-${event.tone}`}>
        <NamedGlyph name={event.glyph} size={30} duo={event.tone !== 'night'} />
      </span>
      <span className="stack grow" style={{ gap: 5, minWidth: 0 }}>
        <span className="strong" style={{ fontSize: '0.9375rem' }}>
          {event.title}
        </span>
        <span className="meta">
          {event.day}, {event.time} · {event.area} · {price(event.price)}
        </span>
        {event.confirmed ? (
          <span className="row" style={{ gap: 8 }}>
            <span style={{ fontSize: '0.78125rem', fontWeight: 700, color: 'var(--mint-ink)' }}>
              {event.going > 0 ? `${compact(event.going)} going` : `${compact(event.interested ?? 0)} interested`}
            </span>
            <span className="row meta" style={{ gap: 5 }}>
              <TrustRing agree={Math.min(agree, 4)} size={16} />
              {event.seatsLeft !== undefined && event.seatsLeft <= 12 ? `${event.seatsLeft} seats left` : `${agree} sources agree`}
            </span>
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

/* ---------- City alert ---------- */
const SEVERITY_TONE: Record<CityAlert['severity'], Tone> = { info: 'teal', advisory: 'amber', warning: 'peach', critical: 'red' };

export function AlertCard({ alert }: { alert: CityAlert }) {
  const t = useT();
  const tone = SEVERITY_TONE[alert.severity];
  const meta = ALERT_KIND_META[alert.kind];
  return (
    <Link
      to={`/city/alerts/${alert.id}`}
      className={`tone-${tone} glyph-host`}
      style={{ display: 'flex', gap: 12, padding: 14, borderRadius: 20, background: 'var(--tone-bg)', border: '1px solid color-mix(in srgb, var(--tone-ink) 22%, transparent)', textDecoration: 'none', color: 'var(--ink)' }}
    >
      <span className="tile" style={{ background: 'color-mix(in srgb, var(--tone-ink) 16%, var(--tone-bg))', color: 'var(--tone-ink)' }}>
        {alert.severity === 'info' ? <NamedGlyph name={meta.glyph} size={20} duo /> : <AlertGlyph size={20} live={alert.active} duo />}
      </span>
      <span className="stack" style={{ gap: 4 }}>
        <span className="eyebrow" style={{ color: 'var(--tone-ink)' }}>
          {t('home.cityAlert')} · {alert.ago}
        </span>
        <span className="strong" style={{ fontSize: '0.9375rem', lineHeight: 1.35 }}>
          {alert.title}
        </span>
        <span className="meta" style={{ color: 'color-mix(in srgb, var(--tone-ink) 75%, var(--ink))' }}>
          Source: {SOURCES[alert.source].label}
          {alert.verified ? ` · ${t('common.verified')}` : ''}
        </span>
      </span>
    </Link>
  );
}

/* ---------- Deal ---------- */
export function DealCard({ deal }: { deal: Deal }) {
  const t = useT();
  return (
    <Link
      to={`/deals/${deal.id}`}
      className="glyph-host"
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 20, background: 'var(--mint-tint)', border: '1px solid var(--mint-line)', textDecoration: 'none', color: 'var(--ink)' }}
    >
      <span className="tile tile--lg" style={{ background: 'var(--mint-strong)', color: '#ffffff', width: 44, height: 44 }}>
        <NamedGlyph name="deals" size={22} live />
      </span>
      <span className="stack grow" style={{ gap: 3 }}>
        <span className="eyebrow" style={{ color: 'var(--green-ink)' }}>
          {t('home.deal')} · {deal.ends}
        </span>
        <span className="strong" style={{ fontSize: '0.9375rem', lineHeight: 1.3 }}>
          {deal.title} at {deal.merchant}
        </span>
      </span>
      <span className="icon-btn" style={{ border: 'none', color: 'var(--green-ink)' }} aria-hidden="true">
        <ChevronRightGlyph size={18} />
      </span>
    </Link>
  );
}

/* ---------- Place row ---------- */
export function PlaceRow({ place, last }: { place: Place; last?: boolean }) {
  const { data } = useAppData();
  const { settings } = useSettings();
  // Community verdicts from local check-ins replace star ratings.
  const community = placeCommunity(place.id, data, settings);
  const friends = community.friendIds.length;
  return (
    <Link to={`/place/${place.id}`} className="list-row glyph-host" style={last ? { borderBottom: 'none' } : undefined}>
      <Tile glyph={place.glyph} tone={place.tone} size="lg" />
      <span className="list-row__body">
        <span className="list-row__title">{place.name}</span>
        <span className="list-row__meta">
          {place.kind} · {place.area} · <span style={{ whiteSpace: 'nowrap' }}>{priceLevel(place.price)}</span>
        </span>
        {friends ? (
          <span className="list-row__meta" style={{ color: 'var(--accent)', fontWeight: 600 }}>
            {friends === 1 ? '1 friend has been' : `${friends} friends have been`}
          </span>
        ) : null}
      </span>
      <span className="stack" style={{ gap: 4, alignItems: 'flex-end', flexShrink: 0 }}>
        {community.total === 0 ? (
          <span className="badge">New</span>
        ) : (
          <span className="badge tone-mint" style={{ gap: 4 }} aria-label={`${community.mustPct}% of ${community.total} locals say must try`}>
            <NamedGlyph name="must" size={13} duo />
            {community.mustPct}% · {compact(community.total)}
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
    <div className="card card--tight row" style={{ gap: 12 }}>
      <span className={`tile tile--round tone-${group.tone}`} style={{ width: 44, height: 44, background: 'var(--tone-ink)', color: 'var(--surface)' }}>
        <NamedGlyph name={group.glyph} size={20} />
      </span>
      <Link to={`/groups/${group.id}`} className="stack grow" style={{ gap: 2, textDecoration: 'none', color: 'inherit' }}>
        <span className="strong" style={{ fontSize: '0.9375rem' }}>
          {group.name}
        </span>
        <span className="meta">
          {compact(group.members)} members · {group.postsToday} posts today
        </span>
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
