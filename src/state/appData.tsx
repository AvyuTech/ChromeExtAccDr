import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_FOLLOWING, MY_WANT_TO_TRY } from '../data/friends';
import type { ChatMessage, CheckIn, CivicReport, Collection, Post, Reply, SpottedPlace, WantItem } from '../data/types';
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
  /** People this person follows. */
  following: string[];
  myCheckIns: CheckIn[];
  wantToTry: WantItem[];
  likedCheckIns: string[];
  checkInComments: Record<string, Array<{ id: string; authorId: string; text: string; ago: string }>>;
  /** Friends whose latest check-ins were already viewed from the Home strip. */
  seenStories: string[];
  myCollections: Collection[];
  followedCollections: string[];
  /** Renames, new descriptions and removed places for lists, keyed by list id. */
  collectionEdits: Record<string, Partial<Pick<Collection, 'title' | 'description' | 'placeIds'>>>;
  /** Follow requests handled while "Approve new followers" is on. */
  approvedFollowers: string[];
  declinedFollowers: string[];
  /** New openings this person confirmed after visiting. */
  confirmedSpots: string[];
  /** Places this person added that are waiting for confirmations. */
  mySpots: SpottedPlace[];
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
  following: DEFAULT_FOLLOWING,
  myCheckIns: [],
  wantToTry: MY_WANT_TO_TRY,
  likedCheckIns: ['ci-aditi-seoul'],
  checkInComments: {},
  seenStories: [],
  myCollections: [],
  followedCollections: ['work-cafes'],
  collectionEdits: {},
  approvedFollowers: [],
  declinedFollowers: [],
  confirmedSpots: [],
  mySpots: [],
};

type ListKey = {
  [K in keyof AppData]: AppData[K] extends string[] ? K : never;
}[keyof AppData];

const KEY = 'nearhood.data.v1';

/** Two list entries are the same thing when they point at the same place/event and have the same title. */
export function sameWant(a: Pick<WantItem, 'refId' | 'title'>, b: Pick<WantItem, 'refId' | 'title'>) {
  return (a.refId ?? '') === (b.refId ?? '') && a.title.toLowerCase() === b.title.toLowerCase();
}

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
  addCheckIn: (checkIn: CheckIn) => void;
  addCheckInComment: (checkInId: string, comment: { id: string; authorId: string; text: string; ago: string }) => void;
  /** Add to (or remove from) the Want to try list; matched by refId + title. Returns true when added. */
  toggleWant: (item: WantItem) => boolean;
  setWantDone: (id: string, done: boolean) => void;
  removeWant: (id: string) => void;
  addCollection: (collection: Collection) => void;
  editCollection: (id: string, patch: Partial<Pick<Collection, 'title' | 'description' | 'placeIds'>>) => void;
  addSpot: (spot: SpottedPlace) => void;
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
  const addCheckIn = useCallback((checkIn: CheckIn) => setData((d) => ({ ...d, myCheckIns: [checkIn, ...d.myCheckIns] })), []);
  const addCheckInComment = useCallback<AppDataContextValue['addCheckInComment']>(
    (checkInId, comment) =>
      setData((d) => ({ ...d, checkInComments: { ...d.checkInComments, [checkInId]: [...(d.checkInComments[checkInId] ?? []), comment] } })),
    [],
  );
  const toggleWant = useCallback(
    (item: WantItem) => {
      const existing = data.wantToTry.find((w) => sameWant(w, item));
      setData((d) => ({
        ...d,
        wantToTry: existing ? d.wantToTry.filter((w) => !sameWant(w, item)) : [{ ...item, done: false }, ...d.wantToTry],
      }));
      return !existing;
    },
    [data.wantToTry],
  );
  const setWantDone = useCallback(
    (id: string, done: boolean) =>
      setData((d) => ({ ...d, wantToTry: d.wantToTry.map((w) => (w.id === id ? { ...w, done, doneAgo: done ? 'Just now' : undefined } : w)) })),
    [],
  );
  const removeWant = useCallback((id: string) => setData((d) => ({ ...d, wantToTry: d.wantToTry.filter((w) => w.id !== id) })), []);
  const addCollection = useCallback((c: Collection) => setData((d) => ({ ...d, myCollections: [c, ...d.myCollections] })), []);
  const editCollection = useCallback<AppDataContextValue['editCollection']>(
    (id, patch) => setData((d) => ({ ...d, collectionEdits: { ...d.collectionEdits, [id]: { ...(d.collectionEdits[id] ?? {}), ...patch } } })),
    [],
  );
  const addSpot = useCallback((spot: SpottedPlace) => setData((d) => ({ ...d, mySpots: [spot, ...d.mySpots] })), []);
  const reset = useCallback(() => {
    removeKey(KEY);
    setData(DEFAULT_APP_DATA);
  }, []);

  const value = useMemo(
    () => ({
      data,
      has,
      toggle,
      add,
      remove,
      addPost,
      addReport,
      addReply,
      sendMessage,
      rememberSearch,
      clearSearches,
      markAllRead,
      addCheckIn,
      addCheckInComment,
      toggleWant,
      setWantDone,
      removeWant,
      addCollection,
      editCollection,
      addSpot,
      reset,
    }),
    [data, has, toggle, add, remove, addPost, addReport, addReply, sendMessage, rememberSearch, clearSearches, markAllRead, addCheckIn, addCheckInComment, toggleWant, setWantDone, removeWant, addCollection, editCollection, addSpot, reset],
  );
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used inside AppDataProvider');
  return ctx;
}
