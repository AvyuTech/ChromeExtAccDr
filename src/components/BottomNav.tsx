import { Link, useLocation } from 'react-router-dom';
import { useT } from '../i18n';
import { CityGlyph, ExploreGlyph, HomeGlyph, MeGlyph, PlusGlyph } from '../icons';
import { visibleAlerts } from '../lib/selectors';
import { useAppData } from '../state/appData';
import { useSettings } from '../state/settings';

type Tab = { to: string; key: string; Glyph: typeof HomeGlyph; match: (p: string) => boolean };

const TABS: Tab[] = [
  { to: '/', key: 'nav.home', Glyph: HomeGlyph, match: (p) => p === '/' || p.startsWith('/post') || p.startsWith('/ask') },
  {
    to: '/explore',
    key: 'nav.explore',
    Glyph: ExploreGlyph,
    match: (p) => ['/explore', '/place', '/event', '/deals', '/groups'].some((x) => p.startsWith(x)),
  },
  { to: '/city', key: 'nav.city', Glyph: CityGlyph, match: (p) => p.startsWith('/city') },
  { to: '/me', key: 'nav.me', Glyph: MeGlyph, match: (p) => p.startsWith('/me') || p.startsWith('/settings') || p.startsWith('/updates') || p.startsWith('/messages') },
];

export function BottomNav() {
  const { pathname } = useLocation();
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
      <Link to="/compose" className="fab" aria-label={t('nav.post')}>
        <PlusGlyph size={24} />
      </Link>
      {renderTab(TABS[2])}
      {renderTab(TABS[3])}
    </nav>
  );
}
