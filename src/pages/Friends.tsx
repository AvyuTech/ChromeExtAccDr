import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { scenePhoto } from '../assets/photos';
import { CheckInCard, PersonCard, PersonRow } from '../components/friends';
import { coverPhoto, PlanCard, shareOrCopy, TabStrip } from '../components/people';
import { EmptyState, PageHeader, SectionHead } from '../components/ui';
import { PEOPLE } from '../data/core';
import type { CheckIn, WantItem } from '../data/types';
import { useT } from '../i18n';
import { FriendsGlyph, LinkGlyph, SearchGlyph } from '../icons';
import { friendFeed, isFriend, planTogether, profileInfo, suggestions } from '../lib/friends';
import { useAppData } from '../state/appData';
import { useSettings } from '../state/settings';
import { useToast } from '../state/toast';

type Tab = 'activity' | 'following' | 'find';
const TABS: Tab[] = ['activity', 'following', 'find'];

function matches(id: string, q: string) {
  const query = q.trim().toLowerCase().replace(/^@/, '');
  if (!query) return true;
  const p = PEOPLE[id];
  const info = profileInfo(id);
  return `${p?.name ?? ''} ${info.handle} ${p?.area ?? ''}`.toLowerCase().includes(query);
}

export default function Friends() {
  const t = useT();
  const [params, setParams] = useSearchParams();
  const tab: Tab = TABS.includes(params.get('tab') as Tab) ? (params.get('tab') as Tab) : 'activity';
  const setTab = (v: Tab) => setParams(v === 'activity' ? {} : { tab: v }, { replace: true });
  const { data } = useAppData();
  const { settings } = useSettings();
  const toast = useToast();

  // Keep rows in place after an unfollow, so a mis-tap is easy to undo.
  const [followingSnapshot] = useState(() => data.following);
  const [followQuery, setFollowQuery] = useState('');
  const [findQuery, setFindQuery] = useState('');
  const [showAllPlans, setShowAllPlans] = useState(false);

  const feed = friendFeed(data);
  const groups: Array<{ key: string; items: CheckIn[] }> = [
    { key: 'people.today', items: feed.filter((c) => c.recency === 0) },
    { key: 'people.thisWeek', items: feed.filter((c) => c.recency === 1) },
    { key: 'people.earlier', items: feed.filter((c) => c.recency === 2) },
  ];

  // One plan card per friend, listing everything you both want.
  const plans = useMemo(() => {
    const byPerson = new Map<string, WantItem[]>();
    for (const p of planTogether(data)) byPerson.set(p.personId, [...(byPerson.get(p.personId) ?? []), p.item]);
    return [...byPerson.entries()];
  }, [data]);

  const followingList = Array.from(new Set([...followingSnapshot, ...data.following])).filter((id) => PEOPLE[id] && matches(id, followQuery));
  const everyone = Object.keys(PEOPLE).filter((id) => id !== 'me' && id !== 'ward' && matches(id, findQuery));
  const suggested = suggestions(data, settings);

  const invite = async () => {
    const url = `${window.location.origin}${window.location.pathname}#/onboarding`;
    const res = await shareOrCopy(`Join me on Nearhood: see what friends in Ahmedabad eat and do. I'm @${settings.profile.handle}.`, url);
    if (res === 'copied') toast('Invite link copied');
    else if (res === 'failed') toast('Could not share right now');
  };

  return (
    <>
      <PageHeader
        title={t('people.friends')}
        fallback="/"
        actions={
          tab !== 'find' ? (
            <button type="button" className="icon-btn" aria-label={t('people.tab.find')} onClick={() => setTab('find')}>
              <FriendsGlyph size={20} />
            </button>
          ) : undefined
        }
      />
      <main className="page page--with-header">
        <TabStrip
          idPrefix="friends"
          label={t('people.friends')}
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'activity', label: t('people.tab.activity') },
            {
              id: 'following',
              label: (
                <>
                  {t('people.tab.following')} <span className="muted">{data.following.length}</span>
                </>
              ),
            },
            { id: 'find', label: t('people.tab.find') },
          ]}
        />

        <div id="friends-panel" role="tabpanel" aria-labelledby={`friends-tab-${tab}`} className="stack stack--lg">
          {tab === 'activity' ? (
            <>
              {plans.length ? (
                <section className="section" aria-labelledby="plan-title">
                  <SectionHead id="plan-title" title={t('people.planTogether')} />
                  {(showAllPlans ? plans : plans.slice(0, 2)).map(([id, items]) => (
                    <PlanCard key={id} personId={id} items={items} />
                  ))}
                  {plans.length > 2 ? (
                    <button type="button" className="btn btn--ghost btn--sm" style={{ alignSelf: 'center' }} aria-expanded={showAllPlans} onClick={() => setShowAllPlans((v) => !v)}>
                      {showAllPlans ? 'Show fewer' : `Show ${plans.length - 2} more`}
                    </button>
                  ) : null}
                </section>
              ) : null}

              {feed.length === 0 ? (
                <EmptyState
                  glyph="friends"
                  title={t('people.noActivity')}
                  body="Follow people you trust to see what they eat, do and recommend."
                  action={
                    <button type="button" className="btn btn--soft btn--sm" onClick={() => setTab('find')}>
                      {t('people.followSome')}
                    </button>
                  }
                />
              ) : (
                groups
                  .filter((g) => g.items.length)
                  .map((g) => (
                    <section key={g.key} className="section" aria-labelledby={`grp-${g.key}`}>
                      <h2 className="people-group-title" id={`grp-${g.key}`}>
                        {t(g.key)}
                      </h2>
                      {g.items.map((c) => (
                        <CheckInCard key={c.id} c={c} />
                      ))}
                    </section>
                  ))
              )}
            </>
          ) : null}

          {tab === 'following' ? (
            <>
              <label className="search-field" htmlFor="following-q">
                <SearchGlyph size={18} />
                <input
                  id="following-q"
                  type="search"
                  value={followQuery}
                  onChange={(e) => setFollowQuery(e.target.value)}
                  placeholder={t('people.searchFollowing')}
                  autoComplete="off"
                />
              </label>
              {followingList.length ? (
                <div className="list">
                  {followingList.map((id) => {
                    const info = profileInfo(id);
                    return (
                      <PersonRow
                        key={id}
                        personId={id}
                        meta={isFriend(data, id) ? `${t('people.friend')} · @${info.handle}` : `@${info.handle} · ${info.checkIns} check-ins`}
                      />
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  glyph="friends"
                  title={followQuery ? t('people.noMatch') : t('people.followSome')}
                  action={
                    <button type="button" className="btn btn--soft btn--sm" onClick={() => setTab('find')}>
                      {t('people.tab.find')}
                    </button>
                  }
                />
              )}
            </>
          ) : null}

          {tab === 'find' ? (
            <>
              <label className="search-field" htmlFor="find-q">
                <SearchGlyph size={18} />
                <input id="find-q" type="search" value={findQuery} onChange={(e) => setFindQuery(e.target.value)} placeholder={t('people.searchAll')} autoComplete="off" />
              </label>

              {findQuery.trim() ? (
                everyone.length ? (
                  <div className="list">
                    {everyone.map((id) => (
                      <PersonRow key={id} personId={id} />
                    ))}
                  </div>
                ) : (
                  <EmptyState glyph="friends" title={t('people.noMatch')} body="Try a first name or an @handle." />
                )
              ) : (
                <>
                  <section className="invite-card" aria-labelledby="invite-title">
                    <img className="invite-card__photo" src={scenePhoto('friends')} alt="" />
                    <div className="invite-card__body">
                      <h2 className="invite-card__title" id="invite-title">
                        {t('people.invite')}
                      </h2>
                      <p className="body-sm">{t('people.inviteBody')}</p>
                      <button type="button" className="btn btn--lime" onClick={invite}>
                        <LinkGlyph size={18} />
                        {t('people.shareInvite')}
                      </button>
                    </div>
                  </section>

                  <section className="section" aria-labelledby="suggested-title">
                    <SectionHead id="suggested-title" title={t('people.suggested')} />
                    {suggested.length ? (
                      <div className="hscroll">
                        {suggested.map((s) => (
                          <PersonCard key={s.id} personId={s.id} reason={s.reason} cover={coverPhoto(s.id)} />
                        ))}
                      </div>
                    ) : (
                      <p className="body-sm muted">You already follow everyone we know about. Invite a friend instead.</p>
                    )}
                  </section>
                  <p className="meta" style={{ textAlign: 'center' }}>
                    Looking for your own profile? <Link to="/me">Go to Me</Link>
                  </p>
                </>
              )}
            </>
          ) : null}
        </div>
      </main>
    </>
  );
}
