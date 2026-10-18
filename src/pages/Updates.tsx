import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { eventPhoto, groupPhoto, personPhoto } from '../assets/photos';
import { Avatar } from '../components/cards';
import { FollowButton } from '../components/friends';
import { NOTIFICATION_META } from '../components/social';
import { EmptyState, PageHeader } from '../components/ui';
import { person } from '../data/core';
import type { AppNotification } from '../data/types';
import { useT } from '../i18n';
import { BellOffGlyph, NamedGlyph } from '../icons';
import { visibleNotifications } from '../lib/selectors';
import { useAppData } from '../state/appData';
import { useSettings } from '../state/settings';
import { useToast } from '../state/toast';

type Filter = 'all' | 'friends' | 'replies' | 'clubs' | 'city' | 'reports';

const FILTERS: Array<{ id: Filter; key: string; kinds: AppNotification['kind'][] | null }> = [
  { id: 'all', key: 'social.filter.all', kinds: null },
  { id: 'friends', key: 'feed.friends.tab', kinds: ['follow', 'friend'] },
  { id: 'replies', key: 'social.filter.replies', kinds: ['reply', 'mention'] },
  { id: 'clubs', key: 'social.filter.clubs', kinds: ['group', 'event'] },
  { id: 'city', key: 'social.filter.city', kinds: ['alert', 'system'] },
  { id: 'reports', key: 'social.filter.reports', kinds: ['report'] },
];

export default function Updates() {
  const t = useT();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { data, add, markAllRead } = useAppData();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>('all');

  // Nearhood doesn't run deals or bookings, so those updates never show.
  const all = visibleNotifications(settings);
  const kinds = FILTERS.find((f) => f.id === filter)?.kinds;
  const shown = kinds ? all.filter((n) => kinds.includes(n.kind)) : all;
  const unread = all.filter((n) => !data.readNotifications.includes(n.id));
  const offCount = Object.values(settings.notifications.categories).filter((on) => !on).length;

  const groups: Array<{ id: AppNotification['day']; key: string; items: AppNotification[] }> = [
    { id: 'today', key: 'social.today', items: shown.filter((n) => n.day === 'today') },
    { id: 'earlier', key: 'social.earlier', items: shown.filter((n) => n.day === 'earlier') },
  ];

  const pendingRequest = (n: AppNotification) =>
    n.kind === 'follow' &&
    !!n.actorId &&
    settings.privacy.approveFollowers &&
    !data.approvedFollowers.includes(n.actorId) &&
    !data.declinedFollowers.includes(n.actorId);

  const open = (n: AppNotification) => {
    add('readNotifications', n.id);
    navigate(n.link);
  };

  return (
    <>
      <PageHeader
        title={t('nav.updates')}
        sub={unread.length ? t('social.unreadCount', { n: unread.length }) : undefined}
        actions={
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            style={{ color: 'var(--accent)', padding: '0 8px' }}
            disabled={unread.length === 0}
            onClick={() => {
              markAllRead(all.map((n) => n.id));
              toast(t('social.allMarkedRead'));
            }}
          >
            {t('social.markAllRead')}
          </button>
        }
      />
      <main className="page page--with-header">
        <div className="chip-row" role="group" aria-label="Filter updates">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" className="chip" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
              {t(f.key)}
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <EmptyState glyph="groups" title={t('social.allCaughtUp')} body={t('social.allCaughtUpBody')} />
        ) : (
          groups
            .filter((g) => g.items.length)
            .map((g) => (
              <section key={g.id} className="section" aria-labelledby={`updates-${g.id}`} style={{ gap: 2 }}>
                <h2 id={`updates-${g.id}`} className="notif-group-title">
                  {t(g.key)}
                </h2>
                <div className="list social-list">
                  {g.items.map((n) => {
                    const isUnread = !data.readNotifications.includes(n.id);
                    const content = (
                      <>
                        <NotifVisual n={n} live={(n.kind === 'alert' || n.kind === 'friend') && isUnread} />
                        <span className="list-row__body" style={{ gap: 1 }}>
                          <span className="notif-row__title">{pendingRequest(n) ? `${person(n.actorId!).name} wants to follow you` : n.title}</span>
                          <span className="notif-row__body">{pendingRequest(n) ? 'Approve to let them see your friends-only check-ins.' : n.body}</span>
                          <span className="meta">{n.ago}</span>
                        </span>
                      </>
                    );
                    // A follow notification carries its own Follow back button, so the row can't be one big button.
                    if (n.kind === 'follow' && n.actorId) {
                      return (
                        <div key={n.id} className={`list-row notif-row glyph-host${isUnread ? ' notif-row--unread' : ''}`}>
                          <button
                            type="button"
                            className="notif-row__main"
                            onClick={() => open(n)}
                            aria-label={`${isUnread ? `${t('social.unread')}: ` : ''}${n.title}. ${n.body} · ${n.ago}`}
                          >
                            {content}
                          </button>
                          <span className="notif-row__action">
                            <FollowRequestActions personId={n.actorId} />
                          </span>
                        </div>
                      );
                    }
                    return (
                      <button
                        key={n.id}
                        type="button"
                        className={`list-row notif-row glyph-host${isUnread ? ' notif-row--unread' : ''}`}
                        onClick={() => open(n)}
                        aria-label={`${isUnread ? `${t('social.unread')}: ` : ''}${n.title}. ${n.body} · ${n.ago}`}
                      >
                        {content}
                        {isUnread ? <span className="unread-dot" aria-hidden="true" /> : null}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))
        )}

        {offCount > 0 ? (
          <Link to="/settings/notifications" className="notice" style={{ textDecoration: 'none', alignItems: 'center' }}>
            <BellOffGlyph size={18} style={{ flexShrink: 0 }} />
            <span className="grow">
              {t('social.typesOff', { n: offCount })} · <b style={{ color: 'var(--accent)' }}>{t('social.notificationSettings')}</b>
            </span>
          </Link>
        ) : (
          <Link to="/settings/notifications" className="section__link" style={{ alignSelf: 'center', padding: '8px 0' }}>
            {t('social.notificationSettings')}
          </Link>
        )}
      </main>
    </>
  );
}

/** Who or what the update is about: a face, a photo of the event or place, or the kind's glyph. */
function NotifVisual({ n, live }: { n: AppNotification; live: boolean }) {
  const meta = NOTIFICATION_META[n.kind];
  const eventId = n.link.startsWith('/event/') ? n.link.slice(7) : undefined;
  const groupId = n.link.match(/^\/(?:groups|clubs)\/(.+)$/)?.[1];
  const src = n.actorId ? personPhoto(n.actorId) : eventId ? eventPhoto(eventId) : groupId ? groupPhoto(groupId) : undefined;
  const badge = (
    <span className={`notif-visual__badge tone-${meta.tone}`}>
      <NamedGlyph name={meta.glyph} size={10} />
    </span>
  );
  if (n.actorId) {
    return (
      <span className="notif-visual">
        <Avatar who={{ ...person(n.actorId), verified: false }} size={40} />
        {badge}
      </span>
    );
  }
  if (src) {
    return (
      <span className="notif-visual">
        <img className="notif-visual__photo" src={src} alt="" loading="lazy" />
        {badge}
      </span>
    );
  }
  return (
    <span className={`notif-visual notif-visual--tile tone-${meta.tone}`}>
      <NamedGlyph name={meta.glyph} size={19} live={live} />
    </span>
  );
}

/**
 * With "Approve new followers" on, a follow becomes a request to approve or decline;
 * otherwise (or once approved) it offers Follow back.
 */
function FollowRequestActions({ personId }: { personId: string }) {
  const { settings } = useSettings();
  const { data, add } = useAppData();
  const toast = useToast();
  const name = person(personId).name.split(' ')[0];
  if (data.declinedFollowers.includes(personId)) return <span className="meta">Declined</span>;
  if (!settings.privacy.approveFollowers || data.approvedFollowers.includes(personId)) return <FollowButton personId={personId} />;
  return (
    <span className="row" style={{ gap: 6 }}>
      <button
        type="button"
        className="btn btn--sm btn--primary"
        onClick={() => {
          add('approvedFollowers', personId);
          toast(`${name} can now follow you`);
        }}
      >
        Approve
      </button>
      <button
        type="button"
        className="btn btn--sm btn--outline"
        onClick={() => {
          add('declinedFollowers', personId);
          toast(`Declined ${name}'s request`);
        }}
      >
        Decline
      </button>
    </span>
  );
}
