import { person } from '../data/core';
import { placeById } from '../data/places';
import { groupById } from '../data/social';
import type { CityEvent } from '../data/types';

/**
 * Everything on Nearhood belongs to one of three things: a person's profile,
 * a page (a place) or a club. Events are posts by one of them.
 */
export interface Host {
  kind: 'person' | 'page' | 'club';
  id: string;
  name: string;
  /** Where tapping the host goes. */
  to: string;
  /** "Brand strategist", "Pickleball courts · Thaltej", "Club · 1.2k members". */
  sub: string;
}

export function eventHost(e: CityEvent): Host | undefined {
  const h = e.host;
  if (!h) return undefined;
  if (h.kind === 'page') {
    const place = placeById(h.id);
    return place ? { kind: 'page', id: place.id, name: place.name, to: `/place/${place.id}`, sub: `${place.kind} · ${place.area}` } : undefined;
  }
  if (h.kind === 'club') {
    const club = groupById(h.id);
    return club ? { kind: 'club', id: club.id, name: club.name, to: `/clubs/${club.id}`, sub: `Club · ${club.area}` } : undefined;
  }
  const who = person(h.id);
  return { kind: 'person', id: h.id, name: who.name, to: h.id === 'me' ? '/me' : `/people/${h.id}`, sub: who.area };
}

/** The page for an event's venue, when the venue has one. */
export function venuePage(e: CityEvent) {
  const id = e.venueId ?? (e.host?.kind === 'page' ? e.host.id : undefined);
  return id ? placeById(id) : undefined;
}
