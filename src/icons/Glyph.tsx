import type { CSSProperties, ReactNode } from 'react';

/**
 * Nearhood glyphs: one hand-drawn icon family.
 *
 * Anatomy (classes styled in icons.css):
 * - strokes use currentColor, 1.9 width, round caps and joins
 * - `.g-tint`  a soft fill layer behind the strokes; shows on `active` or `duo`
 * - `.g-dot`   the signature mint dot borrowed from the logo
 * - `.g-fill`  solid currentColor details
 * Behaviour:
 * - `active`   one-shot "arrive" animation plus filled state (nav, toggles)
 * - `live`     ambient loop driven by data (steam rising, alert pulsing...)
 * - `duo`      always show the tint layer (category tiles)
 */
export interface GlyphProps {
  size?: number;
  active?: boolean;
  live?: boolean;
  duo?: boolean;
  /** Accessible name. Without it the glyph is decorative (aria-hidden). */
  title?: string;
  className?: string;
  style?: CSSProperties;
}

interface BaseProps extends GlyphProps {
  name: string;
  children: ReactNode;
  viewBox?: string;
  strokeWidth?: number;
}

export function Glyph({
  name,
  children,
  size = 24,
  active,
  live,
  duo,
  title,
  className,
  style,
  viewBox = '0 0 24 24',
  strokeWidth = 1.9,
}: BaseProps) {
  const classes = ['glyph', `glyph--${name}`];
  if (active) classes.push('is-active');
  if (live) classes.push('is-live');
  if (duo) classes.push('is-duo');
  if (className) classes.push(className);
  const a11y = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true as const };
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={classes.join(' ')}
      focusable="false"
      style={style}
      {...a11y}
    >
      {children}
    </svg>
  );
}
