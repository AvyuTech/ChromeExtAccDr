import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { eventPhoto, placePhoto } from '../assets/photos';
import { person } from '../data/core';
import type { CityEvent, Reply } from '../data/types';
import { CheckGlyph, FireGlyph, ReplyGlyph, StarGlyph, TicketGlyph, UsersGlyph } from '../icons';
import { compact, km, price } from '../lib/format';
import { eventSocial, eventThreadId, eventVoteId, trendRank } from '../lib/events';
import { isWanted } from '../lib/friends';
import { eventHost } from '../lib/hosts';
import { buildThread } from '../lib/thread';
import { levelFor } from '../lib/helpful';
import { useAppData } from '../state/appData';
import { useSettings } from '../state/settings';
import { useToast } from '../state/toast';
import { Avatar, FaceStack, Votes } from './cards';
import { draftLink } from './community';
import { EntityPic, placeKind } from './entity';
import { ReplyThread } from './thread';
import { Sheet } from './ui';
import { placeById } from '../data/places';
import { groupById } from '../data/social';
import { clubPhoto } from './clubs';

/*
  The social side of an event: Interested or Going (never a ticket), who's going,
  going together, and talking about it. Tickets stay a link out.
*/

const wantItemFor = (e: CityEvent) => ({ id: `w-event-${e.id}`, kind: 'event' as const, refId: e.id, title: e.title, sub: `${e.day}, ${e.time}` });

/** "🔥 #1 trending" for the top three events right now. */
export function TrendBadge({ event, pill }: { event: CityEvent; pill?: boolean }) {
  const { data } = useAppData();
  const rank = trendRank(event, data);
  if (!rank) return null;
  return (
    <span className={pill ? 'photo-pill trend-pill' : 'trend-tag'}>
      <FireGlyph size={12} />#{rank} trending
    </span>
  );
}

/** Interested and Going: two toggles, one choice. Interested also saves it to Want to try. */
export function GoingButtons({ event, compact: small }: { event: CityEvent; compact?: boolean }) {
  const toast = useToast();
  const { settings } = useSettings();
  const { data, setEventStatus, toggleWant } = useAppData();
  const status = data.eventStatus[event.id];
  const item = wantItemFor(event);
  const wanted = isWanted(data, item);

  const interested = () => {
    if (status === 'interested') {
      setEventStatus(event.id, null);
      if (wanted) toggleWant(item);
      toast('Not interested any more');
    } else {
      setEventStatus(event.id, 'interested');
      if (!wanted) toggleWant(item);
      toast('Interested. Saved to Want to try');
    }
  };
  const going = () => {
    if (status === 'going') {
      setEventStatus(event.id, wanted ? 'interested' : null);
      toast('Not going');
    } else {
      setEventStatus(event.id, 'going');
      toast(settings.privacy.showGoing ? 'You’re going. Friends will see it' : 'You’re going. Only you can see it');
    }
  };
  return (
    <div className={`going-btns${small ? ' going-btns--sm' : ''}`} role="group" aria-label="Your plans">
      <button type="button" className={`going-btn${status === 'interested' ? ' is-on' : ''}`} aria-pressed={status === 'interested'} onClick={interested}>
        <StarGlyph size={small ? 14 : 16} />
        Interested
      </button>
      <button type="button" className={`going-btn going-btn--go${status === 'going' ? ' is-on' : ''}`} aria-pressed={status === 'going'} onClick={going}>
        <CheckGlyph size={small ? 14 : 16} />
        {status === 'going' || small ? 'Going' : 'I’m going'}
      </button>
    </div>
  );
}

/** "46 going · 128 interested", with the faces of friends going. */
export function GoingLine({ event, onOpen }: { event: CityEvent; onOpen?: () => void }) {
  const { data } = useAppData();
  const s = eventSocial(event, data);
  const faces = [...(s.status === 'going' ? ['me'] : []), ...s.friendsGoing];
  const names = s.friendsGoing.map((id) => person(id).name.split(' ')[0]);
  const friendsText = names.length ? `${names.length > 2 ? `${names.slice(0, 2).join(', ')} and ${names.length - 2} more` : names.join(' and ')} going` : '';
  const inner = (
    <>
      {faces.length ? <FaceStack ids={faces} size={20} max={4} /> : null}
      <span>
        <b className="num">{compact(s.going)}</b> going · <b className="num">{compact(s.interested)}</b> interested
        {friendsText ? <span className="going-line__friends"> · {friendsText}</span> : null}
      </span>
    </>
  );
  return onOpen ? (
    <button type="button" className="going-line" onClick={onOpen} aria-haspopup="dialog">
      {inner}
    </button>
  ) : (
    <span className="going-line">{inner}</span>
  );
}

/** Who's going: friends first, then everyone else who lets people see it. */
export function WhoIsGoingSheet({ event, open, onClose }: { event: CityEvent; open: boolean; onClose: () => void }) {
  const { data } = useAppData();
  const { settings } = useSettings();
  const s = eventSocial(event, data);
  const others = s.goingIds.filter((id) => !s.friendsGoing.includes(id));
  const row = (id: string, note: string) => (
    <Link key={id} to={id === 'me' ? '/me' : `/people/${id}`} className="list-row" onClick={onClose}>
      <Avatar who={person(id)} size={36} />
      <span className="list-row__body">
        <span className="list-row__title">{id === 'me' ? 'You' : person(id).name}</span>
        <span className="list-row__meta">{note}</span>
      </span>
    </Link>
  );
  return (
    <Sheet open={open} onClose={onClose} title={`${compact(s.going)} going`}>
      <div className="list">
        {s.status === 'going' ? row('me', settings.privacy.showGoing ? 'Friends can see you’re going' : 'Only you can see this (Settings › Privacy)') : null}
        {s.friendsGoing.map((id) => row(id, 'Friend · going'))}
        {s.friendsInterested.map((id) => row(id, 'Friend · interested'))}
        {others.map((id) => row(id, `Going · ${person(id).area}`))}
      </div>
      <p className="meta" style={{ margin: 0 }}>
        Going and interested are plans, not tickets. People who hide their plans in Privacy only count in the numbers.
      </p>
    </Sheet>
  );
}

/** Once you're going: say you've got a ticket, and find people to go with. */
export function GoTogether({ event }: { event: CityEvent }) {
  const toast = useToast();
  const { data, toggle } = useAppData();
  const s = eventSocial(event, data);
  const going = s.status === 'going';
  const others = s.company.filter((id) => id !== 'me');
  if (!going && !others.length) return null;
  return (
    <section className="go-together" aria-labelledby="go-together-title">
      <h2 className="section__title" id="go-together-title">
        Go together
      </h2>
      {going ? (
        <div className="go-together__mine">
          <button
            type="button"
            className={`chip${data.eventTickets.includes(event.id) ? ' chip--soft' : ''}`}
            aria-pressed={data.eventTickets.includes(event.id)}
            onClick={() => toast(toggle('eventTickets', event.id) ? 'Friends will see you have a ticket' : 'Ticket removed')}
          >
            <TicketGlyph size={14} />
            {data.eventTickets.includes(event.id) ? 'I’ve got my ticket' : 'Got your ticket?'}
          </button>
          <button
            type="button"
            className={`chip${data.eventCompany.includes(event.id) ? ' chip--soft' : ''}`}
            aria-pressed={data.eventCompany.includes(event.id)}
            onClick={() => toast(toggle('eventCompany', event.id) ? 'People going alone can now say hi' : 'Off')}
          >
            <UsersGlyph size={14} />
            {data.eventCompany.includes(event.id) ? 'Looking for company' : 'Going alone? Find company'}
          </button>
        </div>
      ) : null}
      {others.length ? (
        <div className="list">
          {others.map((id) => (
            <div key={id} className="list-row">
              <Avatar who={person(id)} size={36} />
              <span className="list-row__body">
                <span className="list-row__title">{person(id).name}</span>
                <span className="list-row__meta">Going alone · would like company</span>
              </span>
              <Link to={draftLink(id, `Hi! I saw you're going to ${event.title} too. Want to go together?`)} className="btn btn--sm btn--soft">
                Say hi
              </Link>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

/** Talk about it: questions, tips and plans, threaded and voted like any post. */
export function EventTalk({ event }: { event: CityEvent }) {
  const { data, addReply } = useAppData();
  const toast = useToast();
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const key = eventThreadId(event.id);
  const replies = [...(event.replies ?? []), ...(data.myReplies[key] ?? [])];
  const s = eventSocial(event, data);
  const thread = buildThread(replies, 'helpful', (id) => levelFor(id).index);
  const to = replyTo ? replies.find((r) => r.id === replyTo) : undefined;

  const send = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const reply: Reply = { id: `my-ev-${Date.now()}`, authorId: 'me', text, ago: 'now', upvotes: 0, ...(replyTo ? { parentId: replyTo } : {}) };
    addReply(key, reply);
    setDraft('');
    setReplyTo(null);
    toast('Posted');
  };

  return (
    <section className="event-talk" aria-labelledby="event-talk-title">
      <h2 className="section__title" id="event-talk-title">
        Talk about it · {s.replies}
      </h2>
      {replies.length ? (
        <ReplyThread nodes={thread} postAuthorId={event.host?.kind === 'person' ? event.host.id : ''} topic="Weekend plans" onReply={setReplyTo} />
      ) : (
        <p className="body-sm muted" style={{ margin: 0 }}>
          No questions yet. Ask about parking, what to wear, or who else is going.
        </p>
      )}
      {replies.length < s.replies ? <p className="replies-more">Showing {replies.length} of {s.replies}, most helpful first</p> : null}
      <form className="event-talk__form" onSubmit={send}>
        {to ? (
          <span className="composer-bar__to">
            Replying to {to.authorId === 'me' ? 'yourself' : person(to.authorId).name.split(' ')[0]}
            <button type="button" aria-label="Reply to the event instead" onClick={() => setReplyTo(null)}>
              ×
            </button>
          </span>
        ) : null}
        <input className="input" value={draft} maxLength={300} onChange={(e) => setDraft(e.target.value)} placeholder="Ask or add something…" aria-label="Talk about it" />
        <button type="submit" className="composer-bar__send" aria-label="Post to the discussion" disabled={!draft.trim()}>
          Post
        </button>
      </form>
    </section>
  );
}

/** An event in the feed: who posted it, the photo, plans and talk, like any post. */
export function EventPost({ event }: { event: CityEvent }) {
  const { data } = useAppData();
  const host = eventHost(event);
  const s = eventSocial(event, data);
  const start = event.time.split(' – ')[0];
  const hostPic =
    host?.kind === 'person' ? (
      <Avatar who={person(host.id)} size={34} />
    ) : host?.kind === 'page' ? (
      <EntityPic kind={placeById(host.id) ? placeKind(placeById(host.id)!) : 'page'} src={placePhoto(host.id)} size={34} />
    ) : host?.kind === 'club' && groupById(host.id) ? (
      <EntityPic kind="club" src={clubPhoto(groupById(host.id)!)} size={34} />
    ) : null;
  return (
    <article className="feed-post event-feed">
      <div className="feed-post__head">
        {host ? (
          <Link to={host.to} aria-label={host.name}>
            {hostPic}
          </Link>
        ) : null}
        <div className="feed-post__who">
          <span className="feed-post__line">
            <span className="feed-post__name">{host?.name ?? event.organiser}</span>
            <span className="host-kind">{host?.kind === 'person' ? 'shared an event' : 'posted an event'}</span>
          </span>
          <span className="meta">
            {event.area} · {event.day}, {start}
          </span>
        </div>
      </div>
      <Link to={`/event/${event.id}`} className="feed-post__media">
        {eventPhoto(event.id) ? <img src={eventPhoto(event.id)} alt="" loading="lazy" /> : null}
        <span className="photo-pill" style={{ top: 10, left: 10 }}>
          {event.day} · {start}
        </span>
        <span style={{ position: 'absolute', top: 10, right: 10 }}>
          <TrendBadge event={event} pill />
        </span>
      </Link>
      <Link to={`/event/${event.id}`} className="event-feed__title">
        {event.title}
      </Link>
      <p className="feed-post__facts">
        <span>{event.price === 0 ? 'Free' : price(event.price)}</span>
        <span>{km(event.distanceKm)}</span>
        <span>Tickets {event.link ? 'via link' : 'not needed'}</span>
      </p>
      <GoingLine event={event} />
      <div className="feed-post__actions">
        <Votes id={eventVoteId(event.id)} up={event.upvotes ?? 0} down={event.downvotes} />
        <Link to={`/event/${event.id}#talk`} className="feed-action" aria-label={`${s.replies} comments`}>
          <ReplyGlyph size={20} />
          {s.replies}
        </Link>
        <span className="grow" />
        <GoingButtons event={event} compact />
      </div>
    </article>
  );
}
