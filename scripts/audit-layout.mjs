// Layout audit: opens every screen from the smoke test at phone width and reports
// text that sits on top of other text, and badges or ticks that cover most of the
// thing they decorate. It catches the kind of overlap a screenshot shows but a
// crash test doesn't.
// Usage: node scripts/audit-layout.mjs [baseUrl]   (default http://localhost:4173)
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:4173';
const src = readFileSync(new URL('./smoke.mjs', import.meta.url), 'utf8');
const routes = [...src.slice(src.indexOf('export const ROUTES'), src.indexOf('];', src.indexOf('export const ROUTES'))).matchAll(/^\s*(['"])(.*?)\1,/gm)].map((m) => m[2]);

const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript(() => {
  try {
    sessionStorage.setItem('nearhood.splash.v2', '1');
    const s = JSON.parse(localStorage.getItem('nearhood.settings.v1') || '{}');
    if (s.onboarded === undefined && !location.hash.includes('onboarding')) localStorage.setItem('nearhood.settings.v1', JSON.stringify({ ...s, onboarded: true }));
  } catch {}
});
const page = await ctx.newPage();
let total = 0;

for (const r of routes) {
  await page.goto(`${base}/#${r}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(350);
  const issues = await page.evaluate(() => {
    const out = [];
    const vw = document.documentElement.clientWidth;
    // Fixed and sticky bars (tab bar, reply bar, page headers) sit over scrolling content on purpose.
    const pinned = (el) => {
      for (let n = el; n && n !== document.body; n = n.parentElement) {
        const p = getComputedStyle(n).position;
        if (p === 'fixed' || p === 'sticky') return true;
      }
      return false;
    };
    const skip = (el) => el.closest('.xmap, .city-map, [aria-hidden="true"], .sheet, .toast, .device__island, .status-bar, svg, .sr-only') || pinned(el);
    const visible = (el) => {
      const cs = getComputedStyle(el);
      return cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05;
    };
    const label = (el) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')} "${(el.textContent || '').trim().slice(0, 30)}"`;

    // 1. Text on text: leaf elements with their own text whose boxes overlap.
    const texts = [...document.querySelectorAll('body *')].filter(
      (el) => !skip(el) && visible(el) && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1),
    );
    const boxes = texts
      .map((el) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        // Text cut off with overflow: hidden (an ellipsis) only counts where it shows.
        const box = el.getBoundingClientRect();
        const clipped = /hidden|clip/.test(getComputedStyle(el).overflow);
        const rects = [...range.getClientRects()]
          .map((b) => (clipped ? new DOMRect(Math.max(b.left, box.left), Math.max(b.top, box.top), Math.min(b.right, box.right) - Math.max(b.left, box.left), Math.min(b.bottom, box.bottom) - Math.max(b.top, box.top)) : b))
          .filter((b) => b.width > 2 && b.height > 2);
        return { el, rects };
      })
      .filter((t) => t.rects.length && t.rects.some((b) => b.right > 0 && b.left < vw));
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
        for (const ra of a.rects) {
          for (const rb of b.rects) {
            const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
            const h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
            if (w > 4 && h > 4 && w * h > 0.3 * Math.min(ra.width * ra.height, rb.width * rb.height)) {
              out.push(`text overlaps: ${label(a.el)}  ×  ${label(b.el)}`);
            }
          }
        }
      }
    }

    // 2. Ticks and badges that cover too much of the photo they sit on.
    for (const tick of document.querySelectorAll('.avatar__tick, .entity-pic__badge, .profile-head__mark')) {
      const host = tick.parentElement.getBoundingClientRect();
      const t = tick.getBoundingClientRect();
      if (host.width && t.width / host.width > 0.5) out.push(`badge too big for its photo: ${label(tick.parentElement)} (${Math.round(t.width)}px on ${Math.round(host.width)}px)`);
    }

    // 3. Icons and shapes that spill well outside the row or header they belong to.
    for (const el of document.querySelectorAll('.entity-pic, .profile-head__icon, .avatar')) {
      if (skip(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 && r.left < vw) out.push(`cut off at the screen edge: ${label(el)}`);
    }
    return [...new Set(out)];
  });
  if (issues.length) {
    total += issues.length;
    console.log(`\n${r}`);
    for (const i of issues.slice(0, 12)) console.log(`  - ${i}`);
    if (issues.length > 12) console.log(`  … ${issues.length - 12} more`);
  }
}
console.log(`\n${total} possible layout issues across ${routes.length} screens`);
await browser.close();
