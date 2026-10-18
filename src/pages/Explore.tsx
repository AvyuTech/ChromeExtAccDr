import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, PlaceRow } from '../components/cards';
import { CityMap, NEIGHBOURHOOD_POS, PLACE_POS, type MapPin } from '../components/CityMap';
import { FriendPickCard } from '../components/community';
import { CollectionCard } from '../components/friends';
import { SectionHead, Sheet } from '../components/ui';
import { placePhoto } from '../assets/photos';
import { NEIGHBOURHOODS, neighbourhoodName, PEOPLE, person } from '../data/core';
import { COLLECTIONS } from '../data/friends';
import { PLACES, placeById } from '../data/places';
import type { Place, PlaceCategory } from '../data/types';
import { useT } from '../i18n';
import { CheckGlyph, ChevronDownGlyph, ChevronRightGlyph, ListsGlyph, MapGlyph, NamedGlyph, PinGlyph, PlusGlyph, SearchGlyph, SparkGlyph } from '../icons';
import { km } from '../lib/format';
import { friendsMustTries, placeCommunity, profileInfo } from '../lib/friends';
import { pageMatches, spotPhoto, spottedPlaces } from '../lib/places';
import { useAppData } from '../state/appData';
import { useSettings } from '../state/settings';
import { EntityPic, placeKind } from '../components/entity';

/*
  Explore is for finding pages. Everything on it comes from what people make on
  Nearhood: pages they added and confirmed, their check-ins and their lists.
  Events live with whoever posted them, clubs have their own tab.
*/

type Filter = 'all' | 'cafes' | 'food' | 'sports' | 'outdoors' | 'culture' | 'shopping' | 'trips';

const FILTERS: Array<{ id: Filter; label: string; cats?: PlaceCategory[] }> = [
  { id: 'all', label: 'All' },
  { id: 'cafes', label: 'Cafés', cats: ['cafe'] },
  { id: 'food', label: 'Food', cats: ['food'] },
  { id: 'sports', label: 'Sports', cats: ['sports'] },
  { id: 'outdoors', label: 'Outdoors', cats: ['nature'] },
  { id: 'culture', label: 'Culture', cats: ['culture', 'heritage'] },
  { id: 'shopping', label: 'Shopping', cats: ['shopping'] },
  { id: 'trips', label: 'Day trips' },
];

const RADII = [1, 2, 3, 5, 10, 20];

/** Day trips only show under their own filter; everything else is in the city. */
function matches(filter: Filter, category: PlaceCategory, outsideCity: boolean) {
  if (filter === 'trips') return outsideCity;
  if (outsideCity) return false;
  const cats = FILTERS.find((f) => f.id === filter)?.cats;
  return !cats || cats.includes(category);
}

export default function Explore() {
  const t = useT();
  const navigate = useNavigate();
  const { settings, update } = useSettings();
  const { data, toggle } = useAppData();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [mapOn, setMapOn] = useState(false);
  const [areaSheet, setAreaSheet] = useState(false);

  const radius = settings.location.radiusKm;
  const homeId = settings.location.home;
  const home = NEIGHBOURHOOD_POS[homeId] ?? NEIGHBOURHOOD_POS.bodakdev;
  const pagesIn = (p: Place) => matches(filter, p.category, !!p.origin.outsideCity);

  // Popular this week: friends who've been count most, then this week's check-ins, then how many locals vouch.
  const popular = useMemo(() => {
    const score = (p: Place) => {
      const c = placeCommunity(p.id, data, settings);
      const thisWeek = c.reviews.filter((r) => r.recency === 0).length;
      return c.friendIds.length * 3 + thisWeek * 2 + c.total / 40 + (p.distanceKm <= radius ? 1 : 0);
    };
    return PLACES.filter((p) => matches(filter, p.category, !!p.origin.outsideCity) && !p.isNew)
      .map((p) => ({ p, s: score(p) }))
      .sort((a, b) => b.s - a.s || a.p.name.localeCompare(b.p.name))
      .slice(0, 5)
      .map((x) => x.p);
  }, [filter, data, settings, radius]);

  const mustTries = friendsMustTries(data).filter((c) => {
    if (filter === 'all') return true;
    const place = c.placeId ? placeById(c.placeId) : undefined;
    return !!place && pagesIn(place);
  });
  const newPages = PLACES.filter((p) => p.isNew && pagesIn(p));
  const spotted = spottedPlaces(data).filter((s) => matches(filter, s.category, false));
  // Lists by other people first; your own lists live on your profile.
  const lists = COLLECTIONS.filter((c) => c.ownerId !== 'me')
    .filter((c) => filter === 'all' || c.placeIds.some((id) => (placeById(id) ? pagesIn(placeById(id)!) : false)))
    .sort((a, b) => Number(data.following.includes(b.ownerId)) - Number(data.following.includes(a.ownerId)) || b.followers - a.followers);

  const pins: MapPin[] = PLACES.filter((p) => PLACE_POS[p.id] && pagesIn(p)).map((p) => ({
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

  // Typing finds pages, people and lists straight away; nothing found means it's time to add a page.
  const typed = query.trim();
  const found = typed.length >= 2 ? pageMatches(typed, data, 4) : undefined;
  const q = typed.toLowerCase();
  const people = found
    ? Object.values(PEOPLE)
        .filter((p) => p.id !== 'me' && (p.name.toLowerCase().includes(q) || profileInfo(p.id).handle.toLowerCase().includes(q)))
        .slice(0, 3)
    : [];
  const listHits = found ? COLLECTIONS.filter((c) => c.title.toLowerCase().includes(q)).slice(0, 3) : [];

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    if (typed) navigate(`/ask?q=${encodeURIComponent(typed)}`);
  };

  return (
    <>
      <main className="page explore">
        <header className="explore-head">
          <h1 className="explore-head__title">Explore</h1>
          <p className="explore-head__sub">Places people here added and vouch for</p>
        </header>

        <form onSubmit={onSearch} role="search">
          <label htmlFor="explore-q" className="search-field">
            <SearchGlyph size={20} />
            <input
              id="explore-q"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages, people and lists"
              autoComplete="off"
              enterKeyHint="search"
            />
          </label>
        </form>

        {found ? (
          <div className="list explore-found" aria-live="polite">
            {found.listed.map((p) => (
              <Link key={p.id} to={`/place/${p.id}`} className="list-row">
                <EntityPic kind={placeKind(p)} src={placePhoto(p.id)} size={40} fallback={<NamedGlyph name={p.glyph} size={18} />} />
                <span className="list-row__body">
                  <span className="list-row__title">{p.name}</span>
                  <span className="list-row__meta">
                    {p.kind} · {p.area}
                  </span>
                </span>
              </Link>
            ))}
            {found.spotted.map((sp) => (
              <a
                key={sp.id}
                href="#new-title"
                className="list-row"
                onClick={(e) => {
                  e.preventDefault();
                  setQuery('');
                  setFilter('all');
                  window.setTimeout(() => document.getElementById('new-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
                }}
              >
                <EntityPic kind="page" src={spotPhoto(sp)} size={40} fallback={<NamedGlyph name={sp.glyph} size={18} />} />
                <span className="list-row__body">
                  <span className="list-row__title">{sp.name}</span>
                  <span className="list-row__meta">
                    {sp.kind} · {sp.area} · being confirmed
                  </span>
                </span>
              </a>
            ))}
            {people.map((p) => (
              <Link key={p.id} to={`/people/${p.id}`} className="list-row">
                <Avatar who={{ ...p, verified: false }} size={40} />
                <span className="list-row__body">
                  <span className="list-row__title">{p.name}</span>
                  <span className="list-row__meta">
                    @{profileInfo(p.id).handle} · {p.area}
                  </span>
                </span>
              </Link>
            ))}
            {listHits.map((c) => (
              <Link key={c.id} to={`/lists/${c.id}`} className="list-row">
                <span className="explore-found__icon">
                  <ListsGlyph size={17} />
                </span>
                <span className="list-row__body">
                  <span className="list-row__title">{c.title}</span>
                  <span className="list-row__meta">
                    List by {person(c.ownerId).name} · {c.placeIds.length} places
                  </span>
                </span>
              </Link>
            ))}
            <Link to={`/ask?q=${encodeURIComponent(typed)}`} className="list-row">
              <span className="explore-found__icon">
                <SparkGlyph size={17} />
              </span>
              <span className="list-row__body">
                <span className="list-row__title">Ask Nearhood about “{typed}”</span>
              </span>
            </Link>
            <Link to={`/pages/new?name=${encodeURIComponent(typed)}`} className="list-row">
              <span className="explore-found__icon">
                <PlusGlyph size={17} />
              </span>
              <span className="list-row__body">
                <span className="list-row__title">
                  {found.listed.length + found.spotted.length + people.length + listHits.length ? 'Not what you meant? Add a page' : `Can’t find “${typed}”? Add a page`}
                </span>
                <span className="list-row__meta">Verified residents add pages. Three locals confirm them.</span>
              </span>
            </Link>
          </div>
        ) : null}

        <div className="explore-bar">
          <button type="button" className="explore-area" onClick={() => setAreaSheet(true)}>
            <PinGlyph size={14} />
            {t('discover.explore.around', { area: neighbourhoodName(homeId), km: radius })}
            <ChevronDownGlyph size={13} />
          </button>
          <button type="button" className="explore-map-toggle" aria-pressed={mapOn} onClick={() => setMapOn((v) => !v)}>
            <MapGlyph size={15} />
            {mapOn ? 'Hide map' : 'Map'}
          </button>
        </div>

        <div className="chip-row explore-filters" role="group" aria-label="Show">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" className="chip" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>

        {mapOn ? <CityMap pins={pins} home={home} radiusKm={radius} areaLabel={t('discover.explore.nearYou')} onArea={() => setAreaSheet(true)} className="explore-map" /> : null}

        {mustTries.length ? (
          <section className="section" aria-labelledby="friend-picks-title">
            <SectionHead id="friend-picks-title" title="Friends’ must-tries" to="/friends" />
            <div className="hscroll">
              {mustTries.map((c) => (
                <FriendPickCard key={c.id} c={c} />
              ))}
            </div>
          </section>
        ) : null}

        {newPages.length || spotted.length ? (
          <section className="section" aria-labelledby="new-title">
            <div className="section__head">
              <h2 className="section__title" id="new-title">
                New in the city
              </h2>
              <Link to="/settings/about" className="section__link">
                {t('discover.spotted.how')}
              </Link>
            </div>
            {newPages.length ? (
              <div className="list">
                {newPages.map((p, i) => (
                  <PlaceRow key={p.id} place={p} last={i === newPages.length - 1 && !spotted.length} />
                ))}
              </div>
            ) : null}
            {spotted.length ? (
              <>
                <p className="explore-note">Spotted by locals. Each joins Nearhood once three neighbours confirm it. Been there? Confirm it.</p>
                <div>
                  {spotted.map((sp) => {
                    const pic = spotPhoto(sp);
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
              </>
            ) : null}
            <Link to="/pages/new" className="spotted-add">
              <PlusGlyph size={16} />
              <span className="grow">Spotted something new? Add a page</span>
              <ChevronRightGlyph size={15} />
            </Link>
          </section>
        ) : null}

        {popular.length ? (
          <section className="section" aria-labelledby="popular-title">
            <SectionHead
              id="popular-title"
              title={filter === 'trips' ? 'Day trips friends saved' : 'Popular this week'}
              to={filter === 'trips' ? '/explore/getaways' : filter === 'cafes' || filter === 'food' ? '/explore/food' : '/explore/places'}
            />
            <div className="list">
              {popular.map((p, i) => (
                <PlaceRow key={p.id} place={p} last={i === popular.length - 1} />
              ))}
            </div>
          </section>
        ) : null}

        {lists.length ? (
          <section className="section" aria-labelledby="lists-title">
            <SectionHead id="lists-title" title="Lists by locals" />
            <div className="hscroll">
              {lists.map((c) => (
                <CollectionCard key={c.id} col={c} />
              ))}
            </div>
          </section>
        ) : null}

        <Link to="/pages/new" className="explore-add">
          <PlusGlyph size={16} />
          <span className="grow">
            <b>Can’t find a place?</b> Add a page. Three locals confirm it and it’s live.
          </span>
          <ChevronRightGlyph size={15} />
        </Link>
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
