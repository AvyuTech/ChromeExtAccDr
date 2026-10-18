import { useState, type ChangeEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { placePhoto } from '../assets/photos';
import { Cover } from '../components/cards';
import { EmptyState, PageHeader, Sheet } from '../components/ui';
import { CLAIM_PROOFS, CLAIM_ROLES, CLAIM_STEPS, OWNER_CAN, OWNER_CANNOT, pagePhone, type ClaimProof, type ClaimRole, type PageClaim } from '../data/pages';
import { placeById } from '../data/places';
import type { Place } from '../data/types';
import { BackGlyph, CertificateGlyph, CheckGlyph, ClockGlyph, CloseGlyph, PhoneGlyph, ShieldGlyph, UsersGlyph } from '../icons';
import { useAppData } from '../state/appData';
import { useSettings } from '../state/settings';
import { useToast } from '../state/toast';

const STEPS = ['What claiming does', 'Your role', 'You', 'Proof of the business', 'Reach the venue', 'Check and send'];

/** Claim a page: prove you run it, with a document and a code to the venue's phone. */
export default function Claim() {
  const { id = '' } = useParams();
  const { data } = useAppData();
  const place = placeById(id);

  if (!place) {
    return (
      <>
        <PageHeader title="Claim a page" fallback="/explore" />
        <main className="page page--with-header page--no-nav">
          <EmptyState
            glyph="pin"
            title="We couldn’t find that page"
            action={
              <Link to="/explore" className="btn btn--soft btn--sm">
                Back to Explore
              </Link>
            }
          />
        </main>
      </>
    );
  }
  const mine = data.myClaims[place.id];
  if (mine) return <ClaimStatus place={place} claim={mine} />;
  if (place.origin.publicPlace) return <PublicPlace place={place} />;
  return <ClaimFlow place={place} />;
}

/** The page being claimed, as one flat row. */
function PageLine({ place }: { place: Place }) {
  return (
    <Link to={`/place/${place.id}`} className="claim-page">
      <Cover src={placePhoto(place.id)} glyph={place.glyph} tone={place.tone} className="claim-page__photo" />
      <span className="stack grow" style={{ gap: 1, minWidth: 0 }}>
        <span className="strong">{place.name}</span>
        <span className="meta">
          {place.kind} · {place.area}
        </span>
      </span>
    </Link>
  );
}

function PublicPlace({ place }: { place: Place }) {
  return (
    <>
      <PageHeader title="Claim a page" fallback={`/place/${place.id}`} />
      <main className="page page--with-header page--no-nav page-flow">
        <PageLine place={place} />
        <div className="flow-block">
          <span className="flow-block__icon">
            <UsersGlyph size={22} />
          </span>
          <h2 className="report-title">Public places can’t be claimed</h2>
          <p className="body-sm muted">
            Parks, lakes, markets and streets belong to everyone. Locals keep the facts right with their check-ins, and Nearhood guides fix hours and details when
            something changes. If you look after {place.name} for the city, tell a guide and they’ll keep your updates on the page.
          </p>
          <Link to={`/place/${place.id}`} className="btn btn--soft btn--block">
            Back to the page
          </Link>
        </div>
      </main>
    </>
  );
}

function ClaimFlow({ place }: { place: Place }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { settings } = useSettings();
  const { claimPage } = useAppData();
  const claimedBy = place.origin.claimed;

  const [step, setStep] = useState(0);
  const [role, setRole] = useState<ClaimRole | null>(null);
  const [proof, setProof] = useState<ClaimProof | null>(null);
  const [fileName, setFileName] = useState('');
  const [called, setCalled] = useState(false);
  const [code, setCode] = useState('');
  const [confirmLeave, setConfirmLeave] = useState(false);

  const idOk = settings.profile.idVerified;
  const ready = [true, !!role, idOk, !!proof && !!fileName, /^\d{6}$/.test(code), true][step];
  const phone = pagePhone(place.id);

  const leave = () => (window.history.length > 1 ? navigate(-1) : navigate(`/place/${place.id}`));
  const back = () => {
    if (step > 0) setStep(step - 1);
    else if (role || proof) setConfirmLeave(true);
    else leave();
  };

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFileName(f.name);
  };

  const submit = () => {
    if (!role || !proof) return;
    const claim: PageClaim = { role, proof, fileName, submittedAt: 'Just now', status: 'phone' };
    claimPage(place.id, claim);
    toast('Claim sent. We’ll check your document within 2 working days.');
  };

  return (
    <>
      <header className="page-header">
        <button type="button" className="icon-btn" aria-label={step === 0 ? 'Cancel' : 'Back'} onClick={back}>
          {step === 0 ? <CloseGlyph size={20} /> : <BackGlyph size={20} />}
        </button>
        <div className="grow" style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 className="page-header__title">Claim {place.name}</h1>
          <span className="meta">
            Step {step + 1} of {STEPS.length}
          </span>
        </div>
      </header>
      <div
        className="report-steps"
        style={{ gridTemplateColumns: `repeat(${STEPS.length}, minmax(0, 1fr))` }}
        role="progressbar"
        aria-label="Claim progress"
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
            <PageLine place={place} />
            {claimedBy ? (
              <p className="flow-note">
                <ShieldGlyph size={15} />
                <span>
                  Already run by {claimedBy.name}, {claimedBy.role.toLowerCase()}, since {claimedBy.since}. If you’re the new owner, send your proof and we’ll check with
                  them before anything changes.
                </span>
              </p>
            ) : null}
            <p className="body-sm muted">Claiming lets the people who run a place keep its facts right. It never changes what locals say about it.</p>
            <span className="eyebrow muted">Once approved, you can</span>
            <ul className="fact-list fact-list--quiet">
              {OWNER_CAN.map((x) => (
                <li key={x}>
                  <CheckGlyph size={15} />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
            <span className="eyebrow muted">You never can</span>
            <ul className="fact-list fact-list--quiet fact-list--never">
              {OWNER_CANNOT.map((x) => (
                <li key={x}>
                  <CloseGlyph size={15} />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
            <p className="meta">Takes about 2 working days. Keep a licence or registration in the business’s name handy, and be at the venue for a phone call.</p>
          </>
        ) : null}

        {step === 1 ? (
          <div className="list" role="radiogroup" aria-label="Your role">
            {CLAIM_ROLES.map((r) => (
              <button key={r.value} type="button" role="radio" aria-checked={role === r.value} className="list-row flow-option" onClick={() => setRole(r.value)}>
                <span className="flow-option__radio" aria-hidden="true" />
                <span className="list-row__body">
                  <span className="list-row__title">{r.value}</span>
                  <span className="list-row__meta">{r.note}</span>
                </span>
              </button>
            ))}
          </div>
        ) : null}

        {step === 2 ? (
          idOk ? (
            <>
              <div className="list">
                <div className="list-row">
                  <span className="flow-icon">
                    <ShieldGlyph size={18} />
                  </span>
                  <span className="list-row__body">
                    <span className="list-row__title">{settings.profile.name}</span>
                    <span className="list-row__meta">ID verified through DigiLocker</span>
                  </span>
                  <span className="id-row__state is-done" aria-label="Done">
                    <CheckGlyph size={14} />
                  </span>
                </div>
              </div>
              <p className="body-sm muted">Your name shows on the page as the person who runs it. The name on your document should match, or show you as a partner or director.</p>
            </>
          ) : (
            <div className="flow-block">
              <span className="flow-block__icon">
                <ShieldGlyph size={22} />
              </span>
              <p className="body-sm muted">Only people with a verified ID can run a page, so locals know a real person answers for it. It takes about a minute through DigiLocker.</p>
              <Link to="/settings/identity" className="btn btn--primary btn--block">
                Verify your ID
              </Link>
            </div>
          )
        ) : null}

        {step === 3 ? (
          <>
            <p className="body-sm muted">One document in the name of {place.name} or the company behind it. Only the Nearhood team sees it, and it’s deleted once the claim is decided.</p>
            <div className="list" role="radiogroup" aria-label="Proof of the business">
              {CLAIM_PROOFS.map((p) => (
                <button key={p.value} type="button" role="radio" aria-checked={proof === p.value} className="list-row flow-option" onClick={() => setProof(p.value)}>
                  <span className="flow-option__radio" aria-hidden="true" />
                  <span className="list-row__body">
                    <span className="list-row__title">{p.value}</span>
                    <span className="list-row__meta">{p.note}</span>
                  </span>
                </button>
              ))}
            </div>
            <label className={`flow-upload${fileName ? ' is-done' : ''}`}>
              <span className="flow-icon">{fileName ? <CheckGlyph size={18} /> : <CertificateGlyph size={18} />}</span>
              <span className="stack grow" style={{ gap: 1, minWidth: 0 }}>
                <span className="strong">{fileName || 'Add a photo or PDF of it'}</span>
                <span className="meta">{fileName ? 'Tap to change' : 'All four corners, readable'}</span>
              </span>
              <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={onFile} />
            </label>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <p className="body-sm muted">
              We’ll call <b>{phone}</b>, the number locals listed for this page, and read out a 6-digit code. Pick up at the venue and type it here.
            </p>
            <button
              type="button"
              className={`btn btn--block ${called ? 'btn--soft' : 'btn--primary'}`}
              onClick={() => {
                setCalled(true);
                toast('Calling the venue now. In this preview, any 6 digits work.');
              }}
            >
              <PhoneGlyph size={17} />
              {called ? 'Call again' : 'Call the venue now'}
            </button>
            {called ? (
              <label className="field">
                <span className="field__label">Code from the call</span>
                <input
                  className="input claim-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="••••••"
                  maxLength={6}
                  autoFocus
                />
              </label>
            ) : null}
            <p className="meta">Number out of date? Locals can correct it from the page, or a Nearhood guide can visit instead. That takes a few days longer.</p>
          </>
        ) : null}

        {step === 5 && role && proof ? (
          <>
            <PageLine place={place} />
            <dl className="claim-review">
              <dt>Role</dt>
              <dd>{role}</dd>
              <dt>You</dt>
              <dd>{settings.profile.name} · ID verified</dd>
              <dt>Proof</dt>
              <dd>
                {proof}
                {fileName ? <span className="meta"> · {fileName}</span> : null}
              </dd>
              <dt>Venue phone</dt>
              <dd>Code confirmed</dd>
            </dl>
            <p className="flow-note">
              <ClockGlyph size={15} />
              <span>The Nearhood team checks the document within 2 working days. If anything is unclear, a local guide may drop by. Locals see the page as it is until then.</span>
            </p>
          </>
        ) : null}

        <div className="report-footer">
          {step === 5 ? (
            <button type="button" className="btn btn--primary btn--lg btn--block" onClick={submit}>
              Send claim
            </button>
          ) : (
            <button type="button" className="btn btn--primary btn--lg btn--block" disabled={!ready} onClick={() => setStep(step + 1)}>
              {step === 0 ? (claimedBy ? 'I’m the new owner' : 'Start my claim') : 'Next'}
            </button>
          )}
        </div>
      </main>

      <Sheet open={confirmLeave} onClose={() => setConfirmLeave(false)} title="Stop this claim?">
        <p className="body-sm muted">Nothing has been sent yet. You can start again from the page any time.</p>
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
            Stop
          </button>
        </div>
      </Sheet>
    </>
  );
}

/** Where a sent claim is, step by step. */
function ClaimStatus({ place, claim }: { place: Place; claim: PageClaim }) {
  const reached = CLAIM_STEPS.findIndex((s) => s.status === claim.status);
  return (
    <>
      <PageHeader title={`Claim for ${place.name}`} sub={`Sent ${claim.submittedAt.toLowerCase()}`} fallback={`/place/${place.id}`} />
      <main className="page page--with-header page--no-nav page-flow">
        <PageLine place={place} />
        <ol className="claim-timeline">
          {CLAIM_STEPS.map((s, i) => {
            const state = i <= reached ? 'is-done' : i === reached + 1 ? 'is-now' : '';
            return (
              <li key={s.status} className={state}>
                <span className="claim-timeline__dot" aria-hidden="true">
                  {i <= reached ? <CheckGlyph size={12} /> : null}
                </span>
                <span className="stack" style={{ gap: 1 }}>
                  <span className="strong">{s.title}</span>
                  <span className="meta">{i === reached + 1 ? `In progress · ${s.note}` : s.note}</span>
                </span>
              </li>
            );
          })}
        </ol>
        <dl className="claim-review">
          <dt>Role</dt>
          <dd>{claim.role}</dd>
          <dt>Proof</dt>
          <dd>
            {claim.proof}
            {claim.fileName ? <span className="meta"> · {claim.fileName}</span> : null}
          </dd>
        </dl>
        <span className="eyebrow muted">Once approved, you can</span>
        <ul className="fact-list fact-list--quiet">
          {OWNER_CAN.map((x) => (
            <li key={x}>
              <CheckGlyph size={15} />
              <span>{x}</span>
            </li>
          ))}
        </ul>
        <p className="meta">Verdicts and check-ins stay with locals. If someone else also claims this page, we ask both of you for documents before deciding.</p>
        <Link to={`/place/${place.id}`} className="btn btn--soft btn--block">
          Back to the page
        </Link>
      </main>
    </>
  );
}
