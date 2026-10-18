import { Link, useParams } from 'react-router-dom';
import { EventTile, SourceChips } from '../components/cards';
import { DetailHero, downloadEventIcs, useShare } from '../components/discover';
import { AvatarStack, WantButton } from '../components/friends';
import { person } from '../data/core';
import { EmptyState, PageHeader, SectionHead } from '../components/ui';
import { EVENTS, eventById } from '../data/events';
import { useT } from '../i18n';
import { AlertGlyph, FriendsGlyph, CalendarGlyph, CheckGlyph, EyeGlyph, LockGlyph, PinGlyph, RupeeGlyph, ShareGlyph, StarGlyph, TrustRing, UsersGlyph } from '../icons';
import { compact, price } from '../lib/format';
import { allCheckIns, profileInfo } from '../lib/friends';
import { DEFAULT_APP_DATA, useAppData } from '../state/appData';
import { enabledSources, useSettings } from '../state/settings';
import { useToast } from '../state/toast';

const DAY_NAME: Record<string, string> = { Sat: 'Saturday', Sun: 'Sunday', Fri: 'Friday', 'Sat–Sun': 'Saturday & Sunday', Today: 'Today', Tomorrow: 'Tomorrow' };

export default function EventDetail() {
  const { id = '' } = useParams();
  const t = useT();
  const toast = useToast();
  const share = useShare();
  const { settings } = useSettings();
  const { data, has, toggle } = useAppData();
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
  const soldOutSoon = event.seatsLeft !== undefined && event.seatsLeft <= 12;
  // People you follow who want to go (on their list) or already went (checked in).
  const friendIds = data.following.filter(
    (fid) =>
      profileInfo(fid).wantToTry.some((w) => w.refId === event.id && !w.done) ||
      allCheckIns(data).some((c) => c.authorId === fid && c.eventId === event.id),
  );
  const firstNames = friendIds.map((fid) => person(fid).name.split(' ')[0]);
  const friendsText =
    firstNames.length === 0
      ? 'None of your friends have this on their list yet.'
      : `${firstNames.length > 1 ? `${firstNames.slice(0, -1).join(', ')} and ${firstNames[firstNames.length - 1]}` : firstNames[0]} ${firstNames.length === 1 ? 'wants' : 'want'} to go`;

  return (
    <>
      <PageHeader title={event.title} fallback="/explore/events" />
      <main className="page page--with-header">
        <DetailHero tone={event.tone} glyph={event.glyph} badge={`${event.day.toUpperCase()} · ${event.time.split(' – ')[0].toUpperCase()}`} />

        <div className="stack" style={{ gap: 10 }}>
          <h1 className="detail-title">{event.title}</h1>
          <ul className="fact-list">
            <li>
              <span className="tile tone-violet">
                <CalendarGlyph size={14} />
              </span>
              <span>
                <b>{when}</b>
              </span>
            </li>
            <li>
              <span className="tile tone-violet">
                <PinGlyph size={14} />
              </span>
              <span>
                {event.venue}, {event.area} · {event.distanceKm} km away
              </span>
            </li>
            <li>
              <span className="tile tone-violet">
                <RupeeGlyph size={14} />
              </span>
              <span>
                {price(event.price)}
                {soldOutSoon ? ` · ${event.seatsLeft} seats left` : ''}
              </span>
            </li>
          </ul>
        </div>

        {event.confirmed ? (
          <div className="grid-2">
            <button
              type="button"
              className={`btn btn--lg ${going ? 'btn--mint' : 'btn--primary'}`}
              aria-pressed={going}
              onClick={() => {
                const on = toggle('going', event.id);
                toast(on ? `You're going to ${event.title}` : 'Marked as not going');
              }}
            >
              {going ? <CheckGlyph size={18} /> : <UsersGlyph size={18} />}
              {t('discover.event.going')}
            </button>
            <button type="button" className="btn btn--lg btn--secondary" aria-pressed={interested} onClick={() => toggle('interested', event.id)}>
              <StarGlyph size={16} style={{ color: interested ? 'var(--accent)' : 'var(--faint)' }} />
              {t('discover.event.interested')}
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn--lg btn--secondary btn--block" aria-pressed={interested} onClick={() => toggle('interested', event.id)}>
            <StarGlyph size={16} style={{ color: interested ? 'var(--accent)' : 'var(--faint)' }} />
            {interested ? 'We’ll tell you when it’s confirmed' : 'Notify me when confirmed'}
          </button>
        )}

        <div className="stack" style={{ gap: 6 }}>
          <span className="meta" style={{ fontSize: '0.875rem' }}>
            <b style={{ color: 'var(--mint-ink)' }}>{compact(goingCount)} going</b> · {compact(interestedCount)} interested
          </span>
          <Link to="/settings/privacy" className="row meta" style={{ gap: 6, textDecoration: 'none' }}>
            {settings.privacy.showGoing ? <EyeGlyph size={14} /> : <LockGlyph size={14} />}
            <span>
              {settings.privacy.showGoing ? 'Neighbours can see your RSVP.' : 'Your RSVP is private.'}{' '}
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Change</span>
            </span>
          </Link>
        </div>

        <section className="card card--tight friends-going" aria-label={t('community.friendsInterested')}>
          {friendIds.length ? (
            <AvatarStack ids={friendIds} size={30} />
          ) : (
            <span className="tile tone-violet">
              <FriendsGlyph size={20} duo />
            </span>
          )}
          <span className="grow body-sm" style={{ minWidth: 0 }}>
            {friendsText}
          </span>
          <WantButton item={{ id: `w-event-${event.id}`, kind: 'event', refId: event.id, title: event.title, sub: `${event.day}, ${event.time}` }} />
        </section>

        <div className="grid-2">
          <button
            type="button"
            className="btn btn--outline"
            onClick={() => toast(downloadEventIcs(event) ? 'Calendar file downloaded' : 'Could not create a calendar file')}
          >
            <CalendarGlyph size={18} />
            {t('discover.event.calendar')}
          </button>
          <button type="button" className="btn btn--outline" onClick={() => share(event.title, `/event/${event.id}`)}>
            <ShareGlyph size={18} />
            {t('common.share')}
          </button>
        </div>

        <section className="card stack" aria-labelledby="trust-title" style={event.confirmed ? undefined : { borderStyle: 'dashed', borderColor: 'var(--amber-line)' }}>
          <div className="row" style={{ gap: 12 }}>
            <TrustRing agree={agree} size={44} />
            <div className="stack grow" style={{ gap: 2 }}>
              <h2 className="section__title" id="trust-title" style={{ fontSize: '1rem' }}>
                {t('discover.event.trust')}
              </h2>
              <span className="meta">
                {event.confirmed ? t('answer.sourcesAgree', { n: sources.length }) : 'Seen in only one place so far'}
              </span>
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

        <section className="card stack" aria-labelledby="about-title">
          <h2 className="section__title" id="about-title">
            {t('discover.event.about')}
          </h2>
          <p className="body">{event.description}</p>
          <span className="meta">Organiser: {event.organiser}</span>
          <div className="chip-wrap">
            {event.tags.map((tag) => (
              <Link key={tag} to={`/ask?q=${encodeURIComponent(`${tag} events this weekend`)}`} className="chip" style={{ height: 32, fontSize: '0.8125rem' }}>
                {tag}
              </Link>
            ))}
          </div>
        </section>

        {similar.length ? (
          <section className="section" aria-labelledby="similar-title">
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
