import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import AlertDetail from './pages/AlertDetail';
import Alerts from './pages/Alerts';
import Ask from './pages/Ask';
import Category from './pages/Category';
import CheckIn from './pages/CheckIn';
import CheckInDetail from './pages/CheckInDetail';
import Chat from './pages/Chat';
import City from './pages/City';
import Compose from './pages/Compose';
import DealDetail from './pages/DealDetail';
import Deals from './pages/Deals';
import EventDetail from './pages/EventDetail';
import Explore from './pages/Explore';
import Friends from './pages/Friends';
import GroupDetail from './pages/GroupDetail';
import Glyphs from './pages/Glyphs';
import Groups from './pages/Groups';
import Home from './pages/Home';
import ListDetail from './pages/ListDetail';
import Me from './pages/Me';
import Messages from './pages/Messages';
import NotFound from './pages/NotFound';
import Onboarding from './pages/Onboarding';
import PlaceDetail from './pages/PlaceDetail';
import PostDetail from './pages/PostDetail';
import Profile from './pages/Profile';
import Report from './pages/Report';
import ReportDetail from './pages/ReportDetail';
import Reports from './pages/Reports';
import Safety from './pages/Safety';
import Saved from './pages/Saved';
import Services from './pages/Services';
import SettingsHome from './pages/settings/SettingsHome';
import SettingsSection from './pages/settings/SettingsSection';
import Transit from './pages/Transit';
import Updates from './pages/Updates';
import { AppDataProvider } from './state/appData';
import { SettingsProvider, useSettings } from './state/settings';
import { ToastProvider } from './state/toast';

/** Full-screen flows hide the tab bar. */
const NO_NAV = [/^\/onboarding/, /^\/compose/, /^\/messages\/.+/, /^\/city\/report$/, /^\/checkin$/];

function Shell() {
  const { pathname } = useLocation();
  const { settings } = useSettings();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  if (!settings.onboarded && pathname !== '/onboarding') return <Navigate to="/onboarding" replace />;

  const showNav = !NO_NAV.some((r) => r.test(pathname));
  return (
    <div className="app-frame">
      <div className="app-column">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/ask" element={<Ask />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/explore/:category" element={<Category />} />
          <Route path="/deals" element={<Deals />} />
          <Route path="/deals/:id" element={<DealDetail />} />
          <Route path="/place/:id" element={<PlaceDetail />} />
          <Route path="/event/:id" element={<EventDetail />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/groups/:id" element={<GroupDetail />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/compose" element={<Compose />} />
          <Route path="/checkin" element={<CheckIn />} />
          <Route path="/checkin/:id" element={<CheckInDetail />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/people/:id" element={<Profile />} />
          <Route path="/lists/:id" element={<ListDetail />} />
          <Route path="/updates" element={<Updates />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:id" element={<Chat />} />
          <Route path="/city" element={<City />} />
          <Route path="/city/alerts" element={<Alerts />} />
          <Route path="/city/alerts/:id" element={<AlertDetail />} />
          <Route path="/city/transit" element={<Transit />} />
          <Route path="/city/report" element={<Report />} />
          <Route path="/city/reports" element={<Reports />} />
          <Route path="/city/reports/:id" element={<ReportDetail />} />
          <Route path="/city/services" element={<Services />} />
          <Route path="/city/safety" element={<Safety />} />
          <Route path="/me" element={<Me />} />
          <Route path="/me/saved" element={<Saved />} />
          <Route path="/settings" element={<SettingsHome />} />
          <Route path="/settings/:section" element={<SettingsSection />} />
          <Route path="/about/glyphs" element={<Glyphs />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        {showNav ? <BottomNav /> : null}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <SettingsProvider>
        <AppDataProvider>
          <ToastProvider>
            <Shell />
          </ToastProvider>
        </AppDataProvider>
      </SettingsProvider>
    </HashRouter>
  );
}
