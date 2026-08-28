/**
 * Subscription plans.
 *
 * DukaanFlow charges by catalogue size, because catalogue size is what the
 * product is actually worth to a shop: a tea stall with nine items and a kirana
 * with four hundred get very different value from the same software, and item
 * count is the one number both of them already understand. Nothing else is
 * metered — orders, QR scans and customers are all unlimited on every plan, so
 * a shop is never punished for selling well.
 *
 * Prices are whole rupees per month, matching the integer-rupees rule used
 * everywhere else in the codebase.
 */

export const PLANS = ['FREE', 'STARTER', 'PRO'] as const;
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

export const PLAN_SPECS: Record<Plan, PlanSpec> = {
  // The enum value stays FREE because it is written into every existing row and
  // renaming it would need a migration for no gain — but nothing is free any
  // more. The name and price a shopkeeper sees are read from here, which is
  // exactly what this file exists for.
  FREE: {
    id: 'FREE',
    name: 'Basic',
    price: 99,
    itemLimit: 25,
    tagline: 'Enough for a tea stall or a small counter.',
    features: [
      'Up to 25 items',
      'QR shop page and printable poster',
      'Voice listing in English, Hindi and Bengali',
      'Unlimited orders on WhatsApp',
    ],
  },
  STARTER: {
    id: 'STARTER',
    name: 'Starter',
    price: 199,
    itemLimit: 150,
    tagline: 'The everyday kirana plan.',
    features: [
      'Up to 150 items',
      'Everything in Free',
      'Order history in the app',
      'Bulk price and stock updates',
    ],
  },
  PRO: {
    id: 'PRO',
    name: 'Pro',
    price: 499,
    // A ceiling rather than true "unlimited": a catalogue past this is a
    // different kind of business, and should be a conversation, not a silent
    // bill. Nothing breaks at the limit — the owner is told and can ask.
    itemLimit: 2000,
    tagline: 'Full grocery stores and restaurants.',
    features: [
      'Up to 2,000 items',
      'Everything in Starter',
      'Storefront and owner photos',
      'Priority support on WhatsApp',
    ],
  },
};

export const PLAN_ORDER: Plan[] = ['FREE', 'STARTER', 'PRO'];

/** Free days of Pro when a shop is created, so onboarding is never blocked. */
export const TRIAL_DAYS = 14;

/**
 * Days after a period ends before item editing stops. A shop whose payment is
 * a few days late should not lose the ability to fix a price.
 */
export const GRACE_DAYS = 7;

export type ShopBilling = {
  plan: Plan;
  subscriptionStatus: SubStatus;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
};

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
};

function daysBetween(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / 86_400_000);
}

/**
 * Works out what a shop may do right now.
 *
 * Deliberately generous at the edges: a trial that has not expired grants Pro,
 * an unpaid period keeps working through the grace window, and a lapsed shop
 * loses *editing* only — its QR keeps working and customers can still order.
 * Taking a live shop offline over a late payment would cost the owner real
 * sales, and nobody renews software that did that to them.
 */
export function entitlement(shop: ShopBilling, now = new Date()): Entitlement {
  const trialing =
    shop.subscriptionStatus === 'TRIALING' && shop.trialEndsAt !== null && shop.trialEndsAt > now;

  if (trialing) {
    return {
      plan: PLAN_SPECS.PRO,
      status: 'TRIALING',
      itemLimit: PLAN_SPECS.PRO.itemLimit,
      canEdit: true,
      blockedReason: null,
      trialDaysLeft: Math.max(0, daysBetween(now, shop.trialEndsAt!)),
      inGrace: false,
      expiresOn: shop.trialEndsAt,
    };
  }

  const spec = PLAN_SPECS[shop.plan] ?? PLAN_SPECS.FREE;

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
    };
  }

  const periodEnd = shop.currentPeriodEnd;
  const expired = !periodEnd || periodEnd <= now;
  const graceEnds = periodEnd ? new Date(periodEnd.getTime() + GRACE_DAYS * 86_400_000) : null;
  const inGrace = expired && graceEnds !== null && graceEnds > now;

  const canEdit = shop.subscriptionStatus === 'CANCELLED' ? false : !expired || inGrace;

  return {
    plan: spec,
    status: shop.subscriptionStatus,
    itemLimit: spec.itemLimit,
    canEdit,
    blockedReason: canEdit ? null : 'expired',
    trialDaysLeft: null,
    inGrace,
    expiresOn: periodEnd,
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
