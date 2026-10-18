import { useEffect, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Avatar } from '../components/cards';
import { KnownFor, LevelProgress, useBoardContext, useLevel } from '../components/helpful';
import { PageHeader } from '../components/ui';
import { person } from '../data/core';
import { HELPFUL, LEVELS, MY_LEDGER, type LedgerEntry } from '../data/helpful';
import { ChevronRightGlyph, ClockGlyph, ListsGlyph, PinGlyph, ReportGlyph, SparkGlyph, UpvoteGlyph } from '../icons';
import { rankOf } from '../lib/helpful';
import { EarnTable, FairPlayList, HelpfulInfo, LevelLadder } from '../components/helpGuide';

const KIND_ICON: Record<NonNullable<LedgerEntry['kind']>, ReactNode> = {
  upvotes: <UpvoteGlyph size={15} />,
  report: <ReportGlyph size={15} />,
  opening: <PinGlyph size={15} />,
  list: <ListsGlyph size={15} />,
};

function LedgerRow({ e }: { e: LedgerEntry }) {
  const from = e.fromId ? person(e.fromId) : undefined;
  const body = (
    <>
      {from ? (
        <Avatar who={{ ...from, verified: false }} size={30} />
      ) : (
        <span className="ledger-row__icon" aria-hidden="true">
          {e.kind ? KIND_ICON[e.kind] : <SparkGlyph size={15} />}
        </span>
      )}
      <span className="ledger-row__body">
        <span className="ledger-row__what">{e.what}</span>
        {e.about ? <span className="ledger-row__about">“{e.about}”</span> : null}
        <span className="meta">
          {e.topic ? `${e.topic} · ` : ''}
          {e.ago}
          {e.note ? ` · ${e.note}` : ''}
        </span>
      </span>
      <span className={`ledger-row__pts num${e.points < 0 ? ' is-neg' : ''}`}>
        {e.points > 0 ? '+' : ''}
        {e.points}
      </span>
    </>
  );
  return e.to ? (
    <Link to={e.to} className="ledger-row">
      {body}
    </Link>
  ) : (
    <div className="ledger-row">{body}</div>
  );
}

/** Your impact: level, what you've earned and why, and how the whole system works. */
export default function Impact() {
  const { hash } = useLocation();
  const ctx = useBoardContext();
  const info = useLevel('me');
  const rec = HELPFUL.me;
  const rank = rankOf('me', { scope: 'area', period: 'month', sortBy: 'points' }, ctx);
  const cityRank = rankOf('me', { scope: 'city', period: 'month', sortBy: 'points' }, ctx);
  const month = MY_LEDGER.filter((e) => e.thisMonth);
  const earlier = MY_LEDGER.filter((e) => !e.thisMonth);
  const older = rec.lifetime - MY_LEDGER.reduce((a, e) => a + e.points, 0);

  // Links to #how land on the rules once the page has scrolled to the top.
  useEffect(() => {
    if (!hash) return;
    const id = window.setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' }), 80);
    return () => window.clearTimeout(id);
  }, [hash]);

  return (
    <>
      <PageHeader title="Your impact" sub="Helpful points and levels" fallback="/me" actions={<HelpfulInfo size={18} />} />
      <main className="page page--with-header impact">
        <section className="impact-head" aria-labelledby="impact-level">
          <div className="impact-head__top">
            <div className="stack" style={{ gap: 4, minWidth: 0 }}>
              <span className="eyebrow muted">Your level</span>
              <h2 className="impact-head__level" id="impact-level">
                {info.level.name}
              </h2>
            </div>
            <div className="impact-head__points">
              <b className="num">{info.points.toLocaleString('en-IN')}</b>
              <span className="meta">helpful points</span>
            </div>
          </div>
          <LevelProgress personId="me" checklist />
          {info.held ? <p className="notice impact-held">Your points already reach {LEVELS[info.index + 1].name}. Finish the check above and the level follows.</p> : null}
        </section>

        <div className="impact-stats">
          <div className="impact-stat">
            <b className="num">{rec.thisMonth}</b>
            <span>This month</span>
          </div>
          <Link to="/heroes?scope=area" className="impact-stat">
            <b className="num">{rank ? `#${rank.rank}` : '—'}</b>
            <span>In {ctx.meArea}</span>
          </Link>
          <Link to="/heroes?scope=city" className="impact-stat">
            <b className="num">{cityRank ? `#${cityRank.rank}` : '—'}</b>
            <span>In the city</span>
          </Link>
          <div className="impact-stat">
            <b className="num">{rec.helpfulAnswers}</b>
            <span>Helpful answers</span>
          </div>
        </div>
        {ctx.hideMe ? (
          <p className="meta">
            You’re hidden from boards, so ranks show only to you. <Link to="/settings/privacy">Change</Link>
          </p>
        ) : null}

        <KnownFor personId="me" />

        <section className="dsec" aria-labelledby="impact-history">
          <div className="dsec__head">
            <h2 className="section__title" id="impact-history">
              Points history
            </h2>
            <Link to="/heroes" className="section__link">
              City heroes
            </Link>
          </div>
          <h3 className="impact-sub">This month · {rec.thisMonth}</h3>
          <div className="ledger">
            {month.map((e) => (
              <LedgerRow key={e.id} e={e} />
            ))}
          </div>
          <h3 className="impact-sub">Earlier</h3>
          <div className="ledger">
            {earlier.map((e) => (
              <LedgerRow key={e.id} e={e} />
            ))}
            {older > 0 ? (
              <div className="ledger-row ledger-row--older">
                <span className="ledger-row__icon" aria-hidden="true">
                  <ClockGlyph size={15} />
                </span>
                <span className="ledger-row__body">
                  <span className="ledger-row__what">Older activity</span>
                  <span className="meta">Since you joined</span>
                </span>
                <span className="ledger-row__pts num">+{older}</span>
              </div>
            ) : null}
          </div>
        </section>

        <section className="dsec" id="how" aria-labelledby="impact-how">
          <h2 className="section__title" id="impact-how">
            How points work
          </h2>
          <p className="body-sm muted">You earn when someone else says you helped. Posting, replying and checking in earn nothing by themselves.</p>
          <EarnTable />
        </section>

        <section className="dsec" aria-labelledby="impact-levels">
          <h2 className="section__title" id="impact-levels">
            Levels
          </h2>
          <p className="body-sm muted">Each level needs points and a few checks, so the people with the highest levels are real, local and recently helpful.</p>
          <LevelLadder />
          <p className="meta">Levels never pay out money and never buy visibility. Businesses can’t earn points.</p>
        </section>

        <section className="dsec" aria-labelledby="impact-fair">
          <h2 className="section__title" id="impact-fair">
            Fair play
          </h2>
          <FairPlayList />
        </section>

        <Link to="/heroes" className="impact-cta">
          <span className="grow">
            <b>City heroes</b>
            <span className="meta">See who helps most in {ctx.meArea}, in your clubs and across the city</span>
          </span>
          <ChevronRightGlyph size={16} />
        </Link>
      </main>
    </>
  );
}
