import { useEffect, useState } from 'react';
import { Segmented, Sheet } from '../../components/ui';
import { SOURCES, TOGGLEABLE_SOURCES } from '../../data/core';
import type { SourceId } from '../../data/types';
import { useT } from '../../i18n';
import {
  AirGlyph,
  BoltGlyph,
  CityGlyph,
  CloudGlyph,
  DataGlyph,
  DownloadGlyph,
  EventsGlyph,
  FriendsGlyph,
  LayersGlyph,
  NewsGlyph,
  PinGlyph,
  PoliceGlyph,
  ReelGlyph,
  RefreshGlyph,
  SearchGlyph,
  ServicesGlyph,
  ShieldGlyph,
  SparkGlyph,
  StarGlyph,
  TrashGlyph,
  TrustRing,
  UsersGlyph,
  WifiGlyph,
} from '../../icons';
import { useAppData } from '../../state/appData';
import { useSettings, type Settings } from '../../state/settings';
import { useToast } from '../../state/toast';
import { GlyphTile, Group, SegmentRow, SettingToggle, StackRow, type GlyphComp } from './parts';

/* ======================= Privacy ======================= */

export function PrivacySection() {
  const t = useT();
  const toast = useToast();
  const { settings, update } = useSettings();
  const { data } = useAppData();
  const p = settings.privacy;

  const download = () => {
    try {
      const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), app: 'Nearhood', settings, activity: data }, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'nearhood-my-data.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast('Your data file is downloading');
    } catch {
      toast('Could not create the file on this device');
    }
  };

  return (
    <>
      <Group title={t('settings.privacy.visibilityGroup')}>
        <SegmentRow
          label={t('settings.privacy.visibility')}
          value={p.profileVisibility}
          onChange={(v) => update('privacy', { profileVisibility: v })}
          options={[
            { value: 'everyone', label: t('settings.privacy.everyone') },
            { value: 'neighbours', label: t('settings.privacy.neighbours') },
            { value: 'only-me', label: t('settings.privacy.onlyMe') },
          ]}
          hint={
            p.profileVisibility === 'everyone'
              ? 'Anyone on Nearhood can open your profile.'
              : p.profileVisibility === 'neighbours'
                ? 'Only people in your neighbourhood and groups.'
                : 'Your posts still show your name; your profile page is hidden.'
          }
        />
        <SegmentRow
          label={t('settings.privacy.precision')}
          value={p.locationPrecision}
          onChange={(v) => update('privacy', { locationPrecision: v })}
          options={[
            { value: 'exact', label: t('settings.privacy.exact') },
            { value: 'neighbourhood', label: t('settings.privacy.area') },
            { value: 'city', label: t('settings.privacy.cityOnly') },
          ]}
          hint={p.locationPrecision === 'exact' ? 'Civic reports always need an exact pin; posts use this setting.' : undefined}
        />
        <SegmentRow
          label={t('settings.privacy.messages')}
          value={p.allowMessages}
          onChange={(v) => update('privacy', { allowMessages: v })}
          options={[
            { value: 'everyone', label: t('settings.privacy.everyone') },
            { value: 'neighbours', label: t('settings.privacy.neighbours') },
            { value: 'nobody', label: t('settings.privacy.nobody') },
          ]}
        />
        <SettingToggle G={EventsGlyph} tone="peach" title={t('settings.privacy.showGoing')} meta="Friends see you in the Going list." checked={p.showGoing} onChange={(v) => update('privacy', { showGoing: v })} />
        <SettingToggle G={PinGlyph} tone="teal" title={t('settings.privacy.showArea')} meta="Shown next to your name on posts and replies." checked={p.showArea} onChange={(v) => update('privacy', { showArea: v })} />
        <SettingToggle
          G={StarGlyph}
          tone="violet"
          title={t('settings.privacy.showOnBoards')}
          meta={p.showOnBoards ? 'Neighbours can see your rank. Your level shows on your profile either way.' : 'You’re off the boards. You still earn points and levels.'}
          checked={p.showOnBoards}
          onChange={(v) => update('privacy', { showOnBoards: v })}
        />
      </Group>

      <Group title={t('settings.privacy.friendsGroup')} note="Friends are people you follow who follow you back.">
        <SegmentRow
          label={t('settings.privacy.checkInAudience')}
          value={p.checkInAudience}
          onChange={(v) => update('privacy', { checkInAudience: v })}
          options={[
            { value: 'friends', label: t('settings.privacy.friends') },
            { value: 'everyone', label: t('settings.privacy.everyone') },
          ]}
          hint={
            p.checkInAudience === 'friends'
              ? 'New check-ins go to friends. You can still pick Everyone on each one.'
              : 'New check-ins are public and count towards each place’s community score.'
          }
        />
        <SegmentRow
          label={t('settings.privacy.listVisibility')}
          value={p.listVisibility}
          onChange={(v) => update('privacy', { listVisibility: v })}
          options={[
            { value: 'everyone', label: t('settings.privacy.everyone') },
            { value: 'friends', label: t('settings.privacy.friends') },
            { value: 'only-me', label: t('settings.privacy.onlyMe') },
          ]}
          hint="Friends can copy things from your list to theirs."
        />
        <SettingToggle
          G={FriendsGlyph}
          tone="violet"
          title={t('settings.privacy.approveFollowers')}
          meta={p.approveFollowers ? 'New followers wait for your OK.' : 'Anyone can follow you; friends-only posts still need you to follow back.'}
          checked={p.approveFollowers}
          onChange={(v) => update('privacy', { approveFollowers: v })}
        />
      </Group>

      <Group title="Personalisation">
        <SettingToggle
          G={SparkGlyph}
          tone="violet"
          title={t('settings.privacy.personalised')}
          meta="Uses your interests and saved places to order Home."
          checked={p.personalisedSuggestions}
          onChange={(v) => update('privacy', { personalisedSuggestions: v })}
        />
        <SettingToggle
          G={DataGlyph}
          tone="blue"
          title={t('settings.privacy.analytics')}
          meta="Anonymous counts of which screens are used. Never your posts or location."
          checked={p.usageAnalytics}
          onChange={(v) => update('privacy', { usageAnalytics: v })}
        />
      </Group>

      <Group title={t('settings.privacy.yourData')} note="In this version everything stays on this device. Nothing is sent to a server.">
        <button type="button" className="list-row glyph-host" onClick={download}>
          <GlyphTile G={DownloadGlyph} tone="mint" />
          <span className="list-row__body">
            <span className="list-row__title">{t('settings.privacy.download')}</span>
            <span className="list-row__meta">Settings, saved items, posts and reports as a JSON file.</span>
          </span>
        </button>
      </Group>
    </>
  );
}

/* ======================= Sources & AI answers ======================= */

type ToggleSource = keyof Settings['sources']['enabled'];

const SOURCE_META: Record<ToggleSource, { G: GlyphComp; tone: 'peach' | 'violet' | 'teal' | 'blue' | 'mint'; what: string }> = {
  // Outside sources fill gaps and are always labelled; none of them counts as a review.
  tickets: { G: EventsGlyph, tone: 'peach', what: 'Event listings from ticket sites and organisers; Nearhood links out' },
  instagram: { G: ReelGlyph, tone: 'violet', what: 'Public reels and posts about places and events, labelled' },
  maps: { G: PinGlyph, tone: 'teal', what: 'Addresses, pins and opening hours' },
  news: { G: NewsGlyph, tone: 'blue', what: 'Local news coverage' },
  neighbours: { G: UsersGlyph, tone: 'mint', what: 'Replies and check-ins from people nearby' },
};

const OFFICIAL: Array<{ id: SourceId; G: GlyphComp }> = [
  { id: 'police', G: PoliceGlyph },
  { id: 'cyber', G: ShieldGlyph },
  { id: 'amc', G: ServicesGlyph },
  { id: 'utility', G: BoltGlyph },
  { id: 'imd', G: CloudGlyph },
  { id: 'cpcb', G: AirGlyph },
];

const SAMPLE = [
  'There are **9 things happening** near you this weekend.',
  'The biggest is the **Sufi night** on Saturday; the **Sunday flea market** is the free favourite.',
  'Listings seen in only one place are marked unconfirmed.',
];

function renderBold(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => (part.startsWith('**') ? <b key={i}>{part.slice(2, -2)}</b> : <span key={i}>{part}</span>));
}

export function SourcesSection() {
  const t = useT();
  const { settings, update } = useSettings();
  const s = settings.sources;
  const ai = settings.ai;
  const off = TOGGLEABLE_SOURCES.filter((id) => !s.enabled[id as ToggleSource]).length;
  const sentences = ai.length === 'brief' ? 1 : ai.length === 'balanced' ? 2 : 3;

  return (
    <>
      <div className="notice tone-violet" style={{ alignItems: 'center' }}>
        <TrustRing agree={3} size={30} title="Example: 3 of 4 sources agree" />
        <span>Nearhood checks every listing against several sources and shows how many agree. You choose which sources count.</span>
      </div>

      <Group title={t('settings.sources.which')}>
        {TOGGLEABLE_SOURCES.map((id) => {
          const key = id as ToggleSource;
          const m = SOURCE_META[key];
          return (
            <SettingToggle
              key={id}
              G={m.G}
              tone={m.tone}
              title={SOURCES[id].label}
              meta={m.what}
              checked={s.enabled[key]}
              onChange={(v) => update('sources', { enabled: { ...s.enabled, [key]: v } })}
            />
          );
        })}
      </Group>
      {off >= 3 ? <p className="notice tone-amber">With most sources off, answers and listings may miss things happening near you.</p> : null}

      <Group title={t('settings.sources.official')} note="Official feeds for safety, transport and utilities cannot be switched off.">
        {OFFICIAL.map((o) => (
          <div key={o.id} className="list-row">
            <GlyphTile G={o.G} tone="blue" />
            <span className="list-row__body">
              <span className="list-row__title">{SOURCES[o.id].label}</span>
            </span>
            <span className="badge badge--sm tone-mint">{t('settings.sources.alwaysOn')}</span>
          </div>
        ))}
      </Group>

      <Group title={t('settings.sources.trust')}>
        <SettingToggle
          G={SearchGlyph}
          tone="amber"
          title={t('settings.sources.unconfirmed')}
          meta="Things seen in only one place, shown with a dashed outline."
          checked={s.showUnconfirmed}
          onChange={(v) => update('sources', { showUnconfirmed: v })}
        />
        <StackRow
          label={t('settings.sources.agreement')}
          hint={<TrustRing agree={s.minAgreement} size={26} title={`At least ${s.minAgreement} of 4 sources`} />}
        >
          <Segmented
            label={t('settings.sources.agreement')}
            value={s.minAgreement}
            onChange={(v) => update('sources', { minAgreement: v })}
            options={[
              { value: 1 as const, label: '1+' },
              { value: 2 as const, label: '2+' },
              { value: 3 as const, label: '3+' },
            ]}
          />
          <span className="list-row__meta">
            {s.minAgreement === 1
              ? 'Show anything a source mentions.'
              : s.minAgreement === 2
                ? 'Hide places and events only one source mentions.'
                : 'Only well-confirmed listings. You may see fewer results.'}
          </span>
        </StackRow>
      </Group>

      <Group title={t('settings.sources.ai')}>
        <SettingToggle
          G={SparkGlyph}
          tone="violet"
          title={t('settings.sources.answers')}
          meta="Short merged answers at the top of search and long threads."
          checked={ai.answers}
          onChange={(v) => update('ai', { answers: v })}
        />
        <SegmentRow
          label={t('settings.sources.length')}
          value={ai.length}
          disabled={!ai.answers}
          onChange={(v) => update('ai', { length: v })}
          options={(['brief', 'balanced', 'detailed'] as const).map((l) => ({ value: l, label: t(`settings.length.${l}`) }))}
        />
        {ai.answers ? (
          <div className="list-row set-row--stack">
            <span className="eyebrow muted">{t('settings.appearance.preview')}</span>
            <p className="answer-text set-answer-preview">{renderBold(SAMPLE.slice(0, sentences).join(' '))}</p>
          </div>
        ) : null}
        <SettingToggle G={LayersGlyph} tone="mint" title={t('settings.sources.showSources')} checked={ai.showSources} disabled={!ai.answers} onChange={(v) => update('ai', { showSources: v })} />
        <SettingToggle G={RefreshGlyph} tone="teal" title={t('settings.sources.followUps')} checked={ai.followUps} disabled={!ai.answers} onChange={(v) => update('ai', { followUps: v })} />
        <SettingToggle
          G={UsersGlyph}
          tone="blue"
          title={t('settings.sources.summarise')}
          meta="Adds a Nearhood answer to busy neighbour threads."
          checked={ai.summariseThreads}
          disabled={!ai.answers}
          onChange={(v) => update('ai', { summariseThreads: v })}
        />
      </Group>
    </>
  );
}

/* ======================= Data & storage ======================= */

function kb(bytes: number) {
  return bytes >= 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function nearhoodBytes() {
  try {
    let total = 0;
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith('nearhood.')) total += (k.length + (window.localStorage.getItem(k)?.length ?? 0)) * 2;
    }
    return total;
  } catch {
    return 0;
  }
}

export function DataSection() {
  const t = useT();
  const toast = useToast();
  const { settings, update } = useSettings();
  const app = useAppData();
  const d = settings.data;
  const [estimate, setEstimate] = useState<{ usage: number; quota: number } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const local = nearhoodBytes();

  useEffect(() => {
    let alive = true;
    try {
      navigator.storage
        ?.estimate?.()
        .then((e) => {
          if (alive && e.usage !== undefined && e.quota) setEstimate({ usage: e.usage, quota: e.quota });
        })
        .catch(() => undefined);
    } catch {
      /* not available here */
    }
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      <Group title={t('settings.data.usage')}>
        <SettingToggle
          G={WifiGlyph}
          tone="teal"
          title={t('settings.data.saver')}
          meta="Pauses live city updates to save mobile data."
          checked={d.dataSaver}
          onChange={(v) => update('data', { dataSaver: v })}
        />
        <SettingToggle
          G={CityGlyph}
          tone="violet"
          title={t('settings.data.live')}
          meta={d.dataSaver ? 'Paused while Data saver is on.' : 'Traffic, weather and air quality refresh on their own.'}
          checked={d.liveUpdates && !d.dataSaver}
          disabled={d.dataSaver}
          onChange={(v) => update('data', { liveUpdates: v })}
        />
        <SettingToggle
          G={DownloadGlyph}
          tone="mint"
          title={t('settings.data.offline')}
          meta="Emergency numbers, your alerts and saved places work without signal."
          checked={d.offlineEssentials}
          onChange={(v) => update('data', { offlineEssentials: v })}
        />
        <SegmentRow
          label={t('settings.data.autoplay')}
          value={d.autoplayVideos}
          onChange={(v) => update('data', { autoplayVideos: v })}
          options={(['always', 'wifi', 'never'] as const).map((o) => ({ value: o, label: t(`settings.autoplay.${o}`) }))}
        />
      </Group>

      <Group title={t('settings.data.storage')}>
        <div className="list-row set-row--stack">
          <div className="row row--between">
            <span className="list-row__title">Nearhood data</span>
            <span className="num">{kb(local)}</span>
          </div>
          {estimate ? (
            <>
              <div className="progress" aria-hidden="true">
                <span style={{ width: `${Math.max(2, Math.min(100, (estimate.usage / estimate.quota) * 100))}%` }} />
              </div>
              <span className="list-row__meta">
                This browser is using {kb(estimate.usage)} of {kb(estimate.quota)} available.
              </span>
            </>
          ) : (
            <span className="list-row__meta">Saved items, settings and drafts on this device.</span>
          )}
        </div>
        <button
          type="button"
          className="list-row"
          disabled={app.data.recentSearches.length === 0}
          onClick={() => {
            app.clearSearches();
            toast('Recent searches cleared');
          }}
        >
          <GlyphTile G={SearchGlyph} tone="blue" />
          <span className="list-row__body">
            <span className="list-row__title">{t('settings.data.clearSearches')}</span>
            <span className="list-row__meta">{app.data.recentSearches.length ? `${app.data.recentSearches.length} saved on this device` : 'Nothing to clear'}</span>
          </span>
        </button>
        <button type="button" className="list-row" onClick={() => setConfirmReset(true)}>
          <GlyphTile G={TrashGlyph} tone="red" />
          <span className="list-row__body">
            <span className="list-row__title">{t('settings.data.reset')}</span>
            <span className="list-row__meta">Saved items, posts, reports and messages go back to the sample.</span>
          </span>
        </button>
      </Group>

      <Sheet open={confirmReset} onClose={() => setConfirmReset(false)} title={t('settings.data.reset')}>
        <p className="body-sm">{t('settings.resetDataBody')}</p>
        <div className="grid-2">
          <button type="button" className="btn btn--outline" onClick={() => setConfirmReset(false)}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => {
              app.reset();
              setConfirmReset(false);
              toast('App data reset');
            }}
          >
            {t('settings.data.reset')}
          </button>
        </div>
      </Sheet>
    </>
  );
}
