import { useState } from 'react';
import { GroupCard } from '../components/discover';
import { EmptyState, PageHeader, SectionHead } from '../components/ui';
import { GROUPS } from '../data/social';
import { useT } from '../i18n';
import { SearchGlyph } from '../icons';
import { useAppData } from '../state/appData';

type Tab = 'yours' | 'discover';

export default function Groups() {
  const t = useT();
  const { data } = useAppData();
  const [tab, setTab] = useState<Tab>(data.joinedGroups.length ? 'yours' : 'discover');
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const list = GROUPS.filter((g) => (tab === 'yours' ? data.joinedGroups.includes(g.id) : !data.joinedGroups.includes(g.id))).filter(
    (g) => !q || `${g.name} ${g.description} ${g.area}`.toLowerCase().includes(q),
  );

  // Groups in or around the person's area that they haven't joined yet.
  const suggested = GROUPS.filter((g) => !data.joinedGroups.includes(g.id))
    .sort((a, b) => b.postsToday - a.postsToday)
    .slice(0, 2);

  return (
    <>
      <PageHeader title={t('discover.groups.title')} fallback="/explore" />
      <main className="page page--with-header">
        <div className="page-intro">
          <span className="eyebrow muted">{t('discover.groups.eyebrow')}</span>
          <h2 className="hero-title" style={{ fontSize: '1.75rem' }}>
            {t('discover.groups.headline')}
          </h2>
        </div>
        <div className="tabs" role="tablist" aria-label={t('discover.groups.title')}>
          <button type="button" role="tab" className="tab" aria-selected={tab === 'yours'} onClick={() => setTab('yours')}>
            {t('discover.groups.yours')} · {data.joinedGroups.length}
          </button>
          <button type="button" role="tab" className="tab" aria-selected={tab === 'discover'} onClick={() => setTab('discover')}>
            {t('discover.groups.discover')}
          </button>
        </div>

        <label htmlFor="group-q" className="search-field">
          <SearchGlyph size={22} />
          <input id="group-q" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('discover.groups.search')} autoComplete="off" />
        </label>

        {list.length ? (
          <div className="stack" role="tabpanel">
            {list.map((g) => (
              <GroupCard key={g.id} group={g} compact={tab === 'yours'} />
            ))}
            {tab === 'yours' && !q && suggested.length ? (
              <section className="section" aria-labelledby="suggested-title" style={{ marginTop: 8 }}>
                <SectionHead id="suggested-title" title="Suggested for you" />
                {suggested.map((g) => (
                  <GroupCard key={g.id} group={g} />
                ))}
              </section>
            ) : null}
          </div>
        ) : tab === 'yours' && !q ? (
          <EmptyState
            glyph="groups"
            title={t('discover.groups.none')}
            body="Groups bring neighbours' posts into your Home feed."
            action={
              <button type="button" className="btn btn--soft btn--sm" onClick={() => setTab('discover')}>
                {t('discover.groups.discover')}
              </button>
            }
          />
        ) : (
          <EmptyState glyph="groups" title="No groups match" body="Try a different word." />
        )}
      </main>
    </>
  );
}
