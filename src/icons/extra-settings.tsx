import { Glyph, type GlyphProps } from './Glyph';

/* Glyphs used only by Me, Onboarding and Settings. Same hand as the core set. */

/** "Follow the system": half sun, half moon. */
export function SystemThemeGlyph(p: GlyphProps) {
  return (
    <Glyph name="system-theme" {...p}>
      <path className="g-tint" d="M12 4.5a7.5 7.5 0 0 1 0 15z" />
      <circle cx="12" cy="12" r="7.5" />
      <path d="M12 4.5v15" />
      <path d="M12 1.8v1.2M12 21v1.2M1.8 12H3M4.8 4.8l.8.8M4.8 19.2l.8-.8" strokeWidth="1.6" />
    </Glyph>
  );
}

/** Quiet hours: a moon with sleeping "z" marks. */
export function QuietGlyph(p: GlyphProps) {
  return (
    <Glyph name="quiet" {...p}>
      <path className="g-tint" d="M17.5 15A7.5 7.5 0 1 1 9 5.5a6 6 0 0 0 8.5 9.5z" />
      <path d="M17.5 15A7.5 7.5 0 1 1 9 5.5a6 6 0 0 0 8.5 9.5z" />
      <path className="quiet__z" d="M15 3.5h3l-3 3h3M19.5 8.5h2l-2 2h2" strokeWidth="1.5" />
    </Glyph>
  );
}

/** City digest: an envelope carrying a little skyline. */
export function DigestGlyph(p: GlyphProps) {
  return (
    <Glyph name="digest" {...p}>
      <rect className="g-tint" x="3" y="6" width="18" height="13" rx="2.5" />
      <rect x="3" y="6" width="18" height="13" rx="2.5" />
      <path d="M3.8 7.4 12 13l8.2-5.6" />
      <path d="M7 19v-3h2.5v-2h3v2.5H15V19" strokeWidth="1.4" />
      <circle className="g-dot" cx="18.5" cy="5.5" r="2" />
    </Glyph>
  );
}

/** Commute: a home and a briefcase joined by a dotted route. */
export function CommuteGlyph(p: GlyphProps) {
  return (
    <Glyph name="commute" {...p}>
      <path className="g-tint" d="M3 9.5 6.5 6.5 10 9.5v4.5H3z" />
      <path d="M3 9.5 6.5 6.5 10 9.5v4.5H3z" />
      <rect x="14" y="13" width="7" height="5.5" rx="1.2" />
      <path d="M16 13v-1.2h3V13" strokeWidth="1.5" />
      <path d="M6.5 14v3.5a2 2 0 0 0 2 2H14" strokeDasharray="1.6 2" strokeWidth="1.6" />
      <circle className="g-dot" cx="17.5" cy="6" r="1.6" />
    </Glyph>
  );
}

/** Interests: a heart pinned on the map. */
export function InterestsGlyph(p: GlyphProps) {
  return (
    <Glyph name="interests" {...p}>
      <path className="g-tint" d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
      <path className="g-dot" d="M12 13s-3-1.9-3-4a1.6 1.6 0 0 1 3-.8 1.6 1.6 0 0 1 3 .8c0 2.1-3 4-3 4z" />
    </Glyph>
  );
}
