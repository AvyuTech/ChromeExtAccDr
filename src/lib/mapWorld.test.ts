import { describe, expect, it } from 'vitest';
import { PLACES } from '../data/places';
import { GROUPS } from '../data/social';
import { clubWorldPos, homeWorldPos, jitter, placeInsight, placeWorldPos, WORLD_H, WORLD_W } from './mapWorld';

const inWorld = ([x, y]: [number, number]) => x > 0 && x < WORLD_W && y > 0 && y < WORLD_H;

describe('map world', () => {
  it('puts every city page, club and home inside the world', () => {
    for (const p of PLACES.filter((x) => !x.origin.outsideCity)) expect(inWorld(placeWorldPos(p.id, p.area))).toBe(true);
    for (const c of GROUPS) expect(inWorld(clubWorldPos(c.id, c.areaId))).toBe(true);
    expect(inWorld(homeWorldPos('bodakdev'))).toBe(true);
  });

  it('places things the same way every time', () => {
    expect(jitter('board-brew')).toEqual(jitter('board-brew'));
    expect(placeWorldPos('board-brew', 'Navrangpura')).toEqual(placeWorldPos('board-brew', 'Navrangpura'));
  });

  it('colours pages by what locals say', () => {
    expect(placeInsight({ total: 0, mustPct: 0 })).toBe('new');
    expect(placeInsight({ total: 40, mustPct: 77 })).toBe('loved');
    expect(placeInsight({ total: 40, mustPct: 59 })).toBe('liked');
    expect(placeInsight({ total: 40, mustPct: 38 })).toBe('mixed');
  });
});
