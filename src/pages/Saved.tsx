import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EventRow, PlaceRow, PostCard } from '../components/cards';
import { CollectionCard } from '../components/friends';
import { EmptyState, PageHeader } from '../components/ui';
import { eventById } from '../data/events';
import { placeById } from '../data/places';
import { postById } from '../data/social';
import type { CityEvent, Place, Post } from '../data/types';
import { useT } from '../i18n';
import { collectionFor } from '../lib/friends';
import { useAppData } from '../state/appData';

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
        <div className="tabs" role="tablist" aria-label={t('me.saved')}>
          {tabs.map((x) => (
            <button key={x.id} id={`saved-tab-${x.id}`} type="button" role="tab" className="tab" aria-selected={tab === x.id} aria-controls="saved-panel" onClick={() => setTab(x.id)}>
              {t(x.key)} <span className="muted">{x.n}</span>
            </button>
          ))}
        </div>

        <div id="saved-panel" role="tabpanel" aria-labelledby={`saved-tab-${tab}`} className="stack">
          {tab === 'places' &&
            (places.length ? (
              <div className="list">
                {places.map((p, i) => (
                  <PlaceRow key={p.id} place={p} last={i === places.length - 1} />
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
              events.map((e) => <EventRow key={e.id} event={e} />)
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
              posts.map((p) => <PostCard key={p.id} post={p} />)
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
