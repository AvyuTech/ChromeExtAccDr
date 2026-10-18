import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ownItemPhoto, photo, placePhoto } from '../assets/photos';
import { AnswerCard, PlaceRow, PostCard } from '../components/cards';
import { FriendVerdictRow, TrustSheet } from '../components/community';
import { ShareSheet } from '../components/share';
import { AwayLine, EventLinkRow, OwnerReplyView, PageHistorySheet, PageUpdateRow, PlaceClaim, PlaceOriginLine, ProfileHead } from '../components/discover';
import { CheckInCard, TasteMatchPill, VerdictBar, WantButton } from '../components/friends';
import { EmptyState, PageHeader, SectionHead } from '../components/ui';
import { EVENTS } from '../data/events';
import { PLACES, placeById } from '../data/places';
import { POSTS } from '../data/social';
import { useT } from '../i18n';
import { CheckGlyph, CheckInGlyph, ClockGlyph, EditGlyph, InfoGlyph, MustGlyph, NamedGlyph, NavigateGlyph, PhoneGlyph, PinGlyph, SaveGlyph, ShareGlyph, ShieldGlyph, SparkGlyph } from '../icons';
import { isWanted, itemsFor, placeCommunity } from '../lib/friends';
import { compact, km, priceLevel } from '../lib/format';
import { ownerReplyFor, pageUpdates, runsPage, withOwnerEdits } from '../lib/places';
import { useAppData } from '../state/appData';
import { enabledSources, useSettings } from '../state/settings';
import { useToast } from '../state/toast';
import { ActionBar, IconButton, MainAction, placeKind } from '../components/entity';

export default function PlaceDetail() {
  const { id = '' } = useParams();
  const t = useT();
  const toast = useToast();
  const { settings } = useSettings();
  const { data, has, add, remove, toggleWant } = useAppData();
  const found = placeById(id);
  const [trustOpen, setTrustOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [allReviews, setAllReviews] = useState(false);

  if (!found) {
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

  // What the person who runs the page changed sits on top of what locals added; the history shows each change.
  const edit = data.pageEdits[found.id];
  const place = withOwnerEdits(found, edit);
  const mine = runsPage(place);
  const saved = has('savedPlaces', place.id);
  const sources = place.sources.filter(enabledSources(settings));
  const related = POSTS.filter((p) => p.answer?.placeIds?.includes(place.id));
  const away = !!place.origin.outsideCity;
  // Pages outside the city only suggest each other; city pages never suggest day trips.
  const similar = PLACES.filter((p) => p.id !== place.id && !!p.origin.outsideCity === away && (away || p.category === place.category)).slice(0, 3);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name}, ${place.area}, Ahmedabad`)}`;
  const askQuery = `${place.name} ${place.kind.toLowerCase()} ${place.area}`;
  const community = placeCommunity(place.id, data, settings);
  const friendCheckIns = community.reviews.filter((c) => c.authorId === 'me' || data.following.includes(c.authorId));
  const reviews = allReviews ? community.reviews : community.reviews.slice(0, 4);
  const checkInLink = `/checkin?place=${place.id}`;
  // Posts from the page itself: owner updates once claimed, and events it hosts (they link out, never booked here).
  const updates = pageUpdates(place, data);
  const offers = place.origin.claimed ? (edit?.offers ?? []) : [];
  const hosted = EVENTS.filter((e) => e.host?.kind === 'page' && e.host.id === place.id);
  // Dishes and activities that have their own photo, most-ordered first.
  const gallery = Array.from(new Set([...community.items.map((i) => i.name), ...itemsFor(place.id)]))
    .map((name) => ({ name, src: ownItemPhoto(name), mustPct: community.items.find((i) => i.name === name)?.mustPct }))
    .filter((g): g is { name: string; src: string; mustPct: number | undefined } => !!g.src && g.src !== placePhoto(place.id))
    .slice(0, 6);
  const closes = place.hours.split('–')[1]?.trim();
  // The round icon shows the place's best-known dish or activity; the cover already shows the place.
  const signature = gallery[0]?.src;
  const wantItem = { id: `w-place-${place.id}`, kind: 'place' as const, refId: place.id, title: place.name, sub: `${place.kind} · ${place.area}` };
  const wanted = isWanted(data, wantItem);
  const kept = wanted || saved;

  return (
    <>
      <PageHeader title={place.name} fallback="/explore" />
      <main className="page page--with-header">
        <ProfileHead
          kind={placeKind(place)}
          cover={edit?.cover ?? placePhoto(place.id)}
          coverBadge={
            place.isNew ? (
              <span className="photo-pill" style={{ top: 12, left: 'var(--gutter)' }}>
                New this week
              </span>
            ) : undefined
          }
          tone={place.tone}
          icon={signature ? <img src={signature} alt="" /> : <NamedGlyph name={place.glyph} size={30} duo />}
          stats={[
            community.total
              ? { value: `${community.mustPct}%`, label: t('discover.stat.mustTry'), tone: 'mint' as const }
              : { value: 'New', label: t('discover.stat.mustTry') },
            { value: compact(community.total), label: t('discover.stat.locals') },
            { value: km(place.distanceKm), label: away ? t('discover.stat.fromCity') : t('discover.stat.away') },
          ]}
          title={place.name}
          sub={
            <>
              {place.kind} · {away ? place.area.replace(/\s*\(getaway\)/i, '') : place.area} · {priceLevel(place.price)} ·{' '}
              <span className={place.openNow ? 'is-open' : 'is-closed'}>
                {place.openNow ? `${t('common.open')}${closes ? ` till ${closes}` : ''}` : t('common.closed')}
              </span>
            </>
          }
        >
          {away ? <AwayLine place={place} /> : null}
          <PlaceOriginLine place={place} />
          <div className="profile-head__lines">
            <PlaceClaim place={place} />
            {place.origin.guide ? (
              <span className="meta row" style={{ gap: 4 }}>
                <ShieldGlyph size={12} />
                Guide-checked
              </span>
            ) : null}
          </div>
        </ProfileHead>

        <ActionBar label={t('discover.place.actions')}>
          {mine ? (
            // People who run a page don't give it a verdict; they manage it.
            <MainAction to={`/place/${place.id}/manage`} icon={<EditGlyph size={16} />} label={t('discover.claim.manage')} />
          ) : (
            <MainAction to={checkInLink} icon={<CheckInGlyph size={17} />} label={t('discover.action.checkIn')} />
          )}
          {/* Save and Want to try are one thing: saving a page puts it on your Want to try list. */}
          <IconButton
            pressed={kept}
            onClick={() => {
              if (kept) {
                if (wanted) toggleWant(wantItem);
                remove('savedPlaces', place.id);
                toast('Removed from Want to try');
              } else {
                toggleWant(wantItem);
                add('savedPlaces', place.id);
                toast(`Saved ${place.name} to Want to try`);
              }
            }}
            icon={<SaveGlyph size={18} active={kept} />}
            label={kept ? 'Saved to Want to try' : 'Save to Want to try'}
          />
          <IconButton href={mapsUrl} icon={<NavigateGlyph size={18} />} label={t('discover.action.directions')} />
          {/* Share holds every way to pass it on: send to friends, copy the link, other apps. */}
          <IconButton onClick={() => setShareOpen(true)} icon={<ShareGlyph size={17} />} label={t('common.share')} />
        </ActionBar>

        <section className="dsec" aria-labelledby="verdict-title">
          <div className="dsec__head">
            <h2 className="section__title" id="verdict-title">
              {t('community.verdict')}
            </h2>
            <button type="button" className="btn btn--ghost btn--sm trust-link" onClick={() => setTrustOpen(true)}>
              <ShieldGlyph size={14} />
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
          <section className="dsec" aria-labelledby="friends-been-title">
            <SectionHead id="friends-been-title" title={t('community.friendsBeen')} />
            <div className="list">
              {friendCheckIns.map((c) => (
                <FriendVerdictRow key={c.id} c={c} />
              ))}
            </div>
          </section>
        ) : null}

        {community.items.length || gallery.length ? (
          <section className="dsec" aria-labelledby="order-title">
            <SectionHead id="order-title" title={t('discover.place.mostLoved')} />
            {gallery.length ? (
              <div className="hscroll item-gallery" role="list" aria-label={t('discover.place.photos')}>
                {gallery.map((g) => (
                  <figure key={g.name} className="item-photo" role="listitem">
                    <img src={g.src} alt={g.name} loading="lazy" decoding="async" />
                    {g.mustPct !== undefined && g.mustPct >= 60 ? (
                      <span className="item-photo__must">
                        <MustGlyph size={12} duo />
                        {g.mustPct}%
                      </span>
                    ) : null}
                    <figcaption>{g.name}</figcaption>
                  </figure>
                ))}
              </div>
            ) : null}
            {community.items.length ? (
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
                    item={{ id: `w-${place.id}-${item.name}`, kind: 'activity', refId: place.id, title: item.name, sub: `at ${place.name}` }}
                    variant="icon"
                  />
                </div>
              ))}
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="dsec" aria-label={t('discover.place.whatLocalsSay')}>
          <SectionHead title={t('discover.place.whatLocalsSay')} to={`/ask?q=${encodeURIComponent(askQuery)}`} linkLabel="Ask about it" />
          <AnswerCard text={place.summary} sources={sources} agree={sources.length} />
          {!settings.ai.answers ? <p className="body-sm">{place.summary}</p> : null}
        </section>

        {place.highlights.length || place.watchOuts.length ? (
          <section className="dsec" aria-labelledby="know-title">
            <h2 className="section__title" id="know-title">
              {t('discover.place.watchOut')}
            </h2>
            <ul className="fact-list fact-list--quiet">
              {place.highlights.map((h) => (
                <li key={h}>
                  <CheckGlyph size={15} />
                  <span>{h}</span>
                </li>
              ))}
              {place.watchOuts.map((w) => (
                <li key={w}>
                  <InfoGlyph size={15} />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="dsec" aria-labelledby="hours-title">
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
            {edit?.phone ? (
              <>
                <dt className="row" style={{ gap: 6 }}>
                  <PhoneGlyph size={15} />
                  Phone
                </dt>
                <dd>
                  <a href={`tel:${edit.phone.replace(/\s+/g, '')}`} className="kv__link">
                    {edit.phone}
                  </a>
                </dd>
              </>
            ) : null}
          </dl>
          {edit?.editedAt ? (
            <button type="button" className="owner-edited" onClick={() => setHistoryOpen(true)} aria-haspopup="dialog">
              <EditGlyph size={13} />
              {t('discover.owner.updated', { when: edit.editedAt })}
              <span className="owner-edited__link">{t('discover.owner.seeChanges')}</span>
            </button>
          ) : null}
          <div className="chip-wrap">
            {place.tags.map((tag) => (
              <Link key={tag} to={`/ask?q=${encodeURIComponent(tag)}`} className="chip" style={{ height: 28, padding: '0 11px', fontSize: '0.75rem' }}>
                {tag}
              </Link>
            ))}
          </div>
        </section>

        {updates.length || hosted.length || offers.length ? (
          <section className="dsec" aria-labelledby="from-page-title">
            <SectionHead id="from-page-title" title={t('discover.place.fromPage')} />
            {offers.length ? (
              <div className="page-offers">
                <span className="page-offers__label">{t('discover.owner.offers')}</span>
                <div className="chip-wrap">
                  {offers.map((o) => (
                    <span key={o} className="chip page-offers__chip">
                      {o}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            {updates.map((u) => (
              <PageUpdateRow key={u.id} update={u} place={place} photo={u.photo ? (u.photo.startsWith('data:') ? u.photo : photo(u.photo)) : undefined} />
            ))}
            {hosted.length ? (
              <div className="list">
                {hosted.map((e) => (
                  <EventLinkRow key={e.id} event={e} />
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="dsec" aria-labelledby="reviews-title">
          <SectionHead id="reviews-title" title={t('community.reviewsTrust')} />
          {community.reviews.length === 0 ? (
            <div className="stack" style={{ alignItems: 'flex-start', gap: 6 }}>
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
                  footer={(() => {
                    const reply = ownerReplyFor(c.id, place.id, data);
                    const match =
                      c.authorId !== 'me' && !data.following.includes(c.authorId) ? (
                        <span className="row meta" style={{ gap: 6 }}>
                          <TasteMatchPill personId={c.authorId} />
                          {t('community.tasteMatchNote')}
                        </span>
                      ) : null;
                    return match || reply ? (
                      <>
                        {match}
                        {reply ? <OwnerReplyView reply={reply} place={place} /> : null}
                      </>
                    ) : null;
                  })()}
                />
              ))}
              {community.reviews.length > 4 ? (
                <button type="button" className="dsec__more" onClick={() => setAllReviews((v) => !v)}>
                  {allReviews ? t('community.showFewer') : t('community.showAll', { n: community.reviews.length })}
                </button>
              ) : null}
            </>
          )}
        </section>

        {related.length ? (
          <section className="dsec" aria-labelledby="talk-title">
            <SectionHead id="talk-title" title={t('discover.place.talk')} />
            {related.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </section>
        ) : null}

        {similar.length ? (
          <section className="dsec" aria-labelledby="similar-title">
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
      <PageHistorySheet place={place} open={historyOpen} onClose={() => setHistoryOpen(false)} />
      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} title={place.name} path={`/place/${place.id}`} message={`Try ${place.name} in ${place.area}`} />
    </>
  );
}
