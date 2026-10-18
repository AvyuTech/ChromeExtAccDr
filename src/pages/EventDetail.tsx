import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { eventPhoto, placePhoto } from '../assets/photos';
import { Avatar, SourceChips } from '../components/cards';
import { clubPhoto } from '../components/clubs';
import { RecommendSheet } from '../components/community';
import { downloadEventIcs, EventLinkRow, eventFriends, eventSourceLine, friendsLine, useShare } from '../components/discover';
import { AvatarStack } from '../components/friends';
import { EmptyState, PageHeader, SectionHead } from '../components/ui';
import { person } from '../data/core';
import { EVENTS, eventById } from '../data/events';
import { groupById } from '../data/social';
import { useT } from '../i18n';
import { AlertGlyph, CalendarGlyph, ExternalGlyph, FriendsGlyph, NavigateGlyph, PinGlyph, SendGlyph, ShareGlyph, TrustRing, WantGlyph } from '../icons';
import { km, price } from '../lib/format';
import { isWanted } from '../lib/friends';
import { eventHost, venuePage, type Host } from '../lib/hosts';
import { useAppData } from '../state/appData';
import { enabledSources, useSettings } from '../state/settings';
import { useToast } from '../state/toast';

const CATEGORY_LABEL: Record<string, string> = {
  music: 'Live music',
  market: 'Market',
  comedy: 'Comedy',
  heritage: 'Heritage',
  workshop: 'Workshop',
  food: 'Food',
  sports: 'Sports',
  kids: 'Kids',
  wellness: 'Wellness',
};

const DAY_NAME: Record<string, string> = { Sat: 'Saturday', Sun: 'Sunday', Fri: 'Friday', 'Sat–Sun': 'Saturday & Sunday', Today: 'Today', Tomorrow: 'Tomorrow' };

/** "in.bookmyshow.com" from a URL, for the link-out row. */
function host(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** "Pickle & Play · Pickleball courts · Thaltej · posted an event": who shared it. */
function EventHostHead({ host }: { host: Host }) {
  const icon =
    host.kind === 'person' ? (
      <Avatar who={person(host.id)} size={34} />
    ) : (
      <span className="host-icon" aria-hidden="true">
        {host.kind === 'page' ? (
          placePhoto(host.id) ? <img src={placePhoto(host.id)} alt="" /> : <PinGlyph size={16} />
        ) : groupById(host.id) ? (
          <img src={clubPhoto(groupById(host.id)!)} alt="" />
        ) : null}
      </span>
    );
  return (
    <div className="feed-post__head">
      <Link to={host.to} aria-label={host.name}>
        {icon}
      </Link>
      <div className="feed-post__who">
        <span className="feed-post__line">
          <Link to={host.to} className="feed-post__name">
            {host.name}
          </Link>
          <span className="host-kind">{host.kind === 'person' ? 'shared an event' : host.kind === 'page' ? 'Page' : 'Club'}</span>
        </span>
        <span className="meta">{host.sub}</span>
      </div>
    </div>
  );
}

/**
 * An event is a post by a person, a page or a club. Found on ticketing sites, organisers' pages, reels and news.
 * Nearhood doesn't sell tickets or take RSVPs: it links out, and shows which
 * friends want to go or went.
 */
export default function EventDetail() {
  const { id = '' } = useParams();
  const t = useT();
  const toast = useToast();
  const share = useShare();
  const { settings } = useSettings();
  const { data, toggleWant } = useAppData();
  const [sendOpen, setSendOpen] = useState(false);
  const event = eventById(id);

  if (!event) {
    return (
      <>
        <PageHeader title={t('chip.events')} fallback="/explore/events" />
        <main className="page page--with-header">
          <EmptyState
            glyph="events"
            title={t('discover.event.notFound')}
            action={
              <Link to="/explore/events" className="btn btn--soft btn--sm">
                {t('chip.events')}
              </Link>
            }
          />
        </main>
      </>
    );
  }

  const sources = event.sources.filter(enabledSources(settings));
  const agree = Math.min(sources.length, 4);
  const similar = EVENTS.filter((e) => e.id !== event.id && (e.category === event.category || e.tags.some((tag) => event.tags.includes(tag)))).slice(0, 4);
  const when = `${DAY_NAME[event.day] ?? event.day}, ${event.time}`;
  const startTime = event.time.split(' – ')[0];
  const { want, went } = eventFriends(event.id, data);
  const wantItem = { id: `w-event-${event.id}`, kind: 'event' as const, refId: event.id, title: event.title, sub: `${event.day}, ${event.time}` };
  const wanted = isWanted(data, wantItem);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue}, ${event.area}, Ahmedabad`)}`;
  const from = eventSourceLine(event);
  const hostInfo = eventHost(event);
  const venue = venuePage(event);

  return (
    <>
      <PageHeader title="Event" fallback="/explore/events" />
      <main className="page page--with-header">
        <article className="feed-post event-post">
          {hostInfo ? <EventHostHead host={hostInfo} /> : null}
          <figure className="feed-post__media">
            {eventPhoto(event.id) ? <img src={eventPhoto(event.id)} alt="" /> : null}
            <span className="photo-pill event-post__when">
              {event.day === 'Today' ? `Tonight · ${startTime}` : `${event.day} · ${startTime}`}
            </span>
          </figure>
          <h1 className="event-post__title">{event.title}</h1>
          <p className="feed-post__facts">
            <span>{CATEGORY_LABEL[event.category] ?? event.category}</span>
            <span>{when}</span>
            <span>{event.price === 0 ? 'Free entry' : `Entry ${price(event.price)}`}</span>
            <span>{km(event.distanceKm)}</span>
          </p>
          <p className="feed-post__text">{event.description}</p>
          <p className="event-post__where">
            <PinGlyph size={14} />
            <span>
              {venue ? <Link to={`/place/${venue.id}`}>{venue.name}</Link> : event.venue}
              <span className="muted">, {event.area}</span>
            </span>
          </p>
          {event.link ? (
            <a className="btn btn--primary btn--block event-post__link" href={event.link.url} target="_blank" rel="noopener noreferrer">
              {event.link.label}
              <ExternalGlyph size={15} />
            </a>
          ) : null}
          <p className="meta" style={{ margin: 0 }}>
            {event.link ? `Opens ${host(event.link.url)}. ` : ''}
            {t('discover.event.noTickets')}
          </p>
          <div className="feed-post__actions">
            <button
              type="button"
              className="feed-action"
              aria-pressed={wanted}
              style={wanted ? { color: 'var(--accent)' } : undefined}
              onClick={() => {
                const added = toggleWant(wantItem);
                toast(added ? `Added "${event.title}" to Want to try` : 'Removed from Want to try');
              }}
            >
              <WantGlyph size={20} active={wanted} />
              {t('discover.action.wantToGo')}
            </button>
            <button
              type="button"
              className="feed-action"
              aria-label={t('discover.event.calendar')}
              onClick={() => toast(downloadEventIcs(event) ? 'Calendar file downloaded' : 'Could not create a calendar file')}
            >
              <CalendarGlyph size={20} />
            </button>
            <a className="feed-action" href={mapsUrl} target="_blank" rel="noopener noreferrer" aria-label={t('discover.action.directions')}>
              <NavigateGlyph size={20} />
            </a>
            <span className="grow" />
            <button type="button" className="feed-action" aria-label={t('discover.event.send')} onClick={() => setSendOpen(true)}>
              <SendGlyph size={19} />
            </button>
            <button type="button" className="feed-action" aria-label={t('common.share')} onClick={() => share(event.title, `/event/${event.id}`)}>
              <ShareGlyph size={19} />
            </button>
          </div>
        </article>

        <section className="friends-going" aria-label={t('community.friendsInterested')}>
          {want.length || went.length ? (
            <AvatarStack ids={[...went, ...want]} size={26} />
          ) : (
            <span className="tile tone-violet" style={{ width: 30, height: 30, borderRadius: 15 }}>
              <FriendsGlyph size={16} duo />
            </span>
          )}
          <span className="grow body-sm" style={{ minWidth: 0 }}>
            {want.length || went.length
              ? [friendsLine(went, { one: 'went', many: 'went' }), friendsLine(want, { one: 'wants to go', many: 'want to go' })].filter(Boolean).join(' · ')
              : t('discover.event.noFriends')}
          </span>
        </section>

        <section className="dsec" aria-labelledby="trust-title">
          <div className="row" style={{ gap: 10 }}>
            <TrustRing agree={agree} size={36} />
            <div className="stack grow" style={{ gap: 0 }}>
              <h2 className="section__title" id="trust-title" style={{ fontSize: '0.9375rem' }}>
                {t('discover.event.trust')}
              </h2>
              <span className="meta">{event.confirmed ? t('answer.sourcesAgree', { n: sources.length }) : 'Seen in only one place so far'}</span>
            </div>
          </div>
          {!event.confirmed ? (
            <div className="notice tone-amber">
              <AlertGlyph size={18} duo />
              <span>{event.unconfirmedNote ?? 'Unconfirmed'}. We will update this listing as soon as a ticketing site, the organiser or local news confirms it.</span>
            </div>
          ) : null}
          <SourceChips sources={sources} label="Seen on" />
          <p className="meta" style={{ margin: 0 }}>
            {t('discover.event.organisedBy', { name: event.organiser })}
            {from ? ` · ${t('discover.event.foundOn', { sources: from })}` : ''}
          </p>
          <p className="meta">{t('discover.event.fromWeb')}</p>
        </section>

        {similar.length ? (
          <section className="dsec" aria-labelledby="similar-title">
            <SectionHead id="similar-title" title={t('discover.event.similar')} to="/explore/events" />
            <div className="list">
              {similar.map((e) => (
                <EventLinkRow key={e.id} event={e} />
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <RecommendSheet open={sendOpen} onClose={() => setSendOpen(false)} placeName={event.title} area={event.area} />
    </>
  );
}
