import { useId, type ReactNode } from 'react';
import { Glyph, type GlyphProps } from './Glyph';

/* Data-driven glyphs: their drawing and motion follow live city values. */

export type WeatherCondition = 'sunny' | 'partly' | 'cloudy' | 'rain' | 'storm' | 'haze' | 'night';

const CLOUD = 'M7 19h10.5a3.5 3.5 0 0 0 .3-7 5 5 0 0 0-9.6-1.2A4.1 4.1 0 0 0 7 19z';

export function WeatherGlyph({ condition, ...p }: GlyphProps & { condition: WeatherCondition }) {
  return (
    <Glyph name="weather" {...p} live={p.live ?? true} className={`weather--${condition} ${p.className ?? ''}`}>
      {condition === 'sunny' && (
        <>
          <g className="weather__rays" stroke="var(--g-sun, #f5b83d)">
            <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4 7 7M17 17l1.6 1.6M5.4 18.6 7 17M17 7l1.6-1.6" />
          </g>
          <circle cx="12" cy="12" r="4.4" fill="var(--g-sun, #f5b83d)" stroke="var(--g-sun, #f5b83d)" />
        </>
      )}
      {condition === 'partly' && (
        <>
          <g className="weather__rays" stroke="var(--g-sun, #f5b83d)">
            <path d="M9 2.4v1.6M2.4 9H4M4.3 4.3l1.1 1.1M13.7 4.3l-1.1 1.1" />
          </g>
          <circle cx="9" cy="9" r="3.4" fill="var(--g-sun, #f5b83d)" stroke="var(--g-sun, #f5b83d)" />
          <path className="weather__cloud" d={CLOUD} fill="var(--surface)" />
        </>
      )}
      {condition === 'cloudy' && (
        <>
          <path className="weather__cloud weather__cloud--back" d={CLOUD} transform="translate(-3.4 -4) scale(.8)" fill="var(--surface)" opacity=".7" />
          <path className="weather__cloud" d={CLOUD} fill="var(--surface)" />
        </>
      )}
      {(condition === 'rain' || condition === 'storm') && (
        <>
          <path className="weather__cloud" d={CLOUD} transform="translate(0 -4.5)" fill="var(--surface)" />
          {condition === 'rain' ? (
            <g stroke="var(--g-rain, #4a8fe0)" strokeWidth="1.7">
              <path className="weather__drop" d="M8.5 17.5l-.8 2.2" />
              <path className="weather__drop weather__drop--2" d="M12.3 17.5l-.8 2.2" />
              <path className="weather__drop weather__drop--3" d="M16.1 17.5l-.8 2.2" />
            </g>
          ) : (
            <path className="weather__bolt" d="M13 15.2 10.6 19h3l-2 3.6" stroke="var(--g-sun, #f5b83d)" strokeWidth="1.8" />
          )}
        </>
      )}
      {condition === 'haze' && (
        <>
          <circle cx="12" cy="9" r="3.6" fill="var(--g-sun, #f5b83d)" stroke="none" opacity=".55" />
          <path className="weather__haze" d="M3.5 13.5c2-1 3.5 1 5.5 0s3.5 1 5.5 0 3.5 1 5.5 0" />
          <path className="weather__haze weather__haze--2" d="M3.5 17c2-1 3.5 1 5.5 0s3.5 1 5.5 0 3.5 1 5.5 0" />
          <path className="weather__haze" d="M5.5 20.5c2-1 3.5 1 5.5 0s3.5 1 5.5 0" />
        </>
      )}
      {condition === 'night' && (
        <>
          <path d="M18 14.5A7 7 0 1 1 9.5 6a5.5 5.5 0 0 0 8.5 8.5z" fill="var(--g-moon, #c9c0ff)" stroke="var(--g-moon, #c9c0ff)" />
          <path className="weather__star" d="M18 3.5v2.4M16.8 4.7h2.4" strokeWidth="1.4" />
          <path className="weather__star weather__star--2" d="M21 9v1.8M20.1 9.9h1.8" strokeWidth="1.3" />
        </>
      )}
    </Glyph>
  );
}

/* ---------- AQI dial (Indian National AQI bands) ---------- */

export const AQI_BANDS = [
  { max: 50, label: 'Good', color: '#2bd39e', ink: 'var(--mint-ink)' },
  { max: 100, label: 'Satisfactory', color: '#9bd34a', ink: 'var(--green-ink)' },
  { max: 200, label: 'Moderate', color: '#f2c94c', ink: 'var(--amber-ink)' },
  { max: 300, label: 'Poor', color: '#f2994a', ink: 'var(--peach-ink)' },
  { max: 400, label: 'Very poor', color: '#eb5757', ink: 'var(--red-ink)' },
  { max: 500, label: 'Severe', color: '#a3242e', ink: 'var(--red-ink)' },
] as const;

export function aqiBand(value: number) {
  return AQI_BANDS.find((b) => value <= b.max) ?? AQI_BANDS[AQI_BANDS.length - 1];
}

/** Position along the dial: each band gets an equal slice so "Good" is not a sliver. */
function aqiFraction(value: number) {
  const v = Math.max(0, Math.min(500, value));
  let lower = 0;
  for (let i = 0; i < AQI_BANDS.length; i++) {
    const b = AQI_BANDS[i];
    if (v <= b.max) return (i + (v - lower) / (b.max - lower)) / AQI_BANDS.length;
    lower = b.max;
  }
  return 1;
}

function arcPath(cx: number, cy: number, r: number, a1: number, a2: number) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const x1 = cx + r * Math.cos(rad(a1));
  const y1 = cy + r * Math.sin(rad(a1));
  const x2 = cx + r * Math.cos(rad(a2));
  const y2 = cy + r * Math.sin(rad(a2));
  return `M${x1.toFixed(2)} ${y1.toFixed(2)}A${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

export function AqiDial({ value, size = 150, label }: { value: number; size?: number; label?: string }) {
  const band = aqiBand(value);
  const deg = aqiFraction(value) * 180;
  const slice = 180 / AQI_BANDS.length;
  return (
    <svg width={size} height={(size * 88) / 140} viewBox="0 0 140 88" className="aqi-dial" role="img" aria-label={label ?? `Air quality ${value}, ${band.label}`}>
      {AQI_BANDS.map((b, i) => (
        <path
          key={b.label}
          d={arcPath(70, 76, 58, 180 + i * slice + 1.4, 180 + (i + 1) * slice - 1.4)}
          stroke={b.color}
          strokeWidth="10"
          fill="none"
          opacity={value <= b.max && (i === 0 || value > AQI_BANDS[i - 1].max) ? 1 : 0.32}
        />
      ))}
      <g className="aqi-dial__marker" style={{ transform: `rotate(${deg}deg)`, transformOrigin: '70px 76px' }}>
        <circle cx="12" cy="76" r="8.5" fill="var(--surface)" stroke={band.color} strokeWidth="4" />
      </g>
      <text x="70" y="66" textAnchor="middle" className="aqi-dial__value" fill="var(--ink)">
        {value}
      </text>
      <text x="70" y="84" textAnchor="middle" className="aqi-dial__label" fill="var(--muted)">
        AQI · {band.label}
      </text>
    </svg>
  );
}

/* ---------- Traffic: dashes stream at the speed traffic is moving ---------- */

export type TrafficLevel = 0 | 1 | 2 | 3;
export const TRAFFIC_LABEL: Record<TrafficLevel, string> = { 0: 'Free flow', 1: 'Moderate', 2: 'Heavy', 3: 'Jammed' };
const TRAFFIC_SPEED: Record<TrafficLevel, string> = { 0: '0.55s', 1: '1.1s', 2: '2.2s', 3: '4.5s' };

export function TrafficGlyph({ level, ...p }: GlyphProps & { level: TrafficLevel }) {
  return (
    <Glyph name="traffic" {...p} live={p.live ?? true} className={`traffic--${level} ${p.className ?? ''}`}>
      <path className="g-tint" d="M6.8 21 10.2 3h3.6l3.4 18z" />
      <path d="M6.8 21 10.2 3M17.2 21 13.8 3" />
      <path className="traffic__lane" d="M12 3.5V21" strokeDasharray="2.4 2.6" strokeWidth="1.6" style={{ animationDuration: TRAFFIC_SPEED[level] }} />
      <rect className="traffic__car" x="10.2" y="14.2" width="3.6" height="5" rx="1.2" stroke="none" />
    </Glyph>
  );
}

/* ---------- Water supply: a droplet filled to today's supply level ---------- */

export function WaterGlyph({ level = 0.6, ...p }: GlyphProps & { level?: number }) {
  const id = useId().replace(/:/g, '');
  const y = 21 - Math.max(0, Math.min(1, level)) * 16;
  return (
    <Glyph name="water" {...p} live={p.live ?? true}>
      <defs>
        <clipPath id={`drop-${id}`}>
          <path d="M12 3.5s6.5 7 6.5 11a6.5 6.5 0 0 1-13 0c0-4 6.5-11 6.5-11z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#drop-${id})`}>
        <path
          className="water__wave"
          d={`M-12 ${y}c2-1.2 4-1.2 6 0s4 1.2 6 0 4-1.2 6 0 4 1.2 6 0 4-1.2 6 0 4 1.2 6 0 4-1.2 6 0 4 1.2 6 0V24H-12z`}
          fill="currentColor"
          stroke="none"
          opacity=".3"
        />
      </g>
      <path d="M12 3.5s6.5 7 6.5 11a6.5 6.5 0 0 1-13 0c0-4 6.5-11 6.5-11z" />
      <path d="M9 15.2a3 3 0 0 0 2.4 2.6" strokeWidth="1.5" />
    </Glyph>
  );
}

/* ---------- Power: steady, scheduled cut (clock), or outage (flicker) ---------- */

export function PowerGlyph({ status = 'ok', ...p }: GlyphProps & { status?: 'ok' | 'scheduled' | 'outage' }) {
  return (
    <Glyph name="power" {...p} live={p.live ?? status !== 'ok'} className={`power--${status} ${p.className ?? ''}`}>
      <path className="g-tint" d="M13 2.5 5.5 13.5H11l-1 8 7.5-11H12z" />
      <path className="power__bolt" d="M13 2.5 5.5 13.5H11l-1 8 7.5-11H12z" />
      {status === 'outage' && <path d="M3.5 3.5l17 17" strokeWidth="1.7" />}
      {status === 'scheduled' && (
        <g>
          <circle cx="18" cy="18" r="4" fill="var(--surface)" />
          <path d="M18 16.2V18l1.2.8" strokeWidth="1.4" />
        </g>
      )}
    </Glyph>
  );
}

/* ---------- Trust ring: how many independent sources agree ---------- */

export function TrustRing({ agree, total = 4, size = 22, title }: { agree: number; total?: number; size?: number; title?: string }) {
  const gap = 18;
  const slice = 360 / total;
  const single = agree <= 1;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className="trust-ring"
      role="img"
      aria-label={title ?? `${agree} of ${total} sources agree`}
    >
      {Array.from({ length: total }, (_, i) => {
        const a1 = -90 + i * slice + gap / 2;
        const a2 = -90 + (i + 1) * slice - gap / 2;
        const on = i < agree;
        return (
          <path
            key={i}
            className={on ? 'trust-ring__seg is-on' : 'trust-ring__seg'}
            style={{ animationDelay: `${i * 90}ms` }}
            d={arcPath(12, 12, 9.4, a1, a2)}
            stroke={on ? (single ? '#e8a628' : 'var(--mint-strong)') : 'var(--border-strong)'}
            strokeWidth="2.8"
            strokeLinecap="round"
            fill="none"
          />
        );
      })}
      {single ? (
        <path d="M12 8.6v3.6M12 15.2v.1" stroke="#c98a12" strokeWidth="2" strokeLinecap="round" />
      ) : (
        <path d="M8.6 12.2l2.3 2.3 4.5-4.6" stroke="var(--mint-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      )}
    </svg>
  );
}

/* ---------- Countdown ring (next metro / bus) ---------- */

export function CountdownRing({ value, max, size = 46, unit = 'min' }: { value: number; max: number; size?: number; unit?: string }) {
  const r = 19;
  const c = 2 * Math.PI * r;
  const progress = Math.max(0, Math.min(1, 1 - value / max));
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" className="countdown-ring" role="img" aria-label={`${value} ${unit}`}>
      <circle cx="23" cy="23" r={r} stroke="var(--surface-3)" strokeWidth="4" fill="none" />
      <circle
        cx="23"
        cy="23"
        r={r}
        stroke="var(--tone-dot, var(--accent-fill))"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - progress)}
        transform="rotate(-90 23 23)"
        className="countdown-ring__arc"
      />
      <text x="23" y="25.5" textAnchor="middle" className="countdown-ring__value" fill="var(--ink)">
        {value <= 0 ? 'Now' : value}
      </text>
      {value > 0 && (
        <text x="23" y="34" textAnchor="middle" className="countdown-ring__unit" fill="var(--muted)">
          {unit}
        </text>
      )}
    </svg>
  );
}

/* ---------- Step ring (civic report progress) ---------- */

export function StepRing({ step, steps = 5, size = 52, children }: { step: number; steps?: number; size?: number; children?: ReactNode }) {
  const slice = 360 / steps;
  return (
    <span className="step-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        {Array.from({ length: steps }, (_, i) => (
          <path
            key={i}
            className={i <= step ? 'step-ring__seg is-on' : 'step-ring__seg'}
            style={{ animationDelay: `${i * 80}ms` }}
            d={arcPath(12, 12, 10.6, -90 + i * slice + 7, -90 + (i + 1) * slice - 7)}
            stroke={i <= step ? (step >= steps - 1 ? 'var(--mint-strong)' : 'var(--accent-fill)') : 'var(--border-strong)'}
            strokeWidth="1.9"
            strokeLinecap="round"
            fill="none"
          />
        ))}
      </svg>
      <span className="step-ring__inner">{children}</span>
    </span>
  );
}

/* ---------- Reactions ---------- */

export function UpvoteGlyph(p: GlyphProps) {
  return (
    <Glyph name="upvote" {...p}>
      <g className="upvote__burst" stroke="var(--mint-strong)" strokeWidth="1.6">
        <path d="M12 1.2v1.4M4.4 4.6l1 1M19.6 4.6l-1 1M2.4 11h1.4M20.2 11h1.4" />
      </g>
      <path className="upvote__arrow g-tint" d="M12 4l7 8h-4v8H9v-8H5z" />
      <path className="upvote__arrow" d="M12 4l7 8h-4v8H9v-8H5z" />
    </Glyph>
  );
}

export function SaveGlyph(p: GlyphProps) {
  return (
    <Glyph name="save" {...p}>
      <path className="save__mark g-tint" d="M6 3h12v18l-6-4-6 4z" />
      <path className="save__mark" d="M6 3h12v18l-6-4-6 4z" />
      <circle className="g-dot" cx="12" cy="9.5" r="1.4" />
    </Glyph>
  );
}

export function HeartGlyph(p: GlyphProps) {
  return (
    <Glyph name="heart" {...p}>
      <path className="g-tint heart__shape" d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z" />
      <path className="heart__shape" d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z" />
    </Glyph>
  );
}
