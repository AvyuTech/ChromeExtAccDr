import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCard, EventTile, FaceStack, GroupRow, PlaceRow, PostCard } from '../components/cards';
import { CONDITION_LABEL } from '../components/city';
import { FriendPickCard, PlanTogetherCard } from '../components/community';
import { CheckInCard, FriendStrip } from '../components/friends';
import { EmptyState, SectionHead, Segmented, Sheet } from '../components/ui';
import { NEIGHBOURHOODS, neighbourhoodName } from '../data/core';
import { EVENTS } from '../data/events';
import { PLACES } from '../data/places';
import { GROUPS, POSTS } from '../data/social';
import type { Group, GroupBuy, Meetup } from '../data/types';
import type { Post } from '../data/types';
import { useT } from '../i18n';
import {
  ArrowRightGlyph,
  BellGlyph,
  ChatGlyph,
  CheckGlyph,
  ChevronDownGlyph,
  ChevronRightGlyph,
  Logo,
  NamedGlyph,
  PinGlyph,
  SlidersGlyph,
  SparkGlyph,
  SparkleMark,
  WeatherGlyph,
  Wordmark,
} from '../icons';
import { friendFeed, friendsMustTries, planTogether } from '../lib/friends';
import { unreadMessageCount, unreadNotificationCount, visibleAlerts } from '../lib/selectors';
import { useAppData } from '../state/appData';
import { useLiveCity } from '../state/live';
import { enabledSources, useSettings } from '../state/settings';

type Topic = 'all' | 'food' | 'events' | 'clubs' | 'alerts';
type Show = 'latest' | 'trending' | 'questions';
type FeedTab = 'for-you' | 'friends' | 'near';

const TOPICS: Array<{ id: Topic; key: string }> = [
  { id: 'all', key: 'home.everything' },
  { id: 'food', key: 'chip.food' },
  { id: 'events', key: 'chip.events' },
  { id: 'clubs', key: 'nav.clubs' },
  { id: 'alerts', key: 'chip.alerts' },
];

const TABS: Array<{ id: FeedTab; key: string }> = [
  { id: 'for-you', key: 'feed.forYou' },
  { id: 'friends', key: 'feed.friends.tab' },
  { id: 'near', key: 'home.nearby' },
];

const FOOD_TOPICS = ['Food', 'New place'];

function todayLabel() {
  const d = new Date();
  return `${d.toLocaleDateString('en-GB', { weekday: 'long' })}, ${d.getDate()} ${d.toLocaleDateString('en-GB', { month: 'short' })}`;
}

export default function Home() {
  const t = useT();
  const navigate = useNavigate();
  const { settings, update } = useSettings();
  const { data, has, toggle } = useAppData();
  const pulse = useLiveCity();
  const [topic, setTopic] = useState<Topic>('all');
  const [show, setShow] = useState<Show>('latest');
  const [tab, setTab] = useState<FeedTab>('for-you');
  const [query, setQuery] = useState('');
  const [placeSheet, setPlaceSheet] = useState(false);
  const [filterSheet, setFilterSheet] = useState(false);

  const homeName = neighbourhoodName(settings.location.home);
  const alerts = visibleAlerts(settings, data);
  const unread = unreadNotificationCount(settings, data);
  const unreadChats = unreadMessageCount(data);
  const filtered = topic !== 'all' || show !== 'latest';

  const weekendEvents = useMemo(
    () =>
      EVENTS.filter((e) => ['Sat', 'Sun', 'Sat–Sun'].includes(e.day))
        .filter((e) => e.confirmed || settings.sources.showUnconfirmed)
        .filter((e) => e.sources.some(enabledSources(settings)))
        .sort((a, b) => b.going - a.going),
    [settings],
  );
  const tonightEvents = EVENTS.filter((e) => e.day === 'Today');
  const plansTonight = tonightEvents.length + weekendEvents.filter((e) => e.day === 'Sat' || e.day === 'Sat–Sun').length;

  const posts = useMemo(() => {
    const all: Post[] = [...data.myPosts, ...POSTS];
    const interestRank = (p: Post) => (settings.interests.some((i) => p.topic.toLowerCase().includes(i) || (i === 'food' && FOOD_TOPICS.includes(p.topic))) ? 1 : 0);
    let list = tab === 'near' ? all.filter((p) => p.area === homeName || NEIGHBOURHOODS.find((n) => n.name === p.area)?.zone === 'West') : all;
    if (show === 'trending') list = list.filter((p) => p.trending || p.upvotes > 40).sort((a, b) => b.upvotes - a.upvotes);
    else if (show === 'questions') list = list.filter((p) => p.type === 'question');
    else list = [...list].sort((a, b) => Number(b.authorId === 'me') - Number(a.authorId === 'me') || interestRank(b) - interestRank(a));
    return list;
  }, [tab, show, data.myPosts, homeName, settings.interests]);

  const friendsCheckIns = useMemo(() => [...data.myCheckIns, ...friendFeed(data)], [data]);
  const mustTries = useMemo(() => friendsMustTries(data), [data]);
  const plans = useMemo(() => planTogether(data), [data]);
  const myClubs = useMemo(() => [...data.myClubs, ...GROUPS].filter((g) => data.joinedGroups.includes(g.id)), [data.myClubs, data.joinedGroups]);
  const clubMeetups = useMemo(
    () => myClubs.flatMap((g) => [...(data.myMeetups[g.id] ?? []), ...(g.meetups ?? [])].map((m) => ({ club: g, m }))),
    [myClubs, data.myMeetups],
  );
  const clubBuys = useMemo(() => myClubs.flatMap((g) => [...(data.myBuys[g.id] ?? []), ...(g.buys ?? [])].map((b) => ({ club: g, b }))), [myClubs, data.myBuys]);

  const meetupRow = (club: Group, m: Meetup) => {
    const inIt = has('joinedMeetups', m.id);
    const going = inIt ? Array.from(new Set(['me', ...m.going])) : m.going;
    return (
      <div key={m.id} className="club-line">
        <Link to={`/clubs/${club.id}`} className="club-line__main">
          <span className={`tile tile--round tone-${club.tone}`}>
            <NamedGlyph name={club.glyph} size={18} duo />
          </span>
          <span className="stack grow" style={{ gap: 1, minWidth: 0 }}>
            <span className="strong truncate" style={{ fontSize: '0.875rem' }}>
              {m.title}
            </span>
            <span className="meta truncate">
              {club.name} · {m.when}
            </span>
            <span className="row" style={{ gap: 6 }}>
              <FaceStack ids={going} size={18} />
              <span className="meta">
                {going.length}
                {m.spots ? ` of ${m.spots}` : ''} in
              </span>
            </span>
          </span>
        </Link>
        <button type="button" className={`chip${inIt ? ' chip--soft' : ''}`} style={{ height: 30, padding: '0 11px' }} aria-pressed={inIt} onClick={() => toggle('joinedMeetups', m.id)}>
          {inIt ? <CheckGlyph size={14} /> : null}
          {inIt ? t('home.clubs.in') : t('home.clubs.join')}
        </button>
      </div>
    );
  };
  const buyRow = (club: Group, b: GroupBuy) => {
    const inIt = has('joinedBuys', b.id);
    const count = Math.min(b.target, b.joined.length + (inIt && !b.joined.includes('me') ? 1 : 0));
    return (
      <Link key={b.id} to={`/clubs/${club.id}`} className="club-buy">
        <span className="eyebrow" style={{ color: 'var(--accent)' }}>
          {t('home.clubs.buying')} · {club.name}
        </span>
        <span className="strong" style={{ fontSize: '0.9375rem' }}>
          {b.title}
        </span>
        <span className="club-buy__bar" aria-hidden="true">
          <span style={{ width: `${(count / b.target) * 100}%` }} />
        </span>
        <span className="meta">
          {t('home.clubs.buyProgress', { n: count, total: b.target })} · {b.ends}
        </span>
      </Link>
    );
  };
  const clubsSection =
    clubMeetups.length > 0 ? (
      <section key="clubs-week" className="section" aria-labelledby="clubs-week-title">
        <SectionHead id="clubs-week-title" title={t('home.clubs.week')} to="/clubs" />
        <div>{clubMeetups.slice(0, 3).map(({ club, m }) => meetupRow(club, m))}</div>
      </section>
    ) : null;

  const onAsk = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/ask?q=${encodeURIComponent(q)}` : '/ask');
  };

  const weekendSection = (
    <section aria-labelledby="weekend-title" className="section" key="weekend">
      <SectionHead id="weekend-title" title={t('home.weekend')} to={`/ask?q=${encodeURIComponent("What's happening this weekend?")}`} linkLabel={t('common.seeAll')} />
      <p className="meta" style={{ marginTop: -6 }}>
        {t('home.weekendSub')}
      </p>
      <div className="hscroll">
        {weekendEvents.map((e) => (
          <EventTile key={e.id} event={e} />
        ))}
      </div>
    </section>
  );

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

  // A friend's check-in that is not already in the must-tries row, for variety further down.
  const friendCard = friendFeed(data).find((c) => c.verdict !== 'must') ?? friendFeed(data)[0];

  const feed: ReactNode[] = [];
  if (tab === 'friends') {
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
  } else if (topic === 'all') {
    posts.forEach((p, i) => {
      feed.push(<PostCard key={p.id} post={p} />);
      if (i === 0 && alerts[0])
        feed.push(
          <div key={`alert-${alerts[0].id}`}>
            <AlertCard alert={alerts[0]} />
          </div>,
        );
      if (i === 0 && tab === 'for-you' && mustTriesSection) feed.push(mustTriesSection);
      if (i === 1 && tab === 'for-you') feed.push(weekendSection);
      if (i === 1 && tab === 'for-you' && clubsSection) feed.push(clubsSection);
      if (i === 2 && tab === 'for-you' && clubBuys[0]) feed.push(buyRow(clubBuys[0].club, clubBuys[0].b));
      if (i === 3 && tab === 'for-you' && friendCard) feed.push(<CheckInCard key={`friend-${friendCard.id}`} c={friendCard} />);
      if (i === 4 && tab === 'for-you' && plans.length) feed.push(<PlanTogetherCard key="plans" plans={plans} />);
      if (i === 5 && tab === 'for-you')
        feed.push(
          <section key="groups" className="section" aria-labelledby="groups-title">
            <SectionHead id="groups-title" title={t('discover.explore.clubs')} to="/clubs" />
            {GROUPS.filter((g) => !data.joinedGroups.includes(g.id))
              .slice(0, 2)
              .map((g) => (
                <GroupRow key={g.id} group={g} />
              ))}
          </section>,
        );
    });
  } else if (topic === 'food') {
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
    if (mustTriesSection) feed.push(mustTriesSection);
    posts.filter((p) => FOOD_TOPICS.includes(p.topic)).forEach((p) => feed.push(<PostCard key={p.id} post={p} />));
  } else if (topic === 'events') {
    if (tonightEvents.length)
      feed.push(
        <section key="tonight" className="section" aria-labelledby="tonight-title">
          <SectionHead id="tonight-title" title="Tonight" to="/explore/events" />
          <div className="hscroll">
            {tonightEvents.map((e) => (
              <EventTile key={e.id} event={e} />
            ))}
          </div>
        </section>,
      );
    feed.push(weekendSection);
  } else if (topic === 'clubs') {
    if (clubsSection) feed.push(clubsSection);
    clubBuys.forEach(({ club, b }) => feed.push(buyRow(club, b)));
    posts.filter((p) => p.groupId && data.joinedGroups.includes(p.groupId)).forEach((p) => feed.push(<PostCard key={p.id} post={p} />));
  } else if (topic === 'alerts') {
    if (alerts.length === 0)
      feed.push(
        <EmptyState
          key="none"
          glyph="alert"
          title="All quiet near you"
          body="No city updates match your settings right now."
          action={
            <Link className="btn btn--soft btn--sm" to="/settings/alerts">
              Alert settings
            </Link>
          }
        />,
      );
    alerts.forEach((a) =>
      feed.push(
        <div key={a.id}>
          <AlertCard alert={a} />
        </div>,
      ),
    );
  }

  return (
    <>
      <main className="page home">
        <header className="home-header">
          <Link to="/" className="home-brand" aria-label="Nearhood home">
            <Logo size={30} />
            <Wordmark size={22} />
          </Link>
          <span className="grow" />
          <Link to="/updates" className="icon-btn" aria-label={`${t('nav.updates')}${unread ? `, ${unread} unread` : ''}`}>
            <BellGlyph size={19} ringing={unread > 0} />
            {unread > 0 ? <span className="dot-badge" /> : null}
          </Link>
          <Link to="/messages" className="icon-btn" aria-label={`${t('nav.messages')}${unreadChats ? `, ${unreadChats} unread` : ''}`}>
            <ChatGlyph size={19} typing={unreadChats > 0} />
          </Link>
        </header>
        <button type="button" className="home-location" onClick={() => setPlaceSheet(true)} aria-label={`Neighbourhood: ${homeName}, ${settings.location.city}. Change`}>
          <PinGlyph size={15} />
          {homeName}, {settings.location.city}
          <ChevronDownGlyph size={14} />
        </button>

        <h1 className="hero-title">
          {t('home.hero')}
          <SparkleMark size={22} className="hero-title__spark" />
        </h1>

        <form onSubmit={onAsk} role="search">
          <label className="ask-field" htmlFor="ask">
            <SparkGlyph size={19} />
            <input id="ask" type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('home.askAnything')} autoComplete="off" enterKeyHint="search" />
            <button type="submit" className="icon-btn icon-btn--accent" style={{ width: 38, height: 38, borderRadius: 12 }} aria-label={t('common.search')}>
              <ArrowRightGlyph size={18} />
            </button>
          </label>
        </form>

        <FriendStrip />

        <section className="card today-card" aria-label={todayLabel()}>
          <Link to="/city" className="today-card__main">
            <WeatherGlyph condition={pulse.weather.condition} size={30} />
            <span className="stack" style={{ gap: 0 }}>
              <span className="meta">{todayLabel()}</span>
              <span className="display" style={{ fontSize: '1rem', fontWeight: 800 }}>
                {CONDITION_LABEL[pulse.weather.condition]} · {pulse.weather.temp}°
              </span>
            </span>
          </Link>
          <Link to={`/ask?q=${encodeURIComponent('Things to do tonight')}`} className="today-card__plans">
            {t('home.plansTonight', { n: plansTonight })}
            <ChevronRightGlyph size={16} />
          </Link>
        </section>

        <div className="home-tabs">
          <div className="tabs grow" role="tablist" aria-label="Feed">
            {TABS.map((x) => (
              <button key={x.id} type="button" role="tab" className="tab" aria-selected={tab === x.id} onClick={() => setTab(x.id)}>
                {t(x.key)}
              </button>
            ))}
          </div>
          <button type="button" className="icon-btn icon-btn--ghost home-tabs__filter" aria-label={t('home.filter')} aria-haspopup="dialog" onClick={() => setFilterSheet(true)}>
            <SlidersGlyph size={20} />
            {filtered ? <span className="dot-badge" style={{ top: 8, right: 8 }} /> : null}
          </button>
        </div>

        {filtered && tab !== 'friends' ? (
          <div className="row row--wrap" style={{ gap: 8 }}>
            {topic !== 'all' ? (
              <button type="button" className="chip chip--soft" onClick={() => setTopic('all')}>
                {t(TOPICS.find((x) => x.id === topic)!.key)} ×
              </button>
            ) : null}
            {show !== 'latest' ? (
              <button type="button" className="chip chip--soft" onClick={() => setShow('latest')}>
                {show === 'trending' ? t('feed.trending') : t('feed.questions')} ×
              </button>
            ) : null}
          </div>
        ) : null}

        {feed.length ? <div className="feed">{feed}</div> : <EmptyState glyph="question" title={t('home.empty')} body="Ask a question and neighbours will chip in." />}
      </main>

      <Sheet open={filterSheet} onClose={() => setFilterSheet(false)} title={t('home.filter')}>
        <span className="field__label">{t('home.topic')}</span>
        <div className="chip-wrap">
          {TOPICS.map((c) => (
            <button key={c.id} type="button" className="chip" aria-pressed={topic === c.id} onClick={() => setTopic(c.id)}>
              {t(c.key)}
            </button>
          ))}
        </div>
        <span className="field__label">{t('home.show')}</span>
        <Segmented
          label={t('home.show')}
          value={show}
          onChange={setShow}
          options={[
            { value: 'latest', label: t('home.latest') },
            { value: 'trending', label: t('feed.trending') },
            { value: 'questions', label: t('feed.questions') },
          ]}
        />
        <button type="button" className="btn btn--primary btn--block" onClick={() => setFilterSheet(false)}>
          {t('common.done')}
        </button>
      </Sheet>

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
