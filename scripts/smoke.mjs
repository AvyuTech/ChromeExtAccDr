// End-to-end smoke test: opens every screen in light and dark mode at phone
// width, fails on console errors, page crashes or horizontal overflow, then
// drives a few key flows.
// Usage: node scripts/smoke.mjs [baseUrl]   (default http://localhost:4173, i.e. `npm run preview`)
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:4173';
export const ROUTES = [
  '/',
  '/ask',
  "/ask?q=What's happening this weekend?",
  '/ask?q=traffic now',
  '/ask?q=best way to Navrangpura',
  '/ask?q=hospital',
  '/explore',
  '/explore/food',
  '/explore/events',
  '/explore/getaways',
  '/explore/places',
  '/place/quiet-cup',
  '/event/sufi-night',
  '/event/food-trucks',
  '/clubs',
  '/clubs/founders-prahlad',
  '/clubs/sunday-cricket',
  '/clubs/new',
  '/clubs?create=buy',
  '/groups/bodakdev-neighbours',
  '/post/brunch-wifi',
  '/compose',
  '/checkin',
  '/checkin?place=seoul-bowl',
  '/checkin/ci-aditi-seoul',
  '/checkin/ci-harsh-corner',
  '/friends',
  '/friends?tab=following',
  '/friends?tab=find',
  '/people/riya',
  '/people/zoya',
  '/lists/work-cafes',
  '/messages/c-riya?draft=Hi',
  '/updates',
  '/messages',
  '/messages/c-aditi',
  '/city',
  '/city/alerts',
  '/city/alerts/sg-lane',
  '/city/traffic',
  '/city/transit',
  '/city/report',
  '/city/reports',
  '/city/reports/rep-pothole',
  '/city/safety',
  '/me',
  '/me/saved',
  '/settings',
  ...['account', 'location', 'notifications', 'alerts', 'appearance', 'language', 'accessibility', 'privacy', 'sources', 'data', 'safety', 'help', 'about'].map((s) => `/settings/${s}`),
  '/about/glyphs',
  '/onboarding',
  '/does-not-exist',
];

const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium' });
const failures = [];

for (const scheme of ['light', 'dark']) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, colorScheme: scheme });
  await ctx.addInitScript(() => {
    try {
      sessionStorage.setItem('nearhood.splash.v2', '1');
    } catch {
      /* ignore */
    }
    if (!location.hash.includes('onboarding')) {
      try {
        const s = JSON.parse(localStorage.getItem('nearhood.settings.v1') || '{}');
        localStorage.setItem('nearhood.settings.v1', JSON.stringify({ ...s, onboarded: true }));
      } catch {
        /* ignore */
      }
    }
  });
  const page = await ctx.newPage();
  let errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text())) errors.push(m.text());
  });

  for (const route of ROUTES) {
    errors = [];
    await page.goto(`${base}/#${route}`, { waitUntil: 'load' });
    await page.waitForTimeout(350);
    const check = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      heading: !!document.querySelector('h1, h2'),
      text: document.body.innerText.length,
    }));
    const problems = [];
    if (errors.length) problems.push(`console: ${errors.join(' | ')}`);
    if (check.overflow > 1) problems.push(`horizontal overflow ${check.overflow}px`);
    if (!check.heading) problems.push('no heading');
    if (check.text < 20) problems.push('empty page');
    if (problems.length) failures.push(`[${scheme}] ${route}: ${problems.join('; ')}`);
  }

  if (scheme === 'light') {
    // Ask from Home and get an answer.
    await page.goto(`${base}/#/`);
    await page.fill('#ask', 'quiet café with wifi');
    await page.press('#ask', 'Enter');
    await page.waitForTimeout(1200);
    const answered = await page.evaluate(() => location.hash.startsWith('#/ask') && /Quiet Cup/.test(document.body.innerText));
    if (!answered) failures.push('flow: asking from Home did not show an answer mentioning The Quiet Cup');

    // Forcing dark theme in settings reaches <html>.
    await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('nearhood.settings.v1') || '{}');
      s.appearance = { ...(s.appearance || {}), theme: 'dark' };
      localStorage.setItem('nearhood.settings.v1', JSON.stringify(s));
    });
    await page.goto(`${base}/#/`);
    await page.reload();
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    if (theme !== 'dark') failures.push(`flow: theme setting not applied (data-theme=${theme})`);
  }
  if (scheme === 'light') {
    // Quick check-in from the + button lands on the new check-in.
    await page.goto(`${base}/#/`);
    await page.getByRole('button', { name: /new post/i }).click();
    await page.getByRole('button', { name: /quick check-in/i }).click();
    await page.waitForTimeout(300);
    const onComposer = await page.evaluate(() => location.hash.startsWith('#/checkin'));
    if (!onComposer) failures.push('flow: + › Quick check-in did not open the composer');
  }
  await ctx.close();
}

await browser.close();
if (failures.length) {
  console.log(`FAIL (${failures.length})\n${failures.join('\n')}`);
  process.exit(1);
}
console.log(`OK: ${ROUTES.length} routes × 2 themes, plus flows`);
