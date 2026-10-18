import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { placePhoto } from '../assets/photos';
import { Cover } from '../components/cards';
import { CheckInCard, CheckInGrid, CollectionCard } from '../components/friends';
import { DoneRing, myClubs, ProfileAbout, ProfileHero, TabStrip, useListEdits, ViewToggle, WantRow } from '../components/people';
import { ActionBar, IconButton, MainAction } from '../components/entity';
import { ShareSheet } from '../components/share';
import { EmptyState, Sheet } from '../components/ui';
import { REPORTS } from '../data/city';
import { PEOPLE, neighbourhoodName } from '../data/core';
import { HELPFUL, helpfulOf } from '../data/helpful';
import { PLACES } from '../data/places';
import { pagesRunBy } from '../lib/places';
import type { WantItem } from '../data/types';
import { useT } from '../i18n';
import {
  BellGlyph,
  ChatGlyph,
  CheckGlyph,
  ChevronRightGlyph,
  EditGlyph,
  FriendsGlyph,
  GroupsGlyph,
  HelpGlyph,
  InfoGlyph,
  LockGlyph,
  LogoutGlyph,
  MenuGlyph,
  PlusGlyph,
  ReportGlyph,
  SaveGlyph,
  ShareGlyph,
  ShieldGlyph,
  SlidersGlyph,
  StarGlyph,
  UpvoteGlyph,
} from '../icons';
import { compact } from '../lib/format';
import { collectionFor, collectionsFor, isWanted, profileInfo } from '../lib/friends';
import { unreadMessageCount, unreadNotificationCount } from '../lib/selectors';
import { useAppData } from '../state/appData';
import { useSettings } from '../state/settings';
import { useToast } from '../state/toast';
import { GlyphTile, SettingLink } from './settings/parts';

type Tab = 'checkins' | 'want' | 'lists';
const TABS: Tab[] = ['checkins', 'want', 'lists'];

export default function Me() {
  const t = useT();
  const navigate = useNavigate();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const { settings, update } = useSettings();
  const { data, toggleWant, setWantDone, removeWant, addCollection } = useAppData();
  const clubs = myClubs(data);
  const { apply } = useListEdits();
  const [confirm, setConfirm] = useState(false);
  const [menu, setMenu] = useState(false);
  const [about, setAbout] = useState(false);
  const [sharing, setSharing] = useState(false);
  const myPages = pagesRunBy('me');
  const [view, setView] = useState<'grid' | 'list'>('grid');
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
  const area = neighbourhoodName(settings.location.home);
  const myReports = [...data.myReports, ...REPORTS.filter((r) => r.mine)];
  const savedCount = data.savedPlaces.length + data.savedEvents.length + data.savedPosts.length;
  const unread = unreadNotificationCount(settings, data);
  const unreadChats = unreadMessageCount(data);

  const want = data.wantToTry;
  const wantOpen = want.filter((w) => !w.done);
  const wantDone = want.filter((w) => w.done);
  const visibility = settings.privacy.listVisibility;

  const myLists = collectionsFor(data, 'me').map(apply);
  const followedLists = data.followedCollections.map((id) => collectionFor(data, id)).filter((c): c is NonNullable<typeof c> => !!c);

  // Your check-ins are the ones on this device, so the count, the grid and the empty state agree.
  const checkIns = data.myCheckIns.length;

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
        <header className="row row--between" style={{ minHeight: 40, marginBottom: -4 }}>
          <span className="me-title">
            <h1 className="page-title" style={{ fontSize: '1.375rem' }}>
              {t('nav.me')}
            </h1>
            <span className="meta">@{profile.handle}</span>
          </span>
          <div className="row" style={{ gap: 0, marginRight: -8 }}>
            <Link to="/friends" className="icon-btn icon-btn--ghost" aria-label={t('people.friends')}>
              <FriendsGlyph size={21} />
            </Link>
            <Link to="/updates" className="icon-btn icon-btn--ghost" aria-label={`${t('nav.updates')}${unread ? `, ${t('me.unread', { n: unread })}` : ''}`}>
              <BellGlyph size={21} ringing={unread > 0} />
              {unread > 0 ? <span className="count-badge">{unread}</span> : null}
            </Link>
            <button type="button" className="icon-btn icon-btn--ghost" aria-label={t('me.menu')} aria-haspopup="dialog" onClick={() => setMenu(true)}>
              <MenuGlyph size={22} />
            </button>
          </div>
        </header>

        <ProfileHero
          who={me}
          label={profile.name}
          name={profile.name}
          area={area}
          online
          bio={profile.bio || undefined}
          followers={{ label: t('people.followers').toLowerCase(), value: compact(info.followers), to: '/friends' }}
          helpful={{ label: 'helpful', value: compact(helpfulOf('me').lifetime), to: '/me/impact' }}
          minor={[
            { label: t('people.following').toLowerCase(), value: compact(data.following.length), to: '/friends?tab=following' },
            { label: checkIns === 1 ? 'check-in' : t('people.checkins').toLowerCase(), value: checkIns },
          ]}
          level={{ to: '/me/impact' }}
          actions={
            <ActionBar label="Your profile">
              <MainAction to="/settings/account" label={t('me.editProfile')} icon={<EditGlyph size={15} />} pressed />
              <IconButton onClick={() => setSharing(true)} label="Share profile" icon={<ShareGlyph size={17} />} />
            </ActionBar>
          }
        />

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
          ]}
        />

        <div id="me-panel" role="tabpanel" aria-labelledby={`me-tab-${tab}`} className="stack">
          {tab === 'checkins' ? (
            data.myCheckIns.length ? (
              <>
                <div className="row row--between checkin-count">
                  <span className="meta strong">
                    {data.myCheckIns.length} {data.myCheckIns.length === 1 ? 'check-in' : 'check-ins'}
                  </span>
                  <ViewToggle value={view} onChange={setView} />
                </div>
                {view === 'grid' ? (
                  <CheckInGrid items={data.myCheckIns} />
                ) : (
                  <div className="feed">
                    {data.myCheckIns.map((c) => (
                      <CheckInCard key={c.id} c={c} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                glyph="checkin"
                title={t('people.firstCheckin')}
                body={t('people.firstCheckinBody')}
                action={
                  <Link to="/checkin" className="btn btn--primary btn--sm">
                    <PlusGlyph size={13} />
                    Check in
                  </Link>
                }
              />
            )
          ) : null}

          {tab === 'want' ? (
            <>
              <div className="row">
                <DoneRing done={wantDone.length} total={want.length} size={40} />
                <div className="stack grow" style={{ gap: 2 }}>
                  <span className="strong">{t('people.doneOf', { done: wantDone.length, total: want.length })}</span>
                  <Link to="/settings/privacy" className="meta row" style={{ gap: 5, textDecoration: 'none' }}>
                    <LockGlyph size={13} />
                    {visibility === 'everyone' ? t('people.visibleEveryone') : visibility === 'friends' ? t('people.visibleFriends') : t('people.visibleMe')}
                  </Link>
                </div>
              </div>

              <form className="want-add" onSubmit={addItem} aria-label={t('people.addToList')}>
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
                <button type="submit" className="btn btn--primary btn--sm" disabled={!title.trim()}>
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

        </div>

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
                    <Cover src={placePhoto(p.id)} glyph={p.glyph} tone={p.tone} className="pick-thumb" />
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

      <Sheet open={menu} onClose={() => setMenu(false)} title={t('me.menu')}>
        <div className="me-menu" onClick={(e) => (e.target as HTMLElement).closest('a') && setMenu(false)}>
        {myPages.length ? (
          <section className="set-group" aria-labelledby="me-pages">
            <h2 className="set-group__title" id="me-pages">
              Pages you run
            </h2>
            <div className="list list--grouped">
              {myPages.map((p) => (
                <Link key={p.id} to={`/place/${p.id}/manage`} className="list-row">
                  <img className="me-page__photo" src={data.pageEdits[p.id]?.cover ?? placePhoto(p.id)} alt="" />
                  <span className="list-row__body">
                    <span className="list-row__title">{p.name}</span>
                    <span className="list-row__meta">
                      {p.kind} · {p.origin.claimed?.role}
                    </span>
                  </span>
                  <ChevronRightGlyph size={16} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          </section>
        ) : null}
        <section className="set-group" aria-labelledby="me-stuff">
          <h2 className="set-group__title" id="me-stuff">
            {t('me.shortcuts')}
          </h2>
          <div className="list list--grouped">
            <button
              type="button"
              className="list-row"
              onClick={() => {
                setMenu(false);
                setAbout(true);
              }}
            >
              <GlyphTile G={ShieldGlyph} />
              <span className="list-row__body">
                <span className="list-row__title">About you</span>
                <span className="list-row__meta">How others see you: checks, topics, clubs</span>
              </span>
              <ChevronRightGlyph size={16} style={{ color: 'var(--muted)', flexShrink: 0 }} />
            </button>
            <SettingLink to="/me/impact" G={UpvoteGlyph} title="Your impact" trail={<span className="set-trail">{HELPFUL.me.lifetime}</span>} />
            <SettingLink to="/heroes" G={StarGlyph} title="City heroes" />
            <SettingLink to="/me/saved" G={SaveGlyph} tone="violet" title={t('me.saved')} trail={<span className="set-trail">{savedCount}</span>} />
            <SettingLink to="/friends" G={FriendsGlyph} tone="mint" title={t('people.friends')} trail={<span className="set-trail">{data.following.length}</span>} />
            <SettingLink to="/city/reports" G={ReportGlyph} tone="amber" title={t('me.myReports')} trail={<span className="set-trail">{myReports.length}</span>} />
            <SettingLink to="/clubs" G={GroupsGlyph} tone="teal" title={t('me.groups')} trail={<span className="set-trail">{data.joinedGroups.length}</span>} />
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
          <div className="list list--grouped">
            <SettingLink to="/settings" G={SlidersGlyph} tone="violet" title={t('settings.title')} />
            <SettingLink to="/settings/help" G={HelpGlyph} tone="yellow" title={t('settings.help')} />
            <SettingLink to="/settings/about" G={InfoGlyph} tone="blue" title={t('settings.about')} />
            <button
              type="button"
              className="list-row"
              onClick={() => {
                setMenu(false);
                setConfirm(true);
              }}
            >
              <GlyphTile G={LogoutGlyph} tone="red" />
              <span className="list-row__body">
                <span className="list-row__title" style={{ color: 'var(--red-ink)' }}>
                  {t('settings.signOut')}
                </span>
              </span>
            </button>
          </div>
        </section>
        </div>
      </Sheet>

      <ShareSheet open={sharing} onClose={() => setSharing(false)} title="your profile" path="/people/me" message={`Find me on Nearhood: ${profile.name}`} />
      <ProfileAbout
        open={about}
        onClose={() => setAbout(false)}
        personId="me"
        name={profile.name}
        area={area}
        since={info.since}
        tasteTags={info.tasteTags}
        clubs={clubs}
        adminIds={clubs.filter((g) => g.admins.includes('me')).map((g) => g.id)}
      />

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
