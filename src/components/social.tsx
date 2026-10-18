import type { AppNotification, PostType, Tone } from '../data/types';
import type { GlyphName } from '../icons';

/** Badge tone and glyph for each kind of neighbour post. */
export const POST_TYPE_META: Record<PostType, { tone: Tone; glyph: GlyphName }> = {
  question: { tone: 'violet', glyph: 'question' },
  recommendation: { tone: 'mint', glyph: 'recommend' },
  alert: { tone: 'amber', glyph: 'alert' },
  lostfound: { tone: 'peach', glyph: 'lostfound' },
  event: { tone: 'blue', glyph: 'events' },
  giveaway: { tone: 'teal', glyph: 'give' },
};

/** Glyph and tone for each kind of notification. */
export const NOTIFICATION_META: Record<AppNotification['kind'], { tone: Tone; glyph: GlyphName }> = {
  reply: { tone: 'violet', glyph: 'question' },
  mention: { tone: 'blue', glyph: 'users' },
  alert: { tone: 'amber', glyph: 'alert' },
  event: { tone: 'night', glyph: 'events' },
  deal: { tone: 'mint', glyph: 'deals' },
  report: { tone: 'clay', glyph: 'report' },
  group: { tone: 'teal', glyph: 'groups' },
  system: { tone: 'violet', glyph: 'city' },
};
