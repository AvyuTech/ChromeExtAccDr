import { describe, expect, it } from 'vitest';
import { EARN_RULES, HELPFUL, LEVELS, MY_LEDGER } from '../data/helpful';
import { identityOf } from '../data/identity';
import { GROUPS } from '../data/social';
import { boardValue, clubMemberIds, expertTopic, helpTopic, isRankable, leaderboard, levelFor, rankOf, topStrengths } from './helpful';

describe('levels', () => {
  it('needs points and checks', () => {
    expect(levelFor('zoya').level.id).toBe('hero');
    expect(levelFor('aditi').level.id).toBe('hero');
    expect(levelFor('farah').level.id).toBe('guide');
    expect(levelFor('meera').level.id).toBe('expert');
    expect(levelFor('me').level.id).toBe('regular');
    expect(levelFor('priyank').level.id).toBe('newcomer');
  });

  it('holds a level when a check is missing and says which', () => {
    const dev = levelFor('dev');
    expect(dev.points).toBeGreaterThanOrEqual(200);
    expect(dev.level.id).toBe('neighbour');
    expect(dev.held).toBe(true);
    expect(dev.missing).toContain('address');
  });

  it('drops back when a check is lost, without losing points', () => {
    const me = identityOf('me');
    const unverified = levelFor('me', { ...me, checks: { ...me.checks, address: false } });
    expect(unverified.level.id).toBe('neighbour');
    expect(unverified.points).toBe(HELPFUL.me.lifetime);
  });

  it('shows progress to the next level', () => {
    const me = levelFor('me');
    expect(me.next?.id).toBe('expert');
    expect(me.toNext).toBe(600 - HELPFUL.me.lifetime);
    expect(me.progress).toBeGreaterThan(0);
    expect(me.progress).toBeLessThan(1);
    expect(levelFor('zoya').next).toBeUndefined();
  });

  it('keeps thresholds rising', () => {
    LEVELS.slice(1).forEach((l, i) => expect(l.min).toBeGreaterThan(LEVELS[i].min));
  });
});

describe('records', () => {
  it('splits lifetime points across topics', () => {
    Object.entries(HELPFUL).forEach(([id, rec]) => {
      const sum = Object.values(rec.topics).reduce((a, b) => a + (b ?? 0), 0);
      expect(sum, id).toBe(rec.lifetime);
    });
  });

  it('matches this month’s history to this month’s points', () => {
    const month = MY_LEDGER.filter((e) => e.thisMonth).reduce((a, e) => a + e.points, 0);
    expect(month).toBe(HELPFUL.me.thisMonth);
  });

  it('never pays for posting', () => {
    expect(EARN_RULES.every((r) => r.points > 0)).toBe(true);
    expect(EARN_RULES.some((r) => /post something|write a post/i.test(r.what))).toBe(false);
  });
});

describe('topics', () => {
  it('maps post topics', () => {
    expect(helpTopic('New place')).toBe('New openings');
    expect(helpTopic('Sports')).toBe('Fitness & sports');
    expect(helpTopic('Nonsense')).toBeUndefined();
  });

  it('names what someone is known for', () => {
    expect(topStrengths('zoya', 1)[0].topic).toBe('Food');
    expect(expertTopic('meera')).toBe('Parenting');
    expect(expertTopic('meera', 'Food')).toBe('Food');
    expect(expertTopic('meera', 'Traffic')).toBeUndefined();
    expect(expertTopic('me')).toBeUndefined();
  });
});

describe('boards', () => {
  it('ranks only verified residents', () => {
    expect(isRankable('dev')).toBe(false);
    expect(isRankable('ward')).toBe(false);
    expect(isRankable('me', { hideMe: true })).toBe(false);
    const city = leaderboard({ scope: 'city', period: 'all', sortBy: 'points' });
    expect(city.some((r) => r.personId === 'dev' || r.personId === 'ward')).toBe(false);
    expect(city[0].personId).toBe('zoya');
  });

  it('sorts in different ways', () => {
    const fixes = leaderboard({ scope: 'city', period: 'all', sortBy: 'fixes' });
    expect(fixes[0].personId).toBe('farah');
    const rising = leaderboard({ scope: 'city', period: 'month', sortBy: 'rising' });
    expect(rising[0].personId).toBe('riya');
    expect(rising.every((r) => r.value > 0)).toBe(true);
    const meetups = leaderboard({ scope: 'city', period: 'all', sortBy: 'meetups' });
    expect(meetups[0].personId).toBe('aditi');
  });

  it('filters by area, topic and friends', () => {
    const bodakdev = leaderboard({ scope: 'area', area: 'Bodakdev', period: 'month', sortBy: 'points' });
    expect(bodakdev.map((r) => r.personId)).toEqual(['aditi', 'me', 'harsh']);
    const pets = leaderboard({ scope: 'city', period: 'all', sortBy: 'points', topic: 'Pets' });
    expect(pets.map((r) => r.personId)).toEqual(['sana']);
    expect(boardValue('zoya', { period: 'all', sortBy: 'points', topic: 'Food' })).toBe(2400);
    const friends = leaderboard({ scope: 'friends', period: 'all', sortBy: 'points' }, { following: ['riya'] });
    expect(friends.map((r) => r.personId)).toEqual(['riya', 'me']);
  });

  it('ranks club members', () => {
    const cricket = GROUPS.find((g) => g.id === 'sunday-cricket')!;
    const members = clubMemberIds(cricket);
    expect(members).toContain('karan');
    const rows = leaderboard({ scope: 'clubs', members, period: 'month', sortBy: 'points' });
    expect(rows[0].personId).toBe('zoya');
    expect(rankOf('karan', { scope: 'clubs', members, period: 'month', sortBy: 'points' })?.rank).toBeGreaterThan(1);
  });

  it('shares a rank on a tie', () => {
    const rows = leaderboard({ scope: 'city', period: 'all', sortBy: 'pages' });
    rows.forEach((r, i) => {
      if (i > 0 && r.value === rows[i - 1].value) expect(r.rank).toBe(rows[i - 1].rank);
    });
  });
});
