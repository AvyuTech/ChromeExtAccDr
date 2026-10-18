import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CityName } from '../data/core';
import type { AlertKind, Severity, SourceId } from '../data/types';
import { mergeDefaults, readJSON, removeKey, writeJSON } from './storage';

export type Language = 'en' | 'gu' | 'hi';
export type ThemeChoice = 'system' | 'light' | 'dark';
export type CommuteMode = 'metro' | 'brts' | 'car' | 'two-wheeler' | 'auto' | 'walk';

export interface Settings {
  onboarded: boolean;
  profile: {
    name: string;
    handle: string;
    email: string;
    phone: string;
    bio: string;
    verifiedResident: boolean;
  };
  location: {
    city: CityName;
    home: string;
    work: string;
    radiusKm: number;
    autoDetect: boolean;
    commuteMode: CommuteMode;
    leaveAt: string;
    returnAt: string;
  };
  interests: string[];
  appearance: {
    theme: ThemeChoice;
    textScale: number;
    compactCards: boolean;
  };
  language: Language;
  accessibility: {
    reduceMotion: boolean;
    highContrast: boolean;
    largeTargets: boolean;
    readAnswersAloud: boolean;
  };
  notifications: {
    push: boolean;
    email: boolean;
    digest: 'off' | 'daily' | 'weekly';
    categories: Record<'replies' | 'mentions' | 'events' | 'deals' | 'groups' | 'reports' | 'alerts', boolean>;
    quietHours: boolean;
    quietFrom: string;
    quietTo: string;
  };
  alerts: {
    kinds: Record<AlertKind, boolean>;
    minSeverity: Severity;
    commuteOnly: boolean;
    criticalBypassQuiet: boolean;
    radiusKm: number;
  };
  privacy: {
    profileVisibility: 'everyone' | 'neighbours' | 'only-me';
    showGoing: boolean;
    showArea: boolean;
    allowMessages: 'everyone' | 'neighbours' | 'nobody';
    locationPrecision: 'exact' | 'neighbourhood' | 'city';
    personalisedSuggestions: boolean;
    usageAnalytics: boolean;
  };
  sources: {
    enabled: Record<'tickets' | 'instagram' | 'maps' | 'news' | 'neighbours', boolean>;
    showUnconfirmed: boolean;
    minAgreement: 1 | 2 | 3;
  };
  ai: {
    answers: boolean;
    length: 'brief' | 'balanced' | 'detailed';
    showSources: boolean;
    followUps: boolean;
    summariseThreads: boolean;
  };
  data: {
    dataSaver: boolean;
    liveUpdates: boolean;
    offlineEssentials: boolean;
    autoplayVideos: 'always' | 'wifi' | 'never';
  };
  safety: {
    contacts: Array<{ name: string; phone: string }>;
    shareLocationOnSos: boolean;
    safeWalkCheckIn: boolean;
  };
}

export const DEFAULT_SETTINGS: Settings = {
  onboarded: false,
  profile: {
    name: 'Jay Mehta',
    handle: 'jay.bodakdev',
    email: '',
    phone: '',
    bio: 'Coffee, cycling and finding the quiet corners of Amdavad.',
    verifiedResident: true,
  },
  location: {
    city: 'Ahmedabad',
    home: 'bodakdev',
    work: 'sg-highway',
    radiusKm: 5,
    autoDetect: true,
    commuteMode: 'metro',
    leaveAt: '09:00',
    returnAt: '18:30',
  },
  interests: ['food', 'events', 'music', 'sports', 'heritage'],
  appearance: { theme: 'system', textScale: 1, compactCards: false },
  language: 'en',
  accessibility: { reduceMotion: false, highContrast: false, largeTargets: false, readAnswersAloud: false },
  notifications: {
    push: true,
    email: false,
    digest: 'weekly',
    categories: { replies: true, mentions: true, events: true, deals: true, groups: true, reports: true, alerts: true },
    quietHours: true,
    quietFrom: '22:30',
    quietTo: '07:00',
  },
  alerts: {
    kinds: { traffic: true, weather: true, water: true, power: true, safety: true, health: true, civic: true, transit: true },
    minSeverity: 'info',
    commuteOnly: false,
    criticalBypassQuiet: true,
    radiusKm: 5,
  },
  privacy: {
    profileVisibility: 'neighbours',
    showGoing: true,
    showArea: true,
    allowMessages: 'neighbours',
    locationPrecision: 'neighbourhood',
    personalisedSuggestions: true,
    usageAnalytics: false,
  },
  sources: {
    enabled: { tickets: true, instagram: true, maps: true, news: true, neighbours: true },
    showUnconfirmed: true,
    minAgreement: 1,
  },
  ai: { answers: true, length: 'balanced', showSources: true, followUps: true, summariseThreads: true },
  data: { dataSaver: false, liveUpdates: true, offlineEssentials: true, autoplayVideos: 'wifi' },
  safety: {
    contacts: [{ name: '[Trusted contact]', phone: '' }],
    shareLocationOnSos: true,
    safeWalkCheckIn: false,
  },
};

const KEY = 'nearhood.settings.v1';

type SectionKey = keyof Settings;

interface SettingsContextValue {
  settings: Settings;
  /** Replace a top-level value; objects are shallow-merged into the current section. */
  update: <K extends SectionKey>(key: K, value: Settings[K] extends object ? Partial<Settings[K]> : Settings[K]) => void;
  reset: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => mergeDefaults(DEFAULT_SETTINGS, readJSON<Partial<Settings>>(KEY)));

  useEffect(() => {
    writeJSON(KEY, settings);
  }, [settings]);

  // Reflect appearance and accessibility choices on <html> so CSS tokens follow them.
  useEffect(() => {
    const root = document.documentElement;
    const { theme, textScale } = settings.appearance;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    root.style.setProperty('--text-scale', String(textScale));
    if (settings.accessibility.highContrast) root.setAttribute('data-contrast', 'high');
    else root.removeAttribute('data-contrast');
    if (settings.accessibility.reduceMotion) root.setAttribute('data-motion', 'reduce');
    else root.removeAttribute('data-motion');
    if (settings.accessibility.largeTargets) root.setAttribute('data-targets', 'large');
    else root.removeAttribute('data-targets');
    root.lang = settings.language;
  }, [settings.appearance, settings.accessibility, settings.language]);

  const update = useCallback<SettingsContextValue['update']>((key, value) => {
    setSettings((s) => {
      const current = s[key];
      const next =
        current && typeof current === 'object' && !Array.isArray(current) && value && typeof value === 'object' && !Array.isArray(value)
          ? { ...current, ...value }
          : value;
      return { ...s, [key]: next };
    });
  }, []);

  const reset = useCallback(() => {
    removeKey(KEY);
    setSettings({ ...DEFAULT_SETTINGS, onboarded: true });
  }, []);

  const value = useMemo(() => ({ settings, update, reset }), [settings, update, reset]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}

/** Sources the person has not switched off. Official feeds are always included. */
export function enabledSources(s: Settings): (id: SourceId) => boolean {
  return (id) => {
    if (id in s.sources.enabled) return s.sources.enabled[id as keyof Settings['sources']['enabled']];
    return true;
  };
}
