/**
 * The Halkhata mark, as data.
 *
 * A monogram, not a pictogram. The first two attempts drew a little shop —
 * first as an outline, then as solids — and both looked like something out of
 * an icon set rather than a brand: the same visual language as the search
 * magnifier and the trash can sitting three inches away, which is exactly what
 * makes a logo look like a UI element.
 *
 * This is a **D**, cut through on the diagonal. The cut is the flow: a letter
 * sliced by motion reads as speed at any size, and it is a shape nothing else
 * in a phone's app drawer shares. The mark carries the product's initial, which
 * is what makes it a mark rather than a drawing of a shop.
 *
 * ONE PATH, `fill-rule: evenodd`. The counter of the D and the diagonal cut are
 * both holes in the same filled shape, so they show whatever is behind the mark
 * — a green tile, the console's dark rail, a launcher's wallpaper — with no
 * per-context colours to keep in step.
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
  // The eye of a QR code — the square-in-square every phone camera is trained
  // on, and the one symbol that says "scan me" with no words at all.
  {
    evenOdd: true,
    d:
      // The ring.
      'M6 10.4h4.4a3.2 3.2 0 0 1 3.2 3.2v4.4a3.2 3.2 0 0 1-3.2 3.2H6a3.2 3.2 0 0 1-3.2-3.2v-4.4A3.2 3.2 0 0 1 6 10.4Z' +
      // Its opening.
      'M6.6 13.2h3.2a1.4 1.4 0 0 1 1.4 1.4v2.4a1.4 1.4 0 0 1-1.4 1.4H6.6a1.4 1.4 0 0 1-1.4-1.4v-2.4a1.4 1.4 0 0 1 1.4-1.4Z',
  },
  // The pupil.
  {
    d: 'M7.8 14.8h.8a.8.8 0 0 1 .8.8v.8a.8.8 0 0 1-.8.8h-.8a.8.8 0 0 1-.8-.8v-.8a.8.8 0 0 1 .8-.8Z',
  },
  // Three modules breaking off the code and climbing away to the right, each
  // bigger than the last: the order leaving the counter, and the shop growing
  // because of it. This is the half of the mark that is not a QR code, and it
  // is what stops the whole thing reading as a scanner app.
  // Centres on one 45° line, sizes 3.2 → 3.8 → 4.0, so the eye is read first
  // and the trail carries the eye up and out of the frame.
  {
    d: 'M15.1 13.4h1.4a.9.9 0 0 1 .9.9v1.4a.9.9 0 0 1-.9.9h-1.4a.9.9 0 0 1-.9-.9v-1.4a.9.9 0 0 1 .9-.9Z',
  },
  {
    d: 'M18 9.7h1.6a1.1 1.1 0 0 1 1.1 1.1v1.6a1.1 1.1 0 0 1-1.1 1.1H18a1.1 1.1 0 0 1-1.1-1.1v-1.6A1.1 1.1 0 0 1 18 9.7Z',
  },
  {
    d: 'M20.8 5.6h1.6a1.2 1.2 0 0 1 1.2 1.2v1.6a1.2 1.2 0 0 1-1.2 1.2h-1.6a1.2 1.2 0 0 1-1.2-1.2V6.8a1.2 1.2 0 0 1 1.2-1.2Z',
  },
];
