import { Link, useNavigate, useParams } from 'react-router-dom';
import { ShareButton } from '../components/cards';
import { shiftClock, Timeline } from '../components/city';
import { EmptyState, PageHeader } from '../components/ui';
import { MODE_META } from '../data/cityExtra';
import { ALERT_KIND_META, alertById } from '../data/city';
import { neighbourhoodName, SOURCES } from '../data/core';
import type { CityAlert, Tone } from '../data/types';
import { useT } from '../i18n';
import { AlertGlyph, BellOffGlyph, CheckGlyph, ClockGlyph, CloseGlyph, NamedGlyph, TrustRing } from '../icons';
import { useAppData } from '../state/appData';
import { useSettings } from '../state/settings';
import { useToast } from '../state/toast';

const SEVERITY: Record<CityAlert['severity'], { label: string; tone: Tone }> = {
  info: { label: 'Information', tone: 'teal' },
  advisory: { label: 'Advisory', tone: 'amber' },
  warning: { label: 'Warning', tone: 'peach' },
  critical: { label: 'Critical', tone: 'red' },
};

export default function AlertDetail() {
  const { id = '' } = useParams();
  const t = useT();
  const navigate = useNavigate();
  const toast = useToast();
  const { settings, update } = useSettings();
  const { data, add, remove } = useAppData();
  const alert = alertById(id);

  if (!alert) {
    return (
      <>
        <PageHeader title={t('city.alert')} fallback="/city/alerts" />
        <main className="page page--with-header">
          <EmptyState
            glyph="alert"
            title="This alert has ended"
            body="It may have expired or been withdrawn by the source."
            action={
              <Link to="/city/alerts" className="btn btn--soft btn--sm">
                See current alerts
              </Link>
            }
          />
        </main>
      </>
    );
  }

  const sev = SEVERITY[alert.severity];
  const kind = ALERT_KIND_META[alert.kind];
  const muted = !settings.alerts.kinds[alert.kind];
  const dismissed = data.dismissedAlerts.includes(alert.id);
  const agree = alert.verified ? Math.min(4, 2 + alert.updates.length) : 1;
  const home = settings.location.home;
  const work = settings.location.work;
  const nearHome = alert.areas.includes(home) || alert.areas.includes('all');
  const nearWork = !!work && alert.areas.includes(work);
  const mode = MODE_META[settings.location.commuteMode];

  const toggleMute = () => {
    const before = settings.alerts.kinds;
    update('alerts', { kinds: { ...before, [alert.kind]: muted } });
    toast(muted ? `${kind.label} alerts are back on` : `${kind.label} alerts muted`, {
      label: 'Undo',
      onClick: () => update('alerts', { kinds: before }),
    });
  };

  const dismiss = () => {
    add('dismissedAlerts', alert.id);
    toast('Alert dismissed', { label: 'Undo', onClick: () => remove('dismissedAlerts', alert.id) });
    navigate('/city/alerts');
  };

  return (
    <>
      <PageHeader title={`${kind.label} ${t('city.alert').toLowerCase()}`} fallback="/city/alerts" actions={<ShareButton title={alert.title} path={`/city/alerts/${alert.id}`} />} />
      <main className="page page--with-header">
        <section className={`alert-hero tone-${sev.tone}`} aria-labelledby="alert-title">
          <div className="row" style={{ gap: 12 }}>
            <span className="alert-hero__icon">
              {alert.severity === 'info' ? <NamedGlyph name={kind.glyph} size={28} duo live /> : <AlertGlyph size={28} duo live={alert.active} />}
            </span>
            <span className="stack" style={{ gap: 2 }}>
              <span className="eyebrow" style={{ color: 'var(--tone-ink)' }}>
                {sev.label} · {kind.label}
              </span>
              <span className="meta" style={{ color: 'color-mix(in srgb, var(--tone-ink) 70%, var(--ink))' }}>
                {alert.ago}
              </span>
            </span>
          </div>
          <h2 id="alert-title" style={{ fontSize: '1.3125rem', lineHeight: 1.25 }}>
            {alert.title}
          </h2>
          <span className="row strong" style={{ gap: 6, fontSize: '0.875rem' }}>
            <ClockGlyph size={16} />
            {alert.window}
          </span>
        </section>

        {alert.affectsCommute ? (
          <div className="notice tone-violet">
            <NamedGlyph name={mode.glyph} size={20} duo />
            <span>
              <b>This affects your commute.</b> You usually go from {neighbourhoodName(home)} to {neighbourhoodName(work) || 'work'} by {mode.label.toLowerCase()} around{' '}
              {shiftClock(settings.location.leaveAt, 0)}. Leave about 10 minutes earlier.
            </span>
          </div>
        ) : nearHome || nearWork ? (
          <div className="notice tone-mint">
            <CheckGlyph size={18} />
            <span>
              {alert.areas.includes('all') ? 'Applies across the city.' : `Near your ${nearHome ? 'home' : 'work'}.`} Your usual commute is not affected.
            </span>
          </div>
        ) : null}

        <section className="card stack" style={{ gap: 12 }}>
          <p className="body">{alert.body}</p>
          <div className="row" style={{ gap: 10 }}>
            <TrustRing agree={agree} size={28} />
            <span className="stack" style={{ gap: 1 }}>
              <span className="strong" style={{ fontSize: '0.875rem' }}>
                Source: {SOURCES[alert.source].label}
              </span>
              <span className="meta">{alert.verified ? `${t('common.verified')} · ${agree} sources agree` : 'Not yet verified'}</span>
            </span>
          </div>
          <div className="stack" style={{ gap: 6 }}>
            <span className="eyebrow muted">{t('city.areas')}</span>
            <div className="chip-wrap">
              {alert.areas.map((a) => (
                <span key={a} className={`badge ${a === home || a === work ? 'tone-violet' : ''}`}>
                  {a === 'all' ? 'Whole city' : neighbourhoodName(a)}
                  {a === home ? ' · home' : a === work ? ' · work' : ''}
                </span>
              ))}
            </div>
          </div>
        </section>

        {alert.tips.length ? (
          <section className="section" aria-labelledby="alert-tips">
            <h2 id="alert-tips" className="section__title">
              {t('city.whatToDo')}
            </h2>
            <ul className="list" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {alert.tips.map((tip) => (
                <li key={tip} className="list-row">
                  <span className="tile tone-mint" style={{ width: 32, height: 32, borderRadius: 10 }}>
                    <CheckGlyph size={16} />
                  </span>
                  <span className="body-sm grow">{tip}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {alert.updates.length ? (
          <section className="section" aria-labelledby="alert-updates">
            <h2 id="alert-updates" className="section__title">
              {t('city.updates')}
            </h2>
            <div className="card">
              <Timeline
                label={t('city.updates')}
                items={[...alert.updates].reverse().map((u, i) => ({ title: u.text, time: u.time, state: i === 0 ? 'current' : 'done' }))}
              />
            </div>
          </section>
        ) : null}

        <div className="grid-2">
          <button type="button" className="btn btn--outline" onClick={toggleMute}>
            <BellOffGlyph size={18} />
            {muted ? `Unmute ${kind.label.toLowerCase()}` : 'Mute alerts like this'}
          </button>
          <button type="button" className="btn btn--outline" onClick={dismiss} disabled={dismissed}>
            <CloseGlyph size={18} />
            {dismissed ? 'Dismissed' : 'Dismiss'}
          </button>
        </div>
        <Link to="/settings/alerts" className="section__link" style={{ alignSelf: 'center' }}>
          Choose which alerts you get
        </Link>
      </main>
    </>
  );
}
