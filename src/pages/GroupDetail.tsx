import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaceStack, PostCard } from '../components/cards';
import { buysOf, BuyRow, clubById, clubPhoto, meetupsOf, memberCount, MeetupRow, PlanSheet, type PlanMode } from '../components/clubs';
import { IconAction, ProfileHead, useShare } from '../components/discover';
import { HeroRow, useBoardContext } from '../components/helpful';
import { EmptyState, PageHeader, Sheet } from '../components/ui';
import { person } from '../data/core';
import { POSTS } from '../data/social';
import { useT } from '../i18n';
import { CalendarGlyph, ChatGlyph, CheckGlyph, GlobeGlyph, LockGlyph, NamedGlyph, ShareGlyph, UsersGlyph } from '../icons';
import { compact } from '../lib/format';
import { clubMemberIds, leaderboard } from '../lib/helpful';
import { useAppData } from '../state/appData';
import { useToast } from '../state/toast';

export default function GroupDetail() {
  const { id = '' } = useParams();
  const t = useT();
  const toast = useToast();
  const share = useShare();
  const { data, has, add, remove } = useAppData();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [plan, setPlan] = useState<PlanMode | null>(null);
  const club = clubById(id, data);
  const boardCtx = useBoardContext();

  if (!club) {
    return (
      <>
        <PageHeader title={t('nav.clubs')} fallback="/clubs" />
        <main className="page page--with-header">
          <EmptyState
            glyph="groups"
            title={t('clubs.notFound')}
            action={
              <Link to="/clubs" className="btn btn--soft btn--sm">
                {t('nav.clubs')}
              </Link>
            }
          />
        </main>
      </>
    );
  }

  const joined = has('joinedGroups', club.id);
  const meetups = meetupsOf(club, data);
  const buys = buysOf(club, data);
  const posts = [...data.myPosts, ...POSTS].filter((p) => p.groupId === club.id);
  const admins = club.admins.map((a) => (a === 'me' ? 'you' : person(a).name)).join(' and ');
  // Faces people will recognise: admins, then whoever is turning up to meetups.
  const people = Array.from(new Set([...(joined ? ['me'] : []), ...club.admins, ...meetups.flatMap((m) => m.going)])).filter((x) => x !== 'me' || joined);
  const helpers = leaderboard({ scope: 'clubs', members: [...(joined ? ['me'] : []), ...clubMemberIds(club)], period: 'month', sortBy: 'points' }, boardCtx);
  const startPlan = (mode: PlanMode) => {
    if (!joined) toast(t('clubs.joinFirst'));
    else setPlan(mode);
  };

  return (
    <>
      <PageHeader title={club.name} fallback="/clubs" />
      <main className="page page--with-header club-page">
        <ProfileHead
          cover={clubPhoto(club)}
          tone={club.tone}
          icon={<NamedGlyph name={club.glyph} size={30} duo live />}
          stats={[
            { value: compact(memberCount(club, joined)), label: t('clubs.stat.members') },
            { value: meetups.length, label: t('clubs.stat.meetups'), tone: 'mint' as const },
            { value: club.postsToday, label: t('clubs.stat.posts') },
          ]}
          title={club.name}
          sub={
            <span className="row" style={{ gap: 4, display: 'inline-flex' }}>
              {club.privacy === 'public' ? <GlobeGlyph size={12} /> : <LockGlyph size={12} />}
              {t(`clubs.kind.${club.kind}`)} · {club.privacy === 'public' ? t('clubs.public') : t('clubs.neighboursOnly')} · {club.area}
            </span>
          }
        >
          <p className="body-sm" style={{ color: 'var(--ink-2)', marginTop: 4 }}>
            {club.description}
          </p>
          <p className="club-admins">
            <FaceStack ids={club.admins} size={18} />
            <span>{t('clubs.runBy', { names: admins })}</span>
          </p>
        </ProfileHead>

        <nav className="icon-row" aria-label={t('clubs.actions')}>
          <IconAction
            primary
            pressed={joined}
            onClick={() => {
              if (joined) setConfirmLeave(true);
              else {
                add('joinedGroups', club.id);
                toast(t('clubs.joined', { name: club.name }));
              }
            }}
            icon={joined ? <CheckGlyph size={18} /> : <UsersGlyph size={18} />}
            label={joined ? t('clubs.action.joined') : t('clubs.action.join')}
          />
          <IconAction onClick={() => startPlan('meetup')} icon={<CalendarGlyph size={17} />} label={t('clubs.action.plan')} ariaLabel={t('clubs.form.meetup')} />
          <IconAction onClick={() => startPlan('buy')} icon={<NamedGlyph name="users" size={17} />} label={t('clubs.action.buy')} />
          <IconAction onClick={() => share(club.name, `/clubs/${club.id}`)} icon={<ShareGlyph size={17} />} label={t('clubs.action.invite')} />
          {club.admins[0] && club.admins[0] !== 'me' ? (
            <IconAction to={`/messages/c-${club.admins[0]}`} icon={<ChatGlyph size={17} />} label={t('clubs.action.message')} ariaLabel={`Message ${person(club.admins[0]).name}`} />
          ) : null}
        </nav>

        <section className="dsec" aria-labelledby="club-meetups">
          <div className="dsec__head">
            <h2 className="section__title" id="club-meetups">
              {t('clubs.meetups')}
            </h2>
            <button type="button" className="section__link clubs-link" onClick={() => startPlan('meetup')}>
              {t('clubs.form.meetup')}
            </button>
          </div>
          {meetups.length ? (
            <div>
              {meetups.map((m) => (
                <MeetupRow key={m.id} meetup={m} club={club} />
              ))}
            </div>
          ) : (
            <p className="meta">{t('clubs.meetupsEmpty')}</p>
          )}
        </section>

        <section className="dsec" aria-labelledby="club-buys">
          <div className="dsec__head">
            <h2 className="section__title" id="club-buys">
              {t('clubs.buying')}
            </h2>
            <button type="button" className="section__link clubs-link" onClick={() => startPlan('buy')}>
              {t('clubs.action.buy')}
            </button>
          </div>
          <p className="clubs-note">{t('clubs.buyingNote')}</p>
          {buys.length ? (
            <div>
              {buys.map((b) => (
                <BuyRow key={b.id} buy={b} club={club} />
              ))}
            </div>
          ) : (
            <p className="meta">{t('clubs.buysEmpty')}</p>
          )}
        </section>

        <section className="dsec" aria-labelledby="club-people">
          <h2 className="section__title" id="club-people">
            {t('clubs.people')}
          </h2>
          <div className="club-people">
            {people.slice(0, 8).map((pid) => (
              <Link key={pid} to={pid === 'me' ? '/me' : `/people/${pid}`} className="club-person">
                <FaceStack ids={[pid]} size={44} max={1} />
                <span>{pid === 'me' ? 'You' : person(pid).name.split(' ')[0]}</span>
              </Link>
            ))}
            <span className="club-person club-person--more">
              <span className="club-person__count">+{compact(Math.max(0, memberCount(club, joined) - Math.min(8, people.length)))}</span>
              <span>{t('clubs.stat.members')}</span>
            </span>
          </div>
        </section>

        {helpers.length ? (
          <section className="dsec" aria-labelledby="club-helpers">
            <div className="dsec__head">
              <h2 className="section__title" id="club-helpers">
                Most helpful here
              </h2>
              <Link to="/heroes?scope=clubs" className="section__link">
                City heroes
              </Link>
            </div>
            <p className="clubs-note">Members ranked by helpful points this month.</p>
            <div className="hero-list">
              {helpers.slice(0, 5).map((r) => (
                <HeroRow key={r.personId} row={r} sortBy="points" me={r.personId === 'me'} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="dsec" aria-labelledby="club-posts">
          <div className="dsec__head">
            <h2 className="section__title" id="club-posts">
              {t('clubs.posts')}
            </h2>
            {joined ? (
              <Link to={`/compose?group=${club.id}`} className="section__link">
                {t('clubs.write')}
              </Link>
            ) : null}
          </div>
          {posts.length ? (
            <div className="feed">
              {posts.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          ) : (
            <p className="meta">{t('clubs.postsEmpty')}</p>
          )}
        </section>

        {club.rules.length ? (
          <section className="dsec" aria-labelledby="club-rules">
            <h2 className="section__title" id="club-rules">
              {t('clubs.rules')}
            </h2>
            <ol className="rules">
              {club.rules.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ol>
          </section>
        ) : null}

        {joined ? (
          <button type="button" className="club-leave" onClick={() => setConfirmLeave(true)}>
            {t('clubs.leave')}
          </button>
        ) : null}
      </main>

      <PlanSheet mode={plan ?? 'meetup'} club={club} open={plan !== null} onClose={() => setPlan(null)} />

      <Sheet open={confirmLeave} onClose={() => setConfirmLeave(false)} title={t('clubs.leave')}>
        <p className="body-sm">{t('clubs.leaveBody', { name: club.name })}</p>
        <div className="grid-2">
          <button type="button" className="btn btn--outline" onClick={() => setConfirmLeave(false)}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => {
              remove('joinedGroups', club.id);
              setConfirmLeave(false);
              toast(t('clubs.left', { name: club.name }));
            }}
          >
            {t('clubs.leave')}
          </button>
        </div>
      </Sheet>
    </>
  );
}
