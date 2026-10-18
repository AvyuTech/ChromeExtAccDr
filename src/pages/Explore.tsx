import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GroupRow, PlaceRow } from '../components/cards';
import { SectionHead } from '../components/ui';
import { neighbourhoodName } from '../data/core';
import { EVENTS, MOVIES } from '../data/events';
import { PLACES } from '../data/places';
import { DEALS, GROUPS } from '../data/social';
import type { Tone } from '../data/types';
import { useT } from '../i18n';
import { NamedGlyph, PinGlyph, SearchGlyph, type GlyphName } from '../icons';
import { visibleAlerts } from '../lib/selectors';
import { useAppData } from '../state/appData';
import { useSettings } from '../state/settings';

interface CategoryTile {
  key: string;
  to: string;
  glyph: GlyphName;
  tone: Tone;
  count: string;
  live?: boolean;
}

export default function Explore() {
  const t = useT();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { data } = useAppData();
  const [query, setQuery] = useState('');

  const radius = settings.location.radiusKm;
  const alerts = visibleAlerts(settings, data);
  const foodCount = PLACES.filter((p) => p.category === 'food' || p.category === 'cafe').length;
  const newFood = PLACES.filter((p) => (p.category === 'food' || p.category === 'cafe') && p.isNew).length;
  const eventsThisWeek = EVENTS.filter((e) => e.confirmed || settings.sources.showUnconfirmed).length;

  const categories: CategoryTile[] = [
    { key: 'discover.cat.food', to: '/explore/food', glyph: 'food', tone: 'peach', count: newFood ? `${foodCount} places · ${newFood} new` : `${foodCount} places` },
    { key: 'discover.cat.events', to: '/explore/events', glyph: 'events', tone: 'violet', count: `${eventsThisWeek} this week` },
    { key: 'discover.cat.deals', to: '/deals', glyph: 'deals', tone: 'green', count: `${DEALS.length} live` },
    { key: 'discover.cat.alerts', to: '/city/alerts', glyph: 'alert', tone: 'yellow', count: alerts.length ? `${alerts.length} today` : 'All quiet', live: alerts.some((a) => a.severity !== 'info') },
    { key: 'discover.cat.movies', to: '/explore/movies', glyph: 'movies', tone: 'blue', count: `${MOVIES.length} showing` },
    { key: 'discover.cat.getaways', to: '/explore/getaways', glyph: 'getaways', tone: 'teal', count: 'Within 3 hrs' },
  ];

  const newThisWeek = [...PLACES].sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew) || a.reviews - b.reviews).slice(0, 3);
  const openNear = PLACES.filter((p) => p.openNow && p.distanceKm <= radius && !newThisWeek.includes(p))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 4);
  const suggestedGroups = GROUPS.filter((g) => !data.joinedGroups.includes(g.id)).slice(0, 2);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) navigate(`/ask?q=${encodeURIComponent(q)}`);
  };

  return (
    <main className="page">
      <div className="page-intro">
        <span className="row meta" style={{ gap: 4, fontWeight: 500, fontSize: '0.8125rem' }}>
          <PinGlyph size={13} style={{ color: 'var(--accent)' }} />
          {neighbourhoodName(settings.location.home)}, {settings.location.city}
        </span>
        <h1 className="page-title">{t('discover.explore.title')}</h1>
      </div>

      <form onSubmit={onSearch} role="search">
        <label htmlFor="explore-q" className="search-field">
          <SearchGlyph size={18} />
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

      <nav aria-label={t('discover.explore.categories')} className="grid-3 explore-grid">
        {categories.map((c) => (
          <Link key={c.key} to={c.to} className="explore-cat glyph-host">
            <span className={`tile tone-${c.tone}`}>
              <NamedGlyph name={c.glyph} size={21} duo live={c.live} />
            </span>
            <span className="stack" style={{ gap: 2 }}>
              <span className="explore-cat__name">{t(c.key)}</span>
              <span className="explore-cat__count">{c.count}</span>
            </span>
          </Link>
        ))}
      </nav>

      <section className="section" aria-labelledby="new-title">
        <SectionHead id="new-title" title={t('discover.explore.newThisWeek')} to="/explore/places" />
        <div className="list">
          {newThisWeek.map((p, i) => (
            <PlaceRow key={p.id} place={p} last={i === newThisWeek.length - 1} />
          ))}
        </div>
      </section>

      {openNear.length > 0 ? (
        <section className="section" aria-labelledby="open-title">
          <SectionHead id="open-title" title={t('discover.explore.openNow')} to="/explore/food" />
          <div className="list">
            {openNear.map((p, i) => (
              <PlaceRow key={p.id} place={p} last={i === openNear.length - 1} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="section" aria-labelledby="groups-title">
        <SectionHead id="groups-title" title={t('discover.explore.groups')} to="/groups" />
        {(suggestedGroups.length ? suggestedGroups : GROUPS.slice(0, 2)).map((g) => (
          <GroupRow key={g.id} group={g} />
        ))}
      </section>
    </main>
  );
}
