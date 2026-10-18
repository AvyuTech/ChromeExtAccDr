import { Glyph, type GlyphProps } from './Glyph';

/* Category glyphs. Shown as duotone tiles; each has a small ambient motion
   that runs while `live` (or on hover of a `.glyph-host`). */

export function FoodGlyph(p: GlyphProps) {
  return (
    <Glyph name="food" {...p}>
      <path className="g-tint" d="M3.5 12.5h17a8.5 8.5 0 0 1-17 0z" />
      <path d="M3.5 12.5h17a8.5 8.5 0 0 1-17 0z" />
      <path d="M9 20.6h6" />
      <path className="food__steam food__steam--1" d="M8.6 9.4c-.9-1 .9-2 0-3.4" strokeWidth="1.6" />
      <path className="food__steam food__steam--2" d="M12 9.4c-.9-1 .9-2 0-3.4" strokeWidth="1.6" />
      <path className="food__steam food__steam--3" d="M15.4 9.4c-.9-1 .9-2 0-3.4" strokeWidth="1.6" />
      <circle className="g-dot" cx="15.6" cy="15" r="1.15" />
    </Glyph>
  );
}

export function CafeGlyph(p: GlyphProps) {
  return (
    <Glyph name="cafe" {...p}>
      <path className="g-tint" d="M5 9.5h11v4.6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z" />
      <path d="M5 9.5h11v4.6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z" />
      <path d="M16 11h1.4a2.5 2.5 0 0 1 0 5H16" />
      <path d="M4 21.2h13.5" />
      <path className="food__steam food__steam--1" d="M8.6 7c-.8-.9.8-1.8 0-3" strokeWidth="1.6" />
      <path className="food__steam food__steam--2" d="M12.2 7c-.8-.9.8-1.8 0-3" strokeWidth="1.6" />
      <circle className="g-dot" cx="10.5" cy="13.4" r="1.15" />
    </Glyph>
  );
}

export function EventsGlyph(p: GlyphProps) {
  return (
    <Glyph name="events" {...p}>
      <g className="events__ticket">
        <path
          className="g-tint"
          d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5v2.2a2.3 2.3 0 0 0 0 4.6v2.2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5v-2.2a2.3 2.3 0 0 0 0-4.6z"
        />
        <path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5v2.2a2.3 2.3 0 0 0 0 4.6v2.2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5v-2.2a2.3 2.3 0 0 0 0-4.6z" />
        <path d="M14.6 6.8v10.4" strokeDasharray="1.4 2.1" strokeWidth="1.5" />
        <path
          className="g-dot events__star"
          d="M9.3 9.2l.82 1.66 1.83.27-1.33 1.29.32 1.82-1.64-.86-1.64.86.32-1.82-1.33-1.29 1.83-.27z"
          stroke="none"
        />
      </g>
    </Glyph>
  );
}

export function DealsGlyph(p: GlyphProps) {
  return (
    <Glyph name="deals" {...p}>
      <g className="deals__tag">
        <path className="g-tint" d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.6 8.6a1.5 1.5 0 0 1 0 2.1l-6.2 6.2a1.5 1.5 0 0 1-2.1 0z" />
        <path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.6 8.6a1.5 1.5 0 0 1 0 2.1l-6.2 6.2a1.5 1.5 0 0 1-2.1 0z" />
        <path d="M10.6 15.4l4.6-4.6" strokeWidth="1.6" />
        <circle className="g-fill" cx="11.2" cy="11.4" r="0.9" stroke="none" />
        <circle className="g-fill" cx="14.6" cy="14.8" r="0.9" stroke="none" />
      </g>
      <circle className="g-dot" cx="7.6" cy="7.6" r="1.5" />
    </Glyph>
  );
}

export function AlertGlyph(p: GlyphProps) {
  return (
    <Glyph name="alert" {...p}>
      <circle className="alert__pulse" cx="12" cy="13" r="10" strokeWidth="1.3" />
      <path className="g-tint" d="M12 3.5l9 16H3z" />
      <path d="M12 3.5l9 16H3z" />
      <path d="M12 10v4.2" />
      <circle className="g-fill" cx="12" cy="17" r="1" stroke="none" />
    </Glyph>
  );
}

export function MoviesGlyph(p: GlyphProps) {
  return (
    <Glyph name="movies" {...p}>
      <path className="g-tint" d="M3.5 10h17v9a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19z" />
      <path d="M3.5 10h17v9a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19z" />
      <g className="movies__clapper">
        <path d="M3.4 9.6l-.5-2.7a1 1 0 0 1 .8-1.2l14.6-2.6a1 1 0 0 1 1.2.8l.4 2.2z" />
        <path d="M7.6 4.9l2.2 3.2M12.2 4.1l2.2 3.2" strokeWidth="1.6" />
      </g>
      <path className="g-dot" d="M10.4 12.8v4.6l4-2.3z" stroke="none" />
    </Glyph>
  );
}

export function GetawaysGlyph(p: GlyphProps) {
  return (
    <Glyph name="getaways" {...p}>
      <circle className="getaways__sun" cx="17" cy="7" r="2.6" fill="var(--g-sun, #f5b83d)" stroke="none" />
      <path className="g-tint" d="M2.5 19.5l6-9 4 5.5 2.5-3.5 6.5 7z" />
      <path d="M2.5 19.5l6-9 4 5.5 2.5-3.5 6.5 7z" />
      <path d="M7 14.2l1.5-1.2 1.4 1.1" strokeWidth="1.5" />
    </Glyph>
  );
}

export function GroupsGlyph(p: GlyphProps) {
  return (
    <Glyph name="groups" {...p}>
      <circle className="g-tint" cx="12" cy="8.6" r="2.9" />
      <g className="groups__head groups__head--1">
        <circle cx="5.6" cy="10.4" r="2" />
        <path d="M2.4 18.4c.4-2 1.6-3.3 3.4-3.3" />
      </g>
      <g className="groups__head groups__head--2">
        <circle cx="12" cy="8.6" r="2.9" />
        <path d="M7.4 19c.7-3 2.4-4.6 4.6-4.6s3.9 1.6 4.6 4.6" />
      </g>
      <g className="groups__head groups__head--3">
        <circle cx="18.4" cy="10.4" r="2" />
        <path d="M21.6 18.4c-.4-2-1.6-3.3-3.4-3.3" />
      </g>
      <circle className="g-dot" cx="12" cy="3.6" r="1.1" />
    </Glyph>
  );
}

export function ServicesGlyph(p: GlyphProps) {
  return (
    <Glyph name="services" {...p}>
      <path className="g-tint" d="M3.5 9.5 12 4l8.5 5.5z" />
      <path d="M3.5 9.5 12 4l8.5 5.5z" />
      <path d="M6 11.5v6M10 11.5v6M14 11.5v6M18 11.5v6" />
      <path d="M3.5 20.3h17M4.5 17.6h15" />
      <circle className="g-dot" cx="12" cy="7.3" r="1.05" />
    </Glyph>
  );
}

export function TransitGlyph(p: GlyphProps) {
  return (
    <Glyph name="transit" {...p}>
      <g className="transit__train">
        <path className="g-tint" d="M6.5 8h11v4.5h-11z" />
        <path d="M6 4.5h12a1.5 1.5 0 0 1 1.5 1.5v10a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3V6A1.5 1.5 0 0 1 6 4.5z" />
        <path d="M6.5 8h11v4.5h-11z" strokeWidth="1.5" />
        <circle className="g-dot transit__light" cx="8.6" cy="15.6" r="1.05" />
        <circle className="g-dot transit__light transit__light--2" cx="15.4" cy="15.6" r="1.05" />
      </g>
      <path d="M8 19.6l-2 2.4M16 19.6l2 2.4" />
    </Glyph>
  );
}

export function SafetyGlyph(p: GlyphProps) {
  return (
    <Glyph name="safety" {...p}>
      <path className="g-tint" d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z" />
      <path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z" />
      <path className="safety__beat" d="M7 12.2h2.2l1.4-2.6 2 5 1.4-2.4H17" strokeWidth="1.7" pathLength="1" />
    </Glyph>
  );
}

/** Civic report: a traffic cone; wobbles while a report is open. */
export function ReportGlyph(p: GlyphProps) {
  return (
    <Glyph name="report" {...p}>
      <g className="report__cone">
        <path className="g-tint" d="M9.6 4.6h4.8l3.6 14.4H6z" />
        <path d="M9.6 4.6h4.8l3.6 14.4H6z" />
        <path d="M8.5 9.6h7M7.3 14.3h9.4" strokeWidth="1.7" />
        <circle className="g-dot" cx="12" cy="4.4" r="1.15" />
      </g>
      <path d="M3.5 19.5h17" />
    </Glyph>
  );
}

export function MusicGlyph(p: GlyphProps) {
  return (
    <Glyph name="music" {...p}>
      <path className="g-tint" d="M9 18V5l11-2v13z" />
      <path d="M9 18V5l11-2v13" />
      <path d="M9 9l11-2" strokeWidth="1.5" />
      <circle className="music__note" cx="6" cy="18" r="3" />
      <circle className="music__note music__note--2" cx="17" cy="16" r="3" />
      <circle className="g-dot" cx="17" cy="16" r="1" />
    </Glyph>
  );
}

/** Market: a stall with a scalloped awning. */
export function MarketGlyph(p: GlyphProps) {
  return (
    <Glyph name="market" {...p}>
      <path className="g-tint" d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z" />
      <path d="M3 9l2-5h14l2 5" />
      <path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z" />
      <path d="M5 13.4v7.1h14v-7.1" />
      <path d="M10 20.5v-4h4v4" strokeWidth="1.6" />
      <circle className="g-dot" cx="12" cy="6.4" r="1" />
    </Glyph>
  );
}

/** Comedy & talks: a stage mic on a stand. */
export function MicGlyph(p: GlyphProps) {
  return (
    <Glyph name="mic" {...p}>
      <rect className="g-tint" x="9" y="3" width="6" height="11" rx="3" />
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.2 11a6.8 6.8 0 0 0 13.6 0M12 17.8V21M8.5 21h7" />
      <path d="M9.2 7h2M9.2 10h2" strokeWidth="1.4" />
      <circle className="g-dot mic__live" cx="19.5" cy="4.5" r="1.4" />
    </Glyph>
  );
}

/** Heritage: an Ahmedabad pol gateway with its carved arch. */
export function HeritageGlyph(p: GlyphProps) {
  return (
    <Glyph name="heritage" {...p}>
      <path className="g-tint" d="M5 21V8.5L12 4l7 4.5V21h-4.2v-5.5a2.8 2.8 0 0 0-5.6 0V21z" />
      <path d="M3 21h18" />
      <path d="M5 21V8.5L12 4l7 4.5V21" />
      <path d="M9.2 21v-5.5a2.8 2.8 0 0 1 5.6 0V21" />
      <path d="M7.5 10.5h9" strokeWidth="1.5" />
      <path d="M8 12.6v.1M16 12.6v.1" strokeWidth="2.2" />
      <circle className="g-dot" cx="12" cy="7.6" r="1.05" />
    </Glyph>
  );
}

/** Workshops: a thrown pot. */
export function PotteryGlyph(p: GlyphProps) {
  return (
    <Glyph name="pottery" {...p}>
      <path className="g-tint" d="M9 4c0 3-3 4-3 9 0 4 2.5 7 6 7s6-3 6-7c0-5-3-6-3-9z" />
      <path d="M8 4h8" />
      <path d="M9 4c0 3-3 4-3 9 0 4 2.5 7 6 7s6-3 6-7c0-5-3-6-3-9" />
      <path d="M6.6 11.5c3.4 1.3 7.4 1.3 10.8 0" strokeWidth="1.5" />
      <circle className="g-dot" cx="12" cy="15.8" r="1.1" />
    </Glyph>
  );
}

/** Sports: a pickleball paddle and ball. */
export function SportsGlyph(p: GlyphProps) {
  return (
    <Glyph name="sports" {...p}>
      <path className="g-tint" d="M14.8 3.2a5.6 5.6 0 0 1 4.2 9.6l-4.6 4.6-6.2-6.2 4.6-4.6a5.6 5.6 0 0 1 2-3.4z" />
      <path d="M15.6 3a5.4 5.4 0 0 1 3.8 9.2l-5 5-6-6 5-5A5.4 5.4 0 0 1 15.6 3z" />
      <path d="M8.4 11.2l-1.1 3.9L3.5 19l1.5 1.5 3.9-3.8 3.9-1.1" />
      <circle className="g-dot sports__ball" cx="5.6" cy="5.6" r="2" />
    </Glyph>
  );
}

/** Kids & family: a kite. */
export function KidsGlyph(p: GlyphProps) {
  return (
    <Glyph name="kids" {...p}>
      <g className="kids__kite">
        <path className="g-tint" d="M14 2.8l6.2 6.2-6.2 6.2L7.8 9z" />
        <path d="M14 2.8l6.2 6.2-6.2 6.2L7.8 9z" />
        <path d="M7.8 9h12.4M14 2.8v12.4" strokeWidth="1.4" />
      </g>
      <path d="M14 15.2c-1 2.4-3.3 2-4.4 3.3-1 1.2-.4 2.7-2.6 2.9" strokeWidth="1.5" />
      <circle className="g-dot" cx="5" cy="20.4" r="1.1" />
    </Glyph>
  );
}

/** Wellness & outdoors: a leaf. */
export function NatureGlyph(p: GlyphProps) {
  return (
    <Glyph name="nature" {...p}>
      <path className="g-tint" d="M5 19C4 11 9 5 19.5 4.5 19.5 14 14 20 5 19z" />
      <path d="M5 19C4 11 9 5 19.5 4.5 19.5 14 14 20 5 19z" />
      <path d="M5 19c3-4.5 6.5-8 10.5-10.5" />
      <circle className="g-dot" cx="4.6" cy="19.6" r="1.1" />
    </Glyph>
  );
}

/** Shopping: a cloth bag. */
export function ShoppingGlyph(p: GlyphProps) {
  return (
    <Glyph name="shopping" {...p}>
      <path className="g-tint" d="M5 8h14l-1 12.5H6z" />
      <path d="M5 8h14l-1 12.5H6z" />
      <path d="M9 10V6.5a3 3 0 0 1 6 0V10" />
      <circle className="g-dot" cx="12" cy="14.6" r="1.15" />
    </Glyph>
  );
}

/** Lost & found: a key tag. */
export function LostFoundGlyph(p: GlyphProps) {
  return (
    <Glyph name="lostfound" {...p}>
      <circle className="g-tint" cx="8" cy="8" r="4.5" />
      <circle cx="8" cy="8" r="4.5" />
      <path d="M11.2 11.2l9.3 9.3M17 17l2-2M14.6 14.6l1.6-1.6" />
      <circle className="g-dot" cx="8" cy="8" r="1.4" />
    </Glyph>
  );
}

/** Give away: an open box. */
export function GiveGlyph(p: GlyphProps) {
  return (
    <Glyph name="give" {...p}>
      <path className="g-tint" d="M4 10h16v10.5H4z" />
      <path d="M4 10h16v10.5H4z" />
      <path d="M4 10 2.5 6.5 10 4l2 6M20 10l1.5-3.5L14 4l-2 6" />
      <path d="M12 10v10.5" strokeWidth="1.5" />
      <circle className="g-dot" cx="12" cy="7" r="1.1" />
    </Glyph>
  );
}

/** Questions: a speech bubble with a question mark. */
export function QuestionGlyph(p: GlyphProps) {
  return (
    <Glyph name="question" {...p}>
      <path className="g-tint" d="M20.5 11.5a8 8 0 0 1-11.6 7.1L3.5 20l1.4-4.9a8 8 0 1 1 15.6-3.6z" />
      <path d="M20.5 11.5a8 8 0 0 1-11.6 7.1L3.5 20l1.4-4.9a8 8 0 1 1 15.6-3.6z" />
      <path d="M10.2 9.4a2.3 2.3 0 1 1 3.2 2.1c-.8.4-1.4 1-1.4 1.9" />
      <circle className="g-dot" cx="12" cy="15.6" r="1.05" />
    </Glyph>
  );
}

/** Recommendation: a thumbs-up inside a star burst. */
export function RecommendGlyph(p: GlyphProps) {
  return (
    <Glyph name="recommend" {...p}>
      <path className="g-tint" d="M7.5 10.5 11 4c1.6 0 2.5 1 2.2 2.6l-.5 2.4h5.4a1.6 1.6 0 0 1 1.6 1.9l-1.4 7.2a1.6 1.6 0 0 1-1.6 1.3H7.5z" />
      <path d="M7.5 10.5 11 4c1.6 0 2.5 1 2.2 2.6l-.5 2.4h5.4a1.6 1.6 0 0 1 1.6 1.9l-1.4 7.2a1.6 1.6 0 0 1-1.6 1.3H7.5z" />
      <path d="M3.5 10.5h4v9h-4z" />
      <circle className="g-dot" cx="5.5" cy="17" r="1" />
    </Glyph>
  );
}
