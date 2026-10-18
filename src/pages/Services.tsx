import { useState } from 'react';
import { PageHeader, SectionHead, Sheet, Tile } from '../components/ui';
import { SERVICES } from '../data/city';
import type { CityService } from '../data/types';
import { useT } from '../i18n';
import { ChevronRightGlyph, ExternalGlyph, ShieldGlyph } from '../icons';
import { rupees } from '../lib/format';
import { useToast } from '../state/toast';

const GROUPS: Array<{ id: CityService['group']; key: string; action: string }> = [
  { id: 'Pay', key: 'city.pay', action: 'Pay' },
  { id: 'Apply', key: 'city.apply', action: 'Apply' },
  { id: 'Book', key: 'city.book', action: 'Book' },
  { id: 'Know', key: 'city.know', action: 'Open' },
];

export default function Services() {
  const t = useT();
  const toast = useToast();
  const [open, setOpen] = useState<CityService | null>(null);
  const due = SERVICES.filter((s) => s.due && s.amount);
  const total = due.reduce((sum, s) => sum + (s.amount ?? 0), 0);
  const action = open ? (GROUPS.find((g) => g.id === open.group)?.action ?? 'Open') : 'Open';

  return (
    <>
      <PageHeader title={t('city.services')} fallback="/city" />
      <main className="page page--with-header">
        <div className="notice tone-mint">
          <ShieldGlyph size={20} />
          <span>
            <b>Nearhood never asks for card details or OTPs.</b> Payments and applications open on the provider's official site or app.
          </span>
        </div>

        {due.length ? (
          <section className="card card--accent stack" aria-labelledby="bills-due" style={{ gap: 10 }}>
            <div className="row row--between">
              <h2 id="bills-due" className="section__title">
                {t('city.bills')}
              </h2>
              <span className="num" style={{ fontSize: '1.125rem' }}>
                {rupees(total)}
              </span>
            </div>
            {due.map((s) => (
              <button key={s.id} type="button" className="row services-due glyph-host" onClick={() => setOpen(s)}>
                <Tile glyph={s.glyph} tone={s.tone} size="sm" />
                <span className="stack grow" style={{ gap: 1, textAlign: 'left' }}>
                  <span className="strong" style={{ fontSize: '0.9375rem' }}>
                    {s.name}
                  </span>
                  <span className="meta">{s.provider}</span>
                </span>
                <span className="stack" style={{ gap: 1, alignItems: 'flex-end' }}>
                  <span className="strong">{rupees(s.amount ?? 0)}</span>
                  <span className={`badge badge--sm ${/\b[0-9]\b days/.test(s.due ?? '') ? 'tone-amber' : ''}`}>{s.due}</span>
                </span>
              </button>
            ))}
          </section>
        ) : null}

        {GROUPS.map((g) => (
          <section key={g.id} className="section" aria-labelledby={`svc-${g.id}`}>
            <SectionHead id={`svc-${g.id}`} title={t(g.key)} />
            <div className="list">
              {SERVICES.filter((s) => s.group === g.id).map((s) => (
                <button key={s.id} type="button" className="list-row glyph-host" onClick={() => setOpen(s)}>
                  <Tile glyph={s.glyph} tone={s.tone} size="sm" />
                  <span className="list-row__body">
                    <span className="list-row__title">{s.name}</span>
                    <span className="list-row__meta">
                      {s.provider} · {s.description}
                    </span>
                  </span>
                  <span className="list-row__trail">
                    {s.amount ? <span className="strong" style={{ color: 'var(--ink)' }}>{rupees(s.amount)}</span> : null}
                    <ChevronRightGlyph size={16} />
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </main>

      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.name ?? ''}>
        {open ? (
          <>
            <div className="row" style={{ gap: 12 }}>
              <Tile glyph={open.glyph} tone={open.tone} size="lg" />
              <span className="stack" style={{ gap: 2 }}>
                <span className="strong">{open.provider}</span>
                <span className="meta">{open.description}</span>
              </span>
            </div>
            {open.amount ? (
              <dl className="kv">
                <dt>Amount</dt>
                <dd>{rupees(open.amount)}</dd>
                {open.due ? (
                  <>
                    <dt>Due</dt>
                    <dd>{open.due}</dd>
                  </>
                ) : null}
              </dl>
            ) : null}
            <div className="notice">
              <ExternalGlyph size={18} />
              <span>
                {action === 'Pay' ? 'Payment' : 'This'} continues on the official website or app of the {open.provider.toLowerCase()}. Nearhood does not take payments or ask for card details or OTPs.
              </span>
            </div>
            <button type="button" className="btn btn--primary btn--block" disabled aria-describedby="official-link-note">
              {action} on [Official link]
            </button>
            <span id="official-link-note" className="meta" style={{ textAlign: 'center' }}>
              The official link is added when this service is connected.
            </span>
            {open.due ? (
              <button
                type="button"
                className="btn btn--soft btn--block"
                onClick={() => {
                  toast(`We'll remind you 2 days before ${open.name.toLowerCase()} is due`);
                  setOpen(null);
                }}
              >
                Remind me before it's due
              </button>
            ) : null}
          </>
        ) : null}
      </Sheet>
    </>
  );
}
