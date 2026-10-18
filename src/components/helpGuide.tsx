import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EARN_RULES, FAIR_PLAY, LEVELS, PENALTIES, REQUIREMENT_LABEL } from '../data/helpful';
import { CheckGlyph, ChevronRightGlyph, InfoGlyph, StarGlyph } from '../icons';
import { useLevel } from './helpful';
import { Sheet } from './ui';

/*
  How helpful points work, end to end, in pieces that the ⓘ sheet, Your impact
  and Settings › Helpful points & levels all share, so they always say the same thing.
*/

const LOOP: Array<{ title: string; body: string; next?: boolean }> = [
  { title: 'You help', body: 'Answer a question, check in somewhere, add a page, report a city issue, host a meetup or start a group buy.' },
  { title: 'Neighbours say it helped', body: 'They mark your reply Helpful, vote it up, save something from your check-in, confirm your page or confirm a fix.' },
  { title: 'You earn helpful points', body: 'Only from verified people, at most 100 a day. Posting a lot earns nothing by itself.' },
  { title: 'Your level rises', body: 'Newcomer, Neighbour, Regular, Local expert, Nearhood guide, City hero. Each step also needs identity checks.' },
  { title: 'You stand out', body: 'Your points sit next to your followers, your level shows on your answers, and you rank on City heroes.' },
  { title: 'Help comes back', body: 'As you help more, your own questions, reports and plans will reach more local experts and neighbours.', next: true },
];

const WHERE = [
  'Your profile: helpful points next to followers, your level next to your name',
  'Answers and posts: a Local expert, Guide or City hero tag (from Local expert up, so feeds stay calm)',
  'Replies: “Most helpful” puts people known for helping higher',
  'City heroes: rankings by area, city, clubs or friends',
  'Every club: “Most helpful here”; Home: “Most helpful this month”',
  'Me › Your impact: your progress, what’s missing and every point you earned',
];

/** The six steps from helping to being helped. */
export function HelpfulLoop() {
  return (
    <ol className="help-loop">
      {LOOP.map((s, i) => (
        <li key={s.title} className={s.next ? 'is-next' : undefined}>
          <span className="help-loop__n num">{i + 1}</span>
          <span className="help-loop__body">
            <b>
              {s.title}
              {s.next ? <span className="badge badge--sm">Coming next</span> : null}
            </b>
            <span>{s.body}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Every way to earn, and the two ways to lose, points. */
export function EarnTable() {
  return (
    <div className="rule-table">
      {EARN_RULES.map((r) => (
        <div key={r.id} className="rule-row">
          <span className="rule-row__what">
            {r.what}
            {r.note ? <span className="meta">{r.note}</span> : null}
          </span>
          <span className="rule-row__pts num">+{r.points}</span>
        </div>
      ))}
      {PENALTIES.map((r) => (
        <div key={r.id} className="rule-row">
          <span className="rule-row__what">
            {r.what}
            {r.note ? <span className="meta">{r.note}</span> : null}
          </span>
          <span className="rule-row__pts num is-neg">{r.points}</span>
        </div>
      ))}
    </div>
  );
}

/** The six levels, with what each needs and unlocks; yours is marked. */
export function LevelLadder({ personId = 'me' }: { personId?: string }) {
  const info = useLevel(personId);
  return (
    <ol className="ladder">
      {LEVELS.map((l, i) => {
        const state = i < info.index ? 'is-past' : i === info.index ? 'is-now' : '';
        return (
          <li key={l.id} className={`ladder__step ${state}`}>
            <span className="ladder__mark" aria-hidden="true">
              {i < info.index ? <CheckGlyph size={11} /> : i === info.index ? <span className="ladder__dot" /> : l.id === 'hero' ? <StarGlyph size={11} /> : null}
            </span>
            <div className="ladder__body">
              <div className="ladder__head">
                <span className="ladder__name">
                  {l.name}
                  {i === info.index ? <span className="badge badge--sm">You</span> : null}
                </span>
                <span className="meta num">{l.min ? `${l.min.toLocaleString('en-IN')} pts` : 'Start'}</span>
              </div>
              {l.needs.length ? <span className="meta">Needs: {l.needs.map((r) => REQUIREMENT_LABEL[r]).join(', ')}</span> : null}
              <ul className="ladder__unlocks">
                {l.unlocks.map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function FairPlayList() {
  return (
    <ul className="fair-list">
      {FAIR_PLAY.map((f) => (
        <li key={f}>{f}</li>
      ))}
      <li>Down votes never take points away. They only sink a post and, past −4, fold it.</li>
    </ul>
  );
}

/** The whole plan on one screen: Settings › Helpful points & levels. */
export function HelpfulGuide() {
  return (
    <div className="help-guide">
      <p className="body-sm">
        Nearhood rewards being useful to other people, not posting a lot. Helpful points only come from what other verified people do with your help.
      </p>
      <section aria-labelledby="hg-loop">
        <h2 className="section__title" id="hg-loop">
          How it works, end to end
        </h2>
        <HelpfulLoop />
      </section>
      <section aria-labelledby="hg-earn">
        <h2 className="section__title" id="hg-earn">
          How you earn
        </h2>
        <EarnTable />
      </section>
      <section aria-labelledby="hg-levels">
        <h2 className="section__title" id="hg-levels">
          Levels
        </h2>
        <p className="body-sm muted">Each level needs points and a few checks, so the people with the highest levels are real, local and recently helpful.</p>
        <LevelLadder />
        <p className="meta">Levels never pay out money and never buy visibility. Businesses can’t earn points.</p>
      </section>
      <section aria-labelledby="hg-rank">
        <h2 className="section__title" id="hg-rank">
          Rankings
        </h2>
        <p className="body-sm">
          City heroes ranks verified residents by your area, the whole city, your clubs or your friends; this month or all time; by helpful points, helpful answers, pages added,
          issues fixed, meetups hosted or who’s rising. Seasons start again on the 1st; levels never reset.
        </p>
      </section>
      <section aria-labelledby="hg-where">
        <h2 className="section__title" id="hg-where">
          Where it shows
        </h2>
        <ul className="fair-list">
          {WHERE.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="hg-fair">
        <h2 className="section__title" id="hg-fair">
          Fair play
        </h2>
        <FairPlayList />
      </section>
      <div className="list list--grouped">
        <Link to="/me/impact" className="list-row">
          <span className="list-row__body">
            <span className="list-row__title">Your impact</span>
            <span className="list-row__meta">Your level, what’s missing and your points history</span>
          </span>
          <ChevronRightGlyph size={16} />
        </Link>
        <Link to="/heroes" className="list-row">
          <span className="list-row__body">
            <span className="list-row__title">City heroes</span>
            <span className="list-row__meta">Who helps most, many ways</span>
          </span>
          <ChevronRightGlyph size={16} />
        </Link>
        <Link to="/settings/privacy" className="list-row">
          <span className="list-row__body">
            <span className="list-row__title">Stay off the boards</span>
            <span className="list-row__meta">Settings › Privacy</span>
          </span>
          <ChevronRightGlyph size={16} />
        </Link>
      </div>
    </div>
  );
}

/** A small ⓘ beside any helpful number; opens the short version, with a link to the full guide. */
export function HelpfulInfo({ size = 15 }: { size?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="info-btn" aria-label="How helpful points work" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <InfoGlyph size={size} />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="How helpful points work">
        <p className="body-sm muted">You earn when someone else says you helped. Posting, replying and checking in earn nothing by themselves.</p>
        <HelpfulLoop />
        <Link to="/settings/helpful" className="btn btn--soft btn--block" onClick={() => setOpen(false)}>
          How you earn, levels and fair play
        </Link>
      </Sheet>
    </>
  );
}
