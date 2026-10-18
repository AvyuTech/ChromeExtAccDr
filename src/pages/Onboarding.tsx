import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Segmented, Switch } from '../components/ui';
import { ALERT_KIND_META } from '../data/city';
import { CITIES, NEIGHBOURHOODS } from '../data/core';
import type { AlertKind } from '../data/types';
import { LANGUAGES, useT } from '../i18n';
import {
  AlertGlyph,
  BackGlyph,
  BellGlyph,
  CafeGlyph,
  CheckGlyph,
  DealsGlyph,
  EventsGlyph,
  FoodGlyph,
  GroupsGlyph,
  HeritageGlyph,
  KidsGlyph,
  Logo,
  MicGlyph,
  MusicGlyph,
  NamedGlyph,
  NatureGlyph,
  ReportGlyph,
  ShoppingGlyph,
  SparkGlyph,
  SportsGlyph,
} from '../icons';
import { useSettings } from '../state/settings';
import type { GlyphComp } from './settings/parts';

const STEPS = 4;
const MIN_INTERESTS = 3;

const INTERESTS: Array<{ id: string; G: GlyphComp; tone: string }> = [
  { id: 'food', G: FoodGlyph, tone: 'peach' },
  { id: 'cafes', G: CafeGlyph, tone: 'clay' },
  { id: 'events', G: EventsGlyph, tone: 'violet' },
  { id: 'music', G: MusicGlyph, tone: 'night' },
  { id: 'comedy', G: MicGlyph, tone: 'violet' },
  { id: 'heritage', G: HeritageGlyph, tone: 'amber' },
  { id: 'sports', G: SportsGlyph, tone: 'green' },
  { id: 'kids', G: KidsGlyph, tone: 'yellow' },
  { id: 'nature', G: NatureGlyph, tone: 'teal' },
  { id: 'shopping', G: ShoppingGlyph, tone: 'peach' },
  { id: 'deals', G: DealsGlyph, tone: 'mint' },
  { id: 'groups', G: GroupsGlyph, tone: 'blue' },
];

const KINDS = Object.keys(ALERT_KIND_META) as AlertKind[];

export default function Onboarding() {
  const t = useT();
  const navigate = useNavigate();
  const { settings, update } = useSettings();
  const [step, setStep] = useState(0);
  const workId = useId();

  const finish = () => {
    update('onboarded', true);
    navigate('/', { replace: true });
  };
  const next = () => (step < STEPS - 1 ? setStep(step + 1) : finish());

  const picked = settings.interests.length;
  const canNext = step !== 2 || picked >= MIN_INTERESTS;

  const toggleInterest = (id: string) =>
    update('interests', settings.interests.includes(id) ? settings.interests.filter((x) => x !== id) : [...settings.interests, id]);

  return (
    <main className="page page--no-nav onb" aria-labelledby={`onb-title-${step}`}>
      <div className="onb__top">
        {step > 0 ? (
          <button type="button" className="icon-btn" aria-label={t('common.back')} onClick={() => setStep(step - 1)}>
            <BackGlyph size={20} />
          </button>
        ) : (
          <span style={{ width: 44 }} aria-hidden="true" />
        )}
        <div className="onb__dots" role="progressbar" aria-label={t('onboarding.step', { n: step + 1 })} aria-valuemin={1} aria-valuemax={STEPS} aria-valuenow={step + 1}>
          {Array.from({ length: STEPS }, (_, i) => (
            <span key={i} className={i === step ? 'is-current' : i < step ? 'is-done' : undefined} />
          ))}
        </div>
        <button type="button" className="btn btn--ghost btn--sm" onClick={finish}>
          {t('onboarding.skip')}
        </button>
      </div>

      {step === 0 && (
        <section className="onb__body fade-up" key="s0">
          <div className="onb__hero">
            <Logo size={76} title="Nearhood" />
            <h1 className="page-title" id="onb-title-0">
              {t('onboarding.tagline')}
            </h1>
            <p className="body muted">{t('onboarding.intro')}</p>
          </div>
          <div className="list">
            {[
              { G: SparkGlyph, tone: 'violet', title: 'onboarding.ask', body: 'onboarding.askBody' },
              { G: AlertGlyph, tone: 'amber', title: 'onboarding.alerts', body: 'onboarding.alertsBody' },
              { G: ReportGlyph, tone: 'mint', title: 'onboarding.fix', body: 'onboarding.fixBody' },
            ].map((v) => (
              <div key={v.title} className="list-row" style={{ alignItems: 'flex-start' }}>
                <span className={`tile tone-${v.tone}`}>
                  <v.G size={22} duo live />
                </span>
                <span className="list-row__body">
                  <span className="list-row__title">{t(v.title)}</span>
                  <span className="list-row__meta">{t(v.body)}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="stack" style={{ gap: 8 }}>
            <span className="field__label" id="onb-lang">
              {t('onboarding.pickLanguage')}
            </span>
            <div className="chip-wrap" role="group" aria-labelledby="onb-lang">
              {LANGUAGES.map((l) => (
                <button key={l.id} type="button" className="chip chip--accent" aria-pressed={settings.language === l.id} lang={l.id} onClick={() => update('language', l.id)}>
                  {l.native}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="onb__body fade-up" key="s1">
          <div className="stack" style={{ gap: 6 }}>
            <h1 className="page-title" id="onb-title-1">
              {t('onboarding.whereTitle')}
            </h1>
            <p className="body muted">{t('onboarding.whereBody')}</p>
          </div>
          <div className="stack" style={{ gap: 8 }}>
            <span className="field__label" id="onb-city">
              {t('settings.location.city')}
            </span>
            <div className="list" role="radiogroup" aria-labelledby="onb-city">
              {CITIES.map((c) => {
                const available = c === 'Ahmedabad';
                const on = settings.location.city === c;
                return (
                  <button key={c} type="button" role="radio" aria-checked={on} disabled={!available} className="list-row" onClick={() => update('location', { city: c })}>
                    <span className="list-row__body">
                      <span className="list-row__title">{c}</span>
                    </span>
                    {available ? on ? <CheckGlyph size={20} style={{ color: 'var(--accent)' }} /> : null : <span className="badge badge--sm">{t('onboarding.comingSoon')}</span>}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="stack" style={{ gap: 8 }}>
            <span className="field__label" id="onb-home">
              {t('settings.location.home')}
            </span>
            <div className="chip-wrap" role="group" aria-labelledby="onb-home">
              {NEIGHBOURHOODS.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  aria-pressed={settings.location.home === n.id}
                  className="chip chip--accent"
                  onClick={() => update('location', { home: n.id })}
                >
                  {n.name}
                </button>
              ))}
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
            <h1 className="page-title" id="onb-title-2">
              {t('onboarding.interestsTitle')}
            </h1>
            <p className="body muted">{t('onboarding.interestsBody')}</p>
          </div>
          <div className="interest-grid" role="group" aria-label={t('onboarding.interestsTitle')}>
            {INTERESTS.map((i) => {
              const on = settings.interests.includes(i.id);
              return (
                <button key={i.id} type="button" aria-pressed={on} className={`interest-tile glyph-host tone-${i.tone}`} onClick={() => toggleInterest(i.id)}>
                  <span className="tile tile--lg">
                    <i.G size={24} duo active={on} live={on} />
                  </span>
                  <span>{t(`interest.${i.id}`)}</span>
                  {on ? (
                    <span className="interest-tile__check" aria-hidden="true">
                      <CheckGlyph size={12} />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <p className="meta" aria-live="polite" style={{ textAlign: 'center' }}>
            {picked >= MIN_INTERESTS ? t('onboarding.picked', { n: picked }) : t('onboarding.pickMore', { n: MIN_INTERESTS - picked })}
          </p>
        </section>
      )}

      {step === 3 && (
        <section className="onb__body fade-up" key="s3">
          <div className="stack" style={{ gap: 6 }}>
            <h1 className="page-title" id="onb-title-3">
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
                  className={`interest-tile interest-tile--row glyph-host tone-${m.tone}`}
                  onClick={() => update('alerts', { kinds: { ...settings.alerts.kinds, [k]: !on } })}
                >
                  <span className="tile" style={{ width: 32, height: 32, borderRadius: 10 }}>
                    <NamedGlyph name={m.glyph} size={18} duo />
                  </span>
                  <span className="grow" style={{ textAlign: 'left' }}>
                    {t(`settings.kind.${k}`)}
                  </span>
                  {on ? <CheckGlyph size={16} style={{ color: 'var(--accent)' }} /> : null}
                </button>
              );
            })}
          </div>
          <div className="list">
            <div className="list-row">
              <span className="tile tone-amber" style={{ width: 32, height: 32, borderRadius: 10 }}>
                <BellGlyph size={18} duo ringing={settings.notifications.push} />
              </span>
              <span className="list-row__body">
                <span className="list-row__title" id="onb-push">
                  {t('settings.notif.push')}
                </span>
                <span className="list-row__meta">Only for the alert types above and replies to you.</span>
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
        <button type="button" className="btn btn--primary btn--lg btn--block" onClick={next} disabled={!canNext}>
          {step === 0 ? t('onboarding.start') : step === STEPS - 1 ? t('onboarding.finish') : t('common.next')}
        </button>
      </div>
    </main>
  );
}
