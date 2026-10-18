import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { eventPhoto, placePhoto } from '../assets/photos';
import { Avatar, SourceChips, Votes } from '../components/cards';
import { clubPhoto } from '../components/clubs';
import { ShareSheet } from '../components/share';
import { downloadEventIcs, EventLinkRow, eventSourceLine } from '../components/discover';
import { EmptyState, PageHeader, SectionHead } from '../components/ui';
import { person } from '../data/core';
import { EVENTS, eventById } from '../data/events';
import { groupById } from '../data/social';
import { useT } from '../i18n';
import { AlertGlyph, CalendarGlyph, ExternalGlyph, NavigateGlyph, PinGlyph, ReplyGlyph, ShareGlyph, TrustRing } from '../icons';
import { km, price } from '../lib/format';
import { eventHost, venuePage, type Host } from '../lib/hosts';
import { useAppData } from '../state/appData';
import { enabledSources, useSettings } from '../state/settings';
import { useToast } from '../state/toast';
import { EntityLine, EntityPic, placeKind } from '../components/entity';
import { placeById } from '../data/places';
import { EventTalk, GoingButtons, GoingLine, GoTogether, TrendBadge, WhoIsGoingSheet } from '../components/eventSocial';
import { eventSocial, eventVoteId } from '../lib/events';

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
  const kind = host.kind === 'page' ? (placeById(host.id) ? placeKind(placeById(host.id)!) : 'page') : host.kind;
  const club = host.kind === 'club' ? groupById(host.id) : undefined;
  const icon =
    host.kind === 'person' ? (
      <Avatar who={person(host.id)} size={34} />
    ) : (
      <EntityPic kind={kind} size={34} src={host.kind === 'page' ? placePhoto(host.id) : club ? clubPhoto(club) : undefined} fallback={<PinGlyph size={16} />} />
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
          <span className="host-kind">{host.kind === 'person' ? 'shared an event' : <EntityLine kind={kind} />}</span>
        </span>
        <span className="meta">{host.sub}</span>
      </div>
    </div>
  );
}

/**
 * An event is a post by a person, a page or a club. People say they're interested
 * or going, vote on it, talk about it and find company; friends see who's going and
 * popular events trend up the feeds. Nearhood never sells tickets: it links out.
 */
export default function EventDetail() {
  const { id = '' } = useParams();
  const t = useT();
  const toast = useToast();
  const { settings } = useSettings();
  const { data } = useAppData();
  const [sendOpen, setSendOpen] = useState(false);
  const [whoOpen, setWhoOpen] = useState(false);
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
  const social = eventSocial(event, data);
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
            <span className="event-post__trend">
              <TrendBadge event={event} pill />
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
          {/* Your plans first: what friends see. Tickets stay a link out. */}
          <GoingButtons event={event} />
          <GoingLine event={event} onOpen={() => setWhoOpen(true)} />
          {event.link ? (
            <a className="btn btn--outline btn--block event-post__link" href={event.link.url} target="_blank" rel="noopener noreferrer">
              {event.link.label}
              <ExternalGlyph size={15} />
            </a>
          ) : null}
          <p className="meta" style={{ margin: 0 }}>
            {event.link ? `Opens ${host(event.link.url)}. ` : ''}
            {t('discover.event.noTickets')}
          </p>
          <div className="feed-post__actions">
            <Votes id={eventVoteId(event.id)} up={event.upvotes ?? 0} down={event.downvotes} />
            <a href="#talk" className="feed-action" aria-label={`${social.replies} comments`} onClick={(e) => {
              e.preventDefault();
              document.getElementById('talk')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}>
              <ReplyGlyph size={20} />
              {social.replies}
            </a>
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
            <button type="button" className="feed-action" aria-label={t('common.share')} onClick={() => setSendOpen(true)}>
              <ShareGlyph size={19} />
            </button>
          </div>
        </article>

        <GoTogether event={event} />

        <div id="talk">
          <EventTalk event={event} />
        </div>

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
      <WhoIsGoingSheet event={event} open={whoOpen} onClose={() => setWhoOpen(false)} />
      <ShareSheet open={sendOpen} onClose={() => setSendOpen(false)} title={event.title} path={`/event/${event.id}`} message={`${event.title}, ${event.day} ${event.time} in ${event.area}`} />
    </>
  );
}
