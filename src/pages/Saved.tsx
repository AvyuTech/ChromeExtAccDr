import { useState } from 'react';
import { Link } from 'react-router-dom';
import { eventPhoto, placePhoto } from '../assets/photos';
import { Cover, EventRow, FaceStack, PostCard } from '../components/cards';
import { CollectionCard } from '../components/friends';
import { EmptyState, PageHeader } from '../components/ui';
import { eventById } from '../data/events';
import { placeById } from '../data/places';
import { postById } from '../data/social';
import type { CityEvent, Place, Post } from '../data/types';
import { useT } from '../i18n';
import { SaveGlyph, NamedGlyph } from '../icons';
import { km } from '../lib/format';
import { collectionFor, placeCommunity } from '../lib/friends';
import { useAppData } from '../state/appData';
import { useSettings } from '../state/settings';
import { useToast } from '../state/toast';

/** A saved place as a photo card, with an unsave button on the photo. */
function SavedPlace({ place }: { place: Place }) {
  const { data, toggle } = useAppData();
  const { settings } = useSettings();
  const toast = useToast();
  const c = placeCommunity(place.id, data, settings);
  return (
    <article className="saved-place">
      <Link to={`/place/${place.id}`} className="saved-place__link">
        <Cover src={placePhoto(place.id)} glyph={place.glyph} tone={place.tone} className="saved-place__photo" />
        <span className="saved-place__body">
          <span className="saved-place__name">{place.name}</span>
          <span className="meta">
            {place.kind} · {km(place.distanceKm)}
          </span>
          {c.friendIds.length ? (
            <span className="row" style={{ gap: 5 }}>
              <FaceStack ids={c.friendIds} size={16} />
              <span className="meta" style={{ color: 'var(--accent)', fontWeight: 700 }}>
                {c.friendIds.length === 1 ? '1 friend' : `${c.friendIds.length} friends`}
              </span>
            </span>
          ) : c.total ? (
            <span className="meta row" style={{ gap: 4, color: 'var(--mint-ink)', fontWeight: 700 }}>
              <NamedGlyph name="must" size={13} duo />
              {c.mustPct}% must try
            </span>
          ) : null}
        </span>
      </Link>
      <button
        type="button"
        className="photo-action"
        style={{ top: 6, right: 6, width: 30, height: 30 }}
        aria-pressed="true"
        aria-label={`Remove ${place.name} from saved`}
        onClick={() => {
          toggle('savedPlaces', place.id);
          toast('Removed from saved', { label: 'Undo', onClick: () => toggle('savedPlaces', place.id) });
        }}
      >
        <SaveGlyph size={16} active />
      </button>
    </article>
  );
}

type Tab = 'places' | 'events' | 'posts' | 'lists';

export default function Saved() {
  const t = useT();
  const { data } = useAppData();
  const [tab, setTab] = useState<Tab>('places');

  const places = data.savedPlaces.map(placeById).filter((p): p is Place => !!p);
  const events = data.savedEvents.map(eventById).filter((e): e is CityEvent => !!e);
  const posts = data.savedPosts.map((id) => data.myPosts.find((p) => p.id === id) ?? postById(id)).filter((p): p is Post => !!p);
  const lists = data.followedCollections.map((id) => collectionFor(data, id)).filter((c): c is NonNullable<typeof c> => !!c);

  const tabs: Array<{ id: Tab; key: string; n: number }> = [
    { id: 'places', key: 'saved.places', n: places.length },
    { id: 'events', key: 'saved.events', n: events.length },
    { id: 'posts', key: 'saved.posts', n: posts.length },
    { id: 'lists', key: 'people.tab.lists', n: lists.length },
  ];

  return (
    <>
      <PageHeader title={t('me.saved')} fallback="/me" />
      <main className="page page--with-header">
        <section className="saved-intro" aria-label={t('me.saved')}>
          <span className="saved-intro__stack" aria-hidden="true">
            {[...places.map((p) => placePhoto(p.id)), ...events.map((e) => eventPhoto(e.id))]
              .filter((x): x is string => !!x)
              .slice(0, 3)
              .map((src) => (
                <img key={src} src={src} alt="" />
              ))}
          </span>
          <span className="stack" style={{ gap: 2 }}>
            <span className="saved-intro__count">{places.length + events.length + posts.length + lists.length} saved</span>
            <span className="meta">Places, plans and threads you want to come back to.</span>
          </span>
        </section>

        <div className="tabs people-tabs" role="tablist" aria-label={t('me.saved')}>
          {tabs.map((x) => (
            <button key={x.id} id={`saved-tab-${x.id}`} type="button" role="tab" className="tab" aria-selected={tab === x.id} aria-controls="saved-panel" onClick={() => setTab(x.id)}>
              {t(x.key)} <span className="muted">{x.n}</span>
            </button>
          ))}
        </div>

        <div id="saved-panel" role="tabpanel" aria-labelledby={`saved-tab-${tab}`} className="stack">
          {tab === 'places' &&
            (places.length ? (
              <div className="saved-grid">
                {places.map((p) => (
                  <SavedPlace key={p.id} place={p} />
                ))}
              </div>
            ) : (
              <EmptyState
                glyph="pin"
                title={t('saved.emptyPlaces')}
                body="Tap save on any place to keep it here."
                action={
                  <Link to="/explore" className="btn btn--soft btn--sm">
                    {t('nav.explore')}
                  </Link>
                }
              />
            ))}
          {tab === 'events' &&
            (events.length ? (
              <div>
                {events.map((e) => (
                  <EventRow key={e.id} event={e} />
                ))}
              </div>
            ) : (
              <EmptyState
                glyph="events"
                title={t('saved.emptyEvents')}
                body="Saved events show up here with reminders."
                action={
                  <Link to="/explore/events" className="btn btn--soft btn--sm">
                    {t('chip.events')}
                  </Link>
                }
              />
            ))}
          {tab === 'lists' &&
            (lists.length ? (
              <div className="grid-2 people-list-grid">
                {lists.map((c) => (
                  <CollectionCard key={c.id} col={c} />
                ))}
              </div>
            ) : (
              <EmptyState
                glyph="lists"
                title="No lists followed yet"
                body="Follow a friend’s list, like their favourite cafés, to keep it here."
                action={
                  <Link to="/friends" className="btn btn--soft btn--sm">
                    {t('people.friends')}
                  </Link>
                }
              />
            ))}
          {tab === 'posts' &&
            (posts.length ? (
              <div className="feed">
                {posts.map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </div>
            ) : (
              <EmptyState
                glyph="question"
                title={t('saved.emptyPosts')}
                body="Save useful threads from your feed to find them later."
                action={
                  <Link to="/" className="btn btn--soft btn--sm">
                    {t('nav.home')}
                  </Link>
                }
              />
            ))}
        </div>
      </main>
    </>
  );
}
