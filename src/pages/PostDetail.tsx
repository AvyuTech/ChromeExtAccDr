import { useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { placePhoto } from '../assets/photos';
import { AnswerCard, Avatar, ClubTag, ShareButton, Votes } from '../components/cards';
import { ReplyThread } from '../components/thread';
import { EmptyState, PageHeader, Sheet, Tile } from '../components/ui';
import { person } from '../data/core';
import { placeById } from '../data/places';
import { groupById, POSTS, postById } from '../data/social';
import type { Post, Reply, SourceId } from '../data/types';
import { useT } from '../i18n';
import { FlagGlyph, ReplyGlyph, SaveGlyph } from '../icons';
import { useAppData } from '../state/appData';
import { enabledSources, useSettings } from '../state/settings';
import { useToast } from '../state/toast';
import { identityOf } from '../data/identity';
import { LevelTag } from '../components/helpful';
import { levelFor } from '../lib/helpful';
import { buildThread, type ReplyOrder } from '../lib/thread';

const REASONS = ['spam', 'wrong', 'rude', 'private', 'other'] as const;

const ORDERS: Array<{ id: ReplyOrder; label: string }> = [
  { id: 'helpful', label: 'Most helpful' },
  { id: 'top', label: 'Top' },
  { id: 'new', label: 'New' },
];

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
  const [order, setOrder] = useState<ReplyOrder>('helpful');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const author = person(post.authorId);
  const group = post.groupId ? (data.myClubs.find((c) => c.id === post.groupId) ?? groupById(post.groupId)) : undefined;
  const work = identityOf(post.authorId).work;
  const saved = has('savedPosts', post.id);
  const showSummary = settings.ai.answers && settings.ai.summariseThreads && post.answer;
  const allowed = enabledSources(settings);

  const mine = data.myReplies[post.id];
  const replies = useMemo(() => [...post.replies, ...(mine ?? [])], [post.replies, mine]);
  // Most helpful: marked helpful, then people known for helping (by level), then votes. Top: votes. New: newest.
  const thread = useMemo(() => buildThread(replies, order, (id) => levelFor(id).index), [replies, order]);
  const replyTotal = post.replyCount + (mine?.length ?? 0);
  const replyingTo = replyTo ? replies.find((r) => r.id === replyTo) : undefined;
  const replyingName = replyingTo ? (replyingTo.authorId === 'me' ? 'yourself' : person(replyingTo.authorId).name.split(' ')[0]) : undefined;

  const related = useMemo(
    () => POSTS.filter((p) => p.id !== post.id && (p.topic === post.topic || p.type === post.type || (post.groupId && p.groupId === post.groupId))).slice(0, 3),
    [post],
  );

  const send = (e?: FormEvent) => {
    e?.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const reply: Reply = { id: `my-reply-${Date.now()}`, authorId: 'me', text, ago: 'now', upvotes: 0, ...(replyTo ? { parentId: replyTo } : {}) };
    addReply(post.id, reply);
    setDraft('');
    setReplyTo(null);
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
              <span className="feed-post__line">
                <Link to={`/people/${post.authorId}`} className="feed-post__name">
                  {author.name}
                </Link>
                {group ? <ClubTag club={group} /> : null}
                <LevelTag personId={post.authorId} topic={post.topic} />
              </span>
              <span className="meta">
                {work ? `${work.title} · ` : ''}
                {post.area} · {post.ago}
              </span>
            </div>
            <span className="badge badge--sm">{post.topic}</span>
          </div>
          <p className="post-detail__text">{post.text}</p>
          <div className="feed-post__actions">
            <Votes id={post.id} up={post.upvotes} down={post.downvotes} />
            <button
              type="button"
              className="feed-action"
              onClick={() => {
                setReplyTo(null);
                inputRef.current?.focus();
              }}
            >
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
          <div className="replies-head">
            <h2 className="section__title" id="replies-title">
              {t('social.replies')} · {replyTotal}
            </h2>
            {replies.length > 1 ? (
              <div className="replies-order" role="group" aria-label="Order replies">
                {ORDERS.map((o) => (
                  <button key={o.id} type="button" aria-pressed={order === o.id} onClick={() => setOrder(o.id)}>
                    {o.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          {replies.length === 0 ? (
            <p className="body-sm muted">{t('social.noReplies')}</p>
          ) : (
            <ReplyThread
              key={order}
              nodes={thread}
              postAuthorId={post.authorId}
              topic={post.topic}
              onReply={(rid) => {
                setReplyTo(rid);
                inputRef.current?.focus();
              }}
            />
          )}
          {replies.length && replies.length < replyTotal ? (
            <p className="replies-more">
              Showing {replies.length} of {replyTotal}
              {order === 'helpful' ? ', most helpful first' : order === 'top' ? ', most votes first' : ', newest first'}
            </p>
          ) : null}
          <div ref={endRef} />
        </section>

        {related.length ? (
          <section className="section" aria-labelledby="related-title">
            <h2 className="section__title" id="related-title">
              {t('social.related')}
            </h2>
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

      <form className={`composer-bar composer-bar--reply${replyingTo ? ' is-replying' : ''}`} onSubmit={send}>
        {replyingTo ? (
          <span className="composer-bar__to">
            Replying to {replyingName}
            <button type="button" aria-label="Reply to the post instead" onClick={() => setReplyTo(null)}>
              ×
            </button>
          </span>
        ) : null}
        <Avatar who={{ ...person('me'), verified: false }} size={30} />
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
          placeholder={`Reply to ${replyingName ?? author.name.split(' ')[0]}…`}
          onChange={(e) => {
            setDraft(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`;
          }}
          onKeyDown={onKeyDown}
        />
        <button type="submit" className="composer-bar__send" aria-label={t('social.sendReply')} disabled={!draft.trim()}>
          Post
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
