import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDownGlyph, ChevronRightGlyph, CloseGlyph, LocateGlyph, NamedGlyph, NavigateGlyph, type GlyphName } from '../icons';
import type { TrafficLevel } from '../icons/live';
import { NEIGHBOURHOOD_POS } from '../data/mapPositions';

/* An illustrative map of west Ahmedabad, drawn in SVG so it works offline and
   follows the theme. Pins and labels are HTML on top so they stay crisp and focusable. */

const W = 760;
const H = 560;
/** Map pixels per kilometre, used for the radius ring. */
const PX_PER_KM = 46;

export { NEIGHBOURHOOD_POS };

export const PLACE_POS: Record<string, [number, number]> = {
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

const AREA_POS: Record<string, [number, number]> = {
  'Prahlad Nagar': [344, 446],
  Vastrapur: [452, 288],
  Riverfront: [722, 392],
  Thaltej: [282, 128],
  Bodakdev: [372, 196],
  Satellite: [486, 398],
  Navrangpura: [610, 196],
  'SG Highway': [200, 300],
};

/** Where an event sits on the map, by its area. */
export const eventPos = (area: string) => AREA_POS[area];

const LABELS: Array<{ text: string; x: number; y: number; size?: 'sm' | 'road' | 'water'; rotate?: number }> = [
  { text: 'Thaltej', x: 300, y: 140 },
  { text: 'Bodakdev', x: 456, y: 218 },
  { text: 'Vastrapur', x: 520, y: 330 },
  { text: 'Satellite', x: 590, y: 400 },
  { text: 'Prahlad Nagar', x: 250, y: 420 },
  { text: 'Navrangpura', x: 560, y: 128 },
  { text: 'Paldi', x: 630, y: 506 },
  { text: 'SG Highway', x: 172, y: 360, size: 'road', rotate: 87 },
  { text: 'Sabarmati', x: 748, y: 200, size: 'water', rotate: 82 },
];

/** Live traffic colours, free flow to jammed. */
export const TRAFFIC_COLOR: Record<TrafficLevel, string> = { 0: '#2fbf71', 1: '#f2b33d', 2: '#f07a2e', 3: '#e5484f' };

/** Optional traffic layers: congestion heat, roads coloured by level, and routes. */
export interface MapHeat {
  id: string;
  x: number;
  y: number;
  level: TrafficLevel;
}
export interface MapRoad {
  id: string;
  d: string;
  level: TrafficLevel;
}
export interface MapRoute {
  id: string;
  points: Array<[number, number]>;
  selected?: boolean;
  label?: string;
}

export interface MapPin {
  id: string;
  x: number;
  y: number;
  glyph: GlyphName;
  title: string;
  meta: string;
  to: string;
  photo?: string;
  /** Outside the chosen radius: drawn quieter. */
  far?: boolean;
}

function MapArt() {
  return (
    <svg className="city-map__art" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <defs>
        <pattern id="map-streets" width="34" height="34" patternUnits="userSpaceOnUse" patternTransform="rotate(-6)">
          <path d="M0 0H34M0 0V34" stroke="var(--map-street)" strokeWidth="2.2" fill="none" />
        </pattern>
        <pattern id="map-streets-fine" width="17" height="17" patternUnits="userSpaceOnUse" patternTransform="rotate(-6)">
          <path d="M0 0H17M0 0V17" stroke="var(--map-street)" strokeWidth="1" fill="none" opacity=".7" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="var(--map-land)" />
      <rect width={W} height={H} fill="url(#map-streets)" />
      <path d="M560 0 L700 0 L690 160 L600 140 Z M80 380 L230 420 L210 560 L60 560 Z" fill="url(#map-streets-fine)" />

      {/* Built-up blocks */}
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

      {/* Parks and gardens */}
      <g fill="var(--map-park)">
        <rect x="196" y="40" width="96" height="44" rx="16" />
        <ellipse cx="478" cy="318" rx="64" ry="44" />
        <rect x="552" y="452" width="82" height="52" rx="18" />
        <rect x="652" y="250" width="40" height="34" rx="10" />
        <rect x="402" y="140" width="54" height="38" rx="12" />
        <rect x="236" y="300" width="60" height="44" rx="14" />
        <path d="M712 0 C700 130 742 250 716 380 C700 470 712 520 724 560 L700 560 C686 500 680 460 694 380 C716 250 678 130 690 0 Z" />
      </g>

      {/* Sabarmati and Vastrapur lake */}
      <path d="M744 -10 C722 130 772 250 744 384 C726 470 742 520 760 572" stroke="var(--map-water)" strokeWidth="58" fill="none" />
      <ellipse cx="478" cy="320" rx="36" ry="22" fill="var(--map-water)" />

      {/* Major roads: casing then fill */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <g stroke="var(--map-road-edge)" strokeWidth="13">
          <path d="M178 -10 L196 572" />
          <path d="M-10 334 C180 344 330 382 420 422 S560 520 620 572" />
        </g>
        <g stroke="var(--map-road-edge)" strokeWidth="9">
          <path d="M178 136 C330 128 500 120 640 112" />
          <path d="M188 192 L362 182" />
          <path d="M186 242 C300 236 420 250 524 262" />
          <path d="M640 -10 L660 572" />
          <path d="M420 422 L470 334 L640 302" />
          <path d="M700 -10 C688 150 712 300 698 572" />
          <path d="M650 214 L770 200" />
          <path d="M650 430 L770 420" />
          <path d="M300 -10 L330 572" />
          <path d="M524 262 L530 323" />
        </g>
        <g stroke="var(--map-road-major)" strokeWidth="9">
          <path d="M178 -10 L196 572" />
          <path d="M-10 334 C180 344 330 382 420 422 S560 520 620 572" />
        </g>
        <g stroke="var(--map-road)" strokeWidth="6">
          <path d="M178 136 C330 128 500 120 640 112" />
          <path d="M188 192 L362 182" />
          <path d="M186 242 C300 236 420 250 524 262" />
          <path d="M640 -10 L660 572" />
          <path d="M420 422 L470 334 L640 302" />
          <path d="M700 -10 C688 150 712 300 698 572" />
          <path d="M650 214 L770 200" />
          <path d="M650 430 L770 420" />
          <path d="M300 -10 L330 572" />
          <path d="M524 262 L530 323" />
        </g>
      </g>
    </svg>
  );
}

const pointsAttr = (pts: Array<[number, number]>) => pts.map(([x, y]) => `${x},${y}`).join(' ');

/** Heat, coloured roads and routes, drawn on the same canvas as the map art. */
function TrafficLayer({
  heat,
  roads,
  routes,
  ends,
  onRoute,
}: {
  heat?: MapHeat[];
  roads?: MapRoad[];
  routes?: MapRoute[];
  ends?: { from: [number, number]; to: [number, number] };
  onRoute?: (id: string) => void;
}) {
  const uid = useId().replace(/:/g, '');
  const ordered = routes ? [...routes].sort((a, b) => Number(!!a.selected) - Number(!!b.selected)) : [];
  return (
    <svg className="city-map__layer" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <defs>
        {([0, 1, 2, 3] as TrafficLevel[]).map((l) => (
          <radialGradient key={l} id={`${uid}-heat-${l}`}>
            <stop offset="0" stopColor={TRAFFIC_COLOR[l]} stopOpacity={l === 0 ? 0.32 : 0.62} />
            <stop offset="0.55" stopColor={TRAFFIC_COLOR[l]} stopOpacity={l === 0 ? 0.12 : 0.26} />
            <stop offset="1" stopColor={TRAFFIC_COLOR[l]} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>
      {heat?.map((h, i) => (
        <circle
          key={h.id}
          className="city-map__heat"
          cx={h.x}
          cy={h.y}
          r={44 + h.level * 22}
          fill={`url(#${uid}-heat-${h.level})`}
          style={{ animationDelay: `${(i % 4) * -1.1}s` }}
        />
      ))}
      {roads ? (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {roads.map((r) => (
            <path key={r.id} className="city-map__road" d={r.d} stroke={TRAFFIC_COLOR[r.level]} strokeWidth={r.level >= 2 ? 6 : 5} />
          ))}
        </g>
      ) : null}
      {ordered.map((r) => (
        <g key={r.id} className={`city-map__route${r.selected ? ' is-selected' : ''}`} onClick={onRoute ? () => onRoute(r.id) : undefined}>
          <polyline points={pointsAttr(r.points)} className="city-map__route-casing" />
          <polyline points={pointsAttr(r.points)} className="city-map__route-line" />
        </g>
      ))}
      {ends ? (
        <g className="city-map__ends">
          <circle cx={ends.from[0]} cy={ends.from[1]} r="7" fill="#1d2330" stroke="#ffffff" strokeWidth="3" />
          <circle cx={ends.to[0]} cy={ends.to[1]} r="9" fill="#6c52ee" stroke="#ffffff" strokeWidth="3" />
          <circle cx={ends.to[0]} cy={ends.to[1]} r="3" fill="#ffffff" />
        </g>
      ) : null}
    </svg>
  );
}

export function CityMap({
  pins,
  home,
  radiusKm,
  areaLabel,
  onArea,
  heat,
  roads,
  routes,
  ends,
  onRoute,
  showYou = true,
  className,
}: {
  pins: MapPin[];
  /** Where "you are here" sits; the map opens centred on it. */
  home: [number, number];
  radiusKm: number;
  areaLabel?: string;
  onArea?: () => void;
  heat?: MapHeat[];
  roads?: MapRoad[];
  routes?: MapRoute[];
  ends?: { from: [number, number]; to: [number, number] };
  onRoute?: (id: string) => void;
  /** Hide the "you are here" dot and radius, e.g. when planning a trip. */
  showYou?: boolean;
  className?: string;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 354, h: 236 });
  const [offset, setOffset] = useState<[number, number] | null>(null);
  const [animate, setAnimate] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number; moved: boolean } | null>(null);

  const clamp = useCallback((x: number, y: number): [number, number] => [Math.min(0, Math.max(size.w - W, x)), Math.min(0, Math.max(size.h - H, y))], [size]);
  const centreOn = useCallback(([x, y]: [number, number]) => clamp(size.w / 2 - x, size.h / 2 - y + 14), [clamp, size]);

  useLayoutEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Re-centre when the home area changes; keep the user's pan otherwise.
  useEffect(() => {
    setOffset(centreOn(home));
  }, [home, centreOn]);

  const pos = offset ?? centreOn(home);
  const sel = pins.find((p) => p.id === selected);

  const onPointerDown = (e: ReactPointerEvent) => {
    if ((e.target as HTMLElement).closest('button, a')) return;
    drag.current = { x: e.clientX, y: e.clientY, ox: pos[0], oy: pos[1], moved: false };
    setAnimate(false);
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 4) return;
    if (!d.moved) (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    d.moved = true;
    setOffset(clamp(d.ox + dx, d.oy + dy));
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (d && !d.moved) setSelected(null);
  };

  const locate = () => {
    setAnimate(true);
    setSelected(null);
    setOffset(centreOn(home));
  };

  const ring = radiusKm * PX_PER_KM;

  return (
    <div className={`city-map card${className ? ` ${className}` : ''}`}>
      <div
        ref={viewport}
        className="city-map__viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (drag.current = null)}
      >
        <div className={`city-map__canvas${animate ? ' is-animating' : ''}`} style={{ width: W, height: H, transform: `translate3d(${pos[0]}px, ${pos[1]}px, 0)` }}>
          <MapArt />
          {heat || roads || routes || ends ? <TrafficLayer heat={heat} roads={roads} routes={routes} ends={ends} onRoute={onRoute} /> : null}
          {LABELS.map((l) => (
            <span
              key={l.text}
              className={`city-map__label${l.size ? ` city-map__label--${l.size}` : ''}`}
              style={{ left: l.x, top: l.y, transform: `translate(-50%, -50%)${l.rotate ? ` rotate(${l.rotate}deg)` : ''}` }}
            >
              {l.text}
            </span>
          ))}
          {showYou ? (
            <>
              <span className="city-map__radius" style={{ left: home[0], top: home[1], width: ring * 2, height: ring * 2 }} />
              <span className="city-map__halo" style={{ left: home[0], top: home[1] }} />
              <span className="city-map__you" style={{ left: home[0], top: home[1] }} aria-label="You are here" role="img" />
            </>
          ) : null}
          {pins.map((p, i) => (
            <button
              key={p.id}
              type="button"
              className={`map-pin${p.far ? ' map-pin--far' : ''}`}
              style={{ left: p.x, top: p.y, animationDelay: `${i * 40}ms` }}
              aria-pressed={selected === p.id}
              aria-label={`${p.title}, ${p.meta}`}
              onClick={() => setSelected(selected === p.id ? null : p.id)}
            >
              <svg width="38" height="46" viewBox="0 0 38 46" aria-hidden="true">
                <path d="M19 44c-1.2 0-2.2-.7-2.8-1.7C10.3 33 3 26.5 3 18.5a16 16 0 0 1 32 0c0 8-7.3 14.5-13.2 23.8-.6 1-1.6 1.7-2.8 1.7z" />
              </svg>
              <span className="map-pin__glyph">
                <NamedGlyph name={p.glyph} size={18} />
              </span>
            </button>
          ))}
        </div>

        {areaLabel && onArea ? (
          <button type="button" className="city-map__area" onClick={onArea}>
            <NavigateGlyph size={15} />
            {areaLabel}
            <ChevronDownGlyph size={14} />
          </button>
        ) : null}
        <button type="button" className="city-map__locate" onClick={locate} aria-label={showYou ? 'Centre on me' : 'Centre the map'}>
          <LocateGlyph size={22} />
        </button>
        <span className="city-map__note" aria-hidden="true">
          Illustrative map
        </span>

        {sel ? (
          <div className="city-map__peek" role="dialog" aria-label={sel.title}>
            <Link to={sel.to} className="city-map__peek-link">
              {sel.photo ? (
                <img src={sel.photo} alt="" />
              ) : (
                <span className="city-map__peek-glyph">
                  <NamedGlyph name={sel.glyph} size={22} duo />
                </span>
              )}
              <span className="stack grow" style={{ gap: 2, minWidth: 0 }}>
                <span className="strong truncate">{sel.title}</span>
                <span className="meta truncate">{sel.meta}</span>
              </span>
              <ChevronRightGlyph size={18} />
            </Link>
            <button type="button" className="icon-btn icon-btn--ghost" style={{ width: 34, height: 34 }} aria-label="Close" onClick={() => setSelected(null)}>
              <CloseGlyph size={16} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
