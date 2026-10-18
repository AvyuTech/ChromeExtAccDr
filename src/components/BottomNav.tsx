import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useT } from '../i18n';
import { ChevronRightGlyph, CityGlyph, ExploreGlyph, HomeGlyph, MeGlyph, NamedGlyph, PlusGlyph, type GlyphName } from '../icons';
import type { Tone } from '../data/types';
import { Sheet } from './ui';
import { visibleAlerts } from '../lib/selectors';
import { useAppData } from '../state/appData';
import { useSettings } from '../state/settings';

type Tab = { to: string; key: string; Glyph: typeof HomeGlyph; match: (p: string) => boolean };

const TABS: Tab[] = [
  { to: '/', key: 'nav.home', Glyph: HomeGlyph, match: (p) => p === '/' || ['/post', '/ask', '/checkin', '/friends', '/people'].some((x) => p.startsWith(x)) },
  {
    to: '/explore',
    key: 'nav.explore',
    Glyph: ExploreGlyph,
    match: (p) => ['/explore', '/place', '/event', '/deals', '/groups', '/lists'].some((x) => p.startsWith(x)),
  },
  { to: '/city', key: 'nav.city', Glyph: CityGlyph, match: (p) => p.startsWith('/city') },
  { to: '/me', key: 'nav.me', Glyph: MeGlyph, match: (p) => p.startsWith('/me') || p.startsWith('/settings') || p.startsWith('/updates') || p.startsWith('/messages') },
];

/** What the + button offers. Quick check-in comes first: posting should take seconds. */
const CREATE: Array<{ to: string; glyph: GlyphName; tone: Tone; title: string; meta: string }> = [
  { to: '/compose?type=question', glyph: 'question', tone: 'violet', title: 'Ask friends & neighbours', meta: 'Where to go, what to order, who to call' },
  { to: '/compose?type=recommendation', glyph: 'recommend', tone: 'mint', title: 'Recommend something', meta: 'A longer tip for your neighbourhood' },
  { to: '/city/report', glyph: 'report', tone: 'amber', title: 'Report a city issue', meta: 'Pothole, garbage, streetlight and more' },
  { to: '/compose', glyph: 'events', tone: 'blue', title: 'Event, lost & found or give away', meta: 'All post types' },
];

export function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const t = useT();
  const { settings } = useSettings();
  const { data } = useAppData();
  const cityAlerts = visibleAlerts(settings, data).filter((a) => a.severity !== 'info').length;

  const renderTab = (tab: Tab) => {
    const active = tab.match(pathname);
    return (
      <Link key={tab.to} to={tab.to} className="nav-item" aria-current={active ? 'page' : undefined}>
        <tab.Glyph size={24} active={active} />
        {t(tab.key)}
        {tab.to === '/city' && cityAlerts > 0 && !active ? <span className="nav-dot" aria-label={`${cityAlerts} city alerts`} /> : null}
      </Link>
    );
  };

  return (
    <nav aria-label={t('nav.main')} className="bottom-nav">
      {renderTab(TABS[0])}
      {renderTab(TABS[1])}
      <button type="button" className="fab" aria-label={t('nav.post')} aria-haspopup="dialog" onClick={() => setCreateOpen(true)}>
        <PlusGlyph size={24} />
      </button>
      {renderTab(TABS[2])}
      {renderTab(TABS[3])}
      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} title="Share something">
        <button
          type="button"
          className="create-hero glyph-host"
          onClick={() => {
            setCreateOpen(false);
            navigate('/checkin');
          }}
        >
          <span className="create-hero__glyph">
            <NamedGlyph name="checkin" size={30} duo live />
          </span>
          <span className="stack grow" style={{ gap: 2, textAlign: 'left' }}>
            <span className="display strong" style={{ fontSize: '1.0625rem' }}>
              Quick check-in
            </span>
            <span style={{ fontSize: '0.84375rem', opacity: 0.85 }}>What did you eat or do? Three taps, about ten seconds.</span>
          </span>
          <ChevronRightGlyph size={18} />
        </button>
        <div className="list">
          {CREATE.map((c) => (
            <Link key={c.to} to={c.to} className="list-row glyph-host" onClick={() => setCreateOpen(false)}>
              <span className={`tile tone-${c.tone}`}>
                <NamedGlyph name={c.glyph} size={20} duo />
              </span>
              <span className="list-row__body">
                <span className="list-row__title">{c.title}</span>
                <span className="list-row__meta">{c.meta}</span>
              </span>
              <ChevronRightGlyph size={16} />
            </Link>
          ))}
        </div>
      </Sheet>
    </nav>
  );
}
