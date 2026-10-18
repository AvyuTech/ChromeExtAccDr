import { describe, expect, it } from 'vitest';
import type { Reply } from '../data/types';
import { ageMinutes, buildThread, countBelow, hotScore, isFolded, netScore } from './thread';

const r = (id: string, ago: string, upvotes: number, extra: Partial<Reply> = {}): Reply => ({ id, authorId: id, text: id, ago, upvotes, ...extra });

describe('ageMinutes', () => {
  it('reads the short times used across the app', () => {
    expect(ageMinutes('now')).toBe(0);
    expect(ageMinutes('35m')).toBe(35);
    expect(ageMinutes('2h')).toBe(120);
    expect(ageMinutes('3d')).toBe(3 * 1440);
    expect(ageMinutes('1w')).toBe(10080);
    expect(ageMinutes('Yesterday')).toBe(1440);
    expect(ageMinutes('someday')).toBeGreaterThan(10080);
  });
});

describe('votes', () => {
  it('nets down votes off up votes and folds at −4', () => {
    expect(netScore({ upvotes: 1, downvotes: 9 })).toBe(-8);
    expect(isFolded(r('a', '1h', 1, { downvotes: 5 }))).toBe(true);
    expect(isFolded(r('a', '1h', 1, { downvotes: 4 }))).toBe(false);
  });

  it('ranks a fresh post above an older one with more votes when hot', () => {
    expect(hotScore({ upvotes: 20, ago: '1h' })).toBeGreaterThan(hotScore({ upvotes: 60, ago: '3d' }));
  });
});

describe('buildThread', () => {
  const replies = [
    r('a', '1h', 5),
    r('b', '50m', 9),
    r('c', '40m', 2, { helpful: true }),
    r('spam', '30m', 1, { downvotes: 9 }),
    r('a1', '45m', 1, { parentId: 'a' }),
    r('a2', '20m', 7, { parentId: 'a1' }),
    r('a0', '55m', 0, { parentId: 'a' }),
  ];

  it('nests replies under the reply they answer, oldest first', () => {
    const tree = buildThread(replies, 'top');
    const a = tree.find((n) => n.reply.id === 'a')!;
    expect(a.children.map((n) => n.reply.id)).toEqual(['a0', 'a1']);
    expect(a.children[1].children[0].reply.id).toBe('a2');
    expect(countBelow(a)).toBe(3);
  });

  it('orders top-level replies by the chosen sort, folded ones last', () => {
    expect(buildThread(replies, 'top').map((n) => n.reply.id)).toEqual(['b', 'a', 'c', 'spam']);
    expect(buildThread(replies, 'new').map((n) => n.reply.id)).toEqual(['c', 'b', 'a', 'spam']);
    expect(buildThread(replies, 'helpful').map((n) => n.reply.id)).toEqual(['c', 'b', 'a', 'spam']);
  });

  it('lets known helpers rise in Most helpful', () => {
    const rank = (id: string) => (id === 'a' ? 5 : 0);
    expect(buildThread(replies, 'helpful', rank).map((n) => n.reply.id)).toEqual(['c', 'a', 'b', 'spam']);
  });

  it('keeps a reply whose parent is missing at the top level', () => {
    expect(buildThread([r('x', '1h', 1, { parentId: 'gone' })], 'top').map((n) => n.reply.id)).toEqual(['x']);
  });
});
