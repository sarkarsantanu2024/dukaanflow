/**
 * Facebook cards — one square image per screen a shopkeeper actually uses.
 *
 *   npm i -D playwright                            # once, if not already there
 *   npm run dev                                    # in another terminal
 *   ADMIN_PASSWORD=... npm run social:cards
 *
 * PLAYWRIGHT IS NOT A DEPENDENCY OF THIS PROJECT, deliberately. It is a browser
 * automation tool for making pictures on a laptop, and the deployed app has no
 * use for it — so `scripts/` is excluded from `tsconfig.json` and typechecked by
 * `tsconfig.scripts.json` instead. It is not an oversight; putting it back into
 * the build is what broke a production deploy on 2026-09-10.
 *
 * SEPARATE FROM `npm run tour:shots`, AND FOR A DIFFERENT AUDIENCE. The tour
 * images in `public/tour/` are raw screens, shown by an operator sitting beside
 * a shopkeeper who is asking questions. These are seen for about a second and a
 * half while somebody scrolls, by a person who has never heard of the product
 * — so the screen is only half of it and the sentence beside it is the rest.
 *
 * NO CONSOLE SCREENS. The Super Admin console is our back office; a shopkeeper
 * has no account on it, and posting pictures of a screen that lists every shop
 * advertises the wrong product to the wrong people.
 *
 * A phone screen is 390×844, near enough 1:2.2, and no amount of scaling makes
 * that a square. So each screenshot is composed onto a branded ground with the
 * caption above it, which is what the shape is for.
 *
 * BENGALI CAPTIONS, NOT ENGLISH ONES. Same reasoning as `lib/marketing-copy.ts`
 * — this is aimed at the person who will hold the phone, and that person thinks
 * in Bengali. The screenshots underneath are in Bengali too, so an English
 * caption would be a label in one language over a picture in another.
 */
import { chromium, type Browser } from 'playwright';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { BRAND_GREEN, BRAND_GROUND, BRAND_WORDMARK } from '../lib/brand';

const BASE = process.env.TOUR_BASE_URL || 'http://localhost:3000';
/** The demo shop, and the only shop this script may open. See `tour-screenshots.ts`. */
const SHOP = 'demo-grocery';
const OUT = path.join(process.cwd(), 'public', 'social');
const LOGO = path.join(process.cwd(), 'public', 'brand', 'halkhata-logo-192.png');

/** Facebook's square feed post. Also serviceable on WhatsApp status. */
const CARD = 1080;

/** The phone the screens are captured on, before being composed. */
const PHONE = { width: 390, height: 844 };

type Card = {
  file: string;
  url: string;
  /** The promise, in the words a shopkeeper would use it in. */
  headline: string;
  /** One line under it. Never a second sentence — nobody reads the second. */
  sub: string;
};

const CARDS: Card[] = [
  {
    file: '01-khata.png',
    url: `/owner/${SHOP}/khata`,
    headline: 'বাকির খাতা আর হারাবে না',
    sub: 'কে কত দেবে, এক জায়গায় — যোগ করার দরকার নেই',
  },
  {
    file: '02-storefront.png',
    url: `/shop/${SHOP}`,
    headline: 'খদ্দের QR স্ক্যান করে অর্ডার করবে',
    sub: 'কোনও অ্যাপ নামাতে হবে না — না আপনার, না তাঁর',
  },
  {
    file: '03-orders.png',
    url: `/owner/${SHOP}/orders`,
    headline: 'ব্যস্ত ছিলেন বলে অর্ডার হারাবে না',
    sub: 'অর্ডার অ্যাপে জমা থাকে, আর এলেই ফোন বেজে ওঠে',
  },
  {
    file: '04-items.png',
    url: `/owner/${SHOP}/inventory`,
    headline: 'বলে বলে জিনিস যোগ করুন',
    sub: 'নিজের ভাষায় — লিখতে না পারলেও চলবে',
  },
  {
    file: '05-sell.png',
    url: `/owner/${SHOP}/sell`,
    headline: 'দোকানের বিক্রিও এই অ্যাপেই',
    sub: 'ক্যাশ হোক বা UPI — দিনের হিসাব একটাই',
  },
];

async function signIn(browser: Browser) {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error('Set ADMIN_PASSWORD to this environment’s console password.');

  const context = await browser.newContext();
  const response = await context.request.post(`${BASE}/api/admin/login`, {
    headers: { Origin: BASE, 'Content-Type': 'application/json' },
    data: { username, password },
  });
  if (!response.ok()) throw new Error(`Sign-in failed (${response.status()}).`);
  return context.storageState();
}

/**
 * The card, as a page.
 *
 * Built as HTML and photographed rather than drawn on a canvas: the type is the
 * hard part — Bengali needs real shaping, and a canvas `fillText` of যুক্তাক্ষর
 * is a lottery across platforms. A browser already renders this correctly
 * everywhere, which is the whole reason the product is a web app.
 */
function cardHtml(card: Card, screenshot: string, logo: string): string {
  const { head, tail } = BRAND_WORDMARK;

  return `<!doctype html>
<html lang="bn"><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${CARD}px; height: ${CARD}px;
    background: ${BRAND_GROUND};
    font-family: 'Noto Sans Bengali', system-ui, sans-serif;
    display: flex; flex-direction: column;
    overflow: hidden;
  }
  /* A green band behind the words and a pale ground under the screen: the
     caption has to win the first glance, and dark type on the light half would
     compete with the screenshot's own colours instead of framing them.

     THE BAND IS KEPT DELIBERATELY SHALLOW. Every pixel it takes is a pixel of
     the actual product nobody sees, and the screen is what this post is for —
     somebody scrolling decides whether this is a shop app from the picture, not
     from the sentence. The caption earns roughly a sixth of the card and the
     phone takes the rest. */
  .top {
    background: ${BRAND_GREEN};
    padding: 28px 44px 24px;
    color: #fff;
  }
  .mark { display: flex; align-items: center; gap: 9px; margin-bottom: 12px; }
  .mark img { width: 32px; height: 32px; border-radius: 7px; background: #fff; }
  .mark span { font-size: 21px; font-weight: 700; letter-spacing: -0.01em; }
  .mark .tail { opacity: 0.72; }
  h1 { font-size: 41px; line-height: 1.2; font-weight: 700; letter-spacing: -0.01em; }
  p  { margin-top: 9px; font-size: 21px; line-height: 1.4; opacity: 0.88; font-weight: 400; }

  .bottom { flex: 1; position: relative; display: flex; justify-content: center; }
  /* The phone sits proud of the fold and is cropped by the card's edge, which
     reads as a screen continuing past the frame rather than a picture that ran
     out. */
  .phone {
    margin-top: -18px;
    /* THE SCREEN IS THE POST. It gets nearly two thirds of the card's width.
       At 700px a 390×844 screen stands ~1515px tall against roughly 900px of
       room, so it is cut off by the bottom edge — which is the intent: a screen
       carrying on past the frame, not a small picture floating on a big card.
       What survives the crop is the top of the screen, which is where every one
       of these puts the thing worth seeing. */
    width: 700px;
    border-radius: 30px 30px 0 0;
    border: 8px solid #10241d;
    border-bottom: none;
    overflow: hidden;
    box-shadow: 0 18px 44px rgba(16, 36, 29, 0.28);
    background: #fff;
  }
  .phone img { display: block; width: 100%; }
</style></head>
<body>
  <div class="top">
    <div class="mark">
      <img src="${logo}" alt="">
      <span>${head}<span class="tail">${tail}</span></span>
    </div>
    <h1>${card.headline}</h1>
    <p>${card.sub}</p>
  </div>
  <div class="bottom">
    <div class="phone"><img src="${screenshot}" alt=""></div>
  </div>
</body></html>`;
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch();
  const storageState = await signIn(browser);
  const logo = `data:image/png;base64,${(await readFile(LOGO)).toString('base64')}`;

  for (const card of CARDS) {
    // 1. The screen itself, on a phone, at 2× so it stays sharp once scaled
    //    down into the card.
    const phone = await browser.newContext({
      storageState,
      viewport: PHONE,
      deviceScaleFactor: 2,
      locale: 'bn-IN',
      isMobile: true,
      hasTouch: true,
    });
    const page = await phone.newPage();
    /**
     * `load`, NOT `networkidle`, and 90s rather than Playwright's default 30.
     *
     * The Orders screen polls for new orders while it is visible, so the
     * network on that route is never idle and `networkidle` waits until it
     * gives up. And against a cold `next dev` the first hit on a route compiles
     * it, which on the owner screens runs well past thirty seconds.
     *
     * These pages are server-rendered, so their content is in the first
     * response; `load` plus a beat for fonts and images is all the settling
     * that is actually needed.
     */
    const response = await page.goto(`${BASE}${card.url}`, {
      waitUntil: 'load',
      timeout: 90_000,
    });

    if ((response?.status() ?? 0) >= 400) {
      console.error(`  !! ${card.file} — ${card.url} returned ${response?.status()}, skipped`);
      await phone.close();
      continue;
    }

    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
    // Fonts, the logo, and any image the screen carries.
    await page.waitForTimeout(1500);
    const shot = await page.screenshot();
    await phone.close();

    // 2. The card, at exactly Facebook's square, with the screen composed in.
    const canvas = await browser.newContext({ viewport: { width: CARD, height: CARD } });
    const cardPage = await canvas.newPage();
    await cardPage.setContent(
      cardHtml(card, `data:image/png;base64,${shot.toString('base64')}`, logo),
      { waitUntil: 'networkidle' },
    );
    // Bengali comes from a web font; photographing before it lands gives a card
    // set in the fallback, which is exactly the thing nobody notices until it
    // is published.
    await cardPage.evaluate(() => document.fonts.ready);
    await cardPage.waitForTimeout(400);

    await cardPage.screenshot({ path: path.join(OUT, card.file) });
    await canvas.close();

    console.log(`  ${card.file}  ←  ${card.url}`);
  }

  await browser.close();
  console.log(`\n${CARDS.length} cards in public/social/, ${CARD}×${CARD}.\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
