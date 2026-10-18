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

/** Fill in keys added since the value was stored (one level of nesting is enough here). */
export function mergeDefaults<T extends object>(defaults: T, stored: Partial<T> | undefined): T {
  if (!stored) return defaults;
  const out: Record<string, unknown> = { ...(defaults as Record<string, unknown>) };
  for (const [k, v] of Object.entries(stored)) {
    const d = (defaults as Record<string, unknown>)[k];
    if (d && typeof d === 'object' && !Array.isArray(d) && v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = { ...(d as object), ...(v as object) };
    } else if (v !== undefined) {
      out[k] = v;
    }
  }
  return out as T;
}
