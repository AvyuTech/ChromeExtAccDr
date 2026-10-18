import { useState, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { placePhoto } from '../assets/photos';
import { Cover } from '../components/cards';
import { useShare } from '../components/discover';
import { PageHeader, Sheet } from '../components/ui';
import { NEIGHBOURHOODS, neighbourhoodName } from '../data/core';
import { CONNECTIONS, NEEDED_TO_LIST, pageFiling, shrinkPhoto, type PageConnection } from '../data/pages';
import type { SpottedPlace } from '../data/types';
import { BackGlyph, CameraGlyph, CheckGlyph, ChevronRightGlyph, CloseGlyph, HomePinGlyph, ImageGlyph, NamedGlyph, PlusGlyph, SearchGlyph, ShieldGlyph } from '../icons';
import { pageMatches, spotPhoto } from '../lib/places';
import { useAppData } from '../state/appData';
import { useSettings } from '../state/settings';
import { useToast } from '../state/toast';

const STEPS = ['Search first', 'The basics', 'A photo', 'Why it’s worth knowing'];
const KIND_IDEAS = ['Café', 'Restaurant', 'Street food', 'Courts', 'Park', 'Studio', 'Shop'];

/**
 * Add a page. Any verified resident can; the page waits in "Spotted by locals"
 * until three verified visits (or one Nearhood guide) confirm it.
 */
export default function PageNew() {
  const { settings } = useSettings();
  if (!settings.profile.verifiedResident) {
    return (
      <>
        <PageHeader title="Add a page" fallback="/explore" />
        <main className="page page--with-header page--no-nav page-flow">
          <div className="flow-block">
            <span className="flow-block__icon">
              <HomePinGlyph size={22} />
            </span>
            <h2 className="report-title">Confirm where you live first</h2>
            <p className="body-sm muted">
              Pages are added by verified residents, so every café, court and corner shop on Nearhood was put there by someone real. It takes a minute: a utility bill or
              two neighbours who already live there.
            </p>
            <Link to="/settings/identity" className="btn btn--primary btn--block">
              Verify where you live
            </Link>
          </div>
        </main>
      </>
    );
  }
  return <PageForm />;
}

function PageForm() {
  const navigate = useNavigate();
  const toast = useToast();
  const share = useShare();
  const [params] = useSearchParams();
  const { settings } = useSettings();
  const { data, addSpot } = useAppData();
  const fromCheckIn = params.get('from') === 'checkin';

  const [step, setStep] = useState(0);
  const [name, setName] = useState(params.get('name') ?? '');
  const [kind, setKind] = useState('');
  const [areaId, setAreaId] = useState(settings.location.home);
  const [pin, setPin] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [why, setWhy] = useState('');
  const [connection, setConnection] = useState<PageConnection>('found');
  const [added, setAdded] = useState<SpottedPlace | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const matches = pageMatches(name, data);
  const anyMatch = matches.listed.length + matches.spotted.length > 0;
  const nameOk = name.trim().length >= 2;
  const ready = [nameOk, nameOk && kind.trim().length >= 2, !!photo, why.trim().length >= 4][step] ?? false;
  const dirty = !!(kind || photo || why || pin);

  const leave = () => (window.history.length > 1 ? navigate(-1) : navigate('/explore'));
  const back = () => {
    if (step > 0) setStep(step - 1);
    else if (dirty) setConfirmLeave(true);
    else leave();
  };

  const onPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoBusy(true);
    try {
      setPhoto(await shrinkPhoto(f));
    } catch {
      toast('Couldn’t read that photo. Try another one.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const submit = () => {
    const filing = pageFiling(kind);
    const spot: SpottedPlace = {
      id: `spot-${Date.now()}`,
      name: name.trim(),
      kind: kind.trim(),
      category: filing.category,
      area: neighbourhoodName(areaId),
      spottedBy: 'me',
      ago: 'Just now',
      note: [why.trim(), pin.trim()].filter(Boolean).join(' · '),
      // The person adding it doesn't count: three other locals confirm.
      confirmedBy: [],
      needed: NEEDED_TO_LIST,
      glyph: filing.glyph,
      tone: filing.tone,
      photo: photo ?? undefined,
    };
    addSpot(spot);
    setAdded(spot);
  };

  if (added) {
    return (
      <>
        <PageHeader title="Page added" back={false} />
        <main className="page page--with-header page--no-nav page-flow">
          <div className="page-added">
            <span className="page-added__photo photo-frame">
              {spotPhoto(added) ? <img src={spotPhoto(added)} alt="" /> : <NamedGlyph name={added.glyph} size={30} />}
              <span className="page-added__tick">
                <CheckGlyph size={16} />
              </span>
            </span>
            <h2 className="report-title">{added.name} is on Nearhood</h2>
            <p className="meta">
              {added.kind} · {added.area} · Added by you
            </p>
            <span className="spotted-row__progress page-added__progress" aria-label={`0 of ${added.needed} confirmations`}>
              {Array.from({ length: added.needed }, (_, i) => (
                <span key={i} />
              ))}
              <small>0 of {added.needed} confirmations</small>
            </span>
          </div>
          <ol className="flow-next">
            <li>It shows in Explore under Spotted by locals, where neighbours who’ve been can confirm it.</li>
            <li>It goes live when {added.needed} verified locals check in or confirm it, or one Nearhood guide does.</li>
            <li>“Added by you” stays on the page for good, and you get 25 helpful points when it goes live.</li>
            {connection === 'run' ? <li>Once it’s live, open the page and tap “Run this place? Claim it” to keep the facts right.</li> : null}
          </ol>
          <div className="stack" style={{ gap: 10 }}>
            {fromCheckIn ? (
              <button type="button" className="btn btn--primary btn--block" onClick={() => navigate(`/checkin?spot=${added.id}`, { replace: true })}>
                Check in here now
              </button>
            ) : null}
            <button type="button" className={`btn btn--block ${fromCheckIn ? 'btn--soft' : 'btn--primary'}`} onClick={() => share(`Have you been to ${added.name}? Confirm it on Nearhood`, '/explore')}>
              Share with friends to confirm
            </button>
            <Link to="/explore" className="btn btn--ghost btn--block" replace>
              See it in Spotted by locals
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <header className="page-header">
        <button type="button" className="icon-btn" aria-label={step === 0 ? 'Cancel' : 'Back'} onClick={back}>
          {step === 0 ? <CloseGlyph size={20} /> : <BackGlyph size={20} />}
        </button>
        <div className="grow" style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 className="page-header__title">Add a page</h1>
          <span className="meta">
            Step {step + 1} of {STEPS.length}
          </span>
        </div>
      </header>
      <div
        className="report-steps"
        style={{ gridTemplateColumns: `repeat(${STEPS.length}, minmax(0, 1fr))` }}
        role="progressbar"
        aria-label="Adding a page"
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-valuenow={step + 1}
      >
        {STEPS.map((s, i) => (
          <span key={s} className={i <= step ? 'is-on' : ''} />
        ))}
      </div>

      <main className="page page--with-header page--no-nav page-flow">
        <h2 className="report-title">{STEPS[step]}</h2>

        {step === 0 ? (
          <>
            <p className="body-sm muted">Most places are already here. Type the name so we don’t end up with two pages for one place.</p>
            <label className="search-field" htmlFor="pn-name">
              <SearchGlyph size={18} />
              <input
                id="pn-name"
                type="search"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name of the place"
                autoComplete="off"
                maxLength={60}
                autoFocus
              />
            </label>
            {nameOk && anyMatch ? (
              <>
                <span className="eyebrow muted">Is it one of these?</span>
                <div className="list">
                  {matches.listed.map((p) => (
                    <Link key={p.id} to={`/place/${p.id}`} className="list-row">
                      <Cover src={placePhoto(p.id)} glyph={p.glyph} tone={p.tone} className="checkin-result__photo" />
                      <span className="list-row__body">
                        <span className="list-row__title">{p.name}</span>
                        <span className="list-row__meta">
                          {p.kind} · {p.area}
                        </span>
                      </span>
                      <ChevronRightGlyph size={16} />
                    </Link>
                  ))}
                  {matches.spotted.map((sp) => (
                    <Link key={sp.id} to="/explore" className="list-row">
                      <Cover src={spotPhoto(sp)} glyph={sp.glyph} tone={sp.tone} className="checkin-result__photo" />
                      <span className="list-row__body">
                        <span className="list-row__title">{sp.name}</span>
                        <span className="list-row__meta">
                          {sp.kind} · {sp.area} · being confirmed, confirm it in Explore
                        </span>
                      </span>
                      <ChevronRightGlyph size={16} />
                    </Link>
                  ))}
                </div>
              </>
            ) : nameOk ? (
              <p className="meta">Nothing called “{name.trim()}” on Nearhood yet.</p>
            ) : null}
          </>
        ) : null}

        {step === 1 ? (
          <div className="stack" style={{ gap: 14 }}>
            <label className="field">
              <span className="field__label">Name</span>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="off" />
            </label>
            <div className="field">
              <label className="field__label" htmlFor="pn-kind">
                What it is
              </label>
              <input
                id="pn-kind"
                className="input"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                placeholder="Pickleball courts, South Indian café, bookshop…"
                maxLength={40}
                autoComplete="off"
              />
              <div className="chip-wrap page-flow__ideas" role="group" aria-label="Ideas">
                {KIND_IDEAS.map((k) => (
                  <button key={k} type="button" className="chip" aria-pressed={kind === k} onClick={() => setKind(k)}>
                    {k}
                  </button>
                ))}
              </div>
              <span className="field__hint">In your own words. Every page looks the same, whatever it is.</span>
            </div>
            <label className="field">
              <span className="field__label">Neighbourhood</span>
              <select className="select" value={areaId} onChange={(e) => setAreaId(e.target.value)}>
                {NEIGHBOURHOODS.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field__label">
                How to find it <span className="muted">· optional</span>
              </span>
              <input className="input" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Behind the petrol pump on SG Road" maxLength={80} />
            </label>
          </div>
        ) : null}

        {step === 2 ? (
          <>
            <p className="body-sm muted">One photo you took there, so people recognise it. No logos or pictures from the internet.</p>
            {photo ? (
              <div className="photo-preview">
                <img src={photo} alt={`Your photo of ${name.trim()}`} />
                <button type="button" className="photo-action" style={{ top: 10, right: 10 }} aria-label="Remove photo" onClick={() => setPhoto(null)}>
                  <CloseGlyph size={18} />
                </button>
              </div>
            ) : (
              <div className="photo-drop" aria-busy={photoBusy}>
                <label className="photo-drop__option photo-drop__option--main">
                  <span className="photo-drop__icon">
                    <CameraGlyph size={20} />
                  </span>
                  <span className="strong">{photoBusy ? 'Reading photo…' : 'Take a photo'}</span>
                  <span className="meta">The front, the sign or the inside</span>
                  <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={onPhoto} />
                </label>
                <label className="photo-drop__option">
                  <span className="photo-drop__icon">
                    <ImageGlyph size={19} />
                  </span>
                  <span className="strong">Choose from photos</span>
                  <input type="file" accept="image/*" className="sr-only" onChange={onPhoto} />
                </label>
              </div>
            )}
          </>
        ) : null}

        {step === 3 ? (
          <div className="stack" style={{ gap: 14 }}>
            <label className="field">
              <span className="field__label">In one line, why should people know about it?</span>
              <input
                className="input"
                value={why}
                onChange={(e) => setWhy(e.target.value)}
                placeholder="Four covered courts, paddles to rent, open till 11"
                maxLength={120}
              />
            </label>
            <fieldset className="field page-flow__set">
              <legend className="field__label">Your connection to it</legend>
              <div className="list" role="radiogroup" aria-label="Your connection to it">
                {CONNECTIONS.map((c) => (
                  <button key={c.value} type="button" role="radio" aria-checked={connection === c.value} className="list-row flow-option" onClick={() => setConnection(c.value)}>
                    <span className="flow-option__radio" aria-hidden="true" />
                    <span className="list-row__body">
                      <span className="list-row__title">{c.label}</span>
                      <span className="list-row__meta">{c.note}</span>
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>
            <p className="spot-rule">
              <ShieldGlyph size={14} />
              It joins Spotted by locals with 0 of {NEEDED_TO_LIST} confirmations. Three verified visits, or one Nearhood guide, put it live.
            </p>
          </div>
        ) : null}

        <div className="report-footer">
          {step === 0 && nameOk ? (
            <button type="button" className="btn btn--primary btn--lg btn--block" onClick={() => setStep(1)}>
              <PlusGlyph size={18} />
              {anyMatch ? `None of these, add “${name.trim()}”` : `Add “${name.trim()}”`}
            </button>
          ) : step === 3 ? (
            <button type="button" className="btn btn--primary btn--lg btn--block" disabled={!ready} onClick={submit}>
              Add page
            </button>
          ) : step > 0 ? (
            <button type="button" className="btn btn--primary btn--lg btn--block" disabled={!ready} onClick={() => setStep(step + 1)}>
              Next
            </button>
          ) : null}
        </div>
      </main>

      <Sheet open={confirmLeave} onClose={() => setConfirmLeave(false)} title="Discard this page?">
        <p className="body-sm muted">What you’ve entered won’t be saved.</p>
        <div className="grid-2">
          <button type="button" className="btn btn--outline" onClick={() => setConfirmLeave(false)}>
            Keep going
          </button>
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => {
              setConfirmLeave(false);
              leave();
            }}
          >
            Discard
          </button>
        </div>
      </Sheet>
    </>
  );
}
