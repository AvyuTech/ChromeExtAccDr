import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ChatMessage, CivicReport, Post, Reply } from '../data/types';
import { mergeDefaults, readJSON, removeKey, writeJSON } from './storage';

/** What this person has done in the app. Sample content stays in src/data; this layers on top. */
export interface AppData {
  upvoted: string[];
  savedPosts: string[];
  savedPlaces: string[];
  savedEvents: string[];
  going: string[];
  interested: string[];
  joinedGroups: string[];
  claimedDeals: string[];
  readNotifications: string[];
  readConversations: string[];
  plusOned: string[];
  followedReports: string[];
  dismissedAlerts: string[];
  myPosts: Post[];
  myReports: CivicReport[];
  myReplies: Record<string, Reply[]>;
  sentMessages: Record<string, ChatMessage[]>;
  recentSearches: string[];
}

export const DEFAULT_APP_DATA: AppData = {
  upvoted: ['brunch-wifi'],
  savedPosts: [],
  savedPlaces: ['quiet-cup'],
  savedEvents: ['sufi-night'],
  going: [],
  interested: ['sufi-night'],
  joinedGroups: ['amdavad-foodies', 'bodakdev-neighbours'],
  claimedDeals: [],
  readNotifications: ['n7', 'n8', 'n9'],
  readConversations: [],
  plusOned: [],
  followedReports: ['rep-pothole', 'rep-light'],
  dismissedAlerts: [],
  myPosts: [],
  myReports: [],
  myReplies: {},
  sentMessages: {},
  recentSearches: ['quiet café with wifi', 'free events this weekend', 'metro timings'],
};

type ListKey = {
  [K in keyof AppData]: AppData[K] extends string[] ? K : never;
}[keyof AppData];

const KEY = 'nearhood.data.v1';

interface AppDataContextValue {
  data: AppData;
  has: (list: ListKey, id: string) => boolean;
  toggle: (list: ListKey, id: string) => boolean;
  add: (list: ListKey, id: string) => void;
  remove: (list: ListKey, id: string) => void;
  addPost: (post: Post) => void;
  addReport: (report: CivicReport) => void;
  addReply: (postId: string, reply: Reply) => void;
  sendMessage: (conversationId: string, message: ChatMessage) => void;
  rememberSearch: (q: string) => void;
  clearSearches: () => void;
  markAllRead: (ids: string[]) => void;
  reset: () => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => mergeDefaults(DEFAULT_APP_DATA, readJSON<Partial<AppData>>(KEY)));

  useEffect(() => {
    writeJSON(KEY, data);
  }, [data]);

  const has = useCallback((list: ListKey, id: string) => data[list].includes(id), [data]);

  const toggle = useCallback(
    (list: ListKey, id: string) => {
      const on = !data[list].includes(id);
      setData((d) => ({ ...d, [list]: on ? [...d[list], id] : d[list].filter((x) => x !== id) }));
      return on;
    },
    [data],
  );

  const add = useCallback((list: ListKey, id: string) => {
    setData((d) => (d[list].includes(id) ? d : { ...d, [list]: [...d[list], id] }));
  }, []);

  const remove = useCallback((list: ListKey, id: string) => {
    setData((d) => ({ ...d, [list]: d[list].filter((x) => x !== id) }));
  }, []);

  const addPost = useCallback((post: Post) => setData((d) => ({ ...d, myPosts: [post, ...d.myPosts] })), []);
  const addReport = useCallback(
    (report: CivicReport) => setData((d) => ({ ...d, myReports: [report, ...d.myReports], followedReports: [...d.followedReports, report.id] })),
    [],
  );
  const addReply = useCallback(
    (postId: string, reply: Reply) =>
      setData((d) => ({ ...d, myReplies: { ...d.myReplies, [postId]: [...(d.myReplies[postId] ?? []), reply] } })),
    [],
  );
  const sendMessage = useCallback(
    (conversationId: string, message: ChatMessage) =>
      setData((d) => ({ ...d, sentMessages: { ...d.sentMessages, [conversationId]: [...(d.sentMessages[conversationId] ?? []), message] } })),
    [],
  );
  const rememberSearch = useCallback((q: string) => {
    const query = q.trim();
    if (!query) return;
    setData((d) => ({ ...d, recentSearches: [query, ...d.recentSearches.filter((x) => x.toLowerCase() !== query.toLowerCase())].slice(0, 8) }));
  }, []);
  const clearSearches = useCallback(() => setData((d) => ({ ...d, recentSearches: [] })), []);
  const markAllRead = useCallback(
    (ids: string[]) => setData((d) => ({ ...d, readNotifications: Array.from(new Set([...d.readNotifications, ...ids])) })),
    [],
  );
  const reset = useCallback(() => {
    removeKey(KEY);
    setData(DEFAULT_APP_DATA);
  }, []);

  const value = useMemo(
    () => ({ data, has, toggle, add, remove, addPost, addReport, addReply, sendMessage, rememberSearch, clearSearches, markAllRead, reset }),
    [data, has, toggle, add, remove, addPost, addReport, addReply, sendMessage, rememberSearch, clearSearches, markAllRead, reset],
  );
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used inside AppDataProvider');
  return ctx;
}
