import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar } from '../../components/cards';
import { EmptyState, PageHeader, Sheet } from '../../components/ui';
import { ALERT_KIND_META } from '../../data/city';
import { PEOPLE, TOGGLEABLE_SOURCES, neighbourhoodName } from '../../data/core';
import { LANGUAGES, useT } from '../../i18n';
import { ChevronRightGlyph, LogoutGlyph, RefreshGlyph, SearchGlyph } from '../../icons';
import { useAppData } from '../../state/appData';
import { useSettings, type Settings } from '../../state/settings';
import { useToast } from '../../state/toast';
import { APP_VERSION, GROUPS, SECTIONS, type SectionId } from './meta';
import { SettingLink } from './parts';

function trailFor(id: SectionId, s: Settings, t: (k: string, v?: Record<string, string | number>) => string): string {
  switch (id) {
    case 'account':
      return s.profile.verifiedResident ? t('common.verified') : '';
    case 'location':
      return neighbourhoodName(s.location.home);
    case 'notifications':
      return s.notifications.push ? t('settings.on') : t('settings.off');
    case 'alerts': {
      const on = (Object.keys(ALERT_KIND_META) as Array<keyof typeof ALERT_KIND_META>).filter((k) => s.alerts.kinds[k]).length;
      return `${on}/8`;
    }
    case 'appearance':
      return t(`settings.theme.${s.appearance.theme}`);
    case 'language':
      return LANGUAGES.find((l) => l.id === s.language)?.native ?? '';
    case 'accessibility': {
      const on = Object.values(s.accessibility).filter(Boolean).length;
      return on ? `${on} ${t('settings.on').toLowerCase()}` : '';
    }
    case 'privacy':
      return t(
        s.privacy.profileVisibility === 'everyone' ? 'settings.privacy.everyone' : s.privacy.profileVisibility === 'neighbours' ? 'settings.privacy.neighbours' : 'settings.privacy.onlyMe',
      );
    case 'sources': {
      const on = TOGGLEABLE_SOURCES.filter((id2) => s.sources.enabled[id2 as keyof Settings['sources']['enabled']]).length;
      return `${on}/${TOGGLEABLE_SOURCES.length}`;
    }
    case 'data':
      return s.data.dataSaver ? t('settings.data.saver') : '';
    case 'safety':
      return String(s.safety.contacts.filter((c) => c.name || c.phone).length);
    case 'about':
      return APP_VERSION;
    default:
      return '';
  }
}

export default function SettingsHome() {
  const t = useT();
  const navigate = useNavigate();
  const toast = useToast();
  const { settings, update } = useSettings();
  const app = useAppData();
  const [q, setQ] = useState('');
  const [sheet, setSheet] = useState<'reset' | 'signout' | null>(null);

  const query = q.trim().toLowerCase();
  const matches = SECTIONS.filter((s) => !query || `${t(s.key)} ${s.keywords}`.toLowerCase().includes(query));
  const me = { ...PEOPLE.me, name: settings.profile.name, initials: (settings.profile.name.trim()[0] ?? 'N').toUpperCase(), verified: settings.profile.verifiedResident };

  return (
    <>
      <PageHeader title={t('settings.title')} fallback="/me" />
      <main className="page page--with-header settings-page">
        <Link to="/settings/account" className="card row set-profile-card" aria-label={`${settings.profile.name}, ${t('settings.account')}`}>
          <Avatar who={me} size={52} />
          <span className="stack grow" style={{ gap: 2 }}>
            <span className="display strong" style={{ fontSize: '1.0625rem' }}>
              {settings.profile.name}
            </span>
            <span className="meta">
              @{settings.profile.handle} · {neighbourhoodName(settings.location.home)}, {settings.location.city}
            </span>
          </span>
          <ChevronRightGlyph size={18} style={{ color: 'var(--muted)' }} />
        </Link>

        <label className="search-field" htmlFor="settings-search">
          <SearchGlyph size={18} />
          <span className="sr-only">{t('settings.search')}</span>
          <input id="settings-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('settings.search')} autoComplete="off" />
        </label>

        {matches.length === 0 ? <EmptyState glyph="question" title={t('settings.noMatch', { q })} /> : null}

        {GROUPS.map((g) => {
          const rows = matches.filter((s) => s.group === g.id);
          if (!rows.length) return null;
          return (
            <section key={g.id} className="set-group" aria-labelledby={`grp-${g.id}`}>
              <h2 className="set-group__title" id={`grp-${g.id}`}>
                {t(g.key)}
              </h2>
              <div className="list">
                {rows.map((s) => {
                  const trail = trailFor(s.id, settings, t);
                  return <SettingLink key={s.id} to={`/settings/${s.id}`} G={s.G} tone={s.tone} title={t(s.key)} trail={trail ? <span className="set-trail">{trail}</span> : undefined} />;
                })}
              </div>
            </section>
          );
        })}

        {!query ? (
          <div className="stack">
            <button type="button" className="btn btn--outline btn--block" onClick={() => setSheet('reset')}>
              <RefreshGlyph size={18} />
              {t('settings.resetData')}
            </button>
            <button type="button" className="btn btn--danger btn--block" onClick={() => setSheet('signout')}>
              <LogoutGlyph size={18} />
              {t('settings.signOut')}
            </button>
            <p className="meta" style={{ textAlign: 'center', marginTop: 6 }}>
              {t('settings.footer', { v: APP_VERSION })}
            </p>
          </div>
        ) : null}
      </main>

      <Sheet open={sheet === 'reset'} onClose={() => setSheet(null)} title={t('settings.resetData')}>
        <p className="body-sm">{t('settings.resetDataBody')}</p>
        <div className="grid-2">
          <button type="button" className="btn btn--outline" onClick={() => setSheet(null)}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              app.reset();
              setSheet(null);
              toast('Sample data restored');
            }}
          >
            {t('settings.resetData')}
          </button>
        </div>
      </Sheet>

      <Sheet open={sheet === 'signout'} onClose={() => setSheet(null)} title={t('settings.signOutTitle')}>
        <p className="body-sm">{t('settings.signOutBody')}</p>
        <div className="grid-2">
          <button type="button" className="btn btn--outline" onClick={() => setSheet(null)}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => {
              setSheet(null);
              update('onboarded', false);
              navigate('/onboarding', { replace: true });
            }}
          >
            {t('settings.signOut')}
          </button>
        </div>
      </Sheet>
    </>
  );
}
