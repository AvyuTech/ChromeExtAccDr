import { PEOPLE } from '../data/core';
import { helpfulOf, LEVELS, OFFICIAL, TOPIC_ALIASES, type HelpfulRecord, type HelpTopic, type LevelDef, type Requirement } from '../data/helpful';
import { identityOf, type Identity } from '../data/identity';
import { GROUPS } from '../data/social';
import type { Group } from '../data/types';

/* ---------- Levels ---------- */

export interface LevelInfo {
  level: LevelDef;
  /** 0 for Newcomer up to 5 for City hero. */
  index: number;
  next?: LevelDef;
  points: number;
  /** Points left to the next level's threshold (0 when already past it). */
  toNext: number;
  /** 0–1 between this level's threshold and the next. */
  progress: number;
  /** Points are enough for a higher level, but a check is missing. */
  held: boolean;
  /** Checks still needed for the next level (or the one the points already reach). */
  missing: Requirement[];
}

export function requirementMet(req: Requirement, identity: Identity, rec: HelpfulRecord): boolean {
  switch (req) {
    case 'phone':
      return identity.checks.phone;
    case 'address':
      return identity.checks.address;
    case 'govId':
      return identity.checks.govId;
    case 'vouches10':
      return identity.vouches >= 10;
    case 'vouches25':
      return identity.vouches >= 25;
    case 'active':
      return rec.lastActiveDays <= 90;
  }
}

/** Every check a level needs, its own plus those of the levels below it. */
export function needsFor(index: number): Requirement[] {
  return LEVELS.slice(0, index + 1).flatMap((l) => l.needs);
}

export function levelFor(personId: string, identity: Identity = identityOf(personId), rec: HelpfulRecord = helpfulOf(personId)): LevelInfo {
  const points = rec.lifetime;
  let byPoints = 0;
  LEVELS.forEach((l, i) => {
    if (points >= l.min) byPoints = i;
  });
  let index = 0;
  for (let i = 1; i <= byPoints; i++) {
    if (needsFor(i).every((r) => requirementMet(r, identity, rec))) index = i;
    else break;
  }
  const level = LEVELS[index];
  const next = LEVELS[index + 1];
  const held = byPoints > index;
  const missing = next ? needsFor(index + 1).filter((r) => !requirementMet(r, identity, rec)) : [];
  const toNext = next ? Math.max(0, next.min - points) : 0;
  const progress = next ? Math.min(1, Math.max(0, (points - level.min) / (next.min - level.min))) : 1;
  return { level, index, next, points, toNext, progress, held, missing };
}

/* ---------- Topics ---------- */

/** Map a post's loose topic ("New place", "Sports") to a points topic. */
export function helpTopic(topic?: string): HelpTopic | undefined {
  if (!topic) return undefined;
  return TOPIC_ALIASES[topic.trim().toLowerCase()];
}

export function topStrengths(personId: string, n = 3, rec: HelpfulRecord = helpfulOf(personId)): Array<{ topic: HelpTopic; points: number }> {
  return (Object.entries(rec.topics) as Array<[HelpTopic, number]>)
    .filter(([, p]) => p > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([topic, points]) => ({ topic, points }));
}

/**
 * What a Local expert is an expert in: their strongest topic, or the given one
 * when it is among their top two. Undefined below Local expert.
 */
export function expertTopic(personId: string, topic?: string, info: LevelInfo = levelFor(personId)): HelpTopic | undefined {
  if (info.index < 3) return undefined;
  const top = topStrengths(personId, 2);
  const wanted = helpTopic(topic);
  if (wanted) return top.some((s) => s.topic === wanted) ? wanted : undefined;
  return top[0]?.topic;
}

/* ---------- Boards ---------- */

export type BoardScope = 'area' | 'city' | 'clubs' | 'friends';
export type BoardPeriod = 'month' | 'all';
export type BoardSort = 'points' | 'answers' | 'pages' | 'fixes' | 'meetups' | 'rising';

export interface BoardQuery {
  scope: BoardScope;
  period: BoardPeriod;
  sortBy: BoardSort;
  topic?: HelpTopic;
  /** Neighbourhood for the area scope; defaults to yours. */
  area?: string;
  /** People to rank for the clubs scope; defaults to everyone in your clubs. */
  members?: string[];
}

/** Things about you that come from settings and this device. */
export interface BoardContext {
  meIdentity?: Identity;
  meArea?: string;
  /** You turned off "Show me on City heroes boards". */
  hideMe?: boolean;
  following?: string[];
  clubIds?: string[];
  /** Clubs started on this device, which aren't in the sample data. */
  extraClubs?: Group[];
}

export interface BoardRow {
  personId: string;
  rank: number;
  value: number;
  /** This month against last month. */
  delta: number;
  level: LevelInfo;
}

export const SORT_LABEL: Record<BoardSort, string> = {
  points: 'Helpful points',
  answers: 'Helpful answers',
  pages: 'Pages added',
  fixes: 'Issues fixed',
  meetups: 'Meetups hosted',
  rising: 'Rising',
};

/** The unit after a value: "85 helpful", "12 answers". */
export function metricUnit(sortBy: BoardSort, n: number) {
  const one = n === 1;
  switch (sortBy) {
    case 'points':
    case 'rising':
      return 'helpful';
    case 'answers':
      return one ? 'answer' : 'answers';
    case 'pages':
      return one ? 'page' : 'pages';
    case 'fixes':
      return one ? 'fix' : 'fixes';
    case 'meetups':
      return one ? 'meetup' : 'meetups';
  }
}

/** Everyone a club knows about: admins, hosts, people going to meetups and in group buys. */
export function clubMemberIds(club: Group): string[] {
  return Array.from(
    new Set([
      ...club.admins,
      ...(club.meetups ?? []).flatMap((m) => [m.hostId, ...m.going]),
      ...(club.buys ?? []).flatMap((b) => [b.hostId, ...b.joined]),
    ]),
  );
}

const areaOf = (id: string, ctx: BoardContext) => (id === 'me' ? (ctx.meArea ?? PEOPLE.me.area) : (PEOPLE[id]?.area ?? ''));
const identityFor = (id: string, ctx: BoardContext) => (id === 'me' && ctx.meIdentity ? ctx.meIdentity : identityOf(id));

/** Only verified residents (phone and home checked) are ranked, never official accounts. */
export function isRankable(id: string, ctx: BoardContext = {}): boolean {
  if (OFFICIAL.includes(id) || !PEOPLE[id]) return false;
  if (id === 'me' && ctx.hideMe) return false;
  const c = identityFor(id, ctx).checks;
  return c.phone && c.address;
}

/** A share of a total, for topic and monthly slices of all-time numbers. */
const share = (n: number, part: number, whole: number) => (whole > 0 ? Math.round((n * part) / whole) : 0);

export function boardValue(id: string, q: Pick<BoardQuery, 'period' | 'sortBy' | 'topic'>): number {
  const rec = helpfulOf(id);
  const topicPts = q.topic ? (rec.topics[q.topic] ?? 0) : rec.lifetime;
  if (q.topic && topicPts === 0) return 0;
  // Topic slices of monthly numbers follow the same split as lifetime points.
  const slice = (n: number) => (q.topic ? share(n, topicPts, rec.lifetime) : n);
  const month = (n: number) => (q.period === 'month' ? share(n, rec.thisMonth, rec.lifetime) : n);
  switch (q.sortBy) {
    case 'points':
      return q.period === 'month' ? slice(rec.thisMonth) : topicPts;
    case 'rising':
      return slice(rec.thisMonth) - slice(rec.lastMonth);
    case 'answers':
      return month(slice(rec.helpfulAnswers));
    case 'pages':
      return month(slice(rec.pagesAdded));
    case 'fixes':
      return month(slice(rec.issuesFixed));
    case 'meetups':
      return month(slice(rec.meetupsHosted));
  }
}

function scopeIds(q: BoardQuery, ctx: BoardContext): string[] {
  const everyone = Object.keys(PEOPLE);
  switch (q.scope) {
    case 'city':
      return everyone;
    case 'area': {
      const area = q.area ?? areaOf('me', ctx);
      return everyone.filter((id) => areaOf(id, ctx) === area);
    }
    case 'friends':
      return ['me', ...(ctx.following ?? [])];
    case 'clubs': {
      if (q.members) return q.members;
      const clubs = [...(ctx.extraClubs ?? []), ...GROUPS].filter((g) => (ctx.clubIds ?? []).includes(g.id));
      return ['me', ...clubs.flatMap(clubMemberIds)];
    }
  }
}

/** Ranked rows, best first. People with nothing to show for this board are left off. */
export function leaderboard(q: BoardQuery, ctx: BoardContext = {}): BoardRow[] {
  const ids = Array.from(new Set(scopeIds(q, ctx))).filter((id) => isRankable(id, ctx));
  const rows = ids
    .map((personId) => {
      const rec = helpfulOf(personId);
      return {
        personId,
        value: boardValue(personId, q),
        delta: rec.thisMonth - rec.lastMonth,
        lifetime: rec.lifetime,
        level: levelFor(personId, identityFor(personId, ctx), rec),
      };
    })
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value || b.lifetime - a.lifetime || a.personId.localeCompare(b.personId));
  // Equal values share a rank.
  let rank = 0;
  return rows.map((r, i) => {
    if (i === 0 || r.value !== rows[i - 1].value) rank = i + 1;
    return { personId: r.personId, rank, value: r.value, delta: r.delta, level: r.level };
  });
}

/** Where someone stands on a board, if they're on it. */
export function rankOf(personId: string, q: BoardQuery, ctx: BoardContext = {}): { rank: number; of: number; value: number } | undefined {
  const rows = leaderboard(q, ctx);
  const row = rows.find((r) => r.personId === personId);
  return row ? { rank: row.rank, of: rows.length, value: row.value } : undefined;
}
