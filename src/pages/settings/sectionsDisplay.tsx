import { LANGUAGES, translate, useT } from '../../i18n';
import { AccessibilityGlyph, CheckGlyph, EyeGlyph, MoonGlyph, NoiseGlyph, SunGlyph, TextSizeGlyph, UpvoteGlyph } from '../../icons';
import { SystemThemeGlyph } from '../../icons/extra-settings';
import { useSettings, type ThemeChoice } from '../../state/settings';
import { Group, RangeRow, SettingToggle, type GlyphComp } from './parts';

/* ======================= Appearance ======================= */

const THEMES: Array<{ value: ThemeChoice; G: GlyphComp }> = [
  { value: 'system', G: SystemThemeGlyph },
  { value: 'light', G: SunGlyph },
  { value: 'dark', G: MoonGlyph },
];

function ThemeMock({ mode }: { mode: ThemeChoice }) {
  return (
    <span className={`theme-mock theme-mock--${mode}`} aria-hidden="true">
      <span className="theme-mock__bar" />
      <span className="theme-mock__card">
        <span className="theme-mock__line" />
        <span className="theme-mock__line theme-mock__line--short" />
      </span>
      <span className="theme-mock__band" />
    </span>
  );
}

export function AppearanceSection() {
  const t = useT();
  const { settings, update } = useSettings();
  const { theme, textScale } = settings.appearance;
  const label = (v: number) => (v < 0.97 ? t('settings.text.small') : v > 1.03 ? t('settings.text.large') : t('settings.text.default'));

  return (
    <>
      <section className="set-group" aria-labelledby="theme-title">
        <h2 className="set-group__title" id="theme-title">
          {t('settings.appearance.theme')}
        </h2>
        <div className="theme-grid" role="radiogroup" aria-labelledby="theme-title">
          {THEMES.map(({ value, G }) => (
            <button key={value} type="button" role="radio" aria-checked={theme === value} className="theme-tile" onClick={() => update('appearance', { theme: value })}>
              <ThemeMock mode={value} />
              <span className="row" style={{ gap: 6, justifyContent: 'center' }}>
                <G size={16} active={theme === value} />
                {t(`settings.theme.${value}`)}
              </span>
            </button>
          ))}
        </div>
        <p className="set-group__note">{theme === 'system' ? 'Follows your phone: light by day, dark when your device switches.' : `Always ${theme}, whatever your phone is set to.`}</p>
      </section>

      <Group title={t('settings.appearance.text')}>
        <RangeRow
          label={t('settings.appearance.text')}
          value={textScale}
          min={0.9}
          max={1.3}
          step={0.05}
          onChange={(v) => update('appearance', { textScale: Math.round(v * 100) / 100 })}
          format={(v) => `${Math.round(v * 100)}% · ${label(v)}`}
        />
        <div className="list-row set-row--stack">
          <span className="eyebrow muted">{t('settings.appearance.preview')}</span>
          <div className="set-preview-post">
            <span className="row" style={{ gap: 8 }}>
              <span className="avatar tone-peach" style={{ ['--avatar-size' as string]: '30px' }} aria-hidden="true">
                R
              </span>
              <span className="stack" style={{ gap: 0 }}>
                <span className="strong" style={{ fontSize: '0.875rem' }}>
                  Riya S.
                </span>
                <span className="meta">Prahlad Nagar · 2h</span>
              </span>
            </span>
            <p className="body">Any quiet café for a weekend brunch where I can also work for 2–3 hours?</p>
            <span className="row meta" style={{ gap: 6, color: 'var(--accent)', fontWeight: 700 }}>
              <UpvoteGlyph size={16} active /> 42
            </span>
          </div>
        </div>
      </Group>
      <button
        type="button"
        className="btn btn--outline btn--block"
        disabled={theme === 'system' && textScale === 1}
        onClick={() => update('appearance', { theme: 'system', textScale: 1 })}
      >
        <TextSizeGlyph size={18} /> Reset to defaults
      </button>
    </>
  );
}

/* ======================= Language ======================= */

export function LanguageSection() {
  const t = useT();
  const { settings, update } = useSettings();
  const lang = settings.language;

  return (
    <>
      <section className="set-group" aria-labelledby="lang-title">
        <h2 className="set-group__title" id="lang-title">
          {t('settings.language.choose')}
        </h2>
        <div className="list" role="radiogroup" aria-labelledby="lang-title">
          {LANGUAGES.map((l) => (
            <button key={l.id} type="button" role="radio" aria-checked={lang === l.id} className="list-row" onClick={() => update('language', l.id)} lang={l.id}>
              <span className="lang-badge" aria-hidden="true">
                {l.native.slice(0, 1)}
              </span>
              <span className="list-row__body">
                <span className="list-row__title">{l.native}</span>
                <span className="list-row__meta" lang="en">
                  {l.name}
                </span>
              </span>
              {lang === l.id ? <CheckGlyph size={20} style={{ color: 'var(--accent)' }} /> : null}
            </button>
          ))}
        </div>
      </section>

      <section className="card stack" aria-labelledby="lang-preview">
        <h2 className="eyebrow muted" id="lang-preview">
          {t('settings.language.preview')}
        </h2>
        <div className="chip-wrap" lang={lang}>
          {['nav.home', 'nav.explore', 'nav.city', 'nav.me', 'nav.updates', 'chip.weekend'].map((k) => (
            <span key={k} className="chip chip--soft">
              {translate(lang, k)}
            </span>
          ))}
        </div>
        <p className="body-sm" lang={lang}>
          {translate(lang, 'home.ask')}
        </p>
      </section>
      <p className="set-group__note">Menus, headings and settings switch language. Posts from neighbours stay in the language they were written in.</p>
    </>
  );
}

/* ======================= Accessibility ======================= */

export function AccessibilitySection() {
  const t = useT();
  const { settings, update } = useSettings();
  const a = settings.accessibility;

  return (
    <>
      <Group title={t('settings.a11y.seeing')} note="Nearhood also follows your device's reduce-motion setting.">
        <SettingToggle
          G={AccessibilityGlyph}
          tone="violet"
          title={t('settings.a11y.reduceMotion')}
          meta="Stops moving icons, slides and live animations."
          checked={a.reduceMotion}
          onChange={(v) => update('accessibility', { reduceMotion: v })}
        />
        <SettingToggle
          G={EyeGlyph}
          tone="blue"
          title={t('settings.a11y.highContrast')}
          meta="Darker secondary text and stronger borders."
          checked={a.highContrast}
          onChange={(v) => update('accessibility', { highContrast: v })}
        />
        <SettingToggle
          G={TextSizeGlyph}
          tone="teal"
          title={t('settings.a11y.largeTargets')}
          meta="Makes buttons and chips at least 48 px tall."
          checked={a.largeTargets}
          onChange={(v) => update('accessibility', { largeTargets: v })}
        />
      </Group>
      <Group title={t('settings.a11y.hearing')}>
        <SettingToggle
          G={NoiseGlyph}
          tone="amber"
          title={t('settings.a11y.readAloud')}
          meta="Read Nearhood answers out loud with your device's voice."
          checked={a.readAnswersAloud}
          onChange={(v) => update('accessibility', { readAnswersAloud: v })}
        />
      </Group>
      <div className="card row" style={{ gap: 12 }} aria-label="Contrast preview">
        <span className="display strong" style={{ fontSize: '1.75rem' }} aria-hidden="true">
          Aa
        </span>
        <span className="stack" style={{ gap: 2 }}>
          <span className="strong">Bodakdev Neighbours</span>
          <span className="meta">2.4k members · 30 posts today</span>
        </span>
      </div>
    </>
  );
}
