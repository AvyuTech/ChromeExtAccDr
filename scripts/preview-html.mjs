// Turns the single-file build (dist-single/index.html) into a page body that
// can be hosted as a shareable preview: title, fonts, inline styles and the
// inline app script, without the PWA-only manifest and icon links.
// Usage: npm run build:single && node scripts/preview-html.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('dist-single/index.html', 'utf8');
const styles = [...html.matchAll(/<style[^>]*>[\s\S]*?<\/style>/g)].map((m) => m[0]);
const scripts = [...html.matchAll(/<script[^>]*>[\s\S]*?<\/script>/g)].map((m) => m[0]);
const fonts = html.match(/<link[^>]+fonts\.googleapis\.com\/css2[^>]+>/)?.[0] ?? '';

const out = [
  '<title>Nearhood</title>',
  '<meta name="description" content="Nearhood: ask anything about your city.">',
  '<link rel="preconnect" href="https://fonts.googleapis.com">',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  fonts,
  ...styles,
  '<div id="root"></div>',
  ...scripts,
].join('\n');

writeFileSync('dist-single/nearhood.html', out);
console.log(`dist-single/nearhood.html ${(out.length / 1024).toFixed(0)} KB`);
