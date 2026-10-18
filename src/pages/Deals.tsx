import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EmptyState, PageHeader } from '../components/ui';
import { DEALS } from '../data/social';
import type { Deal } from '../data/types';
import { useT } from '../i18n';
import { CheckGlyph, ClockGlyph, NamedGlyph, PinGlyph, UsersGlyph } from '../icons';
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

export function DealTile({ deal }: { deal: Deal }) {
  const t = useT();
  const navigate = useNavigate();
  const toast = useToast();
  const { has, add } = useAppData();
  const claimed = has('claimedDeals', deal.id);
  return (
    <article className={`card deal-tile tone-${deal.tone}`}>
      <Link to={`/deals/${deal.id}`} className="deal-tile__top glyph-host">
        <span className="tile tile--lg">
          <NamedGlyph name={deal.glyph} size={24} duo live={!claimed} />
        </span>
        <span className="stack grow" style={{ gap: 4, minWidth: 0 }}>
          <span className="deal-tile__discount">{deal.discount}</span>
          <span className="strong" style={{ fontSize: '0.9375rem', lineHeight: 1.3 }}>
            {deal.title}
          </span>
          <span className="meta row" style={{ gap: 4 }}>
            <PinGlyph size={12} />
            {deal.merchant.includes(deal.area) ? deal.merchant : `${deal.merchant} · ${deal.area}`} · {km(deal.distanceKm)}
          </span>
        </span>
      </Link>
      <div className="row" style={{ gap: 8 }}>
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
      <PageHeader title={t('discover.deals.title')} fallback="/explore" sub={`${DEALS.length} live deals`} />
      <main className="page page--with-header">
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
