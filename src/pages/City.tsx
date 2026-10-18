import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { scenePhoto } from '../assets/photos';
import { AlertRow, CONDITION_LABEL, ParkingRow, PowerRow, Sparkline, WaterRow } from '../components/city';
import { CityMap, NEIGHBOURHOOD_POS, TRAFFIC_COLOR, type MapPin } from '../components/CityMap';
import { SectionHead } from '../components/ui';
import { neighbourhoodName } from '../data/core';
import { ALERT_KIND_META, SERVICES } from '../data/city';
import type { Tone } from '../data/types';
import { useT } from '../i18n';
import { AqiDial, aqiBand, ChevronRightGlyph, NamedGlyph, PinGlyph, SlidersGlyph, WeatherGlyph, type GlyphName } from '../icons';
import { rupees } from '../lib/format';
import { heatSpots, planRoutes, roadLevels, ROUTABLE } from '../lib/traffic';
import { visibleAlerts } from '../lib/selectors';
import { useAppData } from '../state/appData';
import { useLiveCity } from '../state/live';
import { useSettings } from '../state/settings';

const QUICK: Array<{ to: string; label: string; glyph: GlyphName; tone: Tone }> = [
  { to: '/city/report', label: 'Report', glyph: 'report', tone: 'amber' },
  { to: '/city/services', label: 'Services', glyph: 'services', tone: 'violet' },
  { to: '/city/safety', label: 'SOS', glyph: 'safety', tone: 'red' },
  { to: '/city/traffic', label: 'Traffic', glyph: 'car', tone: 'blue' },
  { to: '/city/traffic', label: 'Parking', glyph: 'parking', tone: 'teal' },
];

/** Pins sharing a neighbourhood fan out so they stay tappable. */
const FAN: Array<[number, number]> = [
  [0, 0],
  [48, -4],
  [-46, 10],
  [8, 50],
  [52, 44],
];

function todayLabel() {
  const d = new Date();
  return `${d.toLocaleDateString('en-GB', { weekday: 'long' })}, ${d.getDate()} ${d.toLocaleDateString('en-GB', { month: 'short' })}`;
}

export default function City() {
  const t = useT();
  const navigate = useNavigate();
  const pulse = useLiveCity();
  const { settings } = useSettings();
  const { data } = useAppData();
  const alerts = visibleAlerts(settings, data);
  const w = pulse.weather;
  const band = aqiBand(pulse.aqi.value);
  const trend = [...pulse.aqi.trend.slice(0, -1), pulse.aqi.value];
  const bills = SERVICES.filter((s) => s.due && s.amount);
  const billTotal = bills.reduce((sum, s) => sum + (s.amount ?? 0), 0);
  const civic = pulse.civic;
  const homeId = settings.location.home;
  const home = NEIGHBOURHOOD_POS[homeId] ?? NEIGHBOURHOOD_POS.bodakdev;
  const roads = useMemo(() => roadLevels(pulse.corridors), [pulse.corridors]);
  const heat = useMemo(() => heatSpots(pulse.corridors), [pulse.corridors]);
  // One-line route tip: to work if set, otherwise to Navrangpura.
  const tripFrom = ROUTABLE.includes(homeId) ? homeId : 'bodakdev';
  const tripTo = ROUTABLE.includes(settings.location.work) && settings.location.work !== tripFrom ? settings.location.work : tripFrom === 'navrangpura' ? 'bodakdev' : 'navrangpura';
  const tip = useMemo(
    () => planRoutes(tripFrom, tripTo, NEIGHBOURHOOD_POS[tripFrom], NEIGHBOURHOOD_POS[tripTo], pulse.corridors)[0],
    [tripFrom, tripTo, pulse.corridors],
  );

  // City updates on the map: each sits on its first mapped area, fanned out when they share one
  // (and kept off the "you are here" dot).
  const pins: MapPin[] = useMemo(() => {
    const used: Record<string, number> = { [homeId]: 0 };
    return alerts.flatMap((a) => {
      const area = a.areas.find((x) => NEIGHBOURHOOD_POS[x]);
      if (!area) return [];
      const n = (used[area] = (used[area] ?? -1) + 1);
      const [dx, dy] = FAN[n % FAN.length];
      const kind = ALERT_KIND_META[a.kind];
      return [
        {
          id: a.id,
          x: NEIGHBOURHOOD_POS[area][0] + dx,
          y: NEIGHBOURHOOD_POS[area][1] + dy,
          glyph: kind.glyph,
          title: a.title,
          meta: `${kind.label} · ${a.ago}`,
          to: `/city/alerts/${a.id}`,
        },
      ];
    });
  }, [alerts, homeId]);

  return (
    <main className="page city">
      <header className="city-head">
        <div className="stack" style={{ gap: 4, minWidth: 0 }}>
          <span className="eyebrow muted">{t('city.eyebrow', { city: settings.location.city })}</span>
          <h1 className="hero-title">{t('city.headline')}</h1>
        </div>
        <Link to="/settings/alerts" className="icon-btn" aria-label="Alert settings">
          <SlidersGlyph size={19} />
        </Link>
      </header>
      <div className="city-status">
        <span className="row" style={{ gap: 6 }}>
          <PinGlyph size={14} style={{ color: 'var(--accent)' }} />
          {neighbourhoodName(homeId)}, {settings.location.city}
        </span>
        {pulse.paused ? (
          <Link to="/settings/data" className="city-live city-live--paused">
            <span className="live-dot live-dot--muted" />
            {t('city.paused')}
          </Link>
        ) : (
          <span className="city-live">
            <span className="live-dot" />
            {t('city.live')} · {t('city.every')}
          </span>
        )}
      </div>

      <section className="city-today" aria-labelledby="city-weather">
        <div className={`city-today__photo${w.condition === 'night' ? ' is-night' : ''}`}>
          <img src={scenePhoto('promenade')} alt="" />
          <span className="photo-pill" style={{ top: 12, left: 16 }}>
            {todayLabel()}
          </span>
          <div className="city-today__over">
            <span className="city-today__temp num">{w.temp}°</span>
            <span className="stack grow" style={{ gap: 2, minWidth: 0 }}>
              <h2 id="city-weather" className="city-today__cond">
                {CONDITION_LABEL[w.condition]}
              </h2>
              <span className="city-today__sub">
                Feels {w.feelsLike}° · H {w.high}° · L {w.low}°
              </span>
            </span>
            <span className="city-today__glyph">
              <WeatherGlyph condition={w.condition} size={30} title={CONDITION_LABEL[w.condition]} />
            </span>
          </div>
        </div>
        <div className="city-today__body">
          <p className="body-sm" style={{ margin: 0 }}>
            {w.summary}
          </p>
          <dl className="city-today__stats">
            <div>
              <dt>Humidity</dt>
              <dd>{w.humidity}%</dd>
            </div>
            <div>
              <dt>Wind</dt>
              <dd>{w.windKmh} km/h</dd>
            </div>
            <div className={w.uv >= 6 ? 'is-warn' : ''}>
              <dt>UV</dt>
              <dd>
                {w.uv}
                {w.uv >= 6 ? ' · High' : ''}
              </dd>
            </div>
            <div>
              <dt>Sunset</dt>
              <dd>{w.sunset}</dd>
            </div>
          </dl>
          <div className="city-hours" role="list" aria-label={t('city.hourly')}>
            {w.hourly.map((h, i) => (
              <div key={h.hour} role="listitem" className={`city-hour${i === 0 ? ' is-now' : ''}`}>
                <span className="city-hour__time">{i === 0 ? 'Now' : h.hour}</span>
                <WeatherGlyph condition={h.condition} size={22} live={false} title={CONDITION_LABEL[h.condition]} />
                <span className="num">{h.temp}°</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <nav aria-label={t('city.quick')} className="city-quick">
        {QUICK.map((q) => (
          <Link key={q.label} to={q.to} className={`city-quick__item glyph-host tone-${q.tone}`}>
            <span className="city-quick__icon">
              <NamedGlyph name={q.glyph} size={21} />
            </span>
            <span>{q.label}</span>
          </Link>
        ))}
      </nav>

      <section className="section" aria-labelledby="city-map">
        <SectionHead id="city-map" title={t('city.aroundYou')} to="/city/traffic" linkLabel={t('city.transit')} />
        <CityMap
          className="city-map--bleed"
          pins={pins}
          home={home}
          radiusKm={settings.alerts.radiusKm}
          areaLabel={t('city.nearYou')}
          onArea={() => navigate('/settings/location')}
          heat={heat}
          roads={roads}
        />
        <div className="traffic-legend" aria-label="Traffic key">
          {([0, 1, 2, 3] as const).map((l) => (
            <span key={l}>
              <i style={{ background: TRAFFIC_COLOR[l] }} />
              {t(['city.legend.free', 'city.legend.moderate', 'city.legend.heavy', 'city.legend.jam'][l])}
            </span>
          ))}
        </div>
        {tip ? (
          <Link to="/city/traffic" className="list-row city-tip glyph-host">
            <span className="city-card__icon city-card__icon--sm tone-violet">
              <NamedGlyph name="route" size={18} />
            </span>
            <span className="list-row__body">
              <span className="list-row__meta">{t('city.bestWay', { place: neighbourhoodName(tripTo) })}</span>
              <span className="list-row__title">
                via {tip.via} · {tip.minutes} min
              </span>
            </span>
            <ChevronRightGlyph size={16} style={{ color: 'var(--muted)' }} />
          </Link>
        ) : null}
      </section>

      <section className="section" aria-labelledby="city-alerts">
        <SectionHead id="city-alerts" title={`${t('city.updatesTitle')} · ${alerts.length}`} to="/city/alerts" />
        {alerts.length === 0 ? (
          <p className="notice tone-mint">All quiet near you. No alerts match your settings right now.</p>
        ) : (
          <div className="list">
            {alerts.slice(0, 3).map((a) => (
              <AlertRow key={a.id} alert={a} />
            ))}
          </div>
        )}
      </section>

      <section className="section city-card" aria-labelledby="city-air">
        <div className="section__head">
          <h2 id="city-air" className="section__title">
            {t('city.air')}
          </h2>
          <span className="meta truncate">{pulse.aqi.station}</span>
        </div>
        <div className="city-air">
          <AqiDial value={pulse.aqi.value} size={112} />
          <div className="stack" style={{ gap: 8, minWidth: 0 }}>
            <span className="badge" style={{ alignSelf: 'flex-start', background: 'color-mix(in srgb, ' + band.color + ' 22%, var(--surface))', color: 'var(--ink)' }}>
              {band.label} · {pulse.aqi.dominant}
            </span>
            <p className="body-sm" style={{ margin: 0 }}>
              {pulse.aqi.advice}
            </p>
          </div>
        </div>
        <div className="city-air__trend">
          <span className="stack" style={{ gap: 2 }}>
            <span className="eyebrow muted">Last 7 hours</span>
            <span className="strong">
              {trend[0]} → {trend[trend.length - 1]}
            </span>
          </span>
          <Sparkline values={trend} label={`AQI over the last 7 hours, from ${trend[0]} to ${trend[trend.length - 1]}`} width={150} height={36} />
        </div>
      </section>

      <section className="section" aria-labelledby="city-utilities">
        <SectionHead id="city-utilities" title={t('city.utilities')} />
        <div className="list">
          {pulse.water.map((x) => (
            <WaterRow key={x.ward} w={x} />
          ))}
          {pulse.power.map((p) => (
            <PowerRow key={p.area} p={p} />
          ))}
        </div>
      </section>

      <section className="city-ward" aria-labelledby="city-ward">
        <div className="row" style={{ gap: 10 }}>
          <span className="city-ward__icon">
            <NamedGlyph name="report" size={20} live />
          </span>
          <div className="stack grow" style={{ gap: 2 }}>
            <span className="eyebrow city-ward__eyebrow">{t('city.ward')}</span>
            <h2 id="city-ward" className="city-ward__title">
              {civic.ward}
            </h2>
          </div>
        </div>
        <div className="stack" style={{ gap: 8 }}>
          <div className="row row--between" style={{ alignItems: 'baseline' }}>
            <span className="city-ward__big">{civic.resolvedPct}%</span>
            <span className="city-ward__muted">{civic.resolvedThisWeek} fixed this week</span>
          </div>
          <div className="city-ward__bar" role="img" aria-label={`${civic.resolvedPct}% of reports resolved`}>
            <span style={{ width: `${civic.resolvedPct}%` }} />
          </div>
          <span className="city-ward__muted">of reports resolved by the ward team</span>
        </div>
        <div className="city-ward__stats">
          <div className="city-ward__stat">
            <span className="num">{civic.avgDays} days</span>
            <span>average fix time</span>
          </div>
          <div className="city-ward__stat">
            <span className="num">{civic.open}</span>
            <span>open reports</span>
          </div>
        </div>
        <div className="grid-2">
          <Link to="/city/report" className="btn btn--sm btn--lime">
            {t('city.report')}
          </Link>
          <Link to="/city/reports" className="btn btn--sm city-ward__ghost">
            {t('city.trackReports')}
          </Link>
        </div>
      </section>

      <section className="section" aria-labelledby="city-parking">
        <SectionHead id="city-parking" title={t('city.parking')} to="/city/traffic" />
        <div className="list">
          {pulse.parking.map((p) => (
            <ParkingRow key={p.id} p={p} />
          ))}
        </div>
      </section>

      {bills.length ? (
        <Link to="/city/services" className="list-row city-bills glyph-host">
          <span className="city-card__icon tone-violet">
            <NamedGlyph name="bill" size={20} />
          </span>
          <span className="stack grow" style={{ gap: 2, minWidth: 0 }}>
            <span className="strong">
              {bills.length} {t('city.bills').toLowerCase()} · {rupees(billTotal)}
            </span>
            <span className="meta">{bills.map((b) => `${b.name} ${b.due?.toLowerCase()}`).join(' · ')}</span>
          </span>
          <ChevronRightGlyph size={18} style={{ color: 'var(--accent)' }} />
        </Link>
      ) : null}
    </main>
  );
}
