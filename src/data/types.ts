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
  | 'cyber'
  | 'amc'
  | 'utility'
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

/**
 * How a place got onto Nearhood. Places are never imported, bought or listed by
 * businesses: a person adds one when they check in, locals with verified visits
 * confirm it, and an owner can later claim the page to keep facts up to date.
 */
export interface PlaceOrigin {
  /** Person who first added it. */
  addedBy: string;
  addedWhen: string;
  /** Distinct locals with verified visits who confirmed the name, pin and details. */
  confirmedBy: number;
  /** Nearhood guide who reviewed the listing. */
  guide?: string;
  /** Owner or manager verified with a licence and a code sent to the venue's phone. */
  claimed?: { name: string; role: string; since: string };
  /** Parks, lakes, markets and streets belong to everyone and can't be claimed. */
  publicPlace?: boolean;
  /** Outside the city: reachable through friends and people's lists, not city browsing. */
  outsideCity?: boolean;
  /** The list it was first shared in, when it came in that way. */
  viaList?: string;
}

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
  origin: PlaceOrigin;
}

/** A new opening someone spotted. It joins Nearhood once enough locals confirm it. */
export interface SpottedPlace {
  id: string;
  name: string;
  kind: string;
  category: PlaceCategory;
  area: string;
  spottedBy: string;
  ago: string;
  note: string;
  /** People with verified visits who confirmed it is real and open. */
  confirmedBy: string[];
  /** Confirmations needed before it is listed (a Nearhood guide counts for all). */
  needed: number;
  glyph: GlyphName;
  tone: Tone;
  photo?: string;
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
  sources: SourceId[];
  confirmed: boolean;
  distanceKm: number;
  tags: Array<'couples' | 'kids' | 'free' | 'outdoor' | 'indoor' | 'solo' | 'friends' | 'family'>;
  description: string;
  organiser: string;
  tone: Tone;
  glyph: GlyphName;
  unconfirmedNote?: string;
  /** Where to read more or get tickets. Nearhood never books or sells. */
  link?: { label: string; url: string };
  /** Who posted it: a page (the venue), a club, or a person sharing it. */
  host?: { kind: 'page' | 'club' | 'person'; id: string };
  /** The venue's page, when it has one. */
  venueId?: string;
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

export type AlertKind = 'traffic' | 'weather' | 'water' | 'power' | 'safety' | 'health' | 'civic';
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

export type ClubKind = 'neighbours' | 'founders' | 'sports' | 'parents' | 'food' | 'outdoors' | 'books';

/** A small get-together a member posts in a club. No tickets, no payments: just who's in. */
export interface Meetup {
  id: string;
  title: string;
  when: string;
  where: string;
  hostId: string;
  /** People who said they're in. */
  going: string[];
  spots?: number;
  note?: string;
  /** Replies in the club thread about it. */
  replies?: number;
}

/**
 * "Let's buy together": a member gathers people for a better price. Nearhood only
 * connects people; the money and the deal happen outside the app.
 */
export interface GroupBuy {
  id: string;
  title: string;
  hostId: string;
  note: string;
  /** People needed for the better price. */
  target: number;
  joined: string[];
  ends: string;
  /** Replies in the club thread about it. */
  replies?: number;
}

/** A club or group: neighbours, founders, cricket lovers, parents… created and run by people. */
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
  kind: ClubKind;
  /** Neighbourhood it meets around, for the clubs map. */
  areaId: string;
  meetups?: Meetup[];
  buys?: GroupBuy[];
}

export type NotificationKind = 'reply' | 'mention' | 'alert' | 'event' | 'report' | 'group' | 'system' | 'follow' | 'friend';

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
  water: Array<{ ward: string; slot: string; status: 'on-schedule' | 'delayed' | 'low-pressure' | 'no-supply'; note?: string }>;
  power: Array<{ area: string; window: string; reason: string; status: 'scheduled' | 'outage' | 'restored' }>;
  civic: { ward: string; resolvedPct: number; open: number; avgDays: number; resolvedThisWeek: number };
  parking: Array<{ id: string; name: string; area: string; free: number; total: number }>;
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

/* ---------- Friends, check-ins and community reviews ---------- */

/** A one-tap verdict instead of stars: harder to game, faster to give. */
export type Verdict = 'must' | 'good' | 'skip';
export type CheckInKind = 'ate' | 'did';

/** A quick "what I had / what I did" post. Check-ins are the community reviews. */
export interface CheckIn {
  id: string;
  authorId: string;
  kind: CheckInKind;
  placeId?: string;
  eventId?: string;
  /** Display name; also used when the place is not in the directory yet. */
  placeName: string;
  area: string;
  items: string[];
  verdict: Verdict;
  note?: string;
  /** Approximate spend per person in rupees. */
  spend?: number;
  tags: string[];
  withIds?: string[];
  audience: 'friends' | 'everyone';
  /** Confirmed by location at the venue or a bill photo. */
  verifiedVisit: boolean;
  /** Free or invited visits are labelled and left out of the score. */
  invited?: boolean;
  ago: string;
  /** 0 today · 1 this week · 2 earlier */
  recency: 0 | 1 | 2;
  /** Set when the check-in is in another city; friends see it there, city lists don't. */
  city?: string;
  likes: number;
  comments: Array<{ id: string; authorId: string; text: string; ago: string }>;
}

/** An entry on someone's "Want to try" list (their to-do list for the city). */
export interface WantItem {
  id: string;
  kind: 'place' | 'event' | 'dish' | 'activity';
  refId?: string;
  title: string;
  sub?: string;
  note?: string;
  done?: boolean;
  doneAgo?: string;
  /** Who recommended it. */
  fromId?: string;
}

/** A curated list someone made, e.g. "Cafés I can work from". */
export interface Collection {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  placeIds: string[];
  notes?: Record<string, string>;
  followers: number;
  tone: Tone;
  glyph: GlyphName;
}

export interface ProfileInfo {
  handle: string;
  bio: string;
  followers: number;
  following: number;
  checkIns: number;
  places: number;
  since: string;
  tasteTags: string[];
  followsMe: boolean;
  wantToTry: WantItem[];
  collections: string[];
}

/** Aggregated community verdicts for a place. */
export interface CommunityBase {
  must: number;
  good: number;
  skip: number;
  verifiedPct: number;
  items: Array<{ name: string; count: number; mustPct: number }>;
}
