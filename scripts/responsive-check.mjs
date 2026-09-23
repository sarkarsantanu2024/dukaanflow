/**
 * Does the public page hold together at every width a real customer has?
 *
 *   npm run dev                       # this reads the running dev server
 *   node scripts/responsive-check.mjs
 *   SHOTS=1 node scripts/responsive-check.mjs   # also writes .responsive/*.png
 *
 * IT CHECKS THE THINGS A SCREENSHOT CANNOT TELL YOU. A page can look right in
 * a picture and still scroll sideways on a phone, which is the single most
 * common fault on a landing page and the one nobody notices on a laptop:
 *
 *   - horizontal overflow — the page is wider than the window;
 *   - spills — an element whose box ends past the right edge, ignoring any
 *     that a parent deliberately clips or scrolls, because a decorative blur
 *     inside `overflow-hidden` and a wide table inside `overflow-x-auto` are
 *     both doing that on purpose;
 *   - clipped text — a word cut off by its own box.
 *
 * Widths are the ones that actually turn up: 320 is the smallest Android still
 * in use in India, 360 is the commonest, and the rest are phones, a tablet and
 * three laptops. `playwright` arrives with the toolchain; it is not a declared
 * dependency, which is fine for a tool run by hand.
 */
import { chromium } from 'playwright';

const WIDTHS = [
  { w: 320, h: 720, name: '320 (smallest android)' },
  { w: 360, h: 800, name: '360 (common android)' },
  { w: 390, h: 844, name: '390 (iphone)' },
  { w: 414, h: 896, name: '414 (large phone)' },
  { w: 768, h: 1024, name: '768 (tablet)' },
  { w: 1024, h: 768, name: '1024 (small laptop)' },
  { w: 1280, h: 800, name: '1280 (laptop)' },
  { w: 1920, h: 1080, name: '1920 (desktop)' },
];

const PAGES = ['/'];
const base = process.env.BASE ?? 'http://localhost:3000';
const shots = process.env.SHOTS === '1';

const browser = await chromium.launch();
let failures = 0;

for (const path of PAGES) {
  console.log(`\n=== ${path} ===`);
  for (const size of WIDTHS) {
    const page = await browser.newPage({ viewport: { width: size.w, height: size.h } });
    await page.goto(base + path, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(400);

    const report = await page.evaluate(() => {
      const doc = document.documentElement;
      const vw = doc.clientWidth;
      const overflow = doc.scrollWidth - vw;

      // Every element whose box ends past the right edge, or starts left of it.
      const spills = [];
      for (const el of document.body.querySelectorAll('*')) {
        const style = getComputedStyle(el);
        if (style.position === 'fixed' || style.visibility === 'hidden' || style.display === 'none') continue;
        // An element that sticks out of a parent which CLIPS or SCROLLS it is
        // not a fault: that is what a decorative blur inside `overflow-hidden`
        // and a wide table inside `overflow-x-auto` are both doing on purpose.
        let clippedByAncestor = false;
        for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
          const ox = getComputedStyle(a).overflowX;
          if (ox === 'hidden' || ox === 'auto' || ox === 'scroll' || ox === 'clip') {
            clippedByAncestor = true;
            break;
          }
        }
        if (clippedByAncestor) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.right > vw + 1 || r.left < -1) {
          spills.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.getAttribute('class') ?? '').slice(0, 70),
            left: Math.round(r.left),
            right: Math.round(r.right),
          });
        }
      }

      // Anything whose text is clipped by its own box.
      const clipped = [];
      for (const el of document.body.querySelectorAll('h1,h2,h3,p,span,a,button,dd,dt,summary')) {
        if (el.children.length) continue;
        if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflow !== 'visible') {
          clipped.push({ tag: el.tagName.toLowerCase(), text: (el.textContent ?? '').slice(0, 40) });
        }
      }
      return { overflow, spills: spills.slice(0, 6), spillCount: spills.length, clipped: clipped.slice(0, 4) };
    });

    const bad = report.overflow > 0 || report.spillCount > 0 || report.clipped.length > 0;
    if (bad) failures += 1;
    console.log(
      `  ${bad ? 'FAIL' : ' ok '}  ${size.name.padEnd(24)} overflow:${String(report.overflow).padStart(4)}  spills:${report.spillCount}  clipped:${report.clipped.length}`,
    );
    for (const s of report.spills) console.log(`         ↳ <${s.tag}> ${s.left}..${s.right}  ${s.cls}`);
    for (const c of report.clipped) console.log(`         ↳ clipped <${c.tag}> "${c.text}"`);

    if (shots) {
      const tag = path === '/' ? 'home' : 'pricing';
      await page.screenshot({ path: `.responsive/${tag}-${size.w}.png`, fullPage: size.w <= 414 });
    }
    await page.close();
  }
}

await browser.close();
console.log(`\n${failures === 0 ? 'ALL CLEAN' : failures + ' viewport(s) with faults'}`);
