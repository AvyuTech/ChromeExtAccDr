import type { TrafficLevel } from '../icons/live';
import type { Corridor } from '../data/types';

/*
 * A small road graph over the illustrative map (same coordinates as CityMap's
 * canvas), used to colour roads by live traffic, place congestion hotspots and
 * suggest routes between neighbourhoods. Live corridors set the speed of the
 * roads they cover; the rest use a typical level for this time of day.
 */

/** Map pixels per kilometre for trip lengths (the map is not to scale). */
const ROUTE_PX_PER_KM = 70;
/** Typical arterial speed in free-flowing traffic, km/h. */
const FREE_KMH = 28;
/** Speed for roads without live data, by their typical level. */
const STATIC_KMH: Record<TrafficLevel, number> = { 0: 28, 1: 20, 2: 13, 3: 8 };
/** Time lost turning from one road onto another, minutes. */
const TURN_MIN = 0.8;

export type RoadId = 'sg' | 'ring' | 'cg' | 'judges' | 'ashram' | 'drivein' | 'sindhu' | 'arc' | 'iim' | 'link';

interface RoadDef {
  name: string;
  /** SVG path on the map canvas. */
  d: string;
  /** The live corridor that sets this road's speed. */
  corridor?: string;
  /** Typical level when there is no live corridor. */
  typical?: TrafficLevel;
  /** Minor roads are not coloured on the heat map. */
  minor?: boolean;
}

export const ROADS: Record<RoadId, RoadDef> = {
  sg: { name: 'SG Highway', d: 'M178 -10 L196 572', corridor: 'sg' },
  ring: { name: '132 Ft Ring Road', d: 'M300 -10 L330 572', corridor: 'ring' },
  cg: { name: 'CG Road', d: 'M640 -10 L660 572', corridor: 'cg' },
  ashram: { name: 'Ashram Road', d: 'M700 -10 C688 150 712 300 698 572', corridor: 'ashram' },
  judges: { name: 'Judges Bungalow Rd', d: 'M186 242 C300 236 420 250 524 262', corridor: 'judges' },
  drivein: { name: 'Drive-in Road', d: 'M178 136 C330 128 500 120 640 112', typical: 1 },
  sindhu: { name: 'Sindhu Bhavan Rd', d: 'M188 192 L362 182', typical: 1 },
  arc: { name: 'Satellite Road', d: 'M-10 334 C180 344 330 382 420 422 S560 520 620 572', typical: 1 },
  iim: { name: 'IIM Road', d: 'M420 422 L470 334 L640 302', typical: 0 },
  link: { name: 'Vastrapur link', d: 'M524 262 L530 323', typical: 0, minor: true },
};

type NodeId = string;

const NODES: Record<NodeId, [number, number]> = {
  sgThaltej: [181, 136],
  sgSindhu: [182, 192],
  sgJudges: [184, 242],
  sgMid: [185, 290],
  iscon: [186, 338],
  driveThaltej: [262, 133],
  helmet: [306, 130],
  driveMid: [470, 122],
  cgN: [644, 112],
  ringSindhu: [309, 186],
  sindhuE: [362, 182],
  ringJudges: [312, 240],
  judgesBodak: [366, 244],
  judgesMid: [420, 249],
  judgesE: [524, 262],
  ringShiv: [322, 390],
  ringPN: [324, 458],
  satJn: [420, 422],
  vastraIim: [470, 334],
  iimE: [530, 323],
  cgNav: [645, 160],
  cgPanch: [647, 214],
  cgIim: [650, 302],
  cgS: [655, 430],
};

/** Edges follow the drawn roads, so a route's points trace the map. */
const EDGES: Array<[NodeId, NodeId, RoadId]> = [
  ['sgThaltej', 'sgSindhu', 'sg'],
  ['sgSindhu', 'sgJudges', 'sg'],
  ['sgJudges', 'sgMid', 'sg'],
  ['sgMid', 'iscon', 'sg'],
  ['sgThaltej', 'driveThaltej', 'drivein'],
  ['driveThaltej', 'helmet', 'drivein'],
  ['helmet', 'driveMid', 'drivein'],
  ['driveMid', 'cgN', 'drivein'],
  ['sgSindhu', 'ringSindhu', 'sindhu'],
  ['ringSindhu', 'sindhuE', 'sindhu'],
  ['sgJudges', 'ringJudges', 'judges'],
  ['ringJudges', 'judgesBodak', 'judges'],
  ['judgesBodak', 'judgesMid', 'judges'],
  ['judgesMid', 'judgesE', 'judges'],
  ['helmet', 'ringSindhu', 'ring'],
  ['ringSindhu', 'ringJudges', 'ring'],
  ['ringJudges', 'ringShiv', 'ring'],
  ['ringShiv', 'ringPN', 'ring'],
  ['iscon', 'ringShiv', 'arc'],
  ['ringShiv', 'satJn', 'arc'],
  ['satJn', 'vastraIim', 'iim'],
  ['vastraIim', 'iimE', 'iim'],
  ['iimE', 'cgIim', 'iim'],
  ['judgesE', 'iimE', 'link'],
  ['cgN', 'cgNav', 'cg'],
  ['cgNav', 'cgPanch', 'cg'],
  ['cgPanch', 'cgIim', 'cg'],
  ['cgIim', 'cgS', 'cg'],
];

/** Where each neighbourhood joins the road graph. */
const ACCESS: Record<string, NodeId> = {
  thaltej: 'driveThaltej',
  bodakdev: 'judgesBodak',
  'sg-highway': 'sgMid',
  vastrapur: 'vastraIim',
  satellite: 'satJn',
  'prahlad-nagar': 'ringPN',
  navrangpura: 'cgNav',
  paldi: 'cgS',
};

export const ROUTABLE = Object.keys(ACCESS);

/** Congestion hotspots, each tied to the corridor that drives it. */
const HOTSPOTS: Array<{ id: string; label: string; x: number; y: number; road: RoadId }> = [
  { id: 'iscon', label: 'Iscon crossroads', x: 186, y: 338, road: 'sg' },
  { id: 'thaltej-x', label: 'Thaltej crossroads', x: 182, y: 150, road: 'sg' },
  { id: 'helmet', label: 'Helmet circle', x: 306, y: 130, road: 'ring' },
  { id: 'shivranjani', label: 'Shivranjani', x: 322, y: 390, road: 'arc' },
  { id: 'panchvati', label: 'Panchvati', x: 647, y: 214, road: 'cg' },
  { id: 'income-tax', label: 'Income Tax circle', x: 696, y: 140, road: 'ashram' },
  { id: 'judges', label: 'Judges Bungalow', x: 340, y: 242, road: 'judges' },
];

export interface RoadLevel {
  id: RoadId;
  d: string;
  level: TrafficLevel;
}

export interface HeatSpot {
  id: string;
  label: string;
  x: number;
  y: number;
  level: TrafficLevel;
}

export interface Route {
  id: string;
  /** Points on the map canvas, starting and ending at the neighbourhoods. */
  points: Array<[number, number]>;
  roads: RoadId[];
  /** The road the trip spends longest on, e.g. "via Judges Bungalow Rd". */
  via: string;
  km: number;
  minutes: number;
  usual: number;
  /** The slowest corridor on the route, with its cause if there is one. */
  worst?: { road: RoadId; level: TrafficLevel; cause?: string };
}

export function roadState(id: RoadId, corridors: Corridor[]): { level: TrafficLevel; kmh: number; cause?: string } {
  const road = ROADS[id];
  const c = road.corridor ? corridors.find((x) => x.id === road.corridor) : undefined;
  if (c) return { level: c.level, kmh: FREE_KMH * (c.usual / c.minutes), cause: c.cause };
  const level = road.typical ?? 0;
  return { level, kmh: STATIC_KMH[level] };
}

export function roadLevels(corridors: Corridor[]): RoadLevel[] {
  return (Object.keys(ROADS) as RoadId[]).filter((id) => !ROADS[id].minor).map((id) => ({ id, d: ROADS[id].d, level: roadState(id, corridors).level }));
}

export function heatSpots(corridors: Corridor[]): HeatSpot[] {
  return HOTSPOTS.map((h) => ({ id: h.id, label: h.label, x: h.x, y: h.y, level: roadState(h.road, corridors).level }));
}

/** The worst hotspot right now, for one-line summaries. */
export function worstSpot(corridors: Corridor[]): HeatSpot | undefined {
  return [...heatSpots(corridors)].sort((a, b) => b.level - a.level)[0];
}

const dist = (a: [number, number], b: [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1]);

interface Edge {
  to: NodeId;
  road: RoadId;
  px: number;
}

const ADJ: Record<NodeId, Edge[]> = {};
for (const [a, b, road] of EDGES) {
  const px = dist(NODES[a], NODES[b]);
  (ADJ[a] ??= []).push({ to: b, road, px });
  (ADJ[b] ??= []).push({ to: a, road, px });
}

/** Dijkstra over (node, arriving road) so turns can cost time. */
function shortest(from: NodeId, to: NodeId, cost: (e: Edge) => number): Array<{ node: NodeId; road?: RoadId }> | null {
  type State = { key: string; node: NodeId; road?: RoadId; t: number };
  const best = new Map<string, number>();
  const prev = new Map<string, State | null>();
  const start: State = { key: `${from}|`, node: from, t: 0 };
  const queue: State[] = [start];
  best.set(start.key, 0);
  prev.set(start.key, null);
  while (queue.length) {
    queue.sort((a, b) => a.t - b.t);
    const cur = queue.shift()!;
    if (cur.t > (best.get(cur.key) ?? Infinity)) continue;
    if (cur.node === to) {
      const path: Array<{ node: NodeId; road?: RoadId }> = [];
      let s: State | null | undefined = cur;
      while (s) {
        path.unshift({ node: s.node, road: s.road });
        s = prev.get(s.key);
      }
      return path;
    }
    for (const e of ADJ[cur.node] ?? []) {
      const t = cur.t + cost(e) + (cur.road && cur.road !== e.road ? TURN_MIN : 0);
      const key = `${e.to}|${e.road}`;
      if (t < (best.get(key) ?? Infinity)) {
        best.set(key, t);
        const next: State = { key, node: e.to, road: e.road, t };
        prev.set(key, cur);
        queue.push(next);
      }
    }
  }
  return null;
}

function describe(path: Array<{ node: NodeId; road?: RoadId }>, from: [number, number], to: [number, number], corridors: Corridor[]): Route {
  let minutes = 0;
  let usual = 0;
  let px = dist(from, NODES[path[0].node]) + dist(NODES[path[path.length - 1].node], to);
  const onRoad = new Map<RoadId, number>();
  let worst: Route['worst'];
  for (let i = 1; i < path.length; i++) {
    const road = path[i].road!;
    const seg = dist(NODES[path[i - 1].node], NODES[path[i].node]);
    const state = roadState(road, corridors);
    px += seg;
    minutes += (seg / ROUTE_PX_PER_KM / state.kmh) * 60;
    usual += (seg / ROUTE_PX_PER_KM / FREE_KMH) * 60;
    onRoad.set(road, (onRoad.get(road) ?? 0) + seg);
    if (i > 1 && path[i - 1].road !== road) {
      minutes += TURN_MIN;
      usual += TURN_MIN;
    }
    if (!worst || state.level > worst.level) worst = { road, level: state.level, cause: state.cause };
  }
  // Getting to and from the main road at local speed.
  const local = ((dist(from, NODES[path[0].node]) + dist(NODES[path[path.length - 1].node], to)) / ROUTE_PX_PER_KM / 18) * 60;
  minutes += local;
  usual += local;
  const roads = [...onRoad.keys()];
  const main = [...onRoad.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? roads[0];
  return {
    id: roads.join('-'),
    points: [from, ...path.map((p) => NODES[p.node]), to],
    roads,
    via: ROADS[main].name,
    km: Math.round((px / ROUTE_PX_PER_KM) * 10) / 10,
    minutes: Math.max(1, Math.round(minutes)),
    usual: Math.max(1, Math.round(usual)),
    worst: worst && worst.level > 0 ? worst : undefined,
  };
}

/**
 * Up to three distinct routes, fastest first. Alternatives come from making
 * the roads of earlier options more expensive and searching again.
 */
export function planRoutes(fromId: string, toId: string, fromPos: [number, number], toPos: [number, number], corridors: Corridor[]): Route[] {
  const a = ACCESS[fromId];
  const b = ACCESS[toId];
  if (!a || !b || a === b) return [];
  const penalty = new Map<RoadId, number>();
  const routes: Route[] = [];
  for (let i = 0; i < 4 && routes.length < 3; i++) {
    const path = shortest(a, b, (e) => (e.px / ROUTE_PX_PER_KM / roadState(e.road, corridors).kmh) * 60 * (penalty.get(e.road) ?? 1));
    if (!path || path.length < 2) break;
    const route = describe(path, fromPos, toPos, corridors);
    if (!routes.some((r) => r.id === route.id)) routes.push(route);
    for (const r of route.roads) penalty.set(r, (penalty.get(r) ?? 1) * 2.6);
  }
  return routes.sort((x, y) => x.minutes - y.minutes);
}

/** "Signal fault at Iscon crossroads" → "Iscon signal fault". */
function shortCause(cause: string) {
  const m = cause.match(/^Signal fault at (.+?)(?: crossroads)?$/);
  return m ? `${m[1]} signal fault` : cause.charAt(0).toLowerCase() + cause.slice(1);
}

/** "Avoids the Iscon signal fault, saves 7 min": why the best route wins. */
export function whyBest(best: Route, routes: Route[]): string {
  const usualPick = [...routes].sort((x, y) => x.usual - y.usual)[0];
  if (usualPick && usualPick.id !== best.id && usualPick.minutes > best.minutes) {
    const cause = usualPick.worst?.cause;
    const reason = cause ? `the ${shortCause(cause)}` : `traffic on ${ROADS[usualPick.worst?.road ?? usualPick.roads[0]].name}`;
    return `Avoids ${reason}, saves ${usualPick.minutes - best.minutes} min`;
  }
  if (best.minutes <= best.usual) return 'Clear all the way, as quick as usual';
  return best.worst?.cause ? `${best.worst.cause}, still the quickest` : `${best.minutes - best.usual} min slower than usual, still the quickest`;
}
