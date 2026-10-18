import { Link } from 'react-router-dom';
import { person } from '../data/core';
import { placeById } from '../data/places';
import type { CheckIn, WantItem } from '../data/types';
import { useT } from '../i18n';
import { eventPhoto, itemPhoto, placePhoto } from '../assets/photos';
import { ChevronRightGlyph, NamedGlyph, type GlyphName } from '../icons';
import { VERDICT_LABEL } from '../lib/friends';
import { Avatar, Cover } from './cards';
import { VERDICT_META, VerdictBadge } from './friends';
import { Sheet } from './ui';

/* Community pieces used by Home, Explore and place pages. Styles in home.css / discover.css. */

/** Compact card for a friend's must-try: who, what, where. */
export function FriendPickCard({ c }: { c: CheckIn }) {
  const who = person(c.authorId);
  const place = c.placeId ? placeById(c.placeId) : undefined;
  const src = itemPhoto(c.items[0], c.placeId, c.eventId);
  return (
    <article className="pick-card">
      <Link to={`/checkin/${c.id}`} className="pick-card__link" aria-label={`${who.name}: ${c.items.join(', ')} at ${c.placeName}, ${VERDICT_LABEL[c.verdict]}`}>
        <span className={`pick-card__photo tone-${place?.tone ?? VERDICT_META[c.verdict].tone}`}>
          {src ? (
            <img src={src} alt="" loading="lazy" decoding="async" />
          ) : (
            <NamedGlyph name={(place?.glyph ?? (c.kind === 'ate' ? 'food' : 'events')) as GlyphName} size={34} duo />
          )}
          <span className="pick-card__who">
            <Avatar who={{ ...who, verified: false }} size={26} />
          </span>
        </span>
        <span className="pick-card__body">
          <span className="pick-card__item">{c.items[0]}</span>
          <span className="meta pick-card__place">
            {who.name.split(' ')[0]} at {c.placeName}
          </span>
          <span style={{ marginTop: 4 }}>
            <VerdictBadge verdict={c.verdict} kind={c.kind} size="sm" />
          </span>
        </span>
      </Link>
    </article>
  );
}

export function draftLink(personId: string, text: string) {
  return `/messages/c-${personId}?draft=${encodeURIComponent(text)}`;
}

/** "You and Riya both want to try Polo Forest": a nudge to plan it together. */
export function PlanTogetherCard({ plans }: { plans: Array<{ personId: string; item: WantItem }> }) {
  const t = useT();
  if (!plans.length) return null;
  return (
    <section className="section plan-card" aria-labelledby="plan-title">
      <h2 className="section__title" id="plan-title">
        {t('feed.friends.planTogether')}
      </h2>
      <div className="list" style={{ border: 'none', background: 'transparent' }}>
        {plans.slice(0, 3).map(({ personId, item }) => {
          const who = person(personId);
          const first = who.name.split(' ')[0];
          // Lists match on the place; a dish or class on yours may differ from theirs, so name the place.
          const placeName = item.refId ? placeById(item.refId)?.name : undefined;
          const target = (item.kind === 'dish' || item.kind === 'activity') && placeName ? placeName : item.title;
          const verb = (item.kind === 'dish' || item.kind === 'activity') && placeName ? 'go to' : 'try';
          return (
            <div key={`${personId}-${item.id}`} className="list-row plan-card__row">
              <span className="plan-card__media">
                <Cover
                  src={item.kind === 'event' && item.refId ? eventPhoto(item.refId) : item.refId ? placePhoto(item.refId) : undefined}
                  glyph={item.kind === 'event' ? 'events' : 'pin'}
                  className="plan-card__photo"
                />
                <Avatar who={{ ...who, verified: false }} size={26} />
              </span>
              <span className="list-row__body">
                <span className="list-row__title">
                  You and {first} both want to {verb} {target}
                </span>
                <span className="list-row__meta">{verb === 'go to' ? `Yours: ${item.title}` : item.sub}</span>
              </span>
              <Link to={draftLink(personId, `Want to ${verb} ${target} together this weekend?`)} className="btn btn--sm btn--soft">
                {t('feed.friends.planIt')}
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Explains why community verdicts are harder to fake than star ratings. */
export function TrustSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const rules: Array<{ glyph: GlyphName; title: string; body: string }> = [
    { glyph: 'shield', title: 'Only verified visits count', body: 'A verdict counts once the visit is confirmed by location at the venue or a bill photo.' },
    { glyph: 'deals', title: 'Free or invited visits are labelled', body: 'If someone was invited or ate for free, the check-in says so and is left out of the score.' },
    { glyph: 'checkin', title: 'One verdict per visit', body: 'Each visit gets one Must try, Good or Skip. Repeat posts don’t add up.' },
    { glyph: 'services', title: 'Owners can’t review their own place', body: 'Business accounts and their staff can reply, but their verdicts never count.' },
    { glyph: 'users', title: 'Reviewer history is public', body: 'Tap anyone to see every place they’ve checked in, so you can judge their taste.' },
    { glyph: 'friends', title: 'Friends come first', body: 'Reviews from people you follow show first, then people with a similar taste to yours.' },
  ];
  return (
    <Sheet open={open} onClose={onClose} title={t('community.whyTrust')}>
      <p className="body-sm muted">{t('community.whyTrustIntro')}</p>
      <ul className="trust-rules">
        {rules.map((r) => (
          <li key={r.title}>
            <span className="tile tone-mint">
              <NamedGlyph name={r.glyph} size={18} duo />
            </span>
            <span className="stack" style={{ gap: 2 }}>
              <span className="strong" style={{ fontSize: '0.9375rem' }}>
                {r.title}
              </span>
              <span className="body-sm muted">{r.body}</span>
            </span>
          </li>
        ))}
      </ul>
      <button type="button" className="btn btn--primary btn--block" onClick={onClose}>
        {t('common.done')}
      </button>
    </Sheet>
  );
}

/** One friend's verdict at a place: avatar, verdict, what they had. */
export function FriendVerdictRow({ c }: { c: CheckIn }) {
  const who = person(c.authorId);
  return (
    <Link to={`/checkin/${c.id}`} className="list-row">
      <Avatar who={who} size={36} />
      <span className="list-row__body">
        <span className="list-row__title">{c.authorId === 'me' ? 'You' : who.name}</span>
        <span className="list-row__meta">
          {c.items.join(', ')} · {c.ago}
        </span>
      </span>
      <VerdictBadge verdict={c.verdict} kind={c.kind} size="sm" />
      <ChevronRightGlyph size={16} />
    </Link>
  );
}
