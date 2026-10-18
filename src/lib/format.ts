export function compact(n: number) {
  if (n >= 100_000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, '')}k`;
  return String(n);
}

export function rupees(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

export function price(n: number) {
  return n === 0 ? 'Free' : rupees(n);
}

export function priceLevel(level: 1 | 2 | 3 | 4) {
  return '₹'.repeat(level);
}

export function km(n: number) {
  return n < 1 ? `${Math.round(n * 1000)} m` : `${n.toFixed(n < 10 ? 1 : 0).replace(/\.0$/, '')} km`;
}

export function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

export function nowTime() {
  return new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

/** Split `**bold**` markup used in answers into parts the UI renders. */
export function boldParts(text: string): Array<{ text: string; bold: boolean }> {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part) => (part.startsWith('**') ? { text: part.slice(2, -2), bold: true } : { text: part, bold: false }));
}

export function stripBold(text: string) {
  return text.replace(/\*\*/g, '');
}
