import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CorridorRow, DepartureRow, ParkingRow, shiftClock } from '../components/city';
import { PageHeader, SectionHead, Segmented, Tile } from '../components/ui';
import { BRTS_RIDE_MIN, LAST_MILE_WALK_MIN, METRO_RIDE_MIN, MODE_META, PARK_AND_WALK_MIN, WALK_ONLY_MIN } from '../data/cityExtra';
import { neighbourhoodName } from '../data/core';
import { ALERTS } from '../data/city';
import type { TransitArrival } from '../data/types';
import { useT } from '../i18n';
import { NamedGlyph, RouteGlyph } from '../icons';
import { useLiveCity } from '../state/live';
import { useSettings, type CommuteMode } from '../state/settings';

type ModeFilter = 'all' | TransitArrival['mode'];

export default function Transit() {
  const t = useT();
  const pulse = useLiveCity();
  const { settings } = useSettings();
  const [filter, setFilter] = useState<ModeFilter>('all');
  const loc = settings.location;

  const corridor = (id: string) => pulse.corridors.find((c) => c.id === id);
  const sg = corridor('sg');
  const local = corridor('judges');
  const drive = (sg?.minutes ?? 0) + (local?.minutes ?? 0);
  const usualDrive = (sg?.usual ?? 0) + (local?.usual ?? 0);
  const nextOf = (mode: TransitArrival['mode']) => [...pulse.arrivals].filter((a) => a.mode === mode).sort((a, b) => a.minutes - b.minutes)[0];
  const metro = nextOf('metro');
  const brts = nextOf('brts');

  const trip: Record<CommuteMode, { now: number; usual: number }> = {
    car: { now: drive + PARK_AND_WALK_MIN, usual: usualDrive + PARK_AND_WALK_MIN },
    'two-wheeler': { now: drive, usual: usualDrive },
    auto: { now: drive + 3, usual: usualDrive + 3 },
    metro: {
      now: (metro?.walkMin ?? 9) + (metro?.minutes ?? 4) + METRO_RIDE_MIN + LAST_MILE_WALK_MIN,
      usual: (metro?.walkMin ?? 9) + 4 + METRO_RIDE_MIN + LAST_MILE_WALK_MIN,
    },
    brts: {
      now: (brts?.walkMin ?? 12) + (brts?.minutes ?? 5) + BRTS_RIDE_MIN + LAST_MILE_WALK_MIN,
      usual: (brts?.walkMin ?? 12) + 5 + BRTS_RIDE_MIN + LAST_MILE_WALK_MIN,
    },
    walk: { now: WALK_ONLY_MIN, usual: WALK_ONLY_MIN },
  };

  const mode = MODE_META[loc.commuteMode];
  const mine = trip[loc.commuteMode];
  const delay = mine.now - mine.usual;
  const commuteAlert = ALERTS.find((a) => a.active && a.affectsCommute && settings.alerts.kinds[a.kind]);

  const departures = [...pulse.arrivals].filter((a) => filter === 'all' || a.mode === filter).sort((a, b) => a.minutes - b.minutes);
  const others: CommuteMode[] = ['metro', 'auto', 'two-wheeler', 'car', 'brts', 'walk'];

  return (
    <>
      <PageHeader title={t('city.transit')} fallback="/city" />
      <main className="page page--with-header">
        <section className="card card--accent stack" aria-labelledby="commute-title" style={{ gap: 12 }}>
          <div className="row" style={{ gap: 12 }}>
            <Tile glyph={mode.glyph} tone="violet" size="lg" live={!pulse.paused} />
            <div className="stack grow" style={{ gap: 2 }}>
              <span id="commute-title" className="eyebrow muted">
                {t('city.commute')}
              </span>
              {loc.work ? (
                <span className="strong row" style={{ gap: 6 }}>
                  {neighbourhoodName(loc.home)}
                  <RouteGlyph size={16} style={{ color: 'var(--accent)' }} />
                  {neighbourhoodName(loc.work)}
                </span>
              ) : (
                <span className="strong">Add your work area to see your commute</span>
              )}
              <span className="meta">
                {mode.label} · usually leave at {shiftClock(loc.leaveAt, 0)}
              </span>
            </div>
          </div>
          {loc.work ? (
            <>
              <div className="row" style={{ alignItems: 'baseline', gap: 8 }}>
                <span className="num" style={{ fontSize: '2rem', letterSpacing: '-0.03em' }}>
                  {mine.now} min
                </span>
                <span className={`badge ${delay > 0 ? 'tone-amber' : 'tone-mint'}`}>{delay > 0 ? `+${delay} min today` : delay < 0 ? `${-delay} min faster` : 'Usual time'}</span>
              </div>
              <p className="body-sm">
                {delay > 0 ? (
                  <>
                    Leave by <b>{shiftClock(loc.leaveAt, -delay)}</b> to arrive at your usual time ({shiftClock(loc.leaveAt, mine.usual)}).
                  </>
                ) : (
                  <>
                    Leave at <b>{shiftClock(loc.leaveAt, 0)}</b> as usual; you should arrive around {shiftClock(loc.leaveAt, mine.now)}.
                  </>
                )}
              </p>
              {commuteAlert ? (
                <Link to={`/city/alerts/${commuteAlert.id}`} className="notice tone-amber" style={{ textDecoration: 'none' }}>
                  <NamedGlyph name="alert" size={18} />
                  <span>{commuteAlert.title}</span>
                </Link>
              ) : null}
            </>
          ) : null}
          <Link to="/settings/location" className="section__link">
            Change commute
          </Link>
        </section>

        <section className="section" aria-labelledby="dep-title">
          <SectionHead id="dep-title" title={t('city.departures')} />
          <Segmented<ModeFilter>
            label="Filter departures"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: t('city.all') },
              { value: 'metro', label: 'Metro' },
              { value: 'brts', label: 'BRTS' },
              { value: 'amts', label: 'Bus' },
            ]}
          />
          <div className="list" aria-live="polite">
            {departures.length ? (
              departures.map((a) => <DepartureRow key={a.id} a={a} />)
            ) : (
              <p className="list-row meta">Nothing due in the next few minutes.</p>
            )}
          </div>
          <p className="meta">{pulse.paused ? 'Live times paused by Data saver.' : 'Times update live from the metro and bus feeds.'}</p>
        </section>

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

        <section className="section" aria-labelledby="ways-title">
          <SectionHead id="ways-title" title={t('city.otherWays')} />
          <div className="list">
            {others.map((m) => (
              <div key={m} className="list-row glyph-host">
                <Tile glyph={MODE_META[m].glyph} tone={m === loc.commuteMode ? 'violet' : 'blue'} size="sm" />
                <span className="list-row__body">
                  <span className="list-row__title">{MODE_META[m].label}</span>
                  <span className="list-row__meta">{m === 'metro' ? `${metro?.stop ?? 'Nearest station'} · ${metro?.walkMin ?? 9} min walk` : m === 'brts' ? `${brts?.stop ?? 'Nearest stop'} · ${brts?.walkMin ?? 12} min walk` : m === 'walk' ? 'Footpaths most of the way' : 'Door to door'}</span>
                </span>
                <span className="city-trail">
                  <span className="num" style={{ fontSize: '1rem' }}>
                    ~{trip[m].now} min
                  </span>
                  {m === loc.commuteMode ? <span className="badge badge--sm tone-violet">Your usual</span> : null}
                </span>
              </div>
            ))}
          </div>
          <p className="meta">Time estimates for right now. Fares vary, so check them in the app you book with.</p>
        </section>
      </main>
    </>
  );
}
