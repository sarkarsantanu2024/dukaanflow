/**
 * The units a shop of each kind actually sells in.
 *
 * Offered as suggestions, never as a closed list. A kirana sells rice by the
 * kilo, mustard oil by the litre and spinach by the bundle; a tea stall sells
 * by the cup; a restaurant by the plate. Showing a tea stall "500 g" is noise,
 * and the moment a list is exhaustive in a developer's head it has stopped
 * being exhaustive in a shop.
 *
 * So every unit field is a text input with a datalist behind it: the shop's own
 * common units are one tap away, and anything else can still be typed. Ordered
 * by how often that kind of shop reaches for them, not alphabetically, because
 * these render as a list someone scans rather than searches.
 */

import type { ShopType } from '@prisma/client';

// The half and quarter sizes are in here because they are what a kirana
// actually weighs out: a shopper asks for দেড় কেজি চিনি or 750 g of oil, and a
// shop with only a 1 kg row cannot sell it to them — the customer's side can
// only ever order whole packs of what is listed. The field itself has always
// been free text, so an owner could type these; nothing offered them.
const WEIGHT = ['1 kg', '500 g', '250 g', '1.5 kg', '2 kg', '750 g', '200 g', '100 g', '50 g', '5 kg'];
const VOLUME = ['1 l', '500 ml', '250 ml', '750 ml', '2 l', '200 ml', '100 ml'];
const COUNT = ['1 pc', '6 pc', '12 pc', '1 dozen'];
const PACK = ['1 packet', '1 bottle', '1 bundle'];
const SERVING = ['1 plate', 'half plate', '1 bowl', '1 cup', '1 glass'];

const BY_TYPE: Record<ShopType, string[]> = {
  // A kirana weighs and measures nearly everything, and sells greens by the
  // bundle — the one unit no supermarket taxonomy ever has.
  GROCERY: [...WEIGHT, ...VOLUME, ...COUNT, ...PACK],
  RESTAURANT: [...SERVING, ...COUNT, '1 bottle'],
  ROLL_MOMO: ['1 pc', '6 pc', '8 pc', ...SERVING, '1 bottle'],
  TEA_STALL: ['1 cup', '1 glass', '1 pc', '1 plate', '1 bottle', '1 packet'],
  BAKERY: ['1 pc', '1 packet', '1 box', '500 g', '1 kg', '250 g', '6 pc'],
  HOME_KITCHEN: [...SERVING, '1 pc', '1 packet'],
  OTHER: [...WEIGHT, ...VOLUME, ...COUNT, ...PACK, ...SERVING],
};

export function unitsFor(type: ShopType): string[] {
  return BY_TYPE[type] ?? BY_TYPE.OTHER;
}

/** Shared id so one datalist can serve every unit field on a page. */
export const UNIT_LIST_ID = 'halkhata-units';

/**
 * The canonical spelling of a unit, so two ways of typing one thing become one
 * item rather than two rows a customer cannot tell apart.
 *
 * "1KG", "1kg", " 1  kg " and "1 kg" are the same pack size, and only the last
 * of them should ever reach the database. Without this the unique key on
 * (shop, name, unit) is satisfied by every variant spelling, and the shop ends
 * up listing rice at three prices.
 *
 * Lowercase is safe here in a way it would not be for a name: units in this
 * product are already written lowercase throughout `BY_TYPE` above, and a
 * shopkeeper typing "1 KG" means the same shelf as one typing "1 kg".
 */
export function normaliseUnit(value: string): string {
  return value
    .trim()
    .toLowerCase()
    // "1kg" -> "1 kg", "500ml" -> "500 ml": a digit running into a word is a
    // number and its unit, always.
    .replace(/(\d)\s*([a-z])/g, '$1 $2')
    .replace(/\s+/g, ' ');
}

/** Item names keep their capitals; only the spacing is tidied. */
export function normaliseItemName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

/* ------------------------------------------------------------------ */
/* Reading a pack size as an amount                                    */
/* ------------------------------------------------------------------ */

/**
 * A pack size is a NUMBER AND A UNIT, and until now nothing in the product
 * treated it as one.
 *
 * "1 kg" and "500 g" were strings that got compared for equality, so a shopper
 * asking for two kilos of a dal sold in 500 g packets was given two packets —
 * half of what they asked for — and one asking for 250 g of sugar sold by the
 * kilo was given 250 packets, capped at the maximum of 99. Both are arithmetic
 * mistakes, and arithmetic needs numbers.
 *
 * So a pack size parses into an amount in a base unit, and the base is chosen
 * so that everything a shop weighs is comparable in grams, everything it pours
 * in millilitres, and everything it counts in pieces.
 */
export type Dimension = 'mass' | 'volume' | 'count' | 'other';

export type Measure = {
  /** The number the shopkeeper wrote: 500 of "500 g". */
  amount: number;
  /** Canonical unit word: "g", "kg", "l", "pc", "packet"… */
  unit: string;
  dimension: Dimension;
  /**
   * The same amount in the dimension's base unit — grams, millilitres or
   * pieces. For `other` (a packet, a plate, a bundle) there is no base to
   * convert to, so this is the amount itself and only two measures naming the
   * SAME unit may be compared.
   */
  base: number;
};

/**
 * Unit words in the spellings that reach this file.
 *
 * Only roman: `lib/speech.ts` turns কেজি and किलो into "kg" before anything
 * spoken gets here, and the owner's own unit fields go through
 * `normaliseUnit`. Anything unlisted is a unit in its own right — a shop that
 * sells by the "thonga" is not wrong, it just cannot be converted into grams.
 */
const UNIT_BASE: Record<string, { dimension: Dimension; base: number; canonical: string }> = {
  g: { dimension: 'mass', base: 1, canonical: 'g' },
  gm: { dimension: 'mass', base: 1, canonical: 'g' },
  gms: { dimension: 'mass', base: 1, canonical: 'g' },
  gram: { dimension: 'mass', base: 1, canonical: 'g' },
  grams: { dimension: 'mass', base: 1, canonical: 'g' },
  kg: { dimension: 'mass', base: 1000, canonical: 'kg' },
  kgs: { dimension: 'mass', base: 1000, canonical: 'kg' },
  kilo: { dimension: 'mass', base: 1000, canonical: 'kg' },
  kilos: { dimension: 'mass', base: 1000, canonical: 'kg' },
  kilogram: { dimension: 'mass', base: 1000, canonical: 'kg' },
  kilograms: { dimension: 'mass', base: 1000, canonical: 'kg' },
  ml: { dimension: 'volume', base: 1, canonical: 'ml' },
  l: { dimension: 'volume', base: 1000, canonical: 'l' },
  ltr: { dimension: 'volume', base: 1000, canonical: 'l' },
  litre: { dimension: 'volume', base: 1000, canonical: 'l' },
  liter: { dimension: 'volume', base: 1000, canonical: 'l' },
  litres: { dimension: 'volume', base: 1000, canonical: 'l' },
  liters: { dimension: 'volume', base: 1000, canonical: 'l' },
  pc: { dimension: 'count', base: 1, canonical: 'pc' },
  pcs: { dimension: 'count', base: 1, canonical: 'pc' },
  piece: { dimension: 'count', base: 1, canonical: 'pc' },
  pieces: { dimension: 'count', base: 1, canonical: 'pc' },
  dozen: { dimension: 'count', base: 12, canonical: 'dozen' },
};

/** "half plate" and "half kg" both start with a word, not a digit. */
const LEADING_HALF = /^(?:half|aadha|adha|আধা|আধ|হাফ|आधा|आधी)\s+/i;

/**
 * Reads "500 g", "1.5 kg", "12 pc", "half plate" into an amount and a unit.
 *
 * A missing number means one — "packet" on its own is one packet, which is how
 * both shopkeepers and shoppers say it. Returns null only when there is no unit
 * word at all to hang the amount on.
 */
export function parseMeasure(text: string): Measure | null {
  let value = text.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!value) return null;

  let amount: number | null = null;
  if (LEADING_HALF.test(value)) {
    amount = 0.5;
    value = value.replace(LEADING_HALF, '');
  }

  // "1.5 kg", "500g", "1 kg" — the number and the word it belongs to.
  // `\p{M}` alongside `\p{L}`, or a Bengali unit word is cut at its first
  // vowel sign: গ্রাম is গ + ্ + র + া + ম, and three of those five characters
  // are marks rather than letters.
  const match = value.match(/^(\d+(?:\.\d+)?)?\s*([\p{L}\p{M}]+)$/u);
  if (!match) return null;

  if (match[1] !== undefined) amount = Number(match[1]);
  if (amount === null) amount = 1;
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const word = match[2]!;
  const known = UNIT_BASE[word];
  if (known) {
    return {
      amount,
      unit: known.canonical,
      dimension: known.dimension,
      base: amount * known.base,
    };
  }

  // A unit this file has never heard of. Still a measure — "2 bundle" is twice
  // "1 bundle" — but comparable only against its own word.
  return { amount, unit: word, dimension: 'other', base: amount };
}

/** Can these two be divided into one another? */
export function comparableMeasures(a: Measure, b: Measure): boolean {
  if (a.dimension !== b.dimension) return false;
  return a.dimension === 'other' ? a.unit === b.unit : true;
}

/** "1.5", not "1.5000000001" — and "2", not "2.0". */
function tidy(amount: number): string {
  return String(Math.round(amount * 1000) / 1000);
}

/** An amount and its unit, as a shopper reads it: "1.5 kg", "250 g". */
export function formatMeasure(measure: Measure): string {
  return `${tidy(measure.amount)} ${measure.unit}`.trim();
}

/* ------------------------------------------------------------------ */
/* Buying an amount, not a pack                                        */
/* ------------------------------------------------------------------ */

/**
 * A PACK SIZE IS A PRICE BASIS, NOT A MINIMUM.
 *
 * The owner lists poppy seeds at ₹1,500 per kg because that is how the trade
 * quotes it; the customer asks for fifty grams, and both numbers are correct.
 * Halkhata used to hold quantity as a whole count of packs, so that shopper
 * could be offered nothing but a kilo of poppy seeds — ₹1,500 for a spoonful of
 * posto — and a shopper asking for দেড় কেজি চিনি was rounded to two.
 *
 * So a quantity is now a possibly-fractional multiple of the item's unit: 0.05
 * of a "1 kg" is fifty grams, and the money is `pricePaise × quantity`, rounded
 * to the paise once, where the line is priced.
 *
 * Three rules keep that from turning into nonsense elsewhere:
 *
 *  - Only weighed and poured goods divide. Half a plate of chowmein, or 0.4 of
 *    a biscuit packet, is not a thing a shop can hand over — `isLooseUnit`
 *    decides, and counted goods keep the whole-number stepper they always had.
 *  - Every quantity is rounded to `QUANTITY_DP` decimal places before it is
 *    stored or priced, so no float tail ever reaches a total.
 *  - Nothing shows a shopper a bare "0.05". The amount is what is displayed —
 *    "50 g" — everywhere the number appears.
 */

/** Thousandths of a unit: enough for a gram of a kilo. */
export const QUANTITY_DP = 3;

/**
 * THE MOST OF ONE ITEM ANY SINGLE LINE MAY HOLD, in multiples of its own unit.
 *
 * This number was written out as a bare `99` in nine different files — two card
 * steppers, two baskets, the till, the khata picker, the order route and two
 * validation schemas — and the voice parser kept its own copy of it under
 * another name. Nine places that all have to agree, and nothing tying them
 * together: raise the ceiling in the basket and the server silently refuses the
 * order the shopper was allowed to build, or raise it on the server and the
 * card's + button stops one short for no visible reason.
 *
 * It lives here because this is the module that decides what a quantity is.
 * Everything that clamps one imports it.
 *
 * Note what it counts: PACKS, not weight. Ninety-nine of a "250 g" pack is
 * 24.75 kg and ninety-nine of a "1 kg" pack is 99 kg, so the ceiling is a
 * different amount on every row — which is why nothing shown to a shopper may
 * ever print this number raw. `amountLabel(unit, MOST_PER_LINE)` turns it into
 * the amount they were speaking in.
 */
export const MOST_PER_LINE = 99;

/** The least anybody may order of a divisible item, in base units (g or ml). */
export const MIN_LOOSE_BASE = 10;

/** Rounds a quantity to what may be stored, priced and compared. */
export function roundQuantity(quantity: number): number {
  const factor = 10 ** QUANTITY_DP;
  return Math.round(quantity * factor) / factor;
}

/** Is this unit weighed or poured — something a shop can split? */
export function isLooseUnit(unit: string): boolean {
  const pack = parseMeasure(unit);
  return pack !== null && (pack.dimension === 'mass' || pack.dimension === 'volume');
}

/**
 * The amount `quantity` of this unit comes to, as a shopper says it: "50 g",
 * "1.5 kg", "750 ml".
 *
 * Null for anything counted rather than measured, where the count is already
 * the clearest thing to print and "3 × 1 plate" needs no translating.
 */
export function amountLabel(unit: string, quantity: number): string | null {
  const pack = parseMeasure(unit);
  if (!pack || !isLooseUnit(unit)) return null;
  return formatBase(pack.dimension, pack.base * quantity);
}

/** An amount in base units, written in whichever unit reads naturally. */
function formatBase(dimension: Dimension, base: number): string {
  const amount = Math.round(base * 1000) / 1000;
  if (dimension === 'mass') {
    return amount >= 1000 ? `${tidy(amount / 1000)} kg` : `${tidy(amount)} g`;
  }
  if (dimension === 'volume') {
    return amount >= 1000 ? `${tidy(amount / 1000)} l` : `${tidy(amount)} ml`;
  }
  return `${tidy(amount)} pc`;
}

/** Base units (g, ml) → a quantity of `unit`. */
export function quantityFromBase(unit: string, base: number): number {
  const pack = parseMeasure(unit);
  if (!pack || pack.base <= 0) return 0;
  return roundQuantity(base / pack.base);
}

/** A quantity of `unit` → base units (g, ml). */
export function baseFromQuantity(unit: string, quantity: number): number {
  const pack = parseMeasure(unit);
  if (!pack) return 0;
  return Math.round(pack.base * quantity * 1000) / 1000;
}

/**
 * How much one tap of − or + moves the amount.
 *
 * Coarser as the pile gets bigger, because that is how people buy: fifty grams
 * at a time when they are buying a hundred grams of jeera, a quarter kilo at a
 * time when they are buying three kilos of rice. A single fixed step is wrong at
 * one end or the other — 50 g steps mean twenty taps to reach a kilo.
 */
export function stepBase(unit: string, currentBase: number): number {
  const pack = parseMeasure(unit);
  if (!pack) return 1;
  if (pack.dimension === 'volume') {
    if (currentBase < 1000) return 100;
    return currentBase < 5000 ? 250 : 1000;
  }
  // Mass.
  if (currentBase < 1000) return 50;
  return currentBase < 5000 ? 250 : 1000;
}

/**
 * The amounts worth offering as one tap each, for this pack size.
 *
 * The pack's own amount is always in the list — "one kilo" of a kilo-priced
 * item is still the commonest ask — and everything below `MIN_LOOSE_BASE` is
 * dropped, along with anything above five packs, which is what the stepper is
 * for.
 */
export function presetBases(unit: string): number[] {
  const pack = parseMeasure(unit);
  if (!pack || !isLooseUnit(unit)) return [];

  const ladder =
    pack.dimension === 'volume'
      ? [100, 200, 250, 500, 1000, 2000]
      : [50, 100, 250, 500, 1000, 2000];

  const offered = new Set<number>(ladder.filter((base) => base >= MIN_LOOSE_BASE));
  offered.add(pack.base);

  return [...offered].filter((base) => base <= pack.base * 5).sort((a, b) => a - b);
}

/** An amount in base units, for a chip or a readback: "250 g", "1 kg". */
export function baseLabel(unit: string, base: number): string {
  const pack = parseMeasure(unit);
  if (!pack) return String(base);
  return formatBase(pack.dimension, base);
}

/**
 * What `packs` of a counted pack size add up to: three of "12 pc" is "36 pc".
 *
 * Only for counted goods — weighed and poured ones go through `amountLabel`,
 * which is the number the shopper actually chose rather than a multiplication
 * of it. Null where the unit does not add up that way (a plate, a bundle), and
 * for a single pack, where the unit is already printed beside the line.
 */
export function totalMeasure(unit: string, packs: number): string | null {
  const pack = parseMeasure(unit);
  if (!pack || packs <= 0) return null;
  if (pack.dimension !== 'count') return null;
  if (packs === 1) return null;
  return formatBase('count', pack.base * packs);
}
