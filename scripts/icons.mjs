// Renders the PWA PNG icons from the SVG logo. Usage: node scripts/icons.mjs
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
const jobs = [
  ['public/icon.svg', 'public/icon-192.png', 192],
  ['public/icon.svg', 'public/icon-512.png', 512],
  ['public/icon-maskable.svg', 'public/icon-maskable-512.png', 512],
];
for (const [src, out, size] of jobs) {
  const svg = readFileSync(src, 'utf8').replace('<svg ', `<svg width="${size}" height="${size}" `);
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
  await page.locator('svg').screenshot({ path: out, omitBackground: true });
}
await browser.close();
console.log('icons written');
