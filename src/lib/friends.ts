import { CHECKINS, COLLECTIONS, COMMUNITY_BASE, PLACE_ITEMS, PROFILE_INFO } from '../data/friends';
import { PEOPLE } from '../data/core';
import type { CheckIn, Collection, ProfileInfo, Verdict, WantItem } from '../data/types';
import { sameWant, type AppData } from '../state/appData';
import type { Settings } from '../state/settings';

/* Friends layer logic: who you follow, what they checked in, community
   verdicts per place, taste match and shared plans. */

export const VERDICT_LABEL: Record<Verdict, { ate: string; did: string }> = {
  must: { ate: 'Must try', did: 'Must do' },
  good: { ate: 'Good', did: 'Good' },
  skip: { ate: 'Skip', did: 'Skip' },
};

export function profileInfo(id: string): ProfileInfo {
  return (
    PROFILE_INFO[id] ?? {
      handle: id,
      bio: '',
      followers: 0,
      following: 0,
      checkIns: 0,
      places: 0,
      since: '2024',
      tasteTags: [],
      followsMe: false,
      wantToTry: [],
      collections: [],
    }
  );
}

export const isFollowing = (data: AppData, id: string) => data.following.includes(id);
/** Friends are people you follow who follow you back. */
export const isFriend = (data: AppData, id: string) => isFollowing(data, id) && profileInfo(id).followsMe;

/** Every check-in in the app, newest first: yours, then the sample community. */
export function allCheckIns(data: AppData): CheckIn[] {
  return [...data.myCheckIns, ...CHECKINS];
}

export function checkInFor(data: AppData, id: string): CheckIn | undefined {
  return allCheckIns(data).find((c) => c.id === id);
}

/** Can this viewer see the check-in? Friends-only posts are visible to people the author follows back. */
export function canSee(data: AppData, c: CheckIn) {
  if (c.authorId === 'me' || c.audience === 'everyone') return true;
  return isFollowing(data, c.authorId) && profileInfo(c.authorId).followsMe;
}

/** Check-ins from people you follow, most recent first. */
export function friendFeed(data: AppData): CheckIn[] {
  return CHECKINS.filter((c) => isFollowing(data, c.authorId) && canSee(data, c)).sort((a, b) => a.recency - b.recency);
}

/** People you follow who checked in today, unseen first: the strip at the top of Home. */
export function storyPeople(data: AppData): Array<{ id: string; latest: CheckIn; count: number; seen: boolean }> {
  const today = friendFeed(data).filter((c) => c.recency === 0);
  const byPerson = new Map<string, CheckIn[]>();
  for (const c of today) byPerson.set(c.authorId, [...(byPerson.get(c.authorId) ?? []), c]);
  return [...byPerson.entries()]
    .map(([id, list]) => ({ id, latest: list[0], count: list.length, seen: data.seenStories.includes(id) }))
    .sort((a, b) => Number(a.seen) - Number(b.seen));
}

/** Taste overlap between you and someone else, shown as a 50–98% match. */
export function tasteMatch(settings: Settings, personId: string): number {
  const mine = new Set([...profileInfo('me').tasteTags, ...settings.interests.map((i) => (i === 'cafe' ? 'cafes' : i))]);
  const theirs = new Set(profileInfo(personId).tasteTags);
  if (theirs.size === 0) return 50;
  const shared = [...theirs].filter((t) => mine.has(t)).length;
  const union = new Set([...mine, ...theirs]).size;
  return Math.round(50 + (shared / union) * 48 + Math.min(shared, 3) * 4);
}

export interface PlaceCommunity {
  total: number;
  must: number;
  good: number;
  skip: number;
  mustPct: number;
  goodPct: number;
  skipPct: number;
  verifiedPct: number;
  items: Array<{ name: string; count: number; mustPct: number }>;
  /** Check-ins shown as reviews: friends first, then by taste match, then recency. */
  reviews: CheckIn[];
  friendIds: string[];
  /** Free or invited visits, shown but not counted. */
  excluded: number;
}

export function placeCommunity(placeId: string, data: AppData, settings: Settings): PlaceCommunity {
  const base = COMMUNITY_BASE[placeId] ?? { must: 0, good: 0, skip: 0, verifiedPct: 0, items: [] };
  const live = allCheckIns(data).filter((c) => c.placeId === placeId && canSee(data, c));
  const counted = live.filter((c) => !c.invited && c.verifiedVisit);
  const tally = { must: base.must, good: base.good, skip: base.skip };
  for (const c of counted) tally[c.verdict] += 1;
  const total = tally.must + tally.good + tally.skip;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  const items = new Map(base.items.map((i) => [i.name, { ...i }]));
  for (const c of counted) {
    for (const name of c.items) {
      const cur = items.get(name) ?? { name, count: 0, mustPct: 0 };
      const mustCount = Math.round((cur.mustPct / 100) * cur.count) + (c.verdict === 'must' ? 1 : 0);
      cur.count += 1;
      cur.mustPct = Math.round((mustCount / cur.count) * 100);
      items.set(name, cur);
    }
  }

  const friendRank = (c: CheckIn) => (c.authorId === 'me' ? 2 : isFollowing(data, c.authorId) ? 1 : 0);
  const reviews = [...live].sort(
    (a, b) => friendRank(b) - friendRank(a) || tasteMatch(settings, b.authorId) - tasteMatch(settings, a.authorId) || a.recency - b.recency,
  );
  return {
    total,
    ...tally,
    mustPct: pct(tally.must),
    goodPct: pct(tally.good),
    skipPct: pct(tally.skip),
    verifiedPct: base.verifiedPct,
    items: [...items.values()].sort((a, b) => b.count - a.count),
    reviews,
    friendIds: Array.from(new Set(live.filter((c) => isFollowing(data, c.authorId)).map((c) => c.authorId))),
    excluded: live.length - counted.length,
  };
}

/** Choices offered in the quick check-in for a place. */
export function itemsFor(placeId?: string): string[] {
  return (placeId && PLACE_ITEMS[placeId]) || [];
}

/** Items on both your list and theirs: "You both want to try". */
export function sharedWants(data: AppData, personId: string): WantItem[] {
  const theirs = profileInfo(personId).wantToTry.filter((w) => !w.done);
  return data.wantToTry.filter((m) => !m.done && theirs.some((t) => t.refId && t.refId === m.refId));
}

/** Friends who also want to do things on your list: plan-together suggestions. */
export function planTogether(data: AppData): Array<{ personId: string; item: WantItem }> {
  const out: Array<{ personId: string; item: WantItem }> = [];
  for (const id of data.following) {
    for (const item of sharedWants(data, id)) out.push({ personId: id, item });
  }
  return out;
}

/** Friends' must-tries from this week, one per place. */
export function friendsMustTries(data: AppData): CheckIn[] {
  const seen = new Set<string>();
  return friendFeed(data)
    .filter((c) => c.verdict === 'must' && c.recency <= 1)
    .filter((c) => {
      const key = c.placeId ?? c.placeName;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

/** Suggested people to follow, with the reason shown on the row. */
export function suggestions(data: AppData, settings: Settings): Array<{ id: string; reason: string }> {
  return Object.keys(PROFILE_INFO)
    .filter((id) => id !== 'me' && !isFollowing(data, id) && PEOPLE[id])
    .map((id) => {
      const info = profileInfo(id);
      const match = tasteMatch(settings, id);
      const reason = info.followsMe ? 'Follows you' : PEOPLE[id].area === PEOPLE.me.area ? `Also in ${PEOPLE.me.area}` : `${match}% taste match`;
      return { id, reason, score: (info.followsMe ? 100 : 0) + match };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ id, reason }) => ({ id, reason }));
}

export function collectionsFor(data: AppData, ownerId: string): Collection[] {
  const all = [...data.myCollections, ...COLLECTIONS];
  return all.filter((c) => c.ownerId === ownerId);
}

export function collectionFor(data: AppData, id: string): Collection | undefined {
  return [...data.myCollections, ...COLLECTIONS].find((c) => c.id === id);
}

export function isWanted(data: AppData, item: Pick<WantItem, 'refId' | 'title'>) {
  return data.wantToTry.some((w) => sameWant(w, item));
}
