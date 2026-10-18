import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertRow } from '../components/city';
import { EmptyState, PageHeader } from '../components/ui';
import { ALERT_KIND_META, ALERTS } from '../data/city';
import type { AlertKind, CityAlert } from '../data/types';
import { useT } from '../i18n';
import { NamedGlyph, SlidersGlyph } from '../icons';
import { visibleAlerts } from '../lib/selectors';
import { useAppData } from '../state/appData';
import { useSettings } from '../state/settings';

const SEVERITIES: Array<{ id: CityAlert['severity']; one: string; many: string }> = [
  { id: 'critical', one: 'critical', many: 'critical' },
  { id: 'warning', one: 'warning', many: 'warnings' },
  { id: 'advisory', one: 'advisory', many: 'advisories' },
  { id: 'info', one: 'for info', many: 'for info' },
];

export default function Alerts() {
  const t = useT();
  const { settings } = useSettings();
  const { data, remove } = useAppData();
  const [kind, setKind] = useState<AlertKind | 'all'>('all');

  const visible = visibleAlerts(settings, data);
  const shown = kind === 'all' ? visible : visible.filter((a) => a.kind === kind);
  // Only kinds with something to show; public transport is not covered.
  const kinds = (Object.keys(ALERT_KIND_META) as AlertKind[]).filter((k) => settings.alerts.kinds[k] && visible.some((a) => a.kind === k));
  const dismissed = ALERTS.filter((a) => a.active && data.dismissedAlerts.includes(a.id));
  const hidden = ALERTS.filter((a) => a.active && !data.dismissedAlerts.includes(a.id)).length - visible.length;

  return (
    <>
      <PageHeader
        title={t('city.alerts')}
        fallback="/city"
        sub={`${visible.length} active near you`}
        actions={
          <Link to="/settings/alerts" className="icon-btn icon-btn--ghost" aria-label="Alert settings">
            <SlidersGlyph size={19} />
          </Link>
        }
      />
      <main className="page page--with-header">
        {visible.length ? (
          <div className="alerts-summary" aria-label="Alerts by severity">
            {SEVERITIES.map((sv) => {
              const n = visible.filter((a) => a.severity === sv.id).length;
              return n ? (
                <span key={sv.id} className={`alerts-summary__item is-${sv.id}`}>
                  <span className="alerts-summary__dot" aria-hidden="true" />
                  <b>{n}</b> {n === 1 ? sv.one : sv.many}
                </span>
              ) : null;
            })}
          </div>
        ) : null}

        <div className="chip-row" role="group" aria-label="Filter alerts by type">
          <button type="button" className="chip city-chip" aria-pressed={kind === 'all'} onClick={() => setKind('all')}>
            {t('city.all')} {visible.length}
          </button>
          {kinds.map((k) => {
            const n = visible.filter((a) => a.kind === k).length;
            return (
              <button key={k} type="button" className="chip city-chip" aria-pressed={kind === k} onClick={() => setKind(k)}>
                <NamedGlyph name={ALERT_KIND_META[k].glyph} size={15} />
                {ALERT_KIND_META[k].label}
                {n ? <span className="meta" style={{ color: 'inherit', opacity: 0.75 }}>{n}</span> : null}
              </button>
            );
          })}
        </div>

        {shown.length === 0 ? (
          <EmptyState
            glyph="alert"
            title="All quiet here"
            body={kind === 'all' ? 'No alerts match your settings right now.' : `No ${ALERT_KIND_META[kind].label.toLowerCase()} alerts near you.`}
          />
        ) : (
          <div className="list">
            {shown.map((a) => (
              <AlertRow key={a.id} alert={a} />
            ))}
          </div>
        )}

        {hidden > 0 ? (
          <Link to="/settings/alerts" className="notice" style={{ textDecoration: 'none' }}>
            <SlidersGlyph size={16} />
            <span className="grow">
              {hidden} {hidden === 1 ? 'alert is' : 'alerts are'} hidden by your alert settings (type, severity or area). <b>Change settings</b>
            </span>
          </Link>
        ) : null}

        {dismissed.length > 0 ? (
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            style={{ alignSelf: 'center', color: 'var(--accent)' }}
            onClick={() => dismissed.forEach((a) => remove('dismissedAlerts', a.id))}
          >
            Show {dismissed.length} dismissed {dismissed.length === 1 ? 'alert' : 'alerts'}
          </button>
        ) : null}

        <p className="meta" style={{ textAlign: 'center' }}>
          Alerts come from official feeds and are cross-checked with neighbour reports.
        </p>
      </main>
    </>
  );
}
