import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AnswerCard } from '../components/cards';
import { ResultList } from '../components/discover';
import { EmptyState, SectionHead } from '../components/ui';
import { neighbourhoodName } from '../data/core';
import { eventById } from '../data/events';
import { placeById } from '../data/places';
import { useT } from '../i18n';
import { BackGlyph, ClockGlyph, CloseGlyph, MicLineGlyph, SearchGlyph, SparkGlyph } from '../icons';
import { ask, SUGGESTED_QUESTIONS, type AskResult, type ResultRef } from '../lib/askEngine';
import { stripBold } from '../lib/format';
import { useAppData } from '../state/appData';
import { useLiveCity } from '../state/live';
import { enabledSources, useSettings } from '../state/settings';

const THINK_MS = 600;

function prefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** Does a result survive the chosen filter chip? Rows that don't apply to a chip are hidden by it. */
function passes(ref: ResultRef, filter: string, radiusKm: number) {
  if (filter === 'All') return true;
  if (ref.type === 'event') {
    const e = eventById(ref.id);
    if (!e) return false;
    if (filter === 'Events') return e.category !== 'food';
    if (filter === 'Food') return e.category === 'food' || e.category === 'market';
    if (filter === 'Free') return e.price === 0;
    if (filter.startsWith('Within')) return e.distanceKm <= radiusKm;
    return true;
  }
  if (ref.type === 'place') {
    const p = placeById(ref.id);
    if (!p) return false;
    if (filter === 'Open now') return p.openNow;
    if (filter.startsWith('Within')) return p.distanceKm <= radiusKm;
    if (filter === '₹₹ or less') return p.price <= 2;
    if (filter === 'Free') return p.price === 1;
    if (filter === 'Food') return p.category === 'food' || p.category === 'cafe';
    return true;
  }
  return filter === 'All';
}

function filterLabel(f: string, radiusKm: number) {
  return f.startsWith('Within') ? `Within ${radiusKm} km` : f;
}

export default function Ask() {
  const t = useT();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  const { settings, update } = useSettings();
  const { data, rememberSearch, clearSearches } = useAppData();
  const pulse = useLiveCity();
  const [input, setInput] = useState(q);
  const [filter, setFilter] = useState('All');
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const radiusKm = settings.location.radiusKm;
  const instant = settings.accessibility.reduceMotion || prefersReducedMotion();

  // New question: sync the field, reset filters, remember it and show a short "checking" beat.
  useEffect(() => {
    setInput(q);
    setFilter('All');
    if (!q) return;
    rememberSearch(q);
    if (instant) return;
    setThinking(true);
    const id = window.setTimeout(() => setThinking(false), THINK_MS);
    return () => window.clearTimeout(id);
  }, [q, instant, rememberSearch]);

  useEffect(
    () => () => {
      try {
        window.speechSynthesis?.cancel();
      } catch {
        /* speech not available */
      }
    },
    [],
  );

  const result: AskResult | null = useMemo(() => {
    if (!q) return null;
    return ask(q, {
      sourceAllowed: enabledSources(settings),
      showUnconfirmed: settings.sources.showUnconfirmed,
      minAgreement: settings.sources.minAgreement,
      length: settings.ai.length,
      pulse,
      homeArea: neighbourhoodName(settings.location.home),
      following: data.following,
    });
  }, [q, settings, pulse, data.following]);

  const visible = useMemo(() => (result ? result.results.filter((r) => passes(r, filter, radiusKm)) : []), [result, filter, radiusKm]);

  const go = (text: string) => {
    const next = text.trim();
    if (!next) return;
    setParams({ q: next });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    go(input);
  };

  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const listen = () => {
    if (!result || !canSpeak) return;
    try {
      if (speaking) {
        window.speechSynthesis.cancel();
        setSpeaking(false);
        return;
      }
      const u = new SpeechSynthesisUtterance(stripBold(result.answer));
      u.lang = settings.language === 'gu' ? 'gu-IN' : settings.language === 'hi' ? 'hi-IN' : 'en-IN';
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(u);
      setSpeaking(true);
    } catch {
      setSpeaking(false);
    }
  };

  return (
    <main className="page">
      <h1 className="sr-only">{q ? `${t('answer.label')}: ${q}` : t('answer.label')}</h1>
      <form className="row" style={{ gap: 8 }} onSubmit={onSubmit} role="search">
        <button
          type="button"
          className="icon-btn"
          aria-label={t('common.back')}
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
        >
          <BackGlyph size={20} />
        </button>
        <label className="ask-bar" htmlFor="ask-q">
          <SparkGlyph size={18} thinking={thinking} />
          <input
            id="ask-q"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('discover.ask.placeholder')}
            autoComplete="off"
            enterKeyHint="search"
            autoFocus={!q}
          />
          {input ? (
            <button type="button" className="ask-bar__clear" aria-label={t('discover.ask.clear')} onClick={() => setInput('')}>
              <CloseGlyph size={16} />
            </button>
          ) : null}
          <button type="submit" className="ask-bar__go" aria-label={t('common.search')}>
            <SearchGlyph size={16} />
          </button>
        </label>
      </form>

      {!result ? (
        <>
          {data.recentSearches.length > 0 ? (
            <section className="section" aria-labelledby="recent-title">
              <div className="section__head">
                <h2 className="section__title" id="recent-title">
                  {t('discover.ask.recent')}
                </h2>
                <button type="button" className="btn btn--ghost btn--sm" style={{ color: 'var(--accent)' }} onClick={clearSearches}>
                  {t('discover.ask.clear')}
                </button>
              </div>
              <div className="list">
                {data.recentSearches.map((s) => (
                  <button key={s} type="button" className="list-row" onClick={() => go(s)}>
                    <span className="tile tone-violet" style={{ width: 32, height: 32, borderRadius: 10 }}>
                      <ClockGlyph size={17} />
                    </span>
                    <span className="list-row__body">
                      <span className="list-row__title" style={{ fontWeight: 500 }}>
                        {s}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}
          <section className="section" aria-labelledby="try-title">
            <h2 className="section__title" id="try-title">
              {t('discover.ask.try')}
            </h2>
            <div className="chip-wrap">
              {SUGGESTED_QUESTIONS.map((s) => (
                <button key={s} type="button" className="chip chip--soft" onClick={() => go(s)}>
                  {s}
                </button>
              ))}
            </div>
          </section>
        </>
      ) : (
        <>
          {result.filters.length > 0 ? (
            <div className="chip-row" role="group" aria-label="Filter results">
              {result.filters.map((f) => (
                <button key={f} type="button" className="chip chip--accent" aria-pressed={filter === f} onClick={() => setFilter(f)}>
                  {f === 'All' ? t('discover.ask.all', { n: result.results.length }) : filterLabel(f, radiusKm)}
                </button>
              ))}
            </div>
          ) : null}

          {thinking ? (
            <section className="answer-card ask-thinking" aria-busy="true" aria-label={t('discover.ask.thinking')}>
              <div className="row" style={{ gap: 8 }}>
                <span className="tile tone-solid" style={{ width: 34, height: 34, borderRadius: 11 }}>
                  <SparkGlyph size={18} thinking />
                </span>
                <span className="display strong" style={{ fontSize: '0.9375rem' }}>
                  {t('answer.label')}
                </span>
              </div>
              <p className="meta">{t('discover.ask.thinking')}</p>
              <span className="ask-thinking__line" />
              <span className="ask-thinking__line ask-thinking__line--short" />
            </section>
          ) : settings.ai.answers ? (
            <AnswerCard
              text={result.answer}
              sources={result.sources}
              agree={result.sources.length}
              footer={
                settings.accessibility.readAnswersAloud && canSpeak ? (
                  <button type="button" className="btn btn--soft btn--sm" style={{ alignSelf: 'flex-start' }} onClick={listen} aria-pressed={speaking}>
                    <MicLineGlyph size={16} />
                    {speaking ? t('discover.ask.stop') : t('discover.ask.listen')}
                  </button>
                ) : undefined
              }
            />
          ) : (
            <div className="notice tone-violet">
              <SparkGlyph size={18} />
              <span className="grow">
                {t('discover.ask.answersOff')}{' '}
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  style={{ height: 28, padding: '0 4px', color: 'var(--accent)' }}
                  onClick={() => update('ai', { answers: true })}
                >
                  {t('discover.ask.turnOn')}
                </button>
                ·{' '}
                <Link to="/settings/sources" style={{ fontWeight: 600 }}>
                  {t('common.settings')}
                </Link>
              </span>
            </div>
          )}

          {!thinking ? (
            <>
              {result.results.length > 0 ? (
                <section className="section fade-up" aria-labelledby="results-title">
                  <SectionHead id="results-title" title={result.heading} />
                  {visible.length ? (
                    <ResultList refs={visible} pulse={pulse} />
                  ) : (
                    <EmptyState
                      glyph="spark"
                      title={t('discover.ask.noResults')}
                      action={
                        <button type="button" className="btn btn--soft btn--sm" onClick={() => setFilter('All')}>
                          {t('discover.ask.all', { n: result.results.length })}
                        </button>
                      }
                    />
                  )}
                </section>
              ) : null}

              {settings.ai.followUps && result.followUps.length > 0 ? (
                <section className="stack" style={{ gap: 8 }} aria-labelledby="follow-title">
                  <span id="follow-title" className="strong muted" style={{ fontSize: '0.8125rem' }}>
                    {t('discover.ask.followUp')}
                  </span>
                  <div className="chip-wrap">
                    {result.followUps.map((f) => (
                      <button key={f.label} type="button" className="chip chip--soft" onClick={() => go(f.query)}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          ) : null}
        </>
      )}
    </main>
  );
}
