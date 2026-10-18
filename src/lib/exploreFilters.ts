import type { PlaceCategory } from '../data/types';

/** One row of filters shared by Explore and the full map. */
export type Filter = 'all' | 'cafes' | 'food' | 'sports' | 'outdoors' | 'culture' | 'shopping' | 'trips';

export const FILTERS: Array<{ id: Filter; label: string; cats?: PlaceCategory[] }> = [
  { id: 'all', label: 'All' },
  { id: 'cafes', label: 'Cafés', cats: ['cafe'] },
  { id: 'food', label: 'Food', cats: ['food'] },
  { id: 'sports', label: 'Sports', cats: ['sports'] },
  { id: 'outdoors', label: 'Outdoors', cats: ['nature'] },
  { id: 'culture', label: 'Culture', cats: ['culture', 'heritage'] },
  { id: 'shopping', label: 'Shopping', cats: ['shopping'] },
  { id: 'trips', label: 'Day trips' },
];

export const RADII = [1, 2, 3, 5, 10, 20];

/** Day trips only show under their own filter; everything else is in the city. */
export function matches(filter: Filter, category: PlaceCategory, outsideCity: boolean) {
  if (filter === 'trips') return outsideCity;
  if (outsideCity) return false;
  const cats = FILTERS.find((f) => f.id === filter)?.cats;
  return !cats || cats.includes(category);
}
