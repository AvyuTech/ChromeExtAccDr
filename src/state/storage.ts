/* Browser storage can be missing or throw (private mode, blocked site data,
   embedded previews), so every access is guarded and the app works without it. */

export function readJSON<T>(key: string): T | undefined {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
}

export function writeJSON(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: keep working in memory */
  }
}

export function removeKey(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

const isPlainObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Fill in keys added since the value was stored, at any depth. Arrays are replaced, never merged. */
export function mergeDefaults<T extends object>(defaults: T, stored: Partial<T> | undefined): T {
  if (!stored) return defaults;
  const out: Record<string, unknown> = { ...(defaults as Record<string, unknown>) };
  for (const [k, v] of Object.entries(stored)) {
    const d = (defaults as Record<string, unknown>)[k];
    if (isPlainObject(d) && isPlainObject(v)) out[k] = mergeDefaults(d, v);
    else if (v !== undefined) out[k] = v;
  }
  return out as T;
}
