import { useId, useState, type FormEvent } from 'react';
import { AskMeAbout, IdentitySheet, TrustLine, WorkLine } from '../../components/identity';
import { Sheet } from '../../components/ui';
import { neighbourhoodName } from '../../data/core';
import { myIdentity, type WorkProof } from '../../data/identity';
import { CheckGlyph, HomePinGlyph, PhoneGlyph, ShieldGlyph, UsersGlyph } from '../../icons';
import { useSettings } from '../../state/settings';
import { useToast } from '../../state/toast';
import { Group, GlyphTile, SectionIntro, SegmentRow, StackRow } from './parts';

const PROOFS: Array<{ value: '' | WorkProof; label: string }> = [
  { value: 'work email', label: 'Work email' },
  { value: 'professional licence', label: 'Licence' },
  { value: 'LinkedIn', label: 'LinkedIn' },
  { value: '', label: 'Not now' },
];

/** Settings › Identity & work: the checks behind "Verified" and what you do. */
export function IdentitySection() {
  const toast = useToast();
  const { settings, update } = useSettings();
  const profile = settings.profile;
  const area = neighbourhoodName(settings.location.home);
  const identity = myIdentity(profile);
  const [work, setWork] = useState(profile.work);
  const [topics, setTopics] = useState(profile.askMeAbout.join(', '));
  const [idSheet, setIdSheet] = useState(false);
  const [preview, setPreview] = useState(false);
  const ids = { title: useId(), org: useId(), topics: useId() };

  const saveWork = (e: FormEvent) => {
    e.preventDefault();
    const askMeAbout = topics
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 5);
    update('profile', { work: { title: work.title.trim(), org: work.org.trim(), proof: work.title.trim() ? work.proof : '' }, askMeAbout });
    toast(work.proof && work.title.trim() ? `Saved. We’ll confirm it with your ${work.proof}.` : 'Saved');
  };

  const checks = [
    { G: PhoneGlyph, title: 'Phone number', done: identity.checks.phone, meta: 'Confirmed with a one-time code' },
    { G: ShieldGlyph, title: 'Government ID', done: identity.checks.govId, meta: identity.checks.govId ? 'Matched once through DigiLocker' : 'Takes about a minute through DigiLocker' },
    { G: HomePinGlyph, title: `Lives in ${area}`, done: identity.checks.address, meta: identity.checks.address ? 'Verified resident' : 'Confirm with a utility bill or two neighbours' },
    { G: UsersGlyph, title: `${identity.vouches} neighbours vouched`, done: identity.vouches >= 3, meta: 'People who know you in person' },
  ];

  return (
    <>
      <SectionIntro
        G={ShieldGlyph}
        title="Real people, real names"
        body="People trust what you share when they know who you are. Each check happens once; Nearhood keeps the result, never your documents."
      />

      <Group title="How you appear">
        <div className="list-row set-row--stack">
          <span className="list-row__title">{profile.name}</span>
          <WorkLine identity={identity} />
          <TrustLine identity={identity} area={area} onOpen={() => setPreview(true)} />
          <AskMeAbout identity={identity} />
        </div>
      </Group>
      <IdentitySheet open={preview} onClose={() => setPreview(false)} name={profile.name} identity={identity} area={area} />

      <Group title="Checks">
        {checks.map((c) => (
          <div key={c.title} className="list-row">
            <GlyphTile G={c.G} />
            <span className="list-row__body">
              <span className="list-row__title">{c.title}</span>
              <span className="list-row__meta">{c.meta}</span>
            </span>
            {c.done ? (
              <span className="id-row__state is-done" aria-label="Done">
                <CheckGlyph size={14} />
              </span>
            ) : c.title === 'Government ID' ? (
              <button type="button" className="btn btn--sm btn--soft" onClick={() => setIdSheet(true)}>
                Verify
              </button>
            ) : (
              <span className="list-row__meta">Not yet</span>
            )}
          </div>
        ))}
      </Group>

      <form onSubmit={saveWork} className="stack" style={{ gap: 14 }}>
        <Group title="Work" note="Shown on your profile and next to your posts, so people know when an answer comes from a doctor, a lawyer or a teacher.">
          <StackRow label="What you do" htmlFor={ids.title}>
            <input id={ids.title} className="input" value={work.title} onChange={(e) => setWork((w) => ({ ...w, title: e.target.value }))} placeholder="Paediatrician, architect, founder…" maxLength={40} />
          </StackRow>
          <StackRow label="Where" hint="Optional" htmlFor={ids.org}>
            <input id={ids.org} className="input" value={work.org} onChange={(e) => setWork((w) => ({ ...w, org: e.target.value }))} placeholder="Company, hospital or practice" maxLength={40} />
          </StackRow>
          <SegmentRow label="Confirm it with" value={work.proof} options={PROOFS} onChange={(proof) => setWork((w) => ({ ...w, proof }))} hint="Confirmed work shows a small tick." />
        </Group>
        <Group title="Ask me about" note="Up to five topics, separated by commas. People can tap them to ask you.">
          <StackRow label="Topics" htmlFor={ids.topics}>
            <input id={ids.topics} className="input" value={topics} onChange={(e) => setTopics(e.target.value)} placeholder="Cycling routes, quiet cafés" maxLength={120} />
          </StackRow>
        </Group>
        <button type="submit" className="btn btn--primary btn--block">
          Save
        </button>
      </form>

      <Sheet open={idSheet} onClose={() => setIdSheet(false)} title="Verify your ID">
        <p className="body-sm">
          You’ll continue to DigiLocker, sign in there and share your name and photo once. Nearhood doesn’t see or store your ID number.
        </p>
        <button
          type="button"
          className="btn btn--primary btn--block"
          onClick={() => {
            update('profile', { idVerified: true });
            setIdSheet(false);
            toast('ID verified');
          }}
        >
          Continue to DigiLocker
        </button>
      </Sheet>
    </>
  );
}
