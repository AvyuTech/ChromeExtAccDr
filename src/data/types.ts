import type { GlyphName } from '../icons';
import type { TrafficLevel, WeatherCondition } from '../icons/live';

export type Tone = 'violet' | 'mint' | 'green' | 'peach' | 'amber' | 'yellow' | 'teal' | 'blue' | 'clay' | 'red' | 'night';

/** Where a piece of information came from. The app merges these and shows how many agree. */
export type SourceId =
  | 'tickets'
  | 'instagram'
  | 'maps'
  | 'news'
  | 'neighbours'
  | 'police'
  | 'amc'
  | 'utility'
  | 'metro'
  | 'imd'
  | 'cpcb';

export type SourceKind = 'official' | 'platform' | 'social' | 'community';

export interface Source {
  id: SourceId;
  label: string;
  kind: SourceKind;
}

export interface Neighbourhood {
  id: string;
  name: string;
  zone: 'West' | 'Central' | 'East' | 'North' | 'South';
  ward: string;
}

export interface Person {
  id: string;
  name: string;
  initials: string;
  area: string;
  tone: Tone;
  verified?: boolean;
  badge?: string;
}

export type PlaceCategory = 'food' | 'cafe' | 'sports' | 'shopping' | 'nature' | 'heritage' | 'culture';

export interface Place {
  id: string;
  name: string;
  kind: string;
  category: PlaceCategory;
  area: string;
  price: 1 | 2 | 3 | 4;
  rating: number;
  reviews: number;
  distanceKm: number;
  isNew?: boolean;
  openNow: boolean;
  hours: string;
  tags: string[];
  /** Merged summary of what locals say. */
  summary: string;
  highlights: string[];
  watchOuts: string[];
  sources: SourceId[];
  tone: Tone;
  glyph: GlyphName;
  address: string;
  bestTime?: string;
}

export type EventCategory = 'music' | 'market' | 'comedy' | 'heritage' | 'workshop' | 'food' | 'sports' | 'kids' | 'wellness';

export interface CityEvent {
  id: string;
  title: string;
  category: EventCategory;
  day: 'Fri' | 'Sat' | 'Sun' | 'Sat–Sun' | 'Today' | 'Tomorrow';
  time: string;
  venue: string;
  area: string;
  /** Rupees; 0 means free. */
  price: number;
  going: number;
  interested?: number;
  sources: SourceId[];
  confirmed: boolean;
  seatsLeft?: number;
  distanceKm: number;
  tags: Array<'couples' | 'kids' | 'free' | 'outdoor' | 'indoor' | 'solo' | 'friends' | 'family'>;
  description: string;
  organiser: string;
  tone: Tone;
  glyph: GlyphName;
  fillingFast?: boolean;
  unconfirmedNote?: string;
}

export interface Deal {
  id: string;
  title: string;
  merchant: string;
  placeId?: string;
  area: string;
  discount: string;
  ends: string;
  code?: string;
  category: 'food' | 'cafe' | 'shopping' | 'wellness' | 'movies' | 'transport';
  terms: string[];
  tone: Tone;
  glyph: GlyphName;
  claimedBy: number;
  distanceKm: number;
}

export type PostType = 'question' | 'recommendation' | 'alert' | 'lostfound' | 'event' | 'giveaway';

export interface Reply {
  id: string;
  authorId: string;
  text: string;
  ago: string;
  upvotes: number;
  helpful?: boolean;
}

export interface Post {
  id: string;
  type: PostType;
  authorId: string;
  area: string;
  ago: string;
  topic: string;
  text: string;
  upvotes: number;
  replies: Reply[];
  replyCount: number;
  /** A Nearhood answer distilled from replies and the wider web. */
  answer?: { text: string; basis: string; placeIds?: string[] };
  seenInReels?: number;
  trending?: boolean;
  groupId?: string;
}

export type AlertKind = 'traffic' | 'weather' | 'water' | 'power' | 'safety' | 'health' | 'civic' | 'transit';
export type Severity = 'info' | 'advisory' | 'warning' | 'critical';

export interface CityAlert {
  id: string;
  kind: AlertKind;
  severity: Severity;
  title: string;
  body: string;
  area: string;
  areas: string[];
  ago: string;
  window: string;
  source: SourceId;
  verified: boolean;
  affectsCommute?: boolean;
  tips: string[];
  updates: Array<{ time: string; text: string }>;
  active: boolean;
}

export interface Group {
  id: string;
  name: string;
  members: number;
  postsToday: number;
  description: string;
  tone: Tone;
  glyph: GlyphName;
  area: string;
  rules: string[];
  admins: string[];
  privacy: 'public' | 'neighbours';
}

export type NotificationKind = 'reply' | 'mention' | 'alert' | 'event' | 'deal' | 'report' | 'group' | 'system';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  ago: string;
  day: 'today' | 'earlier';
  link: string;
  actorId?: string;
}

export interface ChatMessage {
  id: string;
  from: 'me' | string;
  text: string;
  time: string;
}

export interface Conversation {
  id: string;
  withId: string;
  unread: number;
  messages: ChatMessage[];
  context?: string;
}

export type IssueCategory = 'pothole' | 'garbage' | 'streetlight' | 'water' | 'drainage' | 'stray' | 'footpath' | 'tree' | 'noise';

export interface CivicReport {
  id: string;
  ticket: string;
  category: IssueCategory;
  title: string;
  description: string;
  area: string;
  ward: string;
  landmark: string;
  createdAgo: string;
  /** 0 reported · 1 verified · 2 forwarded · 3 in progress · 4 resolved */
  status: 0 | 1 | 2 | 3 | 4;
  plusOnes: number;
  mine: boolean;
  timeline: Array<{ status: number; label: string; time: string; note?: string }>;
}

export interface Corridor {
  id: string;
  name: string;
  stretch: string;
  level: TrafficLevel;
  minutes: number;
  usual: number;
  cause?: string;
}

export interface TransitArrival {
  id: string;
  mode: 'metro' | 'brts' | 'amts';
  line: string;
  lineTone: Tone;
  stop: string;
  towards: string;
  minutes: number;
  walkMin: number;
  crowd: 'Light' | 'Moderate' | 'Busy';
}

export interface HourForecast {
  hour: string;
  temp: number;
  condition: WeatherCondition;
}

export interface CityPulse {
  city: string;
  updatedAgo: string;
  weather: {
    temp: number;
    feelsLike: number;
    condition: WeatherCondition;
    summary: string;
    high: number;
    low: number;
    humidity: number;
    windKmh: number;
    uv: number;
    sunrise: string;
    sunset: string;
    hourly: HourForecast[];
  };
  aqi: { value: number; dominant: string; station: string; advice: string; trend: number[] };
  corridors: Corridor[];
  arrivals: TransitArrival[];
  water: Array<{ ward: string; slot: string; status: 'on-schedule' | 'delayed' | 'low-pressure' | 'no-supply'; note?: string }>;
  power: Array<{ area: string; window: string; reason: string; status: 'scheduled' | 'outage' | 'restored' }>;
  civic: { ward: string; resolvedPct: number; open: number; avgDays: number; resolvedThisWeek: number };
  parking: Array<{ id: string; name: string; area: string; free: number; total: number }>;
}

export interface CityService {
  id: string;
  name: string;
  provider: string;
  description: string;
  glyph: GlyphName;
  tone: Tone;
  group: 'Pay' | 'Apply' | 'Book' | 'Know';
  due?: string;
  amount?: number;
}

export interface EmergencyContact {
  id: string;
  name: string;
  number: string;
  description: string;
  glyph: GlyphName;
  tone: Tone;
}

export interface Facility {
  id: string;
  name: string;
  kind: 'Hospital' | 'Police station' | 'Fire station' | 'Pharmacy (24h)';
  area: string;
  distanceKm: number;
  open24h: boolean;
  glyph: GlyphName;
}
