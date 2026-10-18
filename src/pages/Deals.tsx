import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dealPhoto } from '../assets/photos';
import { Cover } from '../components/cards';
import { EmptyState, PageHeader } from '../components/ui';
import { neighbourhoodName } from '../data/core';
import { DEALS } from '../data/social';
import type { Deal } from '../data/types';
import { useT } from '../i18n';
import { CheckGlyph, ClockGlyph, SparkleMark, UsersGlyph } from '../icons';
import { compact, km } from '../lib/format';
import { useAppData } from '../state/appData';
import { useSettings } from '../state/settings';
import { useToast } from '../state/toast';

const FILTERS: Array<{ id: 'all' | Deal['category'] | 'near'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'near', label: 'Near me' },
  { id: 'food', label: 'Food' },
  { id: 'cafe', label: 'Café' },
  { id: 'wellness', label: 'Wellness' },
  { id: 'movies', label: 'Movies' },
  { id: 'transport', label: 'Transport' },
];

const CATEGORY_LABEL: Record<Deal['category'], string> = {
  food: 'Food',
  cafe: 'Café',
  shopping: 'Shopping',
  wellness: 'Wellness',
  movies: 'Movies',
  transport: 'Getting around',
};

export function DealTile({ deal }: { deal: Deal }) {
  const t = useT();
  const navigate = useNavigate();
  const toast = useToast();
  const { has, add } = useAppData();
  const claimed = has('claimedDeals', deal.id);
  return (
    <article className="deal-row">
      <Link to={`/deals/${deal.id}`} className="deal-row__main glyph-host">
        <Cover src={dealPhoto(deal)} glyph={deal.glyph} tone={deal.tone} className="deal-row__thumb">
          <span className="deal-ribbon">{deal.discount}</span>
        </Cover>
        <span className="stack grow" style={{ gap: 3, minWidth: 0 }}>
          <span className="eyebrow" style={{ color: 'var(--accent)', fontSize: '0.625rem' }}>
            {CATEGORY_LABEL[deal.category]}
          </span>
          <span className="deal-row__title">{deal.title}</span>
          <span className="deal-row__meta">
            <span className="truncate" style={{ display: 'block', maxWidth: '100%' }}>
              {deal.merchant.includes(deal.area) ? deal.merchant : `${deal.merchant} · ${deal.area}`} · {km(deal.distanceKm)}
            </span>
          </span>
          <span className="deal-row__meta">
            <span>
              <ClockGlyph size={12} />
              {deal.ends}
            </span>
            <span>
              <UsersGlyph size={12} />
              {compact(deal.claimedBy + (claimed ? 1 : 0))}
            </span>
          </span>
        </span>
      </Link>
      {claimed ? (
        <Link to={`/deals/${deal.id}`} className="btn btn--sm btn--secondary" aria-label={`${t('discover.deals.claimed')}: ${deal.title}`}>
          <CheckGlyph size={14} />
          {t('discover.deals.claimed')}
        </Link>
      ) : (
        <button
          type="button"
          className="btn btn--sm btn--primary"
          aria-label={`${t('discover.deals.claim')}: ${deal.title}`}
          onClick={() => {
            add('claimedDeals', deal.id);
            toast(deal.code ? 'Deal claimed. Your code is ready' : 'Deal claimed', { label: 'View', onClick: () => navigate(`/deals/${deal.id}`) });
          }}
        >
          {t('discover.deals.claim')}
        </button>
      )}
    </article>
  );
}

export default function Deals() {
  const t = useT();
  const { settings } = useSettings();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all');
  const list = DEALS.filter((d) => (filter === 'all' ? true : filter === 'near' ? d.distanceKm <= settings.location.radiusKm : d.category === filter)).sort(
    (a, b) => (filter === 'near' ? a.distanceKm - b.distanceKm : b.claimedBy - a.claimedBy),
  );
  return (
    <>
      <PageHeader title={t('discover.deals.title')} fallback="/explore" />
      <main className="page page--with-header">
        <div className="page-intro">
          <span className="eyebrow muted">{t('discover.deals.eyebrow', { n: DEALS.length, area: neighbourhoodName(settings.location.home) })}</span>
          <h2 className="hero-title" style={{ fontSize: '1.5rem' }}>
            {t('discover.deals.headline')}
            <SparkleMark size={19} className="hero-title__spark" />
          </h2>
        </div>
        <div className="chip-row" role="group" aria-label="Filter deals">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" className="chip" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
        {list.length ? (
          <div className="deal-list">
            {list.map((d) => (
              <DealTile key={d.id} deal={d} />
            ))}
          </div>
        ) : (
          <EmptyState glyph="deals" title="No deals here right now" body="New deals arrive every day; check back soon." />
        )}
      </main>
    </>
  );
}
