import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnswerCard, DealCard, PlaceRow, PostCard } from '../components/cards';
import { FriendVerdictRow, RecommendSheet, TrustSheet } from '../components/community';
import { DetailHero, useShare } from '../components/discover';
import { CheckInCard, TasteMatchPill, VerdictBar, WantButton } from '../components/friends';
import { EmptyState, PageHeader, SectionHead } from '../components/ui';
import { PLACES, placeById } from '../data/places';
import { DEALS, POSTS } from '../data/social';
import { useT } from '../i18n';
import { CheckGlyph, CheckInGlyph, ClockGlyph, InfoGlyph, MustGlyph, NavigateGlyph, PinGlyph, SaveGlyph, SendGlyph, ShareGlyph, ShieldGlyph, SparkGlyph } from '../icons';
import { placeCommunity } from '../lib/friends';
import { compact, km, priceLevel } from '../lib/format';
import { useAppData } from '../state/appData';
import { enabledSources, useSettings } from '../state/settings';
import { useToast } from '../state/toast';

export default function PlaceDetail() {
  const { id = '' } = useParams();
  const t = useT();
  const toast = useToast();
  const { settings } = useSettings();
  const { data, has, toggle } = useAppData();
  const share = useShare();
  const place = placeById(id);
  const [trustOpen, setTrustOpen] = useState(false);
  const [recommendOpen, setRecommendOpen] = useState(false);
  const [allReviews, setAllReviews] = useState(false);

  if (!place) {
    return (
      <>
        <PageHeader title={t('nav.explore')} fallback="/explore" />
        <main className="page page--with-header">
          <EmptyState
            glyph="pin"
            title={t('discover.place.notFound')}
            action={
              <Link to="/explore" className="btn btn--soft btn--sm">
                {t('discover.cat.backToExplore')}
              </Link>
            }
          />
        </main>
      </>
    );
  }

  const saved = has('savedPlaces', place.id);
  const sources = place.sources.filter(enabledSources(settings));
  const related = POSTS.filter((p) => p.answer?.placeIds?.includes(place.id));
  const deals = DEALS.filter((d) => d.placeId === place.id);
  const similar = PLACES.filter((p) => p.id !== place.id && p.category === place.category).slice(0, 3);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name}, ${place.area}, Ahmedabad`)}`;
  const askQuery = `${place.name} ${place.kind.toLowerCase()} ${place.area}`;
  const community = placeCommunity(place.id, data, settings);
  const isFood = place.category === 'food' || place.category === 'cafe';
  const friendCheckIns = community.reviews.filter((c) => c.authorId === 'me' || data.following.includes(c.authorId));
  const reviews = allReviews ? community.reviews : community.reviews.slice(0, 4);
  const checkInLink = `/checkin?place=${place.id}${isFood ? '' : '&kind=did'}`;

  return (
    <>
      <PageHeader title={place.name} fallback="/explore" />
      <main className="page page--with-header">
        <DetailHero tone={place.tone} glyph={place.glyph} badge={place.isNew ? 'NEW THIS WEEK' : undefined} />

        <div className="stack" style={{ gap: 8 }}>
          <h1 className="detail-title">{place.name}</h1>
          <span className="meta" style={{ fontSize: '0.875rem' }}>
            {place.kind} · {place.area}
          </span>
          <div className="row row--wrap" style={{ gap: 6 }}>
            {community.total ? (
              <span className="badge tone-mint" style={{ gap: 4 }}>
                <MustGlyph size={13} duo />
                {community.mustPct}% must try · {compact(community.total)} locals
              </span>
            ) : (
              <span className="badge">New · no verdicts yet</span>
            )}
            <span className="badge">{priceLevel(place.price)}</span>
            <span className="badge">{km(place.distanceKm)} away</span>
            <span className={`badge ${place.openNow ? 'tone-mint' : 'tone-amber'}`} style={{ gap: 6 }}>
              <span className={`live-dot${place.openNow ? '' : ' live-dot--muted'}`} />
              {place.openNow ? t('common.open') : t('common.closed')}
            </span>
          </div>
        </div>

        <div className="place-cta">
          <Link to={checkInLink} className="btn btn--primary grow">
            <CheckInGlyph size={18} />
            {t('community.checkInHere')}
          </Link>
          <WantButton item={{ id: `w-place-${place.id}`, kind: 'place', refId: place.id, title: place.name, sub: `${place.kind} · ${place.area}` }} variant="button" />
          <button type="button" className="btn btn--sm btn--outline" onClick={() => setRecommendOpen(true)}>
            <SendGlyph size={16} />
            {t('community.recommend')}
          </button>
        </div>

        <div className="detail-actions">
          <button
            type="button"
            className="detail-action"
            aria-pressed={saved}
            onClick={() => {
              const on = toggle('savedPlaces', place.id);
              toast(on ? `Saved ${place.name}` : 'Removed from saved');
            }}
          >
            <SaveGlyph size={22} active={saved} />
            {saved ? t('common.saved') : t('discover.place.save')}
          </button>
          <a className="detail-action" href={mapsUrl} target="_blank" rel="noopener noreferrer">
            <NavigateGlyph size={22} />
            {t('discover.place.directions')}
          </a>
          <Link className="detail-action" to={`/ask?q=${encodeURIComponent(askQuery)}`}>
            <SparkGlyph size={22} />
            {t('discover.place.ask')}
          </Link>
          <button type="button" className="detail-action" onClick={() => share(place.name, `/place/${place.id}`)}>
            <ShareGlyph size={22} />
            {t('common.share')}
          </button>
        </div>

        <section className="card stack" aria-labelledby="verdict-title">
          <div className="row row--between row--wrap" style={{ rowGap: 2 }}>
            <h2 className="section__title" id="verdict-title">
              {t('community.verdict')}
            </h2>
            <button type="button" className="btn btn--ghost btn--sm trust-link" onClick={() => setTrustOpen(true)}>
              <ShieldGlyph size={15} />
              {t('community.whyTrust')}
            </button>
          </div>
          <VerdictBar c={community} />
          {community.total === 0 ? (
            <Link to={checkInLink} className="btn btn--soft btn--sm" style={{ alignSelf: 'flex-start' }}>
              {t('community.beFirst')}
            </Link>
          ) : null}
        </section>

        {friendCheckIns.length ? (
          <section className="section" aria-labelledby="friends-been-title">
            <SectionHead id="friends-been-title" title={t('community.friendsBeen')} />
            <div className="list">
              {friendCheckIns.map((c) => (
                <FriendVerdictRow key={c.id} c={c} />
              ))}
            </div>
          </section>
        ) : null}

        {community.items.length ? (
          <section className="section" aria-labelledby="order-title">
            <SectionHead id="order-title" title={isFood ? t('community.whatPeopleOrder') : t('community.whatPeopleDo')} />
            <div className="list">
              {community.items.slice(0, 5).map((item) => (
                <div key={item.name} className="list-row order-row">
                  <span className="list-row__body">
                    <span className="list-row__title">{item.name}</span>
                    <span className="order-row__bar" aria-hidden="true">
                      <span style={{ width: `${item.mustPct}%` }} />
                    </span>
                    <span className="list-row__meta">{t('community.orders', { n: item.count < 1000 ? item.count : compact(item.count), pct: item.mustPct })}</span>
                  </span>
                  <WantButton
                    item={{ id: `w-${place.id}-${item.name}`, kind: isFood ? 'dish' : 'activity', refId: place.id, title: item.name, sub: `at ${place.name}` }}
                    variant="icon"
                  />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="section" aria-label={t('discover.place.whatLocalsSay')}>
          <SectionHead title={t('discover.place.whatLocalsSay')} />
          <AnswerCard text={place.summary} sources={sources} agree={sources.length} />
          {!settings.ai.answers ? <p className="body-sm">{place.summary}</p> : null}
        </section>

        <section className="card stack" aria-labelledby="loved-title">
          <h2 className="section__title" id="loved-title">
            {t('discover.place.loved')}
          </h2>
          <ul className="fact-list">
            {place.highlights.map((h) => (
              <li key={h}>
                <span className="tile tone-mint">
                  <CheckGlyph size={14} />
                </span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
          {place.watchOuts.length ? (
            <>
              <hr className="divider" />
              <h3 className="strong" style={{ fontSize: '0.9375rem' }}>
                {t('discover.place.watchOut')}
              </h3>
              <ul className="fact-list">
                {place.watchOuts.map((w) => (
                  <li key={w}>
                    <span className="tile tone-amber">
                      <InfoGlyph size={14} />
                    </span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>

        <section className="card stack" aria-labelledby="hours-title">
          <h2 className="section__title" id="hours-title">
            {t('discover.place.hours')}
          </h2>
          <dl className="kv">
            <dt className="row" style={{ gap: 6 }}>
              <ClockGlyph size={15} />
              Hours
            </dt>
            <dd>{place.hours}</dd>
            {place.bestTime ? (
              <>
                <dt className="row" style={{ gap: 6 }}>
                  <SparkGlyph size={15} />
                  Best time
                </dt>
                <dd>{place.bestTime}</dd>
              </>
            ) : null}
            <dt className="row" style={{ gap: 6 }}>
              <PinGlyph size={15} />
              Address
            </dt>
            <dd>{place.address}</dd>
          </dl>
          <div className="chip-wrap">
            {place.tags.map((tag) => (
              <Link key={tag} to={`/ask?q=${encodeURIComponent(tag)}`} className="chip" style={{ height: 32, fontSize: '0.8125rem' }}>
                {tag}
              </Link>
            ))}
          </div>
        </section>

        <section className="section" aria-labelledby="reviews-title">
          <SectionHead id="reviews-title" title={t('community.reviewsTrust')} />
          {community.reviews.length === 0 ? (
            <div className="card stack" style={{ alignItems: 'flex-start' }}>
              <span className="strong">{t('community.noReviews')}</span>
              <span className="body-sm muted">{t('community.beFirst')}</span>
              <Link to={checkInLink} className="btn btn--primary btn--sm">
                <CheckInGlyph size={16} />
                {t('community.checkInHere')}
              </Link>
            </div>
          ) : (
            <>
              {reviews.map((c) => (
                <CheckInCard
                  key={c.id}
                  c={c}
                  showPlace={false}
                  footer={
                    c.authorId !== 'me' && !data.following.includes(c.authorId) ? (
                      <span className="row meta" style={{ gap: 6 }}>
                        <TasteMatchPill personId={c.authorId} />
                        {t('community.tasteMatchNote')}
                      </span>
                    ) : null
                  }
                />
              ))}
              {community.reviews.length > 4 ? (
                <button type="button" className="btn btn--outline btn--block" onClick={() => setAllReviews((v) => !v)}>
                  {allReviews ? t('community.showFewer') : t('community.showAll', { n: community.reviews.length })}
                </button>
              ) : null}
            </>
          )}
        </section>

        {related.length ? (
          <section className="section" aria-labelledby="talk-title">
            <SectionHead id="talk-title" title={t('discover.place.talk')} />
            {related.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </section>
        ) : null}

        {deals.length ? (
          <section className="section" aria-labelledby="deals-title">
            <SectionHead id="deals-title" title={t('discover.place.deals')} to="/deals" />
            {deals.map((d) => (
              <DealCard key={d.id} deal={d} />
            ))}
          </section>
        ) : null}

        {similar.length ? (
          <section className="section" aria-labelledby="similar-title">
            <SectionHead id="similar-title" title={t('discover.place.similar')} />
            <div className="list">
              {similar.map((p, i) => (
                <PlaceRow key={p.id} place={p} last={i === similar.length - 1} />
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <TrustSheet open={trustOpen} onClose={() => setTrustOpen(false)} />
      <RecommendSheet open={recommendOpen} onClose={() => setRecommendOpen(false)} placeName={place.name} area={place.area} />
    </>
  );
}
