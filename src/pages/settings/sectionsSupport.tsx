import { useId, useState, type FormEvent } from 'react';
import { LinkRow } from '../../components/ui';
import { useT } from '../../i18n';
import { FlagGlyph, Logo, PinGlyph, PlusGlyph, TrashGlyph, TrustRing, WalkGlyph } from '../../icons';
import { useSettings } from '../../state/settings';
import { useToast } from '../../state/toast';
import { APP_VERSION } from './meta';
import { Group, SettingToggle } from './parts';

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
        <div className="list">
          {s.contacts.map((c, i) => (
            <div key={i} className="list-row set-contact">
              <span className="avatar tone-violet" style={{ ['--avatar-size' as string]: '36px' }} aria-hidden="true">
                {(c.name.replace(/[[\]]/g, '').trim()[0] ?? '?').toUpperCase()}
              </span>
              <div className="set-contact__fields">
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

      <div className="list">
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
      <section className="set-group" aria-labelledby="faq-title">
        <h2 className="set-group__title" id="faq-title">
          {t('settings.help.faq')}
        </h2>
        <div className="list">
          {FAQ.map((f) => (
            <details key={f.q} className="set-faq">
              <summary>{f.q}</summary>
              <p className="body-sm">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <form className="card stack" onSubmit={submit} noValidate aria-labelledby="report-title">
        <h2 className="section__title row" id="report-title" style={{ gap: 8 }}>
          <FlagGlyph size={20} style={{ color: 'var(--accent)' }} />
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

      <section className="card stack" aria-labelledby="guidelines-title">
        <h2 className="section__title" id="guidelines-title">
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
  return (
    <>
      <section className="card set-about">
        <Logo size={64} title="Nearhood" />
        <h2 className="page-title" style={{ fontSize: '1.5rem' }}>
          nearhood
        </h2>
        <span className="meta">{t('settings.about.version', { v: APP_VERSION })}</span>
        <p className="body-sm">{t('onboarding.tagline')} A smart, city-level companion for Ahmedabad.</p>
      </section>

      <div className="list">
        <LinkRow to="/about/glyphs" glyph="spark" tone="violet" title={t('settings.about.glyphs')} meta={t('settings.about.glyphsMeta')} />
      </div>

      <section className="card stack" aria-labelledby="about-data">
        <h2 className="section__title" id="about-data">
          {t('settings.about.data')}
        </h2>
        <p className="body-sm">
          This version runs on sample data for Ahmedabad. Neighbours, places, events, deals and reports are illustrative; names in square brackets are placeholders. Neighbourhood names and the
          emergency numbers (112, 100, 101, 108, 181, 1098, 1930) are real.
        </p>
      </section>

      <section className="card stack" aria-labelledby="about-how">
        <h2 className="section__title row" id="about-how" style={{ gap: 8 }}>
          <TrustRing agree={3} size={22} />
          {t('settings.about.how')}
        </h2>
        <p className="body-sm">
          When you ask something, Nearhood works out what you mean (events, cafés, traffic, water…), gathers matching items from every source you allow, and writes a short answer that names
          its sources. Official city feeds always count; social and community sources can be switched off in Sources & AI answers.
        </p>
      </section>

      <section className="card stack" aria-labelledby="about-credits">
        <h2 className="section__title" id="about-credits">
          {t('settings.about.credits')}
        </h2>
        <ul className="set-list">
          <li>Designed from the Nearhood canvas.</li>
          <li>Icons: the Nearhood glyph family, drawn for this app.</li>
          <li>Type: Sora and DM Sans, via Google Fonts.</li>
        </ul>
      </section>
    </>
  );
}
