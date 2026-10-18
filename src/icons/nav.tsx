import { useId } from 'react';
import { Glyph, type GlyphProps } from './Glyph';

/**
 * Brand mark: a violet arch (a doorway, an "n") with the lime dot of "you are here".
 * `tile` puts it on a violet app-icon square.
 */
export function Logo({ size = 34, animated = true, title, tile }: { size?: number; animated?: boolean; title?: string; tile?: boolean }) {
  const a11y = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true as const };
  // Unique per instance: a shared id would resolve to the first copy, which may sit in a hidden subtree.
  const gradient = `nh-arch-${useId().replace(/:/g, '')}`;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={`logo${animated ? ' logo--animated' : ''}`} {...a11y}>
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={tile ? '#ffffff' : '#8b74ff'} />
          <stop offset="1" stopColor={tile ? '#e9e4ff' : '#5a3fe0'} />
        </linearGradient>
      </defs>
      {tile ? <rect width="40" height="40" rx="12" fill="#6c52ee" /> : null}
      <path
        className="logo__arch"
        d={tile ? 'M12 31V19.5a8 8 0 0 1 16 0V31' : 'M8.5 34V19.5a11.5 11.5 0 0 1 23 0V34'}
        fill="none"
        stroke={`url(#${gradient})`}
        strokeWidth={tile ? 5 : 6.4}
        strokeLinecap="round"
      />
      <circle className="logo__dot" cx="20" cy={tile ? 25.5 : 27.5} r={tile ? 3.4 : 4.3} fill="#dfff8a" stroke="#b6e23a" strokeWidth=".8" />
    </svg>
  );
}

/** The wordmark next to the arch. */
export function Wordmark({ size = 24 }: { size?: number }) {
  return (
    <span className="wordmark" style={{ fontSize: size }}>
      nearhood
    </span>
  );
}

/** Home: a house whose door is the logo arch; the dot drops in when active. */
export function HomeGlyph(p: GlyphProps) {
  return (
    <Glyph name="home" {...p}>
      <path className="g-tint" d="M5.5 9.2 12 4l6.5 5.2v10.3h-13z" />
      <path className="home__roof" d="M3.5 10.6 12 3.6l8.5 7" />
      <path d="M5.5 9.2v10.3h13V9.2" />
      <path className="g-inner" d="M9.6 19.5v-3.6a2.4 2.4 0 0 1 4.8 0v3.6" />
      <circle className="g-dot" cx="12" cy="16.4" r="1.25" />
    </Glyph>
  );
}

/** Explore: compass; the needle swings round and settles when the tab opens. */
export function ExploreGlyph(p: GlyphProps) {
  return (
    <Glyph name="explore" {...p}>
      <circle className="g-tint" cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="9" />
      <path className="g-inner" d="M12 3.6v1.3M20.4 12h-1.3M12 20.4v-1.3M3.6 12h1.3" strokeWidth="1.6" />
      <g className="explore__needle">
        <path className="g-fill g-inner-fill" d="M15.6 8.4 13.4 13.4 10.6 10.6z" stroke="none" />
        <path className="g-inner" d="M15.6 8.4l-2.2 5-5 2.2 2.2-5z" />
      </g>
      <circle className="g-dot" cx="12" cy="12" r="1.1" />
    </Glyph>
  );
}

/** City: a skyline whose tallest tower broadcasts; windows light up and waves pulse. */
export function CityGlyph(p: GlyphProps) {
  return (
    <Glyph name="city" {...p}>
      <path className="g-tint" d="M5 20.5v-8h4v-5h5v7h5v6z" />
      <path d="M3 20.5h18" />
      <path d="M5 20.5v-8h4" />
      <path d="M9 20.5v-13h5v13" />
      <path d="M14 20.5v-6h5v6" />
      <path d="M11.5 7.5V5.4" />
      <path className="city__wave city__wave--1" d="M13.4 3.3a2.5 2.5 0 0 1 0 3.5M9.6 3.3a2.5 2.5 0 0 0 0 3.5" strokeWidth="1.6" />
      <path className="city__wave city__wave--2" d="M14.9 1.9a4.5 4.5 0 0 1 0 6.3M8.1 1.9a4.5 4.5 0 0 0 0 6.3" strokeWidth="1.6" />
      <rect className="city__win" x="10.7" y="10.2" width="1.6" height="1.6" rx="0.4" />
      <rect className="city__win city__win--2" x="10.7" y="13.6" width="1.6" height="1.6" rx="0.4" />
      <rect className="city__win city__win--3" x="6.2" y="15" width="1.6" height="1.6" rx="0.4" />
      <rect className="city__win city__win--4" x="15.7" y="16.6" width="1.6" height="1.6" rx="0.4" />
      <circle className="g-dot city__beacon" cx="11.5" cy="5" r="1.15" />
    </Glyph>
  );
}

/** Me: a neighbour inside their neighbourhood ring. */
export function MeGlyph(p: GlyphProps) {
  return (
    <Glyph name="me" {...p}>
      <circle className="g-tint" cx="12" cy="9" r="3.6" />
      <circle cx="12" cy="9" r="3.6" />
      <path d="M5.4 19.6c1.3-3.3 3.8-5 6.6-5s5.3 1.7 6.6 5" />
      <circle className="me__ring" cx="12" cy="12" r="10.3" strokeWidth="1.3" strokeDasharray="2.2 3.1" />
      <circle className="g-dot" cx="19.4" cy="5.4" r="1.6" />
    </Glyph>
  );
}

/** Bell for Updates; swings while there is something new. */
export function BellGlyph({ ringing, ...p }: GlyphProps & { ringing?: boolean }) {
  return (
    <Glyph name="bell" {...p} live={ringing || p.live}>
      <g className="bell__body">
        <path className="g-tint" d="M6 9.5a6 6 0 0 1 12 0c0 5.5 2.3 7 2.3 7H3.7S6 15 6 9.5z" />
        <path d="M6 9.5a6 6 0 0 1 12 0c0 5.5 2.3 7 2.3 7H3.7S6 15 6 9.5z" />
      </g>
      <path className="bell__clapper" d="M10 19.6a2 2 0 0 0 4 0" />
      {ringing ? <circle className="g-dot g-dot--on" cx="18" cy="5" r="2.4" stroke="var(--surface)" strokeWidth="1.4" /> : null}
    </Glyph>
  );
}

/** Messages: speech bubble; dots type out while there are unread chats. */
export function ChatGlyph({ typing, ...p }: GlyphProps & { typing?: boolean }) {
  return (
    <Glyph name="chat" {...p} live={typing || p.live}>
      <path className="g-tint" d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z" />
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z" />
      <circle className="g-fill chat__dot chat__dot--1" cx="9" cy="12" r="1" stroke="none" />
      <circle className="g-fill chat__dot chat__dot--2" cx="12.5" cy="12" r="1" stroke="none" />
      <circle className="g-fill chat__dot chat__dot--3" cx="16" cy="12" r="1" stroke="none" />
    </Glyph>
  );
}

export function PlusGlyph(p: GlyphProps) {
  return (
    <Glyph name="plus" strokeWidth={2.6} {...p}>
      <path d="M12 5v14M5 12h14" />
    </Glyph>
  );
}

/** The Nearhood answer spark; twinkles while an answer is being put together. */
export function SparkGlyph({ thinking, ...p }: GlyphProps & { thinking?: boolean }) {
  return (
    <Glyph name="spark" {...p} live={thinking || p.live}>
      <path className="spark__big g-tint" d="M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
      <path className="spark__big" d="M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
      <path className="spark__small" d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
    </Glyph>
  );
}
