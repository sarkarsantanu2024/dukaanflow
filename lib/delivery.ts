/**
 * What a shop charges to send an order out, and the smallest one it will send.
 *
 * Almost every shop that delivers has one or the other, and Halkhata had
 * neither — so a kirana two paras away either delivered a ₹20 order at a loss
 * or rang the customer to explain a rule the app never mentioned. Both of those
 * land on the shopkeeper as work.
 *
 * The arithmetic lives here, in one pure function, because it has to be
 * identical in three places: the basket, where a shopper decides whether to add
 * something; the order route, which is the only authority on what anybody is
 * charged; and the bill the customer is later shown. Three implementations of a
 * discount rule is three chances to charge somebody the wrong amount.
 *
 * PICKUP IS NEVER CHARGED AND NEVER BLOCKED. A customer walking to the counter
 * has made no journey for anybody to price, and refusing them a ₹15 packet of
 * biscuits because a delivery minimum exists would be the app inventing a rule
 * the shop does not have.
 */

/**
 * WHETHER HOME DELIVERY IS OFFERED AT ALL, ANYWHERE IN THE PRODUCT.
 *
 * Off for now, at the product owner's instruction. Every shop's own
 * `deliveryEnabled` flag, its fee, its free-delivery threshold and its minimum
 * are all still stored and still honoured by the server — nothing has been
 * deleted and no shop's settings have been changed. This one constant simply
 * stops the customer being offered the choice and stops the owner being shown
 * the settings for something they cannot yet sell.
 *
 * Turning it back on is this line, and nothing else: every screen that shows or
 * hides a delivery control reads it from here rather than deciding for itself,
 * so there is no second place to remember.
 */
export const DELIVERY_AVAILABLE = false;

export type DeliveryTerms = {
  /** PAISE. Zero means the shop delivers free. */
  deliveryFeePaise: number;
  /** PAISE. Order value at or above which the fee is waived. Zero: never. */
  freeDeliveryAbovePaise: number;
  /** PAISE. The smallest order the shop will send out. Zero: no minimum. */
  minOrderPaise: number;
};

export type DeliveryQuote = {
  /** What the goods came to, before anything is added. */
  goodsPaise: number;
  /** PAISE actually charged for delivery on this order. */
  deliveryFeePaise: number;
  /** Goods plus delivery — what the customer owes. */
  totalPaise: number;
  /**
   * How much more is needed to reach the shop's minimum, or 0 when the order
   * already qualifies. A number rather than a boolean because the only useful
   * thing to say to a shopper is "₹40 more", not "too small".
   */
  shortfallPaise: number;
  /** As above, for the free-delivery threshold. 0 when it does not apply. */
  toFreeDeliveryPaise: number;
};

/**
 * The one place that decides what an order costs to deliver.
 *
 * `goodsPaise` is the items and nothing else. The minimum is checked against
 * that on purpose: a shop willing to travel for ₹200 of groceries means ₹200 of
 * groceries, and counting its own delivery charge towards its own minimum would
 * let a ₹180 order through on the strength of the fee it is about to be
 * charged.
 */
export function quoteDelivery(
  terms: DeliveryTerms,
  goodsPaise: number,
  orderType: 'DELIVERY' | 'PICKUP',
): DeliveryQuote {
  if (orderType !== 'DELIVERY') {
    return {
      goodsPaise,
      deliveryFeePaise: 0,
      totalPaise: goodsPaise,
      shortfallPaise: 0,
      toFreeDeliveryPaise: 0,
    };
  }

  // Zero means "never waive it", not "waive everything". The other reading
  // would give away every delivery in the shop on the day somebody saved the
  // settings form with the box empty.
  const waived =
    terms.freeDeliveryAbovePaise > 0 && goodsPaise >= terms.freeDeliveryAbovePaise;

  const deliveryFeePaise = waived ? 0 : Math.max(0, terms.deliveryFeePaise);
  const shortfallPaise = Math.max(0, terms.minOrderPaise - goodsPaise);
  const toFreeDeliveryPaise =
    terms.freeDeliveryAbovePaise > 0 && terms.deliveryFeePaise > 0 && !waived
      ? terms.freeDeliveryAbovePaise - goodsPaise
      : 0;

  return {
    goodsPaise,
    deliveryFeePaise,
    totalPaise: goodsPaise + deliveryFeePaise,
    shortfallPaise,
    toFreeDeliveryPaise,
  };
}
