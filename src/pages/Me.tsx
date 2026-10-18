import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Avatar } from '../components/cards';
import { CheckInCard, CollectionCard } from '../components/friends';
import { DoneRing, TabStrip, useListEdits, WantRow } from '../components/people';
import { EmptyState, Sheet, Tile } from '../components/ui';
import { REPORTS } from '../data/city';
import { PEOPLE, neighbourhoodName } from '../data/core';
import { PLACES } from '../data/places';
import type { WantItem } from '../data/types';
import { useT } from '../i18n';
import {
  BellGlyph,
  ChatGlyph,
  CheckGlyph,
  FriendsGlyph,
  GroupsGlyph,
  HelpGlyph,
  InfoGlyph,
  LockGlyph,
  LogoutGlyph,
  PlusGlyph,
  ReportGlyph,
  SaveGlyph,
  ShieldGlyph,
  SlidersGlyph,
  StepRing,
  UsersGlyph,
} from '../icons';
import { collectionFor, collectionsFor, isFriend, isWanted, profileInfo } from '../lib/friends';
import { unreadMessageCount, unreadNotificationCount } from '../lib/selectors';
import { useAppData } from '../state/appData';
import { useSettings } from '../state/settings';
import { useToast } from '../state/toast';
import { GlyphTile, SettingLink } from './settings/parts';

/* Sample totals from before this device; the person's own activity adds on top. */
const BASE = { helpful: 318 };
const CHAMPION_AT = 3;

type Tab = 'checkins' | 'want' | 'lists' | 'impact';
const TABS: Tab[] = ['checkins', 'want', 'lists', 'impact'];

export default function Me() {
  const t = useT();
  const navigate = useNavigate();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const { settings, update } = useSettings();
  const { data, toggleWant, setWantDone, removeWant, addCollection } = useAppData();
  const { apply } = useListEdits();
  const [confirm, setConfirm] = useState(false);
  const [newList, setNewList] = useState(false);

  // Add-to-list form
  const [kind, setKind] = useState<WantItem['kind']>('place');
  const [title, setTitle] = useState('');

  // New list form
  const [listTitle, setListTitle] = useState('');
  const [listDescription, setListDescription] = useState('');
  const [listPlaces, setListPlaces] = useState<string[]>([]);

  const tab: Tab = TABS.includes(params.get('tab') as Tab) ? (params.get('tab') as Tab) : 'checkins';
  const setTab = (v: Tab) => setParams(v === 'checkins' ? {} : { tab: v }, { replace: true });

  const profile = settings.profile;
  const info = profileInfo('me');
  const me = { ...PEOPLE.me, name: profile.name, initials: (profile.name.trim()[0] ?? 'N').toUpperCase(), verified: profile.verifiedResident };
  const myReports = [...data.myReports, ...REPORTS.filter((r) => r.mine)];
  const fixed = myReports.filter((r) => r.status === 4).length;
  const open = myReports.length - fixed;
  const savedCount = data.savedPlaces.length + data.savedEvents.length + data.savedPosts.length;
  const unread = unreadNotificationCount(settings, data);
  const unreadChats = unreadMessageCount(data);
  const friends = data.following.filter((id) => isFriend(data, id)).length;

  const want = data.wantToTry;
  const wantOpen = want.filter((w) => !w.done);
  const wantDone = want.filter((w) => w.done);
  const visibility = settings.privacy.listVisibility;

  const myLists = collectionsFor(data, 'me').map(apply);
  const followedLists = data.followedCollections.map((id) => collectionFor(data, id)).filter((c): c is NonNullable<typeof c> => !!c);

  const stats = [
    { label: t('people.checkins'), value: data.myCheckIns.length, to: undefined as string | undefined },
    { label: t('people.followers'), value: info.followers, to: '/friends?tab=find' },
    { label: t('people.following'), value: data.following.length, to: '/friends?tab=following' },
    { label: t('me.helpful'), value: BASE.helpful, to: undefined },
  ];

  const addItem = (e: FormEvent) => {
    e.preventDefault();
    const text = title.trim();
    if (!text) return;
    const item: WantItem = { id: `mw-${Date.now()}`, kind, title: text, sub: t(`people.kind.${kind}`) };
    if (isWanted(data, item)) {
      toast('That’s already on your list');
      return;
    }
    toggleWant(item);
    setTitle('');
    toast(`Added "${text}"`);
  };

  const tick = (w: WantItem, done: boolean) => {
    setWantDone(w.id, done);
    if (done) {
      toast(`Done: ${w.title}`, {
        label: 'Check in',
        onClick: () => navigate(w.refId ? `/checkin?place=${encodeURIComponent(w.refId)}` : '/checkin'),
      });
    }
  };

  const createList = (e: FormEvent) => {
    e.preventDefault();
    if (!listTitle.trim()) return;
    const id = `my-${Date.now()}`;
    addCollection({
      id,
      ownerId: 'me',
      title: listTitle.trim(),
      description: listDescription.trim(),
      placeIds: listPlaces,
      followers: 0,
      tone: 'violet',
      glyph: 'lists',
    });
    setNewList(false);
    setListTitle('');
    setListDescription('');
    setListPlaces([]);
    toast('List created');
    navigate(`/lists/${id}`);
  };

  return (
    <>
      <main className="page">
        <header className="row row--between" style={{ minHeight: 44 }}>
          <h1 className="page-title">{t('nav.me')}</h1>
          <div className="row" style={{ gap: 8 }}>
            <Link to="/friends" className="icon-btn" aria-label={t('people.friends')}>
              <FriendsGlyph size={20} />
            </Link>
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
          <div className="profile-actions">
            <Link to="/settings/account" className="btn btn--soft btn--sm">
              {t('me.editProfile')}
            </Link>
            <Link to="/checkin" className="btn btn--primary btn--sm">
              <PlusGlyph size={14} />
              Check in
            </Link>
          </div>
          <dl className="me-stats">
            {stats.map((s) => (
              <div key={s.label} className="me-stat">
                <dt>{s.label}</dt>
                <dd className="num">
                  {s.to ? (
                    <Link to={s.to} className="me-stat__link">
                      {s.value}
                    </Link>
                  ) : (
                    s.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <Link to="/friends?tab=following" className="me-friends-row">
            <FriendsGlyph size={18} duo />
            <span className="grow">
              <b>{friends}</b> {friends === 1 ? 'friend' : 'friends'} · following {data.following.length}
            </span>
            <span className="section__link">{t('people.friends')}</span>
          </Link>
        </section>

        <TabStrip
          idPrefix="me"
          label={t('nav.me')}
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'checkins', label: t('people.tab.checkins') },
            {
              id: 'want',
              label: (
                <>
                  {t('people.tab.want')} <span className="muted">{wantOpen.length}</span>
                </>
              ),
            },
            { id: 'lists', label: t('people.tab.lists') },
            { id: 'impact', label: t('people.tab.impact') },
          ]}
        />

        <div id="me-panel" role="tabpanel" aria-labelledby={`me-tab-${tab}`} className="stack stack--lg">
          {tab === 'checkins' ? (
            data.myCheckIns.length ? (
              data.myCheckIns.map((c) => <CheckInCard key={c.id} c={c} />)
            ) : (
              <EmptyState
                glyph="checkin"
                title={t('people.firstCheckin')}
                body={t('people.firstCheckinBody')}
                action={
                  <Link to="/checkin" className="btn btn--primary btn--sm">
                    <PlusGlyph size={14} />
                    Check in
                  </Link>
                }
              />
            )
          ) : null}

          {tab === 'want' ? (
            <>
              <div className="row">
                <DoneRing done={wantDone.length} total={want.length} />
                <div className="stack grow" style={{ gap: 2 }}>
                  <span className="strong">{t('people.doneOf', { done: wantDone.length, total: want.length })}</span>
                  <Link to="/settings/privacy" className="meta row" style={{ gap: 5, textDecoration: 'none' }}>
                    <LockGlyph size={13} />
                    {visibility === 'everyone' ? t('people.visibleEveryone') : visibility === 'friends' ? t('people.visibleFriends') : t('people.visibleMe')}
                  </Link>
                </div>
              </div>

              <form className="card want-add" onSubmit={addItem} aria-label={t('people.addToList')}>
                <label className="field" style={{ flex: '0 0 auto' }}>
                  <span className="sr-only">{t('people.kind')}</span>
                  <select className="select want-add__kind" value={kind} onChange={(e) => setKind(e.target.value as WantItem['kind'])} aria-label={t('people.kind')}>
                    {(['place', 'event', 'dish', 'activity'] as const).map((k) => (
                      <option key={k} value={k}>
                        {t(`people.kind.${k}`)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field grow">
                  <span className="sr-only">{t('people.addToList')}</span>
                  <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('people.addPlaceholder')} maxLength={80} />
                </label>
                <button type="submit" className="btn btn--primary" disabled={!title.trim()}>
                  {t('people.add')}
                </button>
              </form>

              {want.length ? (
                <div className="list">
                  {[...wantOpen, ...wantDone].map((w) => (
                    <WantRow
                      key={w.id}
                      item={w}
                      mode="mine"
                      onToggleDone={(d) => tick(w, d)}
                      onRemove={() => {
                        removeWant(w.id);
                        toast(`Removed "${w.title}"`, { label: 'Undo', onClick: () => toggleWant(w) });
                      }}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState glyph="todo" title={t('people.emptyWant')} body="Add places, dishes and plans you want to get to. Friends can copy them too." />
              )}
            </>
          ) : null}

          {tab === 'lists' ? (
            <>
              <section className="section" aria-labelledby="my-lists">
                <div className="section__head">
                  <h2 className="section__title" id="my-lists">
                    {t('people.yourLists')}
                  </h2>
                  <button type="button" className="btn btn--soft btn--sm" onClick={() => setNewList(true)}>
                    <PlusGlyph size={14} />
                    {t('people.newList')}
                  </button>
                </div>
                {myLists.length ? (
                  <div className="grid-2 people-list-grid">
                    {myLists.map((c) => (
                      <CollectionCard key={c.id} col={c} />
                    ))}
                  </div>
                ) : (
                  <p className="body-sm muted">Group places into a list, like "Sunday brunch" or "Out-of-town guests".</p>
                )}
              </section>
              <section className="section" aria-labelledby="followed-lists">
                <h2 className="section__title" id="followed-lists">
                  {t('people.followedLists')}
                </h2>
                {followedLists.length ? (
                  <div className="grid-2 people-list-grid">
                    {followedLists.map((c) => (
                      <CollectionCard key={c.id} col={c} />
                    ))}
                  </div>
                ) : (
                  <p className="body-sm muted">Follow a friend’s list to keep it here.</p>
                )}
              </section>
            </>
          ) : null}

          {tab === 'impact' ? (
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
          ) : null}
        </div>

        <section className="set-group" aria-labelledby="me-stuff">
          <h2 className="set-group__title" id="me-stuff">
            {t('me.shortcuts')}
          </h2>
          <div className="list">
            <SettingLink to="/me/saved" G={SaveGlyph} tone="violet" title={t('me.saved')} trail={<span className="set-trail">{savedCount}</span>} />
            <SettingLink to="/friends" G={FriendsGlyph} tone="mint" title={t('people.friends')} trail={<span className="set-trail">{data.following.length}</span>} />
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

      <Sheet open={newList} onClose={() => setNewList(false)} title={t('people.newList')}>
        <form className="stack" onSubmit={createList}>
          <label className="field">
            <span className="field__label">{t('people.listTitle')}</span>
            <input className="input" value={listTitle} onChange={(e) => setListTitle(e.target.value)} placeholder="Sunday brunch spots" maxLength={60} required />
          </label>
          <label className="field">
            <span className="field__label">{t('people.listDescription')}</span>
            <input className="input" value={listDescription} onChange={(e) => setListDescription(e.target.value)} placeholder="Where I take friends visiting the city" maxLength={120} />
          </label>
          <fieldset className="stack" style={{ border: 'none', padding: 0, margin: 0, gap: 8 }}>
            <legend className="field__label" style={{ marginBottom: 8 }}>
              {t('people.pickPlaces')} <span className="muted">· {listPlaces.length}</span>
            </legend>
            <div className="list">
              {PLACES.map((p) => {
                const on = listPlaces.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    className="list-row"
                    onClick={() => setListPlaces((xs) => (on ? xs.filter((x) => x !== p.id) : [...xs, p.id]))}
                  >
                    <Tile glyph={p.glyph} tone={p.tone} size="sm" />
                    <span className="list-row__body">
                      <span className="list-row__title">{p.name}</span>
                      <span className="list-row__meta">
                        {p.kind} · {p.area}
                      </span>
                    </span>
                    <span className={`want-check${on ? ' is-on' : ''}`} aria-hidden="true">
                      {on ? <CheckGlyph size={16} /> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
          <button type="submit" className="btn btn--primary btn--block" disabled={!listTitle.trim()}>
            {t('people.createList')}
          </button>
        </form>
      </Sheet>

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
