import { useState } from 'react';
import { Link } from 'react-router-dom';
import { person } from '../data/core';
import { placeById } from '../data/places';
import type { CheckIn, WantItem } from '../data/types';
import { useT } from '../i18n';
import { itemPhoto } from '../assets/photos';
import { ChevronRightGlyph, FriendsGlyph, HeartGlyph, NamedGlyph, SendGlyph, type GlyphName } from '../icons';
import { profileInfo, VERDICT_LABEL } from '../lib/friends';
import { nowTime } from '../lib/format';
import { useAppData } from '../state/appData';
import { useToast } from '../state/toast';
import { Avatar } from './cards';
import { VERDICT_META, VerdictBadge } from './friends';
import { Sheet } from './ui';

/* Community pieces used by Home, Explore and place pages. Styles in home.css / discover.css. */

/** Compact card for a friend's must-try: who, what, where. */
export function FriendPickCard({ c }: { c: CheckIn }) {
  const { has, toggle } = useAppData();
  const who = person(c.authorId);
  const place = c.placeId ? placeById(c.placeId) : undefined;
  const liked = has('likedCheckIns', c.id);
  const src = itemPhoto(c.items[0], c.placeId, c.eventId);
  return (
    <article className="card pick-card">
      <Link to={`/checkin/${c.id}`} className="pick-card__link" aria-label={`${who.name}: ${c.items.join(', ')} at ${c.placeName}, ${VERDICT_LABEL[c.verdict][c.kind]}`}>
        <span className={`pick-card__photo tone-${place?.tone ?? VERDICT_META[c.verdict].tone}`}>
          {src ? (
            <img src={src} alt="" loading="lazy" decoding="async" />
          ) : (
            <NamedGlyph name={(place?.glyph ?? (c.kind === 'ate' ? 'food' : 'events')) as GlyphName} size={34} duo />
          )}
          <span className="pick-card__who">
            <Avatar who={{ ...who, verified: false }} size={32} />
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
      <button type="button" className="photo-action" style={{ top: 10, right: 10 }} aria-pressed={liked} aria-label={liked ? 'Unlike' : 'Like'} onClick={() => toggle('likedCheckIns', c.id)}>
        <HeartGlyph size={20} active={liked} style={{ color: liked ? 'var(--red)' : undefined }} />
      </button>
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
    <section className="card plan-card" aria-labelledby="plan-title">
      <div className="row">
        <span className="tile tone-mint">
          <FriendsGlyph size={20} duo live />
        </span>
        <h2 className="section__title grow" id="plan-title">
          {t('feed.friends.planTogether')}
        </h2>
      </div>
      <div className="list" style={{ border: 'none', background: 'transparent' }}>
        {plans.slice(0, 3).map(({ personId, item }) => {
          const who = person(personId);
          const first = who.name.split(' ')[0];
          // Lists match on the place; a dish or class on yours may differ from theirs, so name the place.
          const placeName = item.refId ? placeById(item.refId)?.name : undefined;
          const target = (item.kind === 'dish' || item.kind === 'activity') && placeName ? placeName : item.title;
          const verb = (item.kind === 'dish' || item.kind === 'activity') && placeName ? 'go to' : 'try';
          return (
            <div key={`${personId}-${item.id}`} className="list-row" style={{ padding: '10px 0' }}>
              <Avatar who={{ ...who, verified: false }} size={36} />
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

/** Send a place to friends as chat messages. */
export function RecommendSheet({ open, onClose, placeName, area }: { open: boolean; onClose: () => void; placeName: string; area: string }) {
  const t = useT();
  const toast = useToast();
  const { data, sendMessage } = useAppData();
  const [picked, setPicked] = useState<string[]>([]);
  const [note, setNote] = useState('');

  const close = () => {
    setPicked([]);
    setNote('');
    onClose();
  };

  const send = () => {
    const text = `Try ${placeName} in ${area}${note.trim() ? ` — ${note.trim()}` : ''}`;
    picked.forEach((id, i) => sendMessage(`c-${id}`, { id: `rec-${Date.now()}-${i}`, from: 'me', text, time: nowTime() }));
    toast(picked.length === 1 ? `Sent to ${person(picked[0]).name.split(' ')[0]}` : `Sent to ${picked.length} friends`);
    close();
  };

  return (
    <Sheet open={open} onClose={close} title={t('community.recommendTitle')}>
      <p className="body-sm muted">{t('community.recommendIntro', { place: placeName })}</p>
      {data.following.length === 0 ? (
        <p className="body-sm">
          {t('community.recommendNoFriends')}{' '}
          <Link to="/friends?tab=find" onClick={close}>
            {t('feed.friends.find')}
          </Link>
        </p>
      ) : (
        <fieldset className="recommend-list">
          <legend className="sr-only">{t('community.recommendWho')}</legend>
          {data.following.map((id) => {
            const who = person(id);
            const checked = picked.includes(id);
            return (
              <label key={id} className={`recommend-row${checked ? ' is-checked' : ''}`} htmlFor={`rec-${id}`}>
                <Avatar who={who} size={36} />
                <span className="list-row__body">
                  <span className="list-row__title">{who.name}</span>
                  <span className="list-row__meta">@{profileInfo(id).handle}</span>
                </span>
                <input
                  id={`rec-${id}`}
                  type="checkbox"
                  className="recommend-check"
                  checked={checked}
                  onChange={() => setPicked((p) => (checked ? p.filter((x) => x !== id) : [...p, id]))}
                />
              </label>
            );
          })}
        </fieldset>
      )}
      <label className="field" htmlFor="rec-note">
        <span className="field__label">{t('community.recommendNote')}</span>
        <input id="rec-note" className="input" value={note} maxLength={140} onChange={(e) => setNote(e.target.value)} placeholder="Get the kimchi pancake, go before 7" />
      </label>
      <button type="button" className="btn btn--primary btn--block" disabled={picked.length === 0} onClick={send}>
        <SendGlyph size={18} />
        {picked.length > 1 ? t('community.sendTo', { n: picked.length }) : t('community.send')}
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
