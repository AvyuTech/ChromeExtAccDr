// Usage: node scripts/shot.mjs <baseUrl> <outDir> <route> [route...]
// Screenshots routes at phone size. Pass THEME=dark for dark mode, FULL=1 for full page,
// WIDTH/HEIGHT for another viewport (1440x900 shows the desktop phone frame) and SPLASH=1 to keep the splash.
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const [base, out, ...routes] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({
  viewport: { width: Number(process.env.WIDTH ?? 390), height: Number(process.env.HEIGHT ?? 844) },
  deviceScaleFactor: 2,
  colorScheme: process.env.THEME === 'dark' ? 'dark' : 'light',
});
await ctx.addInitScript((keepSplash) => {
  try {
    if (!keepSplash) sessionStorage.setItem('nearhood.splash.v2', '1');
    const s = JSON.parse(localStorage.getItem('nearhood.settings.v1') || '{}');
    if (s.onboarded === undefined && !location.hash.includes('onboarding')) {
      localStorage.setItem('nearhood.settings.v1', JSON.stringify({ ...s, onboarded: true }));
    }
  } catch {}
}, !!process.env.SPLASH);
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`${e.message}`));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
for (const r of routes) {
  await page.goto(`${base}/#${r}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  if (process.env.FULL) {
    // Walk down the page so lazy photos load before the capture.
    await page.evaluate(async () => {
      const el = document.getElementById('scroller');
      const target = el && el.scrollHeight > el.clientHeight ? el : document.scrollingElement;
      for (let y = 0; y < target.scrollHeight; y += 600) {
        target.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      document.querySelectorAll('img[loading="lazy"]').forEach((img) => (img.loading = 'eager'));
      target.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 400));
    });
  }
  const name = r.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'home';
  const suffix = `${process.env.WIDTH ? `-${process.env.WIDTH}` : ''}${process.env.THEME === 'dark' ? '-dark' : ''}`;
  await page.screenshot({ path: `${out}/${name}${suffix}.png`, fullPage: !!process.env.FULL });
}
if (errors.length) console.log('ERRORS:\n' + errors.join('\n'));
await browser.close();
