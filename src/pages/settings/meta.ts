import type { Tone } from '../../data/types';
import {
  AccessibilityGlyph,
  AlertGlyph,
  BellGlyph,
  DataGlyph,
  GlobeGlyph,
  HelpGlyph,
  InfoGlyph,
  LayersGlyph,
  LockGlyph,
  PaletteGlyph,
  SosGlyph,
  UserGlyph,
} from '../../icons';
import { CommuteGlyph } from '../../icons/extra-settings';
import type { GlyphComp } from './parts';

export type SectionId =
  | 'account'
  | 'location'
  | 'notifications'
  | 'alerts'
  | 'appearance'
  | 'language'
  | 'accessibility'
  | 'privacy'
  | 'sources'
  | 'data'
  | 'safety'
  | 'help'
  | 'about';

export interface SectionMeta {
  id: SectionId;
  key: string;
  G: GlyphComp;
  tone: Tone;
  group: 'you' | 'display' | 'trust' | 'support';
  /** Extra words people might search for. */
  keywords: string;
}

export const SECTIONS: SectionMeta[] = [
  { id: 'account', key: 'settings.account', G: UserGlyph, tone: 'violet', group: 'you', keywords: 'profile name email phone username bio delete verified' },
  { id: 'location', key: 'settings.location', G: CommuteGlyph, tone: 'teal', group: 'you', keywords: 'city home work neighbourhood radius commute metro car travel time' },
  { id: 'notifications', key: 'settings.notifications', G: BellGlyph, tone: 'amber', group: 'you', keywords: 'push email digest quiet hours replies mentions friends follows followers check-ins' },
  { id: 'alerts', key: 'settings.alerts', G: AlertGlyph, tone: 'peach', group: 'you', keywords: 'traffic water power weather severity commute radius safety' },
  { id: 'appearance', key: 'settings.appearance', G: PaletteGlyph, tone: 'blue', group: 'display', keywords: 'theme dark light text size font' },
  { id: 'language', key: 'settings.language', G: GlobeGlyph, tone: 'green', group: 'display', keywords: 'gujarati hindi english translate' },
  { id: 'accessibility', key: 'settings.accessibility', G: AccessibilityGlyph, tone: 'violet', group: 'display', keywords: 'motion contrast touch read aloud screen reader' },
  { id: 'privacy', key: 'settings.privacy', G: LockGlyph, tone: 'clay', group: 'trust', keywords: 'visibility messages location download data analytics friends followers follow approve check-ins want to try list' },
  { id: 'sources', key: 'settings.sources', G: LayersGlyph, tone: 'mint', group: 'trust', keywords: 'ai answers instagram maps news tickets neighbours unconfirmed agree' },
  { id: 'data', key: 'settings.data', G: DataGlyph, tone: 'teal', group: 'trust', keywords: 'data saver offline storage autoplay live updates searches reset' },
  { id: 'safety', key: 'settings.safety', G: SosGlyph, tone: 'red', group: 'support', keywords: 'sos emergency contacts location safe walk' },
  { id: 'help', key: 'settings.help', G: HelpGlyph, tone: 'yellow', group: 'support', keywords: 'faq support problem bug feedback guidelines' },
  { id: 'about', key: 'settings.about', G: InfoGlyph, tone: 'blue', group: 'support', keywords: 'version credits licence glyphs icons' },
];

export const GROUPS: Array<{ id: SectionMeta['group']; key: string }> = [
  { id: 'you', key: 'settings.group.you' },
  { id: 'display', key: 'settings.group.display' },
  { id: 'trust', key: 'settings.group.trust' },
  { id: 'support', key: 'settings.group.support' },
];

export const APP_VERSION = '0.1.0';
