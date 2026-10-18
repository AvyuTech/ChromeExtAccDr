import { Link } from 'react-router-dom';
import { AlertCard } from '../components/cards';
import { CONDITION_LABEL, CorridorRow, DepartureRow, ParkingRow, PowerRow, Sparkline, WaterRow } from '../components/city';
import { SectionHead, Tile } from '../components/ui';
import { neighbourhoodName } from '../data/core';
import { SERVICES } from '../data/city';
import type { Tone } from '../data/types';
import { useT } from '../i18n';
import { AqiDial, aqiBand, ChevronRightGlyph, CityGlyph, WeatherGlyph, type GlyphName } from '../icons';
import { rupees } from '../lib/format';
import { visibleAlerts } from '../lib/selectors';
import { useAppData } from '../state/appData';
import { useLiveCity } from '../state/live';
import { useSettings } from '../state/settings';

const QUICK: Array<{ to: string; label: string; glyph: GlyphName; tone: Tone }> = [
  { to: '/city/report', label: 'Report', glyph: 'report', tone: 'amber' },
  { to: '/city/services', label: 'Services', glyph: 'services', tone: 'violet' },
  { to: '/city/safety', label: 'SOS', glyph: 'safety', tone: 'red' },
  { to: '/city/transit', label: 'Transit', glyph: 'transit', tone: 'blue' },
  { to: '/city/transit', label: 'Parking', glyph: 'parking', tone: 'teal' },
];

export default function City() {
  const t = useT();
  const pulse = useLiveCity();
  const { settings } = useSettings();
  const { data } = useAppData();
  const alerts = visibleAlerts(settings, data);
  const w = pulse.weather;
  const band = aqiBand(pulse.aqi.value);
  const trend = [...pulse.aqi.trend.slice(0, -1), pulse.aqi.value];
  const departures = [...pulse.arrivals].sort((a, b) => a.minutes - b.minutes).slice(0, 3);
  const bills = SERVICES.filter((s) => s.due && s.amount);
  const billTotal = bills.reduce((sum, s) => sum + (s.amount ?? 0), 0);
  const civic = pulse.civic;

  return (
    <main className="page">
      <header className="city-hero">
        <div className="stack grow" style={{ gap: 4 }}>
          <span className="meta strong">
            {neighbourhoodName(settings.location.home)}, {settings.location.city}
          </span>
          <h1 className="page-title">{t('city.title')}</h1>
          {pulse.paused ? (
            <Link to="/settings/data" className="row meta strong" style={{ gap: 6, textDecoration: 'none' }}>
              <span className="live-dot live-dot--muted" />
              {t('city.paused')}
            </Link>
          ) : (
            <span className="row meta strong" style={{ gap: 6, color: 'var(--mint-ink)' }}>
              <span className="live-dot" />
              {t('city.live')} · updates every 20 s
            </span>
          )}
        </div>
        <span className="city-hero__glyph">
          <CityGlyph size={52} live={!pulse.paused} title="Live city" />
        </span>
      </header>

      <nav aria-label={t('city.quick')} className="city-quick">
        {QUICK.map((q) => (
          <Link key={q.label} to={q.to} className="city-quick__item glyph-host">
            <Tile glyph={q.glyph} tone={q.tone} size="lg" />
            <span>{q.label}</span>
          </Link>
        ))}
      </nav>

      <section className="section" aria-labelledby="city-alerts">
        <SectionHead id="city-alerts" title={`${t('city.alerts')} · ${alerts.length}`} to="/city/alerts" />
        {alerts.length === 0 ? (
          <p className="notice tone-mint">All quiet near you. No alerts match your settings right now.</p>
        ) : (
          alerts.slice(0, 2).map((a) => <AlertCard key={a.id} alert={a} />)
        )}
      </section>

      <section className="card stack" aria-labelledby="city-weather" style={{ gap: 14 }}>
        <h2 id="city-weather" className="sr-only">
          {t('city.weather')}
        </h2>
        <div className="row" style={{ gap: 14 }}>
          <span className="city-wx">
            <WeatherGlyph condition={w.condition} size={56} title={CONDITION_LABEL[w.condition]} />
          </span>
          <div className="stack grow" style={{ gap: 2 }}>
            <span className="row" style={{ gap: 8, alignItems: 'baseline' }}>
              <span className="num" style={{ fontSize: '2.25rem', letterSpacing: '-0.04em' }}>
                {w.temp}°
              </span>
              <span className="meta">feels {w.feelsLike}°</span>
            </span>
            <span className="strong">{CONDITION_LABEL[w.condition]}</span>
            <span className="meta">{w.summary}</span>
          </div>
        </div>
        <div className="chip-wrap" aria-label="Today">
          <span className="badge">
            H {w.high}° · L {w.low}°
          </span>
          <span className="badge">Humidity {w.humidity}%</span>
          <span className="badge">Wind {w.windKmh} km/h</span>
          <span className={`badge ${w.uv >= 6 ? 'tone-amber' : ''}`}>UV {w.uv}</span>
          <span className="badge">Sunset {w.sunset}</span>
        </div>
        <div className="stack" style={{ gap: 8 }}>
          <span className="eyebrow muted">{t('city.hourly')}</span>
          <div className="hscroll" style={{ gap: 8 }}>
            {w.hourly.map((h) => (
              <div key={h.hour} className="city-hour">
                <span className="meta">{h.hour}</span>
                <WeatherGlyph condition={h.condition} size={26} live={false} title={CONDITION_LABEL[h.condition]} />
                <span className="num" style={{ fontSize: '0.9375rem' }}>
                  {h.temp}°
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card stack" aria-labelledby="city-air" style={{ gap: 12 }}>
        <div className="section__head">
          <h2 id="city-air" className="section__title">
            {t('city.air')}
          </h2>
          <span className="meta">{pulse.aqi.station}</span>
        </div>
        <div className="city-air">
          <AqiDial value={pulse.aqi.value} size={150} />
          <div className="stack" style={{ gap: 6, minWidth: 0 }}>
            <span className="badge" style={{ alignSelf: 'flex-start', background: 'color-mix(in srgb, ' + band.color + ' 22%, var(--surface))', color: 'var(--ink)' }}>
              {band.label} · {pulse.aqi.dominant}
            </span>
            <p className="body-sm">{pulse.aqi.advice}</p>
          </div>
        </div>
        <div className="row row--between" style={{ alignItems: 'flex-end' }}>
          <span className="stack" style={{ gap: 2 }}>
            <span className="eyebrow muted">Last 7 hours</span>
            <span className="meta">
              {trend[0]} → {trend[trend.length - 1]}
            </span>
          </span>
          <Sparkline values={trend} label={`AQI over the last 7 hours, from ${trend[0]} to ${trend[trend.length - 1]}`} width={170} height={44} />
        </div>
      </section>

      <section className="section" aria-labelledby="city-roads">
        <SectionHead id="city-roads" title={t('city.roads')} to="/city/transit" />
        <div className="list">
          {pulse.corridors.map((c) => (
            <CorridorRow key={c.id} c={c} />
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="city-departures">
        <SectionHead id="city-departures" title={t('city.departures')} to="/city/transit" />
        <div className="list">
          {departures.map((a) => (
            <DepartureRow key={a.id} a={a} linkTo="/city/transit" />
          ))}
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

      <section className="card stack" aria-labelledby="city-ward" style={{ gap: 14 }}>
        <div className="row" style={{ gap: 12 }}>
          <Tile glyph="report" tone="amber" size="lg" live />
          <div className="stack grow" style={{ gap: 2 }}>
            <h2 id="city-ward" className="section__title">
              {t('city.ward')}: {civic.ward}
            </h2>
            <span className="meta">Civic issues reported by neighbours</span>
          </div>
        </div>
        <div className="stack" style={{ gap: 6 }}>
          <div className="row row--between">
            <span className="strong">{civic.resolvedPct}% resolved</span>
            <span className="meta">{civic.resolvedThisWeek} fixed this week</span>
          </div>
          <div className="progress" role="img" aria-label={`${civic.resolvedPct}% of reports resolved`}>
            <span style={{ width: `${civic.resolvedPct}%`, background: 'var(--mint-strong)' }} />
          </div>
        </div>
        <div className="grid-2">
          <div className="city-stat">
            <span className="num" style={{ fontSize: '1.25rem' }}>
              {civic.avgDays} days
            </span>
            <span className="meta">average fix time</span>
          </div>
          <div className="city-stat">
            <span className="num" style={{ fontSize: '1.25rem' }}>
              {civic.open}
            </span>
            <span className="meta">open reports</span>
          </div>
        </div>
        <div className="grid-2">
          <Link to="/city/report" className="btn btn--primary">
            {t('city.report')}
          </Link>
          <Link to="/city/reports" className="btn btn--secondary">
            {t('city.trackReports')}
          </Link>
        </div>
      </section>

      <section className="section" aria-labelledby="city-parking">
        <SectionHead id="city-parking" title={t('city.parking')} />
        <div className="list">
          {pulse.parking.map((p) => (
            <ParkingRow key={p.id} p={p} />
          ))}
        </div>
      </section>

      {bills.length ? (
        <Link to="/city/services" className="card row glyph-host" style={{ gap: 12, textDecoration: 'none', color: 'inherit' }}>
          <Tile glyph="bill" tone="violet" size="lg" />
          <span className="stack grow" style={{ gap: 2 }}>
            <span className="strong">
              {bills.length} {t('city.bills').toLowerCase()} · {rupees(billTotal)}
            </span>
            <span className="meta">{bills.map((b) => `${b.name} ${b.due?.toLowerCase()}`).join(' · ')}</span>
          </span>
          <ChevronRightGlyph size={18} style={{ color: 'var(--muted)' }} />
        </Link>
      ) : null}
    </main>
  );
}
