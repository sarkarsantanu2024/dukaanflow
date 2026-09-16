/**
 * The smallest order a shop is willing to pick and pack, in RUPEES.
 *
 * WHY MONEY AND NOT A COUNT OF ITEMS. The problem an owner described is a ₹10
 * packet of chips: somebody scans the QR at the counter, or orders from home,
 * and the shop has to treat one packet as an order — mark it confirmed, pack
 * it, mark it ready, message the customer. The work is the same whether the
 * order is worth ₹10 or ₹800, so it is the VALUE that decides whether it was
 * worth doing.
 *
 * Counting items was tried first and it is the wrong instrument. "Ten different
 * things" refuses 2 kg rice + 1 kg dal + 1 litre of oil — an ₹800 order, three
 * lines, exactly the order a kirana most wants — while a basket of ten sachets
 * worth ₹60 sails through. And quantities here are fractional multiples of a
 * pack (50 g of posto is 0.05), so summing them does not even produce a number
 * of things. Money has none of those problems: it is already exact, already
 * summed, and already the thing the owner is actually weighing up.
 *
 * NOBODY SETS IT. It is derived from how many items the shop has listed, so a
 * shop that grows gets a higher floor without anybody remembering to raise it,
 * and a shop still filling its list is never blocked by a number typed in hope.
 * One less thing for an owner to get wrong, and one less screen for them to
 * find.
 */

/**
 * How big a shop is, by how much it has listed, and the floor that follows.
 *
 * The boundaries are the plan ladder's own — Starter holds 100 items and Pro
 * holds 300 — so "medium" means the same thing here as it does on the pricing
 * page rather than being a second, private idea of size.
 *
 * BELOW THE FIRST BOUNDARY THERE IS NO MINIMUM AT ALL, and that is the most
 * important line in this file. A shop that has listed nine things is a shop
 * still being set up; a floor of ₹100 on it would refuse most of what its
 * customers could possibly assemble, and the owner would see orders stop with
 * nothing on screen explaining it. The rule switches on when the shop is big
 * enough for the rule to make sense.
 */
export const BASKET_FLOORS: { fromItems: number; floorPaise: number }[] = [
  { fromItems: 300, floorPaise: 30_000 }, // large  — ₹300
  { fromItems: 100, floorPaise: 20_000 }, // medium — ₹200
  { fromItems: 25, floorPaise: 10_000 }, //  small  — ₹100
];

/** Below this many items on sale, a shop has no minimum order at all. */
export const NO_FLOOR_BELOW_ITEMS = 25;

/**
 * The smallest order this shop will take, in PAISE. Zero means no minimum.
 *
 * `itemsOnSale` is what a customer can actually put in a basket — priced and in
 * stock — not everything the shop has ever listed. A catalogue of two hundred
 * rows of which eight are on sale is a shop of eight as far as its customers
 * are concerned, and sizing it as "medium" would lock them out.
 */
export function minBasketPaise(itemsOnSale: number): number {
  for (const tier of BASKET_FLOORS) {
    if (itemsOnSale >= tier.fromItems) return tier.floorPaise;
  }
  return 0;
}

/**
 * How much more this basket needs, or 0 when it already qualifies.
 *
 * A number rather than a boolean for the same reason the delivery shortfall is
 * one: the only useful thing to say to a shopper is "₹40 more", not "too
 * small".
 *
 * `goodsPaise` is the items alone. A delivery charge is not part of what the
 * shop thinks the trip was worth, and counting it would let a ₹90 order through
 * on the strength of the fee it is about to be charged.
 */
export function basketShortfallPaise(minPaise: number, goodsPaise: number): number {
  if (minPaise <= 0) return 0;
  return Math.max(0, minPaise - goodsPaise);
}
