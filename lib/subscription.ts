import { prisma } from './prisma';
import { priceForMonths, type Plan } from './plans';
import { rupeesToPaise } from './money';
import { periodFor } from './period';

/**
 * Putting a shop on a plan, in one place.
 *
 * This arithmetic used to live inside the console's subscription route and
 * nowhere else, which was fine while the console was the only thing that could
 * grant time. It is not any more: an owner redeeming an activation code has to
 * extend a period by exactly the same rule, and two implementations of "when
 * does this shop's month start" is how one of them quietly starts costing a
 * shop a week.
 *
 * So both callers come here, and the rule is stated once.
 */

export type Grant = {
  shopId: string;
  plan: Plan;
  months: number;
  /** "UPI", "CASH", … — how the money arrived, not what it bought. */
  method?: string;
  /** UTR, gateway id, or in our case the payment-request id. */
  reference?: string;
  note?: string;
};

export type GrantResult = { periodEnd: Date; amountPaise: number };

/**
 * Re-exported so server callers have one import for "granting a subscription",
 * while the console can reach the same arithmetic from `lib/period` without
 * pulling Prisma into a browser bundle. One implementation, two doors.
 */
export { periodFor, type ExistingTime } from './period';

/**
 * Adds paid time to whatever the shop already has, and records the payment.
 *
 * Time is ADDED, never replaced — renewing a week early must not cost the shop
 * that week. "Whatever is left" includes unused trial: an owner convinced on
 * day three and paying used to lose the other eleven days, which punished
 * exactly the behaviour we want. The two are the same fact — time the shop has
 * already been given — so the new period runs from whichever of them lasts
 * longest.
 *
 * Priced from `lib/plans.ts`, never from an amount the caller passes. A route
 * that could be told what to charge is a route a browser can buy a year on
 * for a rupee.
 */
export async function grantSubscription(grant: Grant): Promise<GrantResult> {
  const { shopId, plan, months } = grant;

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { currentPeriodEnd: true, trialEndsAt: true },
  });
  if (!shop) throw new Error(`No shop ${shopId}`);

  const { from, periodEnd } = periodFor(shop, months);

  // Twelve months and up are charged at the yearly rate — two months free — and
  // that rule lives in lib/plans.ts so the console, the pricing page and this
  // can never quote three different numbers for the same year.
  const amountPaise = rupeesToPaise(priceForMonths(plan, months));

  await prisma.$transaction([
    prisma.shop.update({
      where: { id: shopId },
      data: {
        plan,
        subscriptionStatus: 'ACTIVE',
        currentPeriodEnd: periodEnd,
        // Cleared because it has been SPENT, not discarded: whatever was left
        // of the trial is inside `periodEnd` above. Leaving it set would make
        // the same days count twice the next time this runs.
        trialEndsAt: null,
      },
    }),
    prisma.payment.create({
      data: {
        shopId,
        amountPaise,
        plan,
        kind: 'SUBSCRIPTION',
        periodStart: from,
        periodEnd,
        method: grant.method ?? 'UPI',
        reference: grant.reference ?? '',
        note: grant.note ?? '',
      },
    }),
  ]);

  return { periodEnd, amountPaise };
}

/** What `months` of `plan` costs right now, in paise. The quote a shop is given. */
export function quotePaise(plan: Plan, months: number): number {
  return rupeesToPaise(priceForMonths(plan, months));
}
