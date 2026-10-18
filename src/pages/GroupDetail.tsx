import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { groupPhoto } from '../assets/photos';
import { Avatar, PostCard } from '../components/cards';
import { DetailHero } from '../components/discover';
import { EmptyState, PageHeader, SectionHead, Sheet } from '../components/ui';
import { person } from '../data/core';
import { groupById, POSTS } from '../data/social';
import { useT } from '../i18n';
import { CheckGlyph, EditGlyph, LockGlyph, GlobeGlyph, NamedGlyph, PinGlyph } from '../icons';
import { compact } from '../lib/format';
import { DEFAULT_APP_DATA, useAppData } from '../state/appData';
import { useToast } from '../state/toast';

export default function GroupDetail() {
  const { id = '' } = useParams();
  const t = useT();
  const toast = useToast();
  const { data, has, add, remove } = useAppData();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const group = groupById(id);

  if (!group) {
    return (
      <>
        <PageHeader title={t('discover.groups.title')} fallback="/groups" />
        <main className="page page--with-header">
          <EmptyState
            glyph="groups"
            title={t('discover.groups.notFound')}
            action={
              <Link to="/groups" className="btn btn--soft btn--sm">
                {t('discover.groups.title')}
              </Link>
            }
          />
        </main>
      </>
    );
  }

  const joined = has('joinedGroups', group.id);
  const cover = groupPhoto(group.id);
  const posts = [...data.myPosts, ...POSTS].filter((p) => p.groupId === group.id);
  // Seeded memberships are already part of the sample member counts.
  const members = group.members + (joined ? 1 : 0) - (DEFAULT_APP_DATA.joinedGroups.includes(group.id) ? 1 : 0);

  return (
    <>
      <PageHeader title={group.name} fallback="/groups" />
      <main className="page page--with-header">
        {cover ? (
          <div className="group-cover">
            <DetailHero tone={group.tone} glyph={group.glyph} src={cover} height={220} />
          </div>
        ) : null}
        <section className={`card group-hero glyph-host${cover ? '' : ' group-hero--plain'}`}>
          <span className="group-hero__mark">
            <NamedGlyph name={group.glyph} size={32} live />
          </span>
          <h1 className="detail-title" style={{ fontSize: '1.375rem' }}>
            {group.name}
          </h1>
          <div className="row row--wrap" style={{ justifyContent: 'center', gap: 6 }}>
            <span className="badge">{compact(members)} members</span>
            <span className="badge tone-mint">{group.postsToday} posts today</span>
            <span className="badge" style={{ gap: 5 }}>
              {group.privacy === 'public' ? <GlobeGlyph size={12} /> : <LockGlyph size={12} />}
              {group.privacy === 'public' ? 'Public' : 'Neighbours only'}
            </span>
          </div>
          <span className="meta row" style={{ gap: 4 }}>
            <PinGlyph size={12} />
            {group.area}
          </span>
          <p className="body-sm" style={{ maxWidth: 340 }}>
            {group.description}
          </p>
          <div className="row" style={{ gap: 8, width: '100%' }}>
            {joined ? (
              <button type="button" className="btn btn--secondary grow" aria-pressed onClick={() => setConfirmLeave(true)}>
                <CheckGlyph size={16} />
                {t('common.joined')}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn--primary grow"
                onClick={() => {
                  add('joinedGroups', group.id);
                  toast(`Joined ${group.name}. Its posts now appear in Home`);
                }}
              >
                {t('common.join')}
              </button>
            )}
            <Link to={`/compose?group=${group.id}`} className={`btn grow ${joined ? 'btn--primary' : 'btn--outline'}`}>
              <EditGlyph size={16} />
              {t('discover.groups.postHere')}
            </Link>
          </div>
        </section>

        <section className="card stack" aria-labelledby="rules-title">
          <h2 className="section__title" id="rules-title">
            {t('discover.groups.rules')}
          </h2>
          <ol className="rules">
            {group.rules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
          <hr className="divider" />
          <h3 className="strong" style={{ fontSize: '0.9375rem' }}>
            {t('discover.groups.admins')}
          </h3>
          <div className="row row--wrap" style={{ gap: 14 }}>
            {group.admins.map((a) => {
              const who = person(a);
              return (
                <span key={a} className="row" style={{ gap: 8 }}>
                  <Avatar who={who} size={32} />
                  <span className="stack" style={{ gap: 0 }}>
                    <span className="strong" style={{ fontSize: '0.875rem' }}>
                      {who.name}
                    </span>
                    <span className="meta">{who.area}</span>
                  </span>
                </span>
              );
            })}
          </div>
        </section>

        <section className="section" aria-labelledby="posts-title">
          <SectionHead id="posts-title" title={t('discover.groups.posts')} />
          {posts.length ? (
            posts.map((p) => <PostCard key={p.id} post={p} />)
          ) : (
            <EmptyState
              glyph="question"
              title="No posts yet"
              body="Start the conversation for your neighbours."
              action={
                <Link to={`/compose?group=${group.id}`} className="btn btn--soft btn--sm">
                  {t('discover.groups.postHere')}
                </Link>
              }
            />
          )}
        </section>
      </main>

      <Sheet open={confirmLeave} onClose={() => setConfirmLeave(false)} title={t('discover.groups.leave')}>
        <p className="body-sm">
          You will stop seeing posts from <b>{group.name}</b> in your Home feed. You can join again any time.
        </p>
        <div className="grid-2">
          <button type="button" className="btn btn--outline" onClick={() => setConfirmLeave(false)}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => {
              remove('joinedGroups', group.id);
              setConfirmLeave(false);
              toast(`Left ${group.name}`);
            }}
          >
            {t('discover.groups.leave')}
          </button>
        </div>
      </Sheet>
    </>
  );
}
