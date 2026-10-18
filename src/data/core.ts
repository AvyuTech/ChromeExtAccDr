import type { Neighbourhood, Person, Source, SourceId } from './types';

export const SOURCES: Record<SourceId, Source> = {
  tickets: { id: 'tickets', label: 'Ticketing sites', kind: 'platform' },
  instagram: { id: 'instagram', label: 'Instagram', kind: 'social' },
  maps: { id: 'maps', label: 'Google Maps', kind: 'platform' },
  news: { id: 'news', label: 'Local news', kind: 'platform' },
  neighbours: { id: 'neighbours', label: 'Neighbours', kind: 'community' },
  police: { id: 'police', label: 'Traffic police', kind: 'official' },
  cyber: { id: 'cyber', label: 'Police cyber cell', kind: 'official' },
  amc: { id: 'amc', label: 'Municipal corporation', kind: 'official' },
  utility: { id: 'utility', label: 'Power utility', kind: 'official' },
  imd: { id: 'imd', label: 'Weather department', kind: 'official' },
  cpcb: { id: 'cpcb', label: 'Air quality board', kind: 'official' },
};

/** Sources a person can switch off in Settings › Sources & AI. Official feeds always stay on. */
export const TOGGLEABLE_SOURCES: SourceId[] = ['tickets', 'instagram', 'maps', 'news', 'neighbours'];

export const CITIES = ['Ahmedabad', 'Gandhinagar', 'Vadodara', 'Surat'] as const;
export type CityName = (typeof CITIES)[number];

export const NEIGHBOURHOODS: Neighbourhood[] = [
  { id: 'bodakdev', name: 'Bodakdev', zone: 'West', ward: 'Bodakdev' },
  { id: 'prahlad-nagar', name: 'Prahlad Nagar', zone: 'West', ward: 'Jodhpur' },
  { id: 'thaltej', name: 'Thaltej', zone: 'West', ward: 'Thaltej' },
  { id: 'satellite', name: 'Satellite', zone: 'West', ward: 'Jodhpur' },
  { id: 'vastrapur', name: 'Vastrapur', zone: 'West', ward: 'Vejalpur' },
  { id: 'navrangpura', name: 'Navrangpura', zone: 'Central', ward: 'Navrangpura' },
  { id: 'sg-highway', name: 'SG Highway', zone: 'West', ward: 'Bodakdev' },
  { id: 'paldi', name: 'Paldi', zone: 'Central', ward: 'Paldi' },
  { id: 'maninagar', name: 'Maninagar', zone: 'South', ward: 'Maninagar' },
  { id: 'chandkheda', name: 'Chandkheda', zone: 'North', ward: 'Chandkheda' },
  { id: 'old-city', name: 'Old city', zone: 'Central', ward: 'Khadia' },
  { id: 'vastral', name: 'Vastral', zone: 'East', ward: 'Vastral' },
];

export function neighbourhoodName(id: string) {
  return NEIGHBOURHOODS.find((n) => n.id === id)?.name ?? id;
}

export const ME_ID = 'me';

export const PEOPLE: Record<string, Person> = {
  me: { id: 'me', name: 'Jay Mehta', initials: 'J', area: 'Bodakdev', tone: 'violet', badge: 'Nearhood guide' },
  riya: { id: 'riya', name: 'Riya S.', initials: 'R', area: 'Prahlad Nagar', tone: 'peach' },
  karan: { id: 'karan', name: 'Karan M.', initials: 'K', area: 'Thaltej', tone: 'green' },
  aditi: { id: 'aditi', name: 'Aditi', initials: 'A', area: 'Bodakdev', tone: 'violet', verified: true, badge: 'Top replier' },
  nikhil: { id: 'nikhil', name: 'Nikhil P.', initials: 'N', area: 'Satellite', tone: 'blue' },
  farah: { id: 'farah', name: 'Farah K.', initials: 'F', area: 'Vastrapur', tone: 'teal', verified: true },
  meera: { id: 'meera', name: 'Meera D.', initials: 'M', area: 'Navrangpura', tone: 'amber' },
  harsh: { id: 'harsh', name: 'Harsh V.', initials: 'H', area: 'Bodakdev', tone: 'clay' },
  sana: { id: 'sana', name: 'Sana Q.', initials: 'S', area: 'Thaltej', tone: 'mint' },
  dev: { id: 'dev', name: 'Dev A.', initials: 'D', area: 'Paldi', tone: 'yellow' },
  kavya: { id: 'kavya', name: 'Kavya R.', initials: 'K', area: 'Satellite', tone: 'teal' },
  arjun: { id: 'arjun', name: 'Arjun T.', initials: 'A', area: 'Navrangpura', tone: 'blue' },
  zoya: { id: 'zoya', name: 'Zoya H.', initials: 'Z', area: 'Vastrapur', tone: 'peach', verified: true, badge: 'Food explorer' },
  priyank: { id: 'priyank', name: 'Priyank S.', initials: 'P', area: 'Prahlad Nagar', tone: 'green' },
  ward: { id: 'ward', name: 'Bodakdev ward desk', initials: 'W', area: 'Bodakdev', tone: 'blue', verified: true, badge: 'Official' },
};

export function person(id: string): Person {
  return PEOPLE[id] ?? { id, name: 'Neighbour', initials: 'N', area: '', tone: 'violet' };
}
