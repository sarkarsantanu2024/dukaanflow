/**
 * Takes the eight screenshots the product guide expects in `public/tour/`.
 *
 *   npm i -D playwright                           # once, if not already there
 *   npm run dev                                   # in another terminal
 *   ADMIN_PASSWORD=... npm run tour:shots
 *
 * PLAYWRIGHT IS NOT A DEPENDENCY OF THIS PROJECT, deliberately — see the same
 * note in `social-cards.ts`. `scripts/` is excluded from `tsconfig.json` so
 * `next build` never tries to typecheck it.
 *
 * WHY THIS IS A SCRIPT AND NOT EIGHT MANUAL SCREENSHOTS. The guide at
 * `/admin/dashboard` is the deck an operator shows a shopkeeper, and a deck
 * whose pictures are two redesigns out of date is worse than one with none —
 * the placeholder at least admits it does not know. Regenerating has to be one
 * command or it will not happen.
 *
 * IT ONLY EVER PHOTOGRAPHS THE DEMO SHOP. These files are committed and served
 * publicly, so a real shop's screen — with a real customer's name and phone
 * number on it — must never end up in one. `SHOP` below is the slug the demo
 * seeder creates, and the two console screens are chosen for the same reason:
 * `/admin/shops/new` is an empty form, and the report is scoped to the demo
 * shop by name rather than being the all-shops view.
 *
 *   npm run demo -- --orders     # creates that shop, its trade and its khata
 *
 * Phone screens are shot at the viewport rather than full-page: the tour is
 * showing what a shopkeeper sees when they open the app, and a tall stitched
 * image of a scrolled page is not that.
 */
import { chromium, type Browser } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const BASE = process.env.TOUR_BASE_URL || 'http://localhost:3000';
/** The demo shop, and the only shop this script is allowed to open. */
const SHOP = 'demo-grocery';
const OUT = path.join(process.cwd(), 'public', 'tour');

/** A mid-range Android at the size these shops actually hold. */
const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 900 };
/**
 * A tall window, for console pages that are longer than a screen.
 *
 * NOT `fullPage`. A stitched full-page shot paints the sticky action bar and
 * the fixed sidebar where they sat in the viewport — so the "Create shop"
 * button landed across the middle of its own form and the sidebar stopped
 * two-thirds of the way down. Making the window itself tall renders those
 * elements once, in the right place, and the screenshot is a picture of the
 * page rather than a collage of it.
 */
const DESKTOP_TALL = { width: 1280, height: 1600 };

type Shot = {
  file: string;
  url: string;
  viewport: { width: number; height: number };
  fullPage?: boolean;
  /** Extra settling time where a screen animates or draws a canvas. */
  settleMs?: number;
};

const SHOTS: Shot[] = [
  { file: '01-add-shop.png', url: '/admin/shops/new', viewport: DESKTOP_TALL },
  { file: '02-items.png', url: `/owner/${SHOP}/inventory`, viewport: PHONE },
  {
    file: '03-poster.png',
    url: `/admin/shop/${SHOP}/poster`,
    viewport: DESKTOP,
    fullPage: true,
    // The QR is drawn to a canvas; catching it mid-draw gives a white square.
    settleMs: 1200,
  },
  { file: '04-storefront.png', url: `/shop/${SHOP}`, viewport: PHONE },
  { file: '05-orders.png', url: `/owner/${SHOP}/orders`, viewport: PHONE },
  { file: '06-khata.png', url: `/owner/${SHOP}/khata`, viewport: PHONE },
  { file: '07-sell.png', url: `/owner/${SHOP}/sell`, viewport: PHONE },
  {
    file: '08-reports.png',
    // Named outright, which is also what lifts the demo shop's own exclusion
    // from reports. Without the slug this would be every shop you have.
    url: `/admin/reports?shop=${SHOP}&granularity=month`,
    // The report runs to several screens. The tour wants the head of it — the
    // month's numbers, what sold, and where the customers were — not all of it
    // shrunk to unreadable.
    viewport: { width: 1280, height: 1750 },
    settleMs: 800,
  },
];

async function signIn(browser: Browser) {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    throw new Error(
      'Set ADMIN_PASSWORD to the console password for this environment.\n' +
        'It is never read from a file here on purpose — this script signs in as\n' +
        'the one account that can see every shop.',
    );
  }

  // A throwaway context purely to collect the session cookie. `context.request`
  // shares a cookie jar with the pages opened from it, so signing in through
  // the API leaves every later `goto` authenticated without driving the form.
  const context = await browser.newContext();
  const response = await context.request.post(`${BASE}/api/admin/login`, {
    // The route refuses a cross-origin post; say where this came from.
    headers: { Origin: BASE, 'Content-Type': 'application/json' },
    data: { username, password },
  });

  if (!response.ok()) {
    throw new Error(`Sign-in failed (${response.status()}). Check ADMIN_PASSWORD.`);
  }

  return context.storageState();
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch();
  const storageState = await signIn(browser);

  /**
   * Show demo shops in the console.
   *
   * The shop picker on the report hides them by default, so a report scoped to
   * the demo shop rendered under a dropdown reading "Every shop" — the picture
   * disagreeing with the page. This is the same toggle the shops page offers.
   */
  storageState.cookies.push({
    name: 'df_show_demo',
    value: '1',
    domain: new URL(BASE).hostname,
    path: '/',
    expires: -1,
    httpOnly: false,
    secure: false,
    sameSite: 'Lax',
  });

  for (const shot of SHOTS) {
    const context = await browser.newContext({
      storageState,
      viewport: shot.viewport,
      // Retina, so the image still looks sharp projected or on a laptop.
      deviceScaleFactor: 2,
      locale: 'bn-IN',
      // The owner and customer screens are phones; the console is not.
      isMobile: shot.viewport === PHONE,
      hasTouch: shot.viewport === PHONE,
    });

    const page = await context.newPage();
    const response = await page.goto(`${BASE}${shot.url}`, { waitUntil: 'networkidle' });

    const status = response?.status() ?? 0;
    if (status >= 400) {
      console.error(`  !! ${shot.file} — ${shot.url} returned ${status}, skipped`);
      await context.close();
      continue;
    }

    /**
     * The dev server's own floating badge sits in the bottom-left corner of
     * every screen, and a deck shown to a shopkeeper should not have a build
     * tool's logo in the corner of eight slides. It lives in a `nextjs-portal`
     * custom element and only exists in dev, which is where these are taken.
     */
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });

    if (shot.settleMs) await page.waitForTimeout(shot.settleMs);

    await page.screenshot({
      path: path.join(OUT, shot.file),
      fullPage: shot.fullPage ?? false,
    });

    console.log(`  ${shot.file}  ←  ${shot.url}`);
    await context.close();
  }

  await browser.close();
  console.log(`\nWritten to public/tour/. They appear at /admin/dashboard.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
