import type { Reply } from '../data/types';

/**
 * Reddit-style threads: replies can answer replies, people vote them up or down,
 * and the community folds away what isn't useful. Votes only reorder and fold;
 * nobody, not even an admin or a page owner, can delete someone else's reply.
 */

export type ReplyOrder = 'helpful' | 'top' | 'new';

export interface ReplyNode {
  reply: Reply;
  children: ReplyNode[];
}

/** A reply at or below this net score starts folded ("Folded by neighbours' votes"). */
export const FOLD_AT = -4;

export const netScore = (x: { upvotes: number; downvotes?: number }) => x.upvotes - (x.downvotes ?? 0);

export const isFolded = (r: Reply) => netScore(r) <= FOLD_AT;

/** Minutes since "now", "35m", "2h", "3d", "1w" or "Yesterday"; unknown is very old. */
export function ageMinutes(ago: string): number {
  const a = ago.trim().toLowerCase();
  if (a === 'now' || a === 'just now') return 0;
  if (a === 'yesterday') return 24 * 60;
  const m = /^(\d+)\s*(m|min|h|d|w)/.exec(a);
  if (!m) return 1e6;
  const n = Number(m[1]);
  return m[2] === 'h' ? n * 60 : m[2] === 'd' ? n * 1440 : m[2] === 'w' ? n * 10080 : n;
}

/**
 * Hot, like Reddit's front page: score that decays with age, so a good post from
 * an hour ago beats a great one from last week.
 */
export function hotScore(x: { upvotes: number; downvotes?: number; ago: string }) {
  const hours = ageMinutes(x.ago) / 60;
  return netScore(x) / Math.pow(hours + 2, 1.5);
}

/**
 * Turn a flat list of replies into threads. Top-level replies follow the chosen
 * order; replies to a reply read as a conversation, oldest first. Folded replies
 * always sink to the bottom of their level.
 * @param rank how well-known for helping the author is (e.g. their level), for "Most helpful".
 */
export function buildThread(replies: Reply[], order: ReplyOrder, rank: (authorId: string) => number = () => 0): ReplyNode[] {
  const ids = new Set(replies.map((r) => r.id));
  const kids = new Map<string, Reply[]>();
  const top: Reply[] = [];
  for (const r of replies) {
    if (r.parentId && ids.has(r.parentId)) kids.set(r.parentId, [...(kids.get(r.parentId) ?? []), r]);
    else top.push(r);
  }
  const byOrder = (a: Reply, b: Reply) => {
    if (order === 'new') return ageMinutes(a.ago) - ageMinutes(b.ago);
    if (order === 'top') return netScore(b) - netScore(a);
    return Number(!!b.helpful) - Number(!!a.helpful) || rank(b.authorId) - rank(a.authorId) || netScore(b) - netScore(a);
  };
  const sinkFolded = (cmp: (a: Reply, b: Reply) => number) => (a: Reply, b: Reply) => Number(isFolded(a)) - Number(isFolded(b)) || cmp(a, b);
  const conversation = sinkFolded((a, b) => ageMinutes(b.ago) - ageMinutes(a.ago));
  const node = (r: Reply): ReplyNode => ({ reply: r, children: [...(kids.get(r.id) ?? [])].sort(conversation).map(node) });
  return [...top].sort(sinkFolded(byOrder)).map(node);
}

/** Everyone under a reply, for "3 more replies". */
export function countBelow(node: ReplyNode): number {
  return node.children.reduce((n, c) => n + 1 + countBelow(c), 0);
}
