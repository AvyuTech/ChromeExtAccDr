import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { person } from '../data/core';
import { identityOf } from '../data/identity';
import { useT } from '../i18n';
import { ReplyGlyph } from '../icons';
import { countBelow, isFolded, type ReplyNode } from '../lib/thread';
import { Avatar, Votes } from './cards';
import { LevelTag } from './helpful';

/**
 * Replies as threads: each reply can be answered, voted up or down, and folded
 * with the line beside it. Replies the community voted well below zero start
 * folded but are never deleted; anyone can open them.
 */
export function ReplyThread({ nodes, postAuthorId, topic, onReply }: { nodes: ReplyNode[]; postAuthorId: string; topic: string; onReply: (id: string) => void }) {
  // Start with the community-folded replies closed; everything else open.
  const [folded, setFolded] = useState<string[]>(() => {
    const ids: string[] = [];
    const walk = (ns: ReplyNode[]) => {
      for (const n of ns) {
        if (isFolded(n.reply)) ids.push(n.reply.id);
        walk(n.children);
      }
    };
    walk(nodes);
    return ids;
  });
  const toggle = (id: string) => setFolded((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]));
  return (
    <div className="thread">
      {nodes.map((n) => (
        <ReplyItem key={n.reply.id} node={n} depth={0} folded={folded} onToggle={toggle} postAuthorId={postAuthorId} topic={topic} onReply={onReply} />
      ))}
    </div>
  );
}

function ReplyItem({
  node,
  depth,
  folded,
  onToggle,
  postAuthorId,
  topic,
  onReply,
}: {
  node: ReplyNode;
  depth: number;
  folded: string[];
  onToggle: (id: string) => void;
  postAuthorId: string;
  topic: string;
  onReply: (id: string) => void;
}) {
  const t = useT();
  const r = node.reply;
  const who = person(r.authorId);
  const name = r.authorId === 'me' ? t('social.you') : who.name;
  const work = identityOf(r.authorId).work;
  const below = countBelow(node);
  const style = { '--depth': Math.min(depth, 3) } as CSSProperties;

  if (folded.includes(r.id)) {
    return (
      <div className="reply-node" style={style}>
        <button type="button" className="reply reply--folded" onClick={() => onToggle(r.id)} aria-expanded={false}>
          <span className="reply--folded__plus" aria-hidden="true">
            +
          </span>
          <Avatar who={{ ...who, verified: false }} size={20} />
          <span className="strong">{name}</span>
          <span className="meta">
            · {r.ago}
            {isFolded(r) ? ' · folded by neighbours’ votes' : ''}
            {below ? ` · ${below} more ${below === 1 ? 'reply' : 'replies'}` : ''}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="reply-node" style={style}>
      <div className={`reply${r.helpful ? ' reply--helpful' : ''}${r.authorId === 'me' ? ' reply--mine' : ''}`}>
        <Link to={r.authorId === 'me' ? '/me' : `/people/${r.authorId}`} aria-label={name}>
          <Avatar who={who} size={depth ? 24 : 30} />
        </Link>
        <div className="stack grow" style={{ gap: 2, minWidth: 0 }}>
          <div className="reply__head">
            <span className="strong" style={{ fontSize: '0.8125rem' }}>
              {name}
            </span>
            {r.authorId === postAuthorId ? <span className="op-tag">Author</span> : null}
            {work ? <span className="meta">· {work.title}</span> : null}
            <LevelTag personId={r.authorId} topic={topic} />
            {r.helpful ? <span className="badge badge--sm">{t('social.helpful')}</span> : null}
            <span className="meta">· {r.ago}</span>
          </div>
          <p className="reply__text">{r.text}</p>
          <div className="reply__actions">
            <Votes id={r.id} up={r.upvotes} down={r.downvotes} small />
            <button type="button" className="reply__act" onClick={() => onReply(r.id)}>
              <ReplyGlyph size={14} />
              Reply
            </button>
            {below ? (
              <button type="button" className="reply__act" onClick={() => onToggle(r.id)} aria-expanded>
                Hide {below === 1 ? 'reply' : `${below} replies`}
              </button>
            ) : null}
          </div>
        </div>
      </div>
      {node.children.length ? (
        <div className="reply-children">
          <button type="button" className="thread-line" aria-label={`Fold ${name}’s thread`} onClick={() => onToggle(r.id)} />
          {node.children.map((c) => (
            <ReplyItem key={c.reply.id} node={c} depth={depth + 1} folded={folded} onToggle={onToggle} postAuthorId={postAuthorId} topic={topic} onReply={onReply} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
