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

/** What a shop has already been given, whether by paying or by trialling. */
export type ExistingTime = { currentPeriodEnd: Date | null; trialEndsAt: Date | null };

/**
 * Paid time is ADDED to whatever is left, never replacing it — renewing a week
 * early must not cost the shop that week. "Whatever is left" includes unused
 * trial: an owner convinced on day three and paying used to lose the other
 * eleven days, which punished exactly the behaviour we want. Both are the same
 * fact — time the shop has already been given — so the new period runs from
 * whichever of them lasts longest.
 *
 * A caveat worth stating, because it is not a bug: while a shop still has time
 * left, `from` is that date and the answer is fixed however long a quote sits
 * unused. Once everything has lapsed, `from` is now, so a payment recorded a
 * week later ends a week later — in the shop's favour.
 */
export function periodFor(shop: ExistingTime, months: number, now = new Date()) {
  const remaining = [shop.currentPeriodEnd, shop.trialEndsAt].filter(
    (date): date is Date => date !== null && date > now,
  );
  const from = remaining.reduce((latest, date) => (date > latest ? date : latest), now);

  const periodEnd = new Date(from);
  periodEnd.setMonth(periodEnd.getMonth() + months);
  return { from, periodEnd };
}
