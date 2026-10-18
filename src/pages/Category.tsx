import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { categoryPhoto, placePhoto } from '../assets/photos';
import { Cover, DealCard, EventRow, PlaceRow } from '../components/cards';
import { EmptyState, PageHeader, SectionHead, Segmented } from '../components/ui';
import { EVENTS, MOVIES } from '../data/events';
import { PLACES } from '../data/places';
import { DEALS } from '../data/social';
import type { CityEvent, Place, Tone } from '../data/types';
import { useT } from '../i18n';
import { ClockGlyph, MoviesGlyph, NamedGlyph, type GlyphName } from '../icons';
import { km } from '../lib/format';
import { placeCommunity } from '../lib/friends';
import { placeOrigin } from '../lib/places';
import { useAppData } from '../state/appData';
import { enabledSources, useSettings } from '../state/settings';
import { useToast } from '../state/toast';

type Sort = 'popular' | 'nearest' | 'top';

interface Config {
  titleKey: string;
  glyph: GlyphName;
  tone: Tone;
  blurb: string;
}

const CONFIG: Record<string, Config> = {
  food: { titleKey: 'discover.cat.food', glyph: 'food', tone: 'peach', blurb: 'Restaurants, cafés and street food, ranked by what neighbours say.' },
  events: { titleKey: 'discover.cat.events', glyph: 'events', tone: 'violet', blurb: 'Merged from ticketing sites, reels, news and neighbours.' },
  movies: { titleKey: 'discover.cat.movies', glyph: 'movies', tone: 'night', blurb: 'Showtimes at halls near you today.' },
  getaways: { titleKey: 'discover.cat.getaways', glyph: 'getaways', tone: 'teal', blurb: 'Day trips and weekends within a few hours of the city.' },
  places: { titleKey: 'discover.cat.places', glyph: 'pin', tone: 'green', blurb: 'Lakes, markets, heritage and things to do around you.' },
};

const PLACE_CHIPS: Record<string, Array<{ id: string; label: string; test: (p: Place) => boolean }>> = {
  food: [
    { id: 'all', label: 'All', test: () => true },
    { id: 'cafes', label: 'Cafés', test: (p) => p.category === 'cafe' },
    { id: 'restaurants', label: 'Restaurants', test: (p) => p.category === 'food' && !p.tags.includes('street food') },
    { id: 'street', label: 'Street food', test: (p) => p.tags.includes('street food') },
    { id: 'open', label: 'Open now', test: (p) => p.openNow },
    { id: 'budget', label: '₹₹ or less', test: (p) => p.price <= 2 },
  ],
  places: [
    { id: 'all', label: 'All', test: () => true },
    { id: 'outdoors', label: 'Outdoors', test: (p) => p.category === 'nature' || p.tags.includes('outdoor') || p.tags.includes('walk') },
    { id: 'heritage', label: 'Heritage', test: (p) => p.category === 'heritage' || p.tags.includes('heritage') },
    { id: 'shopping', label: 'Shopping', test: (p) => p.category === 'shopping' },
    { id: 'kids', label: 'Kids', test: (p) => p.tags.includes('kids') || p.tags.includes('family') },
    { id: 'free', label: 'Free entry', test: (p) => p.price === 1 },
  ],
  getaways: [
    { id: 'all', label: 'All', test: () => true },
    { id: 'short', label: 'Under 1 hr', test: (p) => p.distanceKm <= 50 },
    { id: 'half', label: 'Half day', test: (p) => p.distanceKm <= 80 },
    { id: 'full', label: 'Full day or more', test: (p) => p.distanceKm > 80 },
  ],
};

const EVENT_CHIPS: Array<{ id: string; label: string; test: (e: CityEvent) => boolean }> = [
  { id: 'all', label: 'All', test: () => true },
  { id: 'today', label: 'Today', test: (e) => e.day === 'Today' },
  { id: 'weekend', label: 'This weekend', test: (e) => ['Sat', 'Sun', 'Sat–Sun'].includes(e.day) },
  { id: 'free', label: 'Free', test: (e) => e.price === 0 },
  { id: 'kids', label: 'Kids', test: (e) => e.tags.includes('kids') || e.tags.includes('family') },
  { id: 'couples', label: 'Couples', test: (e) => e.tags.includes('couples') },
];

/** Rough drive time at city-highway speeds, for getaways. */
function driveTime(distance: number) {
  const mins = Math.round((distance / 50) * 60);
  return mins < 60 ? `${mins} min drive` : `${(mins / 60).toFixed(1).replace(/\.0$/, '')} hr drive`;
}

export default function Category() {
  const { category = '' } = useParams();
  const t = useT();
  const toast = useToast();
  const { settings } = useSettings();
  const { data } = useAppData();
  const [chip, setChip] = useState('all');
  const [sort, setSort] = useState<Sort>('popular');
  const [reminders, setReminders] = useState<string[]>([]);
  const config = CONFIG[category];
  const allowed = useMemo(() => enabledSources(settings), [settings]);

  const places = useMemo(() => {
    let list: Place[] = [];
    if (category === 'food') list = PLACES.filter((p) => p.category === 'food' || p.category === 'cafe');
    else if (category === 'getaways') list = PLACES.filter((p) => p.tags.includes('getaway'));
    else if (category === 'places') list = PLACES.filter((p) => !['food', 'cafe'].includes(p.category) && !p.tags.includes('getaway'));
    list = list.filter((p) => p.sources.some(allowed));
    const test = PLACE_CHIPS[category]?.find((c) => c.id === chip)?.test ?? (() => true);
    list = list.filter(test);
    // Popularity and "most must-tries" come from community check-ins, not star ratings.
    const score = new Map(list.map((p) => [p.id, placeCommunity(p.id, data, settings)]));
    return [...list].sort((a, b) => {
      const ca = score.get(a.id)!;
      const cb = score.get(b.id)!;
      if (sort === 'nearest') return a.distanceKm - b.distanceKm;
      if (sort === 'top') return cb.mustPct - ca.mustPct || cb.total - ca.total;
      return cb.total - ca.total;
    });
  }, [category, chip, sort, allowed, data, settings]);

  const events = useMemo(() => {
    if (category !== 'events') return [];
    const test = EVENT_CHIPS.find((c) => c.id === chip)?.test ?? (() => true);
    const list = EVENTS.filter((e) => (e.confirmed || settings.sources.showUnconfirmed) && e.sources.some(allowed)).filter(test);
    return [...list].sort((a, b) =>
      sort === 'nearest' ? a.distanceKm - b.distanceKm : sort === 'top' ? b.sources.length - a.sources.length : b.going + (b.interested ?? 0) / 4 - (a.going + (a.interested ?? 0) / 4),
    );
  }, [category, chip, sort, allowed, settings.sources.showUnconfirmed]);

  if (!config) {
    return (
      <>
        <PageHeader title={t('nav.explore')} fallback="/explore" />
        <main className="page page--with-header">
          <EmptyState
            glyph="explore"
            title={t('discover.cat.unknown')}
            action={
              <Link to="/explore" className="btn btn--soft btn--sm">
                {t('discover.cat.backToExplore')}
              </Link>
            }
          />
        </main>
      </>
    );
  }

  const chips = category === 'events' ? EVENT_CHIPS : PLACE_CHIPS[category];
  const banner = categoryPhoto(category);
  const count = category === 'events' ? events.length : category === 'movies' ? MOVIES.length : places.length;

  return (
    <>
      <PageHeader title={t(config.titleKey)} fallback="/explore" />
      <main className="page page--with-header">
        <section className={`cat-banner glyph-host${banner ? ' cat-banner--photo' : ` tone-${config.tone}`}`} aria-label={t(config.titleKey)}>
          {banner ? <img src={banner} alt="" /> : null}
          <span className="cat-banner__icon">
            <NamedGlyph name={config.glyph} size={19} duo={!banner} live />
          </span>
          <span className="cat-banner__text">
            <span className="cat-banner__count">
              {count} {category === 'events' ? 'events' : category === 'movies' ? 'films' : 'places'}
            </span>
            <span className="cat-banner__blurb">{config.blurb}</span>
          </span>
        </section>

        {chips ? (
          <div className="chip-row" role="group" aria-label="Filter">
            {chips.map((c) => (
              <button key={c.id} type="button" className="chip" aria-pressed={chip === c.id} onClick={() => setChip(c.id)}>
                {c.label}
              </button>
            ))}
          </div>
        ) : null}

        {category !== 'movies' ? (
          <Segmented<Sort>
            label={t('discover.sort.label')}
            value={sort}
            onChange={setSort}
            options={[
              { value: 'popular', label: t('discover.sort.popular') },
              { value: 'nearest', label: t('discover.sort.nearest') },
              { value: 'top', label: category === 'events' ? t('common.verified') : t('community.mostMust') },
            ]}
          />
        ) : null}

        {category === 'events' ? (
          events.length ? (
            <div className="results">
              {events.map((e) => (
                <EventRow key={e.id} event={e} />
              ))}
            </div>
          ) : (
            <EmptyState glyph="events" title="No events match" body="Try another filter." />
          )
        ) : null}

        {category === 'movies' ? (
          <>
            <section className="section" aria-labelledby="movies-title">
              <SectionHead id="movies-title" title={t('discover.movies.showing')} />
              {MOVIES.map((m) => (
                <article key={m.id} className="movie-row">
                  <span className={`movie-poster tone-${m.tone}`}>
                    <MoviesGlyph size={26} duo live />
                  </span>
                  <div className="stack grow" style={{ gap: 8 }}>
                    <div className="stack" style={{ gap: 2 }}>
                      <span className="strong" style={{ fontSize: '0.9375rem' }}>
                        {m.title}
                      </span>
                      <span className="meta">
                        {m.hall} · {m.rating}
                      </span>
                    </div>
                    <div className="chip-wrap" role="group" aria-label={`Showtimes for ${m.title}`}>
                      {m.shows.map((s) => {
                        const id = `${m.id}-${s}`;
                        const on = reminders.includes(id);
                        return (
                          <button
                            key={s}
                            type="button"
                            className="chip chip--accent"
                            aria-pressed={on}
                            style={{ height: 30, padding: '0 10px', fontSize: '0.75rem' }}
                            onClick={() => {
                              setReminders((r) => (on ? r.filter((x) => x !== id) : [...r, id]));
                              toast(on ? `Reminder removed for ${s}` : `We'll remind you 45 min before ${s}`);
                            }}
                          >
                            <ClockGlyph size={13} />
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </article>
              ))}
              <p className="meta">Tap a showtime for a reminder. Tickets are booked with the cinema.</p>
            </section>
            <section className="dsec" aria-labelledby="matinee-title">
              <SectionHead id="matinee-title" title={t('discover.movies.matinee')} to="/deals" />
              <div className="results">
                {DEALS.filter((d) => d.category === 'movies').map((d) => (
                  <DealCard key={d.id} deal={d} />
                ))}
              </div>
            </section>
          </>
        ) : null}

        {category === 'food' || category === 'places' || category === 'getaways' ? (
          places.length ? (
            category === 'getaways' ? (
              <div className="getaways">
                {places.map((p) => (
                  <Link key={p.id} to={`/place/${p.id}`} className="getaway-card glyph-host">
                    <Cover src={placePhoto(p.id)} glyph={p.glyph} tone={p.tone} className="getaway-card__media">
                      <span className="photo-pill" style={{ top: 12, left: 'var(--gutter)' }}>
                        {driveTime(p.distanceKm)}
                      </span>
                    </Cover>
                    <span className="getaway-card__body">
                      <span className="row" style={{ gap: 8, alignItems: 'baseline' }}>
                        <span className="getaway-card__title grow">{p.name}</span>
                        <span className="meta" style={{ flexShrink: 0 }}>
                          {km(p.distanceKm)}
                        </span>
                      </span>
                      <span className="meta">
                        {p.kind} · {t('discover.origin.outside')}
                      </span>
                      <span className="meta" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                        {placeOrigin(p).added}
                      </span>
                      <span className="body-sm" style={{ color: 'var(--ink-3)', marginTop: 2 }}>
                        {p.summary}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="list">
                {places.map((p, i) => (
                  <PlaceRow key={p.id} place={p} last={i === places.length - 1} />
                ))}
              </div>
            )
          ) : (
            <EmptyState glyph={config.glyph} title="Nothing matches" body="Try another filter or switch more sources on in Settings." />
          )
        ) : null}
      </main>
    </>
  );
}
