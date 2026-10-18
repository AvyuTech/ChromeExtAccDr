import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Avatar, ShareButton } from '../components/cards';
import { WantButton } from '../components/friends';
import { useListEdits } from '../components/people';
import { EmptyState, PageHeader, Sheet, Tile } from '../components/ui';
import { person } from '../data/core';
import { placeById } from '../data/places';
import type { Place } from '../data/types';
import { useT } from '../i18n';
import { EditGlyph, NamedGlyph, TrashGlyph, WantGlyph } from '../icons';
import { compact, km } from '../lib/format';
import { collectionFor, isWanted, placeCommunity } from '../lib/friends';
import { useAppData } from '../state/appData';
import { useSettings } from '../state/settings';
import { useToast } from '../state/toast';

export default function ListDetail() {
  const { id = '' } = useParams();
  const t = useT();
  const toast = useToast();
  const { data, has, toggle, toggleWant } = useAppData();
  const { settings } = useSettings();
  const { apply, save } = useListEdits();
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDescription, setDraftDescription] = useState('');

  const raw = collectionFor(data, id);
  if (!raw) {
    return (
      <>
        <PageHeader title={t('people.list')} fallback="/me?tab=lists" />
        <main className="page page--with-header">
          <EmptyState
            glyph="lists"
            title={t('people.listNotFound')}
            body="It may have been deleted or made private."
            action={
              <Link to="/explore" className="btn btn--soft btn--sm">
                {t('nav.explore')}
              </Link>
            }
          />
        </main>
      </>
    );
  }

  const col = apply(raw);
  const own = col.ownerId === 'me';
  const owner = person(col.ownerId);
  const followed = has('followedCollections', col.id);
  const places = col.placeIds.map((pid) => placeById(pid)).filter((p): p is Place => !!p);
  const wantFor = (p: Place) => ({ id: `w-${col.id}-${p.id}`, kind: 'place' as const, refId: p.id, title: p.name, sub: p.area, fromId: own ? undefined : col.ownerId });
  const missing = places.filter((p) => !isWanted(data, wantFor(p)));

  const addAll = () => {
    for (const p of missing) toggleWant(wantFor(p));
    toast(missing.length ? `Added ${missing.length} ${missing.length === 1 ? 'place' : 'places'} to Want to try` : 'Everything here is already on your list');
  };

  const openEdit = () => {
    setDraftTitle(col.title);
    setDraftDescription(col.description);
    setEditing(true);
  };
  const saveEdit = (e: FormEvent) => {
    e.preventDefault();
    if (!draftTitle.trim()) return;
    save(col.id, { title: draftTitle.trim(), description: draftDescription.trim() });
    setEditing(false);
    toast('List updated');
  };

  return (
    <>
      <PageHeader
        title={t('people.list')}
        fallback={own ? '/me?tab=lists' : `/people/${col.ownerId}?tab=lists`}
        actions={
          <>
            {own ? (
              <button type="button" className="icon-btn" aria-label={t('people.rename')} onClick={openEdit}>
                <EditGlyph size={18} />
              </button>
            ) : null}
            <ShareButton title={`${col.title} on Nearhood`} path={`/lists/${col.id}`} />
          </>
        }
      />
      <main className="page page--with-header">
        <section className={`list-hero tone-${col.tone}`} aria-labelledby="list-title">
          <span className="list-hero__glyph">
            <NamedGlyph name={col.glyph} size={30} duo live />
          </span>
          <h1 className="list-hero__title" id="list-title">
            {col.title}
          </h1>
          {col.description ? <p className="list-hero__body">{col.description}</p> : null}
          <div className="row row--wrap" style={{ gap: 10 }}>
            <Link to={own ? '/me' : `/people/${col.ownerId}`} className="list-hero__owner">
              <Avatar who={{ ...owner, verified: false }} size={26} />
              {own ? 'Your list' : t('people.by', { name: owner.name })}
            </Link>
            <span className="list-hero__meta">
              {places.length} places · {compact(col.followers + (followed ? 1 : 0))} followers
            </span>
          </div>
        </section>

        <div className="row row--wrap" style={{ gap: 8 }}>
          {own ? null : (
            <button
              type="button"
              className={`btn ${followed ? 'btn--secondary' : 'btn--primary'}`}
              aria-pressed={followed}
              onClick={() => {
                const on = toggle('followedCollections', col.id);
                toast(on ? `Following "${col.title}"` : `Stopped following "${col.title}"`);
              }}
            >
              {followed ? t('people.followingList') : t('people.followList')}
            </button>
          )}
          <button type="button" className="btn btn--soft" onClick={addAll} disabled={places.length === 0}>
            <WantGlyph size={18} />
            {t('people.addAll')}
          </button>
        </div>

        {places.length ? (
          <ol className="list-places">
            {places.map((p, i) => {
              const c = placeCommunity(p.id, data, settings);
              const note = col.notes?.[p.id];
              return (
                <li key={p.id} className="card list-place glyph-host">
                  <span className="list-place__num" aria-hidden="true">
                    {i + 1}
                  </span>
                  <Link to={`/place/${p.id}`} className="row grow" style={{ textDecoration: 'none', color: 'inherit', alignItems: 'flex-start', minWidth: 0 }}>
                    <Tile glyph={p.glyph} tone={p.tone} size="lg" />
                    <span className="stack grow" style={{ gap: 4, minWidth: 0 }}>
                      <span className="strong" style={{ fontSize: '0.96875rem' }}>
                        {p.name}
                      </span>
                      <span className="meta">
                        {p.kind} · {p.area} · {km(p.distanceKm)}
                      </span>
                      {note ? (
                        <span className="list-place__note">
                          <b>{own ? 'Your note' : owner.name.split(' ')[0]}:</b> {note}
                        </span>
                      ) : null}
                      <span className="row row--wrap" style={{ gap: 6 }}>
                        {c.total ? (
                          <span className="badge badge--sm tone-mint" style={{ gap: 4 }}>
                            <NamedGlyph name="must" size={12} duo />
                            {c.mustPct}% must try
                          </span>
                        ) : null}
                        {c.friendIds.length ? (
                          <span className="badge badge--sm tone-violet">
                            {c.friendIds.length === 1 ? '1 friend has been' : `${c.friendIds.length} friends have been`}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </Link>
                  <span className="stack" style={{ gap: 2 }}>
                    <WantButton item={wantFor(p)} variant="icon" />
                    {own ? (
                      <button
                        type="button"
                        className="icon-btn icon-btn--ghost"
                        aria-label={`${t('people.remove')}: ${p.name}`}
                        style={{ width: 38, height: 38, color: 'var(--muted)' }}
                        onClick={() => {
                          save(col.id, { placeIds: col.placeIds.filter((x) => x !== p.id) });
                          toast(`Removed ${p.name}`, {
                            label: 'Undo',
                            onClick: () => save(col.id, { placeIds: col.placeIds }),
                          });
                        }}
                      >
                        <TrashGlyph size={18} />
                      </button>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ol>
        ) : (
          <EmptyState glyph="lists" title={t('people.emptyListPlaces')} body="Add places from any place page." />
        )}
      </main>

      <Sheet open={editing} onClose={() => setEditing(false)} title={t('people.rename')}>
        <form className="stack" onSubmit={saveEdit}>
          <label className="field">
            <span className="field__label">{t('people.listTitle')}</span>
            <input className="input" value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} maxLength={60} required />
          </label>
          <label className="field">
            <span className="field__label">{t('people.listDescription')}</span>
            <input className="input" value={draftDescription} onChange={(e) => setDraftDescription(e.target.value)} maxLength={120} />
          </label>
          <button type="submit" className="btn btn--primary btn--block" disabled={!draftTitle.trim()}>
            {t('people.save')}
          </button>
        </form>
      </Sheet>
    </>
  );
}
