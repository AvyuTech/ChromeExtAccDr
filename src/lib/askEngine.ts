import { ALERTS, EMERGENCY, FACILITIES, REPORTS, SERVICES } from '../data/city';
import { EVENTS } from '../data/events';
import { PLACES } from '../data/places';
import { CHECKINS } from '../data/friends';
import { PEOPLE } from '../data/core';
import { DEALS, GROUPS, POSTS } from '../data/social';
import type { CityEvent, CityPulse, Place, SourceId } from '../data/types';
import { aqiBand, TRAFFIC_LABEL } from '../icons/live';
import { price, rupees } from './format';

/*
  The on-device "Nearhood answer" engine.
  It reads intent and modifiers from a question, pulls matching items from
  every source the person allows, and writes a short merged answer that says
  where it came from. The interface is deliberately the same shape a
  server-side model would return, so a hosted answer service can replace
  `ask()` without touching the UI.
*/

export type Intent =
  | 'events'
  | 'cafe'
  | 'food'
  | 'places'
  | 'traffic'
  | 'weather'
  | 'air'
  | 'transit'
  | 'water'
  | 'power'
  | 'civic'
  | 'deals'
  | 'groups'
  | 'safety'
  | 'services'
  | 'friends'
  | 'general';

export type ResultRef =
  | { type: 'event'; id: string }
  | { type: 'place'; id: string }
  | { type: 'deal'; id: string }
  | { type: 'alert'; id: string }
  | { type: 'corridor'; id: string }
  | { type: 'arrival'; id: string }
  | { type: 'group'; id: string }
  | { type: 'service'; id: string }
  | { type: 'emergency'; id: string }
  | { type: 'facility'; id: string }
  | { type: 'report'; id: string }
  | { type: 'post'; id: string }
  | { type: 'checkin'; id: string };

export interface FollowUp {
  label: string;
  query: string;
}

export interface AskOptions {
  sourceAllowed: (id: SourceId) => boolean;
  showUnconfirmed: boolean;
  minAgreement: number;
  length: 'brief' | 'balanced' | 'detailed';
  pulse: CityPulse;
  homeArea?: string;
  /** People this person follows; enables "what are my friends eating" and friends' verdicts. */
  following?: string[];
}

export interface AskResult {
  query: string;
  intent: Intent;
  heading: string;
  answer: string;
  sources: SourceId[];
  results: ResultRef[];
  followUps: FollowUp[];
  /** Filter chips that make sense for this intent. */
  filters: string[];
  confidence: 'high' | 'medium' | 'low';
}

interface Modifiers {
  free: boolean;
  kids: boolean;
  couples: boolean;
  weekend: boolean;
  today: boolean;
  near: boolean;
  outdoor: boolean;
  indoor: boolean;
  cheap: boolean;
  openNow: boolean;
}

const has = (q: string, words: string[]) => words.some((w) => new RegExp(`\\b${w}`, 'i').test(q));

export function detectIntent(q: string): Intent {
  if (has(q, ['friend', 'friends', 'people i follow'])) return 'friends';
  if (has(q, ['emergenc', 'hospital', 'ambulance', 'police', 'sos', 'fire brigade', 'helpline', 'unsafe', 'safe'])) return 'safety';
  if (has(q, ['traffic', 'commute', 'road', 'highway', 'jam', 'signal', 'drive'])) return 'traffic';
  if (has(q, ['metro', 'brts', 'bus', 'train', 'transit', 'station'])) return 'transit';
  if (has(q, ['aqi', 'air', 'pollution', 'smog', 'pm2'])) return 'air';
  if (has(q, ['weather', 'rain', 'hot', 'temperature', 'forecast', 'sunny', 'umbrella', 'heat'])) return 'weather';
  if (has(q, ['water', 'supply', 'tanker', 'pressure'])) return 'water';
  if (has(q, ['power', 'electricity', 'outage', 'light cut', 'power cut', 'load shedding'])) return 'power';
  if (has(q, ['pothole', 'garbage', 'complaint', 'streetlight', 'drain', 'report', 'cattle', 'civic'])) return 'civic';
  if (has(q, ['bill', 'tax', 'certificate', 'licen', 'pay ', 'service', 'book a hall'])) return 'services';
  if (has(q, ['deal', 'offer', 'discount', 'coupon', 'sale'])) return 'deals';
  if (has(q, ['group', 'community', 'club', 'meet people'])) return 'groups';
  if (has(q, ['café', 'cafe', 'coffee', 'wifi', 'wi-fi', 'work from', 'brunch', 'laptop'])) return 'cafe';
  if (has(q, ['food', 'eat', 'restaurant', 'dinner', 'lunch', 'korean', 'thali', 'street food', 'hungry'])) return 'food';
  if (has(q, ['weekend', 'happening', 'event', 'things to do', 'tonight', 'concert', 'show', 'gig', 'market', 'workshop', 'what to do', 'plans'])) return 'events';
  if (has(q, ['place', 'park', 'lake', 'walk', 'visit', 'getaway', 'trip', 'heritage', 'shopping'])) return 'places';
  return 'general';
}

function modifiers(q: string): Modifiers {
  return {
    free: has(q, ['free', 'no cost', 'without paying']),
    kids: has(q, ['kid', 'child', 'family', 'families']),
    couples: has(q, ['couple', 'date', 'romantic', 'partner']),
    weekend: has(q, ['weekend', 'saturday', 'sunday', 'sat', 'sun']),
    today: has(q, ['today', 'tonight', 'now']),
    near: has(q, ['near', 'nearby', 'walking', 'close by', 'around me', 'within']),
    outdoor: has(q, ['outdoor', 'outside', 'open air']),
    indoor: has(q, ['indoor', 'inside']),
    cheap: has(q, ['cheap', 'budget', 'affordable', 'under']),
    openNow: has(q, ['open now', 'right now', 'open late']),
  };
}

/** Lower-case only the first letter, so names like "SG Highway" or "Blue Line" survive mid-sentence. */
function lowerFirst(text: string) {
  return /^[A-Z][a-z]/.test(text) ? text[0].toLowerCase() + text.slice(1) : text;
}

function short(title: string) {
  return title.replace(/ by the riverfront$/i, '').replace(/^Sunday /, 'Sunday ');
}

function finish(text: string[], length: AskOptions['length']) {
  if (length === 'brief') return text[0];
  if (length === 'balanced') return text.slice(0, 2).join(' ');
  return text.join(' ');
}

function uniq<T>(xs: T[]) {
  return Array.from(new Set(xs));
}

function allowedEvent(e: CityEvent, o: AskOptions) {
  if (!e.confirmed && !o.showUnconfirmed) return false;
  const visible = e.sources.filter(o.sourceAllowed);
  if (visible.length === 0) return false;
  return e.confirmed ? visible.length >= Math.min(o.minAgreement, e.sources.length) : true;
}

function allowedPlace(p: Place, o: AskOptions) {
  const visible = p.sources.filter(o.sourceAllowed);
  return visible.length > 0 && visible.length >= Math.min(o.minAgreement, p.sources.length);
}

function confidenceFrom(sourceCount: number): AskResult['confidence'] {
  return sourceCount >= 3 ? 'high' : sourceCount === 2 ? 'medium' : 'low';
}

export function ask(query: string, o: AskOptions): AskResult {
  const q = query.trim();
  const intent = detectIntent(q);
  const m = modifiers(q);
  const base = { query: q, intent, filters: [] as string[] };

  switch (intent) {
    case 'events': {
      let events = EVENTS.filter((e) => allowedEvent(e, o));
      if (m.free) events = events.filter((e) => e.price === 0);
      if (m.kids) events = events.filter((e) => e.tags.includes('kids') || e.tags.includes('family'));
      if (m.couples) events = events.filter((e) => e.tags.includes('couples'));
      if (m.outdoor) events = events.filter((e) => e.tags.includes('outdoor'));
      if (m.indoor) events = events.filter((e) => e.tags.includes('indoor'));
      if (m.today) events = events.filter((e) => e.day === 'Today');
      else if (m.weekend) events = events.filter((e) => ['Sat', 'Sun', 'Sat–Sun'].includes(e.day));
      if (m.near) events = events.filter((e) => e.distanceKm <= 5);
      events.sort((a, b) => Number(b.confirmed) - Number(a.confirmed) || b.going - a.going);
      const sources = uniq(events.flatMap((e) => e.sources)).filter(o.sourceAllowed);
      if (events.length === 0) {
        return {
          ...base,
          heading: 'Nothing matched',
          answer: 'I could not find events that match all of that. Try removing a filter, or check again later: new listings arrive through the day.',
          sources: [],
          results: [],
          followUps: [{ label: 'Everything this weekend', query: "What's happening this weekend?" }],
          filters: ['All', 'Events', 'Food', 'Free', 'Within 5 km'],
          confidence: 'low',
        };
      }
      const top = events[0];
      const freeOne = events.find((e) => e.price === 0 && e.id !== top.id);
      const when = m.today ? 'today' : 'this weekend';
      const lead = m.free
        ? `There are **${events.length} free things** happening near you ${when}.`
        : m.kids
          ? `I found **${events.length} kid-friendly plans** near you ${when}.`
          : m.couples
            ? `Here are **${events.length} good plans for two** ${when}.`
            : `There are **${events.length} things happening** near you ${when}.`;
      const dayName = top.day === 'Sat–Sun' ? 'Saturday and Sunday' : top.day === 'Sat' ? 'Saturday' : top.day === 'Sun' ? 'Sunday' : top.day.toLowerCase();
      const second = `The biggest is the **${short(top.title)}**${top.title.includes(dayName) ? '' : ` on ${dayName}`}.`;
      const third = freeOne && !m.free ? `For something free, the **${freeOne.title.replace(/^Sunday /, 'Sunday ').replace(/^(?!Sunday )./, (c) => c.toLowerCase())}** is the local favourite.` : '';
      const unconfirmed = events.some((e) => !e.confirmed) ? 'Listings seen in only one place are marked unconfirmed.' : '';
      return {
        ...base,
        heading: 'Most locals going',
        answer: finish([lead, [second, third].filter(Boolean).join(' '), unconfirmed].filter(Boolean), o.length),
        sources,
        results: events.map((e) => ({ type: 'event', id: e.id })),
        followUps: [
          { label: 'Only free ones', query: 'Free things to do this weekend' },
          { label: 'Good for couples', query: 'Weekend plans for couples' },
          { label: 'Kid-friendly', query: 'Kid-friendly events this weekend' },
        ].filter((f) => !(m.free && f.label === 'Only free ones') && !(m.couples && f.label === 'Good for couples') && !(m.kids && f.label === 'Kid-friendly')),
        filters: ['All', 'Events', 'Food', 'Free', 'Within 5 km'],
        confidence: confidenceFrom(top.sources.length),
      };
    }

    case 'cafe':
    case 'food':
    case 'places': {
      const wantCategory = intent === 'cafe' ? ['cafe'] : intent === 'food' ? ['food'] : ['nature', 'heritage', 'shopping', 'culture', 'sports'];
      let places = PLACES.filter((p) => wantCategory.includes(p.category) && allowedPlace(p, o));
      if (has(q, ['korean', 'ramen'])) places = PLACES.filter((p) => p.id === 'seoul-bowl');
      if (has(q, ['thali', 'gujarati'])) places = PLACES.filter((p) => p.id === 'spice-courtyard');
      if (has(q, ['street food', 'late'])) places = PLACES.filter((p) => p.id === 'manek-chowk' || p.id === 'law-garden');
      if (has(q, ['getaway', 'trip', 'day out'])) places = PLACES.filter((p) => p.tags.includes('getaway'));
      if (has(q, ['wifi', 'wi-fi', 'work', 'laptop'])) places = places.filter((p) => p.tags.includes('wifi') || p.tags.includes('work-friendly'));
      if (m.kids) places = places.filter((p) => p.tags.includes('kids') || p.tags.includes('family'));
      if (m.couples) places = places.filter((p) => p.tags.includes('couples'));
      if (m.free || m.cheap) places = places.filter((p) => p.price <= 2);
      if (m.openNow) places = places.filter((p) => p.openNow);
      if (m.near) places = places.filter((p) => p.distanceKm <= 5);
      places.sort((a, b) => b.rating - a.rating);
      const sources = uniq(places.flatMap((p) => p.sources)).filter(o.sourceAllowed);
      if (places.length === 0) {
        return {
          ...base,
          heading: 'Nothing matched',
          answer: 'No places matched all of that yet. Try a wider area or fewer conditions.',
          sources: [],
          results: [],
          followUps: [{ label: 'Popular near me', query: 'Best places to eat near me' }],
          confidence: 'low',
        };
      }
      const named = places.slice(0, 3).map((p) => `**${p.name}** (${(p.bestTime ? `best ${p.bestTime.toLowerCase()}` : (p.highlights[0] ? lowerFirst(p.highlights[0]) : undefined)) ?? p.kind})`);
      const list = named.length > 1 ? `${named.slice(0, -1).join(', ')} and ${named[named.length - 1]}` : named[0];
      const lead = places.length === 1 ? `Locals recommend ${list}.` : `Locals mention ${list}.`;
      const watch = places[0].watchOuts[0] ? `Heads-up for ${places[0].name}: ${lowerFirst(places[0].watchOuts[0])}.` : '';
      const friendSays = CHECKINS.find((c) => c.placeId === places[0].id && c.verdict === 'must' && o.following?.includes(c.authorId));
      const friendLine = friendSays ? `Your friend ${PEOPLE[friendSays.authorId]?.name.split(' ')[0]} says **must try** (${friendSays.items.join(', ').toLowerCase()}).` : '';
      return {
        ...base,
        heading: intent === 'places' ? 'Places locals love' : 'What locals recommend',
        answer: finish([lead, friendLine || places[0].summary, watch].filter(Boolean), o.length),
        sources,
        results: places.map((p) => ({ type: 'place', id: p.id })),
        followUps:
          intent === 'cafe'
            ? [
                { label: 'Open right now', query: 'Cafés open right now' },
                { label: 'Good for a date', query: 'Café for a date' },
                { label: 'Near me', query: 'Cafés near me with wifi' },
              ]
            : [
                { label: 'Cheap eats', query: 'Cheap food near me' },
                { label: 'Late night', query: 'Late night street food' },
                { label: 'Family dinner', query: 'Family dinner thali' },
              ],
        filters: ['All', 'Open now', 'Within 5 km', '₹₹ or less'],
        confidence: confidenceFrom(places[0].sources.length),
      };
    }

    case 'traffic': {
      const roads = [...o.pulse.corridors].sort((a, b) => b.level - a.level || b.minutes / b.usual - a.minutes / a.usual);
      const worst = roads[0];
      const clear = roads.filter((r) => r.level === 0).map((r) => `**${r.name}**`);
      const alerts = ALERTS.filter((a) => a.kind === 'traffic' && a.active);
      const lead =
        worst.level === 0
          ? 'Roads are **moving freely** across the west of the city right now.'
          : `**${worst.name}** is the slowest right now: **${worst.minutes} min** from ${worst.stretch.replace(' → ', ' to ')} (usually ${worst.usual}).`;
      const cause = worst.cause ? `Cause: ${lowerFirst(worst.cause)}.` : '';
      const ok = clear.length ? `${clear.join(' and ')} ${clear.length > 1 ? 'are' : 'is'} clear.` : '';
      return {
        ...base,
        heading: 'Roads right now',
        answer: finish([[lead, cause].filter(Boolean).join(' '), ok, alerts.length ? `Planned: ${lowerFirst(alerts[0].title)}.` : ''].filter(Boolean), o.length),
        sources: ['police', 'maps', 'neighbours'].filter((s) => o.sourceAllowed(s as SourceId)) as SourceId[],
        results: [...roads.map((r) => ({ type: 'corridor' as const, id: r.id })), ...alerts.map((a) => ({ type: 'alert' as const, id: a.id }))],
        followUps: [
          { label: 'Metro instead?', query: 'Next metro from Doordarshan Kendra' },
          { label: 'Parking near CG Road', query: 'Where can I park near CG Road' },
        ],
        confidence: 'high',
      };
    }

    case 'transit': {
      const arrivals = [...o.pulse.arrivals].sort((a, b) => a.minutes - b.minutes);
      const metro = arrivals.find((a) => a.mode === 'metro');
      const brts = arrivals.find((a) => a.mode === 'brts');
      const lead = metro
        ? `Next **${metro.line}** train from **${metro.stop}** towards ${metro.towards} in **${metro.minutes} min** (${metro.walkMin} min walk).`
        : 'No metro trains are due right now.';
      const more = brts ? `${brts.line} from ${brts.stop} leaves in ${brts.minutes} min; it is ${brts.crowd.toLowerCase()} right now.` : '';
      const alert = ALERTS.find((a) => a.kind === 'transit' && a.active);
      return {
        ...base,
        heading: 'Leaving soon near you',
        answer: finish([lead, more, alert ? `Note: ${lowerFirst(alert.title)}.` : ''].filter(Boolean), o.length),
        sources: ['metro', 'neighbours'].filter((s) => o.sourceAllowed(s as SourceId)) as SourceId[],
        results: [...arrivals.map((a) => ({ type: 'arrival' as const, id: a.id })), ...(alert ? [{ type: 'alert' as const, id: alert.id }] : [])],
        followUps: [
          { label: 'Traffic on SG Highway', query: 'How is traffic on SG Highway' },
          { label: 'Metro pass deal', query: 'Metro pass deals' },
        ],
        confidence: 'high',
      };
    }

    case 'weather': {
      const w = o.pulse.weather;
      const peak = w.hourly.reduce((a, b) => (b.temp > a.temp ? b : a));
      return {
        ...base,
        heading: 'Next few hours',
        answer: finish(
          [
            `**${w.condition === 'sunny' ? 'Sunny' : w.condition === 'rain' ? 'Rainy' : 'Mostly clear'}, ${w.temp}°** right now, feels like ${w.feelsLike}°.`,
            `Warmest around **${peak.hour} (${peak.temp}°)**; pleasant after sunset at ${w.sunset}.`,
            `UV index is ${w.uv}, humidity ${w.humidity}%. No rain expected today.`,
          ],
          o.length,
        ),
        sources: ['imd'],
        results: ALERTS.filter((a) => a.kind === 'weather' && a.active).map((a) => ({ type: 'alert', id: a.id })),
        followUps: [
          { label: 'Air quality', query: 'What is the AQI today' },
          { label: 'Evening plans', query: 'Outdoor things to do this evening' },
        ],
        confidence: 'high',
      };
    }

    case 'air': {
      const a = o.pulse.aqi;
      const band = aqiBand(a.value);
      return {
        ...base,
        heading: 'Air near you',
        answer: finish([`AQI is **${a.value} (${band.label})** at ${a.station.replace(' monitoring station', '')}, mostly ${a.dominant}.`, a.advice, 'Readings refresh every hour from the official monitoring station.'], o.length),
        sources: ['cpcb'],
        results: [],
        followUps: [
          { label: 'Best time for a run', query: 'Best time for a run today' },
          { label: 'Weather', query: 'Weather today' },
        ],
        confidence: 'high',
      };
    }

    case 'water': {
      const rows = o.pulse.water;
      const home = rows.find((r) => r.ward.toLowerCase() === (o.homeArea ?? 'bodakdev').toLowerCase()) ?? rows[0];
      const status =
        home.status === 'on-schedule' ? 'on schedule' : home.status === 'low-pressure' ? 'running at low pressure' : home.status === 'delayed' ? 'delayed' : 'off';
      const alerts = ALERTS.filter((x) => x.kind === 'water' && x.active);
      return {
        ...base,
        heading: 'Water supply today',
        answer: finish([`Supply in **${home.ward}** (${home.slot}) is **${status}**${home.note ? `: ${lowerFirst(home.note)}` : ''}.`, 'The evening slot is expected to run as normal.', 'Report a leak or no supply from City › Report an issue.'], o.length),
        sources: ['amc', 'neighbours'].filter((s) => o.sourceAllowed(s as SourceId)) as SourceId[],
        results: alerts.map((x) => ({ type: 'alert', id: x.id })),
        followUps: [{ label: 'Report no water', query: 'Report a water problem' }],
        confidence: 'high',
      };
    }

    case 'power': {
      const cuts = o.pulse.power.filter((p) => p.status !== 'restored');
      return {
        ...base,
        heading: 'Power in your area',
        answer: finish(
          [
            cuts.length ? `One planned cut: **${cuts[0].area}, ${cuts[0].window}** for ${lowerFirst(cuts[0].reason)}.` : 'No planned power cuts near you.',
            'No outages reported in Bodakdev right now.',
            'Beware of fake "power will be cut tonight" messages; the utility never sends payment links by SMS.',
          ],
          o.length,
        ),
        sources: ['utility', 'neighbours'].filter((s) => o.sourceAllowed(s as SourceId)) as SourceId[],
        results: ALERTS.filter((a) => (a.kind === 'power' || a.id === 'phishing') && a.active).map((a) => ({ type: 'alert', id: a.id })),
        followUps: [{ label: 'Pay electricity bill', query: 'Pay my electricity bill' }],
        confidence: 'high',
      };
    }

    case 'civic': {
      const c = o.pulse.civic;
      return {
        ...base,
        heading: 'Open reports near you',
        answer: finish(
          [
            `Your ward resolves **${c.resolvedPct}%** of reports, in **${c.avgDays} days** on average.`,
            `${c.open} reports are open nearby; add a +1 to speed up any you also see.`,
            'Photos and a landmark help crews find the spot first time.',
          ],
          o.length,
        ),
        sources: ['amc', 'neighbours'].filter((s) => o.sourceAllowed(s as SourceId)) as SourceId[],
        results: REPORTS.map((r) => ({ type: 'report', id: r.id })),
        followUps: [{ label: 'Report a pothole', query: 'Report a pothole' }],
        confidence: 'high',
      };
    }

    case 'services': {
      const due = SERVICES.filter((s) => s.due);
      return {
        ...base,
        heading: 'City services',
        answer: finish(
          [
            due.length
              ? `You have **${due.length} bills due**: ${due.map((d) => `${d.name.toLowerCase()} (${rupees(d.amount ?? 0)}, ${d.due?.toLowerCase()})`).join(' and ')}.`
              : 'No bills due right now.',
            'Pay, apply or book from City › Services.',
          ],
          o.length,
        ),
        sources: ['amc', 'utility'],
        results: SERVICES.map((s) => ({ type: 'service', id: s.id })),
        followUps: [{ label: 'Water timings', query: 'Water supply timings today' }],
        confidence: 'high',
      };
    }

    case 'deals': {
      let deals = [...DEALS];
      if (has(q, ['food', 'eat', 'buffet', 'dinner'])) deals = deals.filter((d) => d.category === 'food');
      if (has(q, ['coffee', 'café', 'cafe'])) deals = deals.filter((d) => d.category === 'cafe');
      if (has(q, ['metro', 'transport', 'pass'])) deals = deals.filter((d) => d.category === 'transport');
      if (has(q, ['movie', 'film', 'cinema'])) deals = deals.filter((d) => d.category === 'movies');
      if (deals.length === 0) deals = [...DEALS];
      deals.sort((a, b) => b.claimedBy - a.claimedBy);
      return {
        ...base,
        heading: 'Live deals',
        answer: finish([`**${deals.length} deals** near you right now.`, `Most claimed: **${lowerFirst(deals[0].title)}** at ${deals[0].merchant} (${lowerFirst(deals[0].ends)}).`], o.length),
        sources: ['maps', 'neighbours'].filter((s) => o.sourceAllowed(s as SourceId)) as SourceId[],
        results: deals.map((d) => ({ type: 'deal', id: d.id })),
        followUps: [{ label: 'Food deals', query: 'Food deals near me' }],
        confidence: 'medium',
      };
    }

    case 'groups': {
      const words = q.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3 && !['group', 'groups', 'community', 'club', 'clubs', 'near', 'join'].includes(w));
      const busiest = [...GROUPS].sort((a, b) => b.postsToday - a.postsToday);
      const matching = busiest.filter((g) => words.some((w) => `${g.name} ${g.description}`.toLowerCase().includes(w)));
      const groups = matching.length ? [...matching, ...busiest.filter((g) => !matching.includes(g))] : busiest;
      return {
        ...base,
        heading: 'Groups near you',
        answer: finish(
          [
            matching.length
              ? `**${matching[0].name}** is the closest match, with ${matching[0].members.toLocaleString('en-IN')} members.`
              : `The busiest groups today are **${groups[0].name}** and **${groups[1].name}**.`,
            'Joining a group adds its posts to your Home feed.',
          ],
          o.length,
        ),
        sources: ['neighbours'],
        results: groups.map((g) => ({ type: 'group', id: g.id })),
        followUps: [{ label: 'Pickleball partners', query: 'Pickleball groups' }],
        confidence: 'medium',
      };
    }

    case 'safety': {
      const hospital = FACILITIES.find((f) => f.kind === 'Hospital');
      return {
        ...base,
        heading: 'Help near you',
        answer: finish(
          [
            'In an emergency call **112**: one number for police, fire and ambulance.',
            hospital ? `The nearest 24-hour hospital is **${hospital.distanceKm} km** away in ${hospital.area}. Ambulance: **108**.` : 'Ambulance: **108**.',
            'Women can call **181** for 24×7 support. Report online fraud on **1930**.',
          ],
          o.length,
        ),
        sources: ['police', 'amc'],
        results: [...EMERGENCY.slice(0, 4).map((e) => ({ type: 'emergency' as const, id: e.id })), ...FACILITIES.map((f) => ({ type: 'facility' as const, id: f.id }))],
        followUps: [{ label: 'Share my location', query: 'How do I share my live location' }],
        confidence: 'high',
      };
    }

    case 'friends': {
      const following = o.following ?? [];
      const recent = CHECKINS.filter((c) => following.includes(c.authorId) && c.recency <= 1).sort((a, b) => a.recency - b.recency);
      const musts = recent.filter((c) => c.verdict === 'must');
      if (recent.length === 0) {
        return {
          ...base,
          heading: 'Your friends',
          answer: 'Your friends haven’t checked in anywhere this week. Follow a few people to see what they eat and do.',
          sources: [],
          results: [],
          followUps: [{ label: 'Find friends', query: 'Groups near me' }],
          confidence: 'low',
        };
      }
      const name = (id: string) => PEOPLE[id]?.name.split(' ')[0] ?? 'A friend';
      const picks = musts.slice(0, 2).map((c) => `**${name(c.authorId)}** says the **${c.items[0].toLowerCase()} at ${c.placeName}** is a must try`);
      const skips = recent.filter((c) => c.verdict === 'skip');
      return {
        ...base,
        heading: 'What your friends are into',
        answer: finish(
          [
            picks.length ? `${picks.join('; ')}.` : `${recent.length} check-ins from friends this week.`,
            `${new Set(recent.map((c) => c.authorId)).size} friends checked in ${recent.length} times this week.`,
            skips.length ? `Skip: ${skips.map((c) => `${c.items[0].toLowerCase()} at ${c.placeName} (${name(c.authorId)})`).join(', ')}.` : '',
          ].filter(Boolean),
          o.length,
        ),
        sources: ['neighbours'],
        results: recent.map((c) => ({ type: 'checkin' as const, id: c.id })),
        followUps: [
          { label: 'Cafés friends love', query: 'Quiet café with good wifi' },
          { label: 'Plans this weekend', query: "What's happening this weekend?" },
        ],
        confidence: 'high',
      };
    }

    default: {
      const words = q
        .toLowerCase()
        .split(/[^a-z0-9઀-૿ऀ-ॿ]+/)
        .filter((w) => w.length > 2);
      const match = (text: string) => words.some((w) => text.toLowerCase().includes(w));
      const places = PLACES.filter((p) => allowedPlace(p, o) && match(`${p.name} ${p.kind} ${p.area} ${p.tags.join(' ')}`));
      const events = EVENTS.filter((e) => allowedEvent(e, o) && match(`${e.title} ${e.area} ${e.category} ${e.tags.join(' ')}`));
      const posts = POSTS.filter((p) => match(`${p.text} ${p.topic} ${p.area}`));
      const total = places.length + events.length + posts.length;
      if (total === 0) {
        return {
          ...base,
          heading: 'Try asking differently',
          answer: `I couldn't find anything for "${q}" yet. Try asking about events, cafés, traffic, the metro, water timings or the air.`,
          sources: [],
          results: [],
          followUps: [
            { label: 'This weekend', query: "What's happening this weekend?" },
            { label: 'Traffic now', query: 'How is traffic right now' },
            { label: 'Quiet cafés', query: 'Quiet café with good wifi' },
          ],
          confidence: 'low',
        };
      }
      return {
        ...base,
        heading: 'Matches',
        answer: `I found **${total} matches** for "${q}" across ${[places.length && 'places', events.length && 'events', posts.length && 'neighbour posts'].filter(Boolean).join(', ')}.`,
        sources: uniq([...places.flatMap((p) => p.sources), ...events.flatMap((e) => e.sources), 'neighbours' as SourceId]).filter(o.sourceAllowed),
        results: [
          ...events.map((e) => ({ type: 'event' as const, id: e.id })),
          ...places.map((p) => ({ type: 'place' as const, id: p.id })),
          ...posts.map((p) => ({ type: 'post' as const, id: p.id })),
        ],
        followUps: [{ label: 'This weekend', query: "What's happening this weekend?" }],
        confidence: 'medium',
      };
    }
  }
}

/** One-line hint used for result rows and the Explore search preview. */
export function eventLine(e: CityEvent) {
  return `${e.day}, ${e.time} · ${e.area} · ${price(e.price)}`;
}

export { TRAFFIC_LABEL };

export const SUGGESTED_QUESTIONS = [
  'What are my friends eating this week?',
  "What's happening this weekend?",
  'Quiet café with good Wi-Fi',
  'How is traffic on SG Highway?',
  'Next metro near me',
  'Is the water supply normal today?',
  'Free things to do with kids',
];
