/**
 * Subscription plans.
 *
 * Halkhata charges by catalogue size, because catalogue size is what the
 * product is actually worth to a shop: a tea stall with nine items and a kirana
 * with four hundred get very different value from the same software, and item
 * count is the one number both of them already understand. Nothing else is
 * metered — orders, QR scans and customers are all unlimited on every plan, so
 * a shop is never punished for selling well.
 *
 * Plan prices are whole rupees per month. The listing service below is priced
 * in paise, because 50 paise an item is not expressible in rupees — see
 * lib/money.ts for which unit a given number is in.
 */

export const PLANS = ['FREE', 'STARTER', 'PRO', 'EX'] as const;
export type Plan = (typeof PLANS)[number];

export const SUB_STATUSES = ['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED'] as const;
export type SubStatus = (typeof SUB_STATUSES)[number];

export type PlanSpec = {
  id: Plan;
  name: string;
  /** Whole rupees per month. */
  price: number;
  /** Maximum items in the catalogue. */
  itemLimit: number;
  tagline: string;
  features: string[];
};

/**
 * HOW MANY MONTHS A YEAR COSTS.
 *
 * Ten, not twelve: paying for the year is two months cheaper than paying for it
 * a month at a time.
 *
 * This is not a discount for its own sake, it is the churn fix. Every product a
 * kirana already pays for — Vyapar, myBillBook, Vanij — bills once a year, and
 * we billed twelve times. That is twelve occasions a year for a shopkeeper
 * having a bad month to decide they will restart it later, against one. The
 * discount buys back eleven of those decisions, and two months of revenue is a
 * cheap price for a year of certainty.
 *
 * Priced against the market rather than plucked: Pro at ₹249 × 10 is ₹2,490 a
 * year, which sits under Vanij's ₹2,999 and well under Vyapar's ₹3,399 while
 * leaving the monthly rate untouched.
 */
export const MONTHS_PER_YEAR_PAID = 10;

/** Whole rupees for a year of a plan, paid up front. */
export function yearPrice(plan: Plan): number {
  return PLAN_SPECS[plan].price * MONTHS_PER_YEAR_PAID;
}

/** What paying yearly saves against twelve monthly payments, in whole rupees. */
export function yearSaving(plan: Plan): number {
  return PLAN_SPECS[plan].price * (12 - MONTHS_PER_YEAR_PAID);
}

/**
 * What a given number of months costs, in whole rupees.
 *
 * Twelve months and up are charged at the yearly rate — a shop buying two years
 * gets the same two-months-free deal twice, and nobody has to remember to apply
 * it. Anything under a year is simply the monthly rate, so no partial discount
 * has to be reasoned about.
 *
 * The remainder past whole years is charged monthly, which is the arithmetic
 * that makes 18 months land between one year and two rather than jumping.
 */
export function priceForMonths(plan: Plan, months: number): number {
  const monthly = PLAN_SPECS[plan].price;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return years * monthly * MONTHS_PER_YEAR_PAID + rest * monthly;
}

/**
 * WHAT EVERY PLAN INCLUDES, WHICH IS EVERYTHING.
 *
 * The plans used to differ by feature as well as by size — order history on
 * Starter, photos on Pro, priority support on Business. That was the wrong
 * shape for this product. A shopkeeper with thirty items needs the khata and
 * the voice listing exactly as much as one with a thousand does; withholding
 * them does not sell an upgrade, it just makes the cheap plan feel like a
 * crippled demo and gives a shop on Basic a worse reason to stay.
 *
 * So the ONLY thing a plan buys is catalogue size, which is the one dimension
 * that genuinely tracks how big the shop is — and the one a shopkeeper can
 * check for themselves. Everything else is ticked on every row.
 */
export const EVERY_PLAN_INCLUDES: string[] = [
  'QR shop page and printable poster',
  'Voice listing in English, Hindi and Bengali',
  // NOT "orders on WhatsApp". Orders do not arrive on WhatsApp and never
  // have on this product: a customer scans the QR, orders on the shop's own
  // page, and the order lands in the owner's app with a notification. The
  // old line described a competitor's workflow and set up every new shop to
  // sit watching the wrong screen — and to think the app had lost an order
  // when nothing appeared in WhatsApp.
  'Unlimited QR orders, straight into your app',
  'A notification on your phone for every new order',
  'Udhaar khata with WhatsApp reminders',
  'Counter sales and the day’s cash drawer',
  'Order history in the app',
  'Bulk price and stock updates',
  'Storefront and owner photos',
  'Support on WhatsApp',
];

/** "Up to 300 items", the one line that differs between plans. */
function catalogueLine(itemLimit: number): string {
  return `Up to ${itemLimit.toLocaleString('en-IN')} items`;
}

export const PLAN_SPECS: Record<Plan, PlanSpec> = {
  // The enum value stays FREE because it is written into every existing row and
  // renaming it would need a migration for no gain — but nothing is free any
  // more. The name and price a shopkeeper sees are read from here, which is
  // exactly what this file exists for.
  FREE: {
    id: 'FREE',
    name: 'Basic',
    price: 99,
    // Twenty, not fifty. A tea stall or a paan counter genuinely sells twenty
    // things; a kirana does not, and at fifty a real kirana could sit on the
    // cheapest plan indefinitely with a catalogue that fits. The limit is the
    // only thing a plan sells now, so it has to mean something.
    itemLimit: 20,
    tagline: 'Enough for a tea stall or a small counter.',
    features: [catalogueLine(20), ...EVERY_PLAN_INCLUDES],
  },
  STARTER: {
    id: 'STARTER',
    name: 'Starter',
    price: 149,
    itemLimit: 100,
    tagline: 'The everyday kirana plan.',
    features: [catalogueLine(100), ...EVERY_PLAN_INCLUDES],
  },
  PRO: {
    id: 'PRO',
    name: 'Pro',
    price: 249,
    itemLimit: 300,
    tagline: 'A full kirana counter.',
    features: [catalogueLine(300), ...EVERY_PLAN_INCLUDES],
  },
  EX: {
    id: 'EX',
    // The enum value stays EX because it is written into existing rows; the
    // name a shopkeeper reads is "Business", because "EX" told them nothing
    // about what they were buying.
    name: 'Business',
    price: 449,
    // A ceiling rather than true "unlimited": a catalogue past this is a
    // different kind of business, and should be a conversation with the
    // operator — which is what the per-shop custom plan below is for.
    itemLimit: 1500,
    tagline: 'Full grocery stores and restaurants.',
    features: [catalogueLine(1500), ...EVERY_PLAN_INCLUDES],
  },
};

export const PLAN_ORDER: Plan[] = ['FREE', 'STARTER', 'PRO', 'EX'];

/**
 * What Halkhata charges to catalogue a shop's items for them.
 *
 * This sells against the onboarding failure the console already flags: a shop
 * onboarded, QR printed, and nothing ever listed. The operator does the
 * cataloguing and charges for it — 50 paise an item, never less than ₹99.
 *
 * The floor is the point. At 50 paise, listing 25 items earns ₹12.50, which is
 * less than the phone call that arranges it — so without a minimum the smallest
 * jobs cost more to sell than they bring in, and those are exactly the shops
 * that need the service most.
 */
export const LISTING_PAISE_PER_ITEM = 50;
export const LISTING_MINIMUM_PAISE = 9_900;

/** What listing `items` items costs, in paise. */
export function listingChargePaise(items: number): number {
  const counted = Math.max(0, Math.trunc(items));
  if (counted === 0) return 0;
  return Math.max(LISTING_MINIMUM_PAISE, counted * LISTING_PAISE_PER_ITEM);
}

/** The item count at which per-item pricing overtakes the floor — 198. */
export const LISTING_MINIMUM_ITEMS = LISTING_MINIMUM_PAISE / LISTING_PAISE_PER_ITEM;

/**
 * Free days when a shop is created, so onboarding is never blocked.
 *
 * The trial grants the TOP plan, not a middle one. A shop being evaluated must
 * never hit a catalogue limit while deciding whether to buy — the owner would
 * read it as the product failing rather than as a tier they have outgrown, and
 * they would be right to, because nobody has quoted them a price yet.
 */
export const TRIAL_DAYS = 14;
export const TRIAL_PLAN: Plan = 'EX';

/**
 * Days after a period ends before item editing stops. A shop whose payment is
 * a few days late should not lose the ability to fix a price.
 */
export const GRACE_DAYS = 7;

/**
 * Days a shop may go unpaid before its storefront is taken offline.
 *
 * Three months, and deliberately long. Losing editing is an inconvenience the
 * owner notices at once; taking the shop page down costs them real orders from
 * customers who did nothing wrong, so it is the last step, not the first. The
 * clock runs from the end of the last paid period — or from the end of the
 * trial for a shop that never paid at all.
 */
export const AUTO_PAUSE_DAYS = 90;

export type ShopBilling = {
  plan: Plan;
  subscriptionStatus: SubStatus;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  /**
   * A price agreed with this one shop, overriding the ladder. See the columns
   * on `Shop`. Optional so every existing caller keeps compiling and simply
   * gets the standard plan, which is what it had before.
   */
  customPricePaise?: number | null;
  customItemLimit?: number | null;
  customPlanName?: string | null;
};

/**
 * The shop's own plan, when one has been negotiated.
 *
 * Built as a `PlanSpec` rather than as a fifth thing for the rest of the app to
 * handle: every screen already knows how to render a plan's name, price, limit
 * and feature list, and a custom deal is not a different KIND of plan — it is
 * the same plan shape with different numbers in it. Returning null when there
 * is no custom price is what keeps this invisible to every shop without one.
 *
 * It carries the same feature list as everything else, because every plan
 * includes everything — see `EVERY_PLAN_INCLUDES`.
 */
export function customSpec(shop: ShopBilling, fallback: PlanSpec): PlanSpec | null {
  if (shop.customPricePaise === null || shop.customPricePaise === undefined) return null;

  const itemLimit = shop.customItemLimit ?? fallback.itemLimit;
  return {
    id: fallback.id,
    name: shop.customPlanName?.trim() || fallback.name,
    // Whole rupees, to match `PlanSpec.price`. The paise figure is what is
    // charged and what the console edits; this is only what gets displayed.
    price: Math.round(shop.customPricePaise / 100),
    itemLimit,
    tagline: fallback.tagline,
    features: [catalogueLine(itemLimit), ...EVERY_PLAN_INCLUDES],
  };
}

export type Entitlement = {
  plan: PlanSpec;
  status: SubStatus;
  /** Items the shop may hold in total. */
  itemLimit: number;
  /** May the shop add or edit items right now? */
  canEdit: boolean;
  /** Set when editing is blocked, in plain words. */
  blockedReason: 'expired' | null;
  /** Days left in the trial, or null when not trialing. */
  trialDaysLeft: number | null;
  /** True once the period has ended but grace has not. */
  inGrace: boolean;
  expiresOn: Date | null;
  /**
   * The shop has been unpaid past `AUTO_PAUSE_DAYS` and its storefront is off.
   *
   * Derived, never stored. A stored flag would need something to run on a
   * schedule to set it, and a shop whose pause depended on a cron that missed a
   * night would be live when it should not be — or, worse, still paused for
   * hours after the owner paid. Computed from the dates, it is correct on every
   * read and it un-pauses the instant a payment lands.
   */
  autoPaused: boolean;
  /** Days until the storefront goes offline, or null once it has. */
  daysUntilAutoPause: number | null;
};

function daysBetween(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / 86_400_000);
}

/**
 * Works out what a shop may do right now.
 *
 * Three steps down, not one: a trial or paid period runs normally; when it ends
 * the owner loses *editing* and meets the roadblock, but the shop page stays up
 * and customers can still order; and only after `AUTO_PAUSE_DAYS` unpaid does
 * the storefront go offline too.
 *
 * The middle step is the one that matters. Taking a live shop down the day a
 * payment is late costs the owner real sales from customers who did nothing
 * wrong, and nobody renews software that did that to them. Three months is long
 * enough that a shop only reaches the last step by having genuinely stopped.
 */
export function entitlement(shop: ShopBilling, now = new Date()): Entitlement {
  const trialing =
    shop.subscriptionStatus === 'TRIALING' && shop.trialEndsAt !== null && shop.trialEndsAt > now;

  if (trialing) {
    return {
      plan: PLAN_SPECS[TRIAL_PLAN],
      status: 'TRIALING',
      itemLimit: PLAN_SPECS[TRIAL_PLAN].itemLimit,
      canEdit: true,
      blockedReason: null,
      trialDaysLeft: Math.max(0, daysBetween(now, shop.trialEndsAt!)),
      inGrace: false,
      expiresOn: shop.trialEndsAt,
      autoPaused: false,
      daysUntilAutoPause: null,
    };
  }

  /**
   * THE ONE PLACE A NEGOTIATED PLAN REPLACES A STANDARD ONE.
   *
   * Everything downstream — the roadblock, the item allowance, the console, the
   * owner's plan banner, the upgrade dialog — reads `entitlement().plan` and
   * `.itemLimit`, so swapping the spec here is the whole feature. Not one of
   * those screens has to learn that custom plans exist, and none of them can
   * disagree with another about what this shop is paying.
   *
   * Deliberately AFTER the trial branch: a shop still inside its fourteen days
   * gets the trial plan as before. Taking a trial away because a price was
   * agreed for afterwards would be a strange reward for signing early.
   */
  const standard = PLAN_SPECS[shop.plan] ?? PLAN_SPECS.FREE;
  const spec = customSpec(shop, standard) ?? standard;

  // The free plan has no period to expire — it simply is what it is.
  if (spec.price === 0 && shop.subscriptionStatus !== 'PAST_DUE') {
    return {
      plan: spec,
      status: shop.subscriptionStatus === 'TRIALING' ? 'ACTIVE' : shop.subscriptionStatus,
      itemLimit: spec.itemLimit,
      canEdit: shop.subscriptionStatus !== 'CANCELLED',
      blockedReason: shop.subscriptionStatus === 'CANCELLED' ? 'expired' : null,
      trialDaysLeft: null,
      inGrace: false,
      expiresOn: null,
      autoPaused: false,
      daysUntilAutoPause: null,
    };
  }

  // A shop that never paid is measured from the end of its trial, not from
  // never: without this its unpaid clock would have no start and it could sit
  // blocked but live forever.
  const lapsedFrom = shop.currentPeriodEnd ?? shop.trialEndsAt;
  const expired = !lapsedFrom || lapsedFrom <= now;
  const graceEnds = lapsedFrom ? new Date(lapsedFrom.getTime() + GRACE_DAYS * 86_400_000) : null;
  const inGrace = expired && graceEnds !== null && graceEnds > now;

  const cancelled = shop.subscriptionStatus === 'CANCELLED';
  const canEdit = cancelled ? false : !expired || inGrace;

  // Cancelling is a decision somebody made, so it takes effect now rather than
  // waiting out three months of a clock that is no longer counting anything.
  const pauseOn = lapsedFrom
    ? new Date(lapsedFrom.getTime() + AUTO_PAUSE_DAYS * 86_400_000)
    : null;
  const autoPaused = cancelled || (expired && pauseOn !== null && pauseOn <= now);

  return {
    plan: spec,
    status: shop.subscriptionStatus,
    itemLimit: spec.itemLimit,
    canEdit,
    blockedReason: canEdit ? null : 'expired',
    trialDaysLeft: null,
    inGrace,
    expiresOn: lapsedFrom,
    autoPaused,
    daysUntilAutoPause:
      autoPaused || !pauseOn ? null : Math.max(0, daysBetween(now, pauseOn)),
  };
}

/** The next plan up, or null at the top. */
export function nextPlanUp(plan: Plan): PlanSpec | null {
  const index = PLAN_ORDER.indexOf(plan);
  const next = PLAN_ORDER[index + 1];
  return next ? PLAN_SPECS[next] : null;
}

/** The cheapest plan that fits a catalogue of this size. */
export function planFor(itemCount: number): PlanSpec {
  for (const id of PLAN_ORDER) {
    if (itemCount <= PLAN_SPECS[id].itemLimit) return PLAN_SPECS[id];
  }
  return PLAN_SPECS.PRO;
}

export function formatPlanPrice(spec: PlanSpec): string {
  return spec.price === 0 ? 'Free' : `₹${spec.price}/month`;
}
