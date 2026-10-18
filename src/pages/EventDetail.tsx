import { Link, useParams } from 'react-router-dom';
import { eventPhoto } from '../assets/photos';
import { EventTile, SourceChips } from '../components/cards';
import { downloadEventIcs, IconAction, ProfileHead, useShare } from '../components/discover';
import { AvatarStack } from '../components/friends';
import { person } from '../data/core';
import { EmptyState, PageHeader, SectionHead } from '../components/ui';
import { EVENTS, eventById } from '../data/events';
import { useT } from '../i18n';
import { AlertGlyph, FriendsGlyph, CalendarGlyph, CheckGlyph, EyeGlyph, LockGlyph, NavigateGlyph, ShareGlyph, StarGlyph, TrustRing, UsersGlyph, WantGlyph } from '../icons';
import { compact, price } from '../lib/format';
import { allCheckIns, isWanted, profileInfo } from '../lib/friends';
import { DEFAULT_APP_DATA, useAppData } from '../state/appData';
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

export default function EventDetail() {
  const { id = '' } = useParams();
  const t = useT();
  const toast = useToast();
  const share = useShare();
  const { settings } = useSettings();
  const { data, has, toggle, toggleWant } = useAppData();
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

  const going = has('going', event.id);
  const interested = has('interested', event.id);
  // Sample counts already include this person when the seed data marks them.
  const goingCount = event.going + (going ? 1 : 0) - (DEFAULT_APP_DATA.going.includes(event.id) ? 1 : 0);
  const interestedCount = (event.interested ?? 0) + (interested ? 1 : 0) - (DEFAULT_APP_DATA.interested.includes(event.id) ? 1 : 0);
  const sources = event.sources.filter(enabledSources(settings));
  const agree = Math.min(sources.length, 4);
  const similar = EVENTS.filter((e) => e.id !== event.id && (e.category === event.category || e.tags.some((tag) => event.tags.includes(tag)))).slice(0, 5);
  const when = `${DAY_NAME[event.day] ?? event.day}, ${event.time}`;
  const startTime = event.time.split(' – ')[0];
  const soldOutSoon = event.seatsLeft !== undefined && event.seatsLeft <= 12;
  // People you follow who want to go (on their list) or already went (checked in).
  const friendIds = data.following.filter(
    (fid) =>
      profileInfo(fid).wantToTry.some((w) => w.refId === event.id && !w.done) ||
      allCheckIns(data).some((c) => c.authorId === fid && c.eventId === event.id),
  );
  const wantItem = { id: `w-event-${event.id}`, kind: 'event' as const, refId: event.id, title: event.title, sub: `${event.day}, ${event.time}` };
  const wanted = isWanted(data, wantItem);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue}, ${event.area}, Ahmedabad`)}`;
  const firstNames = friendIds.map((fid) => person(fid).name.split(' ')[0]);
  const friendsText =
    firstNames.length === 0
      ? 'None of your friends have this on their list yet.'
      : `${firstNames.length > 1 ? `${firstNames.slice(0, -1).join(', ')} and ${firstNames[firstNames.length - 1]}` : firstNames[0]} ${firstNames.length === 1 ? 'wants' : 'want'} to go`;

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
            { value: compact(goingCount), label: t('discover.stat.going'), tone: 'mint' as const },
            { value: compact(interestedCount), label: t('discover.stat.interested') },
            { value: price(event.price), label: t('discover.stat.entry') },
          ]}
          title={event.title}
          sub={
            <>
              {CATEGORY_LABEL[event.category] ?? event.category} · {when}
            </>
          }
        >
          <p className="profile-head__sub" style={{ fontWeight: 500 }}>
            {event.venue}, {event.area} · {event.distanceKm} km away
            {soldOutSoon ? <b style={{ color: 'var(--peach-ink)' }}> · {event.seatsLeft} seats left</b> : null}
          </p>
          <p className="origin-line" style={{ cursor: 'default' }}>
            <UsersGlyph size={14} />
            <span className="grow">{t('discover.event.organisedBy', { name: event.organiser })}</span>
          </p>
        </ProfileHead>

        <nav className="icon-row" aria-label={t('discover.event.actions')}>
          {event.confirmed ? (
            <IconAction
              primary
              pressed={going}
              onClick={() => {
                const on = toggle('going', event.id);
                toast(on ? `You're going to ${event.title}` : 'Marked as not going');
              }}
              icon={going ? <CheckGlyph size={18} /> : <UsersGlyph size={18} />}
              label={t('discover.action.going')}
              ariaLabel={t('discover.event.going')}
            />
          ) : null}
          <IconAction
            pressed={interested}
            onClick={() => toggle('interested', event.id)}
            icon={<StarGlyph size={18} />}
            label={event.confirmed ? t('discover.action.interested') : interested ? 'Notifying' : 'Notify me'}
            ariaLabel={event.confirmed ? t('discover.event.interested') : interested ? 'We’ll tell you when it’s confirmed' : 'Notify me when confirmed'}
          />
          <IconAction
            pressed={wanted}
            onClick={() => {
              const added = toggleWant(wantItem);
              toast(added ? `Added "${event.title}" to Want to try` : 'Removed from Want to try');
            }}
            icon={<WantGlyph size={18} active={wanted} />}
            label={t('discover.action.want')}
            ariaLabel={wanted ? 'On your Want to try list' : 'Add to Want to try'}
          />
          <IconAction
            onClick={() => toast(downloadEventIcs(event) ? 'Calendar file downloaded' : 'Could not create a calendar file')}
            icon={<CalendarGlyph size={18} />}
            label={t('discover.action.calendar')}
            ariaLabel={t('discover.event.calendar')}
          />
          <IconAction href={mapsUrl} icon={<NavigateGlyph size={18} />} label={t('discover.action.directions')} />
          <IconAction onClick={() => share(event.title, `/event/${event.id}`)} icon={<ShareGlyph size={17} />} label={t('common.share')} />
        </nav>

        <Link to="/settings/privacy" className="row meta" style={{ gap: 6, textDecoration: 'none', marginTop: -2 }}>
          {settings.privacy.showGoing ? <EyeGlyph size={13} /> : <LockGlyph size={13} />}
          <span>
            {settings.privacy.showGoing ? 'Neighbours can see your RSVP.' : 'Your RSVP is private.'}{' '}
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Change</span>
          </span>
        </Link>

        <section className="friends-going" aria-label={t('community.friendsInterested')}>
          {friendIds.length ? (
            <AvatarStack ids={friendIds} size={26} />
          ) : (
            <span className="tile tone-violet" style={{ width: 30, height: 30, borderRadius: 15 }}>
              <FriendsGlyph size={16} duo />
            </span>
          )}
          <span className="grow body-sm" style={{ minWidth: 0 }}>
            {friendsText}
          </span>
        </section>

        <section className="dsec" aria-labelledby="about-title" style={{ borderTop: 'none', paddingTop: 0 }}>
          <h2 className="section__title" id="about-title">
            {t('discover.event.about')}
          </h2>
          <p className="body">{event.description}</p>
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
        </section>

        {similar.length ? (
          <section className="dsec" aria-labelledby="similar-title">
            <SectionHead id="similar-title" title={t('discover.event.similar')} to="/explore/events" />
            <div className="hscroll">
              {similar.map((e) => (
                <EventTile key={e.id} event={e} />
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </>
  );
}
