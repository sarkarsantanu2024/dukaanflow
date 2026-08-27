/**
 * Turning the text on a packet into an item.
 *
 * The photograph is read in the browser, so there is no model, no key and no
 * per-photo cost — but also no understanding. OCR returns whatever ink it can
 * see: the product name, the brand, the FSSAI number, "best before", and a
 * quantity somewhere in the middle. The job here is to find the item in that.
 *
 * Matching against the shop-type catalogue rather than trusting the raw text is
 * what makes the result usable. The catalogue already holds the name the way a
 * shopkeeper says it, in all three languages, so a hit gives a correct item
 * rather than a line of marketing off a wrapper.
 */

import type { StarterItem } from './starter-catalogue';

/** Lowercased, punctuation flattened to spaces, so tokens compare cleanly. */
function normalise(text: string): string {
  return ` ${text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim()} `;
}

/**
 * The catalogue item whose name appears, in full, in the scanned text.
 *
 * Every word of the name must be present — a packet saying "rice" must not
 * match "Rice Flour" — and where several fit, the longest name wins, so
 * "Basmati Rice" beats plain "Rice" on a packet that says both. That ordering
 * is the whole trick: specific before general, and nothing at all rather than
 * a plausible guess.
 */
export function matchCatalogue(text: string, catalogue: StarterItem[]): StarterItem | null {
  const haystack = normalise(text);
  if (haystack.trim().length < 2) return null;

  let best: StarterItem | null = null;

  for (const item of catalogue) {
    const words = normalise(item.name).trim().split(' ');
    const hit = words.every((word) => word.length > 1 && haystack.includes(` ${word} `));
    if (!hit) continue;
    if (!best || item.name.length > best.name.length) best = item;
  }

  return best;
}

const UNIT_PATTERN =
  /(\d+(?:[.,]\d+)?)\s*(kgs?|gms?|grams?|g|ml|ltrs?|litres?|liters?|l|pcs?|pieces?)\b/i;

/** How each written form is spelled once it reaches an item. */
const UNIT_CANON: Record<string, string> = {
  kg: 'kg',
  kgs: 'kg',
  g: 'g',
  gm: 'g',
  gms: 'g',
  gram: 'g',
  grams: 'g',
  ml: 'ml',
  l: 'l',
  ltr: 'l',
  ltrs: 'l',
  litre: 'l',
  litres: 'l',
  liter: 'l',
  liters: 'l',
  pc: 'pc',
  pcs: 'pc',
  piece: 'pc',
  pieces: 'pc',
};

/**
 * The pack size printed on the packet, if there is one.
 *
 * Read independently of the name, because it is useful even when the item is
 * not recognised — "500 g" of something the owner will name themselves still
 * saves them a field. Returns empty rather than guessing: a wrong pack size is
 * worse than an absent one, since it silently changes what a customer is
 * quoted.
 */
export function extractUnit(text: string): string {
  const match = UNIT_PATTERN.exec(text);
  if (!match) return '';

  const amount = match[1].replace(',', '.');
  const canon = UNIT_CANON[match[2].toLowerCase()];
  if (!canon) return '';

  // "1.0 kg" reads as "1 kg" on a shelf.
  const tidy = amount.endsWith('.0') ? amount.slice(0, -2) : amount;
  return `${tidy} ${canon}`;
}

export type ScannedLine = { text: string; confidence: number; height: number };

/**
 * The line most likely to be the product's name, when the catalogue has no
 * match — on a packet, the product is almost always the largest text.
 *
 * Deliberately conservative: short fragments, low-confidence reads and lines
 * that are mostly digits are all rejected, because the alternative to a
 * suggestion here is an empty field the owner fills in a second, and a wrong
 * name they have to notice and correct is far more expensive than that.
 */
export function pickLikelyName(lines: ScannedLine[]): string {
  const candidates = lines
    .map((line) => ({ ...line, text: line.text.trim() }))
    .filter((line) => {
      if (line.confidence < 70) return false;
      const letters = line.text.replace(/[^a-zA-Z]/g, '');
      return letters.length >= 3 && letters.length >= line.text.length / 2;
    });

  if (candidates.length === 0) return '';

  const biggest = candidates.reduce((tallest, line) =>
    line.height > tallest.height ? line : tallest,
  );

  // Title case, trimmed to the item-name limit the API enforces anyway.
  return biggest.text
    .slice(0, 80)
    .toLowerCase()
    .replace(/\b[a-z]/g, (character) => character.toUpperCase());
}
