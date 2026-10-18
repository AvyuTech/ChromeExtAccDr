import { describe, expect, it } from 'vitest';
import { DEFAULT_APP_DATA, type AppData } from '../state/appData';
import { DEFAULT_SETTINGS } from '../state/settings';
import { canSee, friendFeed, placeCommunity, planTogether, storyPeople, suggestions, tasteMatch } from './friends';
import { CHECKINS } from '../data/friends';
import type { CheckIn } from '../data/types';

const data: AppData = { ...DEFAULT_APP_DATA };

describe('friend feed', () => {
  it('shows only people you follow', () => {
    const feed = friendFeed(data);
    expect(feed.length).toBeGreaterThan(3);
    expect(feed.every((c) => data.following.includes(c.authorId))).toBe(true);
  });

  it('hides friends-only check-ins from people who do not follow you back', () => {
    const harshPost = CHECKINS.find((c) => c.id === 'ci-harsh-corner')!;
    expect(canSee(data, harshPost)).toBe(false);
    expect(canSee({ ...data, following: [...data.following, 'harsh'] }, harshPost)).toBe(true);
  });

  it('puts unseen friends first in the Home strip', () => {
    const strip = storyPeople({ ...data, seenStories: ['riya'] });
    expect(strip.length).toBeGreaterThan(1);
    expect(strip[strip.length - 1].id).toBe('riya');
  });
});

describe('community verdicts', () => {
  it('leaves invited and unverified visits out of the score', () => {
    const brew = placeCommunity('brew-lab', data, DEFAULT_SETTINGS);
    expect(brew.excluded).toBe(1);
    expect(brew.mustPct + brew.goodPct + brew.skipPct).toBeGreaterThanOrEqual(99);
  });

  it('lists friends’ reviews before strangers’', () => {
    const seoul = placeCommunity('seoul-bowl', data, DEFAULT_SETTINGS);
    expect(seoul.reviews[0].authorId).not.toBe('zoya');
    expect(seoul.friendIds).toEqual(expect.arrayContaining(['aditi', 'karan']));
  });

  const mine = (): CheckIn => ({
    id: 'mine',
    authorId: 'me',
    kind: 'ate',
    placeId: 'seoul-bowl',
    placeName: 'Seoul Bowl',
    area: 'x',
    items: ['Kimchi pancake'],
    verdict: 'must',
    tags: [],
    audience: 'friends',
    verifiedVisit: true,
    ago: 'now',
    recency: 0,
    likes: 0,
    comments: [],
  });

  it('counts your own check-in', () => {
    const before = placeCommunity('seoul-bowl', data, DEFAULT_SETTINGS).must;
    const after = placeCommunity('seoul-bowl', { ...data, myCheckIns: [mine()] }, DEFAULT_SETTINGS);
    expect(after.must).toBe(before + 1);
    expect(after.reviews[0].id).toBe('mine');
  });

  it('never counts the verdict of the person who runs the page', () => {
    // Jay runs Pickle & Play, so a Must try from Jay there changes nothing.
    const own = { ...mine(), placeId: 'pickle-play', placeName: 'Pickle & Play' };
    const before = placeCommunity('pickle-play', data, DEFAULT_SETTINGS);
    const after = placeCommunity('pickle-play', { ...data, myCheckIns: [own] }, DEFAULT_SETTINGS);
    expect(after.must).toBe(before.must);
    expect(after.excluded).toBe(before.excluded + 1);
  });
});

describe('people', () => {
  it('scores taste match between 50 and 98', () => {
    for (const id of ['riya', 'dev', 'zoya']) {
      const m = tasteMatch(DEFAULT_SETTINGS, id);
      expect(m).toBeGreaterThanOrEqual(50);
      expect(m).toBeLessThanOrEqual(98);
    }
  });

  it('suggests people you do not follow, followers first', () => {
    const s = suggestions(data, DEFAULT_SETTINGS);
    expect(s.some((x) => data.following.includes(x.id))).toBe(false);
    expect(s[0].reason).toBe('Follows you');
  });

  it('finds plans you share with friends', () => {
    const plans = planTogether(data);
    expect(plans.some((p) => p.personId === 'riya' && p.item.refId === 'polo-forest')).toBe(true);
  });
});
