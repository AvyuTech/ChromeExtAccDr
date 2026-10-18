import { person } from '../data/core';
import { collectionById } from '../data/friends';
import { SPOTTED } from '../data/places';
import type { Place, SpottedPlace } from '../data/types';
import type { AppData } from '../state/appData';

const firstName = (id: string) => person(id).name.split(' ')[0];

/** Who put a place on Nearhood and who stands behind it, in plain words. */
export function placeOrigin(place: Place) {
  const o = place.origin;
  const list = o.viaList ? collectionById(o.viaList) : undefined;
  return {
    added: `Added by ${person(o.addedBy).name}${list ? ` in “${list.title}”` : ''} · ${o.addedWhen}`,
    confirmed: `Confirmed by ${o.confirmedBy} locals with verified visits`,
    guide: o.guide ? `Checked by ${firstName(o.guide)}, a neighbourhood guide` : undefined,
    claim: o.publicPlace ? 'Public place · belongs to everyone' : o.claimed ? `Claimed by ${o.claimed.name}, ${o.claimed.role.toLowerCase()} · since ${o.claimed.since}` : 'Not claimed yet',
    claimable: !o.publicPlace && !o.claimed,
    away: !!o.outsideCity,
  };
}

/** New openings: the sample ones plus any this person added, with their confirmation counted. */
export function spottedPlaces(data: AppData): Array<SpottedPlace & { count: number; mine: boolean; confirmedByMe: boolean }> {
  return [...data.mySpots, ...SPOTTED].map((s) => {
    const confirmedByMe = data.confirmedSpots.includes(s.id);
    const mine = data.mySpots.some((m) => m.id === s.id);
    return { ...s, count: Math.min(s.needed, s.confirmedBy.length + (confirmedByMe && !s.confirmedBy.includes('me') ? 1 : 0)), mine, confirmedByMe };
  });
}
