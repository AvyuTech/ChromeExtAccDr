import { useId, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { photo, PHOTO_SOURCES } from '../../assets/photos';
import { LinkRow } from '../../components/ui';
import { person } from '../../data/core';
import { EVENTS } from '../../data/events';
import { placeById } from '../../data/places';
import { useT } from '../../i18n';
import {
  FlagGlyph,
  ImageGlyph,
  Logo,
  NamedGlyph,
  PinGlyph,
  PlusGlyph,
  SparkGlyph,
  TrashGlyph,
  TrustRing,
  UsersGlyph,
  WalkGlyph,
  Wordmark,
  type GlyphName,
} from '../../icons';
import type { Tone } from '../../data/types';
import { useSettings } from '../../state/settings';
import { useToast } from '../../state/toast';
import { APP_VERSION } from './meta';
import { Group, SettingLink, SettingToggle } from './parts';

/* ======================= Safety & SOS ======================= */

const MAX_CONTACTS = 5;

export function SafetySection() {
  const t = useT();
  const { settings, update } = useSettings();
  const s = settings.safety;
  const baseId = useId();

  const setContact = (i: number, patch: Partial<{ name: string; phone: string }>) =>
    update('safety', { contacts: s.contacts.map((c, j) => (j === i ? { ...c, ...patch } : c)) });

  return (
    <>
      <div className="notice tone-red" style={{ alignItems: 'center' }}>
        <span className="num" style={{ fontSize: '1.375rem' }}>
          112
        </span>
        <span>In an emergency, call 112 for police, fire and ambulance anywhere in India.</span>
      </div>

      <section className="set-group" aria-labelledby={`${baseId}-contacts`}>
        <h2 className="set-group__title" id={`${baseId}-contacts`}>
          {t('settings.safety.contacts')}
        </h2>
        <div className="list list--grouped">
          {s.contacts.map((c, i) => (
            <div key={i} className="list-row set-contact">
              <span className="avatar tone-violet" style={{ ['--avatar-size' as string]: '36px' }} aria-hidden="true">
                {(c.name.replace(/[[\]]/g, '').trim()[0] ?? '?').toUpperCase()}
              </span>
              <div className="set-contact__fields">
                <div>
                  <label className="sr-only" htmlFor={`${baseId}-n${i}`}>
                    {t('settings.safety.contactName')} {i + 1}
                  </label>
                  <input
                    id={`${baseId}-n${i}`}
                    className="input"
                    value={c.name}
                    placeholder={t('settings.safety.contactName')}
                    autoComplete="off"
                    onChange={(e) => setContact(i, { name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="sr-only" htmlFor={`${baseId}-p${i}`}>
                    {t('settings.safety.contactPhone')} {i + 1}
                  </label>
                  <input
                    id={`${baseId}-p${i}`}
                    className="input"
                    type="tel"
                    inputMode="tel"
                    value={c.phone}
                    placeholder="+91 98765 43210"
                    autoComplete="off"
                    onChange={(e) => setContact(i, { phone: e.target.value })}
                  />
                </div>
              </div>
              <button
                type="button"
                className="icon-btn icon-btn--ghost"
                aria-label={t('settings.safety.remove', { name: c.name || `${i + 1}` })}
                onClick={() => update('safety', { contacts: s.contacts.filter((_, j) => j !== i) })}
              >
                <TrashGlyph size={18} />
              </button>
            </div>
          ))}
          {s.contacts.length < MAX_CONTACTS ? (
            <button type="button" className="list-row" style={{ color: 'var(--accent)' }} onClick={() => update('safety', { contacts: [...s.contacts, { name: '', phone: '' }] })}>
              <span className="tile tone-violet" style={{ width: 32, height: 32, borderRadius: 10 }}>
                <PlusGlyph size={16} />
              </span>
              <span className="list-row__title">{t('settings.safety.add')}</span>
            </button>
          ) : null}
        </div>
        <p className="set-group__note">
          {s.contacts.length === 0 ? 'Add someone who should hear from you if you press SOS.' : `Up to ${MAX_CONTACTS} people get a message with your location when you press SOS.`}
        </p>
      </section>

      <Group title={t('settings.safety.when')}>
        <SettingToggle
          G={PinGlyph}
          tone="red"
          title={t('settings.safety.shareLocation')}
          meta="Sent to your trusted contacts for one hour."
          checked={s.shareLocationOnSos}
          onChange={(v) => update('safety', { shareLocationOnSos: v })}
        />
        <SettingToggle
          G={WalkGlyph}
          tone="violet"
          title={t('settings.safety.safeWalk')}
          meta="Nearhood checks in if you stop moving on a walk home at night."
          checked={s.safeWalkCheckIn}
          onChange={(v) => update('safety', { safeWalkCheckIn: v })}
        />
      </Group>

      <div className="list list--grouped">
        <LinkRow to="/city/safety" glyph="sos" tone="red" title={t('settings.safety.open')} meta="112, 108, 181 and the nearest hospital" />
      </div>
    </>
  );
}

/* ======================= Help & feedback ======================= */

const FAQ = [
  {
    q: 'Where do Nearhood answers come from?',
    a: 'Each answer merges what neighbours said with ticket listings, maps, local news and official city feeds. The chips under an answer show which sources were used, and you can switch sources off in Sources & AI answers.',
  },
  {
    q: 'What does "sources agree" mean?',
    a: 'It counts how many independent places mention the same thing. A ring with more filled segments means more agreement. Listings seen in only one place are marked unconfirmed.',
  },
  {
    q: 'How do my civic reports reach the city?',
    a: 'After neighbours confirm a report, Nearhood forwards it to the right municipal team with your photos and landmark, then tracks the ticket until it is resolved.',
  },
  {
    q: 'Who can see my posts and profile?',
    a: 'Posts are visible to people in your neighbourhood and groups. Choose who can see your profile and message you in Privacy.',
  },
  {
    q: 'How do I change my neighbourhood?',
    a: 'Tap your area under the Nearhood name on Home, or go to Location & commute.',
  },
];

const GUIDELINES = [
  'Be kind. Disagree with ideas, not people.',
  'Share first-hand information and say when you are unsure.',
  'Verify alerts before forwarding them; link the source if you have one.',
  'No ads outside deal posts, and say if you were paid or invited.',
  'Do not post other people’s phone numbers, addresses or photos of children.',
];

const TOPICS = ['Something is not working', 'Wrong information', 'Inappropriate content', 'Accessibility problem', 'Other'];

export function HelpSection() {
  const t = useT();
  const toast = useToast();
  const [topic, setTopic] = useState(TOPICS[0]);
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  const topicId = useId();
  const detailsId = useId();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (details.trim().length < 10) {
      setError('Tell us a little more (at least 10 characters).');
      return;
    }
    setError('');
    setDetails('');
    toast('Thanks, your report was sent');
  };

  return (
    <>
      <div className="list list--grouped">
        <SettingLink to="/settings/human" G={UsersGlyph} tone="mint" title={t('settings.human')} meta={t('settings.human.meta')} />
      </div>

      <section className="set-group" aria-labelledby="faq-title">
        <h2 className="set-group__title" id="faq-title">
          {t('settings.help.faq')}
        </h2>
        <div className="list list--grouped">
          {FAQ.map((f) => (
            <details key={f.q} className="set-faq">
              <summary>{f.q}</summary>
              <p className="body-sm">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <form className="set-block" onSubmit={submit} noValidate aria-labelledby="report-title">
        <h2 className="set-block__title row" id="report-title" style={{ gap: 6 }}>
          <FlagGlyph size={17} style={{ color: 'var(--accent)' }} />
          {t('settings.help.report')}
        </h2>
        <div className="field">
          <label className="field__label" htmlFor={topicId}>
            {t('settings.help.topic')}
          </label>
          <select id={topicId} className="select" value={topic} onChange={(e) => setTopic(e.target.value)}>
            {TOPICS.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field__label" htmlFor={detailsId}>
            {t('settings.help.details')}
          </label>
          <textarea
            id={detailsId}
            className="textarea"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="What were you doing, and what went wrong?"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${detailsId}-err` : undefined}
          />
          {error ? (
            <span className="set-error" id={`${detailsId}-err`}>
              {error}
            </span>
          ) : null}
        </div>
        <button type="submit" className="btn btn--primary">
          {t('settings.help.send')}
        </button>
      </form>

      <section className="set-block" aria-labelledby="guidelines-title">
        <h2 className="set-block__title" id="guidelines-title">
          {t('settings.help.guidelines')}
        </h2>
        <ol className="set-list">
          {GUIDELINES.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ol>
      </section>
    </>
  );
}

/* ======================= About ======================= */

export function AboutSection() {
  const t = useT();
  const total = Object.keys(PHOTO_SOURCES).length;
  return (
    <>
      <section className="set-about" aria-labelledby="about-brand">
        <span className="set-about__mark">
          <Logo size={60} tile title="Nearhood" />
        </span>
        <h2 id="about-brand" className="sr-only">
          Nearhood
        </h2>
        <Wordmark size={28} />
        <p className="set-about__tag">{t('onboarding.tagline')}</p>
        <span className="row" style={{ gap: 6 }}>
          <span className="badge badge--sm tone-violet">{t('settings.about.version', { v: APP_VERSION })}</span>
          <span className="badge badge--sm badge--lime">{t('settings.about.madeIn')}</span>
        </span>
        <p className="body-sm muted" style={{ maxWidth: 300 }}>
          {t('settings.about.blurb')}
        </p>
      </section>

      <div className="list list--grouped">
        <SettingLink to="/settings/human" G={UsersGlyph} tone="mint" title={t('settings.human')} meta={t('settings.human.meta')} />
        <SettingLink to="/settings/credits" G={ImageGlyph} tone="peach" title={t('settings.credits')} meta={t('settings.credits.meta', { n: total })} />
        <SettingLink to="/about/glyphs" G={SparkGlyph} tone="violet" title={t('settings.about.glyphs')} meta={t('settings.about.glyphsMeta')} />
      </div>

      <section className="set-block" aria-labelledby="about-data">
        <h2 className="set-block__title" id="about-data">
          {t('settings.about.data')}
        </h2>
        <p className="body-sm">
          This version runs on sample data for Ahmedabad. Neighbours, places, events, deals and reports are illustrative; names in square brackets are placeholders. Neighbourhood names and the
          emergency numbers (112, 100, 101, 108, 181, 1098, 1930) are real.
        </p>
      </section>

      <section className="set-block" aria-labelledby="about-how">
        <h2 className="set-block__title row" id="about-how" style={{ gap: 6 }}>
          <TrustRing agree={3} size={18} />
          {t('settings.about.how')}
        </h2>
        <p className="body-sm">
          When you ask something, Nearhood works out what you mean (events, cafés, traffic, water…), gathers matching items from every source you allow, and writes a short answer that names
          its sources. Official city feeds always count; social and community sources can be switched off in Sources & AI answers.
        </p>
      </section>

      <section className="set-block" aria-labelledby="about-credits">
        <h2 className="set-block__title" id="about-credits">
          {t('settings.about.credits')}
        </h2>
        <ul className="set-list">
          <li>Designed from the Nearhood canvas, Porcelain theme.</li>
          <li>Icons: the Nearhood glyph family, drawn for this app.</li>
          <li>Type: Plus Jakarta Sans for headlines and Manrope for text, via Google Fonts.</li>
          <li>
            Photos: {total} images from Unsplash, Flickr and Wikimedia Commons. <Link to="/settings/credits">See every credit</Link>.
          </li>
        </ul>
      </section>
    </>
  );
}

/* ======================= How Nearhood stays human ======================= */

const HUMAN_RULES: Array<{ key: string; glyph: GlyphName; tone: Tone }> = [
  { key: 'settings.human.r1', glyph: 'checkin', tone: 'violet' },
  { key: 'settings.human.r2', glyph: 'deals', tone: 'mint' },
  { key: 'settings.human.r3', glyph: 'services', tone: 'blue' },
  { key: 'settings.human.r4', glyph: 'pin', tone: 'peach' },
  { key: 'settings.human.r5', glyph: 'spark', tone: 'violet' },
  { key: 'settings.human.r6', glyph: 'shield', tone: 'mint' },
  { key: 'settings.human.r7', glyph: 'getaways', tone: 'teal' },
];

export function HumanSection() {
  const t = useT();
  return (
    <>
      <header className="human-head">
        <span className="eyebrow muted">{t('settings.human')}</span>
        <h2 className="human-head__title">{t('settings.human.title')}</h2>
        <p className="body-sm muted">{t('settings.human.intro')}</p>
      </header>

      <ol className="human-rules">
        {HUMAN_RULES.map((r, i) => (
          <li key={r.key} className="human-rule glyph-host">
            <span className={`tile set-tile tone-${r.tone}`} style={{ width: 30, height: 30, borderRadius: 10 }}>
              <NamedGlyph name={r.glyph} size={17} />
            </span>
            <span className="stack grow" style={{ gap: 2, minWidth: 0 }}>
              <span className="human-rule__title">
                <span className="human-rule__n">{i + 1}</span>
                {t(r.key)}
              </span>
              <span className="human-rule__body">{t(`${r.key}b`)}</span>
            </span>
          </li>
        ))}
      </ol>

      <p className="set-group__note">
        {t('settings.human.footer')} <Link to="/settings/help">{t('settings.help')}</Link>
      </p>
    </>
  );
}

/* ======================= Photo credits ======================= */

const PHOTO_GROUPS: Array<{ prefix: string; key: string }> = [
  { prefix: 'place-', key: 'settings.credits.places' },
  { prefix: 'event-', key: 'settings.credits.events' },
  { prefix: 'dish-', key: 'settings.credits.dishes' },
  { prefix: 'scene-', key: 'settings.credits.scenes' },
  { prefix: 'person-', key: 'settings.credits.people' },
];

const UNSPLASH_LICENSE = 'https://unsplash.com/license';

/** Name a photo from its key: the place or event it shows, else "dish-cold-brew" → "Cold brew". */
function photoLabel(key: string) {
  const id = key.replace(/^[a-z]+-/, '');
  if (key.startsWith('place-') && placeById(id)) return placeById(id)!.name;
  if (key.startsWith('event-')) {
    const e = EVENTS.find((x) => x.id === id);
    if (e) return e.title;
  }
  const name = id.replace(/-/g, ' ');
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function PhotoCreditsSection() {
  const t = useT();
  const entries = Object.entries(PHOTO_SOURCES);
  const cc = entries.filter(([, s]) => s.license.startsWith('CC')).length;
  return (
    <>
      <div className="credits-hero">
        <div className="credits-hero__stack" aria-hidden="true">
          {['place-adalaj', 'dish-pav-bhaji', 'place-law-garden'].map((k) => (
            <img key={k} src={photo(k)} alt="" />
          ))}
        </div>
        <div className="stack" style={{ gap: 4 }}>
          <span className="strong">{t('settings.credits.title', { n: entries.length })}</span>
          <span className="body-sm muted">{t('settings.credits.intro', { cc, unsplash: entries.length - cc })}</span>
        </div>
      </div>

      {PHOTO_GROUPS.map((g) => {
        const rows = entries.filter(([k]) => k.startsWith(g.prefix));
        if (!rows.length) return null;
        return (
          <section key={g.prefix} className="set-group" aria-label={t(g.key)}>
            <h2 className="set-group__title">{`${t(g.key)} · ${rows.length}`}</h2>
            <div className="list">
            {rows.map(([k, src]) => (
              <div key={k} className="list-row credit-row">
                <img className="credit-row__thumb" src={photo(k)} alt="" loading="lazy" />
                <span className="list-row__body">
                  <span className="list-row__title">{g.prefix === 'person-' ? t('settings.credits.portrait', { name: person(k.slice(7)).name }) : photoLabel(k)}</span>
                  <span className="list-row__meta credit-row__credit">{src.credit}</span>
                  <span className="credit-row__links">
                    <a href={src.url} target="_blank" rel="noopener noreferrer">
                      {src.source}
                    </a>
                    <span aria-hidden="true">·</span>
                    <a href={src.licenseUrl ?? UNSPLASH_LICENSE} target="_blank" rel="noopener noreferrer" className={src.license.startsWith('CC') ? 'credit-row__cc' : undefined}>
                      {src.license}
                    </a>
                  </span>
                </span>
              </div>
            ))}
            </div>
          </section>
        );
      })}

      <p className="set-group__note">{t('settings.credits.note')}</p>
    </>
  );
}
