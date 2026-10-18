import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { groupPhoto } from '../assets/photos';
import { Avatar, PostCard } from '../components/cards';
import { IconAction, ProfileHead, useShare } from '../components/discover';
import { EmptyState, PageHeader, SectionHead, Sheet } from '../components/ui';
import { person } from '../data/core';
import { groupById, POSTS } from '../data/social';
import { useT } from '../i18n';
import { CheckGlyph, EditGlyph, LockGlyph, GlobeGlyph, NamedGlyph, ShareGlyph, UsersGlyph } from '../icons';
import { compact } from '../lib/format';
import { DEFAULT_APP_DATA, useAppData } from '../state/appData';
import { useToast } from '../state/toast';

export default function GroupDetail() {
  const { id = '' } = useParams();
  const t = useT();
  const toast = useToast();
  const { data, has, add, remove } = useAppData();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const share = useShare();
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
  const adminNames = group.admins.map((a) => person(a).name).join(' and ');
  const members = group.members + (joined ? 1 : 0) - (DEFAULT_APP_DATA.joinedGroups.includes(group.id) ? 1 : 0);

  return (
    <>
      <PageHeader title={group.name} fallback="/groups" />
      <main className="page page--with-header">
        <ProfileHead
          cover={cover}
          tone={group.tone}
          icon={<NamedGlyph name={group.glyph} size={30} duo live />}
          stats={[
            { value: compact(members), label: t('discover.stat.members') },
            { value: group.postsToday, label: t('discover.stat.postsToday'), tone: 'mint' as const },
            { value: group.admins.length, label: t('discover.stat.admins') },
          ]}
          title={group.name}
          sub={
            <span className="row" style={{ gap: 4, display: 'inline-flex' }}>
              {group.privacy === 'public' ? <GlobeGlyph size={12} /> : <LockGlyph size={12} />}
              {group.privacy === 'public' ? 'Public' : 'Neighbours only'} · {group.area}
            </span>
          }
        >
          <p className="body-sm" style={{ color: 'var(--ink-2)', marginTop: 4 }}>
            {group.description}
          </p>
          <p className="origin-line" style={{ cursor: 'default' }}>
            <span className="face-stack">
              {group.admins.map((a) => (
                <Avatar key={a} who={{ ...person(a), verified: false }} size={18} />
              ))}
            </span>
            <span className="grow">{t('discover.group.runBy', { names: adminNames })}</span>
          </p>
        </ProfileHead>

        <nav className="icon-row icon-row--start" aria-label={t('discover.group.actions')}>
          <IconAction
            primary
            pressed={joined}
            onClick={() => {
              if (joined) setConfirmLeave(true);
              else {
                add('joinedGroups', group.id);
                toast(`Joined ${group.name}. Its posts now appear in Home`);
              }
            }}
            icon={joined ? <CheckGlyph size={18} /> : <UsersGlyph size={18} />}
            label={joined ? t('discover.action.joined') : t('discover.action.join')}
            ariaLabel={joined ? t('common.joined') : t('common.join')}
          />
          <IconAction to={`/compose?group=${group.id}`} icon={<EditGlyph size={17} />} label={t('discover.action.post')} ariaLabel={t('discover.groups.postHere')} />
          <IconAction onClick={() => share(group.name, `/groups/${group.id}`)} icon={<ShareGlyph size={17} />} label={t('common.share')} />
        </nav>

        <section className="dsec" aria-labelledby="rules-title">
          <h2 className="section__title" id="rules-title">
            {t('discover.groups.rules')}
          </h2>
          <ol className="rules">
            {group.rules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
        </section>

        <section className="dsec" aria-labelledby="posts-title">
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
