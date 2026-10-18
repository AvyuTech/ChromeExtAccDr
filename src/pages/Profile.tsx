import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { ShareButton } from '../components/cards';
import { CheckInCard, CheckInGrid, CollectionCard, FollowButton, TasteMatchPill } from '../components/friends';
import { chatLink, DoneRing, PlanCard, ProfileHero, TabStrip, ViewToggle, WantRow } from '../components/people';
import { EmptyState, PageHeader } from '../components/ui';
import { PEOPLE } from '../data/core';
import { useT } from '../i18n';
import { ChatGlyph, LockGlyph, ShieldGlyph, UsersGlyph } from '../icons';
import { compact } from '../lib/format';
import { allCheckIns, canSee, collectionsFor, isFollowing, profileInfo, sharedWants } from '../lib/friends';
import { useAppData } from '../state/appData';

type Tab = 'checkins' | 'want' | 'lists';
const TABS: Tab[] = ['checkins', 'want', 'lists'];

const TASTE_LABEL: Record<string, string> = {
  cafes: 'Cafés',
  brunch: 'Brunch',
  korean: 'Korean',
  gujarati: 'Gujarati food',
  'street food': 'Street food',
  heritage: 'Heritage',
  sports: 'Sports',
  getaways: 'Getaways',
  workshops: 'Workshops',
  kids: 'Kids & family',
  nature: 'Parks & lakes',
  wellness: 'Wellness',
  shopping: 'Shopping',
  family: 'Family outings',
};

export default function Profile() {
  const { id = '' } = useParams();
  const t = useT();
  const [params, setParams] = useSearchParams();
  const { data } = useAppData();
  const [view, setView] = useState<'grid' | 'list'>('grid');

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

  const stats = [
    { label: t('people.checkins'), value: info.checkIns },
    { label: t('people.places'), value: info.places },
    { label: t('people.followers'), value: info.followers + (following ? 1 : 0) },
    { label: t('people.following'), value: info.following },
  ];

  return (
    <>
      <PageHeader title={p.name} sub={`@${info.handle}`} fallback="/friends" actions={<ShareButton title={`${p.name} on Nearhood`} path={`/people/${id}`} />} />
      <main className="page page--with-header">
        <ProfileHero
          who={p}
          label={p.name}
          name={p.name}
          sub={`@${info.handle} · ${t('people.since', { year: info.since })}`}
          place={p.area}
          badges={
            <>
              {info.followsMe ? <span className="badge tone-mint">{t('people.followsYou')}</span> : null}
              <TasteMatchPill personId={id} />
              {p.badge ? (
                <span className="badge tone-blue">
                  <UsersGlyph size={14} /> {p.badge}
                </span>
              ) : null}
              {p.verified ? (
                <span className="badge tone-mint">
                  <ShieldGlyph size={14} /> Verified
                </span>
              ) : null}
            </>
          }
          bio={info.bio}
          actions={
            <>
              <Link to={chatLink(id)} className="icon-btn" aria-label={t('people.message')}>
                <ChatGlyph size={20} />
              </Link>
              <FollowButton personId={id} size="md" />
            </>
          }
          stats={stats.map((st) => ({ label: st.label, value: compact(st.value) }))}
        />

        {info.tasteTags.length ? (
          <section className="taste-row" aria-label={`${first} is into`}>
            <span className="eyebrow muted">{t('people.taste')}</span>
            <div className="chip-row">
              {info.tasteTags.map((tag) => (
                <span key={tag} className="chip chip--static">
                  {TASTE_LABEL[tag] ?? tag}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {shared.length ? (
          <section className="section" aria-label={t('people.bothWant')}>
            <PlanCard personId={id} items={shared} />
          </section>
        ) : null}

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

        <div id="profile-panel" role="tabpanel" aria-labelledby={`profile-tab-${tab}`} className="stack stack--lg">
          {tab === 'checkins' ? (
            <>
              {visible.length ? (
                <div className="row row--between">
                  <span className="meta strong">
                    {visible.length} {visible.length === 1 ? 'check-in' : 'check-ins'}
                  </span>
                  <ViewToggle value={view} onChange={setView} />
                </div>
              ) : null}
              {view === 'grid' && visible.length ? <CheckInGrid items={visible} /> : visible.map((c) => <CheckInCard key={c.id} c={c} />)}
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
                <div className="row">
                  <DoneRing done={done.length} total={list.length} />
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
    </>
  );
}
