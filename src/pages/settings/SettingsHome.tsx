import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar } from '../../components/cards';
import { EmptyState, PageHeader, Sheet } from '../../components/ui';
import { ALERT_KIND_META } from '../../data/city';
import { PEOPLE, TOGGLEABLE_SOURCES, neighbourhoodName } from '../../data/core';
import { LANGUAGES, useT } from '../../i18n';
import { BellGlyph, CheckGlyph, ChevronRightGlyph, DataGlyph, LogoutGlyph, MoonGlyph, RefreshGlyph, SearchGlyph } from '../../icons';
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
      const kinds = Object.keys(ALERT_KIND_META) as Array<keyof typeof ALERT_KIND_META>;
      return `${kinds.filter((k) => s.alerts.kinds[k]).length}/${kinds.length}`;
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
      return String(s.safety.contacts.filter((c) => c.name || c.phone).length || '');
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
  const matches = SECTIONS.filter((s) => (query ? `${t(s.key)} ${s.keywords}`.toLowerCase().includes(query) : !s.nested));
  const dark = settings.appearance.theme === 'dark';
  const me = { ...PEOPLE.me, name: settings.profile.name, initials: (settings.profile.name.trim()[0] ?? 'N').toUpperCase(), verified: settings.profile.verifiedResident };

  return (
    <>
      <PageHeader title={t('settings.title')} fallback="/me" />
      <main className="page page--with-header settings-page">
        <Link to="/settings/account" className="set-profile" aria-label={`${settings.profile.name}, ${t('settings.account')}`}>
          <Avatar who={me} size={52} ring />
          <span className="stack grow" style={{ gap: 1, minWidth: 0 }}>
            <span className="set-profile__name">{settings.profile.name}</span>
            <span className="meta truncate">
              @{settings.profile.handle} · {neighbourhoodName(settings.location.home)}
            </span>
            <span className="row row--wrap" style={{ gap: 5, marginTop: 4 }}>
              {settings.profile.verifiedResident ? (
                <span className="badge badge--sm" style={{ gap: 4 }}>
                  <CheckGlyph size={12} />
                  {t('settings.home.verified')}
                </span>
              ) : null}
              {PEOPLE.me.badge ? <span className="badge badge--sm">{PEOPLE.me.badge}</span> : null}
            </span>
          </span>
          <ChevronRightGlyph size={18} style={{ color: 'var(--muted)', flexShrink: 0 }} />
        </Link>

        <div className="quick-grid" role="group" aria-label={t('settings.home.quick')}>
          <button type="button" className="quick-tile" aria-pressed={dark} onClick={() => update('appearance', { theme: dark ? 'light' : 'dark' })}>
            <span className="quick-tile__icon">
              <MoonGlyph size={17} active={dark} />
            </span>
            <span className="quick-tile__label">{t('settings.home.darkMode')}</span>
            <span className="quick-tile__state">{dark ? t('settings.on') : t(`settings.theme.${settings.appearance.theme}`)}</span>
          </button>
          <button type="button" className="quick-tile" aria-pressed={settings.notifications.push} onClick={() => update('notifications', { push: !settings.notifications.push })}>
            <span className="quick-tile__icon">
              <BellGlyph size={17} ringing={settings.notifications.push} active={settings.notifications.push} />
            </span>
            <span className="quick-tile__label">{t('settings.home.push')}</span>
            <span className="quick-tile__state">{settings.notifications.push ? t('settings.on') : t('settings.off')}</span>
          </button>
          <button type="button" className="quick-tile" aria-pressed={settings.data.dataSaver} onClick={() => update('data', { dataSaver: !settings.data.dataSaver })}>
            <span className="quick-tile__icon">
              <DataGlyph size={17} active={settings.data.dataSaver} />
            </span>
            <span className="quick-tile__label">{t('settings.data.saver')}</span>
            <span className="quick-tile__state">{settings.data.dataSaver ? t('settings.on') : t('settings.off')}</span>
          </button>
        </div>

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
              <div className="list list--grouped">
                {rows.map((s) => {
                  const trail = trailFor(s.id, settings, t);
                  return <SettingLink key={s.id} to={`/settings/${s.id}`} G={s.G} tone={s.tone} title={t(s.key)} trail={trail ? <span className="set-trail">{trail}</span> : undefined} />;
                })}
              </div>
            </section>
          );
        })}

        {!query ? (
          <section className="set-group" aria-label={t('settings.signOut')}>
            <div className="list list--grouped">
              <button type="button" className="list-row" onClick={() => setSheet('reset')}>
                <span className="tile set-tile tone-violet" style={{ width: 30, height: 30, borderRadius: 10 }}>
                  <RefreshGlyph size={17} />
                </span>
                <span className="list-row__body">
                  <span className="list-row__title">{t('settings.resetData')}</span>
                </span>
              </button>
              <button type="button" className="list-row set-row--danger" onClick={() => setSheet('signout')}>
                <span className="tile set-tile tone-red" style={{ width: 30, height: 30, borderRadius: 10 }}>
                  <LogoutGlyph size={17} />
                </span>
                <span className="list-row__body">
                  <span className="list-row__title">{t('settings.signOut')}</span>
                </span>
              </button>
            </div>
            <p className="meta" style={{ textAlign: 'center', marginTop: 4 }}>
              {t('settings.footer', { v: APP_VERSION })}
            </p>
          </section>
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
