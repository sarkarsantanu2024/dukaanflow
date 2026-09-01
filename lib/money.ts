/**
 * Money.
 *
 * Two units live here, and which one a number is in must be obvious from its
 * name — a rupee figure passed to a paise function is off by a hundred and
 * looks perfectly plausible in a UI.
 *
 *  - **Rupees** — what a shop charges for what it sells. Item prices, order
 *    totals, the khata: whole rupees, as they have been throughout.
 *  - **Paise** — what Halkhata charges the shop. Billing needs finer grain
 *    than a rupee because the listing service is priced at 50 paise an item,
 *    and rounding every line would either lose money or overcharge.
 *
 * Anything holding paise says so in its name (`amountPaise`, `PAISE_PER_ITEM`).
 * A bare `amount` or `price` is rupees.
 */

/**
 * THERE IS NO `formatRupees` HERE ANY MORE, AND THAT IS DELIBERATE.
 *
 * It existed until every stored amount became paise, and then it survived the
 * conversion as a working function that took a number and returned a plausible
 * price — so a dozen call sites went on handing it paise and printing a hundred
 * times the real figure. ₹10 of atta showed as ₹1,000 and nothing complained,
 * because both units are plain integers and the compiler cannot tell them
 * apart.
 *
 * `formatPaise` below is the only way to render money. Deleting the other one
 * is what makes the mistake impossible rather than merely discouraged.
 */

export const PAISE_PER_RUPEE = 100;

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * PAISE_PER_RUPEE);
}

/**
 * What a shopkeeper typed, as paise. "12.50" → 1250. "12.5" → 1250. "12" → 1200.
 *
 * Parsed as text, NOT as `parseFloat(value) * 100`. That expression is wrong for
 * money in a way that is invisible in testing: 12.10 in binary floating point is
 * 12.099999999999999645, times 100 is 1209.9999999999998, and `Math.round`
 * rescues that one but not every one — 8.165 rounds the wrong way, and a price
 * list drifts a paisa at a time with nothing in the UI to show it. Splitting on
 * the decimal point and reading each side as an integer cannot drift at all.
 *
 * Returns null for anything that is not a plain amount, so a caller must decide
 * what to do about it rather than being handed a silent zero.
 */
export function parsePaise(value: string): number | null {
  const text = value.trim().replace(/^₹\s*/, '').replace(/,/g, '');
  // Optional rupees, optional decimal point, at most two paise digits.
  const match = /^(\d*)(?:\.(\d{0,2}))?$/.exec(text);
  if (!match || (match[1] === '' && match[2] === undefined)) return null;

  const rupees = match[1] === '' ? 0 : Number(match[1]);
  // "12.5" means fifty paise, not five: the first digit after the point is
  // tenths of a rupee. Padding right rather than left is the whole difference.
  const paise = match[2] === undefined ? 0 : Number(match[2].padEnd(2, '0'));
  return rupees * PAISE_PER_RUPEE + paise;
}

/**
 * Paise as the text an input should hold — "1250" → "12.50", "1200" → "12".
 *
 * The trailing ".00" is dropped so a shop whose prices are all whole rupees
 * never sees a field full of decimals it did not type.
 */
export function paiseToInput(paise: number): string {
  const rounded = Math.round(paise);
  const remainder = rounded % PAISE_PER_RUPEE;
  const rupees = Math.trunc(rounded / PAISE_PER_RUPEE);
  return remainder === 0
    ? String(rupees)
    : `${rupees}.${String(remainder).padStart(2, '0')}`;
}

/**
 * What one line of an order or a bill comes to.
 *
 * THE ONE PLACE A QUANTITY MEETS A PRICE. Quantities are no longer whole — a
 * customer buying fifty grams of a kilo-priced item sends 0.05 — and
 * `pricePaise * quantity` in floating point produces 6500.000000000001 as
 * readily as 6500. Rounding here, once, at the moment the two are multiplied, is
 * what keeps a total equal to the sum of the lines a shopkeeper can see.
 *
 * Every caller that prices a line must use this rather than the bare product,
 * or two screens will disagree about a bill by a paisa and neither will be able
 * to explain why.
 */
export function linePaise(pricePaise: number, quantity: number): number {
  return Math.round(pricePaise * quantity);
}

/**
 * "₹1,250" for a round figure, "₹12.50" when there are paise.
 *
 * The trailing ".00" is dropped on purpose: nearly every amount in this product
 * is whole rupees, and printing two zeroes on all of them to accommodate the
 * rare half-rupee makes every price harder to read at a glance on a phone.
 */
export function formatPaise(paise: number): string {
  const rounded = Math.round(paise);
  const rupees = Math.trunc(rounded / PAISE_PER_RUPEE);
  const remainder = Math.abs(rounded % PAISE_PER_RUPEE);
  const whole = new Intl.NumberFormat('en-IN').format(rupees);
  return remainder === 0 ? `₹${whole}` : `₹${whole}.${String(remainder).padStart(2, '0')}`;
}

/** The same figure without grouping, for a WhatsApp message or a UPI intent. */
export function plainPaise(paise: number): string {
  const rounded = Math.round(paise);
  const remainder = Math.abs(rounded % PAISE_PER_RUPEE);
  const rupees = Math.trunc(rounded / PAISE_PER_RUPEE);
  return remainder === 0 ? `₹${rupees}` : `₹${rupees}.${String(remainder).padStart(2, '0')}`;
}

/**
 * The `am=` value a UPI intent takes: rupees, with paise after the point.
 *
 * Always two decimals here, unlike the display helpers — a payment app is
 * parsing this, not a person reading it.
 */
export function paiseToUpiAmount(paise: number): string {
  return (Math.round(paise) / PAISE_PER_RUPEE).toFixed(2);
}
