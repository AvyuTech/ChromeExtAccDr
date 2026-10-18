import sources from './sources.json';

/*
  Photo library. Files are named <kind>-<id>.webp; every file's source and
  licence is in sources.json and listed in Settings › About › Photo credits.
*/

const files = import.meta.glob('./*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

const BY_KEY: Record<string, string> = {};
for (const [path, url] of Object.entries(files)) BY_KEY[path.slice(2, -5)] = url;

export function photo(key: string): string | undefined {
  return BY_KEY[key];
}

export const personPhoto = (id: string) => BY_KEY[`person-${id}`];

const PLACE_FALLBACK: Record<string, string> = { 'riverfront-park': 'scene-promenade' };
export const placePhoto = (id: string) => BY_KEY[`place-${id}`] ?? BY_KEY[PLACE_FALLBACK[id] ?? ''];

export const eventPhoto = (id: string) => BY_KEY[`event-${id}`];

export const scenePhoto = (id: 'friends' | 'sunset-friends' | 'table' | 'concert' | 'promenade' | 'lake') => BY_KEY[`scene-${id}`];

/** Dishes and activities with their own photo; others fall back to the place. */
const ITEM_PHOTO: Record<string, string> = {
  'Cold brew': 'dish-cold-brew',
  'Fried egg toast': 'dish-egg-toast',
  'Avocado toast': 'dish-avocado-toast',
  'Hazelnut latte': 'dish-iced-latte',
  Cappuccino: 'dish-latte-art',
  'Filter coffee': 'dish-latte-art',
  'Pour-over': 'place-brew-lab',
  'Spicy ramen': 'dish-spicy-ramen',
  Bibimbap: 'dish-bibimbap',
  Dosa: 'dish-dosa',
  'Pav bhaji': 'dish-pav-bhaji',
  'Street snacks': 'dish-samosa',
  'Street food': 'dish-samosa',
  'Gujarati thali': 'place-spice-courtyard',
  'Kadhi-khichdi': 'dish-curry',
  'Sunrise yoga': 'event-sunrise-yoga',
  'Wheel class': 'place-clay-studio',
  'Beginner session': 'event-pickleball-social',
  'Textile shopping': 'place-law-garden',
  'Morning visit': 'place-adalaj',
  'Trail walk': 'place-polo-forest',
  'Kite-making': 'event-kite-workshop',
};

export function itemPhoto(item: string | undefined, placeId?: string, eventId?: string): string | undefined {
  const own = item ? BY_KEY[ITEM_PHOTO[item] ?? ''] : undefined;
  return own ?? (placeId ? placePhoto(placeId) : undefined) ?? (eventId ? eventPhoto(eventId) : undefined);
}

/** A dish or activity's own photo only (no place fallback), for galleries. */
export const ownItemPhoto = (item: string) => BY_KEY[ITEM_PHOTO[item] ?? ''];

const GROUP_PHOTO: Record<string, string> = {
  'bodakdev-neighbours': 'scene-friends',
  'amdavad-foodies': 'scene-table',
  'west-commuters': 'scene-promenade',
  'parents-thaltej': 'event-kite-workshop',
  'green-amdavad': 'scene-lake',
  'pickleball-ahd': 'event-pickleball-social',
};
export const groupPhoto = (id: string) => BY_KEY[GROUP_PHOTO[id] ?? ''];

/** Deals use their venue's photo when they have one. */
export const dealPhoto = (deal: { placeId?: string }) => (deal.placeId ? placePhoto(deal.placeId) : undefined);

const CATEGORY_PHOTO: Record<string, string> = {
  food: 'scene-table',
  events: 'scene-concert',
  getaways: 'place-polo-forest',
  places: 'place-vastrapur-lake',
};
export const categoryPhoto = (id: string) => BY_KEY[CATEGORY_PHOTO[id] ?? ''];

export interface PhotoSource {
  source: string;
  url: string;
  license: string;
  licenseUrl?: string;
  credit: string;
}

export const PHOTO_SOURCES = sources as Record<string, PhotoSource>;
