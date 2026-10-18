import { useState } from 'react';
import { Link } from 'react-router-dom';
import { allReports, issueMeta, plusOneCount } from '../components/city';
import { EmptyState, PageHeader } from '../components/ui';
import { REPORT_STEPS } from '../data/city';
import { neighbourhoodName } from '../data/core';
import type { CivicReport } from '../data/types';
import { useT } from '../i18n';
import { NamedGlyph, PlusGlyph, StepRing } from '../icons';
import { useAppData } from '../state/appData';
import { useLiveCity } from '../state/live';
import { useSettings } from '../state/settings';

type TabId = 'mine' | 'near';

function ReportRow({ r, count }: { r: CivicReport; count: number }) {
  const meta = issueMeta(r.category);
  const resolved = r.status === 4;
  return (
    <Link to={`/city/reports/${r.id}`} className="list-row glyph-host">
      <StepRing step={r.status} size={48}>
        <span className={`tone-${meta.tone}`} style={{ color: 'var(--tone-ink)', display: 'inline-flex' }}>
          <NamedGlyph name={meta.glyph} size={22} duo />
        </span>
      </StepRing>
      <span className="list-row__body">
        <span className="list-row__title">{r.title}</span>
        <span className="list-row__meta">
          {r.area} · {r.createdAgo}
        </span>
        <span className={`badge badge--sm ${resolved ? 'tone-mint' : r.status >= 2 ? 'tone-violet' : 'tone-amber'}`} style={{ alignSelf: 'flex-start', marginTop: 2 }}>
          {REPORT_STEPS[r.status]}
        </span>
      </span>
      <span className="city-trail">
        <span className="num" style={{ fontSize: '0.9375rem' }}>
          +{count}
        </span>
        <span className="meta">neighbours</span>
      </span>
    </Link>
  );
}

export default function Reports() {
  const t = useT();
  const { data } = useAppData();
  const { settings } = useSettings();
  const pulse = useLiveCity();
  const [tab, setTab] = useState<TabId>('mine');
  const reports = allReports(data);
  const mine = reports.filter((r) => r.mine);
  const near = reports.filter((r) => !r.mine);
  const list = tab === 'mine' ? mine : near;
  const civic = pulse.civic;

  return (
    <>
      <PageHeader
        title={t('city.reports')}
        fallback="/city"
        sub={`${neighbourhoodName(settings.location.home)} and around`}
        actions={
          <Link to="/city/report" className="icon-btn icon-btn--accent" aria-label={t('city.report')}>
            <PlusGlyph size={20} />
          </Link>
        }
      />
      <main className="page page--with-header">
        <section className="card stack" aria-label={`${civic.ward} ward`} style={{ gap: 10 }}>
          <div className="row row--between">
            <span className="strong">{civic.ward} ward</span>
            <span className="meta">{civic.resolvedThisWeek} fixed this week</span>
          </div>
          <div className="grid-3">
            <div className="city-stat">
              <span className="num" style={{ fontSize: '1.125rem', color: 'var(--mint-ink)' }}>
                {civic.resolvedPct}%
              </span>
              <span className="meta">resolved</span>
            </div>
            <div className="city-stat">
              <span className="num" style={{ fontSize: '1.125rem' }}>
                {civic.avgDays}d
              </span>
              <span className="meta">avg. fix</span>
            </div>
            <div className="city-stat">
              <span className="num" style={{ fontSize: '1.125rem' }}>
                {civic.open}
              </span>
              <span className="meta">open</span>
            </div>
          </div>
        </section>

        <div className="tabs" role="tablist" aria-label="Reports">
          <button type="button" role="tab" className="tab" aria-selected={tab === 'mine'} onClick={() => setTab('mine')}>
            {t('city.mine')} · {mine.length}
          </button>
          <button type="button" role="tab" className="tab" aria-selected={tab === 'near'} onClick={() => setTab('near')}>
            {t('city.nearMe')} · {near.length}
          </button>
        </div>

        {list.length === 0 ? (
          <EmptyState
            glyph="report"
            title="No reports yet"
            body="Spotted a pothole, garbage or a dark street? Report it in under a minute."
            action={
              <Link to="/city/report" className="btn btn--primary btn--sm">
                {t('city.report')}
              </Link>
            }
          />
        ) : (
          <div className="list">
            {list.map((r) => (
              <ReportRow key={r.id} r={r} count={plusOneCount(r, data)} />
            ))}
          </div>
        )}

        <Link to="/city/report" className="btn btn--soft btn--block">
          {t('city.report')}
        </Link>
      </main>
    </>
  );
}
