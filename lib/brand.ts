/**
 * The Halkhata mark.
 *
 * A supplied illustration — the হালখাতা itself: the red cloth-bound ledger a
 * shop opens on Poila Boishakh, tied in white string, with শ্রী in a green seal,
 * Ganesh and Lakshmi on the cover and mango leaves at its foot. Held as a PNG
 * in `public/brand/`. The mark is the thing the product is named after, which is
 * the whole of the idea.
 *
 * IT IS A PICTURE, NOT A GLYPH, AND THAT CHANGES THE RULES. The earliest marks
 * here were single-colour vectors that took `currentColor`, so one shape served
 * the green header, the console's dark rail and a knocked-out tile without a
 * second asset. This one carries its own colours and cannot be recoloured, so:
 *
 *   - `tone="dark"` no longer tints the mark, only the wordmark beside it, and
 *     THE DARK RAIL PUTS A WHITE TILE BEHIND IT. The ledger's red would survive
 *     the rail on its own, but the mango leaves are a green very close to it and
 *     simply disappear. The tile is there to keep the leaves, not to decorate.
 *   - Every size is a separate file. They are generated, not hand-cut — see
 *     `scripts/build-brand-icons.ts`, and re-run it if the artwork changes.
 *   - The art is trimmed and re-squared during generation. The source sits off
 *     centre, the leaves pushing it right and low, which would otherwise make
 *     every launcher icon look like it had slipped inside its tile.
 *
 * The mark is deliberately never placed against `brand-600`: it is mostly red,
 * and red on the interface green is the one pairing that fights. It sits on
 * white, on the dark rail's tile, or on the poster's paper.
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
 * Keep `package.json`, `package-lock.json` and the README in step by hand —
 * none of them can import from here. The icons no longer need saying: they are
 * generated from one master by `scripts/build-brand-icons.ts`.
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

/**
 * THE one colour — `brand-600` in the Tailwind scale, and the manifests'
 * `theme_color`.
 *
 * Anywhere outside a Tailwind class has to read it from here: the poster's
 * canvas, three web manifests, the viewport meta and the offline page inside
 * the service worker. It was typed out in eight of those places and every one
 * of them was still the old, hotter, inaccessible green after the scale moved.
 */
export const BRAND_GREEN = '#0e7490';

/**
 * The ground the app sits on — `bg-app`, and the manifests' `background_color`,
 * which is what an installed app paints while it starts. A mismatch here is
 * visible as a flash of the wrong colour every single launch.
 */
export const BRAND_GROUND = '#f0f0ee';

/**
 * Where each rendition of the mark lives.
 *
 * `master` is the full-resolution transparent art. `small` is what the
 * interface uses — a 96px copy, because the header draws the mark at 28px and
 * shipping a 468px PNG to do it costs a quarter of a megabyte per page.
 *
 * The launcher sizes sit on white rather than transparency on purpose: iOS
 * composites a transparent icon onto black, which would stand this artwork's
 * white binding string and its ribbon on a black tile.
 */
export const BRAND_LOGO = {
  master: '/brand/halkhata-logo.png',
  small: '/brand/halkhata-logo-96.png',
  icon192: '/brand/halkhata-logo-192.png',
  icon512: '/brand/halkhata-logo-512.png',
  maskable512: '/brand/halkhata-logo-maskable-512.png',
} as const;

/** Alt text wherever the mark is rendered as an image rather than decoration. */
export const BRAND_LOGO_ALT = `${BRAND_NAME} logo`;
