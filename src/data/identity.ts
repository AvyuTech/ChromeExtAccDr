/**
 * Who someone is, so people can trust what they post. Every check happens once,
 * privately; Nearhood keeps the result, never the document or the number.
 */
export type WorkProof = 'work email' | 'professional licence' | 'LinkedIn';

export interface Identity {
  /** What they do, in their own words. Shown with a tick only when confirmed. */
  work?: { title: string; org?: string; proof?: WorkProof };
  checks: {
    /** One-time code to an Indian mobile number. */
    phone: boolean;
    /** Name and photo matched once through DigiLocker. */
    govId: boolean;
    /** Home neighbourhood confirmed by a utility bill or two neighbours. */
    address: boolean;
  };
  /** Neighbours who vouched they know this person. */
  vouches: number;
  /** Topics they're happy to be asked about. */
  askMeAbout?: string[];
}

export const IDENTITY: Record<string, Identity> = {
  me: {
    work: { title: 'Product designer', org: '[Studio name]', proof: 'work email' },
    checks: { phone: true, govId: true, address: true },
    vouches: 12,
    askMeAbout: ['Cycling routes', 'Quiet cafés', 'Design careers'],
  },
  riya: {
    work: { title: 'Brand strategist', org: 'Independent', proof: 'LinkedIn' },
    checks: { phone: true, govId: true, address: true },
    vouches: 34,
    askMeAbout: ['Brunch spots', 'Working from cafés', 'Branding'],
  },
  aditi: {
    work: { title: 'Paediatrician', org: '[Hospital name]', proof: 'professional licence' },
    checks: { phone: true, govId: true, address: true },
    vouches: 58,
    askMeAbout: ['Children’s health', 'Korean food'],
  },
  karan: {
    work: { title: 'Software engineer', org: '[Company name]', proof: 'work email' },
    checks: { phone: true, govId: true, address: true },
    vouches: 9,
    askMeAbout: ['Pickleball', 'Cricket on Sundays'],
  },
  nikhil: {
    work: { title: 'Civil engineer', org: '[Firm name]', proof: 'LinkedIn' },
    checks: { phone: true, govId: false, address: true },
    vouches: 6,
    askMeAbout: ['Road works', 'Day trips'],
  },
  farah: {
    work: { title: 'Architect', org: 'Own practice', proof: 'professional licence' },
    checks: { phone: true, govId: true, address: true },
    vouches: 41,
    askMeAbout: ['Old city heritage', 'Green spaces'],
  },
  meera: {
    work: { title: 'School teacher', org: '[School name]', proof: 'work email' },
    checks: { phone: true, govId: true, address: true },
    vouches: 22,
    askMeAbout: ['Gujarati food', 'Books'],
  },
  harsh: {
    work: { title: 'Chartered accountant', proof: 'professional licence' },
    checks: { phone: true, govId: true, address: true },
    vouches: 17,
    askMeAbout: ['Taxes for small businesses', 'Rooftop solar'],
  },
  sana: {
    work: { title: 'Veterinary doctor', org: '[Clinic name]', proof: 'professional licence' },
    checks: { phone: true, govId: true, address: true },
    vouches: 29,
    askMeAbout: ['Pets', 'Parenting in Thaltej'],
  },
  dev: {
    work: { title: 'Lawyer', org: 'Gujarat High Court', proof: 'professional licence' },
    checks: { phone: true, govId: true, address: false },
    vouches: 8,
    askMeAbout: ['Rental agreements', 'Cricket'],
  },
  kavya: {
    work: { title: 'Physiotherapist', proof: 'professional licence' },
    checks: { phone: true, govId: true, address: true },
    vouches: 11,
    askMeAbout: ['Running injuries', 'Yoga'],
  },
  arjun: {
    work: { title: 'Founder', org: '[Startup name]', proof: 'LinkedIn' },
    checks: { phone: true, govId: true, address: true },
    vouches: 15,
    askMeAbout: ['Hiring', 'Early-stage fundraising'],
  },
  zoya: {
    work: { title: 'Food writer', proof: 'LinkedIn' },
    checks: { phone: true, govId: true, address: true },
    vouches: 47,
    askMeAbout: ['New openings', 'Street food'],
  },
  priyank: {
    work: { title: 'Founder', org: '[Startup name]' },
    checks: { phone: true, govId: false, address: true },
    vouches: 4,
    askMeAbout: ['Startups in Prahlad Nagar'],
  },
};

const NEW_MEMBER: Identity = { checks: { phone: true, govId: false, address: false }, vouches: 0 };

export function identityOf(id: string): Identity {
  return IDENTITY[id] ?? NEW_MEMBER;
}

/** "Paediatrician at [Hospital name]" */
export function workLine(identity: Identity) {
  const w = identity.work;
  if (!w) return undefined;
  return w.org && w.org !== 'Independent' && w.org !== 'Own practice' ? `${w.title} at ${w.org}` : w.org ? `${w.title} · ${w.org}` : w.title;
}

/** Fully verified people have their phone, ID and home all confirmed. */
export const isFullyVerified = (identity: Identity) => identity.checks.phone && identity.checks.govId && identity.checks.address;

/** Your own identity comes from your settings, so edits show straight away. */
export function myIdentity(profile: { work: { title: string; org: string; proof: '' | WorkProof }; idVerified: boolean; verifiedResident: boolean; askMeAbout: string[] }): Identity {
  const base = IDENTITY.me;
  return {
    work: profile.work.title ? { title: profile.work.title, org: profile.work.org || undefined, proof: profile.work.proof || undefined } : undefined,
    checks: { phone: base.checks.phone, govId: profile.idVerified, address: profile.verifiedResident },
    vouches: base.vouches,
    askMeAbout: profile.askMeAbout,
  };
}
