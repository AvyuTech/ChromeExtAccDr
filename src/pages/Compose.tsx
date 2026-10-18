import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Avatar } from '../components/cards';
import { POST_TYPE_META } from '../components/social';
import { Segmented, Sheet } from '../components/ui';
import { ALERT_KIND_META } from '../data/city';
import { neighbourhoodName, PEOPLE } from '../data/core';
import { groupById, POSTS } from '../data/social';
import type { AlertKind, Post, PostType } from '../data/types';
import { useT } from '../i18n';
import { CameraGlyph, CloseGlyph, NamedGlyph, ShieldGlyph, SparkGlyph } from '../icons';
import { useAppData } from '../state/appData';
import { useSettings } from '../state/settings';
import { useToast } from '../state/toast';

const TYPES: Array<{ id: PostType; key: string }> = [
  { id: 'question', key: 'social.type.question' },
  { id: 'recommendation', key: 'social.type.recommendation' },
  { id: 'alert', key: 'social.type.alert' },
  { id: 'lostfound', key: 'social.type.lostfound' },
  { id: 'giveaway', key: 'social.type.giveaway' },
];

const PLACEHOLDER: Record<PostType, string> = {
  question: 'What do you want to know? For example: which café near me has good Wi-Fi?',
  recommendation: 'What did you love, and why should neighbours try it?',
  alert: 'What is happening, where exactly, and since when?',
  lostfound: 'Describe what was lost or found, and where.',
  event: 'What is happening? Add anything people should know before they come.',
  giveaway: 'What are you giving away, and how can people pick it up?',
};

const DEFAULT_TOPIC: Record<Exclude<PostType, 'alert'>, string> = {
  question: 'Question',
  recommendation: 'Recommendation',
  lostfound: 'Lost & found',
  event: 'Events',
  giveaway: 'Give away',
};

const TOPICS = ['Question', 'Recommendation', 'Food', 'New place', 'Traffic', 'Water', 'Power', 'Safety', 'Sports', 'Kids', 'Clubs', 'Lost & found', 'Give away', 'Other'];

const STOP = new Set(['what', 'where', 'which', 'when', 'with', 'from', 'that', 'this', 'have', 'there', 'anyone', 'near', 'good', 'some', 'about', 'they', 'your', 'will', 'just', 'also', 'into', 'than', 'then', 'them']);
const MAX = 500;

function words(text: string) {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9઀-૿ऀ-ॿ]+/)
      .filter((w) => w.length > 3 && !STOP.has(w)),
  );
}

/** Events aren't posts any more (meetups live in clubs), so old event links open a question. */
function asType(v: string | null): PostType {
  return TYPES.some((x) => x.id === v) ? (v as PostType) : 'question';
}

export default function Compose() {
  const [params] = useSearchParams();
  // Remount when ?type or ?group change so the form starts from the new preset.
  return <ComposeForm key={params.toString()} params={params} />;
}

function ComposeForm({ params }: { params: URLSearchParams }) {
  const t = useT();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { data, addPost } = useAppData();
  const toast = useToast();

  const homeName = neighbourhoodName(settings.location.home);
  const presetGroup = params.get('group');
  const groupOptions = useMemo(() => {
    const ids = [...data.joinedGroups];
    if (presetGroup && groupById(presetGroup) && !ids.includes(presetGroup)) ids.unshift(presetGroup);
    return ids.map((id) => groupById(id)).filter((g): g is NonNullable<typeof g> => !!g);
  }, [data.joinedGroups, presetGroup]);

  const [type, setType] = useState<PostType>(() => asType(params.get('type')));
  const [text, setText] = useState('');
  const [alertKind, setAlertKind] = useState<AlertKind>('traffic');
  const [topic, setTopic] = useState(() => (type === 'alert' ? ALERT_KIND_META.traffic.label : DEFAULT_TOPIC[type as Exclude<PostType, 'alert'>]));
  const [target, setTarget] = useState(() => (presetGroup && groupById(presetGroup) ? presetGroup : 'neighbourhood'));
  const [lostFound, setLostFound] = useState<'lost' | 'found'>('lost');
  const [photo, setPhoto] = useState<string | null>(null);
  const [tried, setTried] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  useEffect(() => () => {
    if (photo) URL.revokeObjectURL(photo);
  }, [photo]);

  const chooseType = (next: PostType) => {
    setType(next);
    setTopic(next === 'alert' ? ALERT_KIND_META[alertKind].label : DEFAULT_TOPIC[next as Exclude<PostType, 'alert'>]);
  };

  const trimmed = text.trim();
  const tooShort = trimmed.length < 10;
  const left = MAX - text.length;

  const similar = useMemo(() => {
    if (type !== 'question' || trimmed.length < 8) return [];
    const mine = words(trimmed);
    return POSTS.filter((p) => {
      let shared = 0;
      for (const w of words(p.text)) if (mine.has(w)) shared++;
      return shared >= 2;
    }).slice(0, 3);
  }, [type, trimmed]);

  const leave = () => (window.history.length > 1 ? navigate(-1) : navigate('/'));
  const onCancel = () => (trimmed || photo ? setDiscardOpen(true) : leave());

  const whereLabel =
    target === 'neighbourhood' ? homeName : target === 'city' ? settings.location.city : (groupById(target)?.name ?? homeName);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    setTried(true);
    if (tooShort) return;
    let body = trimmed;
    if (type === 'lostfound') {
      const prefix = lostFound === 'lost' ? 'Lost: ' : 'Found: ';
      if (!/^(lost|found)\b/i.test(body)) body = prefix + body;
    }
    const id = `my-${Date.now()}`;
    const post: Post = {
      id,
      type,
      authorId: 'me',
      area: homeName,
      ago: 'now',
      topic,
      text: body,
      upvotes: 0,
      replies: [],
      replyCount: 0,
      groupId: groupById(target) ? target : undefined,
    };
    addPost(post);
    toast(t('social.posted', { where: whereLabel }));
    navigate(`/post/${id}`, { replace: true });
  };

  const topics = TOPICS.includes(topic) ? TOPICS : [topic, ...TOPICS];

  return (
    <>
      <header className="page-header compose-header">
        <button type="button" className="btn btn--ghost btn--sm" onClick={onCancel}>
          {t('common.cancel')}
        </button>
        <h1 className="page-header__title">{t('social.newPost')}</h1>
        <button type="submit" form="compose-form" className="btn btn--primary btn--sm" disabled={!trimmed}>
          {t('social.publish')}
        </button>
      </header>

      <form id="compose-form" className="compose-form page page--with-header page--no-nav" onSubmit={submit} noValidate>
        <div className="compose-as">
          <Avatar who={{ ...PEOPLE.me, name: settings.profile.name, verified: settings.profile.verifiedResident }} size={36} />
          <span className="stack grow" style={{ gap: 0, minWidth: 0 }}>
            <span className="strong" style={{ fontSize: '0.875rem' }}>{t('social.postingAs', { name: settings.profile.name })}</span>
            <span className="meta truncate">{t('social.visibleTo', { where: whereLabel })}</span>
          </span>
        </div>
        <fieldset className="stack" style={{ border: 'none', margin: 0, padding: 0, gap: 8 }}>
          <legend className="field__label" style={{ marginBottom: 6 }}>
            {t('social.whatType')}
          </legend>
          <div className="type-grid" role="radiogroup" aria-label={t('social.whatType')}>
            {TYPES.map((x) => {
              const meta = POST_TYPE_META[x.id];
              const on = type === x.id;
              return (
                <button key={x.id} type="button" role="radio" aria-checked={on} className="type-option glyph-host" onClick={() => chooseType(x.id)}>
                  <span className={`tile tone-${meta.tone}`} style={{ width: 28, height: 28, borderRadius: 9 }}>
                    <NamedGlyph name={meta.glyph} size={16} active={on} />
                  </span>
                  {t(x.key)}
                </button>
              );
            })}
          </div>
          <Link to="/clubs?create=meetup" className="compose-club-link">
            <NamedGlyph name="calendar" size={15} />
            {t('social.meetupInClub')}
          </Link>
        </fieldset>

        {type === 'lostfound' ? (
          <div className="field">
            <span className="field__label" id="lf-label">
              {t('social.lostOrFound')}
            </span>
            <Segmented
              label={t('social.lostOrFound')}
              value={lostFound}
              onChange={setLostFound}
              options={[
                { value: 'lost', label: t('social.lost') },
                { value: 'found', label: t('social.found') },
              ]}
            />
          </div>
        ) : null}

        {type === 'alert' ? (
          <>
            <div className="field">
              <label className="field__label" htmlFor="alert-kind">
                {t('social.alertKind')}
              </label>
              <select
                id="alert-kind"
                className="select"
                value={alertKind}
                onChange={(e) => {
                  const k = e.target.value as AlertKind;
                  setAlertKind(k);
                  setTopic(ALERT_KIND_META[k].label);
                }}
              >
                {(Object.keys(ALERT_KIND_META) as AlertKind[]).map((k) => (
                  <option key={k} value={k}>
                    {ALERT_KIND_META[k].label}
                  </option>
                ))}
              </select>
            </div>
            <p className="notice tone-amber">
              <ShieldGlyph size={18} style={{ flexShrink: 0 }} />
              <span>{t('social.alertNotice')}</span>
            </p>
          </>
        ) : null}

        <div className="field">
          <label className="field__label" htmlFor="compose-text">
            {t('social.yourPost')}
          </label>
          <textarea
            id="compose-text"
            className="textarea compose-text"
            value={text}
            maxLength={MAX}
            placeholder={PLACEHOLDER[type]}
            aria-describedby="compose-count compose-error"
            aria-invalid={tried && tooShort}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="row row--between">
            <span id="compose-error" className="field-error" aria-live="polite">
              {tried && tooShort ? t('social.tooShort') : ''}
            </span>
            <span id="compose-count" className={`char-count${left <= 40 ? ' char-count--warn' : ''}`}>
              {t('social.charsLeft', { n: left })}
            </span>
          </div>
        </div>

        {similar.length ? (
          <section className="similar-panel" aria-labelledby="similar-title">
            <span className="row" style={{ gap: 6 }}>
              <NamedGlyph name="question" size={16} style={{ color: 'var(--accent)' }} />
              <span id="similar-title" className="strong" style={{ fontSize: '0.84375rem', color: 'var(--accent-strong)' }}>
                {t('social.similar')}
              </span>
            </span>
            <span className="meta">{t('social.similarHint')}</span>
            {similar.map((p) => (
              <Link key={p.id} to={`/post/${p.id}`}>
                {p.text}
                <span className="meta" style={{ display: 'block', fontWeight: 500, marginTop: 2 }}>
                  {t('common.replies', { n: p.replyCount })}
                  {p.answer ? ` · ${t('answer.label')}` : ''}
                </span>
              </Link>
            ))}
          </section>
        ) : null}

        {type === 'question' && settings.ai.answers && settings.ai.summariseThreads ? (
          <p className="notice tone-violet">
            <SparkGlyph size={18} style={{ flexShrink: 0, color: 'var(--accent)' }} />
            <span>{t('social.summariseNote')}</span>
          </p>
        ) : null}

        <div className="field">
          <label className="field__label" htmlFor="compose-topic">
            {t('social.topic')}
          </label>
          <select id="compose-topic" className="select" value={topic} onChange={(e) => setTopic(e.target.value)}>
            {topics.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="compose-target">
            {t('social.postTo')}
          </label>
          <select id="compose-target" className="select" value={target} onChange={(e) => setTarget(e.target.value)}>
            <option value="neighbourhood">{t('social.myNeighbourhood', { name: homeName })}</option>
            <option value="city">{t('social.wholeCity', { city: settings.location.city })}</option>
            {groupOptions.length ? (
              <optgroup label={t('social.yourClubs')}>
                {groupOptions.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </optgroup>
            ) : null}
          </select>
        </div>

        {photo ? (
          <div className="photo-preview">
            <img src={photo} alt="Photo attached to your post" />
            <button
              type="button"
              className="icon-btn"
              aria-label={t('social.removePhoto')}
              onClick={() => {
                setPhoto(null);
              }}
            >
              <CloseGlyph size={18} />
            </button>
          </div>
        ) : (
          <label className="photo-picker glyph-host">
            <span className="photo-picker__icon">
              <CameraGlyph size={22} />
            </span>
            <span className="stack grow" style={{ gap: 2 }}>
              <span className="strong">{t('social.addPhoto')}</span>
              <span className="meta">{t('social.photoHint')}</span>
            </span>
            <span className="photo-picker__plus" aria-hidden="true">
              +
            </span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setPhoto(URL.createObjectURL(file));
                e.target.value = '';
              }}
            />
          </label>
        )}

        <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={!trimmed}>
          {t('social.publish')}
        </button>
      </form>

      <Sheet open={discardOpen} onClose={() => setDiscardOpen(false)} title={t('social.discardTitle')}>
        <p className="body-sm muted">{t('social.discardBody')}</p>
        <div className="grid-2">
          <button type="button" className="btn btn--soft btn--lg" onClick={() => setDiscardOpen(false)}>
            {t('social.keepEditing')}
          </button>
          <button
            type="button"
            className="btn btn--danger btn--lg"
            onClick={() => {
              setDiscardOpen(false);
              leave();
            }}
          >
            {t('social.discard')}
          </button>
        </div>
      </Sheet>
    </>
  );
}
