import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { eventPhoto } from '../assets/photos';
import { SourceChips } from '../components/cards';
import { RecommendSheet } from '../components/community';
import { downloadEventIcs, EventLinkRow, eventFriends, eventSourceLine, friendsLine, IconAction, ProfileHead, useShare } from '../components/discover';
import { AvatarStack } from '../components/friends';
import { EmptyState, PageHeader, SectionHead } from '../components/ui';
import { EVENTS, eventById } from '../data/events';
import { useT } from '../i18n';
import { AlertGlyph, CalendarGlyph, ExternalGlyph, FriendsGlyph, GlobeGlyph, NavigateGlyph, SendGlyph, ShareGlyph, TrustRing, WantGlyph } from '../icons';
import { km, price } from '../lib/format';
import { isWanted } from '../lib/friends';
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

/**
 * A city event, found on ticketing sites, organisers' pages, reels and news.
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

  return (
    <>
      <PageHeader title={event.title} fallback="/explore/events" />
      <main className="page page--with-header">
        <ProfileHead
          cover={eventPhoto(event.id)}
          coverBadge={
            event.day === 'Today' ? (
              <span className="hero-chip hero-chip--lime" style={{ position: 'absolute', top: 12, left: 'var(--gutter)', zIndex: 1 }}>
                Tonight · {startTime}
              </span>
            ) : undefined
          }
          tone={event.tone === 'night' ? 'violet' : event.tone}
          icon={
            <span className="profile-head__date" aria-hidden="true">
              <b>{event.day === 'Sat–Sun' ? 'Sat' : event.day}</b>
              <span>{startTime}</span>
            </span>
          }
          stats={[
            { value: String(want.length + went.length + (wanted ? 1 : 0)), label: t('discover.stat.friendsKeen'), tone: 'mint' as const },
            { value: String(sources.length), label: t('discover.stat.sources') },
            { value: km(event.distanceKm), label: t('discover.stat.away') },
          ]}
          title={event.title}
          sub={
            <>
              {CATEGORY_LABEL[event.category] ?? event.category} · {when}
            </>
          }
        >
          <p className="profile-head__sub" style={{ fontWeight: 500 }}>
            {event.venue}, {event.area} · {event.price === 0 ? 'Free entry' : `Entry ${price(event.price)}`}
          </p>
          <p className="origin-line" style={{ cursor: 'default' }}>
            <GlobeGlyph size={14} />
            <span className="grow">{from ? t('discover.event.foundOn', { sources: from }) : t('discover.event.organisedBy', { name: event.organiser })}</span>
          </p>
        </ProfileHead>

        <nav className="icon-row" aria-label={t('discover.event.actions')}>
          {event.link ? (
            <IconAction
              primary
              href={event.link.url}
              icon={<ExternalGlyph size={18} />}
              label={t('discover.action.details')}
              ariaLabel={`${event.link.label} (opens in a new tab)`}
            />
          ) : null}
          <IconAction
            pressed={wanted}
            onClick={() => {
              const added = toggleWant(wantItem);
              toast(added ? `Added "${event.title}" to Want to try` : 'Removed from Want to try');
            }}
            icon={<WantGlyph size={18} active={wanted} />}
            label={t('discover.action.wantToGo')}
            ariaLabel={wanted ? 'On your Want to try list' : 'Add to Want to try'}
          />
          <IconAction onClick={() => setSendOpen(true)} icon={<SendGlyph size={17} />} label={t('discover.action.send')} ariaLabel={t('discover.event.send')} />
          <IconAction
            onClick={() => toast(downloadEventIcs(event) ? 'Calendar file downloaded' : 'Could not create a calendar file')}
            icon={<CalendarGlyph size={18} />}
            label={t('discover.action.calendar')}
            ariaLabel={t('discover.event.calendar')}
          />
          <IconAction href={mapsUrl} icon={<NavigateGlyph size={18} />} label={t('discover.action.directions')} />
          <IconAction onClick={() => share(event.title, `/event/${event.id}`)} icon={<ShareGlyph size={17} />} label={t('common.share')} />
        </nav>

        {event.link ? (
          <a className="linkout-row" href={event.link.url} target="_blank" rel="noopener noreferrer">
            <span className="linkout-row__body">
              <span className="linkout-row__title">{event.link.label}</span>
              <span className="linkout-row__host">{host(event.link.url)}</span>
            </span>
            <ExternalGlyph size={16} />
          </a>
        ) : null}
        <p className="meta linkout-note">{t('discover.event.noTickets')}</p>

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

        <section className="dsec" aria-labelledby="about-title" style={{ borderTop: 'none', paddingTop: 0 }}>
          <h2 className="section__title" id="about-title">
            {t('discover.event.about')}
          </h2>
          <p className="body">{event.description}</p>
          <p className="meta">{t('discover.event.organisedBy', { name: event.organiser })}</p>
          <div className="chip-wrap" style={{ gap: 6 }}>
            {event.tags.map((tag) => (
              <Link key={tag} to={`/ask?q=${encodeURIComponent(`${tag} events this weekend`)}`} className="chip" style={{ height: 28, padding: '0 11px', fontSize: '0.75rem' }}>
                {tag}
              </Link>
            ))}
          </div>
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
