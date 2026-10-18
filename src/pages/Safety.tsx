import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { AlertCard } from '../components/cards';
import { PageHeader, SectionHead, ToggleRow } from '../components/ui';
import { EMERGENCY, FACILITIES } from '../data/city';
import { useT } from '../i18n';
import { NamedGlyph, NavigateGlyph, PhoneGlyph, PinGlyph, SosGlyph } from '../icons';
import { km } from '../lib/format';
import { visibleAlerts } from '../lib/selectors';
import { useAppData } from '../state/appData';
import { useSettings } from '../state/settings';
import { useToast } from '../state/toast';

const HOLD_MS = 2000;
const RING_R = 86;
const RING_C = 2 * Math.PI * RING_R;

/** Press and hold for two seconds to call 112, so a pocket tap never dials. */
function SosButton({ onCalled }: { onCalled: () => void }) {
  const t = useT();
  const [progress, setProgress] = useState(0);
  const [hint, setHint] = useState(false);
  const raf = useRef<number | null>(null);
  const started = useRef(0);
  const progressRef = useRef(0);

  useEffect(() => () => (raf.current !== null ? cancelAnimationFrame(raf.current) : undefined), []);

  const finish = () => {
    raf.current = null;
    progressRef.current = 0;
    setProgress(0);
    onCalled();
    window.location.href = 'tel:112';
  };

  const tick = () => {
    const p = Math.min(1, (performance.now() - started.current) / HOLD_MS);
    progressRef.current = p;
    setProgress(p);
    if (p >= 1) finish();
    else raf.current = requestAnimationFrame(tick);
  };

  const begin = () => {
    if (raf.current !== null) return;
    setHint(false);
    started.current = performance.now();
    raf.current = requestAnimationFrame(tick);
  };

  const cancel = () => {
    if (raf.current === null) return;
    cancelAnimationFrame(raf.current);
    raf.current = null;
    if (progressRef.current < 1) setHint(true);
    progressRef.current = 0;
    setProgress(0);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
      e.preventDefault();
      begin();
    }
  };
  const onKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') cancel();
  };

  return (
    <div className="sos">
      <button
        type="button"
        className="sos__btn"
        aria-label="SOS: press and hold for 2 seconds to call 112"
        aria-describedby="sos-hint"
        onPointerDown={(e) => {
          e.preventDefault();
          begin();
        }}
        onPointerUp={cancel}
        onPointerLeave={cancel}
        onPointerCancel={cancel}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onContextMenu={(e) => e.preventDefault()}
      >
        <svg className="sos__ring" viewBox="0 0 200 200" aria-hidden="true">
          <circle cx="100" cy="100" r={RING_R} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="8" />
          <circle
            cx="100"
            cy="100"
            r={RING_R}
            fill="none"
            stroke="#ffffff"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={RING_C}
            strokeDashoffset={RING_C * (1 - progress)}
            transform="rotate(-90 100 100)"
          />
        </svg>
        <span className="sos__label">
          <SosGlyph size={34} live={progress === 0} />
          <span className="display" style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '0.02em' }}>
            SOS
          </span>
          <span style={{ fontSize: '0.78125rem', fontWeight: 600 }}>{progress > 0 ? `${Math.ceil((1 - progress) * 2)}…` : t('city.holdSos')}</span>
        </span>
      </button>
      <p id="sos-hint" className={`body-sm ${hint ? 'sos__hint--on' : 'muted'}`} aria-live="polite" style={{ textAlign: 'center' }}>
        {hint ? 'Keep holding for 2 seconds to call 112.' : 'Hold for 2 seconds to call 112: police, fire and ambulance.'}
      </p>
    </div>
  );
}

export default function Safety() {
  const t = useT();
  const toast = useToast();
  const { settings, update } = useSettings();
  const { data } = useAppData();
  const [sharing, setSharing] = useState(false);
  const [called, setCalled] = useState(false);
  const safetyAlerts = visibleAlerts(settings, data).filter((a) => a.kind === 'safety');
  const contacts = settings.safety.contacts;

  const shareLocation = () => {
    if (!('geolocation' in navigator)) {
      toast('Location is not available on this device');
      return;
    }
    setSharing(true);
    try {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const url = `https://maps.google.com/?q=${pos.coords.latitude.toFixed(5)},${pos.coords.longitude.toFixed(5)}`;
          try {
            if (navigator.share) await navigator.share({ title: 'My location', text: 'This is where I am right now:', url });
            else {
              await navigator.clipboard.writeText(url);
              toast('Location link copied. Paste it to your contacts.');
            }
          } catch {
            /* share sheet closed */
          }
          setSharing(false);
        },
        () => {
          setSharing(false);
          toast('Could not get your location. Check location permission.');
        },
        { enableHighAccuracy: true, timeout: 10_000 },
      );
    } catch {
      setSharing(false);
      toast('Location is not available here');
    }
  };

  return (
    <>
      <PageHeader title={t('city.safety')} fallback="/city" />
      <main className="page page--with-header">
        <section className="sos-card" aria-labelledby="sos-title">
          <span className="eyebrow sos-card__eyebrow">Emergency · 112</span>
          <h2 id="sos-title" className="sos-card__title">
            Help is one press away.
          </h2>
          <SosButton onCalled={() => setCalled(true)} />
        </section>

        {called ? (
          <div className="notice tone-red">
            <PinGlyph size={20} />
            <span className="grow">
              <b>Calling 112.</b> {settings.safety.shareLocationOnSos ? 'When you can, send your location to your trusted contacts.' : 'Stay on the line and stay somewhere safe.'}
            </span>
            {settings.safety.shareLocationOnSos ? (
              <button type="button" className="btn btn--danger btn--sm" onClick={shareLocation} disabled={sharing}>
                Send
              </button>
            ) : null}
          </div>
        ) : null}

        <button type="button" className="btn btn--secondary btn--block btn--lg" onClick={shareLocation} disabled={sharing}>
          <PinGlyph size={20} />
          {sharing ? 'Getting your location…' : 'Share my live location'}
        </button>

        <section className="section" aria-labelledby="sos-numbers">
          <SectionHead id="sos-numbers" title={t('city.emergency')} />
          <div className="list">
            {EMERGENCY.map((e) => (
              <a key={e.id} href={`tel:${e.number}`} className="list-row glyph-host" aria-label={`Call ${e.name}, ${e.number}`}>
                <span className={`city-card__icon city-card__icon--sm tone-${e.tone}`}>
                  <NamedGlyph name={e.glyph} size={20} />
                </span>
                <span className="list-row__body">
                  <span className="list-row__title">{e.name}</span>
                  <span className="list-row__meta">{e.description}</span>
                </span>
                <span className="safety-number">
                  <PhoneGlyph size={15} />
                  {e.number}
                </span>
              </a>
            ))}
          </div>
        </section>

        <section className="section" aria-labelledby="sos-contacts">
          <SectionHead id="sos-contacts" title={t('city.trusted')} to="/settings/safety" linkLabel="Manage" />
          <div className="list">
            {contacts.length === 0 ? (
              <Link to="/settings/safety" className="list-row">
                <span className="list-row__body">
                  <span className="list-row__title">Add a trusted contact</span>
                  <span className="list-row__meta">Someone to share your location with in an emergency</span>
                </span>
              </Link>
            ) : (
              contacts.map((c, i) => (
                <div key={`${c.name}-${i}`} className="list-row">
                  <span className="avatar tone-violet" aria-hidden="true">
                    {c.name.replace(/[^A-Za-z]/g, '').charAt(0).toUpperCase() || 'T'}
                  </span>
                  <span className="list-row__body">
                    <span className="list-row__title">{c.name}</span>
                    <span className="list-row__meta">{c.phone || 'No number yet'}</span>
                  </span>
                  {c.phone ? (
                    <a href={`tel:${c.phone}`} className="icon-btn" aria-label={`Call ${c.name}`}>
                      <PhoneGlyph size={18} />
                    </a>
                  ) : (
                    <Link to="/settings/safety" className="btn btn--soft btn--sm">
                      Add number
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="list">
            <ToggleRow
              glyph="walk"
              tone="teal"
              title="Safe-walk check-in"
              meta="Nearhood checks in during walks after dark and lets your trusted contacts know if you don't reply."
              checked={settings.safety.safeWalkCheckIn}
              onChange={(v) => {
                update('safety', { safeWalkCheckIn: v });
                toast(v ? 'Safe-walk check-in is on' : 'Safe-walk check-in is off');
              }}
            />
            <ToggleRow
              glyph="pin"
              tone="red"
              title="Offer to share location after SOS"
              meta="After an SOS call, open a message with your location for your trusted contacts."
              checked={settings.safety.shareLocationOnSos}
              onChange={(v) => update('safety', { shareLocationOnSos: v })}
            />
          </div>
        </section>

        <section className="section" aria-labelledby="sos-nearby">
          <SectionHead id="sos-nearby" title={t('city.nearby')} />
          <div className="list">
            {[...FACILITIES]
              .sort((a, b) => a.distanceKm - b.distanceKm)
              .map((f) => (
                <div key={f.id} className="list-row">
                  <span className={`city-card__icon city-card__icon--sm tone-${f.kind === 'Police station' ? 'blue' : f.kind === 'Fire station' ? 'peach' : 'red'}`}>
                    <NamedGlyph name={f.glyph} size={20} />
                  </span>
                  <span className="list-row__body">
                    <span className="list-row__title">{f.name}</span>
                    <span className="list-row__meta">
                      {f.kind} · {f.area} · {km(f.distanceKm)}
                    </span>
                  </span>
                  {f.open24h ? <span className="badge badge--sm tone-mint">24h</span> : null}
                  <a
                    className="icon-btn"
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${f.kind} ${f.area} Ahmedabad`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Directions to ${f.name}`}
                  >
                    <NavigateGlyph size={18} />
                  </a>
                </div>
              ))}
          </div>
        </section>

        {safetyAlerts.length ? (
          <section className="section" aria-labelledby="sos-alerts">
            <SectionHead id="sos-alerts" title="Safety alerts" to="/city/alerts" />
            {safetyAlerts.map((a) => (
              <AlertCard key={a.id} alert={a} />
            ))}
          </section>
        ) : null}
      </main>
    </>
  );
}
