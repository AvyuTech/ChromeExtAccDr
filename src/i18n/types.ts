export type Lang = 'en' | 'gu' | 'hi';
/** English is required; Gujarati and Hindi fall back to English when missing. */
export type Dict = Record<string, { en: string; gu?: string; hi?: string }>;
