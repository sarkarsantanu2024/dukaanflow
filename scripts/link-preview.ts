/**
 * The picture that comes with a link to the landing page.
 *
 *   npm run social:preview
 *
 * WHY IT EXISTS. The landing page is passed round on WhatsApp far more than it
 * is found on Google, and a link with no `og:image` arrives as a grey line of
 * text under somebody's message. This is the card WhatsApp, Facebook and X
 * show instead: `public/social/link-preview.png`, 1200×630, the shape all
 * three crop to. `app/page.tsx` points its `openGraph` and `twitter` images at
 * it.
 *
 * NO SERVER, NO SIGN-IN, NO DATABASE. Unlike `social:cards`, which photographs
 * live screens of the demo shop, this composes a screen the tour already ships
 * (`public/tour/02-items.png`) onto a branded ground. Run it after the tour
 * screenshots are retaken, and whenever the headline changes.
 *
 * BUILT AS HTML AND PHOTOGRAPHED, for the same reason `social-cards.ts` gives:
 * the headline is Bengali, which needs real shaping, and a browser already does
 * that correctly. Playwright is a laptop tool here, not a dependency of the
 * app — see the note at the top of `social-cards.ts`.
 *
 * THE HEADLINE IS THE PAGE'S HEADLINE. The Bengali sentence an owner says,
 * with one English line under it for the person deciding — the preview is seen
 * by both, in a chat, for about a second.
 */
import { chromium } from 'playwright';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { BRAND_GREEN, BRAND_WORDMARK } from '../lib/brand';

const OUT = path.join(process.cwd(), 'public', 'social', 'link-preview.png');
const LOGO = path.join(process.cwd(), 'public', 'brand', 'halkhata-logo-192.png');
const SCREEN = path.join(process.cwd(), 'public', 'tour', '02-items.png');

/** The Open Graph card: 1.91:1, what WhatsApp, Facebook and X all expect. */
const WIDTH = 1200;
const HEIGHT = 630;

async function dataUrl(file: string) {
  return `data:image/png;base64,${(await readFile(file)).toString('base64')}`;
}

function cardHtml(logo: string, screen: string): string {
  const { head, tail } = BRAND_WORDMARK;

  return `<!doctype html>
<html lang="bn"><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700&family=Noto+Sans:wght@400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  /* The cream of the landing page's fold, not white: the preview should look
     like the page it opens. */
  body {
    width: ${WIDTH}px; height: ${HEIGHT}px;
    background: #f9f3eb;
    font-family: 'Noto Sans Bengali', 'Noto Sans', system-ui, sans-serif;
    color: #0f172a;
    display: flex; overflow: hidden; position: relative;
  }
  .glow {
    position: absolute; right: -120px; top: -160px;
    width: 620px; height: 620px; border-radius: 50%;
    background: rgba(4, 122, 60, 0.14); filter: blur(60px);
  }
  .words {
    position: relative; flex: 1;
    padding: 64px 0 56px 72px;
    display: flex; flex-direction: column;
  }
  .mark { display: flex; align-items: center; gap: 14px; }
  .mark img { width: 56px; height: 56px; border-radius: 14px; background: #fff; padding: 4px; }
  .mark span { font-family: 'Noto Sans', sans-serif; font-size: 34px; font-weight: 700; letter-spacing: -0.01em; color: #0f172a; }
  /* The logotype's red, at the shade that holds contrast on cream. */
  .mark .tail { color: #b80d19; }
  .say {
    margin-top: 44px;
    display: inline-flex; align-self: flex-start;
    padding: 8px 18px; border-radius: 999px;
    background: #fff; color: #046b35;
    font-size: 24px; font-weight: 600;
    box-shadow: 0 2px 10px rgba(15, 23, 42, 0.08);
  }
  h1 { margin-top: 18px; font-size: 76px; line-height: 1.1; font-weight: 700; letter-spacing: -0.01em; }
  p {
    margin-top: auto;
    font-family: 'Noto Sans', sans-serif;
    font-size: 27px; line-height: 1.4; color: #334155; max-width: 560px;
  }
  p b { color: ${BRAND_GREEN}; font-weight: 600; }
  /* The phone stands proud of the bottom edge and is cut by it — a screen
     carrying on past the frame, as on the square cards. */
  .phone {
    position: relative; align-self: flex-start;
    margin: 56px 88px 0 0;
    width: 330px;
    border-radius: 34px 34px 0 0;
    border: 9px solid #1e293b; border-bottom: none;
    overflow: hidden; background: #fff;
    box-shadow: 0 24px 60px rgba(15, 23, 42, 0.28);
  }
  .phone img { display: block; width: 100%; }
</style></head>
<body>
  <div class="glow"></div>
  <div class="words">
    <div class="mark">
      <img src="${logo}" alt="">
      <span>${head}<span class="tail">${tail}</span></span>
    </div>
    <div class="say">দোকান সাজান মুখে বলে</div>
    <h1>“চাল ১ কেজি ১০০”</h1>
    <p lang="en">Speak your shop online. QR orders, the udhaar khata, <b>no commission</b>.</p>
  </div>
  <div class="phone"><img src="${screen}" alt=""></div>
</body></html>`;
}

async function main() {
  await mkdir(path.dirname(OUT), { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT } });
  const page = await context.newPage();
  await page.setContent(cardHtml(await dataUrl(LOGO), await dataUrl(SCREEN)), {
    waitUntil: 'networkidle',
  });
  // Photographing before the web font lands gives a card set in the fallback,
  // which is exactly the thing nobody notices until it is published.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  await page.screenshot({ path: OUT });
  await browser.close();
  console.log(`  ${path.relative(process.cwd(), OUT)}  ${WIDTH}×${HEIGHT}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
