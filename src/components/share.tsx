import { useState } from 'react';
import { Link } from 'react-router-dom';
import { person } from '../data/core';
import { CopyGlyph, SendGlyph, ShareGlyph } from '../icons';
import { nowTime } from '../lib/format';
import { useAppData } from '../state/appData';
import { useToast } from '../state/toast';
import { Avatar } from './cards';
import { Sheet } from './ui';

/**
 * One way to pass something on: send it to friends inside Nearhood (what used to
 * be "Recommend"), copy the link, or share it through another app.
 */
export function ShareSheet({
  open,
  onClose,
  title,
  path,
  message,
}: {
  open: boolean;
  onClose: () => void;
  /** What's being shared, for the sheet title: "Pickle & Play". */
  title: string;
  /** The app path, e.g. /place/pickle-play. */
  path: string;
  /** What friends receive in their chat, e.g. "Try Pickle & Play in Thaltej". */
  message: string;
}) {
  const toast = useToast();
  const { data, sendMessage } = useAppData();
  const [picked, setPicked] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const url = `${window.location.origin}${window.location.pathname}#${path}`;

  const close = () => {
    setPicked([]);
    setNote('');
    onClose();
  };

  const send = () => {
    const text = `${message}${note.trim() ? ` — ${note.trim()}` : ''}`;
    picked.forEach((id, i) => sendMessage(`c-${id}`, { id: `share-${Date.now()}-${i}`, from: 'me', text, time: nowTime() }));
    toast(picked.length === 1 ? `Sent to ${person(picked[0]).name.split(' ')[0]}` : `Sent to ${picked.length} friends`);
    close();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast('Link copied');
    } catch {
      toast('Could not copy the link');
    }
    close();
  };

  const other = async () => {
    try {
      if (navigator.share) await navigator.share({ title: 'Nearhood', text: message, url });
      else {
        await navigator.clipboard.writeText(url);
        toast('Link copied');
      }
      close();
    } catch (err) {
      if ((err as DOMException)?.name !== 'AbortError') toast('Could not share right now');
    }
  };

  return (
    <Sheet open={open} onClose={close} title={`Share ${title}`}>
      <span className="eyebrow muted">Send to friends</span>
      {data.following.length === 0 ? (
        <p className="body-sm">
          Follow friends to send them things here.{' '}
          <Link to="/friends?tab=find" onClick={close}>
            Find friends
          </Link>
        </p>
      ) : (
        <div className="share-friends" role="group" aria-label="Friends">
          {data.following.map((id) => {
            const who = person(id);
            const on = picked.includes(id);
            return (
              <button key={id} type="button" className={`share-friend${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => setPicked((p) => (on ? p.filter((x) => x !== id) : [...p, id]))}>
                <Avatar who={{ ...who, verified: false }} size={46} />
                <span>{who.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      )}
      {picked.length ? (
        <>
          <input className="input" value={note} maxLength={140} onChange={(e) => setNote(e.target.value)} placeholder="Add a note (optional)" aria-label="Note" />
          <button type="button" className="btn btn--primary btn--block" onClick={send}>
            <SendGlyph size={17} />
            {picked.length > 1 ? `Send to ${picked.length} friends` : `Send to ${person(picked[0]).name.split(' ')[0]}`}
          </button>
        </>
      ) : null}
      <div className="list list--grouped">
        <button type="button" className="list-row" onClick={copy}>
          <span className="set-tile">
            <CopyGlyph size={17} />
          </span>
          <span className="list-row__body">
            <span className="list-row__title">Copy link</span>
          </span>
        </button>
        <button type="button" className="list-row" onClick={other}>
          <span className="set-tile">
            <ShareGlyph size={17} />
          </span>
          <span className="list-row__body">
            <span className="list-row__title">Share through another app</span>
            <span className="list-row__meta">WhatsApp, Instagram, SMS…</span>
          </span>
        </button>
      </div>
    </Sheet>
  );
}
