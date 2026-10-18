import { Link } from 'react-router-dom';
import { identityOf, isFullyVerified, myIdentity, workLine, type Identity } from '../data/identity';
import { CheckGlyph, ChevronRightGlyph, HomePinGlyph, PhoneGlyph, ShieldGlyph, UsersGlyph, WorkGlyph } from '../icons';
import { useSettings } from '../state/settings';
import { Sheet } from './ui';

/** Identity for anyone, with your own taken from Settings so edits show at once. */
export function useIdentity(id: string): Identity {
  const { settings } = useSettings();
  return id === 'me' ? myIdentity(settings.profile) : identityOf(id);
}

/** "Paediatrician at [Hospital name] ✓" */
export function WorkLine({ identity }: { identity: Identity }) {
  const line = workLine(identity);
  if (!line) return null;
  const proof = identity.work?.proof;
  return (
    <span className="id-work">
      <WorkGlyph size={15} />
      <span className="grow">{line}</span>
      {proof ? (
        <span className="id-tick" title={`Confirmed with a ${proof}`} aria-label={`Confirmed with a ${proof}`}>
          <CheckGlyph size={10} />
        </span>
      ) : null}
    </span>
  );
}

/** One quiet line that sums up the checks; opens the details. */
export function TrustLine({ identity, area, onOpen }: { identity: Identity; area: string; onOpen: () => void }) {
  const c = identity.checks;
  const parts = [c.govId ? 'ID' : null, c.phone ? 'Phone' : null, c.address ? `Lives in ${area}` : null].filter(Boolean);
  const full = isFullyVerified(identity);
  return (
    <button type="button" className={`id-trust${full ? ' is-full' : ''}`} onClick={onOpen} aria-haspopup="dialog">
      <ShieldGlyph size={15} />
      <span className="grow">
        {full ? 'Verified' : 'Partly verified'} · {parts.join(' · ')}
        {identity.vouches ? ` · ${identity.vouches} vouches` : ''}
      </span>
      <ChevronRightGlyph size={14} />
    </button>
  );
}

export function AskMeAbout({ identity }: { identity: Identity }) {
  if (!identity.askMeAbout?.length) return null;
  return (
    <div className="id-ask">
      <span className="id-ask__label">Ask me about</span>
      {identity.askMeAbout.map((topic) => (
        <Link key={topic} to={`/ask?q=${encodeURIComponent(topic)}`} className="id-ask__chip">
          {topic}
        </Link>
      ))}
    </div>
  );
}

/** What has been checked for this person, and how Nearhood checks people. */
export function IdentitySheet({ open, onClose, name, identity, area, mine }: { open: boolean; onClose: () => void; name: string; identity: Identity; area: string; mine?: boolean }) {
  const w = identity.work;
  const rows = [
    { G: PhoneGlyph, title: 'Phone number', done: identity.checks.phone, how: 'One-time code to an Indian mobile number.' },
    { G: ShieldGlyph, title: 'Government ID', done: identity.checks.govId, how: 'Name and photo matched once through DigiLocker. Nearhood keeps only the result, never the number.' },
    { G: HomePinGlyph, title: `Lives in ${area}`, done: identity.checks.address, how: 'Confirmed by a utility bill or two neighbours who already live there.' },
    {
      G: WorkGlyph,
      title: w ? workLine(identity)! : 'Work',
      done: !!w?.proof,
      how: w?.proof ? `Confirmed with a ${w.proof}.` : w ? 'Added by them, not confirmed yet.' : 'Not added.',
    },
    { G: UsersGlyph, title: `${identity.vouches} neighbours vouched`, done: identity.vouches >= 3, how: 'People who know them in person said they’re real.' },
  ];
  return (
    <Sheet open={open} onClose={onClose} title={mine ? 'Your identity' : `About ${name.split(' ')[0]}`}>
      <div className="list">
        {rows.map((r) => (
          <div key={r.title} className="list-row id-row">
            <span className="id-row__icon">
              <r.G size={18} />
            </span>
            <span className="list-row__body">
              <span className="list-row__title">{r.title}</span>
              <span className="list-row__meta">{r.how}</span>
            </span>
            <span className={`id-row__state${r.done ? ' is-done' : ''}`}>{r.done ? <CheckGlyph size={14} /> : '—'}</span>
          </div>
        ))}
      </div>
      <p className="meta">Only verified residents can post, review and run clubs. Checks happen once and are never shown in full.</p>
      {mine ? (
        <Link to="/settings/identity" className="btn btn--soft btn--block" onClick={onClose}>
          Edit identity and work
        </Link>
      ) : null}
    </Sheet>
  );
}
