import { useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { placePhoto } from '../assets/photos';
import { AnswerCard, Avatar, ShareButton } from '../components/cards';
import { EmptyState, PageHeader, SectionHead, Sheet, Tile } from '../components/ui';
import { person } from '../data/core';
import { placeById } from '../data/places';
import { groupById, POSTS, postById } from '../data/social';
import type { Post, Reply, SourceId } from '../data/types';
import { useT } from '../i18n';
import { FlagGlyph, ReplyGlyph, SaveGlyph, SendGlyph, UpvoteGlyph } from '../icons';
import { DEFAULT_APP_DATA, useAppData } from '../state/appData';
import { enabledSources, useSettings } from '../state/settings';
import { useToast } from '../state/toast';
import { identityOf } from '../data/identity';


const REASONS = ['spam', 'wrong', 'rude', 'private', 'other'] as const;

/** Which kinds of source a thread summary drew on, read from its basis line. */
function summarySources(basis: string): SourceId[] {
  const s: SourceId[] = ['neighbours'];
  if (/reel/i.test(basis)) s.push('instagram');
  if (/municipal|notice|ward/i.test(basis)) s.push('amc');
  return s;
}

export default function PostDetail() {
  const { id = '' } = useParams();
  const t = useT();
  const { data } = useAppData();
  const post: Post | undefined = postById(id) ?? data.myPosts.find((p) => p.id === id);

  if (!post) {
    return (
      <>
        <PageHeader title={t('social.post')} />
        <main className="page page--with-header">
          <EmptyState
            glyph="question"
            title={t('social.postMissing')}
            body={t('social.postMissingBody')}
            action={
              <Link to="/" className="btn btn--primary">
                {t('social.goHome')}
              </Link>
            }
          />
        </main>
      </>
    );
  }
  return <PostView key={post.id} post={post} />;
}

function PostView({ post }: { post: Post }) {
  const t = useT();
  const { settings } = useSettings();
  const { data, has, toggle, addReply } = useAppData();
  const toast = useToast();
  const [draft, setDraft] = useState('');
  const [flagOpen, setFlagOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REASONS)[number] | null>(null);
  const [likedReplies, setLikedReplies] = useState<string[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const author = person(post.authorId);
  const group = post.groupId ? groupById(post.groupId) : undefined;
  const up = has('upvoted', post.id);
  const saved = has('savedPosts', post.id);
  // Seed counts already include this person's vote for posts upvoted in the sample data.
  const upCount = post.upvotes + (up ? 1 : 0) - (DEFAULT_APP_DATA.upvoted.includes(post.id) ? 1 : 0);
  const showSummary = settings.ai.answers && settings.ai.summariseThreads && post.answer;
  const allowed = enabledSources(settings);

  const mine = data.myReplies[post.id];
  const replies = useMemo(
    () => [...post.replies].sort((a, b) => Number(!!b.helpful) - Number(!!a.helpful) || b.upvotes - a.upvotes).concat(mine ?? []),
    [post.replies, mine],
  );
  const replyTotal = post.replyCount + (mine?.length ?? 0);

  const related = useMemo(
    () => POSTS.filter((p) => p.id !== post.id && (p.topic === post.topic || p.type === post.type || (post.groupId && p.groupId === post.groupId))).slice(0, 3),
    [post],
  );

  const send = (e?: FormEvent) => {
    e?.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const reply: Reply = { id: `my-reply-${Date.now()}`, authorId: 'me', text, ago: 'now', upvotes: 0 };
    addReply(post.id, reply);
    setDraft('');
    if (inputRef.current) inputRef.current.style.height = '';
    toast(t('social.replyPosted'));
    window.setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send();
  };

  return (
    <>
      <PageHeader
        title={t('social.post')}
        sub={group ? t('social.inGroup', { group: group.name }) : undefined}
        actions={
          <button type="button" className="icon-btn" aria-label={t('social.reportPost')} onClick={() => setFlagOpen(true)}>
            <FlagGlyph size={19} />
          </button>
        }
      />
      <main className="page page--with-header page--with-composer">
        <article className="feed-post post-detail">
          <div className="feed-post__head">
            <Avatar who={author} size={38} />
            <div className="feed-post__who">
              <span className="row row--wrap" style={{ gap: '2px 6px' }}>
                <span className="feed-post__name">{author.name}</span>
                {author.badge ? <span className="badge badge--sm">{author.badge}</span> : null}
              </span>
              <span className="meta">
                {identityOf(post.authorId).work ? `${identityOf(post.authorId).work!.title} · ` : ''}
                {post.area} · {post.ago}
              </span>
            </div>
            <span className="badge badge--sm">{post.topic}</span>
          </div>
          <p className="post-detail__text">{post.text}</p>
          {group ? (
            <Link to={`/groups/${group.id}`} className="chip chip--soft" style={{ alignSelf: 'flex-start' }}>
              <Tile glyph={group.glyph} tone={group.tone} size="sm" />
              {group.name}
            </Link>
          ) : null}
          <div className="feed-post__actions">
            <button
              type="button"
              className="feed-action"
              aria-pressed={up}
              aria-label={`Upvote, ${upCount}`}
              style={up ? { color: 'var(--accent)' } : undefined}
              onClick={() => toggle('upvoted', post.id)}
            >
              <UpvoteGlyph size={20} active={up} />
              {upCount}
            </button>
            <button type="button" className="feed-action" onClick={() => inputRef.current?.focus()}>
              <ReplyGlyph size={20} />
              {replyTotal === 1 ? t('social.oneReply') : t('common.replies', { n: replyTotal })}
            </button>
            <span className="grow" />
            <button
              type="button"
              className="icon-btn icon-btn--ghost"
              aria-pressed={saved}
              aria-label={saved ? t('common.saved') : t('common.save')}
              style={{ color: saved ? 'var(--accent)' : 'var(--muted)' }}
              onClick={() => {
                const on = toggle('savedPosts', post.id);
                toast(on ? 'Saved to your list' : 'Removed from saved');
              }}
            >
              <SaveGlyph size={20} active={saved} />
            </button>
            <ShareButton title={post.text} path={`/post/${post.id}`} />
          </div>
        </article>

        {showSummary && post.answer ? (
          <AnswerCard
            text={post.answer.text}
            sources={summarySources(post.answer.basis).filter(allowed)}
            footer={
              <>
                <span className="meta">{t('social.summaryBasis', { basis: post.answer.basis })}</span>
                {post.answer.placeIds?.length ? (
                  <div className="stack" style={{ gap: 8 }}>
                    <span className="eyebrow muted">{t('social.placesInAnswer')}</span>
                    <div className="chip-wrap">
                      {post.answer.placeIds.map((pid) => {
                        const place = placeById(pid);
                        if (!place) return null;
                        return (
                          <Link key={pid} to={`/place/${pid}`} className="place-chip glyph-host">
                            {placePhoto(pid) ? <img src={placePhoto(pid)} alt="" /> : <Tile glyph={place.glyph} tone={place.tone} size="sm" />}
                            <span className="stack" style={{ gap: 0, minWidth: 0 }}>
                              <span className="place-chip__name">{place.name}</span>
                              <span className="place-chip__meta">{place.area}</span>
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </>
            }
          />
        ) : null}

        <section className="section" aria-labelledby="replies-title">
          <SectionHead id="replies-title" title={`${t('social.replies')} · ${replyTotal}`} />
          {replies.length === 0 ? (
            <p className="body-sm muted">{t('social.noReplies')}</p>
          ) : (
            <div className="list social-list">
              {replies.map((r) => {
                const who = person(r.authorId);
                const liked = likedReplies.includes(r.id);
                return (
                  <div key={r.id} className={`reply${r.helpful ? ' reply--helpful' : ''}${r.authorId === 'me' ? ' reply--mine' : ''}`}>
                    <Avatar who={who} size={30} />
                    <div className="stack grow" style={{ gap: 2 }}>
                      <div className="reply__head">
                        <span className="strong" style={{ fontSize: '0.8125rem' }}>
                          {r.authorId === 'me' ? t('social.you') : who.name}
                        </span>
                        {identityOf(r.authorId).work ? <span className="meta">· {identityOf(r.authorId).work!.title}</span> : null}
                        {r.helpful ? <span className="badge badge--sm">{t('social.helpful')}</span> : null}
                        <span className="meta">· {r.ago}</span>
                      </div>
                      <p className="reply__text">{r.text}</p>
                      <div className="reply__actions">
                        <button
                          type="button"
                          className="feed-action"
                          aria-pressed={liked}
                          aria-label={`Upvote reply, ${r.upvotes + (liked ? 1 : 0)}`}
                          style={{ color: liked ? 'var(--accent)' : 'var(--muted)', fontSize: '0.75rem', height: 24 }}
                          onClick={() => setLikedReplies((xs) => (liked ? xs.filter((x) => x !== r.id) : [...xs, r.id]))}
                        >
                          <UpvoteGlyph size={15} active={liked} />
                          {r.upvotes + (liked ? 1 : 0)}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div ref={endRef} />
        </section>

        {related.length ? (
          <section className="section" aria-labelledby="related-title">
            <SectionHead id="related-title" title={t('social.related')} />
            <div className="list">
              {related.map((p) => {
                return (
                  <Link key={p.id} to={`/post/${p.id}`} className="list-row glyph-host">
                    <Avatar who={{ ...person(p.authorId), verified: false }} size={32} />
                    <span className="list-row__body">
                      <span className="related-row__text">{p.text}</span>
                      <span className="list-row__meta">
                        {p.topic} · {p.replyCount === 1 ? t('social.oneReply') : t('common.replies', { n: p.replyCount })}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}
      </main>

      <form className="composer-bar" onSubmit={send}>
        <label htmlFor="reply-input" className="sr-only">
          {t('social.writeReply')}
        </label>
        <textarea
          id="reply-input"
          ref={inputRef}
          className="composer-bar__input"
          rows={1}
          value={draft}
          maxLength={500}
          placeholder={t('social.writeReply')}
          onChange={(e) => {
            setDraft(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
          }}
          onKeyDown={onKeyDown}
        />
        <button type="submit" className="icon-btn icon-btn--accent" aria-label={t('social.sendReply')} disabled={!draft.trim()}>
          <SendGlyph size={19} />
        </button>
      </form>

      <Sheet
        open={flagOpen}
        onClose={() => {
          setFlagOpen(false);
          setReason(null);
        }}
        title={t('social.reportPost')}
      >
        <p className="body-sm muted">{t('social.reportWhy')}</p>
        <div className="stack" role="radiogroup" aria-label={t('social.reportWhy')} style={{ gap: 8 }}>
          {REASONS.map((r) => (
            <button key={r} type="button" role="radio" aria-checked={reason === r} className="reason-option" onClick={() => setReason(r)}>
              <span className="reason-option__radio" aria-hidden="true" />
              {t(`social.reason.${r}`)}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn btn--primary btn--block btn--lg"
          disabled={!reason}
          onClick={() => {
            setFlagOpen(false);
            setReason(null);
            toast(t('social.reportThanks'));
          }}
        >
          {t('social.reportSubmit')}
        </button>
      </Sheet>
    </>
  );
}
