import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { placePhoto } from '../assets/photos';
import { PLACES } from '../data/places';
import type { Group, Place, PlaceCategory } from '../data/types';
import { CheckGlyph, ChevronRightGlyph, CloseGlyph, LocateGlyph, MinusGlyph, NamedGlyph, PlusGlyph, ExpandGlyph, InfoGlyph } from '../icons';
import { compact } from '../lib/format';
import { placeCommunity } from '../lib/friends';
import {
  clubWorldPos,
  homeWorldPos,
  INSIGHT_LABEL,
  placeInsight,
  placeWorldPos,
  WORLD_H,
  WORLD_LABELS,
  WORLD_PX_PER_KM,
  WORLD_W,
  CORE_OFFSET,
  type Insight,
} from '../lib/mapWorld';
import { spottedPlaces, spotPhoto } from '../lib/places';
import { useAppData } from '../state/appData';
import { useSettings } from '../state/settings';
import { Avatar, FaceStack } from './cards';
import { allClubs, clubPhoto, meetupsOf, memberCount } from './clubs';
import { ENTITY, EntityLine, EntityPic, placeKind, type EntityKind } from './entity';
import { person } from '../data/core';

/*
  The Explore map: a whole city to roam. Drag to move, pinch, scroll or double-tap
  to zoom. Shape says what something is (square pages, round public places,
  double-ringed clubs), colour says how good it is. Tap a pin for a small card; tap the
  card to open the page.
*/

export type MapLayer = 'business' | 'public' | 'club';

const LAYERS: Array<{ id: MapLayer; kind: EntityKind; label: string }> = [
  { id: 'business', kind: 'page', label: 'Businesses' },
  { id: 'public', kind: 'public', label: 'Public places' },
  { id: 'club', kind: 'club', label: 'Clubs' },
];

interface Pin {
  id: string;
  layer: MapLayer;
  kind: EntityKind;
  x: number;
  y: number;
  glyph: Place['glyph'];
  name: string;
  insight: Insight;
  /** Shown beside the name when zoomed in: "77%", "180". */
  short?: string;
  friendId?: string;
  spotted?: boolean;
  joined?: boolean;
}

const MIN_SCALE = 0.42;
const MAX_SCALE = 2.4;

/* ---------- The city, drawn once ---------- */

function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The Sabarmati's centre line at a given height, to keep blocks out of the river. */
const riverX = (y: number) => 1160 + Math.sin(y / 170) * 16;
const inCore = (x: number, y: number) => x > CORE_OFFSET[0] - 10 && x < CORE_OFFSET[0] + 770 && y > CORE_OFFSET[1] - 10 && y < CORE_OFFSET[1] + 580;

function WorldArt() {
  const { blocks, parks } = useMemo(() => {
    const r = rng(7);
    const blocks: Array<[number, number, number, number]> = [];
    const parks: Array<[number, number, number, number]> = [];
    for (let i = 0; blocks.length < 90 && i < 600; i++) {
      const x = r() * (WORLD_W - 120) + 30;
      const y = r() * (WORLD_H - 80) + 20;
      if (inCore(x, y) || Math.abs(x + 40 - riverX(y)) < 110) continue;
      blocks.push([x, y, 50 + r() * 60, 26 + r() * 30]);
    }
    for (let i = 0; parks.length < 22 && i < 400; i++) {
      const x = r() * (WORLD_W - 140) + 30;
      const y = r() * (WORLD_H - 100) + 20;
      if (inCore(x, y) || Math.abs(x + 40 - riverX(y)) < 120) continue;
      parks.push([x, y, 40 + r() * 70, 30 + r() * 40]);
    }
    return { blocks, parks };
  }, []);

  return (
    <svg className="xmap__art" width={WORLD_W} height={WORLD_H} viewBox={`0 0 ${WORLD_W} ${WORLD_H}`} aria-hidden="true">
      <defs>
        <pattern id="xmap-streets" width="34" height="34" patternUnits="userSpaceOnUse" patternTransform="rotate(-6)">
          <path d="M0 0H34M0 0V34" stroke="var(--map-street)" strokeWidth="2.2" fill="none" />
        </pattern>
        <pattern id="xmap-streets-fine" width="15" height="15" patternUnits="userSpaceOnUse" patternTransform="rotate(12)">
          <path d="M0 0H15M0 0V15" stroke="var(--map-street)" strokeWidth="1.2" fill="none" />
        </pattern>
      </defs>
      <rect width={WORLD_W} height={WORLD_H} fill="var(--map-land)" />
      <rect width={WORLD_W} height={WORLD_H} fill="url(#xmap-streets)" />
      {/* The old city's lanes are tighter */}
      <path d="M1250 500 C1330 470 1440 500 1470 560 C1490 640 1460 740 1380 770 C1300 780 1250 720 1246 640 Z" fill="url(#xmap-streets-fine)" />

      <g fill="var(--map-block)">
        {blocks.map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} rx="6" />
        ))}
      </g>
      <g fill="var(--map-park)">
        {parks.map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} rx="16" />
        ))}
        <ellipse cx="380" cy="250" rx="110" ry="70" />
        <ellipse cx="1330" cy="1010" rx="104" ry="90" />
        <rect x="80" y="140" width="120" height="70" rx="26" />
      </g>

      {/* Riverfront, the Sabarmati and Kankaria lake */}
      <path
        d="M1150 -20 C1170 100 1140 220 1164 310 C1142 450 1192 570 1164 704 C1146 790 1162 840 1180 892 C1196 980 1168 1100 1186 1220"
        stroke="var(--map-park)"
        strokeWidth="110"
        fill="none"
      />
      <path
        d="M1150 -20 C1170 100 1140 220 1164 310 C1142 450 1192 570 1164 704 C1146 790 1162 840 1180 892 C1196 980 1168 1100 1186 1220"
        stroke="var(--map-water)"
        strokeWidth="58"
        fill="none"
      />
      <ellipse cx="1330" cy="1010" rx="64" ry="54" fill="var(--map-water)" />

      {/* The detailed west side, as the rest of the app draws it */}
      <g transform={`translate(${CORE_OFFSET[0]} ${CORE_OFFSET[1]})`}>
        <g fill="var(--map-block)">
          <rect x="206" y="146" width="88" height="36" rx="6" />
          <rect x="372" y="262" width="70" height="40" rx="6" />
          <rect x="560" y="330" width="72" height="56" rx="6" />
          <rect x="208" y="252" width="80" height="34" rx="6" />
          <rect x="340" y="400" width="62" height="40" rx="6" />
          <rect x="560" y="150" width="70" height="46" rx="6" />
          <rect x="214" y="488" width="96" height="44" rx="6" />
          <rect x="470" y="200" width="66" height="44" rx="6" />
        </g>
        <g fill="var(--map-park)">
          <rect x="196" y="40" width="96" height="44" rx="16" />
          <ellipse cx="478" cy="318" rx="64" ry="44" />
          <rect x="552" y="452" width="82" height="52" rx="18" />
          <rect x="652" y="250" width="40" height="34" rx="10" />
          <rect x="402" y="140" width="54" height="38" rx="12" />
          <rect x="236" y="300" width="60" height="44" rx="14" />
        </g>
        <ellipse cx="478" cy="320" rx="36" ry="22" fill="var(--map-water)" />
      </g>

      {/* Roads: casing, then fill. Big roads span the city; the west side keeps its detail. */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <g stroke="var(--map-road-edge)" strokeWidth="15">
          <path d="M200 80 C600 20 1000 30 1380 110 C1540 300 1560 700 1460 1100 C1100 1180 600 1170 220 1110 C80 800 70 400 200 80 Z" />
          <path d="M560 -20 L598 310 L616 892 L640 1220" />
          <path d="M-20 640 C200 650 330 650 410 654 C600 664 750 702 840 742 S980 840 1040 892 C1080 950 1120 1100 1140 1220" />
          <path d="M1236 -20 C1226 300 1250 600 1232 1220" />
        </g>
        <g stroke="var(--map-road-edge)" strokeWidth="10">
          <path d="M610 300 L700 -20" />
          <path d="M410 654 C300 700 200 760 -20 800" />
          <path d="M1060 420 L1320 430" />
          <path d="M1070 560 L1330 572" />
          <path d="M1080 760 L1340 770" />
          <path d="M1090 940 L1360 950" />
          <path d="M900 -20 L960 432" />
          <path d="M1300 560 C1360 600 1400 700 1460 760" />
          <path d="M616 892 C500 960 400 1040 300 1220" />
        </g>
        <g transform={`translate(${CORE_OFFSET[0]} ${CORE_OFFSET[1]})`} stroke="var(--map-road-edge)" strokeWidth="9">
          <path d="M178 136 C330 128 500 120 640 112" />
          <path d="M188 192 L362 182" />
          <path d="M186 242 C300 236 420 250 524 262" />
          <path d="M640 -10 L660 572" />
          <path d="M420 422 L470 334 L640 302" />
          <path d="M650 214 L770 200" />
          <path d="M650 430 L770 420" />
          <path d="M300 -10 L330 572" />
          <path d="M524 262 L530 323" />
        </g>
        <g stroke="var(--map-road-major)" strokeWidth="10">
          <path d="M200 80 C600 20 1000 30 1380 110 C1540 300 1560 700 1460 1100 C1100 1180 600 1170 220 1110 C80 800 70 400 200 80 Z" />
          <path d="M560 -20 L598 310 L616 892 L640 1220" />
          <path d="M-20 640 C200 650 330 650 410 654 C600 664 750 702 840 742 S980 840 1040 892 C1080 950 1120 1100 1140 1220" />
          <path d="M1236 -20 C1226 300 1250 600 1232 1220" />
        </g>
        <g stroke="var(--map-road)" strokeWidth="6">
          <path d="M610 300 L700 -20" />
          <path d="M410 654 C300 700 200 760 -20 800" />
          <path d="M1060 420 L1320 430" />
          <path d="M1070 560 L1330 572" />
          <path d="M1080 760 L1340 770" />
          <path d="M1090 940 L1360 950" />
          <path d="M900 -20 L960 432" />
          <path d="M1300 560 C1360 600 1400 700 1460 760" />
          <path d="M616 892 C500 960 400 1040 300 1220" />
        </g>
        <g transform={`translate(${CORE_OFFSET[0]} ${CORE_OFFSET[1]})`} stroke="var(--map-road)" strokeWidth="6">
          <path d="M178 136 C330 128 500 120 640 112" />
          <path d="M188 192 L362 182" />
          <path d="M186 242 C300 236 420 250 524 262" />
          <path d="M640 -10 L660 572" />
          <path d="M420 422 L470 334 L640 302" />
          <path d="M650 214 L770 200" />
          <path d="M650 430 L770 420" />
          <path d="M300 -10 L330 572" />
          <path d="M524 262 L530 323" />
        </g>
      </g>
    </svg>
  );
}

/* ---------- Pins and their cards ---------- */

function usePins(category?: (p: { category: PlaceCategory }) => boolean) {
  const { data } = useAppData();
  const { settings } = useSettings();
  return useMemo(() => {
    const pins: Pin[] = [];
    for (const p of PLACES) {
      if (p.origin.outsideCity || (category && !category(p))) continue;
      const c = placeCommunity(p.id, data, settings);
      const [x, y] = placeWorldPos(p.id, p.area);
      const kind = placeKind(p);
      pins.push({
        id: p.id,
        layer: kind === 'public' ? 'public' : 'business',
        kind,
        x,
        y,
        glyph: p.glyph,
        name: p.name,
        insight: placeInsight(c),
        short: c.total ? `${c.mustPct}%` : 'New',
        friendId: c.friendIds[0],
      });
    }
    for (const s of spottedPlaces(data)) {
      if (category && !category(s)) continue;
      const [x, y] = placeWorldPos(s.id, s.area);
      pins.push({ id: s.id, layer: 'business', kind: 'page', x, y, glyph: s.glyph, name: s.name, insight: 'new', short: `${s.count}/${s.needed}`, spotted: true });
    }
    for (const club of allClubs(data)) {
      const [x, y] = clubWorldPos(club.id, club.areaId);
      const joined = data.joinedGroups.includes(club.id);
      pins.push({
        id: club.id,
        layer: 'club',
        kind: 'club',
        x,
        y,
        glyph: club.glyph,
        name: club.name,
        insight: meetupsOf(club, data).length ? 'active' : 'quiet',
        short: compact(memberCount(club, joined)),
        joined,
      });
    }
    return spreadOut(pins);
  }, [data, settings, category]);
}

/** Nudge pins that land on top of each other apart, so every one can be tapped. */
function spreadOut(pins: Pin[], gap = 40): Pin[] {
  const pts = pins.map((p) => ({ ...p }));
  for (let round = 0; round < 10; round++) {
    let moved = false;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        let dx = pts[j].x - pts[i].x;
        let dy = pts[j].y - pts[i].y;
        let d = Math.hypot(dx, dy);
        if (d >= gap) continue;
        if (d < 0.01) {
          dx = Math.cos(j);
          dy = Math.sin(j);
          d = 1;
        }
        const push = (gap - d) / 2;
        pts[i].x -= (dx / d) * push;
        pts[i].y -= (dy / d) * push;
        pts[j].x += (dx / d) * push;
        pts[j].y += (dy / d) * push;
        moved = true;
      }
    }
    if (!moved) break;
  }
  return pts.map((p) => ({ ...p, x: Math.round(Math.min(WORLD_W - 20, Math.max(20, p.x))), y: Math.round(Math.min(WORLD_H - 20, Math.max(20, p.y))) }));
}

function PinCard({
  pin,
  onClose,
  onStep,
  index,
  total,
  dir,
}: {
  pin: Pin;
  onClose: () => void;
  /** Next (1) or previous (-1) spot, nearest first from where you started. */
  onStep: (d: 1 | -1) => void;
  index: number;
  total: number;
  /** Which way the card arrived from, for the slide. */
  dir: 1 | -1 | 0;
}) {
  const [dx, setDx] = useState(0);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const swiped = useRef(false);
  const hasPrev = index > 0;
  const hasNext = index >= 0 && index < total - 1;
  const { data, toggle } = useAppData();
  const { settings } = useSettings();
  let body;
  if (pin.layer === 'club') {
    const club = allClubs(data).find((c) => c.id === pin.id) as Group;
    const next = meetupsOf(club, data)[0];
    body = (
      <Link to={`/clubs/${club.id}`} className="xmap-card__link" draggable={false}>
        <EntityPic kind="club" src={clubPhoto(club)} size={52} />
        <span className="xmap-card__body">
          <span className="xmap-card__name">{club.name}</span>
          <EntityLine kind="club">
            {compact(memberCount(club, pin.joined ?? false))} members · {club.area}
          </EntityLine>
          <span className={`xmap-card__insight is-${pin.insight}`}>
            <i aria-hidden="true" />
            {next ? `Next: ${next.title} · ${next.when}` : 'Nothing planned yet'}
          </span>
          {pin.joined ? (
            <span className="meta row" style={{ gap: 4 }}>
              <CheckGlyph size={12} /> You’re a member
            </span>
          ) : null}
        </span>
        <ChevronRightGlyph size={18} />
      </Link>
    );
  } else if (pin.spotted) {
    const s = spottedPlaces(data).find((x) => x.id === pin.id)!;
    body = (
      <div className="xmap-card__link" draggable={false}>
        <EntityPic kind="page" src={spotPhoto(s)} size={52} fallback={<NamedGlyph name={s.glyph} size={22} />} />
        <span className="xmap-card__body">
          <span className="xmap-card__name">{s.name}</span>
          <EntityLine kind="page">
            {s.kind} · {s.area}
          </EntityLine>
          <span className="xmap-card__insight is-new">
            <i aria-hidden="true" />
            Spotted by {person(s.spottedBy).name.split(' ')[0]} · {s.count} of {s.needed} confirmations
          </span>
        </span>
        <button type="button" className={`btn btn--sm ${s.confirmedByMe ? 'btn--secondary' : 'btn--primary'}`} onClick={() => toggle('confirmedSpots', s.id)}>
          {s.confirmedByMe ? 'Confirmed' : 'I’ve been'}
        </button>
      </div>
    );
  } else {
    const place = PLACES.find((p) => p.id === pin.id)!;
    const c = placeCommunity(place.id, data, settings);
    const closes = place.hours.split('–')[1]?.trim();
    body = (
      <Link to={`/place/${place.id}`} className="xmap-card__link" draggable={false}>
        <EntityPic kind={pin.kind} src={placePhoto(place.id)} size={52} fallback={<NamedGlyph name={place.glyph} size={22} />} />
        <span className="xmap-card__body">
          <span className="xmap-card__name">{place.name}</span>
          <EntityLine kind={pin.kind}>
            {place.kind} · {place.area}
          </EntityLine>
          <span className={`xmap-card__insight is-${pin.insight}`}>
            <i aria-hidden="true" />
            {c.total ? `${c.mustPct}% must try · ${compact(c.total)} locals` : 'New: be one of the first to check in'}
            {' · '}
            <span className={place.openNow ? 'is-open' : 'is-closed'}>{place.openNow ? `Open${closes ? ` till ${closes}` : ''}` : 'Closed'}</span>
          </span>
          {c.friendIds.length ? (
            <span className="xmap-card__friends">
              <FaceStack ids={c.friendIds} size={16} />
              {c.friendIds.length === 1 ? `${person(c.friendIds[0]).name.split(' ')[0]} has been` : `${c.friendIds.length} friends have been`}
            </span>
          ) : null}
        </span>
        <ChevronRightGlyph size={18} />
      </Link>
    );
  }
  // Swipe the card sideways to walk to the next nearest spot; the card follows your finger.
  const onPointerDown = (e: ReactPointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, moved: false };
    swiped.current = false;
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const mx = e.clientX - d.x;
    if (!d.moved) {
      if (Math.abs(mx) < 8 || Math.abs(mx) < Math.abs(e.clientY - d.y)) return;
      d.moved = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    // Resist at the ends of the list.
    setDx((mx < 0 && !hasNext) || (mx > 0 && !hasPrev) ? mx / 4 : mx);
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d?.moved) return;
    swiped.current = true;
    if (dx < -60 && hasNext) onStep(1);
    else if (dx > 60 && hasPrev) onStep(-1);
    setDx(0);
  };

  return (
    <div
      className={`xmap-card${dx ? ' is-dragging' : ''}${dir === 1 ? ' from-right' : dir === -1 ? ' from-left' : ''}`}
      role="dialog"
      aria-label={pin.name}
      tabIndex={-1}
      style={dx ? { transform: `translateX(${dx}px)`, opacity: 1 - Math.min(0.4, Math.abs(dx) / 400) } : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        drag.current = null;
        setDx(0);
      }}
      onClickCapture={(e) => {
        // A swipe isn't a tap: don't open the page at the end of one.
        if (swiped.current) {
          e.preventDefault();
          e.stopPropagation();
          swiped.current = false;
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' && hasNext) onStep(1);
        if (e.key === 'ArrowLeft' && hasPrev) onStep(-1);
        if (e.key === 'Escape') onClose();
      }}
    >
      {body}
      {total > 1 ? (
        <div className="xmap-card__nav">
          <button type="button" aria-label="Previous spot" disabled={!hasPrev} onClick={() => onStep(-1)}>
            <ChevronRightGlyph size={15} style={{ transform: 'rotate(180deg)' }} />
          </button>
          <span>
            {index + 1} of {total} nearby · swipe for the next
          </span>
          <button type="button" aria-label="Next spot" disabled={!hasNext} onClick={() => onStep(1)}>
            <ChevronRightGlyph size={15} />
          </button>
        </div>
      ) : null}
      <button type="button" className="xmap-card__close" aria-label="Close" onClick={onClose}>
        <CloseGlyph size={14} />
      </button>
    </div>
  );
}

/* ---------- The map ---------- */

export function ExploreMap({ category, height, full }: { category?: (p: { category: PlaceCategory }) => boolean; height?: number; full?: boolean }) {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const viewport = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 360, h: height ?? 440 });
  const [view, setView] = useState<{ s: number; tx: number; ty: number } | null>(null);
  const [layers, setLayers] = useState<MapLayer[]>(['business', 'public', 'club']);
  const [selected, setSelected] = useState<string | null>(null);
  // The spot you tapped first; swiping walks outwards from it, nearest first.
  const [anchor, setAnchor] = useState<string | null>(null);
  const [dir, setDir] = useState<1 | -1 | 0>(0);
  const [legend, setLegend] = useState(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ kind: 'pan' | 'pinch'; x: number; y: number; tx: number; ty: number; s: number; dist: number; moved: boolean; vx: number; vy: number; t: number } | null>(null);
  const anim = useRef<number | null>(null);
  const lastTap = useRef(0);

  const home = homeWorldPos(settings.location.home);
  const pins = usePins(category);
  const shown = useMemo(() => pins.filter((p) => layers.includes(p.layer)), [pins, layers]);
  const sel = shown.find((p) => p.id === selected);
  const nearby = useMemo(() => {
    const a = shown.find((p) => p.id === anchor);
    if (!a) return [];
    return [...shown].sort((p, q) => Math.hypot(p.x - a.x, p.y - a.y) - Math.hypot(q.x - a.x, q.y - a.y)).map((p) => p.id);
  }, [shown, anchor]);

  useLayoutEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const minScale = Math.max(MIN_SCALE, size.w / WORLD_W, size.h / WORLD_H);
  const clampView = useCallback(
    (s: number, tx: number, ty: number) => {
      const sc = Math.min(MAX_SCALE, Math.max(minScale, s));
      const m = 24;
      const cx = Math.min(m, Math.max(size.w - WORLD_W * sc - m, tx));
      const cy = Math.min(m, Math.max(size.h - WORLD_H * sc - m, ty));
      return { s: sc, tx: cx, ty: cy };
    },
    [minScale, size],
  );
  const centred = useCallback((x: number, y: number, s: number, dy = 0) => clampView(s, size.w / 2 - x * s, size.h / 2 - y * s + dy), [clampView, size]);

  // Open on where you live; re-centre when that changes.
  useEffect(() => {
    setView(centred(home[0], home[1], 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.location.home, size.w, size.h]);

  const v = view ?? centred(home[0], home[1], 1);

  const stopAnim = () => {
    if (anim.current) cancelAnimationFrame(anim.current);
    anim.current = null;
  };
  const flyTo = (target: { s: number; tx: number; ty: number }) => {
    stopAnim();
    const from = v;
    const t0 = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / 320);
      const e = 1 - Math.pow(1 - k, 3);
      setView({ s: from.s + (target.s - from.s) * e, tx: from.tx + (target.tx - from.tx) * e, ty: from.ty + (target.ty - from.ty) * e });
      anim.current = k < 1 ? requestAnimationFrame(step) : null;
    };
    anim.current = requestAnimationFrame(step);
  };
  const zoomAt = (factor: number, px: number, py: number, animate = false) => {
    const s = Math.min(MAX_SCALE, Math.max(minScale, v.s * factor));
    const wx = (px - v.tx) / v.s;
    const wy = (py - v.ty) / v.s;
    const next = clampView(s, px - wx * s, py - wy * s);
    if (animate) flyTo(next);
    else setView(next);
  };

  // Scroll to zoom, around the pointer.
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * 0.0016), e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  });

  const local = (e: { clientX: number; clientY: number }) => {
    const r = viewport.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onPointerDown = (e: ReactPointerEvent) => {
    if ((e.target as HTMLElement).closest('button, a, .xmap-card')) return;
    stopAnim();
    pointers.current.set(e.pointerId, local(e));
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const pts = [...pointers.current.values()];
    if (pts.length === 1) {
      gesture.current = { kind: 'pan', x: pts[0].x, y: pts[0].y, tx: v.tx, ty: v.ty, s: v.s, dist: 0, moved: false, vx: 0, vy: 0, t: performance.now() };
    } else if (pts.length === 2) {
      const [a, b] = pts;
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      gesture.current = { kind: 'pinch', x: mx, y: my, tx: v.tx, ty: v.ty, s: v.s, dist: Math.hypot(a.x - b.x, a.y - b.y), moved: true, vx: 0, vy: 0, t: 0 };
    }
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, local(e));
    const g = gesture.current;
    if (!g) return;
    const pts = [...pointers.current.values()];
    if (g.kind === 'pinch' && pts.length >= 2) {
      const [a, b] = pts;
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const s = Math.min(MAX_SCALE, Math.max(minScale, g.s * (Math.hypot(a.x - b.x, a.y - b.y) / g.dist)));
      const wx = (g.x - g.tx) / g.s;
      const wy = (g.y - g.ty) / g.s;
      setView(clampView(s, mx - wx * s, my - wy * s));
    } else if (g.kind === 'pan') {
      const p = pts[0];
      const dx = p.x - g.x;
      const dy = p.y - g.y;
      if (!g.moved && Math.hypot(dx, dy) < 5) return;
      const now = performance.now();
      const next = clampView(v.s, g.tx + dx, g.ty + dy);
      const dt = Math.max(1, now - g.t);
      g.vx = ((next.tx - v.tx) / dt) * 16;
      g.vy = ((next.ty - v.ty) / dt) * 16;
      g.t = now;
      g.moved = true;
      setView(next);
    }
  };
  const onPointerUp = (e: ReactPointerEvent) => {
    pointers.current.delete(e.pointerId);
    const g = gesture.current;
    if (pointers.current.size) return;
    gesture.current = null;
    if (!g) return;
    if (g.kind === 'pan' && !g.moved) {
      // A tap on the map: double-tap zooms in, a single tap closes the card.
      const now = performance.now();
      if (now - lastTap.current < 300) {
        const p = local(e);
        zoomAt(1.7, p.x, p.y, true);
        lastTap.current = 0;
      } else {
        lastTap.current = now;
        setSelected(null);
      }
      return;
    }
    if (g.kind === 'pan' && (Math.abs(g.vx) > 1 || Math.abs(g.vy) > 1)) {
      // A little glide after a flick.
      let vx = g.vx;
      let vy = g.vy;
      let cur = v;
      const glide = () => {
        vx *= 0.92;
        vy *= 0.92;
        cur = clampView(cur.s, cur.tx + vx, cur.ty + vy);
        setView(cur);
        anim.current = Math.abs(vx) + Math.abs(vy) > 0.4 ? requestAnimationFrame(glide) : null;
      };
      anim.current = requestAnimationFrame(glide);
    }
  };

  const select = (pin: Pin) => {
    if (selected === pin.id) {
      setSelected(null);
      return;
    }
    setAnchor(pin.id);
    setDir(0);
    setSelected(pin.id);
    // Bring it into view above the card.
    flyTo(centred(pin.x, pin.y, Math.max(v.s, 1), -60));
  };

  /** Walk to the next or previous spot, nearest first from where you started. */
  const step = (d: 1 | -1) => {
    const id = nearby[nearby.indexOf(selected ?? '') + d];
    const pin = shown.find((p) => p.id === id);
    if (!pin) return;
    setDir(d);
    setSelected(pin.id);
    flyTo(centred(pin.x, pin.y, Math.max(v.s, 1), -60));
  };

  const dots = v.s < 0.72;
  // Zoom in and pins show their score; zoom further and they show their names too.
  const badges = v.s >= 1.1;
  const labels = v.s >= 1.8;
  const ring = settings.location.radiusKm * WORLD_PX_PER_KM * v.s;
  const sx = (x: number) => x * v.s + v.tx;
  const sy = (y: number) => y * v.s + v.ty;
  const visible = (x: number, y: number, pad = 60) => x > -pad && x < size.w + pad && y > -pad && y < size.h + pad;

  return (
    <div className={`xmap${full ? ' xmap--full' : ''}`} style={height ? { height } : undefined}>
      <div
        ref={viewport}
        className="xmap__viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="xmap__world" style={{ width: WORLD_W, height: WORLD_H, transform: `translate3d(${v.tx}px, ${v.ty}px, 0) scale(${v.s})` }}>
          <WorldArt />
        </div>

        {WORLD_LABELS.map((l) => {
          const x = sx(l.x);
          const y = sy(l.y);
          if (!visible(x, y, 120) || (l.kind === 'minor' && v.s < 0.8)) return null;
          return (
            <span
              key={l.text}
              className={`xmap__label${l.kind ? ` xmap__label--${l.kind}` : ''}`}
              style={{ left: x, top: y, transform: `translate(-50%, -50%)${l.rotate ? ` rotate(${l.rotate}deg)` : ''}` }}
            >
              {l.text}
            </span>
          );
        })}

        <span className="xmap__radius" style={{ left: sx(home[0]), top: sy(home[1]), width: ring * 2, height: ring * 2 }} />
        <span className="xmap__you" style={{ left: sx(home[0]), top: sy(home[1]) }} role="img" aria-label="You are here" />

        {shown.map((p) => {
          const x = sx(p.x);
          const y = sy(p.y);
          if (!visible(x, y)) return null;
          const on = selected === p.id;
          return (
            <button
              key={`${p.layer}-${p.id}`}
              type="button"
              className={`xmap-pin xmap-pin--${p.kind} is-${p.insight}${dots && !on ? ' is-dot' : ''}${on ? ' is-on' : ''}${p.spotted ? ' is-spotted' : ''}`}
              style={{ left: x, top: y, zIndex: on ? 5 : undefined }}
              aria-pressed={on}
              aria-label={`${p.name}, ${ENTITY[p.kind].label}, ${INSIGHT_LABEL[p.insight]}`}
              onClick={() => select(p)}
            >
              <span className="xmap-pin__shape">{dots && !on ? null : <NamedGlyph name={p.glyph} size={15} />}</span>
              {p.friendId && !dots ? (
                <span className="xmap-pin__friend">
                  <Avatar who={{ ...person(p.friendId), verified: false }} size={16} />
                </span>
              ) : null}
              {(labels || on) && !dots ? (
                <span className="xmap-pin__label">
                  {p.name}
                  {p.short ? <b>{p.short}</b> : null}
                </span>
              ) : badges && p.short && !dots ? (
                <span className="xmap-pin__badge">{p.short}</span>
              ) : null}
            </button>
          );
        })}

        {/* What to show */}
        <div className="xmap__layers" role="group" aria-label="Show on the map">
          {LAYERS.map((l) => {
            const on = layers.includes(l.id);
            const G = ENTITY[l.kind].G;
            return (
              <button
                key={l.id}
                type="button"
                className={`xmap__layer${on ? ' is-on' : ''}`}
                aria-pressed={on}
                onClick={() => {
                  setSelected(null);
                  setLayers((xs) => (on ? xs.filter((x) => x !== l.id) : [...xs, l.id]));
                }}
              >
                <G size={13} />
                {l.label}
                <span className="num">{pins.filter((p) => p.layer === l.id).length}</span>
              </button>
            );
          })}
        </div>

        <div className="xmap__controls">
          {full ? null : (
            <button type="button" className="xmap__ctl" aria-label="Open the full map" onClick={() => navigate('/explore/map')}>
              <ExpandGlyph size={17} />
            </button>
          )}
          <button type="button" className="xmap__ctl" aria-label="Zoom in" onClick={() => zoomAt(1.5, size.w / 2, size.h / 2, true)}>
            <PlusGlyph size={17} />
          </button>
          <button type="button" className="xmap__ctl" aria-label="Zoom out" onClick={() => zoomAt(1 / 1.5, size.w / 2, size.h / 2, true)}>
            <MinusGlyph size={17} />
          </button>
          <button type="button" className="xmap__ctl" aria-label="Centre on me" onClick={() => flyTo(centred(home[0], home[1], 1))}>
            <LocateGlyph size={18} />
          </button>
        </div>

        <button type="button" className="xmap__legend-btn" aria-expanded={legend} onClick={() => setLegend((x) => !x)}>
          <InfoGlyph size={13} />
          Colours
        </button>
        {legend ? (
          <div className="xmap__legend" role="note">
            {(['loved', 'liked', 'mixed', 'new', 'active', 'quiet'] as Insight[]).map((i) => (
              <span key={i} className={`xmap__legend-row is-${i}`}>
                <i aria-hidden="true" />
                {INSIGHT_LABEL[i]}
              </span>
            ))}
            <span className="xmap__legend-row">Square: business page · round: public place · double ring: club</span>
          </div>
        ) : null}

        {sel ? (
          <PinCard key={sel.id} pin={sel} onClose={() => setSelected(null)} onStep={step} index={nearby.indexOf(sel.id)} total={nearby.length} dir={dir} />
        ) : null}
      </div>
    </div>
  );
}
