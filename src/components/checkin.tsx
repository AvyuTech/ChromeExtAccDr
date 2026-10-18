import { Link } from 'react-router-dom';
import { itemPhoto } from '../assets/photos';
import { person } from '../data/core';
import { placeById } from '../data/places';
import type { CheckIn, Verdict } from '../data/types';
import { useT } from '../i18n';
import { GoodGlyph, MustGlyph, NamedGlyph, SkipGlyph, type GlyphProps } from '../icons';
import { VERDICT_META } from './friends';
import { Avatar, Cover } from './cards';
import type { ComponentType } from 'react';

/* Pieces used by the quick check-in composer and the check-in detail page. */

const VERDICTS: Array<{ id: Verdict; G: ComponentType<GlyphProps>; sub: string }> = [
  { id: 'must', G: MustGlyph, sub: 'checkin.must.sub' },
  { id: 'good', G: GoodGlyph, sub: 'checkin.good.sub' },
  { id: 'skip', G: SkipGlyph, sub: 'checkin.skip.sub' },
];

/** Three big one-tap verdict buttons: Must try / Good / Skip. */
export function VerdictPicker({ value, onChange }: { value: Verdict | null; onChange: (v: Verdict) => void }) {
  const t = useT();
  const label = (v: Verdict) => t(`checkin.${v}`);
  return (
    <div className="verdict-picker" role="radiogroup" aria-label={t('checkin.verdict')}>
      {VERDICTS.map(({ id, G, sub }) => {
        const on = value === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={on}
            className={`verdict-option tone-${VERDICT_META[id].tone}`}
            onClick={() => onChange(id)}
          >
            <span className="verdict-option__glyph">
              <G size={30} active={on} duo />
            </span>
            <span className="verdict-option__label">{label(id)}</span>
            <span className="verdict-option__sub">{t(sub)}</span>
          </button>
        );
      })}
    </div>
  );
}

/** A compact check-in row linking to its detail page. */
export function CheckInRow({ c, showAuthor = true }: { c: CheckIn; showAuthor?: boolean }) {
  const place = c.placeId ? placeById(c.placeId) : undefined;
  const meta = VERDICT_META[c.verdict];
  const who = person(c.authorId);
  return (
    <Link to={`/checkin/${c.id}`} className="list-row glyph-host">
      {showAuthor ? (
        <Avatar who={{ ...who, verified: false }} size={40} />
      ) : (
        <Cover
          src={itemPhoto(c.items[0], c.placeId, c.eventId)}
          glyph={place?.glyph ?? (c.kind === 'ate' ? 'food' : 'events')}
          tone={place?.tone ?? (c.kind === 'ate' ? 'peach' : 'teal')}
          className="checkin-row__thumb"
        />
      )}
      <span className="list-row__body">
        <span className="list-row__title">{c.items.join(', ')}</span>
        <span className="list-row__meta">
          {showAuthor ? `${c.authorId === 'me' ? 'You' : who.name} · ` : ''}
          {c.placeName} · {c.ago}
        </span>
      </span>
      <span className={`tile tile--round tone-${meta.tone}`} style={{ width: 32, height: 32 }} aria-label={c.verdict === 'must' ? 'Must try' : c.verdict === 'good' ? 'Good' : 'Skip'}>
        <NamedGlyph name={meta.glyph} size={16} />
      </span>
    </Link>
  );
}
