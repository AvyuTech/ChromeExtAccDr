import { Link, useParams } from 'react-router-dom';
import { dealPhoto } from '../assets/photos';
import { PlaceRow, ShareButton } from '../components/cards';
import { DetailHero } from '../components/discover';
import { EmptyState, PageHeader, SectionHead } from '../components/ui';
import { placeById } from '../data/places';
import { dealById } from '../data/social';
import { useT } from '../i18n';
import { CheckGlyph, ClockGlyph, CopyGlyph, NamedGlyph, UsersGlyph } from '../icons';
import { compact, km } from '../lib/format';
import { useAppData } from '../state/appData';
import { useToast } from '../state/toast';

export default function DealDetail() {
  const { id = '' } = useParams();
  const t = useT();
  const toast = useToast();
  const { has, add } = useAppData();
  const deal = dealById(id);

  if (!deal) {
    return (
      <>
        <PageHeader title={t('chip.deals')} fallback="/deals" />
        <main className="page page--with-header">
          <EmptyState
            glyph="deals"
            title={t('discover.deals.notFound')}
            action={
              <Link to="/deals" className="btn btn--soft btn--sm">
                {t('discover.deals.title')}
              </Link>
            }
          />
        </main>
      </>
    );
  }

  const claimed = has('claimedDeals', deal.id);
  const place = deal.placeId ? placeById(deal.placeId) : undefined;
  const photoSrc = dealPhoto(deal);

  const copy = async () => {
    if (!deal.code) return;
    try {
      await navigator.clipboard.writeText(deal.code);
      toast('Code copied');
    } catch {
      toast(`Your code is ${deal.code}`);
    }
  };

  return (
    <>
      <PageHeader title={deal.merchant} fallback="/deals" actions={<ShareButton title={`${deal.title} at ${deal.merchant}`} path={`/deals/${deal.id}`} />} />
      <main className="page page--with-header">
        {photoSrc ? (
          <DetailHero tone={deal.tone} glyph={deal.glyph} src={photoSrc} height={260}>
            <span className="deal-burst" aria-hidden="true">
              {deal.discount}
            </span>
          </DetailHero>
        ) : (
          <section className="deal-hero glyph-host" aria-hidden="true">
            <span className="deal-hero__icon">
              <NamedGlyph name={deal.glyph} size={28} live={!claimed} />
            </span>
            <span className={`deal-hero__big${deal.discount.length > 9 ? ' deal-hero__big--long' : ''}`}>{deal.discount}</span>
          </section>
        )}

        <div className="detail-head">
          <span className="eyebrow" style={{ color: 'var(--accent)' }}>
            {t('home.deal')} · {deal.ends}
          </span>
          <h1 className="detail-title">{deal.title}</h1>
          <p className="detail-facts">
            {place ? (
              <Link to={`/place/${place.id}`} className="detail-facts__accent">
                {deal.merchant}
              </Link>
            ) : (
              <span>{deal.merchant}</span>
            )}
            {deal.merchant.includes(deal.area) ? null : <span>{deal.area}</span>}
            <span>{km(deal.distanceKm)}</span>
          </p>
          <p className="detail-facts" style={{ marginTop: 0 }}>
            <span className="row" style={{ gap: 4 }}>
              <ClockGlyph size={13} />
              {deal.ends}
            </span>
            <span className="row" style={{ gap: 4, color: 'var(--mint-ink)' }}>
              <UsersGlyph size={13} />
              {compact(deal.claimedBy + (claimed ? 1 : 0))} claimed
            </span>
            <span>{deal.code ? 'Code at checkout' : 'No code needed'}</span>
          </p>
        </div>

        {claimed ? (
          <section className="stack fade-up" aria-label={t('discover.deals.code')}>
            {deal.code ? (
              <div className="deal-code">
                <span className="stack grow" style={{ gap: 2 }}>
                  <span className="eyebrow" style={{ color: 'var(--green-ink)' }}>
                    {t('discover.deals.code')}
                  </span>
                  <span className="deal-code__value">{deal.code}</span>
                </span>
                <button type="button" className="btn btn--sm btn--mint" onClick={copy}>
                  <CopyGlyph size={15} />
                  {t('discover.deals.copy')}
                </button>
              </div>
            ) : (
              <div className="deal-code">
                <CheckGlyph size={22} style={{ color: 'var(--mint-ink)' }} />
                <span className="strong grow">No code needed. {t('discover.deals.showAtCounter')}.</span>
              </div>
            )}
            <p className="meta" style={{ textAlign: 'center' }}>
              {deal.code ? t('discover.deals.showAtCounter') : 'Mention Nearhood when you order.'}
            </p>
          </section>
        ) : (
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={() => {
              add('claimedDeals', deal.id);
              toast('Deal claimed');
            }}
          >
            {t('discover.deals.claim')}
          </button>
        )}

        <section className="dsec" aria-labelledby="terms-title">
          <h2 className="section__title" id="terms-title">
            {t('discover.deals.terms')}
          </h2>
          <ul className="fact-list">
            {deal.terms.map((term) => (
              <li key={term}>
                <span className="tile tone-mint">
                  <CheckGlyph size={14} />
                </span>
                <span>{term}</span>
              </li>
            ))}
          </ul>
        </section>

        {place ? (
          <section className="dsec" aria-labelledby="where-title">
            <SectionHead id="where-title" title="Where" />
            <div className="list">
              <PlaceRow place={place} last />
            </div>
          </section>
        ) : null}
      </main>
    </>
  );
}
