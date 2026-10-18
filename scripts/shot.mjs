// Usage: node scripts/shot.mjs <baseUrl> <outDir> <route> [route...]
// Screenshots routes at phone size. Pass THEME=dark for dark mode, FULL=1 for full page.
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const [base, out, ...routes] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  colorScheme: process.env.THEME === 'dark' ? 'dark' : 'light',
});
await ctx.addInitScript(() => {
  try {
    const s = JSON.parse(localStorage.getItem('nearhood.settings.v1') || '{}');
    if (s.onboarded === undefined && !location.hash.includes('onboarding')) {
      localStorage.setItem('nearhood.settings.v1', JSON.stringify({ ...s, onboarded: true }));
    }
  } catch {}
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`${e.message}`));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
for (const r of routes) {
  await page.goto(`${base}/#${r}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  const name = r.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'home';
  await page.screenshot({ path: `${out}/${name}${process.env.THEME === 'dark' ? '-dark' : ''}.png`, fullPage: !!process.env.FULL });
}
if (errors.length) console.log('ERRORS:\n' + errors.join('\n'));
await browser.close();
