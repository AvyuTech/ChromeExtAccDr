import { Link, useParams } from 'react-router-dom';
import { ShareButton, Votes } from '../components/cards';
import { findReport, issueMeta, reportScore, Timeline, type TimelineItem } from '../components/city';
import { EmptyState, PageHeader } from '../components/ui';
import { REPORT_STEPS } from '../data/city';
import { useT } from '../i18n';
import { BellGlyph, ChatGlyph, CheckGlyph, ChevronRightGlyph, NamedGlyph, StepRing } from '../icons';
import { useAppData } from '../state/appData';
import { useToast } from '../state/toast';

/** "Confirmed fixed" is kept in the plusOned list under this prefix so it persists with other activity. */
const FIXED = 'fixed:';

export default function ReportDetail() {
  const { id = '' } = useParams();
  const t = useT();
  const toast = useToast();
  const { data, toggle, has } = useAppData();
  const report = findReport(id, data);

  if (!report) {
    return (
      <>
        <PageHeader title={t('city.reports')} fallback="/city/reports" />
        <main className="page page--with-header">
          <EmptyState
            glyph="report"
            title="Report not found"
            body="It may have been merged with another report."
            action={
              <Link to="/city/reports" className="btn btn--soft btn--sm">
                All reports
              </Link>
            }
          />
        </main>
      </>
    );
  }

  const meta = issueMeta(report.category);
  const following = has('followedReports', report.id);
  const confirmedFixed = has('plusOned', FIXED + report.id);
  const resolved = report.status === 4;
  const count = reportScore(report, data);

  const items: TimelineItem[] = REPORT_STEPS.map((label, i) => {
    const entry = report.timeline.find((e) => e.status === i);
    const state: TimelineItem['state'] = i <= report.status ? 'done' : i === report.status + 1 ? 'current' : 'pending';
    return { title: entry?.label ?? label, time: entry?.time, note: entry?.note ?? (state === 'current' ? 'Next step' : undefined), state };
  });

  return (
    <>
      <PageHeader title={meta.label} fallback="/city/reports" sub={report.ticket} actions={<ShareButton title={report.title} path={`/city/reports/${report.id}`} />} />
      <main className="page page--with-header">
        <section className="report-hero" aria-labelledby="report-title">
          <StepRing step={report.status} size={64}>
            <span className={`report-hero__icon tone-${meta.tone}`}>
              <NamedGlyph name={meta.glyph} size={22} live={!resolved} />
            </span>
          </StepRing>
          <span className="stack grow" style={{ gap: 4, minWidth: 0 }}>
            <span className={`badge badge--sm ${resolved ? 'tone-mint' : report.status >= 2 ? 'tone-violet' : 'tone-amber'}`} style={{ alignSelf: 'flex-start' }}>
              {resolved ? <CheckGlyph size={11} /> : null}
              {REPORT_STEPS[report.status]} · step {report.status + 1} of {REPORT_STEPS.length}
            </span>
            <h2 id="report-title" className="report-hero__title">
              {report.title}
            </h2>
            <span className="meta">
              {report.landmark} · {report.area}
              {report.ward !== report.area ? ` · ${report.ward} ward` : ''} · {report.createdAgo}
            </span>
          </span>
        </section>

        <p className="body">{report.description}</p>

        {report.status === 0 && report.mine ? (
          <div className="notice tone-amber">
            <NamedGlyph name="users" size={18} />
            <span>Waiting for neighbours to verify. Share it with your society group to speed things up.</span>
          </div>
        ) : null}

        <div className="report-votes">
          <Votes id={report.id} up={report.plusOnes} />
          <span className="meta grow">
            {report.mine ? `${count} ${count === 1 ? 'vote' : 'votes'} from neighbours` : 'Vote up if it affects you too, down if it’s not a problem'}
          </span>
          <button
            type="button"
            className="btn btn--sm btn--outline"
            aria-pressed={following}
            onClick={() => {
              const on = toggle('followedReports', report.id);
              toast(on ? 'You will get updates on this report' : 'Stopped following');
            }}
          >
            <BellGlyph size={16} active={following} />
            {following ? 'Following' : 'Follow'}
          </button>
        </div>

        {resolved ? (
          <button
            type="button"
            className={`btn btn--sm btn--block ${confirmedFixed ? 'btn--secondary' : 'btn--mint'}`}
            aria-pressed={confirmedFixed}
            onClick={() => {
              const on = toggle('plusOned', FIXED + report.id);
              toast(on ? 'Thanks for confirming the fix' : 'Confirmation removed');
            }}
          >
            <CheckGlyph size={18} />
            {confirmedFixed ? 'You confirmed it is fixed' : "Confirm it's fixed"}
          </button>
        ) : null}

        <section className="section" aria-labelledby="report-progress">
          <h2 id="report-progress" className="section__title">
            {t('city.timeline')}
          </h2>
          <Timeline label={t('city.timeline')} items={items} />
        </section>

        <Link to="/messages/c-ward" className="list-row report-ward-link">
          <span className="city-card__icon city-card__icon--sm tone-blue">
            <ChatGlyph size={18} />
          </span>
          <span className="list-row__body">
            <span className="list-row__title">Message the ward desk</span>
            <span className="list-row__meta">Ask about {report.ticket}</span>
          </span>
          <ChevronRightGlyph size={16} style={{ color: 'var(--muted)' }} />
        </Link>
      </main>
    </>
  );
}
