import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useT } from '../i18n';
import { BackGlyph, ChevronRightGlyph, CloseGlyph, NamedGlyph, type GlyphName } from '../icons';
import type { Tone } from '../data/types';
import { boldParts } from '../lib/format';

/* ---------- Page header with back button ---------- */
export function PageHeader({
  title,
  back = true,
  fallback = '/',
  actions,
  sub,
}: {
  title: ReactNode;
  back?: boolean;
  fallback?: string;
  actions?: ReactNode;
  sub?: ReactNode;
}) {
  const navigate = useNavigate();
  const t = useT();
  return (
    <header className="page-header">
      {back ? (
        <button
          type="button"
          className="icon-btn"
          aria-label={t('common.back')}
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(fallback))}
        >
          <BackGlyph size={20} />
        </button>
      ) : null}
      <div className="grow" style={{ display: 'flex', flexDirection: 'column' }}>
        <h1 className="page-header__title">{title}</h1>
        {sub ? <span className="meta">{sub}</span> : null}
      </div>
      {actions}
    </header>
  );
}

/* ---------- Section heading with optional link ---------- */
export function SectionHead({ title, to, linkLabel, id }: { title: ReactNode; to?: string; linkLabel?: string; id?: string }) {
  const t = useT();
  return (
    <div className="section__head">
      <h2 className="section__title" id={id}>
        {title}
      </h2>
      {to ? (
        <Link to={to} className="section__link">
          {linkLabel ?? t('common.seeAll')}
        </Link>
      ) : null}
    </div>
  );
}

/* ---------- Glyph tile ---------- */
export function Tile({
  glyph,
  tone = 'violet',
  size = 'md',
  live,
  round,
}: {
  glyph: GlyphName;
  tone?: Tone;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  live?: boolean;
  round?: boolean;
}) {
  const px = size === 'sm' ? 18 : size === 'md' ? 20 : size === 'lg' ? 24 : 32;
  const cls = ['tile', `tone-${tone}`, size === 'lg' ? 'tile--lg' : size === 'xl' ? 'tile--xl' : '', round ? 'tile--round' : ''].join(' ');
  return (
    <span className={cls} style={size === 'sm' ? { width: 32, height: 32, borderRadius: 10 } : undefined}>
      <NamedGlyph name={glyph} size={px} duo live={live} />
    </span>
  );
}

/* ---------- Switch ---------- */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="switch"
      disabled={disabled}
      onClick={() => onChange(!checked)}
    />
  );
}

/* ---------- Segmented control ---------- */
export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: Array<{ value: T; label: ReactNode }>;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.value)} type="button" role="radio" aria-checked={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Bottom sheet ---------- */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  const t = useT();
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  // Portalled to <body> so no page-level stacking context can trap it under the tab bar.
  return createPortal(
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        ref={panel}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="sheet__grip" aria-hidden="true" />
        <div className="row row--between">
          <h2 className="sheet__title">{title}</h2>
          <button type="button" className="icon-btn icon-btn--ghost" aria-label={t('common.close')} onClick={onClose}>
            <CloseGlyph size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

/* ---------- Empty state ---------- */
export function EmptyState({ glyph, title, body, action }: { glyph: GlyphName; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <Tile glyph={glyph} tone="violet" size="lg" live />
      <h2 className="empty__title">{title}</h2>
      {body ? <p className="body-sm muted">{body}</p> : null}
      {action}
    </div>
  );
}

/* ---------- Rich text with **bold** ---------- */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {boldParts(text).map((p, i) => (p.bold ? <b key={i}>{p.text}</b> : <span key={i}>{p.text}</span>))}
    </>
  );
}

/* ---------- Setting-style rows (used by Me, City and Settings) ---------- */
export function LinkRow({
  to,
  glyph,
  tone = 'violet',
  title,
  meta,
  trail,
}: {
  to: string;
  glyph?: GlyphName;
  tone?: Tone;
  title: ReactNode;
  meta?: ReactNode;
  trail?: ReactNode;
}) {
  return (
    <Link to={to} className="list-row glyph-host">
      {glyph ? <Tile glyph={glyph} tone={tone} size="sm" /> : null}
      <span className="list-row__body">
        <span className="list-row__title">{title}</span>
        {meta ? <span className="list-row__meta">{meta}</span> : null}
      </span>
      <span className="list-row__trail">
        {trail}
        <ChevronRightGlyph size={16} />
      </span>
    </Link>
  );
}

export function ToggleRow({
  glyph,
  tone = 'violet',
  title,
  meta,
  checked,
  onChange,
  disabled,
}: {
  glyph?: GlyphName;
  tone?: Tone;
  title: string;
  meta?: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="list-row">
      {glyph ? <Tile glyph={glyph} tone={tone} size="sm" /> : null}
      <span className="list-row__body">
        <span className="list-row__title">{title}</span>
        {meta ? <span className="list-row__meta">{meta}</span> : null}
      </span>
      <Switch checked={checked} onChange={onChange} label={title} disabled={disabled} />
    </div>
  );
}
