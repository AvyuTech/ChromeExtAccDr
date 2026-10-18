import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { CheckInCard, CheckInGrid, CollectionCard, FollowButton, useFollow } from '../components/friends';
import { chatLink, clubsOf, DoneRing, PlanCard, ProfileAbout, ProfileAction, ProfileHero, TabStrip, ViewToggle, WantRow } from '../components/people';
import { ShareSheet } from '../components/share';
import { EmptyState, PageHeader, Sheet } from '../components/ui';
import { PEOPLE } from '../data/core';
import { useT } from '../i18n';
import { ChatGlyph, CheckGlyph, FlagGlyph, InfoGlyph, LockGlyph, MoreGlyph, PlusGlyph, ShareGlyph, SkipGlyph, UserGlyph } from '../icons';
import { compact } from '../lib/format';
import { allCheckIns, canSee, collectionsFor, isFollowing, profileInfo, sharedWants } from '../lib/friends';
import { useAppData } from '../state/appData';
import { useToast } from '../state/toast';

type Tab = 'checkins' | 'want' | 'lists';
const TABS: Tab[] = ['checkins', 'want', 'lists'];

/** Follow as a round icon: a person with a plus, or a tick once you follow. */
function FollowAction({ personId }: { personId: string }) {
  const { following, label, flip } = useFollow(personId);
  return (
    <ProfileAction label={label} onClick={flip} pressed={following} primary={!following}>
      <UserGlyph size={18} />
      <span className="profile-action__badge" aria-hidden="true">
        {following ? <CheckGlyph size={9} /> : <PlusGlyph size={9} />}
      </span>
    </ProfileAction>
  );
}

export default function Profile() {
  const { id = '' } = useParams();
  const t = useT();
  const [params, setParams] = useSearchParams();
  const { data } = useAppData();
  const toast = useToast();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [more, setMore] = useState(false);
  const [about, setAbout] = useState(false);
  const [sharing, setSharing] = useState(false);

  if (id === 'me') return <Navigate to="/me" replace />;
  const p = PEOPLE[id];
  if (!p || id === 'ward') {
    return (
      <>
        <PageHeader title={t('people.friends')} fallback="/friends" />
        <main className="page page--with-header">
          <EmptyState
            glyph="friends"
            title={t('people.notFound')}
            body="They may have changed their handle or made their profile private."
            action={
              <Link to="/friends?tab=find" className="btn btn--soft btn--sm">
                {t('people.tab.find')}
              </Link>
            }
          />
        </main>
      </>
    );
  }

  const tab: Tab = TABS.includes(params.get('tab') as Tab) ? (params.get('tab') as Tab) : 'checkins';
  const setTab = (v: Tab) => setParams(v === 'checkins' ? {} : { tab: v }, { replace: true });

  const info = profileInfo(id);
  const first = p.name.split(' ')[0];
  const following = isFollowing(data, id);
  const theirCheckIns = allCheckIns(data).filter((c) => c.authorId === id);
  const visible = theirCheckIns.filter((c) => canSee(data, c));
  const hidden = theirCheckIns.length - visible.length;
  const shared = sharedWants(data, id);
  const list = info.wantToTry;
  const open = list.filter((w) => !w.done);
  const done = list.filter((w) => w.done);
  const lists = collectionsFor(data, id);
  const clubs = clubsOf(id);

  const stats = [
    { label: t('people.checkins'), value: info.checkIns },
    { label: t('people.followers'), value: info.followers + (following ? 1 : 0) },
    { label: t('people.following'), value: info.following },
  ];

  return (
    <>
      <PageHeader title={p.name} sub={`@${info.handle}`} fallback="/friends" />
      <main className="page page--with-header">
        <ProfileHero
          who={p}
          label={p.name}
          name={p.name}
          sub={`@${info.handle} · ${p.area}${info.followsMe ? ` · ${t('people.followsYou')}` : ''}`}
          bio={info.bio}
          onAbout={() => setAbout(true)}
          actions={
            <>
              <FollowAction personId={id} />
              <ProfileAction to={chatLink(id)} label={t('people.message')}>
                <ChatGlyph size={18} />
              </ProfileAction>
              <ProfileAction label="More" ariaLabel={`More about ${first}`} onClick={() => setMore(true)}>
                <MoreGlyph size={18} />
              </ProfileAction>
            </>
          }
          stats={stats.map((st) => ({ label: st.label, value: compact(st.value) }))}
        />

        <TabStrip
          idPrefix="profile"
          label={p.name}
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'checkins', label: t('people.tab.checkins') },
            {
              id: 'want',
              label: (
                <>
                  {t('people.tab.want')} <span className="muted">{open.length}</span>
                </>
              ),
            },
            { id: 'lists', label: t('people.tab.lists') },
          ]}
        />

        <div id="profile-panel" role="tabpanel" aria-labelledby={`profile-tab-${tab}`} className="stack">
          {tab === 'checkins' ? (
            <>
              {visible.length ? (
                <div className="row row--between checkin-count">
                  <span className="meta strong">Recent check-ins</span>
                  <ViewToggle value={view} onChange={setView} />
                </div>
              ) : null}
              {view === 'grid' && visible.length ? (
                <CheckInGrid items={visible} />
              ) : visible.length ? (
                <div className="feed">
                  {visible.map((c) => (
                    <CheckInCard key={c.id} c={c} />
                  ))}
                </div>
              ) : null}
              {hidden > 0 ? (
                <div className="notice locked-note">
                  <LockGlyph size={20} />
                  <div className="stack grow" style={{ gap: 8 }}>
                    <span>
                      <b>{t('people.locked')}.</b>{' '}
                      {following
                        ? `${hidden} more ${hidden === 1 ? 'is' : 'are'} visible once ${first} follows you back.`
                        : info.followsMe
                          ? `Follow ${first} back to see ${hidden} more.`
                          : `Follow ${first}; you’ll see ${hidden} more once they follow you back.`}
                    </span>
                    {following ? null : (
                      <span>
                        <FollowButton personId={id} />
                      </span>
                    )}
                  </div>
                </div>
              ) : null}
              {theirCheckIns.length === 0 ? <EmptyState glyph="checkin" title={t('people.noCheckins')} body={`When ${first} shares what they eat or do, it shows up here.`} /> : null}
            </>
          ) : null}

          {tab === 'want' ? (
            list.length ? (
              <>
                {shared.length ? <PlanCard personId={id} items={shared} /> : null}
                <div className="row">
                  <DoneRing done={done.length} total={list.length} size={40} />
                  <div className="stack grow" style={{ gap: 2 }}>
                    <span className="strong">{t('people.doneOf', { done: done.length, total: list.length })}</span>
                    <span className="meta">Tap the bookmark to copy anything to your own list.</span>
                  </div>
                </div>
                <div className="list">
                  {[...open, ...done].map((w) => (
                    <WantRow key={w.id} item={w} mode="theirs" />
                  ))}
                </div>
              </>
            ) : (
              <EmptyState glyph="todo" title={t('people.emptyWant')} body={`${first} hasn’t added anything to try yet.`} />
            )
          ) : null}

          {tab === 'lists' ? (
            lists.length ? (
              <div className="grid-2 people-list-grid">
                {lists.map((c) => (
                  <CollectionCard key={c.id} col={c} />
                ))}
              </div>
            ) : (
              <EmptyState glyph="lists" title={t('people.emptyLists')} body={`${first} hasn’t made a list yet.`} />
            )
          ) : null}
        </div>
      </main>

      <Sheet open={more} onClose={() => setMore(false)} title={p.name}>
        <div className="list list--grouped">
          <button
            type="button"
            className="list-row"
            onClick={() => {
              setMore(false);
              setSharing(true);
            }}
          >
            <span className="set-tile">
              <ShareGlyph size={17} />
            </span>
            <span className="list-row__body">
              <span className="list-row__title">Share profile</span>
            </span>
          </button>
          <button
            type="button"
            className="list-row"
            onClick={() => {
              setMore(false);
              setAbout(true);
            }}
          >
            <span className="set-tile">
              <InfoGlyph size={17} />
            </span>
            <span className="list-row__body">
              <span className="list-row__title">About {first}</span>
            </span>
          </button>
        </div>
        <div className="list list--grouped">
          <button
            type="button"
            className="list-row"
            onClick={() => {
              setMore(false);
              toast(`Thanks. A moderator will look at ${first}’s profile.`);
            }}
          >
            <span className="set-tile">
              <FlagGlyph size={17} />
            </span>
            <span className="list-row__body">
              <span className="list-row__title">Report profile</span>
            </span>
          </button>
          <button
            type="button"
            className="list-row"
            onClick={() => {
              setMore(false);
              toast(`${first} is blocked. They can’t see your check-ins or message you.`);
            }}
          >
            <span className="set-tile">
              <SkipGlyph size={17} />
            </span>
            <span className="list-row__body">
              <span className="list-row__title" style={{ color: 'var(--red-ink)' }}>
                Block {first}
              </span>
            </span>
          </button>
        </div>
      </Sheet>

      <ShareSheet open={sharing} onClose={() => setSharing(false)} title={p.name} path={`/people/${id}`} message={`Have a look at ${p.name} on Nearhood`} />
      <ProfileAbout
        open={about}
        onClose={() => setAbout(false)}
        personId={id}
        name={p.name}
        area={p.area}
        since={info.since}
        followsMe={info.followsMe}
        tasteTags={info.tasteTags}
        clubs={clubs.map((c) => c.club)}
        adminIds={clubs.filter((c) => c.admin).map((c) => c.club.id)}
      />
    </>
  );
}
