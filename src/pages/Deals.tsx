import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dealPhoto } from '../assets/photos';
import { Cover } from '../components/cards';
import { EmptyState, PageHeader } from '../components/ui';
import { neighbourhoodName } from '../data/core';
import { DEALS } from '../data/social';
import type { Deal } from '../data/types';
import { useT } from '../i18n';
import { CheckGlyph, ClockGlyph, PinGlyph, SparkleMark, UsersGlyph } from '../icons';
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
    <article className="card deal-tile">
      <Link to={`/deals/${deal.id}`} className="deal-tile__top glyph-host">
        <Cover src={dealPhoto(deal)} glyph={deal.glyph} tone={deal.tone} className="deal-tile__thumb">
          <span className="deal-ribbon">{deal.discount}</span>
        </Cover>
        <span className="stack grow" style={{ gap: 5, minWidth: 0 }}>
          <span className="eyebrow" style={{ color: 'var(--accent)' }}>
            {CATEGORY_LABEL[deal.category]}
          </span>
          <span className="deal-tile__title">{deal.title}</span>
          <span className="meta row" style={{ gap: 4 }}>
            <PinGlyph size={12} />
            <span className="truncate">{deal.merchant.includes(deal.area) ? deal.merchant : `${deal.merchant} · ${deal.area}`}</span>
            <span style={{ flexShrink: 0 }}>· {km(deal.distanceKm)}</span>
          </span>
        </span>
      </Link>
      <div className="row deal-tile__foot" style={{ gap: 8 }}>
        <span className="meta row grow" style={{ gap: 10 }}>
          <span className="row" style={{ gap: 4 }}>
            <ClockGlyph size={13} />
            {deal.ends}
          </span>
          <span className="row" style={{ gap: 4 }}>
            <UsersGlyph size={13} />
            {compact(deal.claimedBy + (claimed ? 1 : 0))}
          </span>
        </span>
        {claimed ? (
          <Link to={`/deals/${deal.id}`} className="btn btn--sm btn--secondary">
            <CheckGlyph size={15} />
            {t('discover.deals.claimed')}
          </Link>
        ) : (
          <button
            type="button"
            className="btn btn--sm btn--primary"
            onClick={() => {
              add('claimedDeals', deal.id);
              toast(deal.code ? 'Deal claimed. Your code is ready' : 'Deal claimed', { label: 'View', onClick: () => navigate(`/deals/${deal.id}`) });
            }}
          >
            {t('discover.deals.claim')}
          </button>
        )}
      </div>
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
          <h2 className="hero-title" style={{ fontSize: '1.75rem' }}>
            {t('discover.deals.headline')}
            <SparkleMark size={22} className="hero-title__spark" />
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
          <div className="stack">
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
