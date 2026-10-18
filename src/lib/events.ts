import { EVENTS } from '../data/events';
import { profileInfo } from './friends';
import type { CityEvent } from '../data/types';
import type { AppData } from '../state/appData';
import { DEFAULT_APP_DATA } from '../state/appData';

/*
  Events are social, not sold. People say they're interested or going, vote them
  up or down, and talk about them; friends see who's going, and the events people
  care about trend up the feeds. Tickets are always a link out.
*/

/** The id events use for votes and replies, so they never clash with posts. */
export const eventVoteId = (eventId: string) => `ev-${eventId}`;
export const eventThreadId = (eventId: string) => `event:${eventId}`;

/** Days until it starts: today 0, tomorrow 1, this Friday 1, Saturday 2, Sunday 3. */
export function daysAway(day: CityEvent['day']): number {
  return { Today: 0, Tomorrow: 1, Fri: 1, Sat: 2, 'Sat–Sun': 2, Sun: 3 }[day] ?? 3;
}

export interface EventSocial {
  status?: 'interested' | 'going';
  /** Everyone going, including you. */
  going: number;
  interested: number;
  /** Friends going, then you if you are and you let people see it. */
  friendsGoing: string[];
  /** Friends who saved it to Want to try but haven't said they're going. */
  friendsInterested: string[];
  /** Named people going: friends first, then others. */
  goingIds: string[];
  replies: number;
  /** Net votes. */
  score: number;
  /** People going alone who'd like company (you included if you said so). */
  company: string[];
}

export function eventSocial(e: CityEvent, data: AppData): EventSocial {
  const status = data.eventStatus[e.id];
  const seeded = DEFAULT_APP_DATA.eventStatus[e.id];
  const named = e.goingIds ?? [];
  const friendsGoing = named.filter((id) => data.following.includes(id));
  const friendsInterested = data.following.filter((id) => !friendsGoing.includes(id) && profileInfo(id).wantToTry.some((w) => w.refId === e.id && !w.done));
  const meGoing = status === 'going' ? 1 : 0;
  const meInterested = status === 'interested' ? 1 : 0;
  // Seed counts already include a seeded status, so only count the difference.
  const going = (e.goingCount ?? named.length) + meGoing - (seeded === 'going' ? 1 : 0);
  const interested = (e.interestedCount ?? 0) + meInterested - (seeded === 'interested' ? 1 : 0);
  const vote = eventVoteId(e.id);
  const mine = data.upvoted.includes(vote) ? 1 : data.downvoted.includes(vote) ? -1 : 0;
  const replies = (e.replyCount ?? e.replies?.length ?? 0) + (data.myReplies[eventThreadId(e.id)]?.length ?? 0);
  return {
    status,
    going,
    interested,
    friendsGoing,
    friendsInterested,
    goingIds: [...friendsGoing, ...named.filter((id) => !friendsGoing.includes(id))],
    replies,
    score: (e.upvotes ?? 0) - (e.downvotes ?? 0) + mine,
    company: [...(data.eventCompany.includes(e.id) ? ['me'] : []), ...(e.lookingForCompany ?? [])],
  };
}

/**
 * How much an event is catching on: votes, people going and interested, friends
 * going (counted heavily, it's your feed), and talk; sooner events rank higher.
 */
export function trendScore(e: CityEvent, data: AppData): number {
  const s = eventSocial(e, data);
  const pull = s.score + s.going * 2 + s.interested * 0.6 + s.friendsGoing.length * 10 + s.replies;
  return pull / (1 + daysAway(e.day) / 2);
}

/** Confirmed events, most catching on first. */
export function trendingEvents(data: AppData, events: CityEvent[] = EVENTS): CityEvent[] {
  return events
    .filter((e) => e.confirmed)
    .map((e) => ({ e, t: trendScore(e, data) }))
    .sort((a, b) => b.t - a.t || a.e.title.localeCompare(b.e.title))
    .map((x) => x.e);
}

/** "#1 trending" for the top three confirmed events, nothing otherwise. */
export function trendRank(e: CityEvent, data: AppData): number | undefined {
  const i = trendingEvents(data).findIndex((x) => x.id === e.id);
  return i >= 0 && i < 3 ? i + 1 : undefined;
}
