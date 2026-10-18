import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { eventPhoto, placePhoto } from '../assets/photos';
import { Avatar, Cover } from '../components/cards';
import { VerdictPicker } from '../components/checkin';
import { Segmented, Sheet, Switch } from '../components/ui';
import { NEIGHBOURHOODS, neighbourhoodName, person } from '../data/core';
import { EVENTS, eventById } from '../data/events';
import { CHECKIN_TAGS, SPEND_BANDS } from '../data/friends';
import { PLACES, placeById } from '../data/places';
import type { CheckInKind, CityEvent, EventCategory, Place, PlaceCategory, SpottedPlace, Tone, Verdict } from '../data/types';
import { useT } from '../i18n';
import { CameraGlyph, CheckGlyph, ChevronDownGlyph, CloseGlyph, ImageGlyph, NamedGlyph, PinGlyph, PlusGlyph, SearchGlyph, ShieldGlyph, type GlyphName } from '../icons';
import { km, rupees } from '../lib/format';
import { itemsFor } from '../lib/friends';
import { useAppData } from '../state/appData';
import { useSettings } from '../state/settings';
import { useToast } from '../state/toast';

type Target =
  | { type: 'place'; place: Place }
  | { type: 'event'; event: CityEvent }
  /** A place that isn't listed; `area` and `kindLabel` are set when someone just added it. */
  | { type: 'custom'; name: string; area?: string; kindLabel?: string };

/** What a newly added place can be. Food kinds switch the check-in to "Ate or drank". */
const SPOT_KINDS: Array<{ id: string; label: string; category: PlaceCategory; glyph: GlyphName; tone: Tone; food: boolean }> = [
  { id: 'cafe', label: 'Café', category: 'cafe', glyph: 'cafe', tone: 'peach', food: true },
  { id: 'restaurant', label: 'Restaurant', category: 'food', glyph: 'food', tone: 'amber', food: true },
  { id: 'street', label: 'Street food', category: 'food', glyph: 'food', tone: 'yellow', food: true },
  { id: 'bakery', label: 'Bakery', category: 'cafe', glyph: 'cafe', tone: 'clay', food: true },
  { id: 'park', label: 'Park or lake', category: 'nature', glyph: 'nature', tone: 'mint', food: false },
  { id: 'class', label: 'Class or studio', category: 'culture', glyph: 'pottery', tone: 'violet', food: false },
  { id: 'sport', label: 'Sports', category: 'sports', glyph: 'sports', tone: 'teal', food: false },
  { id: 'shop', label: 'Shop or market', category: 'shopping', glyph: 'shopping', tone: 'blue', food: false },
];
const NEEDED_TO_LIST = 3;

const isFood = (p: Place) => p.category === 'food' || p.category === 'cafe';

/** One-tap choices for events, which have no menu. */
const EVENT_ITEMS: Record<EventCategory, string[]> = {
  music: ['Live music', 'Food stalls'],
  market: ['Shopping', 'Street food'],
  comedy: ['Stand-up show'],
  heritage: ['Guided walk'],
  workshop: ['Workshop'],
  food: ['Food trucks', 'Desserts'],
  sports: ['Played', 'Watched'],
  kids: ['Kite-making', 'Kids activity'],
  wellness: ['Yoga session'],
};

/** Choices when the place isn't listed yet. */
const GENERIC: Record<CheckInKind, string[]> = {
  ate: ['Coffee', 'Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Street food'],
  did: ['Walk', 'Shopping', 'Workshop', 'Show', 'Sport'],
};

const WEEKEND_DAYS = ['Today', 'Tomorrow', 'Sat', 'Sun', 'Sat–Sun'];

export default function CheckIn() {
  const [params] = useSearchParams();
  // Remount when the preset changes (?kind, ?place, ?event) so the form starts clean.
  return <CheckInForm key={params.toString()} params={params} />;
}

function initialTarget(params: URLSearchParams): Target | null {
  const event = eventById(params.get('event') ?? '');
  if (event) return { type: 'event', event };
  const place = placeById(params.get('place') ?? '');
  if (place) return { type: 'place', place };
  return null;
}

function CheckInForm({ params }: { params: URLSearchParams }) {
  const t = useT();
  const navigate = useNavigate();
  const toast = useToast();
  const { settings } = useSettings();
  const { data, addCheckIn, setWantDone, addSpot } = useAppData();

  const preset = initialTarget(params);
  const [kind, setKind] = useState<CheckInKind>(() => {
    if (params.get('kind') === 'did' || preset?.type === 'event') return 'did';
    if (preset?.type === 'place') return isFood(preset.place) ? 'ate' : 'did';
    return 'ate';
  });
  const [target, setTarget] = useState<Target | null>(preset);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<string[]>([]);
  const [ownItem, setOwnItem] = useState('');
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [note, setNote] = useState('');
  const [spend, setSpend] = useState<number | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [withIds, setWithIds] = useState<string[]>([]);
  const [photo, setPhoto] = useState<string | null>(null);
  const [verify, setVerify] = useState<'off' | 'checking' | 'on' | 'failed'>('off');
  const [invited, setInvited] = useState(false);
  const [audience, setAudience] = useState<'friends' | 'everyone'>(settings.privacy.checkInAudience);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const verifyAttempt = useRef(0);

  // Add a new place (people add places; businesses can't list themselves)
  const [addOpen, setAddOpen] = useState(false);
  const [spotName, setSpotName] = useState('');
  const [spotKind, setSpotKind] = useState('cafe');
  const [spotArea, setSpotArea] = useState(settings.location.home);
  const [spotNote, setSpotNote] = useState('');

  useEffect(() => () => (photo ? URL.revokeObjectURL(photo) : undefined), [photo]);

  const modePlaces = useMemo(
    () => PLACES.filter((p) => (kind === 'ate' ? isFood(p) : !isFood(p))).sort((a, b) => a.distanceKm - b.distanceKm),
    [kind],
  );
  const guess = modePlaces.find((p) => p.distanceKm <= 2);
  const nearby = modePlaces.filter((p) => p.id !== guess?.id).slice(0, 6);
  const weekendEvents = EVENTS.filter((e) => e.confirmed && WEEKEND_DAYS.includes(e.day)).slice(0, 5);
  const q = query.trim().toLowerCase();
  const results = q
    ? PLACES.filter((p) => `${p.name} ${p.area} ${p.kind}`.toLowerCase().includes(q))
        .sort((a, b) => Number(kind === 'ate' ? isFood(b) : !isFood(b)) - Number(kind === 'ate' ? isFood(a) : !isFood(a)))
        .slice(0, 5)
    : [];

  const suggestions =
    target?.type === 'place' ? itemsFor(target.place.id) : target?.type === 'event' ? EVENT_ITEMS[target.event.category] : GENERIC[kind];
  const chips = Array.from(new Set([...suggestions, ...items]));

  const done = [!!target, items.length > 0, !!verdict].filter(Boolean).length;
  const ready = done === 3;
  const dirty = !!target || items.length > 0 || !!verdict || !!note || !!photo;

  const pick = (next: Target) => {
    setTarget(next);
    setItems([]);
    setQuery('');
  };

  const changeKind = (k: CheckInKind) => {
    setKind(k);
    if (target?.type === 'event' && k === 'ate') setTarget(null);
    if (target?.type === 'place' && (k === 'ate') !== isFood(target.place)) setTarget(null);
    setItems([]);
    if (k === 'ate' && spend === 0) setSpend(undefined);
  };

  const toggleIn = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const addOwn = () => {
    const v = ownItem.trim();
    if (!v) return;
    if (!items.some((i) => i.toLowerCase() === v.toLowerCase())) setItems((xs) => [...xs, v]);
    setOwnItem('');
  };

  const onOwnKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addOwn();
    }
  };

  const startVerify = (on: boolean) => {
    // Each attempt gets a token so a late answer from an older attempt is ignored.
    const attempt = ++verifyAttempt.current;
    if (!on) {
      setVerify('off');
      return;
    }
    if (!('geolocation' in navigator)) {
      setVerify('failed');
      return;
    }
    setVerify('checking');
    const settle = (ok: boolean) => {
      if (attempt !== verifyAttempt.current) return;
      verifyAttempt.current++;
      setVerify(ok ? 'on' : 'failed');
      if (ok) toast(t('checkin.verified'));
    };
    // A permission prompt that is never answered should not leave the switch spinning.
    window.setTimeout(() => settle(false), 12_000);
    try {
      navigator.geolocation.getCurrentPosition(
        () => settle(true),
        () => settle(false),
        { timeout: 8000, maximumAge: 60_000 },
      );
    } catch {
      settle(false);
    }
  };

  const onPhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhoto(URL.createObjectURL(f));
  };

  const openAdd = (name = '') => {
    setSpotName(name);
    setSpotKind(kind === 'ate' ? 'cafe' : 'park');
    setSpotArea(settings.location.home);
    setSpotNote('');
    setAddOpen(true);
  };

  const saveSpot = (e: FormEvent) => {
    e.preventDefault();
    const name = spotName.trim();
    if (!name) return;
    const k = SPOT_KINDS.find((x) => x.id === spotKind) ?? SPOT_KINDS[0];
    const spot: SpottedPlace = {
      id: `spot-${Date.now()}`,
      name,
      kind: k.label,
      category: k.category,
      area: neighbourhoodName(spotArea),
      spottedBy: 'me',
      ago: 'Just now',
      note: spotNote.trim(),
      confirmedBy: ['me'],
      needed: NEEDED_TO_LIST,
      glyph: k.glyph,
      tone: k.tone,
    };
    addSpot(spot);
    const nextKind: CheckInKind = k.food ? 'ate' : 'did';
    if (nextKind !== kind) {
      setKind(nextKind);
      if (nextKind === 'ate' && spend === 0) setSpend(undefined);
    }
    pick({ type: 'custom', name, area: spot.area, kindLabel: k.label });
    setAddOpen(false);
    toast(t('checkin.spot.added', { name, n: spot.needed - spot.confirmedBy.length }));
  };

  const leave = () => (window.history.length > 1 ? navigate(-1) : navigate('/'));

  const share = () => {
    if (!ready || !target || !verdict) return;
    const id = `my-ci-${Date.now()}`;
    const placeId = target.type === 'place' ? target.place.id : undefined;
    const eventId = target.type === 'event' ? target.event.id : undefined;
    const placeName = target.type === 'place' ? target.place.name : target.type === 'event' ? target.event.title : target.name;
    const area = target.type === 'place' ? target.place.area : target.type === 'event' ? target.event.area : (target.area ?? neighbourhoodName(settings.location.home));
    addCheckIn({
      id,
      authorId: 'me',
      kind,
      placeId,
      eventId,
      placeName,
      area,
      items,
      verdict,
      note: note.trim() || undefined,
      spend,
      tags,
      withIds: withIds.length ? withIds : undefined,
      audience,
      verifiedVisit: verify === 'on',
      invited: invited || undefined,
      ago: 'Just now',
      recency: 0,
      likes: 0,
      comments: [],
    });
    const refId = placeId ?? eventId;
    const match = data.wantToTry.find(
      (w) =>
        !w.done &&
        !!refId &&
        w.refId === refId &&
        (w.kind === 'place' || w.kind === 'event' || items.some((i) => i.toLowerCase() === w.title.toLowerCase())),
    );
    const message = t(audience === 'friends' ? 'checkin.sharedFriends' : 'checkin.sharedEveryone');
    if (match) toast(`${message}. ${t('checkin.onList')}`, { label: t('checkin.markDone'), onClick: () => setWantDone(match.id, true) });
    else toast(message);
    navigate(`/checkin/${id}`, { replace: true });
  };

  const stepHead = (n: number, id: string, title: string, complete: boolean) => (
    <h2 className="checkin-step" id={id}>
      <span className={`checkin-step__num${complete ? ' is-done' : ''}`} aria-hidden="true">
        {complete ? <CheckGlyph size={13} /> : n}
      </span>
      {title}
    </h2>
  );

  return (
    <>
      <header className="page-header checkin-header">
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => (dirty ? setConfirmDiscard(true) : leave())}>
          {t('checkin.cancel')}
        </button>
        <h1 className="page-header__title">{t('checkin.title')}</h1>
        <span className="checkin-header__spacer" aria-hidden="true" />
      </header>

      <main className="page page--with-header page--no-nav checkin-page">
        <Segmented
          label={t('checkin.mode')}
          value={kind}
          onChange={changeKind}
          options={[
            { value: 'ate', label: t('checkin.mode.ate') },
            { value: 'did', label: t('checkin.mode.did') },
          ]}
        />

        {/* 1. Where */}
        <section className="section" aria-labelledby="ci-where">
          {stepHead(1, 'ci-where', t('checkin.where'), !!target)}
          {target ? (
            <div className="checkin-target">
              {target.type === 'place' ? (
                <Cover src={placePhoto(target.place.id)} glyph={target.place.glyph} tone={target.place.tone} className="checkin-target__photo" />
              ) : target.type === 'event' ? (
                <Cover src={eventPhoto(target.event.id)} glyph={target.event.glyph} tone={target.event.tone} className="checkin-target__photo" />
              ) : (
                <span className="tile tile--lg tone-violet">
                  <PinGlyph size={24} duo />
                </span>
              )}
              <span className="stack grow" style={{ gap: 2, minWidth: 0 }}>
                <span className="strong" style={{ fontSize: '0.90625rem' }}>
                  {target.type === 'place' ? target.place.name : target.type === 'event' ? target.event.title : target.name}
                </span>
                <span className="meta">
                  {target.type === 'place'
                    ? `${target.place.kind} · ${target.place.area} · ${km(target.place.distanceKm)}`
                    : target.type === 'event'
                      ? `${target.event.day}, ${target.event.time} · ${target.event.area}`
                      : `${target.kindLabel ?? t('checkin.newPlace')} · ${target.area ?? neighbourhoodName(settings.location.home)}${target.kindLabel ? ` · ${t('checkin.spot.pending')}` : ''}`}
                </span>
              </span>
              <button
                type="button"
                className="btn btn--sm btn--outline"
                onClick={() => {
                  setTarget(null);
                  setItems([]);
                }}
              >
                {t('checkin.change')}
              </button>
            </div>
          ) : (
            <>
              {guess && !q ? (
                <button type="button" className="guess-card" onClick={() => pick({ type: 'place', place: guess })}>
                  <Cover src={placePhoto(guess.id)} glyph={guess.glyph} tone={guess.tone} className="guess-card__photo">
                    <span className="guess-card__pin">
                      <PinGlyph size={14} />
                    </span>
                  </Cover>
                  <span className="stack grow" style={{ gap: 2, textAlign: 'left' }}>
                    <span className="strong">{t('checkin.nearGuess', { place: guess.name })}</span>
                    <span className="meta">
                      {t('checkin.guess')} · {guess.area} · {km(guess.distanceKm)}
                    </span>
                  </span>
                  <span className="guess-card__add" aria-hidden="true">
                    <PlusGlyph size={16} />
                  </span>
                </button>
              ) : null}

              <label className="search-field" htmlFor="ci-search">
                <SearchGlyph size={18} />
                <input
                  id="ci-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('checkin.search')}
                  autoComplete="off"
                  enterKeyHint="search"
                />
              </label>

              {q ? (
                <div className="list">
                  {results.length === 0 ? <p className="meta checkin-noresults">{t('checkin.noResults', { q: query.trim() })}</p> : null}
                  {results.map((p) => (
                    <button key={p.id} type="button" className="list-row" onClick={() => pick({ type: 'place', place: p })}>
                      <Cover src={placePhoto(p.id)} glyph={p.glyph} tone={p.tone} className="checkin-result__photo" />
                      <span className="list-row__body">
                        <span className="list-row__title">{p.name}</span>
                        <span className="list-row__meta">
                          {p.kind} · {p.area} · {km(p.distanceKm)}
                        </span>
                      </span>
                    </button>
                  ))}
                  <button type="button" className="list-row" onClick={() => openAdd(query.trim())}>
                    <span className="tile tone-violet">
                      <PlusGlyph size={18} />
                    </span>
                    <span className="list-row__body">
                      <span className="list-row__title">{t('checkin.notListed', { q: query.trim() })}</span>
                      <span className="list-row__meta">{t('checkin.spot.hint')}</span>
                    </span>
                  </button>
                </div>
              ) : (
                <>
                  <span className="eyebrow muted">{t('checkin.nearby')}</span>
                  <div className="hscroll checkin-picks">
                    {nearby.map((p) => (
                      <button key={p.id} type="button" className="checkin-pick" onClick={() => pick({ type: 'place', place: p })}>
                        <Cover src={placePhoto(p.id)} glyph={p.glyph} tone={p.tone} className="checkin-pick__photo" />
                        <span className="checkin-pick__name">{p.name}</span>
                        <span className="checkin-pick__meta">
                          {p.area} · {km(p.distanceKm)}
                        </span>
                      </button>
                    ))}
                  </div>
                  <button type="button" className="checkin-addlink" onClick={() => openAdd()}>
                    {t('checkin.cantFind')}
                  </button>
                  {kind === 'did' && weekendEvents.length ? (
                    <>
                      <span className="eyebrow muted">{t('checkin.thisWeekend')}</span>
                      <div className="hscroll checkin-picks">
                        {weekendEvents.map((e) => (
                          <button key={e.id} type="button" className="checkin-pick" onClick={() => pick({ type: 'event', event: e })}>
                            <Cover src={eventPhoto(e.id)} glyph={e.glyph} tone={e.tone} className="checkin-pick__photo" />
                            <span className="checkin-pick__name">{e.title}</span>
                            <span className="checkin-pick__meta">
                              {e.day} · {e.area}
                            </span>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : null}
                </>
              )}
            </>
          )}
        </section>

        {/* 2. What */}
        <section className="section" aria-labelledby="ci-what">
          {stepHead(2, 'ci-what', t(kind === 'ate' ? 'checkin.whatAte' : 'checkin.whatDid'), items.length > 0)}
          {target ? (
            <>
              <div className="chip-wrap" role="group" aria-labelledby="ci-what">
                {chips.map((c) => (
                  <button key={c} type="button" className="chip chip--accent" aria-pressed={items.includes(c)} onClick={() => setItems((xs) => toggleIn(xs, c))}>
                    {items.includes(c) ? <CheckGlyph size={14} /> : null}
                    {c}
                  </button>
                ))}
              </div>
              <div className="row" style={{ gap: 8 }}>
                <label htmlFor="ci-own" className="sr-only">
                  {t('checkin.addOwn')}
                </label>
                <input
                  id="ci-own"
                  className="input"
                  value={ownItem}
                  onChange={(e) => setOwnItem(e.target.value)}
                  onKeyDown={onOwnKey}
                  placeholder={t('checkin.addOwn')}
                  maxLength={40}
                  autoComplete="off"
                  enterKeyHint="done"
                />
                <button type="button" className="btn btn--soft" onClick={addOwn} disabled={!ownItem.trim()}>
                  {t('checkin.add')}
                </button>
              </div>
            </>
          ) : (
            <p className="meta">{t('checkin.pickPlaceFirst')}</p>
          )}
        </section>

        {/* 3. Verdict */}
        <section className="section" aria-labelledby="ci-verdict">
          {stepHead(3, 'ci-verdict', t('checkin.verdict'), !!verdict)}
          <VerdictPicker value={verdict} kind={kind} onChange={setVerdict} />
        </section>

        {/* Photo */}
        <section className="section" aria-labelledby="ci-photo">
          <h2 className="checkin-step" id="ci-photo">
            <span className="checkin-step__num" aria-hidden="true">
              <CameraGlyph size={13} />
            </span>
            {t('checkin.photo')}
            <span className="meta" style={{ fontWeight: 600 }}>
              · {t('checkin.optional')}
            </span>
          </h2>
          {photo ? (
            <div className="photo-preview">
              <img src={photo} alt="Your photo" />
              {items.length ? (
                <span className="feed-post__tags photo-preview__tags" aria-hidden="true">
                  {items.map((i) => (
                    <span key={i} className="feed-post__tag">
                      {i}
                    </span>
                  ))}
                </span>
              ) : null}
              <button
                type="button"
                className="photo-action"
                style={{ top: 10, right: 10 }}
                aria-label={t('checkin.removePhoto')}
                onClick={() => {
                  URL.revokeObjectURL(photo);
                  setPhoto(null);
                }}
              >
                <CloseGlyph size={18} />
              </button>
            </div>
          ) : (
            <div className="photo-drop">
              <label className="photo-drop__option photo-drop__option--main">
                <span className="photo-drop__icon">
                  <CameraGlyph size={20} />
                </span>
                <span className="strong">{t('checkin.takePhoto')}</span>
                <span className="meta">{t('checkin.photoWhy')}</span>
                <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={onPhoto} />
              </label>
              <label className="photo-drop__option">
                <span className="photo-drop__icon">
                  <ImageGlyph size={19} />
                </span>
                <span className="strong">{t('checkin.choosePhoto')}</span>
                <input type="file" accept="image/*" className="sr-only" onChange={onPhoto} />
              </label>
            </div>
          )}
          <span className="field__hint">{t('checkin.photoNote')}</span>
        </section>

        {/* Optional details */}
        <section className="checkin-details">
          <button type="button" className="details-toggle" aria-expanded={detailsOpen} aria-controls="ci-details" onClick={() => setDetailsOpen((v) => !v)}>
            <span className="strong">{t('checkin.details')}</span>
            <span className="meta">{t('checkin.optional')}</span>
            <span className="grow" />
            <ChevronDownGlyph size={18} className="details-toggle__chev" />
          </button>
          {detailsOpen ? (
            <div id="ci-details" className="stack stack--lg">
              <div className="field">
                <div className="row row--between">
                  <label className="field__label" htmlFor="ci-note">
                    {t('checkin.note')}
                  </label>
                  <span className={`char-count${note.length > 130 ? ' char-count--warn' : ''}`}>{note.length}/140</span>
                </div>
                <input id="ci-note" className="input" value={note} maxLength={140} onChange={(e) => setNote(e.target.value)} placeholder={t('checkin.notePlaceholder')} />
              </div>

              <div className="field">
                <span className="field__label" id="ci-spend">
                  {t('checkin.spend')}
                </span>
                <div className="chip-wrap" role="group" aria-labelledby="ci-spend">
                  {kind === 'did' ? (
                    <button type="button" className="chip chip--accent" aria-pressed={spend === 0} onClick={() => setSpend(spend === 0 ? undefined : 0)}>
                      {t('checkin.free')}
                    </button>
                  ) : null}
                  {SPEND_BANDS.map((b) => (
                    <button key={b.value} type="button" className="chip chip--accent" aria-pressed={spend === b.value} onClick={() => setSpend(spend === b.value ? undefined : b.value)} title={`About ${rupees(b.value)}`}>
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <span className="field__label" id="ci-tags">
                  {t('checkin.tags')}
                </span>
                <div className="chip-wrap" role="group" aria-labelledby="ci-tags">
                  {CHECKIN_TAGS.map((tag) => (
                    <button key={tag} type="button" className="chip chip--accent" aria-pressed={tags.includes(tag)} onClick={() => setTags((xs) => toggleIn(xs, tag))}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {data.following.length ? (
                <div className="field">
                  <span className="field__label" id="ci-with">
                    {t('checkin.with')}
                  </span>
                  <div className="chip-wrap" role="group" aria-labelledby="ci-with">
                    {data.following.map((id) => (
                      <button key={id} type="button" className="chip chip--accent chip--person" aria-pressed={withIds.includes(id)} onClick={() => setWithIds((xs) => toggleIn(xs, id))}>
                        <Avatar who={{ ...person(id), verified: false }} size={22} />
                        {person(id).name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        {/* Trust */}
        <section className="section" aria-labelledby="ci-trust">
          <h2 className="checkin-step" id="ci-trust">
            <ShieldGlyph size={18} />
            {t('checkin.trust')}
          </h2>
          <div className="list">
            <div className="list-row" style={{ alignItems: 'flex-start' }}>
              <span className={`tile ${verify === 'on' ? 'tone-mint' : 'tone-violet'}`}>
                <PinGlyph size={20} duo live={verify === 'checking'} />
              </span>
              <span className="list-row__body">
                <span className="list-row__title">{t('checkin.verify')}</span>
                <span className="list-row__meta" role="status">
                  {verify === 'checking'
                    ? t('checkin.verifying')
                    : verify === 'on'
                      ? t('checkin.verified')
                      : verify === 'failed'
                        ? t('checkin.verifyFailed')
                        : t('checkin.verifyHint')}
                </span>
              </span>
              <Switch checked={verify === 'on' || verify === 'checking'} onChange={startVerify} label={t('checkin.verify')} />
            </div>
            <div className="list-row" style={{ alignItems: 'flex-start' }}>
              <span className="tile tone-amber">
                <NamedGlyph name="deals" size={20} duo />
              </span>
              <span className="list-row__body">
                <span className="list-row__title">{t('checkin.invited')}</span>
                <span className="list-row__meta">{t('checkin.invitedHint')}</span>
              </span>
              <Switch checked={invited} onChange={setInvited} label={t('checkin.invited')} />
            </div>
          </div>
        </section>

        <div className="field">
          <span className="field__label">{t('checkin.audience')}</span>
          <Segmented
            label={t('checkin.audience')}
            value={audience}
            onChange={setAudience}
            options={[
              { value: 'friends', label: t('checkin.friends') },
              { value: 'everyone', label: t('checkin.everyone') },
            ]}
          />
        </div>
      </main>

      <div className="checkin-footer">
        <div className="checkin-footer__progress" aria-live="polite">
          <span className="checkin-dots" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span key={i} className={i < done ? 'is-on' : undefined} />
            ))}
          </span>
          <span className="meta strong">{ready ? t('checkin.ready') : t('checkin.progress', { n: done })}</span>
        </div>
        <button type="button" className="btn btn--primary" disabled={!ready} onClick={share}>
          {t('checkin.share')}
        </button>
      </div>

      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title={t('checkin.spot.title')}>
        <form className="stack spot-form" onSubmit={saveSpot}>
          <label className="field">
            <span className="field__label">{t('checkin.spot.name')}</span>
            <input
              className="input"
              value={spotName}
              onChange={(e) => setSpotName(e.target.value)}
              placeholder={t('checkin.spot.namePh')}
              maxLength={60}
              autoComplete="off"
              required
            />
          </label>
          <div className="field">
            <span className="field__label" id="spot-kind">
              {t('checkin.spot.kind')}
            </span>
            <div className="chip-wrap" role="group" aria-labelledby="spot-kind">
              {SPOT_KINDS.map((k) => (
                <button key={k.id} type="button" className="chip chip--accent" aria-pressed={spotKind === k.id} onClick={() => setSpotKind(k.id)}>
                  <NamedGlyph name={k.glyph} size={15} />
                  {k.label}
                </button>
              ))}
            </div>
          </div>
          <label className="field">
            <span className="field__label">{t('checkin.spot.area')}</span>
            <select className="select" value={spotArea} onChange={(e) => setSpotArea(e.target.value)}>
              {NEIGHBOURHOODS.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">
              {t('checkin.spot.note')} <span className="muted">· {t('checkin.optional')}</span>
            </span>
            <input className="input" value={spotNote} onChange={(e) => setSpotNote(e.target.value)} placeholder={t('checkin.spot.notePh')} maxLength={140} />
          </label>
          <label className="spot-photo">
            {photo ? <img src={photo} alt="" /> : <CameraGlyph size={20} />}
            <span className="stack" style={{ gap: 1 }}>
              <span className="strong">{photo ? t('checkin.retake') : t('checkin.spot.photo')}</span>
              <span className="meta">{t('checkin.spot.photoWhy')}</span>
            </span>
            <input type="file" accept="image/*" className="sr-only" onChange={onPhoto} />
          </label>
          <p className="spot-rule">
            <ShieldGlyph size={14} />
            {t('checkin.spot.rule')}
          </p>
          <button type="submit" className="btn btn--primary btn--block" disabled={!spotName.trim()}>
            {t('checkin.spot.save')}
          </button>
        </form>
      </Sheet>

      <Sheet open={confirmDiscard} onClose={() => setConfirmDiscard(false)} title={t('checkin.discardTitle')}>
        <p className="body-sm muted">{t('checkin.discardBody')}</p>
        <div className="row" style={{ gap: 10 }}>
          <button type="button" className="btn btn--outline grow" onClick={() => setConfirmDiscard(false)}>
            {t('checkin.keep')}
          </button>
          <button
            type="button"
            className="btn btn--danger grow"
            onClick={() => {
              setConfirmDiscard(false);
              leave();
            }}
          >
            {t('checkin.discard')}
          </button>
        </div>
      </Sheet>
    </>
  );
}
