/**
 * What the shop has run out of, as a list to hand a vendor.
 *
 * A supplier walks into a kirana once a week and the owner answers from memory
 * and from looking at the shelves — which is why the same two things get
 * forgotten every week and bought twice the week after. Halkhata already knows:
 * the count comes down on every storefront order and every counter sale, and an
 * item that hits zero takes itself off the shop page. This turns that into the
 * one thing the owner actually needs at that moment, which is a list.
 *
 * WHAT COUNTS AS NEEDING REORDER. Two different facts, deliberately both:
 *
 *   - `inStock` false — the owner has said so, whether or not anybody counts
 *     this item. It covers the whole weighed half of a kirana's list, where
 *     `stockQty` is null and always will be: rice comes out of a sack and
 *     nobody is going to type in a number of kilos each morning.
 *   - a count at or below `LOW_STOCK` — the owner is counting this one, and the
 *     point of a reorder list is to reach the vendor BEFORE the shelf is empty.
 *     An item with one packet left is a sale the shop is about to lose.
 *
 * NOTHING HERE DECIDES ANYTHING. The owner unticks whatever they are not buying
 * this week before it is sent — the shop that has stopped stocking an item, the
 * one they buy from somebody else, the one that is out because it is out of
 * season. A list that cannot be edited is a list that gets ignored, and this one
 * has to survive contact with a supplier standing at the counter.
 */

import type { Locale } from './i18n';

/**
 * Two left is the last warning worth giving.
 *
 * Low enough that an ordinary week's stock is not on the list — an owner who
 * opens this and finds their whole catalogue in it will close it and never come
 * back. High enough that the vendor hears about it while there is still
 * something on the shelf.
 */
export const LOW_STOCK = 2;

export type RestockItem = {
  id: string;
  name: string;
  nameBn: string;
  nameHi: string;
  unit: string;
  category: string;
  inStock: boolean;
  /** How many are left, or null where nobody is counting. */
  stockQty: number | null;
};

/** The item's name in the owner's own language, falling back to the primary. */
export function restockName(item: RestockItem, locale: Locale): string {
  if (locale === 'bn') return item.nameBn || item.name;
  if (locale === 'hi') return item.nameHi || item.name;
  return item.name;
}

/*
 * THE PACK SIZE USED TO BE PART OF EVERY LINE AND IS NOT ANY MORE.
 *
 * "মুসুর ডাল — 500 g — 5 kg" reads as three facts of equal weight, and the
 * middle one is the shop's own RETAIL pack — what it breaks the sack down into
 * on its own shelf. A supplier has no use for it: he sells in bostas and
 * cartons, and being told the shop retails in 500 g bags tells him nothing
 * about what to load. Worse, sitting between the name and the amount it reads
 * as a quantity, so "500 g" and "5 kg" on one line look like a contradiction
 * the supplier has to resolve.
 *
 * The line is the name and the amount, and nothing between them.
 */

/**
 * Everything the shop should be asking a supplier about, worst first.
 *
 * Out-of-stock before low, and inside each, by category then name — the order a
 * supplier's own book is in, so the owner reads down it rather than hunting.
 */
export function needsRestock(items: RestockItem[]): RestockItem[] {
  const wanted = items.filter(
    (item) => !item.inStock || (item.stockQty !== null && item.stockQty <= LOW_STOCK),
  );

  return wanted.sort((a, b) => {
    const emptyA = !a.inStock || a.stockQty === 0;
    const emptyB = !b.inStock || b.stockQty === 0;
    if (emptyA !== emptyB) return emptyA ? -1 : 1;
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.name.localeCompare(b.name);
  });
}

/**
 * One line of the order, as it reaches the supplier.
 *
 * `wanted` IS THE OWNER'S OWN WORDS AND IS DELIBERATELY NOT VALIDATED. A shop
 * sells rice by the kilo and buys it by the fifty-kilo bosta; it sells shampoo
 * by the sachet and buys it by the strip. Forcing the order amount into the
 * pack size the shop retails in would be the app being wrong about the trade,
 * so the box takes "50 kg", "2 bosta", "5 strip" — or nothing at all, for the
 * shopkeeper who will say how much when the man is in front of them.
 */
export type RestockLine = { name: string; wanted: string };

/**
 * The list as one WhatsApp message.
 *
 * Numbered, because a supplier reads it back and ticks it off, and "the fourth
 * one" is how that conversation actually goes. The count at the foot is there
 * for the same reason a total is at the foot of a bill: it is the one thing
 * both sides can check without re-reading the list.
 *
 * No prices. What the shop sells something for is not what it pays for it, and
 * putting a retail price in front of a wholesaler would be showing him the
 * shop's margin for no reason at all.
 */
export function buildRestockMessage(input: {
  shopName: string;
  lines: RestockLine[];
  /** Words in the owner's language, so the vendor gets a message they can read. */
  labels: { heading: string; total: string; empty: string };
  on?: Date;
}): string {
  const { shopName, lines, labels } = input;
  if (lines.length === 0) return `${shopName} — ${labels.empty}`;

  return [
    `${shopName} — ${labels.heading}`,
    '',
    ...lines.map((line, index) => {
      // "3. Masoor Dal — 10 kg". The name and how much to bring, and nothing
      // between them — see the note above `needsRestock`. A line with no amount
      // still goes: the shop wants the item and will say how much when the man
      // is standing at the counter.
      const wanted = line.wanted.trim();
      return `${index + 1}. ${line.name}${wanted ? ` — ${wanted}` : ''}`;
    }),
    '',
    `${labels.total}: ${lines.length}`,
  ].join('\n');
}

/** The filename the owner will recognise among a month of them. Ascii only. */
export function restockFilename(shopName: string, on: Date): string {
  const safe = shopName
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return `order-list-${safe || 'shop'}-${on.toISOString().slice(0, 10)}.pdf`;
}
