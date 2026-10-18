import { useCallback } from 'react';
import { useSettings } from '../state/settings';
import { city } from './strings/city';
import { common } from './strings/common';
import { discover } from './strings/discover';
import { settings } from './strings/settings';
import { social } from './strings/social';
import type { Dict, Lang } from './types';

export type { Dict, Lang };

const DICT: Dict = { ...common, ...discover, ...city, ...settings, ...social };

export function translate(lang: Lang, key: string, vars?: Record<string, string | number>) {
  // Singular forms live under `<key>.one` and apply when n is 1.
  const entry = (vars?.n === 1 && DICT[`${key}.one`]) || DICT[key];
  let text = entry ? (entry[lang] ?? entry.en) : key;
  if (vars) for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
  return text;
}

/** `const t = useT(); t('nav.home')` — follows Settings › Language. */
export function useT() {
  const { settings } = useSettings();
  const lang = settings.language;
  return useCallback((key: string, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);
}

export const LANGUAGES: Array<{ id: Lang; name: string; native: string }> = [
  { id: 'en', name: 'English', native: 'English' },
  { id: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { id: 'hi', name: 'Hindi', native: 'हिन्दी' },
];
