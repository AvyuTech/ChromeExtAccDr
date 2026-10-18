import { Link } from 'react-router-dom';
import { neighbourhoodName, person } from '../data/core';
import { helpfulOf, REQUIREMENT_LABEL, type LevelId } from '../data/helpful';
import { CheckGlyph, ChevronRightGlyph, StarGlyph } from '../icons';
import { compact } from '../lib/format';
import { expertTopic, levelFor, metricUnit, rankOf, topStrengths, type BoardContext, type BoardRow, type BoardSort, type LevelInfo } from '../lib/helpful';
import { useAppData } from '../state/appData';
import { useSettings } from '../state/settings';
import { Avatar } from './cards';
import { useIdentity } from './identity';

/** Your side of the boards: identity, home, follows and clubs from this device. */
export function useBoardContext(): BoardContext {
  const { settings } = useSettings();
  const { data } = useAppData();
  const meIdentity = useIdentity('me');
  return {
    meIdentity,
    meArea: neighbourhoodName(settings.location.home),
    hideMe: !settings.privacy.showOnBoards,
    following: data.following,
    clubIds: data.joinedGroups,
    extraClubs: data.myClubs,
  };
}

/** Anyone's level, with your own checks taken from Settings. */
export function useLevel(personId: string): LevelInfo {
  const identity = useIdentity(personId);
  return levelFor(personId, identity);
}

/** "Local expert in Food", "Nearhood guide", "City hero". */
export function levelTitle(personId: string, info: LevelInfo, topic?: string) {
  if (info.level.id === 'expert') {
    const t = expertTopic(personId, topic, info);
    return t ? `Local expert in ${t}` : 'Local expert';
  }
  return info.level.name;
}

function LevelMark({ id, size = 11 }: { id: LevelId; size?: number }) {
  return id === 'hero' ? <StarGlyph size={size} /> : null;
}

/**
 * A tiny neutral tag next to a name in feeds and replies. Quiet on purpose: only
 * Local experts (in the topic at hand), guides and city heroes get one.
 */
export function LevelTag({ personId, topic }: { personId: string; topic?: string }) {
  const info = useLevel(personId);
  if (info.index < 3) return null;
  let label: string;
  if (info.level.id === 'expert') {
    const t = expertTopic(personId, topic, info);
    if (!t) return null;
    label = `Local expert · ${t}`;
  } else {
    label = info.level.id === 'guide' ? 'Guide' : 'City hero';
  }
  return (
    <span className={`level-tag level-tag--${info.level.id}`}>
      <LevelMark id={info.level.id} size={10} />
      {label}
    </span>
  );
}

/** The level as a badge, for profiles. */
export function LevelBadge({ personId }: { personId: string }) {
  const info = useLevel(personId);
  return (
    <span className={`level-badge level-badge--${info.level.id}`}>
      <LevelMark id={info.level.id} size={12} />
      {levelTitle(personId, info)}
    </span>
  );
}

/** "520 helpful" */
export function HelpfulStat({ personId, period = 'all' }: { personId: string; period?: 'all' | 'month' }) {
  const rec = helpfulOf(personId);
  const n = period === 'month' ? rec.thisMonth : rec.lifetime;
  return (
    <span className="helpful-stat">
      <b className="num">{n.toLocaleString('en-IN')}</b> helpful{period === 'month' ? ' this month' : ''}
    </span>
  );
}

/** A bar to the next level, and the checks still missing for it. */
export function LevelProgress({ personId, checklist }: { personId: string; checklist?: boolean }) {
  const info = useLevel(personId);
  const mine = personId === 'me';
  if (!info.next) {
    return <p className="level-progress__done meta">Top level. Seasons keep the boards fresh; the level stays.</p>;
  }
  const pct = Math.round(info.progress * 100);
  return (
    <div className="level-progress">
      <div className="level-progress__head">
        <span>
          <b>{info.level.name}</b> → {info.next.name}
        </span>
        <span className="meta num">
          {info.points.toLocaleString('en-IN')} / {info.next.min.toLocaleString('en-IN')}
        </span>
      </div>
      <div className="progress level-progress__bar" role="progressbar" aria-label={`Progress to ${info.next.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
        <span style={{ width: `${pct}%` }} />
      </div>
      <span className="meta">
        {info.toNext > 0 ? `${info.toNext.toLocaleString('en-IN')} more helpful points` : 'Enough points'}
        {info.missing.length ? ` · still needs: ${info.missing.map((r) => REQUIREMENT_LABEL[r]).join(', ')}` : ''}
      </span>
      {checklist ? (
        <ul className="level-checks">
          <li className={info.toNext === 0 ? 'is-done' : ''}>
            <span className="level-checks__mark">{info.toNext === 0 ? <CheckGlyph size={11} /> : null}</span>
            {info.next.min.toLocaleString('en-IN')} helpful points
          </li>
          {info.next.needs.map((r) => {
            const done = !info.missing.includes(r);
            return (
              <li key={r} className={done ? 'is-done' : ''}>
                <span className="level-checks__mark">{done ? <CheckGlyph size={11} /> : null}</span>
                <span className="grow">{REQUIREMENT_LABEL[r]}</span>
                {!done && mine && (r === 'govId' || r === 'address' || r === 'phone') ? (
                  <Link to="/settings/identity" className="section__link">
                    Verify
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

/** Topics someone's help has landed in, strongest first. */
export function KnownFor({ personId, n = 3 }: { personId: string; n?: number }) {
  const top = topStrengths(personId, n);
  if (!top.length) return null;
  return (
    <div className="known-for">
      <span className="known-for__label">Known for</span>
      {top.map((s) => (
        <Link key={s.topic} to={`/ask?q=${encodeURIComponent(s.topic)}`} className="known-for__chip">
          {s.topic}
          <span className="num">{compact(s.points)}</span>
        </Link>
      ))}
    </div>
  );
}

/**
 * One line on a profile: level, helpful points and where they stand this month.
 * Yours opens your impact; anyone else's opens the board.
 */
export function HelpfulLine({ personId }: { personId: string }) {
  const info = useLevel(personId);
  const ctx = useBoardContext();
  const area = personId === 'me' ? ctx.meArea : person(personId).area;
  const rank = rankOf(personId, { scope: 'area', area, period: 'month', sortBy: 'points' }, ctx);
  const mine = personId === 'me';
  return (
    <Link to={mine ? '/me/impact' : '/heroes'} className={`helpful-line level-line--${info.level.id}`}>
      <span className="helpful-line__row">
        <span className="helpful-line__level">
          <LevelMark id={info.level.id} size={12} />
          {levelTitle(personId, info)}
        </span>
        <span className="grow">
          · {info.points.toLocaleString('en-IN')} helpful
          {rank ? ` · #${rank.rank} in ${area} this month` : ''}
        </span>
        <ChevronRightGlyph size={14} />
      </span>
      {mine && info.next ? (
        <span className="helpful-line__next">
          <span className="helpful-line__bar" aria-hidden="true">
            <span style={{ width: `${Math.round(info.progress * 100)}%` }} />
          </span>
          <span className="meta">
            {info.toNext > 0 ? `${info.toNext} to ${info.next.name}` : `Needs: ${info.missing.length ? REQUIREMENT_LABEL[info.missing[0]] : 'one more check'}`}
          </span>
        </span>
      ) : null}
    </Link>
  );
}

/** A leaderboard row: rank, face, name and level, then the number it's sorted by. */
export function HeroRow({ row, sortBy, me }: { row: BoardRow; sortBy: BoardSort; me?: boolean }) {
  const { settings } = useSettings();
  const who = person(row.personId);
  const area = row.personId === 'me' ? neighbourhoodName(settings.location.home) : who.area;
  const top = topStrengths(row.personId, 1)[0];
  const name = row.personId === 'me' ? 'You' : who.name;
  return (
    <Link to={row.personId === 'me' ? '/me/impact' : `/people/${row.personId}`} className={`hero-row${me ? ' hero-row--me' : ''}${row.rank <= 3 ? ' hero-row--top' : ''}`}>
      <span className="hero-row__rank num">{row.rank}</span>
      <Avatar who={{ ...who, verified: false }} size={38} />
      <span className="hero-row__body">
        <span className="hero-row__name">
          {name}
          <span className={`level-tag level-tag--${row.level.level.id}`}>
            <LevelMark id={row.level.level.id} size={10} />
            {row.level.level.id === 'guide' ? 'Guide' : row.level.level.name}
          </span>
        </span>
        <span className="meta">
          {area}
          {top ? ` · ${top.topic}` : ''}
        </span>
      </span>
      <span className="hero-row__value">
        <b className="num">
          {sortBy === 'rising' ? '+' : ''}
          {row.value.toLocaleString('en-IN')}
        </b>
        <span className="meta">
          {sortBy === 'rising' ? 'on last month' : metricUnit(sortBy, row.value)}
        </span>
      </span>
    </Link>
  );
}
