import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { photo, placePhoto } from '../assets/photos';
import { Avatar, FaceStack } from '../components/cards';
import { CityMap, NEIGHBOURHOOD_POS, PLACE_POS, type MapPin } from '../components/CityMap';
import { Segmented, Switch } from '../components/ui';
import { ALERT_KIND_META } from '../data/city';
import { CITIES, NEIGHBOURHOODS, person } from '../data/core';
import { PLACES } from '../data/places';
import type { AlertKind } from '../data/types';
import { LANGUAGES, useT } from '../i18n';
import { AlertGlyph, BackGlyph, BellGlyph, CheckGlyph, Logo, NamedGlyph, ReportGlyph, SparkGlyph, SparkleMark, Wordmark } from '../icons';
import { km } from '../lib/format';
import { useSettings } from '../state/settings';
import type { GlyphComp } from './settings/parts';

const STEPS = 4;
const MIN_INTERESTS = 3;

/** Every interest gets a real photo so picking feels like flicking through the city. */
const INTERESTS: Array<{ id: string; photo: string }> = [
  { id: 'food', photo: 'dish-pav-bhaji' },
  { id: 'cafes', photo: 'dish-latte-art' },
  { id: 'events', photo: 'scene-concert' },
  { id: 'music', photo: 'event-sufi-night' },
  { id: 'comedy', photo: 'event-open-mic' },
  { id: 'heritage', photo: 'place-adalaj' },
  { id: 'sports', photo: 'event-pickleball-social' },
  { id: 'kids', photo: 'event-kite-workshop' },
  { id: 'nature', photo: 'place-vastrapur-lake' },
  { id: 'shopping', photo: 'place-law-garden' },
  { id: 'deals', photo: 'dish-samosa' },
  { id: 'groups', photo: 'scene-friends' },
];

const PROMISES: Array<{ G: GlyphComp; title: string; body: string }> = [
  { G: SparkGlyph, title: 'onboarding.ask', body: 'onboarding.askBody' },
  { G: AlertGlyph, title: 'onboarding.alerts', body: 'onboarding.alertsBody' },
  { G: ReportGlyph, title: 'onboarding.fix', body: 'onboarding.fixBody' },
];

// Nearhood covers roads, not public transport, so transit notices are not offered.
const KINDS = Object.keys(ALERT_KIND_META).filter((k) => k !== 'transit') as AlertKind[];

/** The first-run collage: real places and people, with a few live Nearhood moments floating on top. */
function Collage() {
  const riya = person('riya');
  return (
    <div className="onb-collage" aria-hidden="true">
      <span className="onb-collage__photo onb-collage__photo--a">
        <img src={photo('place-law-garden')} alt="" />
      </span>
      <span className="onb-collage__photo onb-collage__photo--b">
        <img src={photo('dish-pav-bhaji')} alt="" />
      </span>
      <span className="onb-collage__photo onb-collage__photo--c">
        <img src={photo('scene-friends')} alt="" />
      </span>
      <span className="onb-collage__photo onb-collage__photo--d">
        <img src={photo('place-adalaj')} alt="" />
      </span>

      <span className="onb-float onb-float--pick">
        <Avatar who={{ ...riya, verified: false }} size={30} />
        <span className="stack" style={{ gap: 0 }}>
          <b>Cold brew</b>
          <small>Riya · Must try</small>
        </span>
      </span>
      <span className="onb-float onb-float--plans">
        <SparkleMark size={14} />5 plans tonight
      </span>
      <span className="onb-float onb-float--faces">
        <FaceStack ids={['aditi', 'karan', 'farah']} size={22} />
        <small>18 neighbours replied</small>
      </span>
      <span className="onb-float onb-float--pin">
        <Logo size={30} tile animated={false} />
      </span>
    </div>
  );
}

export default function Onboarding() {
  const t = useT();
  const navigate = useNavigate();
  const { settings, update } = useSettings();
  const [step, setStep] = useState(0);
  const workId = useId();
  const homeChips = useRef<HTMLDivElement>(null);

  // Each step starts at the top, in the window or inside the desktop phone frame.
  useEffect(() => {
    window.scrollTo(0, 0);
    document.getElementById('scroller')?.scrollTo(0, 0);
  }, [step]);

  const finish = () => {
    update('onboarded', true);
    navigate('/', { replace: true });
  };
  const next = () => (step < STEPS - 1 ? setStep(step + 1) : finish());

  const picked = settings.interests.length;
  const canNext = step !== 2 || picked >= MIN_INTERESTS;

  const toggleInterest = (id: string) =>
    update('interests', settings.interests.includes(id) ? settings.interests.filter((x) => x !== id) : [...settings.interests, id]);

  const home = NEIGHBOURHOOD_POS[settings.location.home];
  const pins: MapPin[] = useMemo(
    () =>
      PLACES.filter((p) => PLACE_POS[p.id]).map((p) => ({
        id: p.id,
        x: PLACE_POS[p.id][0],
        y: PLACE_POS[p.id][1],
        glyph: p.glyph,
        title: p.name,
        meta: `${p.kind} · ${km(p.distanceKm)}`,
        to: `/place/${p.id}`,
        photo: placePhoto(p.id),
      })),
    [],
  );
  const homeName = NEIGHBOURHOODS.find((n) => n.id === settings.location.home)?.name ?? settings.location.home;

  return (
    <main className={`page page--no-nav onb onb--step-${step}`} aria-labelledby={`onb-title-${step}`}>
      <div className="onb__top">
        {step > 0 ? (
          <button type="button" className="icon-btn" aria-label={t('common.back')} onClick={() => setStep(step - 1)}>
            <BackGlyph size={20} />
          </button>
        ) : (
          <span className="row" style={{ gap: 8 }}>
            <Logo size={26} />
            <Wordmark size={19} />
          </span>
        )}
        <div className="onb__dots" role="progressbar" aria-label={t('onboarding.step', { n: step + 1 })} aria-valuemin={1} aria-valuemax={STEPS} aria-valuenow={step + 1}>
          {Array.from({ length: STEPS }, (_, i) => (
            <span key={i} className={i === step ? 'is-current' : i < step ? 'is-done' : undefined} />
          ))}
        </div>
        <button type="button" className="btn btn--ghost btn--sm onb__skip" onClick={finish}>
          {t('onboarding.skip')}
        </button>
      </div>

      {step === 0 && (
        <section className="onb__body fade-up" key="s0">
          <Collage />
          <div className="onb__hero">
            <span className="eyebrow muted">{t('onboarding.eyebrow', { city: settings.location.city })}</span>
            <h1 className="hero-title" id="onb-title-0">
              {t('onboarding.tagline')}
              <SparkleMark size={22} className="hero-title__spark" />
            </h1>
            <p className="body muted">{t('onboarding.intro')}</p>
          </div>
          <ul className="onb-promises">
            {PROMISES.map((v) => (
              <li key={v.title} className="glyph-host">
                <span className="onb-promises__icon">
                  <v.G size={18} live />
                </span>
                <span className="stack" style={{ gap: 1 }}>
                  <span className="strong" style={{ fontSize: '0.875rem' }}>
                    {t(v.title)}
                  </span>
                  <span className="body-sm muted" style={{ fontSize: '0.8125rem' }}>
                    {t(v.body)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <div className="stack" style={{ gap: 6 }}>
            <span className="field__label" id="onb-lang">
              {t('onboarding.pickLanguage')}
            </span>
            <div className="onb-langs" role="group" aria-labelledby="onb-lang">
              {LANGUAGES.map((l) => (
                <button key={l.id} type="button" className="onb-lang" aria-pressed={settings.language === l.id} lang={l.id} onClick={() => update('language', l.id)}>
                  <span className="onb-lang__native">{l.native}</span>
                  <span className="onb-lang__name">{l.name}</span>
                  {settings.language === l.id ? (
                    <span className="onb-lang__check" aria-hidden="true">
                      <CheckGlyph size={12} />
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="onb__body fade-up" key="s1">
          <div className="stack" style={{ gap: 6 }}>
            <span className="eyebrow muted">{t('onboarding.stepOf', { n: 2, total: STEPS })}</span>
            <h1 className="hero-title" id="onb-title-1">
              {t('onboarding.whereTitle')}
            </h1>
            <p className="body muted">{t('onboarding.whereBody')}</p>
          </div>
          {home ? (
            <CityMap
              pins={pins}
              home={home}
              radiusKm={settings.location.radiusKm}
              areaLabel={homeName}
              onArea={() => homeChips.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus()}
            />
          ) : null}
          <div className="stack" style={{ gap: 6 }}>
            <span className="field__label" id="onb-home">
              {t('settings.location.home')}
            </span>
            <div className="chip-wrap" role="group" aria-labelledby="onb-home" ref={homeChips}>
              {NEIGHBOURHOODS.map((n) => (
                <button key={n.id} type="button" aria-pressed={settings.location.home === n.id} className="chip" onClick={() => update('location', { home: n.id })}>
                  {n.name}
                </button>
              ))}
            </div>
          </div>
          <div className="stack" style={{ gap: 6 }}>
            <span className="field__label" id="onb-city">
              {t('settings.location.city')}
            </span>
            <div className="list list--grouped" role="radiogroup" aria-labelledby="onb-city">
              {CITIES.map((c) => {
                const available = c === 'Ahmedabad';
                const on = settings.location.city === c;
                return (
                  <button key={c} type="button" role="radio" aria-checked={on} disabled={!available} className="list-row" onClick={() => update('location', { city: c })}>
                    <span className="list-row__body">
                      <span className="list-row__title">{c}</span>
                    </span>
                    {available ? on ? <CheckGlyph size={18} style={{ color: 'var(--accent)' }} /> : null : <span className="badge badge--sm">{t('onboarding.comingSoon')}</span>}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="field">
            <label className="field__label" htmlFor={workId}>
              {t('onboarding.workOptional')}
            </label>
            <select id={workId} className="select" value={settings.location.work} onChange={(e) => update('location', { work: e.target.value })}>
              <option value="">{t('settings.location.none')}</option>
              {NEIGHBOURHOODS.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="onb__body fade-up" key="s2">
          <div className="stack" style={{ gap: 6 }}>
            <span className="eyebrow muted">{t('onboarding.stepOf', { n: 3, total: STEPS })}</span>
            <h1 className="hero-title" id="onb-title-2">
              {t('onboarding.interestsTitle')}
            </h1>
            <p className="body muted">{t('onboarding.interestsBody')}</p>
          </div>
          <div className="interest-grid" role="group" aria-label={t('onboarding.interestsTitle')}>
            {INTERESTS.map((i) => {
              const on = settings.interests.includes(i.id);
              return (
                <button key={i.id} type="button" aria-pressed={on} className="interest-photo" onClick={() => toggleInterest(i.id)}>
                  <img src={photo(i.photo)} alt="" loading="lazy" />
                  <span className="interest-photo__label">{t(`interest.${i.id}`)}</span>
                  <span className="interest-photo__check" aria-hidden="true">
                    {on ? <CheckGlyph size={13} /> : null}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="onb-count" aria-live="polite">
            <span className={`onb-count__dot${picked >= MIN_INTERESTS ? ' is-done' : ''}`} />
            {picked >= MIN_INTERESTS ? t('onboarding.picked', { n: picked }) : t('onboarding.pickMore', { n: MIN_INTERESTS - picked })}
          </p>
        </section>
      )}

      {step === 3 && (
        <section className="onb__body fade-up" key="s3">
          <div className="stack" style={{ gap: 6 }}>
            <span className="eyebrow muted">{t('onboarding.stepOf', { n: 4, total: STEPS })}</span>
            <h1 className="hero-title" id="onb-title-3">
              {t('onboarding.alertsTitle')}
            </h1>
            <p className="body muted">{t('onboarding.alertsIntro')}</p>
          </div>
          <div className="onb-kinds" role="group" aria-label={t('settings.alerts.kinds')}>
            {KINDS.map((k) => {
              const on = settings.alerts.kinds[k];
              const m = ALERT_KIND_META[k];
              return (
                <button
                  key={k}
                  type="button"
                  aria-pressed={on}
                  className={`kind-tile glyph-host tone-${m.tone}`}
                  onClick={() => update('alerts', { kinds: { ...settings.alerts.kinds, [k]: !on } })}
                >
                  <span className="kind-tile__icon">
                    <NamedGlyph name={m.glyph} size={17} active={on} />
                  </span>
                  <span className="grow" style={{ textAlign: 'left' }}>
                    {t(`settings.kind.${k}`)}
                  </span>
                  <span className="kind-tile__check" aria-hidden="true">
                    {on ? <CheckGlyph size={12} /> : null}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="list list--grouped">
            <div className="list-row">
              <span className="tile tone-amber" style={{ width: 30, height: 30, borderRadius: 10 }}>
                <BellGlyph size={17} ringing={settings.notifications.push} />
              </span>
              <span className="list-row__body">
                <span className="list-row__title" id="onb-push">
                  {t('settings.notif.push')}
                </span>
                <span className="list-row__meta">{t('onboarding.pushMeta')}</span>
              </span>
              <Switch checked={settings.notifications.push} onChange={(v) => update('notifications', { push: v })} label={t('settings.notif.push')} />
            </div>
            <div className="list-row set-row--stack">
              <span className="list-row__title">{t('settings.privacy.precision')}</span>
              <Segmented
                label={t('settings.privacy.precision')}
                value={settings.privacy.locationPrecision}
                onChange={(v) => update('privacy', { locationPrecision: v })}
                options={[
                  { value: 'exact', label: t('settings.privacy.exact') },
                  { value: 'neighbourhood', label: t('settings.privacy.area') },
                  { value: 'city', label: t('settings.privacy.cityOnly') },
                ]}
              />
            </div>
          </div>
        </section>
      )}

      <div className="onb__footer">
        <button type="button" className="btn btn--primary btn--lg btn--block onb__next" onClick={next} disabled={!canNext}>
          {step === 0 ? t('onboarding.start') : step === STEPS - 1 ? t('onboarding.finish') : t('common.next')}
        </button>
        {step === 0 ? <p className="onb__fineprint">{t('onboarding.fineprint')}</p> : null}
      </div>
    </main>
  );
}
