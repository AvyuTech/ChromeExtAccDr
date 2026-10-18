import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { HeroRow, useBoardContext } from '../components/helpful';
import { TabStrip } from '../components/people';
import { EmptyState, PageHeader } from '../components/ui';
import { HELP_TOPICS, type HelpTopic } from '../data/helpful';
import { leaderboard, SORT_LABEL, type BoardPeriod, type BoardScope, type BoardSort } from '../lib/helpful';
import { useSettings } from '../state/settings';

const SCOPES: BoardScope[] = ['city', 'area', 'clubs', 'friends'];
const SORTS: BoardSort[] = ['points', 'answers', 'pages', 'fixes', 'meetups', 'rising'];

const MONTH = new Date().toLocaleString('en-IN', { month: 'long' });

/** City heroes: who helps most, sliced by where, when, what and how. */
export default function Heroes() {
  const { settings } = useSettings();
  const ctx = useBoardContext();
  const [params, setParams] = useSearchParams();
  const scope: BoardScope = SCOPES.includes(params.get('scope') as BoardScope) ? (params.get('scope') as BoardScope) : 'city';
  const [period, setPeriod] = useState<BoardPeriod>('month');
  const [sortBy, setSortBy] = useState<BoardSort>('points');
  const [topic, setTopic] = useState<HelpTopic | undefined>();

  const scopeLabel: Record<BoardScope, string> = {
    area: ctx.meArea ?? 'My area',
    city: settings.location.city,
    clubs: 'My clubs',
    friends: 'Friends',
  };
  const effectivePeriod: BoardPeriod = sortBy === 'rising' ? 'month' : period;
  const rows = leaderboard({ scope, period: effectivePeriod, sortBy, topic }, ctx);
  const shown = rows.slice(0, 20);
  const mine = rows.find((r) => r.personId === 'me');
  const mineShown = shown.some((r) => r.personId === 'me');

  return (
    <>
      <PageHeader title="City heroes" sub={`${settings.location.city} · ${MONTH} season`} fallback="/me" />
      <main className="page page--with-header heroes">
        <p className="heroes__intro">
          The people whose answers, tips and fixes helped the most. Points only come from neighbours who were helped.{' '}
          <Link to="/me/impact#how">How points work</Link>
        </p>

        <TabStrip
          idPrefix="heroes"
          label="Where"
          value={scope}
          onChange={(v) => setParams(v === 'city' ? {} : { scope: v }, { replace: true })}
          tabs={SCOPES.map((s) => ({ id: s, label: scopeLabel[s] }))}
        />

        <div className="chip-row heroes__sorts" role="group" aria-label="Rank by">
          {SORTS.map((s) => (
            <button key={s} type="button" className="chip chip--sm" aria-pressed={sortBy === s} onClick={() => setSortBy(s)}>
              {SORT_LABEL[s]}
            </button>
          ))}
        </div>
        <div className="chip-row heroes__topics" role="group" aria-label="Topic">
          <button type="button" className="chip chip--sm chip--quiet" aria-pressed={!topic} onClick={() => setTopic(undefined)}>
            All topics
          </button>
          {HELP_TOPICS.map((tp) => (
            <button key={tp} type="button" className="chip chip--sm chip--quiet" aria-pressed={topic === tp} onClick={() => setTopic(topic === tp ? undefined : tp)}>
              {tp}
            </button>
          ))}
        </div>

        <div id="heroes-panel" role="tabpanel" aria-labelledby={`heroes-tab-${scope}`}>
          <div className="heroes__bar">
            <span className="meta strong">
              {rows.length} {rows.length === 1 ? 'person' : 'people'}
              {topic ? ` · ${topic}` : ''}
            </span>
            <div className="heroes__period" role="radiogroup" aria-label="Period">
              {(['month', 'all'] as const).map((p) => (
                <button key={p} type="button" role="radio" aria-checked={effectivePeriod === p} disabled={sortBy === 'rising' && p === 'all'} onClick={() => setPeriod(p)}>
                  {p === 'month' ? 'This month' : 'All time'}
                </button>
              ))}
            </div>
          </div>

          {shown.length ? (
            <div className="hero-list">
              {shown.map((r) => (
                <HeroRow key={r.personId} row={r} sortBy={sortBy} me={r.personId === 'me'} />
              ))}
            </div>
          ) : (
            <EmptyState
              glyph="friends"
              title="No one here yet"
              body={topic ? `Nobody in ${scopeLabel[scope]} has been thanked for ${topic.toLowerCase()} ${effectivePeriod === 'month' ? 'this month' : 'yet'}.` : 'Help someone and you could be the first.'}
            />
          )}

          {mine && !mineShown ? (
            <div className="hero-list hero-list--you">
              <HeroRow row={mine} sortBy={sortBy} me />
            </div>
          ) : null}
          {!mine && shown.length ? (
            <p className="heroes__you meta">
              {ctx.hideMe ? (
                <>
                  You’re hidden from boards. <Link to="/settings/privacy">Privacy settings</Link>
                </>
              ) : (
                <>
                  You’re not on this board yet. <Link to="/me/impact#how">How to earn points</Link>
                </>
              )}
            </p>
          ) : null}
        </div>

        <p className="heroes__note meta">
          Seasons reset on the 1st; levels never reset. Only verified residents are ranked, and nobody can pay to appear here.
        </p>
      </main>
    </>
  );
}
