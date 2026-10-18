import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { categoryPhoto, eventPhoto } from '../assets/photos';
import { Cover, PlaceRow } from '../components/cards';
import { eventFriends } from '../components/discover';
import { EmptyState, PageHeader, Segmented } from '../components/ui';
import { EVENTS } from '../data/events';
import { PLACES } from '../data/places';
import type { CityEvent, Place, Tone } from '../data/types';
import { useT } from '../i18n';
import { ChevronRightGlyph, NamedGlyph, PlusGlyph, type GlyphName } from '../icons';
import { price } from '../lib/format';
import { placeCommunity } from '../lib/friends';
import { eventHost } from '../lib/hosts';
import { useAppData } from '../state/appData';
import { enabledSources, useSettings } from '../state/settings';

type Sort = 'popular' | 'nearest' | 'top';

interface Config {
  titleKey: string;
  glyph: GlyphName;
  tone: Tone;
  blurb: string;
}

const CONFIG: Record<string, Config> = {
  food: { titleKey: 'discover.cat.food', glyph: 'food', tone: 'peach', blurb: 'Restaurants, cafés and street food, ranked by what neighbours say.' },
  events: {
    titleKey: 'discover.cat.events',
    glyph: 'events',
    tone: 'violet',
    blurb: 'Posted by locals, pages and clubs. Nearhood only lists events someone here shared, and never sells tickets: every event links out.',
  },
  getaways: { titleKey: 'discover.cat.getaways', glyph: 'getaways', tone: 'teal', blurb: 'Day trips and weekends your friends added to their lists.' },
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

/** Today first, then the weekend, for "Soonest". */
const DAY_ORDER: CityEvent['day'][] = ['Today', 'Tomorrow', 'Fri', 'Sat', 'Sat–Sun', 'Sun'];

const EVENT_CHIPS: Array<{ id: string; label: string; test: (e: CityEvent) => boolean }> = [
  { id: 'all', label: 'All', test: () => true },
  { id: 'today', label: 'Today', test: (e) => e.day === 'Today' },
  { id: 'weekend', label: 'This weekend', test: (e) => ['Sat', 'Sun', 'Sat–Sun'].includes(e.day) },
  { id: 'free', label: 'Free', test: (e) => e.price === 0 },
  { id: 'kids', label: 'Kids', test: (e) => e.tags.includes('kids') || e.tags.includes('family') },
  { id: 'couples', label: 'Couples', test: (e) => e.tags.includes('couples') },
];

export default function Category() {
  const { category = '' } = useParams();
  const t = useT();
  const { settings } = useSettings();
  const { data } = useAppData();
  const [chip, setChip] = useState('all');
  const [sort, setSort] = useState<Sort>('popular');
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
    // Only events a person, page or club posted; nothing gathered from elsewhere.
    const list = EVENTS.filter((e) => eventHost(e) && (e.confirmed || settings.sources.showUnconfirmed)).filter(test);
    // "Popular" means popular with your friends first; "Soonest" means today, then the weekend.
    const keen = (e: CityEvent) => {
      const f = eventFriends(e.id, data);
      return f.want.length + f.went.length;
    };
    return [...list].sort((a, b) =>
      sort === 'nearest' ? a.distanceKm - b.distanceKm : sort === 'top' ? DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day) : keen(b) - keen(a) || a.distanceKm - b.distanceKm,
    );
  }, [category, chip, sort, settings.sources.showUnconfirmed, data]);

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
  const count = category === 'events' ? events.length : places.length;

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
              {count} {category === 'events' ? 'events' : 'places'}
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

        <Segmented<Sort>
          label={t('discover.sort.label')}
          value={sort}
          onChange={setSort}
          options={[
            { value: 'popular', label: category === 'events' ? t('discover.sort.friends') : t('discover.sort.popular') },
            { value: 'nearest', label: t('discover.sort.nearest') },
            { value: 'top', label: category === 'events' ? 'Soonest' : t('community.mostMust') },
          ]}
        />

        {category === 'events' ? (
          events.length ? (
            <div className="list">
              {events.map((e) => (
                <PostedEventRow key={e.id} event={e} />
              ))}
            </div>
          ) : (
            <EmptyState glyph="events" title="No events match" body="Try another filter. Events show up here when a person, page or club posts one." />
          )
        ) : null}

        {category === 'food' || category === 'places' || category === 'getaways' ? (
          places.length ? (
            <>
              {/* Every page lists the same way, whatever it is. */}
              <div className="list">
                {places.map((p, i) => (
                  <PlaceRow key={p.id} place={p} last={i === places.length - 1} />
                ))}
              </div>
              <Link to="/pages/new" className="spotted-add">
                <PlusGlyph size={16} />
                <span className="grow">Not listed? Add a page</span>
                <ChevronRightGlyph size={15} />
              </Link>
            </>
          ) : (
            <EmptyState glyph={config.glyph} title="Nothing matches" body="Try another filter or switch more sources on in Settings." />
          )
        ) : null}
      </main>
    </>
  );
}

/** An event as one row, labelled with who posted it: a person, a page or a club. */
function PostedEventRow({ event }: { event: CityEvent }) {
  const host = eventHost(event)!;
  const by = host.kind === 'page' ? `Posted by the page ${host.name}` : host.kind === 'club' ? `Posted in ${host.name}` : `Shared by ${host.name}`;
  return (
    <Link to={`/event/${event.id}`} className={`list-row glyph-host${event.confirmed ? '' : ' event-link-row--unconfirmed'}`}>
      <Cover src={eventPhoto(event.id)} glyph={event.glyph} tone={event.tone} className="place-thumb" />
      <span className="list-row__body">
        <span className="list-row__title">{event.title}</span>
        <span className="list-row__meta">
          {event.day}, {event.time} · {event.area} · {event.price === 0 ? 'Free' : price(event.price)}
        </span>
        <span className="list-row__meta posted-by">{event.confirmed ? by : `${by} · not confirmed yet`}</span>
      </span>
      <ChevronRightGlyph size={16} />
    </Link>
  );
}
