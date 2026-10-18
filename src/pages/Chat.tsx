import { Fragment, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { placePhoto } from '../assets/photos';
import { Avatar } from '../components/cards';
import { EmptyState, PageHeader } from '../components/ui';
import { PEOPLE, person } from '../data/core';
import { PLACES } from '../data/places';
import { CONVERSATIONS } from '../data/social';
import type { ChatMessage, Conversation } from '../data/types';
import { useT } from '../i18n';
import { BackGlyph, ChevronRightGlyph, SendGlyph, ShieldGlyph } from '../icons';
import { nowTime } from '../lib/format';
import { useAppData } from '../state/appData';

/** Messages carry a clock time for today, otherwise a day label ("Yesterday", "Mon"). */
function dayOf(m: ChatMessage) {
  return /\d\s?(am|pm)$/i.test(m.time) ? 'today' : m.time;
}

export default function Chat() {
  const { id = '' } = useParams();
  const t = useT();
  const navigate = useNavigate();
  const { data, add, sendMessage } = useAppData();
  const [params] = useSearchParams();
  const draftParam = params.get('draft') ?? '';
  const [draft, setDraft] = useState(draftParam);
  // Sample conversations, or a fresh one with anyone in the app at /messages/c-<personId>.
  const convo = useMemo<Conversation | undefined>(() => {
    const sample = CONVERSATIONS.find((c) => c.id === id);
    if (sample) return sample;
    const personId = id.startsWith('c-') ? id.slice(2) : '';
    return personId && personId !== 'me' && PEOPLE[personId] ? { id, withId: personId, unread: 0, messages: [] } : undefined;
  }, [id]);

  // A ?draft= link (Recommend, Plan it) fills the composer but never sends on its own.
  useEffect(() => {
    if (draftParam) setDraft(draftParam);
  }, [id, draftParam]);
  const messages = convo ? [...convo.messages, ...(data.sentMessages[convo.id] ?? [])] : [];

  useEffect(() => {
    if (convo) add('readConversations', convo.id);
  }, [convo, add]);

  // Runs after the shell's scroll-to-top on navigation, so the latest message stays in view.
  // On wide screens the app scrolls inside the phone frame (#scroller) rather than the window.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const frame = document.getElementById('scroller');
      if (frame && frame.scrollHeight > frame.clientHeight) frame.scrollTo({ top: frame.scrollHeight, behavior: 'smooth' });
      else window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    }, 40);
    return () => window.clearTimeout(timer);
  }, [messages.length]);

  if (!convo) {
    return (
      <>
        <PageHeader title={t('nav.messages')} fallback="/messages" />
        <main className="page page--with-header page--no-nav">
          <EmptyState
            glyph="question"
            title={t('social.chatMissing')}
            action={
              <Link to="/messages" className="btn btn--primary">
                {t('nav.messages')}
              </Link>
            }
          />
        </main>
      </>
    );
  }

  const who = person(convo.withId);
  // "About: Seoul Bowl" links the chat to a place we can show.
  const place = convo.context ? PLACES.find((p) => convo.context!.includes(p.name)) : undefined;

  const send = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    sendMessage(convo.id, { id: `sent-${Date.now()}`, from: 'me', text, time: nowTime() });
    setDraft('');
  };

  const dayLabel = (d: string) => (d === 'today' ? t('social.today') : d === 'Yesterday' ? t('social.yesterday') : d);

  return (
    <>
      <header className="page-header chat-head">
        <button
          type="button"
          className="icon-btn"
          aria-label={t('common.back')}
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/messages'))}
        >
          <BackGlyph size={20} />
        </button>
        <Link to={who.id === 'ward' ? '/city' : `/people/${who.id}`} className="chat-head__who">
          <Avatar who={who} size={42} />
          <span className="grow" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <h1 className="page-header__title" style={{ fontSize: '1.0625rem' }}>
              {who.name}
            </h1>
            <span className="meta truncate">
              {who.area}
              {who.badge ? ` · ${who.badge}` : ''}
            </span>
          </span>
        </Link>
      </header>

      <main className="page page--with-header chat-page" aria-label={`Conversation with ${who.name}`}>
        {place ? (
          <Link to={`/place/${place.id}`} className="chat-context">
            {placePhoto(place.id) ? <img src={placePhoto(place.id)} alt="" /> : null}
            <span className="stack grow" style={{ gap: 1, minWidth: 0 }}>
              <span className="eyebrow muted">{t('social.aboutPlace')}</span>
              <span className="strong truncate">{place.name}</span>
              <span className="meta truncate">
                {place.kind} · {place.area}
              </span>
            </span>
            <ChevronRightGlyph size={18} />
          </Link>
        ) : convo.context ? (
          <span className="chip chip--soft" style={{ alignSelf: 'center', height: 32 }}>
            {convo.context}
          </span>
        ) : null}
        <p className="meta row" style={{ alignSelf: 'center', alignItems: 'flex-start', maxWidth: 320, gap: 8, lineHeight: 1.45 }}>
          <ShieldGlyph size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          {t('social.safetyNote')}
        </p>

        {messages.length === 0 ? (
          <div className="empty" style={{ padding: '20px 12px' }}>
            <Avatar who={who} size={64} />
            <h2 className="empty__title">{t('feed.friends.newChat', { name: who.name.split(' ')[0] })}</h2>
            <p className="body-sm muted">{t('feed.friends.newChatBody')}</p>
          </div>
        ) : null}

        <div className="stack" role="log" aria-live="polite" style={{ gap: 8 }}>
          {messages.map((m, i) => {
            const day = dayOf(m);
            const newDay = i === 0 || dayOf(messages[i - 1]) !== day;
            const mine = m.from === 'me';
            // Their face sits beside the last bubble of each run, as in most chat apps.
            const lastOfRun = i === messages.length - 1 || messages[i + 1].from !== m.from;
            const bubble = (
              <div className={`bubble ${mine ? 'bubble--mine' : 'bubble--theirs'}`}>
                <span className="sr-only">{mine ? `${t('social.you')}: ` : `${who.name}: `}</span>
                {m.text}
                {day === 'today' ? <span className="bubble__time">{m.time}</span> : null}
              </div>
            );
            return (
              <Fragment key={m.id}>
                {newDay ? <span className="day-sep">{dayLabel(day)}</span> : null}
                {mine ? (
                  bubble
                ) : (
                  <div className="bubble-row">
                    <span className="bubble-row__face">{lastOfRun ? <Avatar who={{ ...who, verified: false }} size={28} /> : null}</span>
                    {bubble}
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>
      </main>

      <form className="composer-bar composer-bar--chat" onSubmit={send}>
        <label htmlFor="chat-input" className="sr-only">
          {t('social.typeMessage')}
        </label>
        <input
          id="chat-input"
          className="composer-bar__input"
          value={draft}
          maxLength={1000}
          placeholder={t('social.typeMessage')}
          autoComplete="off"
          enterKeyHint="send"
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit" className="icon-btn icon-btn--accent" aria-label={t('social.send')} disabled={!draft.trim()}>
          <SendGlyph size={19} />
        </button>
      </form>
    </>
  );
}
