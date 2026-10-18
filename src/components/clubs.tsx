import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { groupPhoto, photo } from '../assets/photos';
import { person } from '../data/core';
import { GROUPS, groupById } from '../data/social';
import type { ClubKind, Group, GroupBuy, Meetup, Tone } from '../data/types';
import { useT } from '../i18n';
import { CalendarGlyph, CheckGlyph, ChevronRightGlyph, NamedGlyph, PinGlyph, ReplyGlyph, UsersGlyph, type GlyphName } from '../icons';
import { compact } from '../lib/format';
import { DEFAULT_APP_DATA, useAppData, type AppData } from '../state/appData';
import { useToast } from '../state/toast';
import { Avatar, ClubTag, Cover, FaceStack, ShareButton, Votes } from './cards';
import { useIdentity } from './identity';
import { Sheet } from './ui';

/* ---------- Kinds ---------- */

export const CLUB_KINDS: ClubKind[] = ['neighbours', 'founders', 'sports', 'parents', 'food', 'outdoors', 'books'];

export const KIND_META: Record<ClubKind, { glyph: GlyphName; tone: Tone; photo: string }> = {
  neighbours: { glyph: 'home', tone: 'violet', photo: 'scene-friends' },
  founders: { glyph: 'users', tone: 'violet', photo: 'place-quiet-cup' },
  sports: { glyph: 'sports', tone: 'green', photo: 'scene-sunset-friends' },
  parents: { glyph: 'kids', tone: 'yellow', photo: 'event-kite-workshop' },
  food: { glyph: 'food', tone: 'peach', photo: 'scene-table' },
  outdoors: { glyph: 'nature', tone: 'teal', photo: 'scene-lake' },
  books: { glyph: 'library', tone: 'amber', photo: 'place-brew-lab' },
};

export function clubPhoto(club: Group) {
  // Clubs people start borrow a photo that suits their kind.
  return groupPhoto(club.id) ?? photo(KIND_META[club.kind].photo);
}

/* ---------- Data helpers ---------- */

export function allClubs(data: AppData): Group[] {
  return [...data.myClubs, ...GROUPS];
}

export function clubById(id: string, data: AppData): Group | undefined {
  return data.myClubs.find((c) => c.id === id) ?? groupById(id);
}

export function meetupsOf(club: Group, data: AppData): Meetup[] {
  return [...(data.myMeetups[club.id] ?? []), ...(club.meetups ?? [])];
}

export function buysOf(club: Group, data: AppData): GroupBuy[] {
  return [...(data.myBuys[club.id] ?? []), ...(club.buys ?? [])];
}

/** Sample counts already include seeded memberships; joining or leaving adjusts them. */
export function memberCount(club: Group, joined: boolean) {
  const seeded = DEFAULT_APP_DATA.joinedGroups.includes(club.id);
  return club.members + (joined && !seeded ? 1 : 0) - (!joined && seeded ? 1 : 0);
}

/** "Sun, 7 am" → ["Sun", "7 am"]. */
function splitWhen(when: string): [string, string] {
  const i = when.indexOf(', ');
  return i === -1 ? [when, ''] : [when.slice(0, i), when.slice(i + 2)];
}

/* ---------- Rows ---------- */

export function ClubRow({ club, last }: { club: Group; last?: boolean }) {
  const t = useT();
  const { data, has } = useAppData();
  const next = meetupsOf(club, data)[0];
  return (
    <Link to={`/clubs/${club.id}`} className="club-row" style={last ? { borderBottom: 'none' } : undefined}>
      <Cover src={clubPhoto(club)} glyph={club.glyph} tone={club.tone} className="club-row__thumb" />
      <span className="club-row__body">
        <span className="club-row__name">{club.name}</span>
        <span className="meta">
          {t('clubs.members', { n: compact(memberCount(club, has('joinedGroups', club.id))) })} · {club.area}
        </span>
        {next ? (
          <span className="club-row__next">
            <CalendarGlyph size={12} />
            {t('clubs.next', { what: `${next.when} · ${next.title}` })}
          </span>
        ) : null}
      </span>
      <ChevronRightGlyph size={16} style={{ color: 'var(--muted)', flexShrink: 0 }} />
    </Link>
  );
}

export function MeetupRow({ meetup, club, showClub }: { meetup: Meetup; club: Group; showClub?: boolean }) {
  const t = useT();
  const toast = useToast();
  const { data, toggle } = useAppData();
  const mine = data.joinedMeetups.includes(meetup.id);
  const ids = [...(mine ? ['me'] : []), ...meetup.going.filter((x) => x !== 'me')];
  const left = meetup.spots ? meetup.spots - ids.length : undefined;
  const [day, time] = splitWhen(meetup.when);
  return (
    <div className="meetup-row">
      <span className={`meetup-row__when tone-${club.tone}`} aria-hidden="true">
        <b>{day}</b>
        {time ? <small>{time}</small> : null}
      </span>
      <span className="meetup-row__body">
        <span className="meetup-row__title">{meetup.title}</span>
        <span className="meta">
          {meetup.where}
          {showClub ? (
            <>
              {' · '}
              <Link to={`/clubs/${club.id}`} className="meetup-row__club">
                {club.name}
              </Link>
            </>
          ) : null}
        </span>
        {meetup.note ? <span className="meetup-row__note">{meetup.note}</span> : null}
        <span className="meetup-row__who">
          <FaceStack ids={ids} size={18} max={5} />
          <span>
            {t('clubs.goingCount', { n: ids.length })}
            {left !== undefined ? ` · ${left > 0 ? t('clubs.spotsLeft', { n: left }) : t('clubs.full')}` : ''}
          </span>
        </span>
      </span>
      <button
        type="button"
        className={`chip club-chip${mine ? ' chip--soft' : ''}`}
        aria-pressed={mine}
        aria-label={`${mine ? t('clubs.youreIn') : t('clubs.imIn')}: ${meetup.title}, ${meetup.when}`}
        disabled={!mine && left !== undefined && left <= 0}
        onClick={() => {
          const on = toggle('joinedMeetups', meetup.id);
          toast(on ? `${t('clubs.youreIn')}: ${meetup.title}` : `Not going to ${meetup.title}`);
        }}
      >
        {mine ? <CheckGlyph size={13} /> : null}
        {mine ? t('clubs.youreIn') : t('clubs.imIn')}
      </button>
    </div>
  );
}

export function BuyRow({ buy, club, showClub }: { buy: GroupBuy; club: Group; showClub?: boolean }) {
  const t = useT();
  const toast = useToast();
  const { data, toggle } = useAppData();
  const mine = data.joinedBuys.includes(buy.id);
  const ids = [...(mine ? ['me'] : []), ...buy.joined.filter((x) => x !== 'me')];
  const n = Math.min(ids.length, buy.target);
  const enough = ids.length >= buy.target;
  const host = buy.hostId === 'me' ? 'You' : person(buy.hostId).name.split(' ')[0];
  return (
    <div className="buy-row">
      <div className="buy-row__top">
        <span className="buy-row__icon tile tone-teal" aria-hidden="true">
          <UsersGlyph size={18} />
        </span>
        <span className="buy-row__body">
          <span className="buy-row__title">{buy.title}</span>
          <span className="meta">
            {t('clubs.startedBy', { name: host })}
            {showClub ? ` · ${club.name}` : ''} · {buy.ends}
          </span>
        </span>
        <button
          type="button"
          className={`chip club-chip${mine ? ' chip--soft' : ''}`}
          aria-pressed={mine}
          aria-label={`${mine ? t('clubs.youreIn') : t('clubs.countMeIn')}: ${buy.title}`}
          onClick={() => {
            const on = toggle('joinedBuys', buy.id);
            toast(on ? `Counted in for ${buy.title}` : `Left ${buy.title}`);
          }}
        >
          {mine ? <CheckGlyph size={13} /> : null}
          {mine ? t('clubs.youreIn') : t('clubs.countMeIn')}
        </button>
      </div>
      <p className="buy-row__note">{buy.note}</p>
      <div className="buy-row__progress" role="progressbar" aria-valuemin={0} aria-valuemax={buy.target} aria-valuenow={n} aria-label={t('clubs.progress', { n, target: buy.target })}>
        <span style={{ width: `${(n / buy.target) * 100}%` }} className={enough ? 'is-done' : undefined} />
      </div>
      <span className="buy-row__count">
        <FaceStack ids={ids} size={18} max={5} />
        <b>{t('clubs.progress', { n: ids.length, target: buy.target })}</b>
        <span>· {enough ? t('clubs.enough') : t('clubs.moreNeeded', { n: buy.target - ids.length })}</span>
      </span>
    </div>
  );
}

/* ---------- Club plans as feed posts ---------- */

/** Who posted it and in which club: "Karan M. › Sunday Cricket Club". */
function PlanHead({ hostId, club, what }: { hostId: string; club: Group; what: string }) {
  const host = person(hostId);
  const work = useIdentity(hostId).work;
  return (
    <div className="feed-post__head">
      <Link to={hostId === 'me' ? '/me' : `/people/${hostId}`} aria-label={host.name}>
        <Avatar who={host} size={34} />
      </Link>
      <div className="feed-post__who">
        <span className="feed-post__line">
          <span className="feed-post__name">{hostId === 'me' ? 'You' : host.name}</span>
          <ClubTag club={club} />
        </span>
        <span className="meta">
          {work ? `${work.title} · ` : ''}
          {what}
        </span>
      </div>
    </div>
  );
}

/** The same action row as any post: votes and replies on the left, share on the right. */
function PlanActions({ id, upvotes, club, replies, title }: { id: string; upvotes: number; club: Group; replies: number; title: string }) {
  const t = useT();
  return (
    <div className="feed-post__actions">
      <Votes id={id} up={upvotes} />
      <Link to={`/clubs/${club.id}`} className="feed-action" aria-label={`${t('common.replies', { n: replies })} · ${t('clubs.post.open', { club: club.name })}`}>
        <ReplyGlyph size={20} />
        {replies}
      </Link>
      <span className="grow" />
      <ShareButton title={title} path={`/clubs/${club.id}`} />
    </div>
  );
}

/** A meetup someone planned in a club, as it appears in the Home feed. */
export function MeetupPost({ meetup, club }: { meetup: Meetup; club: Group }) {
  const t = useT();
  const toast = useToast();
  const { data, toggle } = useAppData();
  const mine = data.joinedMeetups.includes(meetup.id);
  const ids = [...(mine ? ['me'] : []), ...meetup.going.filter((x) => x !== 'me')];
  const left = meetup.spots ? meetup.spots - ids.length : undefined;
  const [day, time] = splitWhen(meetup.when);
  return (
    <article className="feed-post plan-post">
      <PlanHead hostId={meetup.hostId} club={club} what={t('clubs.post.meetup')} />
      <Link to={`/clubs/${club.id}`} className="plan-post__card">
        <span className={`meetup-row__when tone-${club.tone}`} aria-hidden="true">
          <b>{day}</b>
          {time ? <small>{time}</small> : null}
        </span>
        <span className="plan-post__body">
          <span className="plan-post__title">{meetup.title}</span>
          <span className="meta plan-post__where">
            <PinGlyph size={12} />
            {meetup.where}
          </span>
        </span>
      </Link>
      {meetup.note ? <p className="feed-post__text">{meetup.note}</p> : null}
      <div className="plan-post__join">
        <button
          type="button"
          className={`chip club-chip${mine ? ' chip--soft' : ''}`}
          aria-pressed={mine}
          disabled={!mine && left !== undefined && left <= 0}
          onClick={() => {
            const on = toggle('joinedMeetups', meetup.id);
            toast(on ? `${t('clubs.youreIn')}: ${meetup.title}` : `Not going to ${meetup.title}`);
          }}
        >
          {mine ? <CheckGlyph size={13} /> : null}
          {mine ? t('clubs.youreIn') : t('clubs.imIn')}
        </button>
        <span className="plan-post__who">
          <FaceStack ids={ids} size={18} max={4} />
          {t('clubs.goingCount', { n: ids.length })}
          {left !== undefined ? ` · ${left > 0 ? t('clubs.spotsLeft', { n: left }) : t('clubs.full')}` : ''}
        </span>
      </div>
      <PlanActions id={meetup.id} upvotes={meetup.upvotes ?? 0} club={club} replies={meetup.replies ?? 0} title={meetup.title} />
    </article>
  );
}

/** A group buy someone started in a club, as it appears in the Home feed. */
export function BuyPost({ buy, club }: { buy: GroupBuy; club: Group }) {
  const t = useT();
  const toast = useToast();
  const { data, toggle } = useAppData();
  const mine = data.joinedBuys.includes(buy.id);
  const ids = [...(mine ? ['me'] : []), ...buy.joined.filter((x) => x !== 'me')];
  const n = Math.min(ids.length, buy.target);
  const enough = ids.length >= buy.target;
  return (
    <article className="feed-post plan-post">
      <PlanHead hostId={buy.hostId} club={club} what={`${t('clubs.post.buy')} · ${buy.ends}`} />
      <span className="plan-post__title plan-post__title--lg">{buy.title}</span>
      <p className="feed-post__text" style={{ marginTop: -4 }}>
        {buy.note}
      </p>
      <div className="buy-row__progress" role="progressbar" aria-valuemin={0} aria-valuemax={buy.target} aria-valuenow={n} aria-label={t('clubs.progress', { n, target: buy.target })}>
        <span style={{ width: `${(n / buy.target) * 100}%` }} className={enough ? 'is-done' : undefined} />
      </div>
      <div className="plan-post__join">
        <button
          type="button"
          className={`chip club-chip${mine ? ' chip--soft' : ''}`}
          aria-pressed={mine}
          onClick={() => {
            const on = toggle('joinedBuys', buy.id);
            toast(on ? `Counted in for ${buy.title}` : `Left ${buy.title}`);
          }}
        >
          {mine ? <CheckGlyph size={13} /> : null}
          {mine ? t('clubs.youreIn') : t('clubs.countMeIn')}
        </button>
        <span className="plan-post__who">
          <FaceStack ids={ids} size={18} max={4} />
          {t('clubs.progress', { n: ids.length, target: buy.target })} · {enough ? t('clubs.post.enough') : t('clubs.moreNeeded', { n: buy.target - ids.length })}
        </span>
      </div>
      <PlanActions id={buy.id} upvotes={buy.upvotes ?? 0} club={club} replies={buy.replies ?? 0} title={buy.title} />
    </article>
  );
}

/** Photo tile for discovering clubs. */
export function ClubTile({ club }: { club: Group }) {
  const t = useT();
  const { has } = useAppData();
  return (
    <Link to={`/clubs/${club.id}`} className="club-tile">
      <Cover src={clubPhoto(club)} glyph={club.glyph} tone={club.tone} className="club-tile__photo">
        <span className="photo-pill" style={{ left: 8, top: 8 }}>
          <NamedGlyph name={KIND_META[club.kind].glyph} size={12} />
          {t(`clubs.kind.${club.kind}`)}
        </span>
      </Cover>
      <span className="club-tile__name">{club.name}</span>
      <span className="meta">
        {t('clubs.members', { n: compact(memberCount(club, has('joinedGroups', club.id))) })} · {club.area}
      </span>
    </Link>
  );
}

/* ---------- Planning: meetups and group buys ---------- */

export type PlanMode = 'meetup' | 'buy';

/** Pick which of your clubs to plan with. */
export function ClubPickerSheet({ mode, open, onClose, onPick }: { mode: PlanMode; open: boolean; onClose: () => void; onPick: (club: Group) => void }) {
  const t = useT();
  const { data } = useAppData();
  const mine = allClubs(data).filter((c) => data.joinedGroups.includes(c.id));
  return (
    <Sheet open={open} onClose={onClose} title={t(`clubs.pickTitle.${mode}`)}>
      {mine.length ? (
        <div className="list">
          {mine.map((c) => (
            <button key={c.id} type="button" className="list-row" onClick={() => onPick(c)}>
              <Cover src={clubPhoto(c)} glyph={c.glyph} tone={c.tone} className="club-row__thumb" />
              <span className="list-row__body">
                <span className="list-row__title">{c.name}</span>
                <span className="list-row__meta">{c.area}</span>
              </span>
              <ChevronRightGlyph size={16} />
            </button>
          ))}
        </div>
      ) : (
        <p className="body-sm muted">{t('clubs.pickEmpty')}</p>
      )}
    </Sheet>
  );
}

/** The form for a meetup or a group buy, posted into one club. */
export function PlanSheet({ mode, club, open, onClose, onDone }: { mode: PlanMode; club?: Group; open: boolean; onClose: () => void; onDone?: (club: Group) => void }) {
  const t = useT();
  const toast = useToast();
  const { addMeetup, addBuy } = useAppData();
  const [title, setTitle] = useState('');
  const [when, setWhen] = useState('');
  const [where, setWhere] = useState('');
  const [note, setNote] = useState('');
  const [spots, setSpots] = useState('');
  const [target, setTarget] = useState('5');
  const [ends, setEnds] = useState('');

  const reset = () => {
    setTitle('');
    setWhen('');
    setWhere('');
    setNote('');
    setSpots('');
    setTarget('5');
    setEnds('');
  };

  const ready = mode === 'meetup' ? title.trim() && when.trim() && where.trim() : title.trim() && note.trim() && Number(target) >= 2;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!club || !ready) return;
    const id = `${mode === 'meetup' ? 'm' : 'b'}-mine-${Date.now()}`;
    if (mode === 'meetup') {
      addMeetup(club.id, {
        id,
        title: title.trim(),
        when: when.trim(),
        where: where.trim(),
        hostId: 'me',
        going: [],
        spots: Number(spots) > 0 ? Number(spots) : undefined,
        note: note.trim() || undefined,
      });
      toast(t('clubs.posted.meetup', { title: title.trim() }));
    } else {
      addBuy(club.id, { id, title: title.trim(), hostId: 'me', note: note.trim(), target: Math.max(2, Number(target)), joined: [], ends: ends.trim() ? `Open until ${ends.trim()}` : 'Open' });
      toast(t('clubs.posted.buy'));
    }
    reset();
    onClose();
    onDone?.(club);
  };

  return (
    <Sheet open={open} onClose={onClose} title={t(`clubs.form.${mode}`)}>
      {club ? <p className="meta">{t('clubs.form.in', { club: club.name })}</p> : null}
      <form className="stack club-form" onSubmit={submit}>
        <label className="field">
          <span className="field__label">{mode === 'meetup' ? t('clubs.form.what') : t('clubs.form.buyWhat')}</span>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={mode === 'meetup' ? t('clubs.form.whatHint') : t('clubs.form.buyWhatHint')} required />
        </label>
        {mode === 'meetup' ? (
          <>
            <div className="grid-2">
              <label className="field">
                <span className="field__label">{t('clubs.form.when')}</span>
                <input className="input" value={when} onChange={(e) => setWhen(e.target.value)} placeholder={t('clubs.form.whenHint')} required />
              </label>
              <label className="field">
                <span className="field__label">{t('clubs.form.spots')}</span>
                <input className="input" type="number" inputMode="numeric" min={2} max={200} value={spots} onChange={(e) => setSpots(e.target.value)} placeholder="12" />
              </label>
            </div>
            <label className="field">
              <span className="field__label">{t('clubs.form.where')}</span>
              <input className="input" value={where} onChange={(e) => setWhere(e.target.value)} placeholder={t('clubs.form.whereHint')} required />
            </label>
            <label className="field">
              <span className="field__label">{t('clubs.form.note')}</span>
              <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('clubs.form.noteHint')} />
            </label>
            <p className="field__hint">{t('clubs.form.meetupRule')}</p>
          </>
        ) : (
          <>
            <label className="field">
              <span className="field__label">{t('clubs.form.buyWhy')}</span>
              <textarea className="textarea" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('clubs.form.buyWhyHint')} required />
            </label>
            <div className="grid-2">
              <label className="field">
                <span className="field__label">{t('clubs.form.target')}</span>
                <input className="input" type="number" inputMode="numeric" min={2} max={500} value={target} onChange={(e) => setTarget(e.target.value)} required />
              </label>
              <label className="field">
                <span className="field__label">{t('clubs.form.ends')}</span>
                <input className="input" value={ends} onChange={(e) => setEnds(e.target.value)} placeholder={t('clubs.form.endsHint')} />
              </label>
            </div>
            <p className="field__hint">{t('clubs.buyingNote')}</p>
          </>
        )}
        <button type="submit" className="btn btn--primary btn--block" disabled={!ready}>
          {t('clubs.form.post')}
        </button>
      </form>
    </Sheet>
  );
}
