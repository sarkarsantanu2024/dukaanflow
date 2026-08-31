/**
 * The Halkhata mark, as data.
 *
 * An open ledger, ruled. Two pages with the spine as the gap between them.
 *
 * The mark this replaced was a QR code's eye with three modules climbing away
 * from it — scan the code, the order leaves. That drew the old name: DukaanFlow
 * was about the flow off the counter. The name is now the *book*, so the mark
 * has to be the book, or the logo argues with the word beside it.
 *
 * THE ASYMMETRY IS THE NAME. The left page carries three ruled entries and the
 * right page carries one. হালখাতা is the ledger opened on Poila Boishakh, when
 * the finished year's book is closed and the new one begun with a single line —
 * so the mark is a full page facing a page just started. Without that the shape
 * is a symmetrical open book, which is every notes app in the drawer.
 *
 * TWO PATHS, both `fill-rule: evenodd` — one per page, each with its own ruled
 * lines knocked out of it. The lines are holes rather than a second colour, so
 * they show whatever is behind the mark: a green tile, the console's dark rail,
 * a launcher's wallpaper. Nothing per-context to keep in step.
 *
 * Drawn wide and chunky on purpose. The favicon renders this at 16px, where a
 * hairline rule fills in and a 2px spine gap closes up; the gap here is 2.8
 * units, which survives.
 *
 * KEEP `app/icon.svg` IN STEP WITH THIS. That file is served directly by the
 * framework as the favicon and cannot import anything, so it holds the only
 * other copy of these paths.
 */

/**
 * THE PRODUCT'S NAME, IN ONE PLACE.
 *
 * It used to be typed out in 45 places across 33 files — page titles, two web
 * manifests, the service worker, invite messages, the CSV report header, the
 * pricing page, three languages of owner copy. Renaming meant finding all of
 * them and missing some, which is how products end up half-renamed with the old
 * name surviving in a manifest nobody opens.
 *
 * The name is a live commercial question here, not a settled fact: "Dukaan" is
 * an existing product with over a million stores and "Dukaan AI" is another, so
 * this one may have to move. Making that a one-line change is the point — and
 * it was exercised: the product shipped as "DukaanFlow" and became "Halkhata"
 * by editing the line below.
 *
 * হালখাতা is the fresh ledger a Bengali shop opens on Poila Boishakh, when the
 * old year's book is closed and the new one begun. It is the thing this product
 * actually is, in a word its customers already own, and it collides with
 * nobody.
 *
 * Keep `app/icon.svg`, `package.json` and the README in step by hand — none of
 * them can import from here.
 */
export const BRAND_NAME = 'Halkhata';

/**
 * The name as it appears inside a URL or an id — lowercase, no spaces.
 * Used for storage keys and the manifests' `id`.
 */
export const BRAND_SLUG = BRAND_NAME.toLowerCase().replace(/[^a-z0-9]+/g, '');

/**
 * The wordmark, split where its colour changes.
 *
 * The logotype sets the first half in the text colour and the second in green,
 * which is what makes a compound word read as a name rather than a label. Both
 * halves were typed into the component, so a rename would have left the mark
 * saying the old name while every page around it said the new one.
 *
 * A one-word name simply leaves `tail` empty and loses the colour break, which
 * is the correct behaviour rather than a special case to handle.
 */
export const BRAND_WORDMARK: { head: string; tail: string } = {
  head: 'Hal',
  tail: 'khata',
};

/** The one green. Also the manifests' `theme_color`. */
export const BRAND_GREEN = '#0b9057';

/** One filled shape of the glyph, on a 24×24 viewBox. */
export type LogoShape = { d: string; evenOdd?: boolean };

export const LOGO_SHAPES: LogoShape[] = [
  // THE LEFT PAGE — the year that is finishing, three entries written.
  // Page 2.4→10.6 across, 4.2→19.8 down. The rules are 3.8 wide and centred in
  // it, evenly spaced at 7.9 / 11.4 / 14.9.
  {
    evenOdd: true,
    d:
      // The page.
      'M4.6 4.2h3.8a2.2 2.2 0 0 1 2.2 2.2v11.2a2.2 2.2 0 0 1-2.2 2.2H4.6a2.2 2.2 0 0 1-2.2-2.2V6.4a2.2 2.2 0 0 1 2.2-2.2Z' +
      // Three ruled entries, knocked out.
      'M5.35 7.9h2.3a.75.75 0 0 1 0 1.5H5.35a.75.75 0 0 1 0-1.5Z' +
      'M5.35 11.4h2.3a.75.75 0 0 1 0 1.5H5.35a.75.75 0 0 1 0-1.5Z' +
      'M5.35 14.9h2.3a.75.75 0 0 1 0 1.5H5.35a.75.75 0 0 1 0-1.5Z',
  },
  // THE RIGHT PAGE — the new year, one line in. Same page, one rule, aligned
  // with the topmost rule opposite so the two pages read as one open spread.
  // The 2.8-wide gap between the pages is the spine; it is the whole reason
  // this reads as a book and not as two cards, so do not narrow it.
  {
    evenOdd: true,
    d:
      'M15.6 4.2h3.8a2.2 2.2 0 0 1 2.2 2.2v11.2a2.2 2.2 0 0 1-2.2 2.2h-3.8a2.2 2.2 0 0 1-2.2-2.2V6.4a2.2 2.2 0 0 1 2.2-2.2Z' +
      'M16.35 7.9h2.3a.75.75 0 0 1 0 1.5H16.35a.75.75 0 0 1 0-1.5Z',
  },
];
