import { Glyph, type GlyphProps } from './Glyph';

/* Glyphs for the friends layer: check-ins, verdicts, lists. */

/** A check-in ("what I had"): plate, fork and knife, with the mint "here" dot. */
export function CheckInGlyph(p: GlyphProps) {
  return (
    <Glyph name="checkin" {...p}>
      <g className="checkin__plate">
        <circle cx="12" cy="12.5" r="7" />
        <circle className="g-tint" cx="12" cy="12.5" r="4.2" />
        <circle cx="12" cy="12.5" r="4.2" strokeWidth="1.5" />
      </g>
      <path d="M3.1 4v5.4M1.9 4v3.4a1.2 1.2 0 0 0 2.4 0V4M3.1 9.4V21" strokeWidth="1.6" />
      <path d="M21.4 4c-1.3 1-1.9 3-1.9 5.6h1.9V21" strokeWidth="1.6" />
      <circle className="g-dot checkin__dot" cx="12" cy="12.5" r="1.3" />
    </Glyph>
  );
}

/** Verdict: Must try. A heart with a spark; it beats when chosen. */
export function MustGlyph(p: GlyphProps) {
  return (
    <Glyph name="must" {...p}>
      <g className="must__heart">
        <path className="g-tint" d="M11 20s-7-4.3-7-9.5A4 4 0 0 1 11 8.2a4 4 0 0 1 7 2.3c0 5.2-7 9.5-7 9.5z" />
        <path d="M11 20s-7-4.3-7-9.5A4 4 0 0 1 11 8.2a4 4 0 0 1 7 2.3c0 5.2-7 9.5-7 9.5z" />
      </g>
      <path className="g-dot must__spark" d="M19.4 2.4l.75 1.85 1.85.75-1.85.75-.75 1.85-.75-1.85-1.85-.75 1.85-.75z" />
    </Glyph>
  );
}

/** Verdict: Good. A tick that draws itself in. */
export function GoodGlyph(p: GlyphProps) {
  return (
    <Glyph name="good" {...p}>
      <circle className="g-tint" cx="12" cy="12" r="8.6" />
      <circle cx="12" cy="12" r="8.6" />
      <path className="good__tick" d="M8 12.4l2.7 2.7 5.3-5.4" pathLength="1" />
    </Glyph>
  );
}

/** Verdict: Skip. A no-entry sign that shakes its head. */
export function SkipGlyph(p: GlyphProps) {
  return (
    <Glyph name="skip" {...p}>
      <g className="skip__sign">
        <circle className="g-tint" cx="12" cy="12" r="8.6" />
        <circle cx="12" cy="12" r="8.6" />
        <path d="M7.2 16.8l9.6-9.6" />
      </g>
    </Glyph>
  );
}

/** A "Want to try" list: a checklist whose first row ticks itself. */
export function TodoGlyph(p: GlyphProps) {
  return (
    <Glyph name="todo" {...p}>
      <rect className="g-tint" x="4" y="3" width="16" height="18" rx="3" />
      <rect x="4" y="3" width="16" height="18" rx="3" />
      <path className="todo__tick" d="M7.4 8.6l1.4 1.4 2.6-2.7" pathLength="1" />
      <path d="M13.4 8.8h3.8M13.4 13.6h3.8M8 17.6h9.2" strokeWidth="1.6" />
      <rect x="7.5" y="12.2" width="2.9" height="2.9" rx=".8" strokeWidth="1.5" />
      <circle className="g-dot" cx="19.6" cy="3.6" r="1.6" />
    </Glyph>
  );
}

/** Friends: two people with a small mint heart between them. */
export function FriendsGlyph(p: GlyphProps) {
  return (
    <Glyph name="friends" {...p}>
      <circle className="g-tint" cx="8.5" cy="8" r="3" />
      <circle className="g-tint" cx="15.5" cy="8" r="3" />
      <circle cx="8.5" cy="8" r="3" />
      <circle cx="15.5" cy="8" r="3" />
      <path d="M2.6 19c.8-3.4 3.2-5.4 5.9-5.4 1.4 0 2.6.5 3.5 1.3M21.4 19c-.8-3.4-3.2-5.4-5.9-5.4-1.4 0-2.6.5-3.5 1.3" />
      <path className="g-dot friends__heart" d="M12 20.4s-2.3-1.3-2.3-3a1.15 1.15 0 0 1 2.3-.6 1.15 1.15 0 0 1 2.3.6c0 1.7-2.3 3-2.3 3z" />
    </Glyph>
  );
}

/** Curated lists: a stack of cards. */
export function ListsGlyph(p: GlyphProps) {
  return (
    <Glyph name="lists" {...p}>
      <path d="M8 3.5h8M6 5.5h12" strokeWidth="1.6" />
      <rect className="g-tint" x="4" y="7.5" width="16" height="13" rx="2.6" />
      <rect x="4" y="7.5" width="16" height="13" rx="2.6" />
      <path d="M11.3 12.2h5.2M11.3 15.6h3.6" strokeWidth="1.6" />
      <circle className="g-dot" cx="8.2" cy="13.9" r="1.6" />
    </Glyph>
  );
}

/** Add to Want to try: a bookmark with a plus that turns into a tick. */
export function WantGlyph(p: GlyphProps) {
  return (
    <Glyph name="want" {...p}>
      <path className="g-tint want__mark" d="M6 3h12v18l-6-4-6 4z" />
      <path className="want__mark" d="M6 3h12v18l-6-4-6 4z" />
      {p.active ? <path className="want__tick" d="M9.2 9.8l2 2 3.8-3.9" stroke="var(--on-accent, #fff)" /> : <path d="M12 7.2v5.2M9.4 9.8h5.2" />}
    </Glyph>
  );
}
