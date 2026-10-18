import type { GlyphName } from '../icons';
import type { PlaceCategory, Tone } from './types';

/*
  Pages: every café, court, park, shop or studio on Nearhood has one page, built
  the same way whatever it is. Locals add pages; owners can claim them to keep
  the facts right. Nobody can buy a page, a placement or a verdict.
*/

/** Confirmations a new page needs before it is listed (one Nearhood guide counts for all). */
export const NEEDED_TO_LIST = 3;

/* ---------- Claiming a page ---------- */

export type ClaimRole = 'Owner' | 'Partner' | 'Manager';
export type ClaimProof = 'GST certificate' | 'FSSAI licence' | 'Shop & Establishment registration' | 'Udyam certificate';
/** Where a claim is: sent, venue phone confirmed, documents checked, approved. */
export type ClaimStatus = 'submitted' | 'phone' | 'documents' | 'approved';

export interface PageClaim {
  role: ClaimRole;
  proof: ClaimProof;
  fileName?: string;
  submittedAt: string;
  status: ClaimStatus;
}

export const CLAIM_ROLES: Array<{ value: ClaimRole; note: string }> = [
  { value: 'Owner', note: 'It’s your business, or your family’s.' },
  { value: 'Partner', note: 'You’re named on the licence or the GST registration.' },
  { value: 'Manager', note: 'You run it day to day. The owner can add more staff later.' },
];

export const CLAIM_PROOFS: Array<{ value: ClaimProof; note: string }> = [
  { value: 'GST certificate', note: 'Form GST REG-06 with the trade name' },
  { value: 'FSSAI licence', note: 'Or FSSAI registration, for anywhere that serves food' },
  { value: 'Shop & Establishment registration', note: 'The Gumasta licence from the AMC' },
  { value: 'Udyam certificate', note: 'For small businesses registered as MSMEs' },
];

export const CLAIM_STEPS: Array<{ status: ClaimStatus; title: string; note: string }> = [
  { status: 'submitted', title: 'Claim sent', note: 'Your role and your document reached us.' },
  { status: 'phone', title: 'Venue phone confirmed', note: 'You read back the code we called the venue with.' },
  { status: 'documents', title: 'Documents checked', note: 'Within 2 working days. A local guide may drop by if anything is unclear.' },
  { status: 'approved', title: 'Approved', note: 'Your name shows on the page as the person who runs it.' },
];

/** What running a page lets you do, and what it never does. */
export const OWNER_CAN = [
  'Fix the facts: hours, phone, address and the cover photo',
  'Say what you offer: a menu, classes, court timings',
  'Post updates and events, with a link to book or read more elsewhere',
  'Reply once, publicly, to any check-in',
  'See simple counts: saves and check-ins each week',
];
export const OWNER_CANNOT = [
  'Edit, hide or remove anyone’s check-in or verdict',
  'Pay for ranking, placement or a badge',
  'See who saved the page',
  'Message people who haven’t written to you first',
];

/** The venue numbers locals listed, shown masked during a claim. */
export const PAGE_PHONES: Record<string, string> = {
  'pickle-play': '+91 79 •••• ••18',
  'brew-lab': '+91 98•• •••• 41',
  'seoul-bowl': '+91 79 •••• ••07',
};
export const pagePhone = (placeId: string) => PAGE_PHONES[placeId] ?? '+91 79 •••• ••00';

/* ---------- Updates from claimed pages ---------- */

export interface PageUpdate {
  id: string;
  placeId: string;
  /** Who posted it for the page. */
  by: string;
  ago: string;
  text: string;
  photo?: string;
  link?: { label: string; url: string };
}

export const PAGE_UPDATES: PageUpdate[] = [
  {
    id: 'pu-quiet-cup-1',
    placeId: 'quiet-cup',
    by: 'Neha, owner',
    ago: '2d',
    text: 'The back room is laptop-only from 9 to 12 on weekdays now. Plugs at every table, no calls please.',
    photo: 'dish-latte-art',
  },
  {
    id: 'pu-quiet-cup-2',
    placeId: 'quiet-cup',
    by: 'Neha, owner',
    ago: '1w',
    text: 'New this month: a cold brew tonic with kokum. Ask for it off-menu until the boards are updated.',
  },
  {
    id: 'pu-spice-1',
    placeId: 'spice-courtyard',
    by: 'Raghav, owner',
    ago: '3d',
    text: 'Sunday thali is back from this week, 12 to 3:30. Same price, one more sabzi.',
    photo: 'dish-curry',
  },
  {
    id: 'pu-clay-1',
    placeId: 'clay-studio',
    by: 'Ishita, studio host',
    ago: '4d',
    text: 'Two seats left in Saturday’s wheel class. We don’t take bookings here, message us on Instagram.',
    link: { label: 'Studio Instagram', url: 'https://www.instagram.com/' },
  },
  {
    id: 'pu-corner-1',
    placeId: 'corner-table',
    by: 'Corner Table team',
    ago: '5d',
    text: 'Kitchen closes at 10:30 pm on weekdays from Monday. Weekends stay till 11:30.',
  },
];

export const updatesFor = (placeId: string) => PAGE_UPDATES.filter((u) => u.placeId === placeId);

/* ---------- Adding a page ---------- */

/** Connection the person adding a page has to it. */
export type PageConnection = 'found' | 'work' | 'run';

export const CONNECTIONS: Array<{ value: PageConnection; label: string; note: string }> = [
  { value: 'found', label: 'Just found it', note: 'You’ve been, or walked past it.' },
  { value: 'work', label: 'I work there', note: 'Fine to add. Say so in your note.' },
  { value: 'run', label: 'I run it', note: 'Add it like anyone else. Once locals confirm it, claim it to keep the facts right.' },
];

/**
 * What a page is, read from the free-text "what it is" line. Only used to file
 * the page under Explore's filters and pick a fallback icon; every page looks
 * the same whatever comes back.
 */
export function pageFiling(kind: string): { category: PlaceCategory; glyph: GlyphName; tone: Tone } {
  const k = kind.toLowerCase();
  if (/caf[eé]|coffee|bakery|tea|chai|dessert/.test(k)) return { category: 'cafe', glyph: 'cafe', tone: 'peach' };
  if (/restaurant|food|thali|kitchen|truck|dhaba|biryani|pizza|bar|diner|eat/.test(k)) return { category: 'food', glyph: 'food', tone: 'amber' };
  if (/court|turf|gym|pool|sport|cricket|pickle|badminton|football|yoga|run/.test(k)) return { category: 'sports', glyph: 'sports', tone: 'teal' };
  if (/park|lake|garden|forest|trail|river|nature/.test(k)) return { category: 'nature', glyph: 'nature', tone: 'mint' };
  if (/temple|fort|step ?well|vav|heritage|museum|pol\b|mosque|church/.test(k)) return { category: 'heritage', glyph: 'heritage', tone: 'clay' };
  if (/shop|store|market|boutique|book|bazaar/.test(k)) return { category: 'shopping', glyph: 'shopping', tone: 'blue' };
  return { category: 'culture', glyph: 'pin', tone: 'violet' };
}

/** Shrinks a photo to a small JPEG data URL so a new page keeps it across visits. */
export function shrinkPhoto(file: File, max = 640): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('No canvas'));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read photo'));
    };
    img.src = url;
  });
}
