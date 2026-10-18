import { useId, type ComponentType, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Segmented, Switch } from '../../components/ui';
import type { Tone } from '../../data/types';
import { ChevronRightGlyph, type GlyphProps } from '../../icons';

/* Small building blocks shared by Me, Onboarding and every Settings section. */

export type GlyphComp = ComponentType<GlyphProps>;

/** Outline glyph on a soft tinted square, as on Home and Explore. */
export function GlyphTile({ G, tone = 'violet', live, size = 36 }: { G: GlyphComp; tone?: Tone; live?: boolean; size?: number }) {
  return (
    <span className={`tile set-tile tone-${tone}`} style={{ width: size, height: size, borderRadius: Math.round(size * 0.34) }}>
      <G size={Math.round(size * 0.56)} live={live} />
    </span>
  );
}

/** A titled group of rows inside one rounded list. */
export function Group({ title, note, children, id }: { title?: ReactNode; note?: ReactNode; children: ReactNode; id?: string }) {
  const auto = useId();
  const headingId = id ?? `grp-${auto.replace(/:/g, '')}`;
  return (
    <section className="set-group" aria-labelledby={title ? headingId : undefined}>
      {title ? (
        <h2 className="set-group__title" id={headingId}>
          {title}
        </h2>
      ) : null}
      <div className="list">{children}</div>
      {note ? <p className="set-group__note">{note}</p> : null}
    </section>
  );
}

export function SettingLink({
  to,
  G,
  tone = 'violet',
  title,
  meta,
  trail,
  onClick,
}: {
  to: string;
  G?: GlyphComp;
  tone?: Tone;
  title: ReactNode;
  meta?: ReactNode;
  trail?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link to={to} className="list-row glyph-host" onClick={onClick}>
      {G ? <GlyphTile G={G} tone={tone} /> : null}
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

export function SettingToggle({
  G,
  tone = 'violet',
  title,
  meta,
  checked,
  onChange,
  disabled,
}: {
  G?: GlyphComp;
  tone?: Tone;
  title: string;
  meta?: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className={`list-row${disabled ? ' set-row--disabled' : ''}`}>
      {G ? <GlyphTile G={G} tone={tone} /> : null}
      <span className="list-row__body">
        <label className="list-row__title" htmlFor={id}>
          {title}
        </label>
        {meta ? <span className="list-row__meta">{meta}</span> : null}
      </span>
      <Switch id={id} checked={checked} onChange={onChange} label={title} disabled={disabled} />
    </div>
  );
}

/** A row whose control sits under its label (segmented choices, ranges, inputs). */
export function StackRow({ label, hint, children, htmlFor }: { label: ReactNode; hint?: ReactNode; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="list-row set-row--stack">
      <div className="row row--between" style={{ gap: 12 }}>
        {htmlFor ? (
          <label className="list-row__title" htmlFor={htmlFor}>
            {label}
          </label>
        ) : (
          <span className="list-row__title">{label}</span>
        )}
        {hint ? <span className="list-row__meta">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

export function SegmentRow<T extends string | number>({
  label,
  value,
  options,
  onChange,
  hint,
  disabled,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: ReactNode }>;
  onChange: (v: T) => void;
  hint?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className={`list-row set-row--stack${disabled ? ' set-row--disabled' : ''}`} aria-disabled={disabled || undefined}>
      <span className="list-row__title">{label}</span>
      <fieldset disabled={disabled} className="set-fieldset">
        <Segmented label={label} value={value} options={options} onChange={onChange} />
      </fieldset>
      {hint ? <span className="list-row__meta">{hint}</span> : null}
    </div>
  );
}

export function RangeRow({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  const id = useId();
  return (
    <StackRow label={label} htmlFor={id} hint={<output htmlFor={id} className="set-output">{format(value)}</output>}>
      <input
        id={id}
        className="range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={format(value)}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="row row--between meta" aria-hidden="true">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </StackRow>
  );
}

export function SelectRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  onChange: (v: string) => void;
}) {
  const id = useId();
  return (
    <StackRow label={label} htmlFor={id}>
      <select id={id} className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
    </StackRow>
  );
}

/** Radio-style tiles with a glyph each (commute mode, theme…). */
export function ChoiceTiles<T extends string>({
  label,
  value,
  options,
  onChange,
  columns = 3,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string; G: GlyphComp }>;
  onChange: (v: T) => void;
  columns?: number;
}) {
  return (
    <div className="choice-grid" role="radiogroup" aria-label={label} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={on} className="choice-tile glyph-host" onClick={() => onChange(o.value)}>
            <o.G size={22} active={on} duo />
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function SectionIntro({ G, tone = 'violet', title, body }: { G: GlyphComp; tone?: Tone; title: ReactNode; body: ReactNode }) {
  return (
    <div className="set-intro">
      <GlyphTile G={G} tone={tone} size={44} live />
      <div className="stack" style={{ gap: 2 }}>
        <span className="strong">{title}</span>
        <span className="body-sm muted">{body}</span>
      </div>
    </div>
  );
}
