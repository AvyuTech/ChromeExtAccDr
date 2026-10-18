import { describe, expect, it } from 'vitest';
import { PULSE } from '../data/city';
import type { SourceId } from '../data/types';
import { ask, detectIntent, type AskOptions } from './askEngine';

const base: AskOptions = {
  sourceAllowed: () => true,
  showUnconfirmed: true,
  minAgreement: 1,
  length: 'balanced',
  pulse: PULSE,
  homeArea: 'Bodakdev',
};

describe('detectIntent', () => {
  it.each([
    ["What's happening this weekend?", 'events'],
    ['quiet café with good wifi', 'cafe'],
    ['How is traffic on SG Highway?', 'traffic'],
    ['next metro near me', 'transit'],
    ['is the water supply normal', 'water'],
    ['what is the AQI', 'air'],
    ['power cut in satellite', 'power'],
    ['report a pothole', 'civic'],
    ['nearest hospital', 'safety'],
    ['any food deals', 'deals'],
    ['what are my friends eating', 'friends'],
    ['zzzz', 'general'],
  ])('%s → %s', (q, intent) => {
    expect(detectIntent(q)).toBe(intent);
  });
});

describe('ask', () => {
  it('answers the weekend question with merged sources', () => {
    const r = ask("What's happening this weekend?", base);
    expect(r.intent).toBe('events');
    expect(r.results.length).toBeGreaterThan(3);
    expect(r.results.every((x) => x.type === 'event')).toBe(true);
    expect(r.answer).toMatch(/things happening/);
    expect(r.sources).toContain('tickets');
  });

  it('keeps only free events when asked', () => {
    const r = ask('free things to do this weekend', base);
    expect(r.answer).toMatch(/free things/);
    expect(r.results.map((x) => x.id)).toEqual(expect.arrayContaining(['flea-market']));
    expect(r.results.map((x) => x.id)).not.toContain('sufi-night');
  });

  it('drops unconfirmed listings when the setting is off', () => {
    const on = ask("What's happening this weekend?", base).results.map((x) => x.id);
    const off = ask("What's happening this weekend?", { ...base, showUnconfirmed: false }).results.map((x) => x.id);
    expect(on).toContain('food-trucks');
    expect(off).not.toContain('food-trucks');
  });

  it('respects switched-off sources', () => {
    const noInstagram = (id: SourceId) => id !== 'instagram';
    const r = ask("What's happening this weekend?", { ...base, sourceAllowed: noInstagram });
    expect(r.sources).not.toContain('instagram');
    // The food truck festival was only seen on Instagram, so it disappears.
    expect(r.results.map((x) => x.id)).not.toContain('food-trucks');
  });

  it('brief answers are a single sentence', () => {
    const r = ask('quiet café with wifi', { ...base, length: 'brief' });
    expect(r.answer.split('. ').length).toBe(1);
  });

  it('reports the slowest road from the live pulse', () => {
    const r = ask('traffic now', base);
    expect(r.answer).toMatch(/SG Highway/);
    expect(r.results[0]).toEqual({ type: 'corridor', id: 'sg' });
  });

  it('gives the national emergency number for safety questions', () => {
    expect(ask('I need an ambulance', base).answer).toMatch(/112/);
  });

  it('falls back helpfully when nothing matches', () => {
    const r = ask('qwertyuiop', base);
    expect(r.results).toHaveLength(0);
    expect(r.followUps.length).toBeGreaterThan(0);
  });
});

describe('answer wording', () => {
  it('keeps proper nouns capitalised mid-sentence', () => {
    expect(ask('traffic now', base).answer).toMatch(/Cause: signal fault at Iscon crossroads/);
  });

  it('matches groups by topic', () => {
    expect(ask('pickleball groups', base).answer).toMatch(/Pickleball Ahmedabad/);
  });
});

describe('friends', () => {
  const withFriends = { ...base, following: ['riya', 'aditi', 'karan'] };

  it('summarises what friends checked in', () => {
    const r = ask('what are my friends eating this week', withFriends);
    expect(r.intent).toBe('friends');
    expect(r.results.every((x) => x.type === 'checkin')).toBe(true);
    expect(r.answer).toMatch(/Riya|Aditi|Karan/);
  });

  it('mentions a friend’s verdict in place answers', () => {
    expect(ask('quiet café with wifi', withFriends).answer).toMatch(/Your friend Riya says \*\*must try\*\*/);
  });
});
