/**
 * Helpful points: earned only when other verified people say something you did
 * helped them. Posting, checking in or replying earns nothing on its own, so the
 * only way up is being useful. Levels need points and the identity checks that
 * make a high level trustworthy; rankings run in monthly seasons.
 */

export type HelpTopic =
  | 'Food'
  | 'Cafés'
  | 'Traffic & roads'
  | 'Parenting'
  | 'Pets'
  | 'Fitness & sports'
  | 'Lost & found'
  | 'Civic issues'
  | 'New openings'
  | 'Weekend plans';

export const HELP_TOPICS: HelpTopic[] = [
  'Food',
  'Cafés',
  'Traffic & roads',
  'Parenting',
  'Pets',
  'Fitness & sports',
  'Lost & found',
  'Civic issues',
  'New openings',
  'Weekend plans',
];

/** Post topics are written loosely; this maps them onto the topics points are kept in. */
export const TOPIC_ALIASES: Record<string, HelpTopic> = {
  food: 'Food',
  café: 'Cafés',
  cafés: 'Cafés',
  cafe: 'Cafés',
  traffic: 'Traffic & roads',
  roads: 'Traffic & roads',
  parenting: 'Parenting',
  kids: 'Parenting',
  'give away': 'Parenting',
  pets: 'Pets',
  sports: 'Fitness & sports',
  fitness: 'Fitness & sports',
  'lost & found': 'Lost & found',
  water: 'Civic issues',
  civic: 'Civic issues',
  'new place': 'New openings',
  'new openings': 'New openings',
  weekend: 'Weekend plans',
  events: 'Weekend plans',
};

/* ---------- How points are earned ---------- */

export interface EarnRule {
  id: string;
  what: string;
  points: number;
  /** A limit or condition, shown under the rule. */
  note?: string;
}

export const EARN_RULES: EarnRule[] = [
  { id: 'helpful', what: 'The person who asked marks your reply Helpful', points: 15 },
  { id: 'upvote', what: 'A verified resident upvotes your post or reply', points: 2, note: 'Up to 20 a day from upvotes' },
  { id: 'helped', what: 'Someone taps “This helped me” on your check-in, or saves something from it to Want to try', points: 5 },
  { id: 'page', what: 'A page you added goes live after locals confirm it', points: 25 },
  { id: 'confirm', what: 'You are one of the first three to confirm a new opening', points: 5 },
  { id: 'fixed', what: 'Neighbours confirm your city report was fixed', points: 20 },
  { id: 'reunited', what: 'Something lost goes home through your post or reply', points: 30 },
  { id: 'meetup', what: 'You host a club meetup and five or more people come', points: 20 },
  { id: 'buy', what: 'A group buy you started reaches its target', points: 15 },
  { id: 'vouch', what: 'Someone you vouched for gets verified', points: 5 },
];

export const PENALTIES: EarnRule[] = [
  { id: 'removed', what: 'A post or reply is removed after reports', points: -50 },
  { id: 'fake', what: 'A check-in turns out to be fake', points: -100, note: 'Your level is also frozen for 30 days' },
];

export const FAIR_PLAY = [
  'Posting, replying and checking in earn nothing by themselves. Points only come from other people.',
  'Only verified residents’ votes count, and the same person’s votes count once a week.',
  'Pairs or rings of people voting for each other are spotted and their points set to zero.',
  'At most 100 points a day, however busy the day.',
  'Points can’t be bought, and businesses can’t pay to rank. Nothing on a board is an ad.',
];

/* ---------- Levels ---------- */

/** Identity checks and standing that a level needs on top of points. */
export type Requirement = 'phone' | 'address' | 'govId' | 'vouches10' | 'vouches25' | 'active';

export const REQUIREMENT_LABEL: Record<Requirement, string> = {
  phone: 'Phone number confirmed',
  address: 'Home neighbourhood verified',
  govId: 'Government ID verified',
  vouches10: '10 neighbours vouched for you',
  vouches25: '25 neighbours vouched for you',
  active: 'Helped someone in the last 90 days',
};

export type LevelId = 'newcomer' | 'neighbour' | 'regular' | 'expert' | 'guide' | 'hero';

export interface LevelDef {
  id: LevelId;
  name: string;
  /** Lifetime helpful points needed. */
  min: number;
  /** Checks this level adds; each level also needs the ones below it. */
  needs: Requirement[];
  unlocks: string[];
}

export const LEVELS: LevelDef[] = [
  { id: 'newcomer', name: 'Newcomer', min: 0, needs: [], unlocks: ['Ask, reply, check in and join clubs'] },
  { id: 'neighbour', name: 'Neighbour', min: 50, needs: ['phone'], unlocks: ['Add new pages', 'Plan meetups in your clubs'] },
  { id: 'regular', name: 'Regular', min: 200, needs: ['address'], unlocks: ['Start clubs', 'Start group buys'] },
  {
    id: 'expert',
    name: 'Local expert',
    min: 600,
    needs: ['govId'],
    unlocks: ['A “Local expert in Cafés”-style tag on answers in your strongest topic', 'Your answers there show first in replies and in Nearhood says'],
  },
  {
    id: 'guide',
    name: 'Nearhood guide',
    min: 1500,
    needs: ['vouches10'],
    unlocks: ['Confirm new pages in one tap', 'Merge duplicate pages and handle reports', 'Second review on page claims'],
  },
  {
    id: 'hero',
    name: 'City hero',
    min: 4000,
    needs: ['vouches25', 'active'],
    unlocks: ['City hero badge and a place on the City heroes board', 'Invited to the city heroes meetup every quarter', 'Help shape Nearhood’s city guides'],
  },
];

/* ---------- Everyone's record ---------- */

export interface HelpfulRecord {
  /** All the points they have ever earned; levels never go down with seasons. */
  lifetime: number;
  /** This season (calendar month). */
  thisMonth: number;
  lastMonth: number;
  /** Replies marked Helpful by the person who asked. */
  helpfulAnswers: number;
  /** Pages they added that went live. */
  pagesAdded: number;
  /** City reports neighbours confirmed fixed. */
  issuesFixed: number;
  /** Club meetups they hosted that five or more people came to. */
  meetupsHosted: number;
  /** Lifetime points by topic; adds up to lifetime. */
  topics: Partial<Record<HelpTopic, number>>;
  /** Days since they last earned a point. */
  lastActiveDays: number;
}

export const HELPFUL: Record<string, HelpfulRecord> = {
  me: {
    lifetime: 520,
    thisMonth: 85,
    lastMonth: 60,
    helpfulAnswers: 28,
    pagesAdded: 0,
    issuesFixed: 2,
    meetupsHosted: 0,
    topics: { Cafés: 230, 'Civic issues': 150, 'Traffic & roads': 140 },
    lastActiveDays: 0,
  },
  zoya: {
    lifetime: 4820,
    thisMonth: 310,
    lastMonth: 280,
    helpfulAnswers: 212,
    pagesAdded: 31,
    issuesFixed: 2,
    meetupsHosted: 6,
    topics: { Food: 2400, 'New openings': 1300, Cafés: 760, 'Weekend plans': 360 },
    lastActiveDays: 1,
  },
  aditi: {
    lifetime: 4210,
    thisMonth: 260,
    lastMonth: 300,
    helpfulAnswers: 198,
    pagesAdded: 4,
    issuesFixed: 9,
    meetupsHosted: 11,
    topics: { Parenting: 1500, 'Civic issues': 1010, Food: 900, 'Fitness & sports': 400, 'Lost & found': 400 },
    lastActiveDays: 0,
  },
  farah: {
    lifetime: 2310,
    thisMonth: 190,
    lastMonth: 170,
    helpfulAnswers: 96,
    pagesAdded: 12,
    issuesFixed: 14,
    meetupsHosted: 8,
    topics: { 'Civic issues': 980, 'Weekend plans': 620, 'Fitness & sports': 410, 'New openings': 300 },
    lastActiveDays: 0,
  },
  riya: {
    lifetime: 1720,
    thisMonth: 240,
    lastMonth: 150,
    helpfulAnswers: 120,
    pagesAdded: 18,
    issuesFixed: 1,
    meetupsHosted: 5,
    topics: { Cafés: 820, Food: 640, 'Weekend plans': 260 },
    lastActiveDays: 0,
  },
  meera: {
    lifetime: 980,
    thisMonth: 120,
    lastMonth: 110,
    helpfulAnswers: 64,
    pagesAdded: 3,
    issuesFixed: 2,
    meetupsHosted: 7,
    topics: { Parenting: 420, Food: 340, 'Lost & found': 220 },
    lastActiveDays: 1,
  },
  sana: {
    lifetime: 760,
    thisMonth: 140,
    lastMonth: 90,
    helpfulAnswers: 41,
    pagesAdded: 2,
    issuesFixed: 1,
    meetupsHosted: 4,
    topics: { Pets: 460, Parenting: 300 },
    lastActiveDays: 0,
  },
  harsh: {
    lifetime: 430,
    thisMonth: 60,
    lastMonth: 70,
    helpfulAnswers: 22,
    pagesAdded: 3,
    issuesFixed: 5,
    meetupsHosted: 1,
    topics: { 'Civic issues': 250, 'Traffic & roads': 180 },
    lastActiveDays: 2,
  },
  arjun: {
    lifetime: 390,
    thisMonth: 80,
    lastMonth: 60,
    helpfulAnswers: 25,
    pagesAdded: 1,
    issuesFixed: 0,
    meetupsHosted: 6,
    topics: { 'New openings': 160, 'Weekend plans': 150, Cafés: 80 },
    lastActiveDays: 3,
  },
  karan: {
    lifetime: 310,
    thisMonth: 95,
    lastMonth: 40,
    helpfulAnswers: 12,
    pagesAdded: 3,
    issuesFixed: 0,
    meetupsHosted: 9,
    topics: { 'Fitness & sports': 240, 'New openings': 70 },
    lastActiveDays: 0,
  },
  kavya: {
    lifetime: 260,
    thisMonth: 45,
    lastMonth: 50,
    helpfulAnswers: 18,
    pagesAdded: 0,
    issuesFixed: 0,
    meetupsHosted: 2,
    topics: { 'Fitness & sports': 200, 'Traffic & roads': 60 },
    lastActiveDays: 4,
  },
  // Enough points for Regular, but his home neighbourhood isn't verified yet.
  dev: {
    lifetime: 240,
    thisMonth: 35,
    lastMonth: 40,
    helpfulAnswers: 9,
    pagesAdded: 3,
    issuesFixed: 1,
    meetupsHosted: 3,
    topics: { 'Fitness & sports': 150, 'Lost & found': 90 },
    lastActiveDays: 1,
  },
  nikhil: {
    lifetime: 140,
    thisMonth: 30,
    lastMonth: 25,
    helpfulAnswers: 9,
    pagesAdded: 2,
    issuesFixed: 2,
    meetupsHosted: 3,
    topics: { 'Traffic & roads': 110, 'Weekend plans': 30 },
    lastActiveDays: 0,
  },
  priyank: {
    lifetime: 30,
    thisMonth: 15,
    lastMonth: 10,
    helpfulAnswers: 2,
    pagesAdded: 0,
    issuesFixed: 0,
    meetupsHosted: 1,
    topics: { 'New openings': 30 },
    lastActiveDays: 5,
  },
};

const EMPTY: HelpfulRecord = {
  lifetime: 0,
  thisMonth: 0,
  lastMonth: 0,
  helpfulAnswers: 0,
  pagesAdded: 0,
  issuesFixed: 0,
  meetupsHosted: 0,
  topics: {},
  lastActiveDays: 999,
};

/** Official accounts (the ward desk) don't earn points or appear on boards. */
export const OFFICIAL = ['ward'];

export const helpfulOf = (id: string): HelpfulRecord => HELPFUL[id] ?? EMPTY;

/* ---------- Your points history ---------- */

export interface LedgerEntry {
  id: string;
  ago: string;
  points: number;
  what: string;
  /** What it was about, quoted. */
  about?: string;
  /** Who it came from, when it was a person. */
  fromId?: string;
  topic?: HelpTopic;
  to?: string;
  /** Earned this season. */
  thisMonth: boolean;
  /** Why some of it didn't count. */
  note?: string;
  /** What kind of thing earned it, for the row's icon when no person is shown. */
  kind?: 'upvotes' | 'report' | 'opening' | 'list';
}

export const MY_LEDGER: LedgerEntry[] = [
  { id: 'l1', ago: '2h', points: 15, what: 'Riya marked your reply helpful', about: 'Any quiet café for a weekend brunch where I can also work?', fromId: 'riya', topic: 'Cafés', to: '/post/brunch-wifi', thisMonth: true },
  { id: 'l2', kind: 'upvotes', ago: '5h', points: 6, what: '3 neighbours upvoted your reply', about: 'Signal at Iscon crossroads is blinking amber', topic: 'Traffic & roads', to: '/post/sg-signal', thisMonth: true },
  { id: 'l3', ago: 'Yesterday', points: 5, what: 'Kavya saved Cold brew from your check-in', about: 'The Quiet Cup', fromId: 'kavya', topic: 'Cafés', to: '/place/quiet-cup', thisMonth: true },
  { id: 'l4', kind: 'report', ago: '2 days', points: 20, what: 'Your streetlight report was confirmed fixed', about: 'Three streetlights out on the inner road', topic: 'Civic issues', to: '/city/reports/rep-light', thisMonth: true, note: '9 neighbours confirmed the fix' },
  { id: 'l5', ago: '4 days', points: 15, what: 'Harsh marked your reply helpful', about: 'Low water pressure near Judges Bungalow Road?', fromId: 'harsh', topic: 'Civic issues', to: '/post/water-timing', thisMonth: true },
  { id: 'l6', kind: 'opening', ago: '6 days', points: 5, what: 'You were one of the first to confirm a new opening', about: 'Kettle & Crumb, Bodakdev', topic: 'New openings', to: '/explore', thisMonth: true },
  { id: 'l7', kind: 'upvotes', ago: '9 days', points: 10, what: '5 upvotes on your traffic tip', about: 'Leave before 8:40 to beat the Iscon queue', topic: 'Traffic & roads', to: '/post/sg-signal', thisMonth: true },
  { id: 'l8', ago: '12 days', points: 5, what: 'Priyank, who you vouched for, got verified', fromId: 'priyank', to: '/people/priyank', thisMonth: true },
  { id: 'l9', kind: 'upvotes', ago: '13 days', points: 4, what: '2 upvotes on your reply', about: 'Where to park near Law Garden on a Sunday?', topic: 'Traffic & roads', to: '/place/law-garden', thisMonth: true, note: '3 more votes from the same person didn’t count' },
  { id: 'l10', ago: 'Sep 28', points: 15, what: 'Aditi marked your reply helpful', about: 'Somewhere quiet to read near Bodakdev?', fromId: 'aditi', topic: 'Cafés', to: '/place/quiet-cup', thisMonth: false },
  { id: 'l11', kind: 'report', ago: 'Sep 21', points: 20, what: 'Your pothole report was confirmed fixed', about: 'Pothole outside the Bodakdev post office', topic: 'Civic issues', to: '/city/reports', thisMonth: false },
  { id: 'l12', ago: 'Sep 14', points: 15, what: 'Nikhil marked your reply helpful', about: 'Fastest way to Navrangpura at 6 pm?', fromId: 'nikhil', topic: 'Traffic & roads', to: '/city/traffic', thisMonth: false },
  { id: 'l13', kind: 'list', ago: 'Sep 6', points: 10, what: '5 upvotes on your café list', about: 'Cafés that don’t mind laptops', topic: 'Cafés', to: '/me?tab=lists', thisMonth: false },
];
