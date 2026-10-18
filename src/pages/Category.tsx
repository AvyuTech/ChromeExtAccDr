import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DealCard, EventRow, PlaceRow } from '../components/cards';
import { EmptyState, PageHeader, SectionHead, Segmented } from '../components/ui';
import { EVENTS, MOVIES } from '../data/events';
import { PLACES } from '../data/places';
import { DEALS } from '../data/social';
import type { CityEvent, Place, Tone } from '../data/types';
import { useT } from '../i18n';
import { ClockGlyph, MoviesGlyph, NamedGlyph, type GlyphName } from '../icons';
import { km } from '../lib/format';
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
  movies: { titleKey: 'discover.cat.movies', glyph: 'movies', tone: 'blue', blurb: 'Showtimes at halls near you today.' },
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
    return [...list].sort((a, b) => (sort === 'nearest' ? a.distanceKm - b.distanceKm : sort === 'top' ? b.rating - a.rating : b.reviews - a.reviews));
  }, [category, chip, sort, allowed]);

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
  const count = category === 'events' ? events.length : category === 'movies' ? MOVIES.length : places.length;

  return (
    <>
      <PageHeader title={t(config.titleKey)} fallback="/explore" />
      <main className="page page--with-header">
        <div className="cat-head">
          <span className={`tile tile--xl tone-${config.tone} glyph-host`}>
            <NamedGlyph name={config.glyph} size={34} duo live />
          </span>
          <div className="cat-head__text">
            <span className="display strong" style={{ fontSize: '1.25rem' }}>
              {count} {category === 'events' ? 'events' : category === 'movies' ? 'films' : 'places'}
            </span>
            <p className="body-sm muted">{config.blurb}</p>
          </div>
        </div>

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
              { value: 'top', label: category === 'events' ? t('common.verified') : t('discover.sort.top') },
            ]}
          />
        ) : null}

        {category === 'events' ? (
          events.length ? (
            <div className="stack">
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
                <article key={m.id} className="card card--tight row" style={{ alignItems: 'flex-start', gap: 12 }}>
                  <span className={`movie-poster tone-${m.tone}`}>
                    <MoviesGlyph size={30} duo live />
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
                            style={{ height: 34, padding: '0 12px' }}
                            onClick={() => {
                              setReminders((r) => (on ? r.filter((x) => x !== id) : [...r, id]));
                              toast(on ? `Reminder removed for ${s}` : `We'll remind you 45 min before ${s}`);
                            }}
                          >
                            <ClockGlyph size={14} />
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
            <section className="section" aria-labelledby="matinee-title">
              <SectionHead id="matinee-title" title={t('discover.movies.matinee')} to="/deals" />
              {DEALS.filter((d) => d.category === 'movies').map((d) => (
                <DealCard key={d.id} deal={d} />
              ))}
            </section>
          </>
        ) : null}

        {category === 'food' || category === 'places' || category === 'getaways' ? (
          places.length ? (
            category === 'getaways' ? (
              <div className="stack">
                {places.map((p) => (
                  <Link key={p.id} to={`/place/${p.id}`} className="card card--tight glyph-host" style={{ display: 'flex', gap: 12, textDecoration: 'none', color: 'inherit' }}>
                    <span className={`tile tile--xl tone-${p.tone}`}>
                      <NamedGlyph name={p.glyph} size={30} duo />
                    </span>
                    <span className="stack grow" style={{ gap: 5, minWidth: 0 }}>
                      <span className="strong" style={{ fontSize: '0.9375rem' }}>
                        {p.name}
                      </span>
                      <span className="meta">
                        {p.kind} · {km(p.distanceKm)} · {driveTime(p.distanceKm)}
                      </span>
                      <span className="body-sm" style={{ color: 'var(--ink-3)' }}>
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
