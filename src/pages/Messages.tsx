import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../components/cards';
import { EmptyState, PageHeader } from '../components/ui';
import { PEOPLE, person } from '../data/core';
import { CONVERSATIONS } from '../data/social';
import type { Conversation } from '../data/types';
import { useT } from '../i18n';
import { LockGlyph, SearchGlyph } from '../icons';
import { useAppData } from '../state/appData';
import { useSettings } from '../state/settings';

/** Sample "active now" neighbours. */
const ONLINE = ['aditi', 'riya', 'karan', 'farah'];

export default function Messages() {
  const t = useT();
  const { settings } = useSettings();
  const { data } = useAppData();
  const [query, setQuery] = useState('');

  // Chats started in the app (a recommendation, "Plan it") exist only as sent messages.
  const started: Conversation[] = Object.keys(data.sentMessages)
    .filter((cid) => !CONVERSATIONS.some((c) => c.id === cid) && cid.startsWith('c-') && PEOPLE[cid.slice(2)])
    .map((cid) => ({ id: cid, withId: cid.slice(2), unread: 0, messages: [] }));

  // Chats you wrote in most recently float to the top.
  const recent = Object.keys(data.sentMessages).reverse();
  const rank = (id: string) => (recent.includes(id) ? recent.indexOf(id) : recent.length);
  const rows = [...started, ...CONVERSATIONS]
    .sort((a, b) => rank(a.id) - rank(b.id))
    .map((c) => {
      const messages = [...c.messages, ...(data.sentMessages[c.id] ?? [])];
      const last = messages[messages.length - 1];
      const unread = c.unread > 0 && !data.readConversations.includes(c.id) ? c.unread : 0;
      return { c, who: person(c.withId), last, unread };
    });

  const q = query.trim().toLowerCase();
  const shown = q
    ? rows.filter(({ c, who, last }) => `${who.name} ${c.context ?? ''} ${last?.text ?? ''}`.toLowerCase().includes(q))
    : rows;

  const privacy = settings.privacy.allowMessages;
  // People you follow, for a quick new chat.
  const friends = data.following.filter((id) => PEOPLE[id] && id !== 'ward').slice(0, 8);

  return (
    <>
      <PageHeader title={t('nav.messages')} />
      <main className="page page--with-header">
        <label className="search-field" htmlFor="chat-search">
          <SearchGlyph size={18} />
          <span className="sr-only">{t('social.searchChats')}</span>
          <input id="chat-search" type="search" value={query} placeholder={t('social.searchChats')} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
        </label>

        {!q && friends.length ? (
          <section className="dm-strip" aria-label={t('social.startChat')}>
            {friends.map((id) => {
              const who = person(id);
              return (
                <Link key={id} to={`/messages/c-${id}`} className="dm-strip__item">
                  <span className="dm-strip__face">
                    <Avatar who={{ ...who, verified: false }} size={58} />
                    {ONLINE.includes(id) ? <span className="dm-strip__online" aria-label={t('social.activeNow')} /> : null}
                  </span>
                  <span className="dm-strip__name">{who.name.split(' ')[0]}</span>
                </Link>
              );
            })}
          </section>
        ) : null}

        {shown.length === 0 ? (
          <EmptyState glyph="question" title={t('social.noChats')} body={t('social.noChatsBody')} />
        ) : (
          <div className="list">
            {shown.map(({ c, who, last, unread }) => (
              <Link
                key={c.id}
                to={`/messages/${c.id}`}
                className={`list-row${unread ? ' chat-row--unread' : ''}`}
                aria-label={`${who.name}${unread ? `, ${t('social.unreadCount', { n: unread })}` : ''}. ${last?.text ?? ''}`}
              >
                <span className="dm-strip__face">
                  <Avatar who={who} size={52} />
                  {ONLINE.includes(who.id) ? <span className="dm-strip__online" /> : null}
                </span>
                <span className="list-row__body">
                  <span className="row row--between" style={{ gap: 8 }}>
                    <span className="list-row__title">{who.name}</span>
                    <span className="meta" style={{ flexShrink: 0 }}>
                      {last?.time}
                    </span>
                  </span>
                  {c.context ? <span className="list-row__meta">{c.context}</span> : null}
                  <span className="row" style={{ gap: 8 }}>
                    <span className="chat-row__last grow">
                      {last?.from === 'me' ? `${t('social.you')}: ` : ''}
                      {last?.text}
                    </span>
                    {unread ? <span className="unread-count">{unread}</span> : null}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}

        <p className="notice">
          <LockGlyph size={18} style={{ flexShrink: 0 }} />
          <span className="grow">
            {t(`social.privacy.${privacy}`)}{' '}
            <Link to="/settings/privacy" style={{ fontWeight: 700 }}>
              {t('social.change')}
            </Link>
          </span>
        </p>
      </main>
    </>
  );
}
