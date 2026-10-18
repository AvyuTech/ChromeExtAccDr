import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { placePhoto } from '../assets/photos';
import { Avatar, Cover, ShareButton } from '../components/cards';
import { WantButton } from '../components/friends';
import { useListEdits } from '../components/people';
import { EmptyState, PageHeader, Sheet } from '../components/ui';
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
        <section className="list-hero" aria-labelledby="list-title">
          <div className={`list-hero__mosaic list-hero__mosaic--${Math.min(Math.max(places.length, 1), 4)} tone-${col.tone}`} aria-hidden="true">
            {places.length ? (
              places.slice(0, 4).map((p) => (
                <span key={p.id} className={`tone-${p.tone}`}>
                  {placePhoto(p.id) ? <img src={placePhoto(p.id)} alt="" decoding="async" /> : <NamedGlyph name={p.glyph} size={28} duo />}
                </span>
              ))
            ) : (
              <span>
                <NamedGlyph name={col.glyph} size={40} duo live />
              </span>
            )}
            <span className="list-hero__count">
              <NamedGlyph name="lists" size={14} />
              {places.length} {places.length === 1 ? 'place' : 'places'}
            </span>
          </div>
          <div className="list-hero__content">
            <h1 className="list-hero__title" id="list-title">
              {col.title}
            </h1>
            {col.description ? <p className="list-hero__body">{col.description}</p> : null}
            <div className="row row--wrap" style={{ gap: 10 }}>
              <Link to={own ? '/me' : `/people/${col.ownerId}`} className="list-hero__owner">
                <Avatar who={{ ...owner, verified: false }} size={22} />
                {own ? 'Your list' : t('people.by', { name: owner.name })}
              </Link>
              <span className="list-hero__meta">{compact(col.followers + (followed ? 1 : 0))} followers</span>
            </div>
          </div>
        </section>

        <div className="row row--wrap list-actions" style={{ gap: 6 }}>
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
            <WantGlyph size={16} />
            {t('people.addAll')}
          </button>
        </div>

        {places.length ? (
          <ol className="list-places">
            {places.map((p, i) => {
              const c = placeCommunity(p.id, data, settings);
              const note = col.notes?.[p.id];
              return (
                <li key={p.id} className="list-place glyph-host">
                  <Link to={`/place/${p.id}`} className="row grow" style={{ textDecoration: 'none', color: 'inherit', alignItems: 'flex-start', minWidth: 0, gap: 12 }}>
                    <Cover src={placePhoto(p.id)} glyph={p.glyph} tone={p.tone} className="list-place__photo">
                      <span className="list-place__num" aria-hidden="true">
                        {i + 1}
                      </span>
                    </Cover>
                    <span className="stack grow" style={{ gap: 3, minWidth: 0 }}>
                      <span className="list-place__name">{p.name}</span>
                      <span className="meta">
                        {p.kind} · {p.area} · {km(p.distanceKm)}
                      </span>
                      {note ? (
                        <span className="list-place__note">
                          <b>{own ? 'Your note' : owner.name.split(' ')[0]}:</b> {note}
                        </span>
                      ) : null}
                      {c.total || c.friendIds.length ? (
                        <span className="list-place__facts">
                          {c.total ? (
                            <span className="row" style={{ gap: 3, color: 'var(--mint-ink)' }}>
                              <NamedGlyph name="must" size={12} duo />
                              {c.mustPct}% must try
                            </span>
                          ) : null}
                          {c.friendIds.length ? (
                            <span style={{ color: 'var(--accent)' }}>{c.friendIds.length === 1 ? '1 friend has been' : `${c.friendIds.length} friends have been`}</span>
                          ) : null}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                  <span className="stack" style={{ gap: 0 }}>
                    <WantButton item={wantFor(p)} variant="icon" />
                    {own ? (
                      <button
                        type="button"
                        className="icon-btn icon-btn--ghost"
                        aria-label={`${t('people.remove')}: ${p.name}`}
                        style={{ width: 32, height: 32, color: 'var(--muted)' }}
                        onClick={() => {
                          save(col.id, { placeIds: col.placeIds.filter((x) => x !== p.id) });
                          toast(`Removed ${p.name}`, {
                            label: 'Undo',
                            onClick: () => save(col.id, { placeIds: col.placeIds }),
                          });
                        }}
                      >
                        <TrashGlyph size={17} />
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
