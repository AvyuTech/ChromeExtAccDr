import { useEffect, useState, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { allReports, issueMeta, plusOneCount } from '../components/city';
import { Sheet, Tile, ToggleRow } from '../components/ui';
import { ISSUE_TYPES } from '../data/city';
import { NEIGHBOURHOODS } from '../data/core';
import type { CivicReport, IssueCategory } from '../data/types';
import { useT } from '../i18n';
import { BackGlyph, CameraGlyph, CheckGlyph, CloseGlyph, NamedGlyph, PinGlyph, UpvoteGlyph } from '../icons';
import { nowTime } from '../lib/format';
import { useAppData } from '../state/appData';
import { useSettings } from '../state/settings';
import { useToast } from '../state/toast';

const MIN_DESC = 10;

export default function Report() {
  const t = useT();
  const navigate = useNavigate();
  const toast = useToast();
  const { settings } = useSettings();
  const { data, addReport, add } = useAppData();

  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<IssueCategory | null>(null);
  const [description, setDescription] = useState('');
  const [landmark, setLandmark] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [precise, setPrecise] = useState<{ accuracy: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [showName, setShowName] = useState(settings.privacy.profileVisibility !== 'only-me');
  const [confirmCancel, setConfirmCancel] = useState(false);

  // Free the previous preview whenever the photo changes or the flow closes.
  useEffect(() => () => (photo ? URL.revokeObjectURL(photo) : undefined), [photo]);

  const nb = NEIGHBOURHOODS.find((n) => n.id === settings.location.home) ?? NEIGHBOURHOODS[0];
  const meta = category ? issueMeta(category) : null;
  const duplicate = category ? allReports(data).find((r) => r.category === category && r.status < 4 && r.area === nb.name) : undefined;
  const descOk = description.trim().length >= MIN_DESC;
  const dirty = !!category || description.length > 0 || landmark.length > 0 || !!photo;

  const leave = () => (window.history.length > 1 ? navigate(-1) : navigate('/city'));
  const onBack = () => {
    if (step > 0) setStep(step - 1);
    else if (dirty) setConfirmCancel(true);
    else leave();
  };

  const onPhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPhoto(URL.createObjectURL(file));
    e.target.value = '';
  };

  const locate = () => {
    if (!('geolocation' in navigator)) {
      toast('Location is not available on this device');
      return;
    }
    setLocating(true);
    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPrecise({ accuracy: Math.round(pos.coords.accuracy) });
          setLocating(false);
        },
        () => {
          setLocating(false);
          toast('Could not get your location. The neighbourhood will be used.');
        },
        { enableHighAccuracy: true, timeout: 10_000 },
      );
    } catch {
      setLocating(false);
      toast('Location is not available here');
    }
  };

  const plusOne = (r: CivicReport) => {
    add('plusOned', r.id);
    add('followedReports', r.id);
    toast('Added your +1. You will get updates on this report.');
    navigate(`/city/reports/${r.id}`, { replace: true });
  };

  const submit = () => {
    if (!category || !meta || !descOk) return;
    const id = `rep-${Date.now().toString(36)}`;
    const report: CivicReport = {
      id,
      ticket: `AMC-WZ-${Math.floor(10000 + Math.random() * 90000)}`,
      category,
      title: landmark.trim() ? `${meta.label} near ${landmark.trim()}` : `${meta.label} in ${nb.name}`,
      description: description.trim(),
      area: nb.name,
      ward: nb.ward,
      landmark: landmark.trim() || 'Not given',
      createdAgo: 'Just now',
      status: 0,
      plusOnes: 0,
      mine: true,
      timeline: [{ status: 0, label: showName ? 'Reported by you' : 'Reported (name hidden)', time: nowTime(), note: precise ? 'Precise location attached' : undefined }],
    };
    addReport(report);
    toast('Report sent. Neighbours nearby can now verify it.');
    navigate(`/city/reports/${id}`, { replace: true });
  };

  const titles = [t('city.stepType'), t('city.stepDetails'), t('city.stepReview')];

  return (
    <>
      <header className="page-header">
        <button type="button" className="icon-btn" aria-label={step === 0 ? t('common.cancel') : t('common.back')} onClick={onBack}>
          {step === 0 ? <CloseGlyph size={20} /> : <BackGlyph size={20} />}
        </button>
        <div className="grow" style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 className="page-header__title">{t('city.report')}</h1>
          <span className="meta">{t('city.step', { n: step + 1, total: 3 })}</span>
        </div>
      </header>
      <div className="report-steps" role="progressbar" aria-label="Report progress" aria-valuemin={1} aria-valuemax={3} aria-valuenow={step + 1}>
        {[0, 1, 2].map((i) => (
          <span key={i} className={i <= step ? 'is-on' : ''} />
        ))}
      </div>

      <main className="page page--with-header page--no-nav">
        <h2 style={{ fontSize: '1.375rem' }}>{titles[step]}</h2>

        {step === 0 ? (
          <>
            <p className="body-sm muted">Pick the closest match. It goes to the team for {nb.ward} ward.</p>
            <div className="grid-3">
              {ISSUE_TYPES.map((it) => (
                <button
                  key={it.id}
                  type="button"
                  className="issue-pick glyph-host"
                  aria-pressed={category === it.id}
                  onClick={() => {
                    setCategory(it.id);
                    setStep(1);
                  }}
                >
                  <Tile glyph={it.glyph} tone={it.tone} size="lg" />
                  <span>{it.label}</span>
                </button>
              ))}
            </div>
          </>
        ) : null}

        {step === 1 && meta ? (
          <>
            <div className="row card card--tight" style={{ gap: 12 }}>
              <Tile glyph={meta.glyph} tone={meta.tone} />
              <span className="strong grow">{meta.label}</span>
              <button type="button" className="btn btn--ghost btn--sm" style={{ color: 'var(--accent)' }} onClick={() => setStep(0)}>
                Change
              </button>
            </div>

            {duplicate ? (
              <section className="card card--accent stack" aria-label="Possible duplicate" style={{ gap: 10 }}>
                <span className="eyebrow" style={{ color: 'var(--accent-strong)' }}>
                  Already reported nearby
                </span>
                <span className="strong">{duplicate.title}</span>
                <span className="meta">
                  {duplicate.landmark} · {duplicate.createdAgo}
                </span>
                <p className="body-sm">
                  {duplicate.mine
                    ? 'You already reported something similar here. Following it is faster than a new report.'
                    : `${plusOneCount(duplicate, data)} neighbours already reported this. Add your +1 instead and the crew sees it is still a problem.`}
                </p>
                <div className="grid-2">
                  {duplicate.mine ? (
                    <Link to={`/city/reports/${duplicate.id}`} className="btn btn--primary btn--sm">
                      View my report
                    </Link>
                  ) : (
                    <button type="button" className="btn btn--primary btn--sm" disabled={data.plusOned.includes(duplicate.id)} onClick={() => plusOne(duplicate)}>
                      <UpvoteGlyph size={16} />
                      {data.plusOned.includes(duplicate.id) ? 'Added' : 'Add my +1'}
                    </button>
                  )}
                  <Link to={`/city/reports/${duplicate.id}`} className="btn btn--secondary btn--sm">
                    See details
                  </Link>
                </div>
                <span className="meta">Different spot? Carry on below.</span>
              </section>
            ) : null}

            <div className="field">
              <label className="field__label" htmlFor="rep-desc">
                What did you see?
              </label>
              <textarea
                id="rep-desc"
                className="textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Size, how long it has been there, any danger to people…"
                aria-describedby="rep-desc-hint"
                required
              />
              <span id="rep-desc-hint" className="field__hint">
                {descOk ? 'Looks good.' : `At least ${MIN_DESC} characters (${description.trim().length}/${MIN_DESC}).`}
              </span>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="rep-landmark">
                Nearest landmark
              </label>
              <input
                id="rep-landmark"
                className="input"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. opposite the vegetable market lane"
              />
            </div>

            <div className="field">
              <span className="field__label">Photo (optional)</span>
              {photo ? (
                <div className="report-photo">
                  <img src={photo} alt="Your photo of the issue" />
                  <button type="button" className="icon-btn" aria-label="Remove photo" onClick={() => setPhoto(null)}>
                    <CloseGlyph size={18} />
                  </button>
                </div>
              ) : null}
              <label htmlFor="rep-photo" className="btn btn--outline" style={{ alignSelf: 'flex-start' }}>
                <CameraGlyph size={18} />
                {photo ? 'Change photo' : 'Add a photo'}
              </label>
              <input id="rep-photo" type="file" accept="image/*" capture="environment" className="sr-only" onChange={onPhoto} />
              <span className="field__hint">Photos help the crew find the exact spot. Avoid people's faces and number plates.</span>
            </div>

            <div className="card card--tight row" style={{ gap: 12 }}>
              <span className="tile tone-violet">
                <PinGlyph size={20} duo />
              </span>
              <span className="stack grow" style={{ gap: 2 }}>
                <span className="strong" style={{ fontSize: '0.9375rem' }}>
                  Near {nb.name}
                </span>
                <span className="meta">{precise ? `Precise location added (±${precise.accuracy} m)` : `${nb.ward} ward · neighbourhood only`}</span>
              </span>
              {precise ? (
                <CheckGlyph size={20} style={{ color: 'var(--mint-ink)' }} />
              ) : (
                <button type="button" className="btn btn--soft btn--sm" onClick={locate} disabled={locating}>
                  {locating ? 'Locating…' : 'Use precise'}
                </button>
              )}
            </div>
          </>
        ) : null}

        {step === 2 && meta ? (
          <>
            <section className="card stack" aria-label="Your report" style={{ gap: 12 }}>
              <div className="row" style={{ gap: 12 }}>
                <Tile glyph={meta.glyph} tone={meta.tone} size="lg" />
                <span className="stack" style={{ gap: 2 }}>
                  <span className="strong">{meta.label}</span>
                  <span className="meta">
                    {nb.name} · {nb.ward} ward
                  </span>
                </span>
              </div>
              <p className="body">{description.trim()}</p>
              <dl className="kv">
                <dt>Landmark</dt>
                <dd>{landmark.trim() || 'Not given'}</dd>
                <dt>Location</dt>
                <dd>{precise ? `Precise (±${precise.accuracy} m)` : 'Neighbourhood'}</dd>
                <dt>Photo</dt>
                <dd>{photo ? 'Attached' : 'None'}</dd>
              </dl>
              {photo ? (
                <div className="report-photo">
                  <img src={photo} alt="Your photo of the issue" />
                </div>
              ) : null}
            </section>
            <div className="list">
              <ToggleRow title="Show my name to neighbours" meta="The city's team always sees who reported it." checked={showName} onChange={setShowName} />
            </div>
            <div className="notice tone-violet">
              <NamedGlyph name="users" size={20} />
              <span>
                <b>What happens next:</b> neighbours nearby can verify it. Once verified, it goes to the {nb.ward} ward team and you get every update here.
              </span>
            </div>
          </>
        ) : null}

        {step > 0 ? (
          <div className="report-footer">
            {step === 1 ? (
              <button type="button" className="btn btn--primary btn--lg btn--block" disabled={!descOk} onClick={() => setStep(2)}>
                {t('common.next')}
              </button>
            ) : (
              <button type="button" className="btn btn--primary btn--lg btn--block" onClick={submit}>
                {t('city.submit')}
              </button>
            )}
          </div>
        ) : null}
      </main>

      <Sheet open={confirmCancel} onClose={() => setConfirmCancel(false)} title="Discard this report?">
        <p className="body-sm muted">What you have entered will not be saved.</p>
        <div className="grid-2">
          <button type="button" className="btn btn--outline" onClick={() => setConfirmCancel(false)}>
            Keep editing
          </button>
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => {
              setConfirmCancel(false);
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
