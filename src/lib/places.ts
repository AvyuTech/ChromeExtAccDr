import { photo } from '../assets/photos';
import { person } from '../data/core';
import { OWNER_REPLIES, updatesFor, type OwnerReply, type PageEdit, type PageUpdate } from '../data/pages';
import { PLACES, SPOTTED } from '../data/places';
import type { Place, SpottedPlace } from '../data/types';
import type { AppData } from '../state/appData';

/** New openings: the sample ones plus any this person added, with their confirmation counted. */
export function spottedPlaces(data: AppData): Array<SpottedPlace & { count: number; mine: boolean; confirmedByMe: boolean }> {
  return [...data.mySpots, ...SPOTTED].map((s) => {
    const confirmedByMe = data.confirmedSpots.includes(s.id);
    const mine = data.mySpots.some((m) => m.id === s.id);
    return { ...s, count: Math.min(s.needed, s.confirmedBy.length + (confirmedByMe && !s.confirmedBy.includes('me') ? 1 : 0)), mine, confirmedByMe };
  });
}

/** A spotted page's photo: a library photo for the samples, the person's own for pages they added. */
export const spotPhoto = (s: Pick<SpottedPlace, 'photo'>) => (s.photo?.startsWith('data:') ? s.photo : s.photo ? photo(s.photo) : undefined);

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Pages, listed or still being confirmed, whose name, kind or area matches a search. */
export function pageMatches(query: string, data: AppData, limit = 5) {
  const q = norm(query);
  if (!q) return { listed: [] as Place[], spotted: [] as SpottedPlace[] };
  const hit = (text: string) => norm(text).includes(q) || q.split(' ').every((w) => norm(text).includes(w));
  return {
    listed: PLACES.filter((p) => hit(`${p.name} ${p.kind} ${p.area}`)).slice(0, limit),
    spotted: [...data.mySpots, ...SPOTTED].filter((s) => hit(`${s.name} ${s.kind} ${s.area}`)).slice(0, limit),
  };
}

/* ---------- Pages people run ---------- */

/** True when this person runs the page (claimed and approved). */
export const runsPage = (place: Place, personId = 'me') => place.origin.claimed?.personId === personId;

/** Pages a person runs, for "Pages you run" and the disclosure on their profile. */
export const pagesRunBy = (personId: string) => PLACES.filter((p) => runsPage(p, personId));

/** The page as people see it: the owner's fixes to hours and address on top of what locals added. */
export function withOwnerEdits(place: Place, edit?: PageEdit): Place {
  if (!edit) return place;
  return { ...place, hours: edit.hours ?? place.hours, address: edit.address ?? place.address };
}

/** Updates on a page: the ones posted from this device first, then the sample ones. */
export function pageUpdates(place: Place, data: AppData): PageUpdate[] {
  return [...data.myPageUpdates.filter((u) => u.placeId === place.id), ...(place.origin.claimed ? updatesFor(place.id) : [])];
}

/** Updates the owner posted in the last 7 days, against the weekly limit. */
export function updatesThisWeek(place: Place, data: AppData) {
  const recent = (ago: string) => /^(now|today|just now|\d+\s?(m|h|min|hours?)|[1-6]\s?d(ays?)?)$/i.test(ago.trim());
  return pageUpdates(place, data).filter((u) => u.byId === 'me' && recent(u.ago)).length;
}

/** The owner's one public reply to a check-in, from this device or the sample replies. */
export function ownerReplyFor(checkInId: string, placeId: string | undefined, data: AppData): OwnerReply | undefined {
  const mine = data.pageReplies[checkInId];
  if (mine && placeId) return { placeId, by: 'Jay Mehta, owner', byId: 'me', text: mine, ago: 'Today' };
  return OWNER_REPLIES[checkInId];
}

/**
 * Everything that happened to a page, oldest first: who added it, who confirmed it,
 * who checked it, who claimed it and every fact the owner changed. Anyone can read it.
 */
export function pageHistory(place: Place, edit?: PageEdit): Array<{ when: string; what: string; who?: string; kind: 'added' | 'confirmed' | 'guide' | 'claimed' | 'owner' | 'public' }> {
  const o = place.origin;
  const out: Array<{ when: string; what: string; who?: string; kind: 'added' | 'confirmed' | 'guide' | 'claimed' | 'owner' | 'public' }> = [
    { when: o.addedWhen, what: `Added by ${person(o.addedBy).name}`, who: o.addedBy, kind: 'added' },
    { when: 'Since then', what: `Confirmed by ${o.confirmedBy} locals with verified visits`, kind: 'confirmed' },
  ];
  if (o.guide) out.push({ when: o.addedWhen, what: `Checked by ${person(o.guide).name}, a Nearhood guide`, who: o.guide, kind: 'guide' });
  if (o.publicPlace) out.push({ when: 'Always', what: 'Public place: can’t be claimed; locals and guides keep it right', kind: 'public' });
  if (o.claimed)
    out.push({
      when: o.claimed.since,
      what: `Claimed by ${o.claimed.name} as ${o.claimed.role.toLowerCase()}, after a licence check and a call to the venue`,
      who: o.claimed.personId,
      kind: 'claimed',
    });
  for (const entry of [...(edit?.log ?? [])].reverse()) out.push({ when: entry.when, what: `Owner changed ${entry.what}`, who: o.claimed?.personId, kind: 'owner' });
  return out;
}
