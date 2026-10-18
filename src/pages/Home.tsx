import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCard, DealCard, EventTile, GroupRow, PlaceRow, PostCard } from '../components/cards';
import { FriendPickCard, PlanTogetherCard } from '../components/community';
import { CheckInCard, FriendStrip } from '../components/friends';
import { SectionHead, Sheet, EmptyState } from '../components/ui';
import { NEIGHBOURHOODS, neighbourhoodName } from '../data/core';
import { EVENTS } from '../data/events';
import { PLACES } from '../data/places';
import { DEALS, GROUPS, POSTS } from '../data/social';
import type { Post } from '../data/types';
import { useT } from '../i18n';
import { BellGlyph, ChatGlyph, CheckGlyph, ChevronDownGlyph, Logo, PinGlyph, SearchGlyph, SparkGlyph, WeatherGlyph } from '../icons';
import { friendFeed, friendsMustTries, planTogether } from '../lib/friends';
import { unreadMessageCount, unreadNotificationCount, visibleAlerts } from '../lib/selectors';
import { useAppData } from '../state/appData';
import { useLiveCity } from '../state/live';
import { enabledSources, useSettings } from '../state/settings';

type Chip = 'weekend' | 'food' | 'events' | 'deals' | 'alerts';
type FeedTab = 'for-you' | 'friends' | 'near' | 'trending' | 'questions';

const CHIPS: Array<{ id: Chip; key: string }> = [
  { id: 'weekend', key: 'chip.weekend' },
  { id: 'food', key: 'chip.food' },
  { id: 'events', key: 'chip.events' },
  { id: 'deals', key: 'chip.deals' },
  { id: 'alerts', key: 'chip.alerts' },
];

const TABS: Array<{ id: FeedTab; key: string }> = [
  { id: 'for-you', key: 'feed.forYou' },
  { id: 'friends', key: 'feed.friends.tab' },
  { id: 'near', key: 'feed.nearMe' },
  { id: 'trending', key: 'feed.trending' },
  { id: 'questions', key: 'feed.questions' },
];

const FOOD_TOPICS = ['Food', 'New place'];

export default function Home() {
  const t = useT();
  const navigate = useNavigate();
  const { settings, update } = useSettings();
  const { data } = useAppData();
  const pulse = useLiveCity();
  const [chip, setChip] = useState<Chip>('weekend');
  const [tab, setTab] = useState<FeedTab>('for-you');
  const [query, setQuery] = useState('');
  const [placeSheet, setPlaceSheet] = useState(false);

  const homeName = neighbourhoodName(settings.location.home);
  const alerts = visibleAlerts(settings, data);
  const unread = unreadNotificationCount(settings, data);
  const unreadChats = unreadMessageCount(data);

  const weekendEvents = useMemo(
    () =>
      EVENTS.filter((e) => ['Sat', 'Sun', 'Sat–Sun'].includes(e.day))
        .filter((e) => e.confirmed || settings.sources.showUnconfirmed)
        .filter((e) => e.sources.some(enabledSources(settings)))
        .sort((a, b) => b.going - a.going),
    [settings],
  );
  const tonight = EVENTS.filter((e) => e.day === 'Today').length + weekendEvents.filter((e) => e.day === 'Sat' || e.day === 'Sat–Sun').length;

  const posts = useMemo(() => {
    const all: Post[] = [...data.myPosts, ...POSTS];
    const interestRank = (p: Post) => (settings.interests.some((i) => p.topic.toLowerCase().includes(i) || (i === 'food' && FOOD_TOPICS.includes(p.topic))) ? 1 : 0);
    switch (tab) {
      case 'near':
        return all.filter((p) => p.area === homeName || NEIGHBOURHOODS.find((n) => n.name === p.area)?.zone === 'West');
      case 'trending':
        return all.filter((p) => p.trending || p.upvotes > 40).sort((a, b) => b.upvotes - a.upvotes);
      case 'questions':
        return all.filter((p) => p.type === 'question');
      default:
        return [...all].sort((a, b) => Number(b.authorId === 'me') - Number(a.authorId === 'me') || interestRank(b) - interestRank(a));
    }
  }, [tab, data.myPosts, homeName, settings.interests]);

  const friendsCheckIns = useMemo(() => [...data.myCheckIns, ...friendFeed(data)], [data]);
  const mustTries = useMemo(() => friendsMustTries(data), [data]);
  const plans = useMemo(() => planTogether(data), [data]);

  const onAsk = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/ask?q=${encodeURIComponent(q)}` : '/ask');
  };

  const weekendSection = (
    <section aria-labelledby="weekend-title" className="section" key="weekend">
      <SectionHead id="weekend-title" title={t('home.weekend')} to={`/ask?q=${encodeURIComponent("What's happening this weekend?")}`} linkLabel={t('common.seeAllN', { n: weekendEvents.length })} />
      <div className="hscroll">
        {weekendEvents.map((e) => (
          <EventTile key={e.id} event={e} />
        ))}
      </div>
    </section>
  );

  // Interleave posts with city cards the way the design does: post, alert, events, post, deal…
  const feed: ReactNode[] = [];
  const firstDeal = DEALS[0];
  const mustTriesSection =
    mustTries.length > 0 ? (
      <section key="must-tries" className="section" aria-labelledby="must-title">
        <SectionHead id="must-title" title={t('feed.friends.mustTries')} to="/friends" />
        <div className="hscroll">
          {mustTries.map((c) => (
            <FriendPickCard key={c.id} c={c} />
          ))}
        </div>
      </section>
    ) : null;
  // A friend's check-in that is not already in the must-tries row, for variety further down the feed.
  const friendCard = friendFeed(data).find((c) => c.verdict !== 'must') ?? friendFeed(data)[0];

  if (chip === 'weekend' && tab === 'friends') {
    if (friendsCheckIns.length === 0) {
      feed.push(
        <EmptyState
          key="no-friends"
          glyph="friends"
          title={t('feed.friends.emptyTitle')}
          body={t('feed.friends.emptyBody')}
          action={
            <Link className="btn btn--primary btn--sm" to="/friends?tab=find">
              {t('feed.friends.find')}
            </Link>
          }
        />,
      );
    } else {
      if (plans.length) feed.push(<PlanTogetherCard key="plans" plans={plans} />);
      friendsCheckIns.forEach((c) => feed.push(<CheckInCard key={c.id} c={c} />));
    }
  } else if (chip === 'weekend') {
    posts.forEach((p, i) => {
      feed.push(<PostCard key={p.id} post={p} />);
      if (i === 0 && alerts[0]) feed.push(<AlertCard key={`alert-${alerts[0].id}`} alert={alerts[0]} />);
      if (i === 0 && tab === 'for-you' && mustTriesSection) feed.push(mustTriesSection);
      if (i === 0 && tab === 'for-you') feed.push(weekendSection);
      if (i === 1 && tab === 'for-you') feed.push(<DealCard key="deal" deal={firstDeal} />);
      if (i === 2 && tab === 'for-you' && friendCard)
        feed.push(
          <div key={`friend-${friendCard.id}`} className="stack" style={{ gap: 8 }}>
            <span className="eyebrow muted">{t('feed.friends.fromFriend')}</span>
            <CheckInCard c={friendCard} />
          </div>,
        );
      if (i === 4 && tab === 'for-you' && plans.length) feed.push(<PlanTogetherCard key="plans" plans={plans} />);
      if (i === 3 && tab === 'for-you')
        feed.push(
          <section key="groups" className="section" aria-labelledby="groups-title">
            <SectionHead id="groups-title" title="Groups near you" to="/groups" />
            {GROUPS.filter((g) => !data.joinedGroups.includes(g.id))
              .slice(0, 2)
              .map((g) => (
                <GroupRow key={g.id} group={g} />
              ))}
          </section>,
        );
    });
  } else if (chip === 'food') {
    feed.push(
      <section key="food-places" className="section" aria-labelledby="food-title">
        <SectionHead id="food-title" title="Locals are talking about" to="/explore/food" />
        <div className="list">
          {PLACES.filter((p) => p.category === 'food' || p.category === 'cafe')
            .slice(0, 4)
            .map((p, i, arr) => (
              <PlaceRow key={p.id} place={p} last={i === arr.length - 1} />
            ))}
        </div>
      </section>,
    );
    DEALS.filter((d) => d.category === 'food' || d.category === 'cafe').forEach((d) => feed.push(<DealCard key={d.id} deal={d} />));
    posts.filter((p) => FOOD_TOPICS.includes(p.topic)).forEach((p) => feed.push(<PostCard key={p.id} post={p} />));
  } else if (chip === 'events') {
    feed.push(weekendSection);
    EVENTS.filter((e) => e.day === 'Today' || e.day === 'Tomorrow').length > 0 &&
      feed.push(
        <section key="soon" className="section" aria-labelledby="soon-title">
          <SectionHead id="soon-title" title="Today & tomorrow" to="/explore/events" />
          <div className="hscroll">
            {EVENTS.filter((e) => e.day === 'Today' || e.day === 'Tomorrow').map((e) => (
              <EventTile key={e.id} event={e} />
            ))}
          </div>
        </section>,
      );
  } else if (chip === 'deals') {
    DEALS.forEach((d) => feed.push(<DealCard key={d.id} deal={d} />));
  } else if (chip === 'alerts') {
    if (alerts.length === 0)
      feed.push(
        <EmptyState
          key="none"
          glyph="alert"
          title="All quiet near you"
          body="No alerts match your settings right now."
          action={
            <Link className="btn btn--soft btn--sm" to="/settings/alerts">
              Alert settings
            </Link>
          }
        />,
      );
    alerts.forEach((a) => feed.push(<AlertCard key={a.id} alert={a} />));
  }

  return (
    <>
      <main className="page">
        <header className="row" style={{ height: 44 }}>
          <Logo title="Nearhood" />
          <div className="grow" style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="display strong" style={{ fontSize: '1.3125rem', letterSpacing: '-0.03em', lineHeight: 1 }}>
              nearhood
            </span>
            <button
              type="button"
              onClick={() => setPlaceSheet(true)}
              className="row"
              style={{ all: 'unset', display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.78125rem', color: 'var(--muted)', marginTop: 4, cursor: 'pointer' }}
              aria-label={`Neighbourhood: ${homeName}, ${settings.location.city}. Change`}
            >
              <PinGlyph size={12} style={{ color: 'var(--accent)' }} />
              {homeName}, {settings.location.city}
              <ChevronDownGlyph size={12} />
            </button>
          </div>
          <Link to="/updates" className="icon-btn" aria-label={`${t('nav.updates')}${unread ? `, ${unread} unread` : ''}`}>
            <BellGlyph size={20} ringing={unread > 0} />
            {unread > 0 ? <span className="count-badge">{unread}</span> : null}
          </Link>
          <Link to="/messages" className="icon-btn" aria-label={`${t('nav.messages')}${unreadChats ? `, ${unreadChats} unread` : ''}`}>
            <ChatGlyph size={20} typing={unreadChats > 0} />
          </Link>
        </header>

        <form onSubmit={onAsk} role="search">
          <label className="ask-field" htmlFor="ask">
            <SparkGlyph size={20} />
            <input id="ask" type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('home.ask')} autoComplete="off" enterKeyHint="search" />
            <button type="submit" className="icon-btn icon-btn--accent" style={{ width: 42, height: 42 }} aria-label={t('common.search')}>
              <SearchGlyph size={18} />
            </button>
          </label>
        </form>

        <FriendStrip />

        <div className="chip-row" role="group" aria-label="Filter your feed">
          {CHIPS.map((c) => (
            <button key={c.id} type="button" className="chip" aria-pressed={chip === c.id} onClick={() => setChip(c.id)}>
              {t(c.key)}
            </button>
          ))}
        </div>

        <section
          aria-label={t('home.today', { city: settings.location.city })}
          className="home-today"
        >
          <Link to="/city" className="home-today__main">
            <span className="home-today__label">{t('home.today', { city: settings.location.city })}</span>
            <span className="row display strong" style={{ gap: 6, fontSize: '1.0625rem' }}>
              <WeatherGlyph condition={pulse.weather.condition} size={22} />
              {pulse.weather.condition === 'sunny' ? 'Sunny' : 'Clear'}, {pulse.weather.temp}°
            </span>
          </Link>
          <div className="row" style={{ gap: 8 }}>
            <Link to="/city/alerts" className="stat home-today__stat">
              <span className="num" style={{ fontSize: '1.0625rem' }}>
                {alerts.length}
              </span>
              <span className="home-today__stat-label">{t('home.alerts')}</span>
            </Link>
            <Link to={`/ask?q=${encodeURIComponent('Things to do tonight')}`} className="stat home-today__stat">
              <span className="num" style={{ fontSize: '1.0625rem' }}>
                {tonight}
              </span>
              <span className="home-today__stat-label">{t('home.tonight')}</span>
            </Link>
            <Link to="/deals" className="stat home-today__stat home-today__stat--mint">
              <span className="num" style={{ fontSize: '1.0625rem' }}>
                {DEALS.length}
              </span>
              <span style={{ fontSize: '0.6875rem', fontWeight: 600 }}>{t('home.deals')}</span>
            </Link>
          </div>
        </section>

        {chip === 'weekend' ? (
          <div className="tabs" role="tablist" aria-label="Feed">
            {TABS.map((x) => (
              <button key={x.id} type="button" role="tab" className="tab" aria-selected={tab === x.id} onClick={() => setTab(x.id)}>
                {t(x.key)}
              </button>
            ))}
          </div>
        ) : null}

        {feed.length ? feed : <EmptyState glyph="question" title={t('home.empty')} body="Ask a question and neighbours will chip in." />}
      </main>

      <Sheet open={placeSheet} onClose={() => setPlaceSheet(false)} title="Your neighbourhood">
        <p className="body-sm muted">Nearhood shows alerts, events and posts around this area first.</p>
        <div className="list">
          {NEIGHBOURHOODS.map((n) => (
            <button
              key={n.id}
              type="button"
              className="list-row"
              aria-pressed={settings.location.home === n.id}
              onClick={() => {
                update('location', { home: n.id });
                setPlaceSheet(false);
              }}
            >
              <span className="list-row__body">
                <span className="list-row__title">{n.name}</span>
                <span className="list-row__meta">
                  {n.zone} zone · Ward: {n.ward}
                </span>
              </span>
              {settings.location.home === n.id ? <CheckGlyph size={20} style={{ color: 'var(--accent)' }} /> : null}
            </button>
          ))}
        </div>
        <Link to="/settings/location" className="btn btn--soft btn--block" onClick={() => setPlaceSheet(false)}>
          More location settings
        </Link>
      </Sheet>
    </>
  );
}
