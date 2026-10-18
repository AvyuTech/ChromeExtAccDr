import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CorridorRow, ParkingRow, shiftClock } from '../components/city';
import { CityMap, NEIGHBOURHOOD_POS, TRAFFIC_COLOR } from '../components/CityMap';
import { PageHeader, SectionHead } from '../components/ui';
import { NEIGHBOURHOODS, neighbourhoodName } from '../data/core';
import { useT } from '../i18n';
import { ClockGlyph, TrafficGlyph, TRAFFIC_LABEL } from '../icons';
import type { TrafficLevel } from '../icons/live';
import { heatSpots, planRoutes, roadLevels, ROUTABLE, whyBest } from '../lib/traffic';
import { useLiveCity } from '../state/live';
import { useSettings } from '../state/settings';

const LEGEND: Array<{ level: TrafficLevel; key: string }> = [
  { level: 0, key: 'city.legend.free' },
  { level: 1, key: 'city.legend.moderate' },
  { level: 2, key: 'city.legend.heavy' },
  { level: 3, key: 'city.legend.jam' },
];

function nowClock() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Traffic: a live heat map of west Ahmedabad and the quickest way between two areas right now. */
export default function Traffic() {
  const t = useT();
  const pulse = useLiveCity();
  const { settings } = useSettings();
  const loc = settings.location;
  const places = NEIGHBOURHOODS.filter((n) => ROUTABLE.includes(n.id));
  const hasCommute = ROUTABLE.includes(loc.home) && ROUTABLE.includes(loc.work) && loc.home !== loc.work;

  const [from, setFrom] = useState(ROUTABLE.includes(loc.home) ? loc.home : 'bodakdev');
  const [to, setTo] = useState(hasCommute ? loc.work : from === 'navrangpura' ? 'bodakdev' : 'navrangpura');
  const [picked, setPicked] = useState<string | null>(null);

  const routes = useMemo(() => planRoutes(from, to, NEIGHBOURHOOD_POS[from], NEIGHBOURHOOD_POS[to], pulse.corridors), [from, to, pulse.corridors]);
  const roads = useMemo(() => roadLevels(pulse.corridors), [pulse.corridors]);
  const heat = useMemo(() => heatSpots(pulse.corridors), [pulse.corridors]);
  const centre = useMemo<[number, number]>(() => {
    const [a, b] = [NEIGHBOURHOOD_POS[from], NEIGHBOURHOOD_POS[to]];
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  }, [from, to]);

  const best = routes[0];
  const selected = routes.find((r) => r.id === picked) ?? best;
  const isCommute = from === loc.home && to === loc.work;
  const hotspots = heat.filter((h) => h.level > 0).sort((a, b) => b.level - a.level);

  const choose = (nextFrom: string, nextTo: string) => {
    setFrom(nextFrom);
    setTo(nextTo);
    setPicked(null);
  };

  return (
    <>
      <PageHeader title={t('city.traffic')} fallback="/city" sub={pulse.paused ? 'Live updates paused' : 'Live · updates every 20 s'} />
      <main className="page page--with-header traffic">
        <section className="trip" aria-label="Plan a trip">
          <span className="trip__rail" aria-hidden="true">
            <span className="trip__dot" />
            <span className="trip__line" />
            <span className="trip__dot trip__dot--to" />
          </span>
          <div className="trip__fields">
            <label className="trip__field">
              <span className="trip__label">{t('city.from')}</span>
              <select value={from} onChange={(e) => choose(e.target.value, e.target.value === to ? from : to)}>
                {places.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                    {n.id === loc.home ? ' · home' : n.id === loc.work ? ' · work' : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="trip__field">
              <span className="trip__label">{t('city.to')}</span>
              <select value={to} onChange={(e) => choose(e.target.value === from ? to : from, e.target.value)}>
                {places.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                    {n.id === loc.home ? ' · home' : n.id === loc.work ? ' · work' : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button type="button" className="icon-btn icon-btn--ghost" aria-label={t('city.swap')} onClick={() => choose(to, from)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M8 4v15M4.5 7.5 8 4l3.5 3.5M16 20V5M12.5 16.5 16 20l3.5-3.5" />
            </svg>
          </button>
        </section>

        <CityMap
          className="city-map--bleed city-map--tall"
          pins={[]}
          home={centre}
          radiusKm={0}
          showYou={false}
          heat={heat}
          roads={roads}
          routes={routes.map((r) => ({ id: r.id, points: r.points, selected: r.id === selected?.id }))}
          ends={{ from: NEIGHBOURHOOD_POS[from], to: NEIGHBOURHOOD_POS[to] }}
          onRoute={setPicked}
        />
        <div className="traffic-legend" aria-label="Map key">
          {LEGEND.map((l) => (
            <span key={l.level}>
              <i style={{ background: TRAFFIC_COLOR[l.level] }} />
              {t(l.key)}
            </span>
          ))}
          <span className="grow" />
          {pulse.paused ? (
            <Link to="/settings/data" className="traffic-live is-paused">
              Paused
            </Link>
          ) : (
            <span className="traffic-live">
              <span className="live-dot" />
              Live
            </span>
          )}
        </div>

        {selected ? (
          <section className="section" aria-labelledby="routes-title">
            <h2 id="routes-title" className="sr-only">
              {t('city.routes')}
            </h2>
            <div className="list" role="radiogroup" aria-label={t('city.routes')}>
              {routes.map((r) => {
                const delta = r.minutes - r.usual;
                const on = r.id === selected.id;
                return (
                  <button key={r.id} type="button" role="radio" aria-checked={on} className="list-row route-row" onClick={() => setPicked(r.id)}>
                    <span className={`route-row__swatch${on ? ' is-on' : ''}`} aria-hidden="true" />
                    <span className="list-row__body">
                      <span className="list-row__title row" style={{ gap: 6 }}>
                        via {r.via}
                        {r.id === best.id ? <span className="badge badge--sm badge--lime">{t('city.bestNow')}</span> : null}
                      </span>
                      <span className="list-row__meta">
                        {r.km} km · usually {r.usual} min
                        {r.worst?.cause && r.id !== best.id ? ` · ${r.worst.cause}` : ''}
                      </span>
                      {r.id === best.id && routes.length > 1 ? <span className="route-row__why">{whyBest(best, routes)}</span> : null}
                    </span>
                    <span className="city-trail">
                      <span className="route-row__min num">{r.minutes} min</span>
                      <span className={`route-row__delta${delta > 1 ? ' is-late' : delta < 0 ? ' is-early' : ''}`}>
                        {delta > 1 ? `+${delta} min` : delta < 0 ? `${-delta} min faster` : 'As usual'}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="trip-leave">
              <ClockGlyph size={15} />
              {isCommute ? (
                <span>
                  Leave by <b>{shiftClock(loc.leaveAt, selected.usual - selected.minutes)}</b> to reach {neighbourhoodName(to)} at your usual{' '}
                  {shiftClock(loc.leaveAt, selected.usual)}.
                </span>
              ) : (
                <span>
                  Leave now and reach {neighbourhoodName(to)} by <b>{shiftClock(nowClock(), selected.minutes)}</b>.
                </span>
              )}
            </p>
          </section>
        ) : null}

        {hotspots.length ? (
          <section className="section" aria-labelledby="hot-title">
            <SectionHead id="hot-title" title={t('city.hotspots')} />
            <div className="list">
              {hotspots.map((h) => (
                <div key={h.id} className="list-row">
                  <span className="hot-dot" style={{ background: TRAFFIC_COLOR[h.level] }} aria-hidden="true">
                    <TrafficGlyph level={h.level} size={17} />
                  </span>
                  <span className="list-row__body">
                    <span className="list-row__title">{h.label}</span>
                  </span>
                  <span className="list-row__trail" style={{ color: 'var(--ink)' }}>
                    {TRAFFIC_LABEL[h.level]}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="section" aria-labelledby="roads-title">
          <SectionHead id="roads-title" title={t('city.roads')} />
          <div className="list">
            {pulse.corridors.map((c) => (
              <CorridorRow key={c.id} c={c} />
            ))}
          </div>
        </section>

        <section className="section" aria-labelledby="parking-title">
          <SectionHead id="parking-title" title={t('city.parking')} />
          <div className="list">
            {pulse.parking.map((p) => (
              <ParkingRow key={p.id} p={p} />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
