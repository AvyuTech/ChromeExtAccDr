import { ALERTS, SEVERITY_ORDER } from '../data/city';
import { CONVERSATIONS, NOTIFICATIONS } from '../data/social';
import type { AppNotification, CityAlert } from '../data/types';
import type { AppData } from '../state/appData';
import type { Settings } from '../state/settings';

/** Alerts this person asked to see: kinds, minimum severity, their area, commute-only. */
export function visibleAlerts(settings: Settings, data: AppData): CityAlert[] {
  const min = SEVERITY_ORDER[settings.alerts.minSeverity];
  const home = settings.location.home;
  const work = settings.location.work;
  return ALERTS.filter((a) => {
    if (!a.active || data.dismissedAlerts.includes(a.id)) return false;
    if (!settings.alerts.kinds[a.kind]) return false;
    if (SEVERITY_ORDER[a.severity] < min && a.severity !== 'critical') return false;
    const local = a.areas.includes('all') || a.areas.includes(home) || (work ? a.areas.includes(work) : false);
    if (!local && a.severity !== 'critical') return false;
    if (settings.alerts.commuteOnly && !a.affectsCommute && a.severity !== 'critical' && a.kind !== 'safety') return false;
    return true;
  }).sort((a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity]);
}

const CATEGORY_FOR: Record<AppNotification['kind'], keyof Settings['notifications']['categories'] | null> = {
  reply: 'replies',
  mention: 'mentions',
  alert: 'alerts',
  event: 'events',
  deal: 'deals',
  report: 'reports',
  group: 'groups',
  system: null,
  follow: 'friends',
  friend: 'friends',
};

/** Notifications for the categories the person kept on. */
export function visibleNotifications(settings: Settings): AppNotification[] {
  return NOTIFICATIONS.filter((n) => {
    const cat = CATEGORY_FOR[n.kind];
    return cat === null || settings.notifications.categories[cat];
  });
}

export function unreadNotificationCount(settings: Settings, data: AppData) {
  return visibleNotifications(settings).filter((n) => !data.readNotifications.includes(n.id)).length;
}

export function unreadMessageCount(data: AppData) {
  return CONVERSATIONS.filter((c) => c.unread > 0 && !data.readConversations.includes(c.id)).reduce((sum, c) => sum + c.unread, 0);
}
