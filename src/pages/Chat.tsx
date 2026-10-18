import { Fragment, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '../components/cards';
import { EmptyState, PageHeader } from '../components/ui';
import { person } from '../data/core';
import { CONVERSATIONS } from '../data/social';
import type { ChatMessage } from '../data/types';
import { useT } from '../i18n';
import { BackGlyph, SendGlyph, ShieldGlyph } from '../icons';
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
  const [draft, setDraft] = useState('');
  const convo = CONVERSATIONS.find((c) => c.id === id);
  const messages = convo ? [...convo.messages, ...(data.sentMessages[convo.id] ?? [])] : [];

  useEffect(() => {
    if (convo) add('readConversations', convo.id);
  }, [convo, add]);

  // Runs after the shell's scroll-to-top on navigation, so the latest message stays in view.
  useEffect(() => {
    const timer = window.setTimeout(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }), 40);
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
        <Avatar who={who} size={40} />
        <div className="grow" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <h1 className="page-header__title" style={{ fontSize: '1rem' }}>
            {who.name}
          </h1>
          <span className="meta">
            {who.area}
            {who.badge ? ` · ${who.badge}` : ''}
          </span>
        </div>
      </header>

      <main className="page page--with-header chat-page" aria-label={`Conversation with ${who.name}`}>
        {convo.context ? (
          <span className="chip chip--soft" style={{ alignSelf: 'center', height: 32 }}>
            {convo.context}
          </span>
        ) : null}
        <p className="meta row" style={{ alignSelf: 'center', alignItems: 'flex-start', maxWidth: 320, gap: 8, lineHeight: 1.45 }}>
          <ShieldGlyph size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          {t('social.safetyNote')}
        </p>

        <div className="stack" role="log" aria-live="polite" style={{ gap: 8 }}>
          {messages.map((m, i) => {
            const day = dayOf(m);
            const newDay = i === 0 || dayOf(messages[i - 1]) !== day;
            const mine = m.from === 'me';
            return (
              <Fragment key={m.id}>
                {newDay ? <span className="day-sep">{dayLabel(day)}</span> : null}
                <div className={`bubble ${mine ? 'bubble--mine' : 'bubble--theirs'}`}>
                  <span className="sr-only">{mine ? `${t('social.you')}: ` : `${who.name}: `}</span>
                  {m.text}
                  {day === 'today' ? <span className="bubble__time">{m.time}</span> : null}
                </div>
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
