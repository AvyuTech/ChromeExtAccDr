import { useId, useState, type FormEvent, type InputHTMLAttributes } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar } from '../../components/cards';
import { Sheet, ToggleRow } from '../../components/ui';
import { ALERT_KIND_META, ALERTS } from '../../data/city';
import { CITIES, NEIGHBOURHOODS, PEOPLE, neighbourhoodName, type CityName } from '../../data/core';
import type { AlertKind, Severity } from '../../data/types';
import { useT } from '../../i18n';
import {
  AlertGlyph,
  AutoGlyph,
  BellGlyph,
  BikeGlyph,
  BusGlyph,
  CarGlyph,
  EventsGlyph,
  GroupsGlyph,
  DealsGlyph,
  MailGlyph,
  PinGlyph,
  ReplyGlyph,
  ReportGlyph,
  ShieldGlyph,
  TransitGlyph,
  UserGlyph,
  WalkGlyph,
} from '../../icons';
import { CommuteGlyph, DigestGlyph, QuietGlyph } from '../../icons/extra-settings';
import { visibleAlerts, visibleNotifications } from '../../lib/selectors';
import { NOTIFICATIONS } from '../../data/social';
import { useAppData } from '../../state/appData';
import { useSettings, type CommuteMode, type Settings } from '../../state/settings';
import { useToast } from '../../state/toast';
import { ChoiceTiles, Group, RangeRow, SegmentRow, SelectRow, SettingToggle, StackRow, type GlyphComp } from './parts';

/* ======================= Account ======================= */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const HANDLE_RE = /^[a-z0-9._]{3,24}$/;

function phoneDigits(v: string) {
  return v.replace(/[\s-]/g, '').replace(/^\+?91/, '');
}

export function AccountSection() {
  const t = useT();
  const navigate = useNavigate();
  const toast = useToast();
  const { settings, update, reset } = useSettings();
  const app = useAppData();
  const [draft, setDraft] = useState(settings.profile);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ids = { name: useId(), handle: useId(), email: useId(), phone: useId(), bio: useId() };

  const errors = {
    name: draft.name.trim().length < 2 ? 'Enter at least 2 characters.' : '',
    handle: HANDLE_RE.test(draft.handle) ? '' : 'Use 3–24 lowercase letters, numbers, dots or underscores.',
    email: !draft.email || EMAIL_RE.test(draft.email.trim()) ? '' : 'Enter an email like name@example.com.',
    phone: !draft.phone || /^[6-9]\d{9}$/.test(phoneDigits(draft.phone)) ? '' : 'Enter a 10-digit Indian mobile number.',
  };
  const valid = !errors.name && !errors.handle && !errors.email && !errors.phone;
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings.profile);

  const set = (k: keyof typeof draft, v: string) => setDraft((d) => ({ ...d, [k]: v }));
  const blur = (k: string) => setTouched((x) => ({ ...x, [k]: true }));
  const show = (k: keyof typeof errors) => (touched[k] ? errors[k] : '');

  const onSave = (e: FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, handle: true, email: true, phone: true });
    if (!valid) return;
    update('profile', { ...draft, name: draft.name.trim(), email: draft.email.trim() });
    toast(t('settings.saved'));
  };

  const me = { ...PEOPLE.me, name: draft.name || PEOPLE.me.name, initials: (draft.name.trim()[0] ?? 'N').toUpperCase(), verified: settings.profile.verifiedResident };

  const field = (k: 'name' | 'handle' | 'email' | 'phone', label: string, props: InputHTMLAttributes<HTMLInputElement>, prefix?: string) => (
    <div className="field">
      <label className="field__label" htmlFor={ids[k]}>
        {label}
      </label>
      <div className={prefix ? 'set-prefix' : undefined}>
        {prefix ? <span aria-hidden="true">{prefix}</span> : null}
        <input
          id={ids[k]}
          className="input"
          value={draft[k]}
          onChange={(e) => set(k, k === 'handle' ? e.target.value.toLowerCase() : e.target.value)}
          onBlur={() => blur(k)}
          aria-invalid={show(k) ? true : undefined}
          aria-describedby={show(k) ? `${ids[k]}-err` : undefined}
          {...props}
        />
      </div>
      {show(k) ? (
        <span className="set-error" id={`${ids[k]}-err`}>
          {show(k)}
        </span>
      ) : null}
    </div>
  );

  return (
    <>
      <form className="card stack stack--lg" onSubmit={onSave} noValidate aria-label={t('settings.account.profile')}>
        <div className="row" style={{ gap: 14 }}>
          <Avatar who={me} size={64} />
          <div className="stack" style={{ gap: 2 }}>
            <span className="display strong" style={{ fontSize: '1.125rem' }}>
              {draft.name || '…'}
            </span>
            <span className="meta">
              @{draft.handle} · {neighbourhoodName(settings.location.home)}
            </span>
          </div>
        </div>
        {field('name', t('settings.account.name'), { autoComplete: 'name', required: true })}
        {field('handle', t('settings.account.handle'), { autoComplete: 'username', autoCapitalize: 'none', spellCheck: false }, '@')}
        {field('email', t('settings.account.email'), { type: 'email', autoComplete: 'email', inputMode: 'email', placeholder: 'name@example.com' })}
        {field('phone', t('settings.account.phone'), { type: 'tel', autoComplete: 'tel-national', inputMode: 'tel', placeholder: '98765 43210' }, '+91')}
        <div className="field">
          <label className="field__label" htmlFor={ids.bio}>
            {t('settings.account.bio')}
          </label>
          <textarea id={ids.bio} className="textarea" maxLength={160} value={draft.bio} onChange={(e) => set('bio', e.target.value)} />
          <span className="field__hint" aria-live="polite">
            {draft.bio.length}/160
          </span>
        </div>
        <button type="submit" className="btn btn--primary btn--block" disabled={!dirty}>
          {t('settings.saveChanges')}
        </button>
      </form>

      <Group>
        <div className="list-row">
          <span className="tile tone-mint" style={{ width: 32, height: 32, borderRadius: 10 }}>
            <ShieldGlyph size={18} duo />
          </span>
          <span className="list-row__body">
            <span className="list-row__title">{t('settings.account.verified')}</span>
            <span className="list-row__meta">
              {settings.profile.verifiedResident
                ? `Your address in ${neighbourhoodName(settings.location.home)} is confirmed. Neighbours see a tick on your posts.`
                : 'Confirm your address to get a tick on your posts and vote on ward reports.'}
            </span>
          </span>
          {settings.profile.verifiedResident ? (
            <span className="badge tone-mint">{t('common.verified')}</span>
          ) : (
            <button
              type="button"
              className="btn btn--sm btn--soft"
              onClick={() => {
                update('profile', { verifiedResident: true });
                toast('Verification requested');
              }}
            >
              Verify
            </button>
          )}
        </div>
      </Group>

      <Group title={t('settings.account.danger')}>
        <div className="list-row">
          <span className="list-row__body">
            <span className="list-row__title">{t('settings.account.delete')}</span>
            <span className="list-row__meta">Removes everything Nearhood keeps on this device.</span>
          </span>
          <button type="button" className="btn btn--sm btn--danger" onClick={() => setConfirmDelete(true)}>
            {t('settings.account.delete')}
          </button>
        </div>
      </Group>

      <Sheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title={t('settings.account.deleteTitle')}>
        <p className="body-sm">{t('settings.account.deleteBody')}</p>
        <div className="grid-2">
          <button type="button" className="btn btn--outline" onClick={() => setConfirmDelete(false)}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => {
              setConfirmDelete(false);
              app.reset();
              reset();
              update('onboarded', false);
              navigate('/onboarding', { replace: true });
            }}
          >
            {t('settings.account.deleteConfirm')}
          </button>
        </div>
      </Sheet>
    </>
  );
}

/* ======================= Location & commute ======================= */

export const COMMUTE_MODES: Array<{ value: CommuteMode; G: GlyphComp }> = [
  { value: 'metro', G: TransitGlyph },
  { value: 'brts', G: BusGlyph },
  { value: 'car', G: CarGlyph },
  { value: 'two-wheeler', G: BikeGlyph },
  { value: 'auto', G: AutoGlyph },
  { value: 'walk', G: WalkGlyph },
];

export function LocationSection() {
  const t = useT();
  const { settings, update } = useSettings();
  const loc = settings.location;
  const leaveId = useId();
  const returnId = useId();
  const hoods = NEIGHBOURHOODS.map((n) => ({ value: n.id, label: `${n.name} · ${n.zone}` }));

  return (
    <>
      <Group title={t('settings.location.where')} note="Home and work decide which alerts reach you and what Near me shows on Home.">
        <SelectRow
          label={t('settings.location.city')}
          value={loc.city}
          onChange={(v) => update('location', { city: v as CityName })}
          options={CITIES.map((c) => ({ value: c, label: c === 'Ahmedabad' ? c : `${c} · ${t('onboarding.comingSoon')}`, disabled: c !== 'Ahmedabad' }))}
        />
        <SelectRow label={t('settings.location.home')} value={loc.home} onChange={(v) => update('location', { home: v })} options={hoods} />
        <SelectRow
          label={t('settings.location.work')}
          value={loc.work}
          onChange={(v) => update('location', { work: v })}
          options={[{ value: '', label: t('settings.location.none') }, ...hoods]}
        />
        <SettingToggle
          G={PinGlyph}
          tone="teal"
          title={t('settings.location.auto')}
          meta="Switch neighbourhood automatically when you are somewhere else in the city."
          checked={loc.autoDetect}
          onChange={(v) => update('location', { autoDetect: v })}
        />
        <RangeRow label={t('settings.location.radius')} value={loc.radiusKm} min={1} max={20} onChange={(v) => update('location', { radiusKm: v })} format={(v) => `${v} km`} />
      </Group>

      <Group title={t('settings.location.commute')} note="Used for commute-only alerts and the Leaving soon card in City.">
        <StackRow label={t('settings.location.mode')}>
          <ChoiceTiles
            label={t('settings.location.mode')}
            value={loc.commuteMode}
            onChange={(v) => update('location', { commuteMode: v })}
            options={COMMUTE_MODES.map((m) => ({ value: m.value, G: m.G, label: t(`settings.mode.${m.value}`) }))}
          />
        </StackRow>
        <div className="list-row set-row--stack">
          <div className="grid-2">
            <div className="field">
              <label className="field__label" htmlFor={leaveId}>
                {t('settings.location.leave')}
              </label>
              <input id={leaveId} className="input" type="time" value={loc.leaveAt} onChange={(e) => update('location', { leaveAt: e.target.value })} />
            </div>
            <div className="field">
              <label className="field__label" htmlFor={returnId}>
                {t('settings.location.return')}
              </label>
              <input id={returnId} className="input" type="time" value={loc.returnAt} onChange={(e) => update('location', { returnAt: e.target.value })} />
            </div>
          </div>
        </div>
      </Group>
    </>
  );
}

/* ======================= Notifications ======================= */

const CATEGORY_GLYPHS: Array<{ key: keyof Settings['notifications']['categories']; G: GlyphComp; tone: 'violet' | 'blue' | 'mint' | 'teal' | 'amber' | 'peach' | 'yellow' }> = [
  { key: 'replies', G: ReplyGlyph, tone: 'violet' },
  { key: 'mentions', G: UserGlyph, tone: 'blue' },
  { key: 'events', G: EventsGlyph, tone: 'peach' },
  { key: 'deals', G: DealsGlyph, tone: 'mint' },
  { key: 'groups', G: GroupsGlyph, tone: 'teal' },
  { key: 'reports', G: ReportGlyph, tone: 'amber' },
  { key: 'alerts', G: AlertGlyph, tone: 'yellow' },
];

export function NotificationsSection() {
  const t = useT();
  const { settings, update } = useSettings();
  const n = settings.notifications;
  const fromId = useId();
  const toId = useId();
  const shown = visibleNotifications(settings).length;

  return (
    <>
      <Group title={t('settings.notif.channels')}>
        <SettingToggle G={BellGlyph} tone="amber" title={t('settings.notif.push')} meta="On this phone, even when Nearhood is closed." checked={n.push} onChange={(v) => update('notifications', { push: v })} />
        <SettingToggle
          G={MailGlyph}
          tone="blue"
          title={t('settings.notif.email')}
          meta={
            settings.profile.email ? (
              `To ${settings.profile.email}`
            ) : (
              <>
                <Link to="/settings/account">Add an email</Link> in Account first.
              </>
            )
          }
          checked={n.email && !!settings.profile.email}
          disabled={!settings.profile.email}
          onChange={(v) => update('notifications', { email: v })}
        />
        <SegmentRow
          label={t('settings.notif.digest')}
          value={n.digest}
          onChange={(v) => update('notifications', { digest: v })}
          options={(['off', 'daily', 'weekly'] as const).map((d) => ({ value: d, label: t(`settings.digest.${d}`) }))}
          hint={n.digest === 'off' ? 'No summary emails or notifications.' : `A ${n.digest} round-up of events, alerts and new places near you.`}
        />
      </Group>

      <Group title={t('settings.notif.what')} note={`Updates shows ${shown} of ${NOTIFICATIONS.length} recent notifications with these choices.`}>
        {CATEGORY_GLYPHS.map((c) => (
          <SettingToggle
            key={c.key}
            G={c.G}
            tone={c.tone}
            title={t(`settings.cat.${c.key}`)}
            checked={n.categories[c.key]}
            onChange={(v) => update('notifications', { categories: { ...n.categories, [c.key]: v } })}
          />
        ))}
      </Group>

      <Group
        title={t('settings.notif.quiet')}
        note={settings.alerts.criticalBypassQuiet ? 'Critical city alerts still come through during quiet hours.' : 'Nothing, not even critical alerts, will make a sound during quiet hours.'}
      >
        <SettingToggle G={QuietGlyph} tone="violet" title={t('settings.notif.quiet')} meta="Notifications arrive silently." checked={n.quietHours} onChange={(v) => update('notifications', { quietHours: v })} />
        {n.quietHours ? (
          <div className="list-row set-row--stack">
            <div className="grid-2">
              <div className="field">
                <label className="field__label" htmlFor={fromId}>
                  {t('settings.notif.from')}
                </label>
                <input id={fromId} className="input" type="time" value={n.quietFrom} onChange={(e) => update('notifications', { quietFrom: e.target.value })} />
              </div>
              <div className="field">
                <label className="field__label" htmlFor={toId}>
                  {t('settings.notif.to')}
                </label>
                <input id={toId} className="input" type="time" value={n.quietTo} onChange={(e) => update('notifications', { quietTo: e.target.value })} />
              </div>
            </div>
          </div>
        ) : null}
      </Group>
    </>
  );
}

/* ======================= City alerts ======================= */

const KINDS = Object.keys(ALERT_KIND_META) as AlertKind[];
const SEVERITIES: Severity[] = ['info', 'advisory', 'warning', 'critical'];

export function AlertsSection() {
  const t = useT();
  const { settings, update } = useSettings();
  const { data } = useAppData();
  const a = settings.alerts;
  const active = ALERTS.filter((x) => x.active).length;
  const shown = visibleAlerts(settings, data).length;

  return (
    <>
      <Link to="/city/alerts" className="notice tone-amber glyph-host" style={{ textDecoration: 'none', alignItems: 'center' }}>
        <AlertGlyph size={22} live duo />
        <span className="grow">
          <b>{t('settings.alerts.preview', { n: shown, m: active })}</b>
          <br />
          Changes apply straight away. Open City alerts to check.
        </span>
      </Link>

      <Group title={t('settings.alerts.kinds')}>
        {KINDS.map((k) => (
          <ToggleRow
            key={k}
            glyph={ALERT_KIND_META[k].glyph}
            tone={ALERT_KIND_META[k].tone}
            title={t(`settings.kind.${k}`)}
            checked={a.kinds[k]}
            onChange={(v) => update('alerts', { kinds: { ...a.kinds, [k]: v } })}
          />
        ))}
      </Group>

      <Group title={t('settings.alerts.when')} note="Critical alerts and safety warnings always reach you, whatever you choose here.">
        <SegmentRow
          label={t('settings.alerts.severity')}
          value={a.minSeverity}
          onChange={(v) => update('alerts', { minSeverity: v })}
          options={SEVERITIES.map((s) => ({ value: s, label: t(`settings.sev.${s}`) }))}
          hint={
            a.minSeverity === 'info'
              ? 'Everything, including notices like new pickup timings.'
              : a.minSeverity === 'advisory'
                ? 'Closures, supply changes and anything more serious.'
                : a.minSeverity === 'warning'
                  ? 'Only warnings and critical alerts.'
                  : 'Only critical alerts.'
          }
        />
        <SettingToggle
          G={CommuteGlyph}
          tone="teal"
          title={t('settings.alerts.commuteOnly')}
          meta={settings.location.work ? `Home ${neighbourhoodName(settings.location.home)} ↔ work ${neighbourhoodName(settings.location.work)}` : 'Set a work area in Location to use this.'}
          checked={a.commuteOnly}
          onChange={(v) => update('alerts', { commuteOnly: v })}
        />
        <SettingToggle G={QuietGlyph} tone="violet" title={t('settings.alerts.bypass')} checked={a.criticalBypassQuiet} onChange={(v) => update('alerts', { criticalBypassQuiet: v })} />
        <RangeRow label={t('settings.alerts.radius')} value={a.radiusKm} min={1} max={20} onChange={(v) => update('alerts', { radiusKm: v })} format={(v) => `${v} km`} />
      </Group>
      <p className="meta" style={{ padding: '0 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <DigestGlyph size={16} /> Missed something? Every alert stays in City › Alerts for 7 days.
      </p>
    </>
  );
}
