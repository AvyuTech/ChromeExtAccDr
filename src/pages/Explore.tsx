import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaceStack, GroupRow, PlaceRow } from '../components/cards';
import { CollectionCard } from '../components/friends';
import { CityMap, eventPos, NEIGHBOURHOOD_POS, PLACE_POS, type MapPin } from '../components/CityMap';
import { FriendPickCard } from '../components/community';
import { SectionHead, Sheet } from '../components/ui';
import { photo, placePhoto, eventPhoto } from '../assets/photos';
import { NEIGHBOURHOODS, neighbourhoodName, person } from '../data/core';
import { EVENTS } from '../data/events';
import { PLACES } from '../data/places';
import { COLLECTIONS } from '../data/friends';
import { GROUPS } from '../data/social';
import { WEB_PICKS } from '../data/web';
import type { Place, PlaceCategory, Tone } from '../data/types';
import { useT } from '../i18n';
import { CheckGlyph, ChevronDownGlyph, HeartGlyph, ChevronRightGlyph, NamedGlyph, PinGlyph, SaveGlyph, SearchGlyph, SquiggleMark, StarGlyph, type GlyphName } from '../icons';
import { km } from '../lib/format';
import { friendsMustTries, placeCommunity } from '../lib/friends';
import { spottedPlaces } from '../lib/places';
import { visibleAlerts } from '../lib/selectors';
import { useAppData } from '../state/appData';
import { useSettings } from '../state/settings';

type Mood = 'for-you' | 'coffee' | 'food' | 'outdoors' | 'culture' | 'sports' | 'shopping';

const MOODS: Array<{ id: Mood; key: string; glyph: GlyphName; cats?: PlaceCategory[] }> = [
  { id: 'for-you', key: 'feed.forYou', glyph: 'spark' },
  { id: 'coffee', key: 'discover.mood.coffee', glyph: 'cafe', cats: ['cafe'] },
  { id: 'food', key: 'chip.food', glyph: 'food', cats: ['food'] },
  { id: 'outdoors', key: 'discover.mood.outdoors', glyph: 'nature', cats: ['nature', 'sports'] },
  { id: 'culture', key: 'discover.mood.culture', glyph: 'heritage', cats: ['culture', 'heritage', 'shopping'] },
];

const RADII = [1, 2, 3, 5, 10, 20];

interface CategoryTile {
  key: string;
  to: string;
  glyph: GlyphName;
  tone: Tone;
  count: string;
  photo?: string;
  live?: boolean;
}

export default function Explore() {
  const t = useT();
  const navigate = useNavigate();
  const { settings, update } = useSettings();
  const { data, has, toggle } = useAppData();
  const spotted = spottedPlaces(data);
  const [query, setQuery] = useState('');
  const [mood, setMood] = useState<Mood>('for-you');
  const [areaSheet, setAreaSheet] = useState(false);

  const radius = settings.location.radiusKm;
  const homeId = settings.location.home;
  const homeName = neighbourhoodName(homeId);
  const home = NEIGHBOURHOOD_POS[homeId] ?? NEIGHBOURHOOD_POS.bodakdev;
  const alerts = visibleAlerts(settings, data);
  const cats = MOODS.find((m) => m.id === mood)?.cats;

  const ranked = useMemo(() => {
    const score = (p: Place) => {
      const c = placeCommunity(p.id, data, settings);
      return c.friendIds.length * 3 + c.mustPct / 20 + (p.distanceKm <= radius ? 2 : 0) + (p.openNow ? 1 : 0);
    };
    return PLACES.filter((p) => !cats || cats.includes(p.category))
      .filter((p) => !p.origin.outsideCity)
      .map((p) => ({ place: p, score: score(p) }))
      .sort((a, b) => b.score - a.score)
      .map((x) => x.place);
  }, [cats, data, settings, radius]);

  const featured = ranked[0];
  const featuredCommunity = featured ? placeCommunity(featured.id, data, settings) : undefined;
  const more = ranked.slice(1, 6);
  const tonight = EVENTS.filter((e) => e.day === 'Today' && (e.confirmed || settings.sources.showUnconfirmed));

  const pins: MapPin[] = useMemo(() => {
    const placePins = PLACES.filter((p) => PLACE_POS[p.id] && (!cats || cats.includes(p.category))).map((p) => ({
      id: p.id,
      x: PLACE_POS[p.id][0],
      y: PLACE_POS[p.id][1],
      glyph: p.glyph,
      title: p.name,
      meta: `${p.kind} · ${km(p.distanceKm)}`,
      to: `/place/${p.id}`,
      photo: placePhoto(p.id),
      far: p.distanceKm > radius,
    }));
    const eventPins =
      mood === 'for-you' || mood === 'culture'
        ? tonight
            .filter((e) => eventPos(e.area))
            .map((e) => ({
              id: e.id,
              x: eventPos(e.area)[0],
              y: eventPos(e.area)[1],
              glyph: e.glyph,
              title: e.title,
              meta: `Tonight ${e.time}${e.distanceKm ? ` · ${km(e.distanceKm)}` : ''}`,
              to: `/event/${e.id}`,
              photo: eventPhoto(e.id),
            }))
        : [];
    return [...placePins, ...eventPins];
  }, [cats, mood, radius, tonight]);

  const foodCount = PLACES.filter((p) => p.category === 'food' || p.category === 'cafe').length;
  const newFood = PLACES.filter((p) => (p.category === 'food' || p.category === 'cafe') && p.isNew).length;
  const eventsThisWeek = EVENTS.filter((e) => e.confirmed || settings.sources.showUnconfirmed).length;
  const categories: CategoryTile[] = [
    { key: 'discover.cat.food', to: '/explore/food', glyph: 'food', tone: 'peach', photo: photo('dish-pav-bhaji'), count: newFood ? `${foodCount} places · ${newFood} new` : `${foodCount} places` },
    { key: 'discover.cat.events', to: '/explore/events', glyph: 'events', tone: 'violet', photo: photo('scene-concert'), count: `${eventsThisWeek} this week` },
    { key: 'discover.cat.clubs', to: '/clubs', glyph: 'groups', tone: 'green', photo: photo('scene-friends'), count: `${GROUPS.length} clubs nearby` },
    { key: 'discover.cat.getaways', to: '/explore/getaways', glyph: 'getaways', tone: 'teal', photo: photo('place-polo-forest'), count: 'From friends’ lists' },
    { key: 'discover.cat.alerts', to: '/city/alerts', glyph: 'alert', tone: 'yellow', count: alerts.length ? `${alerts.length} today` : 'All quiet', live: alerts.some((a) => a.severity !== 'info') },
  ];

  const newThisWeek = PLACES.filter((p) => p.isNew).slice(0, 3);

  const suggestedGroups = GROUPS.filter((g) => !data.joinedGroups.includes(g.id)).slice(0, 2);
  const mustTries = friendsMustTries(data);
  // Lists by other people first; your own lists live on your profile.
  const lists = [...COLLECTIONS]
    .filter((c) => c.ownerId !== 'me')
    .sort((a, b) => Number(data.following.includes(b.ownerId)) - Number(data.following.includes(a.ownerId)) || b.followers - a.followers);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) navigate(`/ask?q=${encodeURIComponent(q)}`);
  };

  const areaLabel = t('discover.explore.around', { area: homeName, km: radius });
  const friendIds = featuredCommunity?.friendIds ?? [];
  const saved = featured ? has('savedPlaces', featured.id) : false;

  return (
    <>
      <main className="page explore">
        <header className="explore-head">
          <div className="stack" style={{ gap: 8, minWidth: 0 }}>
            <span className="eyebrow muted">{t('discover.explore.eyebrow', { city: settings.location.city })}</span>
            <h1 className="hero-title">
              {t('discover.explore.headline')}
              <SquiggleMark width={30} className="explore-head__squiggle" />
            </h1>
          </div>
          <Link to="/me/saved" className="icon-btn icon-btn--square" aria-label={t('me.saved')}>
            <SaveGlyph size={22} />
          </Link>
        </header>
        <button type="button" className="home-location explore-area" onClick={() => setAreaSheet(true)}>
          <PinGlyph size={16} />
          {areaLabel}
          <ChevronDownGlyph size={14} />
        </button>

        <form onSubmit={onSearch} role="search">
          <label htmlFor="explore-q" className="search-field">
            <SearchGlyph size={22} />
            <input
              id="explore-q"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('discover.explore.search')}
              autoComplete="off"
              enterKeyHint="search"
            />
          </label>
        </form>

        <div className="chip-row" role="group" aria-label={t('discover.explore.mood')}>
          {MOODS.map((m) => (
            <button key={m.id} type="button" className="chip chip--icon" aria-pressed={mood === m.id} onClick={() => setMood(m.id)}>
              <NamedGlyph name={m.glyph} size={18} />
              {t(m.key)}
            </button>
          ))}
        </div>

        <CityMap pins={pins} home={home} radiusKm={radius} areaLabel={t('discover.explore.nearYou')} onArea={() => setAreaSheet(true)} />

        {featured ? (
          <section className="section" aria-labelledby="worth-title">
            <SectionHead id="worth-title" title={t('discover.explore.worth')} to={mood === 'coffee' || mood === 'food' ? '/explore/food' : '/explore/places'} />
            <article className="feature-card">
              <Link to={`/place/${featured.id}`} className="feature-card__link">
                <span className="feature-card__media photo-frame">
                  {placePhoto(featured.id) ? (
                    <img src={placePhoto(featured.id)} alt="" />
                  ) : (
                    <span className={`photo-frame__glyph tone-${featured.tone}`}>
                      <NamedGlyph name={featured.glyph} size={40} duo />
                    </span>
                  )}
                  {friendIds.length ? (
                    <span className="photo-pill" style={{ top: 14, left: 16 }}>
                      <HeartGlyph size={13} style={{ color: '#6c52ee' }} />
                      {t('discover.explore.friendsLove')}
                    </span>
                  ) : featured.isNew ? (
                    <span className="photo-pill" style={{ top: 14, left: 16 }}>
                      New this week
                    </span>
                  ) : null}
                </span>
                <span className="feature-card__body">
                  <span className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
                    <span className="feature-card__title grow">{featured.name}</span>
                    <span className="feature-card__rating">
                      <StarGlyph size={17} />
                      {featured.rating.toFixed(1)}
                    </span>
                  </span>
                  <span className="meta">
                    {featured.kind} · {km(featured.distanceKm)}
                    {featured.bestTime ? ` · Best ${featured.bestTime.toLowerCase()}` : ''}
                  </span>
                  {friendIds.length ? (
                    <span className="row feature-card__friends">
                      <FaceStack ids={friendIds} size={28} />
                      <span className="grow">
                        {friendIds.length === 1
                          ? t('discover.explore.recommendOne', { name: person(friendIds[0]).name.split(' ')[0] })
                          : t('discover.explore.recommend', { name: person(friendIds[0]).name.split(' ')[0], n: friendIds.length - 1 })}
                      </span>
                      <ChevronRightGlyph size={18} style={{ color: 'var(--accent)' }} />
                    </span>
                  ) : (
                    <span className="row feature-card__friends">
                      <span className="grow">{featuredCommunity?.total ? `${featuredCommunity.mustPct}% of ${featuredCommunity.total} locals say must try` : featured.summary}</span>
                      <ChevronRightGlyph size={18} style={{ color: 'var(--accent)' }} />
                    </span>
                  )}
                </span>
              </Link>
              <button
                type="button"
                className="photo-action photo-action--sm"
                style={{ top: 12, right: 0 }}
                aria-pressed={saved}
                aria-label={saved ? 'Remove from saved' : 'Save place'}
                onClick={() => toggle('savedPlaces', featured.id)}
              >
                <SaveGlyph size={17} active={saved} />
              </button>
            </article>
          </section>
        ) : null}

        {tonight.length && (mood === 'for-you' || mood === 'culture') ? (
          <div className="stack" style={{ gap: 0 }}>
            {tonight.map((e) => (
              <Link key={e.id} to={`/event/${e.id}`} className="tonight-card">
                <span className="tonight-card__media photo-frame">
                  {eventPhoto(e.id) ? (
                    <img src={eventPhoto(e.id)} alt="" loading="lazy" />
                  ) : (
                    <span className={`photo-frame__glyph tone-${e.tone}`}>
                      <NamedGlyph name={e.glyph} size={30} duo />
                    </span>
                  )}
                </span>
                <span className="tonight-card__body">
                  <span className="badge badge--lime">{t('discover.explore.tonight')}</span>
                  <span className="tonight-card__title">{e.title}</span>
                  <span className="meta">
                    {e.time.replace(/(\d)\s?(am|pm)/i, (_, d, ap) => `${d}:00 ${ap.toUpperCase()}`)}
                    {e.distanceKm ? ` · ${km(e.distanceKm)}` : ` · ${e.area}`}
                  </span>
                </span>
                <ChevronRightGlyph size={20} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              </Link>
            ))}
          </div>
        ) : null}

        <section className="section" aria-labelledby="spotted-title">
          <div className="section__head">
            <h2 className="section__title" id="spotted-title">
              {t('discover.spotted.title')}
            </h2>
            <Link to="/settings/about" className="section__link">
              {t('discover.spotted.how')}
            </Link>
          </div>
          <p className="meta" style={{ marginTop: -6 }}>
            {t('discover.spotted.sub')}
          </p>
          <div>
            {spotted.map((sp) => {
              const pic = sp.photo ? photo(sp.photo) : undefined;
              const done = sp.count >= sp.needed;
              return (
                <div key={sp.id} className="spotted-row">
                  <span className="spotted-row__thumb photo-frame">
                    {pic ? (
                      <img src={pic} alt="" loading="lazy" />
                    ) : (
                      <span className={`photo-frame__glyph tone-${sp.tone}`}>
                        <NamedGlyph name={sp.glyph} size={22} duo />
                      </span>
                    )}
                  </span>
                  <span className="spotted-row__body">
                    <span className="spotted-row__name">{sp.name}</span>
                    <span className="meta">
                      {sp.kind} · {sp.area}
                    </span>
                    <span className="spotted-row__by">
                      {sp.mine ? t('discover.spotted.byYou') : t('discover.spotted.by', { name: person(sp.spottedBy).name.split(' ')[0] })} · {sp.ago}
                    </span>
                    <span className="spotted-row__progress" aria-label={t('discover.spotted.progress', { n: sp.count, total: sp.needed })}>
                      {Array.from({ length: sp.needed }, (_, i) => (
                        <span key={i} className={i < sp.count ? 'is-on' : undefined} />
                      ))}
                      <small>{done ? t('discover.spotted.ready') : t('discover.spotted.progress', { n: sp.count, total: sp.needed })}</small>
                    </span>
                  </span>
                  {sp.mine || sp.confirmedBy.includes('me') ? null : (
                    <button
                      type="button"
                      className={`chip${sp.confirmedByMe ? ' chip--soft' : ''}`}
                      style={{ height: 30, padding: '0 11px' }}
                      aria-pressed={sp.confirmedByMe}
                      onClick={() => toggle('confirmedSpots', sp.id)}
                    >
                      {sp.confirmedByMe ? <CheckGlyph size={14} /> : null}
                      {sp.confirmedByMe ? t('discover.spotted.confirmed') : t('discover.spotted.been')}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="section" aria-labelledby="reels-title">
          <div className="section__head">
            <h2 className="section__title" id="reels-title">
              {t('discover.reels.title')}
            </h2>
          </div>
          <p className="meta" style={{ marginTop: -6 }}>
            {t('discover.reels.sub')}
          </p>
          <div className="hscroll">
            {WEB_PICKS.map((w) => (
              <Link key={w.id} to={`/place/${w.placeId}`} className="photo-card reel-card" style={{ width: 150 }}>
                <span className="photo-frame photo-card__media" style={{ height: 190 }}>
                  {photo(w.photo) ? <img src={photo(w.photo)} alt="" loading="lazy" /> : null}
                  <span className="photo-pill" style={{ left: 8, bottom: 8 }}>
                    <span className="reel-card__play" aria-hidden="true" />
                    {t('discover.reels.count', { n: w.reels })}
                  </span>
                </span>
                <span className="photo-card__body">
                  <span className="photo-card__title" style={{ fontSize: '0.8438rem' }}>
                    {w.title}
                  </span>
                  <span className="meta">{w.gist}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {more.length ? (
          <section className="section" aria-labelledby="more-title">
            <SectionHead id="more-title" title={t('discover.explore.more')} to="/explore/places" />
            <div className="hscroll">
              {more.map((p) => {
                const c = placeCommunity(p.id, data, settings);
                return (
                  <Link key={p.id} to={`/place/${p.id}`} className="photo-card" style={{ width: 164 }}>
                    <span className="photo-frame photo-card__media" style={{ height: 120 }}>
                      {placePhoto(p.id) ? (
                        <img src={placePhoto(p.id)} alt="" loading="lazy" />
                      ) : (
                        <span className={`photo-frame__glyph tone-${p.tone}`}>
                          <NamedGlyph name={p.glyph} size={34} duo />
                        </span>
                      )}
                      {p.isNew ? (
                        <span className="photo-pill" style={{ top: 10, left: 10 }}>
                          New
                        </span>
                      ) : null}
                    </span>
                    <span className="photo-card__body">
                      <span className="photo-card__title">{p.name}</span>
                      <span className="meta">
                        {p.kind} · {km(p.distanceKm)}
                      </span>
                      {c.friendIds.length ? (
                        <span className="row" style={{ gap: 6 }}>
                          <FaceStack ids={c.friendIds} size={20} />
                          <span className="meta" style={{ color: 'var(--accent)', fontWeight: 700 }}>
                            {c.friendIds.length === 1 ? `${person(c.friendIds[0]).name.split(' ')[0]} has been` : `${c.friendIds.length} friends`}
                          </span>
                        </span>
                      ) : c.total ? (
                        <span className="meta" style={{ color: 'var(--mint-ink)', fontWeight: 700 }}>
                          {c.mustPct}% say must try
                        </span>
                      ) : null}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="section" aria-labelledby="cats-title">
          <SectionHead id="cats-title" title={t('discover.explore.categories')} />
          <nav aria-labelledby="cats-title" className="explore-tiles">
            {categories.map((c) => (
              <Link key={c.key} to={c.to} className={`explore-tile glyph-host${c.photo ? ' explore-tile--photo' : ` tone-${c.tone}`}`}>
                {c.photo ? <img src={c.photo} alt="" loading="lazy" /> : null}
                <span className="explore-tile__icon">
                  <NamedGlyph name={c.glyph} size={20} duo={!c.photo} live={c.live} />
                </span>
                <span className="explore-tile__text">
                  <span className="explore-tile__name">{t(c.key)}</span>
                  <span className="explore-tile__count">{c.count}</span>
                </span>
              </Link>
            ))}
          </nav>
        </section>

        {mustTries.length ? (
          <section className="section" aria-labelledby="friend-picks-title">
            <SectionHead id="friend-picks-title" title={t('feed.friends.mustTriesWeek')} to="/friends" />
            <div className="hscroll">
              {mustTries.map((c) => (
                <FriendPickCard key={c.id} c={c} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="section" aria-labelledby="lists-title">
          <SectionHead id="lists-title" title={t('feed.friends.curatedLists')} />
          <div className="hscroll">
            {lists.map((c) => (
              <CollectionCard key={c.id} col={c} />
            ))}
          </div>
        </section>

        <section className="section" aria-labelledby="new-title">
          <SectionHead id="new-title" title={t('discover.explore.newThisWeek')} to="/explore/places" />
          <div className="list">
            {newThisWeek.map((p, i) => (
              <PlaceRow key={p.id} place={p} last={i === newThisWeek.length - 1} />
            ))}
          </div>
        </section>

        <section className="section" aria-labelledby="groups-title">
          <SectionHead id="groups-title" title={t('discover.explore.clubs')} to="/clubs" />
          {(suggestedGroups.length ? suggestedGroups : GROUPS.slice(0, 2)).map((g) => (
            <GroupRow key={g.id} group={g} />
          ))}
        </section>
      </main>

      <Sheet open={areaSheet} onClose={() => setAreaSheet(false)} title={t('discover.explore.radius')}>
        <div className="chip-wrap">
          {RADII.map((r) => (
            <button key={r} type="button" className="chip" aria-pressed={radius === r} onClick={() => update('location', { radiusKm: r })}>
              {r} km
            </button>
          ))}
        </div>
        <span className="field__label">{t('discover.explore.aroundWhere')}</span>
        <div className="list">
          {NEIGHBOURHOODS.filter((n) => NEIGHBOURHOOD_POS[n.id]).map((n) => (
            <button key={n.id} type="button" className="list-row" aria-pressed={homeId === n.id} onClick={() => update('location', { home: n.id })}>
              <span className="list-row__body">
                <span className="list-row__title">{n.name}</span>
                <span className="list-row__meta">{n.zone} zone</span>
              </span>
              {homeId === n.id ? <CheckGlyph size={20} style={{ color: 'var(--accent)' }} /> : null}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn--primary btn--block" onClick={() => setAreaSheet(false)}>
          {t('common.done')}
        </button>
      </Sheet>
    </>
  );
}
