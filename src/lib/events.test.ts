import { describe, expect, it } from 'vitest';
import { eventById } from '../data/events';
import { DEFAULT_APP_DATA, type AppData } from '../state/appData';
import { daysAway, eventSocial, eventVoteId, trendRank, trendScore, trendingEvents } from './events';

const data: AppData = { ...DEFAULT_APP_DATA };
const sufi = eventById('sufi-night')!;
const mic = eventById('open-mic')!;

describe('event social', () => {
  it('counts you once when you say you are going, and shows friends going first', () => {
    const before = eventSocial(mic, data);
    const after = eventSocial(mic, { ...data, eventStatus: { ...data.eventStatus, 'open-mic': 'going' } });
    expect(after.going).toBe(before.going + 1);
    expect(after.status).toBe('going');
    expect(before.friendsGoing).toContain('karan');
    expect(before.goingIds[0]).toBe('karan');
  });

  it('does not double count a status the sample data already has', () => {
    expect(eventSocial(sufi, data).interested).toBe(sufi.interestedCount);
  });

  it('nets your vote into the score', () => {
    const up = eventSocial(mic, { ...data, upvoted: [...data.upvoted, eventVoteId('open-mic')] });
    expect(up.score).toBe((mic.upvotes ?? 0) - (mic.downvotes ?? 0) + 1);
  });
});

describe('trending', () => {
  it('ranks sooner events higher than the same pull later', () => {
    expect(daysAway('Today')).toBeLessThan(daysAway('Sun'));
  });

  it('lifts an event when people go to it', () => {
    const busy: AppData = { ...data, eventStatus: { ...data.eventStatus, 'pottery': 'going' } };
    expect(trendScore(eventById('pottery')!, busy)).toBeGreaterThan(trendScore(eventById('pottery')!, data));
  });

  it('only ranks confirmed events, and only the top three get a rank', () => {
    const list = trendingEvents(data);
    expect(list.every((e) => e.confirmed)).toBe(true);
    expect(trendRank(list[0], data)).toBe(1);
    expect(trendRank(list[3], data)).toBeUndefined();
  });
});
