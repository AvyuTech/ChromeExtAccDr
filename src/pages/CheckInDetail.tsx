import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { eventPhoto, placePhoto } from '../assets/photos';
import { Avatar, Cover } from '../components/cards';
import { CheckInRow } from '../components/checkin';
import { OwnerReplyView } from '../components/discover';
import { AvatarStack, CheckInCard, FollowButton, WantButton, wantFromCheckIn } from '../components/friends';
import { EmptyState, PageHeader, SectionHead } from '../components/ui';
import { person } from '../data/core';
import { eventById } from '../data/events';
import { placeById } from '../data/places';
import { useT } from '../i18n';
import { ChatGlyph, ChevronRightGlyph, NamedGlyph, SendGlyph } from '../icons';
import { compact } from '../lib/format';
import { allCheckIns, canSee, checkInFor, placeCommunity } from '../lib/friends';
import { ownerReplyFor, runsPage } from '../lib/places';
import { useAppData } from '../state/appData';
import { useSettings } from '../state/settings';

export default function CheckInDetail() {
  const { id = '' } = useParams();
  const t = useT();
  const { settings } = useSettings();
  const { data, addCheckInComment } = useAppData();
  const [comment, setComment] = useState('');

  const c = checkInFor(data, id);

  if (!c) {
    return (
      <>
        <PageHeader title={t('checkin.detail')} />
        <main className="page page--with-header">
          <EmptyState
            glyph="checkin"
            title={t('checkin.notFound')}
            body={t('checkin.notFoundBody')}
            action={
              <Link to="/" className="btn btn--soft btn--sm">
                {t('checkin.home')}
              </Link>
            }
          />
        </main>
      </>
    );
  }

  const author = person(c.authorId);
  const first = author.name.split(' ')[0];

  if (!canSee(data, c)) {
    return (
      <>
        <PageHeader title={t('checkin.detail')} />
        <main className="page page--with-header">
          <div className="stack checkin-locked">
            <Avatar who={author} size={64} />
            <h2 className="section__title">{t('checkin.lockedTitle', { name: first })}</h2>
            <p className="body-sm muted">{t('checkin.lockedBody')}</p>
            <FollowButton personId={c.authorId} size="md" />
          </div>
        </main>
      </>
    );
  }

  const place = c.placeId ? placeById(c.placeId) : undefined;
  const event = c.eventId ? eventById(c.eventId) : undefined;
  const community = place ? placeCommunity(place.id, data, settings) : undefined;
  const comments = [...c.comments, ...(data.checkInComments[c.id] ?? [])];
  const everything = allCheckIns(data).filter((x) => x.id !== c.id && canSee(data, x));
  const moreFromAuthor = everything.filter((x) => x.authorId === c.authorId).slice(0, 3);
  const othersHere = community ? community.reviews.filter((x) => x.id !== c.id).slice(0, 4) : [];
  const mine = c.authorId === 'me';
  const ownerReply = place ? ownerReplyFor(c.id, place.id, data) : undefined;
  const canReply = !!place && runsPage(place) && !ownerReply && !mine;
  const draft = `Hi ${first}! How was the ${c.items[0]?.toLowerCase() ?? 'visit'} at ${c.placeName}?`;

  const send = (e: FormEvent) => {
    e.preventDefault();
    const text = comment.trim();
    if (!text) return;
    addCheckInComment(c.id, { id: `cmt-${Date.now()}`, authorId: 'me', text, ago: 'Just now' });
    setComment('');
  };

  return (
    <>
      <PageHeader title={t('checkin.detail')} sub={c.placeName} />
      <main className="page page--with-header">
        <CheckInCard c={c} layout="hero" />
        {ownerReply && place ? <OwnerReplyView reply={ownerReply} place={place} /> : null}
        {canReply && place ? (
          <Link to={`/place/${place.id}/manage?reply=${c.id}`} className="btn btn--soft btn--sm" style={{ alignSelf: 'flex-start' }}>
            Reply as the owner of {place.name}
          </Link>
        ) : null}

        {place && community ? (
          <Link to={`/place/${place.id}`} className="place-mini glyph-host">
            <Cover src={placePhoto(place.id)} glyph={place.glyph} tone={place.tone} className="place-mini__photo" />
            <span className="stack grow" style={{ gap: 3, minWidth: 0 }}>
              <span className="place-mini__name">{place.name}</span>
              <span className="meta">
                {place.kind} · {place.area}
              </span>
              {community.total ? (
                <span className="place-mini__score">
                  <NamedGlyph name="must" size={14} duo />
                  {t('checkin.localsSay', { pct: community.mustPct, n: compact(community.total) })}
                </span>
              ) : null}
              {community.friendIds.length ? (
                <span className="row" style={{ gap: 6 }}>
                  <AvatarStack ids={community.friendIds} size={18} />
                  <span className="meta">{t('checkin.friendsBeen', { n: community.friendIds.length })}</span>
                </span>
              ) : null}
            </span>
            <ChevronRightGlyph size={18} style={{ color: 'var(--muted)', flexShrink: 0 }} />
          </Link>
        ) : event ? (
          <Link to={`/event/${event.id}`} className="place-mini glyph-host">
            <Cover src={eventPhoto(event.id)} glyph={event.glyph} tone={event.tone} className="place-mini__photo" />
            <span className="stack grow" style={{ gap: 3, minWidth: 0 }}>
              <span className="place-mini__name">{event.title}</span>
              <span className="meta">
                {event.day}, {event.time} · {event.area}
              </span>
            </span>
            <ChevronRightGlyph size={18} style={{ color: 'var(--muted)', flexShrink: 0 }} />
          </Link>
        ) : null}

        <div className="row row--wrap checkin-detail__actions" style={{ gap: 6 }}>
          {mine ? (
            <Link to={place ? `/checkin?place=${place.id}` : '/checkin'} className="btn btn--soft btn--sm">
              <NamedGlyph name="checkin" size={16} />
              {t('checkin.again')}
            </Link>
          ) : (
            <>
              <WantButton item={wantFromCheckIn(c)} variant="button" />
              <Link to={`/messages/c-${c.authorId}?draft=${encodeURIComponent(draft)}`} className="btn btn--outline btn--sm">
                <ChatGlyph size={16} />
                {t('checkin.ask', { name: first })}
              </Link>
            </>
          )}
        </div>

        <section className="section" aria-labelledby="ci-comments">
          <SectionHead id="ci-comments" title={`${t('checkin.comments')} · ${comments.length}`} />
          {comments.length ? (
            <div className="stack" style={{ gap: 12 }}>
              {comments.map((cm) => {
                const who = person(cm.authorId);
                return (
                  <div key={cm.id} className="row comment-row">
                    <Avatar who={who} size={30} />
                    <p className="comment-row__text">
                      <b>{cm.authorId === 'me' ? 'You' : who.name}</b> {cm.text}
                      <span className="meta comment-row__ago">{cm.ago}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="meta">{t('checkin.noComments')}</p>
          )}
          <form className="row comment-form" onSubmit={send}>
            <label htmlFor="ci-comment" className="sr-only">
              {t('checkin.commentPlaceholder')}
            </label>
            <input
              id="ci-comment"
              className="input"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('checkin.commentPlaceholder')}
              maxLength={300}
              autoComplete="off"
            />
            <button type="submit" className="icon-btn icon-btn--accent" aria-label={t('checkin.send')} disabled={!comment.trim()}>
              <SendGlyph size={18} />
            </button>
          </form>
        </section>

        {othersHere.length ? (
          <section className="section" aria-labelledby="ci-others">
            <SectionHead id="ci-others" title={t('checkin.othersHere')} to={place ? `/place/${place.id}` : undefined} linkLabel={t('checkin.seePlace')} />
            <div className="list">
              {othersHere.map((x) => (
                <CheckInRow key={x.id} c={x} />
              ))}
            </div>
          </section>
        ) : null}

        {moreFromAuthor.length ? (
          <section className="section" aria-labelledby="ci-more">
            <SectionHead
              id="ci-more"
              title={mine ? t('checkin.moreFrom', { name: 'you' }) : t('checkin.moreFrom', { name: first })}
              to={mine ? '/me' : `/people/${c.authorId}`}
            />
            <div className="list">
              {moreFromAuthor.map((x) => (
                <CheckInRow key={x.id} c={x} showAuthor={false} />
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </>
  );
}
