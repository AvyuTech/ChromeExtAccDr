import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar } from '../components/cards';
import { Sheet } from '../components/ui';
import { REPORTS } from '../data/city';
import { PEOPLE, neighbourhoodName } from '../data/core';
import { useT } from '../i18n';
import {
  BellGlyph,
  ChatGlyph,
  GroupsGlyph,
  HelpGlyph,
  InfoGlyph,
  LogoutGlyph,
  ReportGlyph,
  SaveGlyph,
  ShieldGlyph,
  SlidersGlyph,
  StepRing,
  UsersGlyph,
} from '../icons';
import { unreadMessageCount, unreadNotificationCount } from '../lib/selectors';
import { useAppData } from '../state/appData';
import { useSettings } from '../state/settings';
import { GlyphTile, SettingLink } from './settings/parts';

/* Sample totals from before this device; the person's own activity adds on top. */
const BASE = { posts: 12, replies: 47, helpful: 318 };
const CHAMPION_AT = 3;

export default function Me() {
  const t = useT();
  const navigate = useNavigate();
  const { settings, update } = useSettings();
  const { data } = useAppData();
  const [confirm, setConfirm] = useState(false);

  const profile = settings.profile;
  const me = { ...PEOPLE.me, name: profile.name, initials: (profile.name.trim()[0] ?? 'N').toUpperCase(), verified: profile.verifiedResident };
  const myReports = [...data.myReports, ...REPORTS.filter((r) => r.mine)];
  const fixed = myReports.filter((r) => r.status === 4).length;
  const open = myReports.length - fixed;
  const replies = BASE.replies + Object.values(data.myReplies).reduce((n, r) => n + r.length, 0);
  const savedCount = data.savedPlaces.length + data.savedEvents.length + data.savedPosts.length;
  const unread = unreadNotificationCount(settings, data);
  const unreadChats = unreadMessageCount(data);

  const stats = [
    { key: 'me.posts', value: BASE.posts + data.myPosts.length },
    { key: 'me.replies', value: replies },
    { key: 'me.helpful', value: BASE.helpful },
    { key: 'me.reports', value: myReports.length },
  ];

  return (
    <>
      <main className="page">
        <header className="row row--between" style={{ minHeight: 44 }}>
          <h1 className="page-title">{t('nav.me')}</h1>
          <div className="row" style={{ gap: 8 }}>
            <Link to="/updates" className="icon-btn" aria-label={`${t('nav.updates')}${unread ? `, ${t('me.unread', { n: unread })}` : ''}`}>
              <BellGlyph size={20} ringing={unread > 0} />
              {unread > 0 ? <span className="count-badge">{unread}</span> : null}
            </Link>
            <Link to="/settings" className="icon-btn" aria-label={t('common.settings')}>
              <SlidersGlyph size={20} />
            </Link>
          </div>
        </header>

        <section className="card me-profile" aria-label={profile.name}>
          <span className="me-avatar">
            <svg className="me-avatar__ring" viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r="47" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeDasharray="6 8" strokeLinecap="round" />
            </svg>
            <Avatar who={{ ...me, verified: false }} size={76} />
            <span className="me-avatar__dot" aria-hidden="true" />
          </span>
          <div className="stack" style={{ gap: 4, alignItems: 'center' }}>
            <h2 className="display" style={{ fontSize: '1.375rem' }}>
              {profile.name}
            </h2>
            <span className="meta">
              @{profile.handle} · {neighbourhoodName(settings.location.home)}, {settings.location.city}
            </span>
          </div>
          <div className="row row--wrap" style={{ justifyContent: 'center', gap: 6 }}>
            {PEOPLE.me.badge ? (
              <span className="badge tone-violet">
                <UsersGlyph size={14} /> {PEOPLE.me.badge}
              </span>
            ) : null}
            {profile.verifiedResident ? (
              <span className="badge tone-mint">
                <ShieldGlyph size={14} /> {t('settings.account.verified')}
              </span>
            ) : null}
          </div>
          {profile.bio ? (
            <p className="body-sm" style={{ textAlign: 'center' }}>
              {profile.bio}
            </p>
          ) : null}
          <Link to="/settings/account" className="btn btn--soft btn--sm">
            {t('me.editProfile')}
          </Link>
          <dl className="me-stats">
            {stats.map((s) => (
              <div key={s.key} className="me-stat">
                <dt>{t(s.key)}</dt>
                <dd className="num">{s.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="card stack" aria-labelledby="impact-title">
          <div className="row row--between">
            <h2 className="section__title" id="impact-title">
              {t('me.impact')}
            </h2>
            <Link to="/city/reports" className="section__link">
              {t('common.seeAll')}
            </Link>
          </div>
          <div className="grid-3 me-impact">
            <div className="me-impact__cell">
              <StepRing step={4} steps={5} size={48}>
                <span className="num">{fixed}</span>
              </StepRing>
              <span className="meta">{t('me.streetsFixed')}</span>
            </div>
            <div className="me-impact__cell">
              <StepRing step={2} steps={5} size={48}>
                <span className="num">{open}</span>
              </StepRing>
              <span className="meta">{t('me.inProgress')}</span>
            </div>
            <div className="me-impact__cell">
              <span className="me-impact__big num">{BASE.helpful}</span>
              <span className="meta">{t('me.neighboursHelped')}</span>
            </div>
          </div>
          <div className="stack" style={{ gap: 6 }}>
            <div className="row row--between">
              <span className="body-sm strong">{t('me.nextBadge', { badge: t('me.champion') })}</span>
              <span className="meta">
                {Math.min(fixed, CHAMPION_AT)}/{CHAMPION_AT}
              </span>
            </div>
            <div
              className="progress"
              role="progressbar"
              aria-label="City champion progress"
              aria-valuemin={0}
              aria-valuemax={CHAMPION_AT}
              aria-valuenow={Math.min(fixed, CHAMPION_AT)}
            >
              <span style={{ width: `${(Math.min(fixed, CHAMPION_AT) / CHAMPION_AT) * 100}%` }} />
            </div>
            <span className="meta">Get {Math.max(0, CHAMPION_AT - fixed)} more reports resolved in your ward.</span>
          </div>
        </section>

        <section className="set-group" aria-labelledby="me-stuff">
          <h2 className="set-group__title" id="me-stuff">
            {t('me.shortcuts')}
          </h2>
          <div className="list">
            <SettingLink to="/me/saved" G={SaveGlyph} tone="violet" title={t('me.saved')} trail={<span className="set-trail">{savedCount}</span>} />
            <SettingLink to="/city/reports" G={ReportGlyph} tone="amber" title={t('me.myReports')} trail={<span className="set-trail">{myReports.length}</span>} />
            <SettingLink to="/groups" G={GroupsGlyph} tone="teal" title={t('me.groups')} trail={<span className="set-trail">{data.joinedGroups.length}</span>} />
            <SettingLink
              to="/messages"
              G={ChatGlyph}
              tone="blue"
              title={t('nav.messages')}
              trail={unreadChats ? <span className="badge badge--sm tone-mint">{t('me.unread', { n: unreadChats })}</span> : undefined}
            />
            <SettingLink
              to="/updates"
              G={BellGlyph}
              tone="peach"
              title={t('nav.updates')}
              trail={unread ? <span className="badge badge--sm tone-mint">{t('me.unread', { n: unread })}</span> : undefined}
            />
          </div>
        </section>

        <section className="set-group" aria-labelledby="me-more">
          <h2 className="set-group__title" id="me-more">
            {t('me.more')}
          </h2>
          <div className="list">
            <SettingLink to="/settings" G={SlidersGlyph} tone="violet" title={t('settings.title')} />
            <SettingLink to="/settings/help" G={HelpGlyph} tone="yellow" title={t('settings.help')} />
            <SettingLink to="/settings/about" G={InfoGlyph} tone="blue" title={t('settings.about')} />
            <button type="button" className="list-row" onClick={() => setConfirm(true)}>
              <GlyphTile G={LogoutGlyph} tone="red" />
              <span className="list-row__body">
                <span className="list-row__title" style={{ color: 'var(--red-ink)' }}>
                  {t('settings.signOut')}
                </span>
              </span>
            </button>
          </div>
        </section>
      </main>

      <Sheet open={confirm} onClose={() => setConfirm(false)} title={t('settings.signOutTitle')}>
        <p className="body-sm">{t('settings.signOutBody')}</p>
        <div className="grid-2">
          <button type="button" className="btn btn--outline" onClick={() => setConfirm(false)}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => {
              setConfirm(false);
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
