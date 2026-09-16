/**
 * When a shop's paid time starts and finishes.
 *
 * Its own module, with no database import, for one reason: the console shows
 * the operator the date a payment will run to BEFORE they record it, and that
 * preview has to be the same arithmetic the server will apply. Leaving this in
 * `lib/subscription.ts` would have dragged Prisma into the browser bundle to
 * get at it; copying it into the component would have produced a second
 * implementation of the one number a shopkeeper is told over the phone.
 */

/**
 * What a shop has already PAID for. The trial is deliberately not part of it.
 */
export type ExistingTime = { currentPeriodEnd: Date | null };

/**
 * PAID time is ADDED to paid time already held, never replacing it — renewing a
 * week early must not cost the shop that week.
 *
 * UNUSED TRIAL DAYS ARE NOT ADDED, and that is a deliberate reversal. They were,
 * on the reasoning that an owner convinced on day three should not lose the
 * other eleven — which is a kind thought and the wrong one commercially: the
 * trial is a free look at the product, not a credit balance, and stacking it
 * meant the first month a shop paid for was routinely a month and a half. The
 * fourteen days are the offer; paying starts the plan.
 *
 * So `from` is the shop's own paid-to date while it has one, and `now`
 * otherwise — including for a shop still inside its trial, which is the case
 * this change is about.
 *
 * A caveat worth stating, because it is not a bug: while a shop still has paid
 * time left, `from` is that date and the answer is fixed however long a quote
 * sits unused. Once it has lapsed, `from` is now, so a payment recorded a week
 * later ends a week later — in the shop's favour.
 */
export function periodFor(shop: ExistingTime, months: number, now = new Date()) {
  const paidTo = shop.currentPeriodEnd;
  const from = paidTo !== null && paidTo > now ? paidTo : now;

  const periodEnd = new Date(from);
  periodEnd.setMonth(periodEnd.getMonth() + months);
  return { from, periodEnd };
}
