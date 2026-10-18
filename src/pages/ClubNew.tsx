import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { CLUB_KINDS, KIND_META } from '../components/clubs';
import { PageHeader } from '../components/ui';
import { NEIGHBOURHOODS, neighbourhoodName } from '../data/core';
import { NEIGHBOURHOOD_POS } from '../data/mapPositions';
import type { ClubKind } from '../data/types';
import { useT } from '../i18n';
import { GlobeGlyph, LockGlyph, NamedGlyph } from '../icons';
import { useAppData } from '../state/appData';
import { useSettings } from '../state/settings';
import { useToast } from '../state/toast';

/** Neighbourhoods on the clubs map; a club needs a spot to show up there. */
const AREAS = NEIGHBOURHOODS.filter((n) => NEIGHBOURHOOD_POS[n.id]);

/** Start a club. People run clubs; there are no business pages. */
export default function ClubNew() {
  const t = useT();
  const navigate = useNavigate();
  const toast = useToast();
  const { settings } = useSettings();
  const { addClub } = useAppData();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<ClubKind>('neighbours');
  const [areaId, setAreaId] = useState(AREAS.some((a) => a.id === settings.location.home) ? settings.location.home : AREAS[0].id);
  const [about, setAbout] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'neighbours'>('public');
  const [rule, setRule] = useState('');

  const ready = name.trim().length >= 3 && about.trim().length >= 3;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    const meta = KIND_META[kind];
    const id = `club-${Date.now()}`;
    addClub({
      id,
      name: name.trim(),
      members: 1,
      postsToday: 0,
      description: about.trim(),
      tone: meta.tone,
      glyph: meta.glyph,
      area: neighbourhoodName(areaId),
      rules: rule.trim() ? [rule.trim()] : [],
      admins: ['me'],
      privacy,
      kind,
      areaId,
      meetups: [],
      buys: [],
    });
    toast(t('clubs.new.created', { name: name.trim() }));
    navigate(`/clubs/${id}`, { replace: true });
  };

  return (
    <>
      <PageHeader title={t('clubs.new.title')} fallback="/clubs" />
      <main className="page page--with-header page--no-nav club-new">
        <p className="body-sm muted">{t('clubs.new.intro')}</p>
        <form className="stack club-form" onSubmit={submit}>
          <label className="field">
            <span className="field__label">{t('clubs.new.name')}</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('clubs.new.nameHint')} maxLength={48} required />
          </label>

          <fieldset className="field club-new__set">
            <legend className="field__label">{t('clubs.new.kind')}</legend>
            <div className="chip-wrap">
              {CLUB_KINDS.map((k) => (
                <button key={k} type="button" className="chip chip--icon" aria-pressed={kind === k} onClick={() => setKind(k)}>
                  <NamedGlyph name={KIND_META[k].glyph} size={16} />
                  {t(`clubs.kind.${k}`)}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="field">
            <span className="field__label">{t('clubs.new.area')}</span>
            <select className="select" value={areaId} onChange={(e) => setAreaId(e.target.value)}>
              {AREAS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field__label">{t('clubs.new.about')}</span>
            <textarea className="textarea" rows={3} value={about} onChange={(e) => setAbout(e.target.value)} placeholder={t('clubs.new.aboutHint')} maxLength={200} required />
          </label>

          <fieldset className="field club-new__set">
            <legend className="field__label">{t('clubs.new.who')}</legend>
            <div className="segmented" role="radiogroup" aria-label={t('clubs.new.who')}>
              <button type="button" role="radio" aria-checked={privacy === 'public'} onClick={() => setPrivacy('public')}>
                <span className="row" style={{ gap: 6, justifyContent: 'center' }}>
                  <GlobeGlyph size={14} />
                  {t('clubs.new.whoPublic')}
                </span>
              </button>
              <button type="button" role="radio" aria-checked={privacy === 'neighbours'} onClick={() => setPrivacy('neighbours')}>
                <span className="row" style={{ gap: 6, justifyContent: 'center' }}>
                  <LockGlyph size={14} />
                  {t('clubs.new.whoNeighbours')}
                </span>
              </button>
            </div>
          </fieldset>

          <label className="field">
            <span className="field__label">{t('clubs.new.rule')}</span>
            <input className="input" value={rule} onChange={(e) => setRule(e.target.value)} placeholder={t('clubs.new.ruleHint')} maxLength={80} />
          </label>

          <p className="field__hint">{t('clubs.new.human')}</p>

          <button type="submit" className="btn btn--primary btn--block" disabled={!ready}>
            {t('clubs.new.create')}
          </button>
        </form>
      </main>
    </>
  );
}
