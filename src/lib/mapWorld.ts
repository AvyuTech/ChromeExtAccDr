import { NEIGHBOURHOOD_POS } from '../data/mapPositions';
import type { PlaceCategory } from '../data/types';

/*
  The Explore map is a whole city you can roam: a large illustrative canvas with
  the detailed west-side map (the one the rest of the app uses) set inside it at
  CORE_OFFSET. Everything is placed in world pixels; the map pans and zooms over it.
*/

export const WORLD_W = 1600;
export const WORLD_H = 1200;
/** Where the detailed west-side map sits inside the world. */
export const CORE_OFFSET: [number, number] = [420, 320];
/** World pixels per kilometre, for the radius ring. */
export const WORLD_PX_PER_KM = 46;

/** Hand-placed spots on the detailed map, in its own coordinates. */
const CORE_PLACE_POS: Record<string, [number, number]> = {
  'quiet-cup': [322, 474],
  'corner-table': [336, 200],
  'brew-lab': [646, 222],
  'seoul-bowl': [238, 186],
  'spice-courtyard': [392, 238],
  'pickle-play': [272, 92],
  'vastrapur-lake': [470, 320],
  'clay-studio': [528, 432],
  'law-garden': [672, 268],
  'riverfront-park': [728, 352],
};

/** Neighbourhood names as places use them, in world pixels. */
const AREA_WORLD: Record<string, [number, number]> = {
  Thaltej: [702, 448],
  Bodakdev: [792, 516],
  'SG Highway': [612, 600],
  'Sindhu Bhavan Rd': [668, 494],
  Vastrapur: [890, 620],
  Satellite: [920, 732],
  'Prahlad Nagar': [740, 778],
  Navrangpura: [1040, 470],
  Riverfront: [1150, 690],
  Paldi: [1090, 800],
  'Old city': [1352, 632],
  Gota: [700, 140],
  Bopal: [250, 760],
};

const core = ([x, y]: [number, number]): [number, number] => [x + CORE_OFFSET[0], y + CORE_OFFSET[1]];

/** A small, stable offset from an id, so things in the same area don't sit on top of each other. */
export function jitter(id: string, spread = 34): [number, number] {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const a = ((h >>> 0) % 360) * (Math.PI / 180);
  const r = spread * (0.45 + (((h >>> 9) % 100) / 100) * 0.55);
  return [Math.round(Math.cos(a) * r), Math.round(Math.sin(a) * r)];
}

const clampWorld = ([x, y]: [number, number]): [number, number] => [Math.min(WORLD_W - 20, Math.max(20, x)), Math.min(WORLD_H - 20, Math.max(20, y))];

/** Where a page sits: its hand-placed spot, or near its neighbourhood. */
export function placeWorldPos(id: string, area: string): [number, number] {
  if (CORE_PLACE_POS[id]) return core(CORE_PLACE_POS[id]);
  const base = AREA_WORLD[area] ?? AREA_WORLD.Bodakdev;
  const [dx, dy] = jitter(id);
  return clampWorld([base[0] + dx, base[1] + dy]);
}

/** Where a club meets, by its neighbourhood id. */
export function clubWorldPos(id: string, areaId: string): [number, number] {
  const base = NEIGHBOURHOOD_POS[areaId] ? core(NEIGHBOURHOOD_POS[areaId]) : AREA_WORLD.Bodakdev;
  const [dx, dy] = jitter(`club-${id}`, 44);
  return clampWorld([base[0] + dx, base[1] + dy]);
}

/** You, at your home neighbourhood. */
export function homeWorldPos(homeId: string): [number, number] {
  return core(NEIGHBOURHOOD_POS[homeId] ?? NEIGHBOURHOOD_POS.bodakdev);
}

/** What a pin's colour says: how locals rate a page, or how active a club is. */
export type Insight = 'loved' | 'liked' | 'mixed' | 'new' | 'active' | 'quiet';

export function placeInsight(c: { total: number; mustPct: number }): Insight {
  if (!c.total) return 'new';
  if (c.mustPct >= 70) return 'loved';
  if (c.mustPct >= 50) return 'liked';
  return 'mixed';
}

export const INSIGHT_LABEL: Record<Insight, string> = {
  loved: 'Loved: 70%+ say must try',
  liked: 'Liked: 50–69% must try',
  mixed: 'Mixed: under 50%',
  new: 'New or not enough visits yet',
  active: 'Club with meetups coming up',
  quiet: 'Club with nothing planned',
};

/** Categories that are on the map (day trips are outside the city). */
export const MAP_CATEGORIES: PlaceCategory[] = ['cafe', 'food', 'sports', 'nature', 'culture', 'heritage', 'shopping'];

/** Labels drawn on the world, so the outer city has names too. */
export const WORLD_LABELS: Array<{ text: string; x: number; y: number; kind?: 'road' | 'water' | 'minor'; rotate?: number }> = [
  { text: 'Thaltej', x: 720, y: 460 },
  { text: 'Bodakdev', x: 876, y: 538 },
  { text: 'Vastrapur', x: 940, y: 650 },
  { text: 'Satellite', x: 1010, y: 720 },
  { text: 'Prahlad Nagar', x: 670, y: 740 },
  { text: 'Navrangpura', x: 980, y: 448 },
  { text: 'Paldi', x: 1050, y: 826 },
  { text: 'Old city', x: 1360, y: 600 },
  { text: 'Gota', x: 720, y: 120 },
  { text: 'Science City', x: 400, y: 230, kind: 'minor' },
  { text: 'Sola', x: 880, y: 250 },
  { text: 'Chandkheda', x: 1320, y: 110 },
  { text: 'Bopal', x: 230, y: 740 },
  { text: 'Shela', x: 260, y: 1000, kind: 'minor' },
  { text: 'Kankaria', x: 1330, y: 1010, kind: 'water' },
  { text: 'Maninagar', x: 1420, y: 1130 },
  { text: 'SG Highway', x: 590, y: 820, kind: 'road', rotate: 87 },
  { text: 'Ashram Rd', x: 1238, y: 360, kind: 'road', rotate: 88 },
  { text: 'Sabarmati', x: 1176, y: 180, kind: 'water', rotate: 84 },
  { text: 'SP Ring Road', x: 160, y: 520, kind: 'road', rotate: -80 },
];
