import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { placePhoto } from '../assets/photos';
import { Avatar } from '../components/cards';
import { OwnerReplyView, PageHistorySheet } from '../components/discover';
import { EmptyState, PageHeader, Sheet } from '../components/ui';
import { person } from '../data/core';
import { OWNER_CANNOT, PAGE_WEEK, shrinkPhoto, UPDATES_PER_WEEK, type PageEdit } from '../data/pages';
import { placeById } from '../data/places';
import type { CheckIn } from '../data/types';
import { ChevronRightGlyph, ClockGlyph, CloseGlyph, EditGlyph, FlagGlyph, ImageGlyph, InfoGlyph, PhoneGlyph, PinGlyph, ShieldGlyph, TrashGlyph } from '../icons';
import { placeCommunity, VERDICT_LABEL } from '../lib/friends';
import { ownerReplyFor, pageUpdates, runsPage, updatesThisWeek, withOwnerEdits } from '../lib/places';
import { useAppData } from '../state/appData';
import { useSettings } from '../state/settings';
import { useToast } from '../state/toast';

type Field = 'hours' | 'phone' | 'address' | 'offers' | 'cover';

const FIELD_LABEL: Record<Field, string> = {
  hours: 'Hours',
  phone: 'Phone',
  address: 'Address',
  offers: 'What you offer',
  cover: 'Cover photo',
};

const REPORT_REASONS = ['Not a real visit', 'Abuse or personal attack', 'Not about this page', 'Shares someone’s private details'];

/**
 * What the person who runs a page can do: keep the facts right, post a few updates,
 * reply once to a check-in. Verdicts, reviews and rankings stay with locals.
 */
export default function PageManage() {
  const { id = '' } = useParams();
  const found = placeById(id);

  if (!found || !runsPage(found)) {
    return (
      <>
        <PageHeader title="Manage page" fallback={found ? `/place/${found.id}` : '/explore'} />
        <main className="page page--with-header">
          <EmptyState
            glyph="pin"
            title="Only the person who runs this page can manage it"
            body={
              found?.origin.publicPlace
                ? 'This is a public place. Locals and Nearhood guides keep it right, and nobody can claim it.'
                : 'If you run it, claim it first. We check a licence in its name and call the venue’s phone.'
            }
            action={
              found && !found.origin.publicPlace ? (
                <Link to={`/claim/${found.id}`} className="btn btn--primary btn--sm">
                  Claim {found.name}
                </Link>
              ) : (
                <Link to={found ? `/place/${found.id}` : '/explore'} className="btn btn--soft btn--sm">
                  Back to the page
                </Link>
              )
            }
          />
        </main>
      </>
    );
  }
  return <Manage key={found.id} placeId={found.id} />;
}

function Manage({ placeId }: { placeId: string }) {
  const toast = useToast();
  const { settings } = useSettings();
  const { data, editPage, addPageUpdate, removePageUpdate, replyToCheckIn } = useAppData();
  const [params, setParams] = useSearchParams();
  const base = placeById(placeId)!;
  const edit = data.pageEdits[placeId];
  const place = withOwnerEdits(base, edit);
  const claimed = place.origin.claimed!;
  const community = placeCommunity(place.id, data, settings);
  const week = PAGE_WEEK[place.id] ?? { saves: 0, checkIns: 0 };
  const updates = pageUpdates(place, data).filter((u) => u.byId === 'me');
  const usedThisWeek = updatesThisWeek(place, data);
  const checkIns = community.reviews.filter((c) => c.authorId !== 'me');

  const [field, setField] = useState<Field | null>(null);
  const [draft, setDraft] = useState('');
  const [text, setText] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [replyText, setReplyText] = useState('');
  const [reportFor, setReportFor] = useState<CheckIn | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [stopOpen, setStopOpen] = useState(false);
  const replyingTo = checkIns.find((c) => c.id === params.get('reply'));

  const current = (f: Field) =>
    f === 'hours' ? place.hours : f === 'address' ? place.address : f === 'phone' ? (edit?.phone ?? '') : f === 'offers' ? (edit?.offers ?? []).join(', ') : '';

  const openField = (f: Field) => {
    setDraft(current(f));
    setField(f);
  };

  /** Save one fact, stamp it as changed by the owner and add it to the public history. */
  const save = (patch: PageEdit, change: string) => {
    editPage(place.id, { ...patch, editedAt: 'Today', log: [{ what: change, when: 'Today' }, ...(edit?.log ?? [])] });
    setField(null);
    toast('Updated. Locals see it was the owner, and can flag it if it’s wrong.');
  };

  const saveText = (e: FormEvent) => {
    e.preventDefault();
    if (!field || field === 'cover') return;
    const value = draft.trim();
    const before = current(field);
    if (value === before) {
      setField(null);
      return;
    }
    if (field === 'offers') {
      const offers = value
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
        .slice(0, 8);
      save({ offers }, `what they offer: ${offers.join(', ') || 'cleared'}`);
      return;
    }
    if (!value && field !== 'phone') return;
    save({ [field]: value || undefined }, `${FIELD_LABEL[field].toLowerCase()}: ${before || 'none'} → ${value || 'removed'}`);
  };

  const pickCover = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const cover = await shrinkPhoto(file, 960);
      save({ cover }, 'the cover photo');
    } catch {
      toast('Could not read that photo');
    }
  };

  const postUpdate = (e: FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || usedThisWeek >= UPDATES_PER_WEEK) return;
    const url = linkUrl.trim();
    const link = url && /^https?:\/\//i.test(url) ? { label: linkLabel.trim() || 'Read more', url } : undefined;
    addPageUpdate({ id: `pu-me-${Date.now()}`, placeId: place.id, by: `${settings.profile.name}, ${claimed.role.toLowerCase()}`, byId: 'me', ago: 'Today', text: body, link });
    setText('');
    setLinkLabel('');
    setLinkUrl('');
    toast('Posted on your page. People who saved it will see it.');
  };

  const closeReply = () => {
    setReplyText('');
    params.delete('reply');
    setParams(params, { replace: true });
  };

  const sendReply = (e: FormEvent) => {
    e.preventDefault();
    const body = replyText.trim();
    if (!body || !replyingTo) return;
    replyToCheckIn(replyingTo.id, body);
    closeReply();
    toast('Reply posted. Everyone can see it under the check-in.');
  };

  const facts: Array<{ f: Field; G: typeof ClockGlyph; value: string }> = [
    { f: 'hours', G: ClockGlyph, value: place.hours },
    { f: 'phone', G: PhoneGlyph, value: edit?.phone ?? 'Not added' },
    { f: 'address', G: PinGlyph, value: place.address },
    { f: 'offers', G: InfoGlyph, value: edit?.offers?.length ? edit.offers.join(', ') : 'Menu, classes, court timings…' },
    { f: 'cover', G: ImageGlyph, value: edit?.cover ? 'Your photo' : 'A photo locals took' },
  ];

  return (
    <>
      <PageHeader title="Manage page" sub={place.name} fallback={`/place/${place.id}`} />
      <main className="page page--with-header manage">
        <header className="manage-head">
          <img className="manage-head__photo" src={edit?.cover ?? placePhoto(place.id)} alt="" />
          <span className="manage-head__body">
            <span className="manage-head__name">{place.name}</span>
            <span className="meta">
              {place.kind} · {place.area}
            </span>
            <span className="manage-head__role">
              <ShieldGlyph size={12} />
              You run this page · {claimed.role} since {claimed.since}
            </span>
          </span>
          <Link to={`/place/${place.id}`} className="btn btn--soft btn--sm">
            View page
          </Link>
        </header>

        <section className="dsec" aria-labelledby="m-week">
          <h2 className="section__title" id="m-week">
            This week
          </h2>
          <dl className="manage-stats">
            <div>
              <dt>Saves</dt>
              <dd className="num">{week.saves}</dd>
            </div>
            <div>
              <dt>Check-ins</dt>
              <dd className="num">{week.checkIns}</dd>
            </div>
            <div>
              <dt>Must try</dt>
              <dd className="num">{community.total ? `${community.mustPct}%` : '–'}</dd>
            </div>
          </dl>
          <p className="meta" style={{ margin: 0 }}>
            We never show who saved or checked in. Must try comes only from locals’ verified visits.
          </p>
        </section>

        <section className="dsec" aria-labelledby="m-facts">
          <div className="dsec__head">
            <h2 className="section__title" id="m-facts">
              Facts
            </h2>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setHistoryOpen(true)}>
              Page history
            </button>
          </div>
          <div className="list">
            {facts.map(({ f, G, value }) => (
              <button key={f} type="button" className="list-row manage-fact" onClick={() => openField(f)}>
                <span className="manage-fact__icon">
                  <G size={16} />
                </span>
                <span className="list-row__body">
                  <span className="list-row__title">{FIELD_LABEL[f]}</span>
                  <span className="list-row__meta">{value}</span>
                </span>
                <EditGlyph size={15} />
              </button>
            ))}
          </div>
          <p className="meta" style={{ margin: 0 }}>
            Changes show at once, marked “Updated by the owner”, and go into the page’s public history. If locals say a fact is wrong, a guide checks it.
          </p>
        </section>

        <section className="dsec" aria-labelledby="m-update">
          <div className="dsec__head">
            <h2 className="section__title" id="m-update">
              Post an update
            </h2>
            <span className="meta">
              {usedThisWeek} of {UPDATES_PER_WEEK} this week
            </span>
          </div>
          {usedThisWeek >= UPDATES_PER_WEEK ? (
            <p className="body-sm muted" style={{ margin: 0 }}>
              That’s this week’s two. Updates stay few so they’re worth reading; you can post again next week.
            </p>
          ) : (
            <form className="stack manage-update" style={{ gap: 8 }} onSubmit={postUpdate}>
              <label htmlFor="m-text" className="sr-only">
                Update
              </label>
              <textarea
                id="m-text"
                className="textarea"
                rows={3}
                maxLength={280}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="New timings, a seasonal menu, a class this weekend…"
              />
              <div className="manage-update__link">
                <input className="input" value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} placeholder="Link label (optional)" maxLength={40} aria-label="Link label" />
                <input className="input" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://…" inputMode="url" aria-label="Link address" />
              </div>
              <button type="submit" className="btn btn--primary btn--sm" disabled={!text.trim()} style={{ alignSelf: 'flex-start' }}>
                Post on the page
              </button>
            </form>
          )}
          <p className="meta" style={{ margin: 0 }}>
            Updates show under “From the page” and reach people who saved it. They never appear in the Home feed, and they’re never ads. Booking or buying happens on your own link.
          </p>
          {updates.length ? (
            <div className="list">
              {updates.map((u) => {
                const posted = data.myPageUpdates.some((m) => m.id === u.id);
                return (
                  <div key={u.id} className="list-row manage-post">
                    <span className="list-row__body">
                      <span className="manage-post__text">{u.text}</span>
                      <span className="list-row__meta">
                        {u.ago}
                        {u.link ? ` · ${u.link.label}` : ''}
                      </span>
                    </span>
                    {posted ? (
                      <button
                        type="button"
                        className="icon-btn icon-btn--ghost"
                        aria-label="Delete update"
                        onClick={() => {
                          removePageUpdate(u.id);
                          toast('Update deleted');
                        }}
                      >
                        <TrashGlyph size={16} />
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
        </section>

        <section className="dsec" aria-labelledby="m-checkins">
          <h2 className="section__title" id="m-checkins">
            Check-ins
          </h2>
          <p className="meta" style={{ margin: 0 }}>
            You can reply once, in public, to each check-in. You can’t hide, edit or remove any of them.
          </p>
          {checkIns.length === 0 ? (
            <p className="body-sm muted">No check-ins yet.</p>
          ) : (
            <div className="list">
              {checkIns.map((c) => {
                const who = person(c.authorId);
                const reply = ownerReplyFor(c.id, place.id, data);
                return (
                  <div key={c.id} className="manage-checkin">
                    <div className="manage-checkin__head">
                      <Avatar who={who} size={30} />
                      <span className="list-row__body">
                        <span className="list-row__title">
                          {who.name} · <span className={`manage-verdict manage-verdict--${c.verdict}`}>{VERDICT_LABEL[c.verdict]}</span>
                        </span>
                        <span className="list-row__meta">
                          {c.items.join(', ')} · {c.ago}
                          {c.invited ? ' · invited, not counted' : ''}
                        </span>
                      </span>
                    </div>
                    {c.note ? <p className="manage-checkin__note">{c.note}</p> : null}
                    {reply ? (
                      <OwnerReplyView reply={reply} place={place} />
                    ) : (
                      <div className="manage-checkin__actions">
                        <button
                          type="button"
                          className="btn btn--soft btn--sm"
                          onClick={() => {
                            params.set('reply', c.id);
                            setParams(params, { replace: true });
                          }}
                        >
                          Reply
                        </button>
                        <button type="button" className="manage-report" onClick={() => setReportFor(c)}>
                          <FlagGlyph size={13} />
                          Report to guides
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="dsec" aria-labelledby="m-rules">
          <h2 className="section__title" id="m-rules">
            What you can’t do
          </h2>
          <ul className="fact-list fact-list--quiet fact-list--never">
            {[...OWNER_CANNOT, 'Your own check-ins, verdicts and votes on this page don’t count', 'Staff can be added later; each must be a verified member'].map((r) => (
              <li key={r}>
                <CloseGlyph size={15} />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="dsec">
          <button type="button" className="list-row manage-stop" onClick={() => setStopOpen(true)}>
            <span className="list-row__body">
              <span className="list-row__title">Stop running this page</span>
              <span className="list-row__meta">The page stays; locals keep it going.</span>
            </span>
            <ChevronRightGlyph size={16} />
          </button>
        </section>
      </main>

      <Sheet open={!!field && field !== 'cover'} onClose={() => setField(null)} title={field ? `Edit ${FIELD_LABEL[field].toLowerCase()}` : ''}>
        <form className="stack" style={{ gap: 10 }} onSubmit={saveText}>
          <label htmlFor="m-field" className="field__label">
            {field ? FIELD_LABEL[field] : ''}
          </label>
          <input
            id="m-field"
            className="input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={field === 'offers' ? 200 : 80}
            inputMode={field === 'phone' ? 'tel' : undefined}
            placeholder={field === 'hours' ? '7 am – 11 pm' : field === 'phone' ? '+91 …' : field === 'offers' ? 'Pour-overs, Cold brew, Banana bread' : ''}
            autoFocus
          />
          {field === 'offers' ? <p className="meta" style={{ margin: 0 }}>Separate with commas. Up to eight.</p> : null}
          <p className="meta" style={{ margin: 0 }}>
            The change shows on the page as made by the owner, and joins the page’s public history.
          </p>
          <button type="submit" className="btn btn--primary btn--block">
            Save
          </button>
        </form>
      </Sheet>

      <Sheet open={field === 'cover'} onClose={() => setField(null)} title="Cover photo">
        <p className="body-sm muted" style={{ margin: 0 }}>
          Use a real photo of the place as it is today. Photos in check-ins stay the locals’ own.
        </p>
        <label className="btn btn--primary btn--block">
          <ImageGlyph size={16} />
          Choose a photo
          <input type="file" accept="image/*" className="sr-only" onChange={pickCover} />
        </label>
        {edit?.cover ? (
          <button type="button" className="btn btn--soft btn--block" onClick={() => save({ cover: undefined }, 'the cover photo back to a local’s photo')}>
            Use the locals’ photo again
          </button>
        ) : null}
      </Sheet>

      <Sheet open={!!replyingTo} onClose={closeReply} title={replyingTo ? `Reply to ${person(replyingTo.authorId).name.split(' ')[0]}` : ''}>
        {replyingTo ? (
          <form className="stack" style={{ gap: 10 }} onSubmit={sendReply}>
            <p className="manage-checkin__note" style={{ margin: 0 }}>
              “{replyingTo.note ?? replyingTo.items.join(', ')}”
            </p>
            <label htmlFor="m-reply" className="sr-only">
              Your reply
            </label>
            <textarea id="m-reply" className="textarea" rows={3} maxLength={240} value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Thank them, or say what you’ve changed" autoFocus />
            <p className="meta" style={{ margin: 0 }}>
              One public reply, shown under the check-in as you, owner of {place.name}. It can’t be edited later.
            </p>
            <button type="submit" className="btn btn--primary btn--block" disabled={!replyText.trim()}>
              Post reply
            </button>
          </form>
        ) : null}
      </Sheet>

      <Sheet open={!!reportFor} onClose={() => setReportFor(null)} title="Report to guides">
        <p className="body-sm muted" style={{ margin: 0 }}>
          Guides decide, not owners. A bad verdict isn’t a reason to report; reply instead. Report only if it breaks the rules:
        </p>
        <div className="stack" style={{ gap: 6 }}>
          {REPORT_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              className="list-row manage-reason"
              onClick={() => {
                setReportFor(null);
                toast('Sent to guides. The check-in stays up while they look.');
              }}
            >
              <span className="list-row__title">{r}</span>
              <ChevronRightGlyph size={15} />
            </button>
          ))}
        </div>
      </Sheet>

      <Sheet open={stopOpen} onClose={() => setStopOpen(false)} title="Stop running this page?">
        <p className="body-sm muted" style={{ margin: 0 }}>
          Your name comes off the page and your updates stay as they are. Locals and guides keep the facts right until someone else claims it.
        </p>
        <button
          type="button"
          className="btn btn--primary btn--block"
          onClick={() => {
            setStopOpen(false);
            toast('Noted. A guide confirms it before your name comes off the page.');
          }}
        >
          Stop running {place.name}
        </button>
        <button type="button" className="btn btn--soft btn--block" onClick={() => setStopOpen(false)}>
          Keep running it
        </button>
      </Sheet>

      <PageHistorySheet place={place} open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </>
  );
}
