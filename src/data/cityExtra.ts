import type { GlyphName } from '../icons';
import type { CommuteMode } from '../state/settings';

/**
 * Sample journey-time building blocks for the commute card (Bodakdev → SG Highway).
 * Times only; Nearhood never shows fares it cannot confirm.
 */
export const METRO_RIDE_MIN = 12;
export const BRTS_RIDE_MIN = 16;
export const LAST_MILE_WALK_MIN = 6;
export const WALK_ONLY_MIN = 48;
export const PARK_AND_WALK_MIN = 5;

export const MODE_META: Record<CommuteMode, { label: string; glyph: GlyphName }> = {
  metro: { label: 'Metro', glyph: 'transit' },
  brts: { label: 'BRTS', glyph: 'bus' },
  car: { label: 'Car', glyph: 'car' },
  'two-wheeler': { label: 'Two-wheeler', glyph: 'bike' },
  auto: { label: 'Auto-rickshaw', glyph: 'auto' },
  walk: { label: 'Walk', glyph: 'walk' },
};
