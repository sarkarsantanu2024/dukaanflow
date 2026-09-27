import { prisma } from './prisma';
import { formatIsoDay } from './time';
import { fail } from './http';

/**
 * TODAY'S OPENING CASH IS MANDATORY (decided 2026-09-28, by the owner).
 *
 * A shop may not start the day — ring up a counter sale, or switch itself
 * "open" — until the owner has typed what is in the drawer this morning
 * (আজকের নগদ). Without that one number the evening's count cannot be
 * reconciled, and the product owner's rule is that the shop does not open
 * without it. ₹0 is a real answer and counts; a blank is not.
 *
 * What it deliberately does NOT lock: customers ordering online, and the owner
 * working those orders. The daily orders that arrive the night before are the
 * point of the product, and a forgotten float must not turn them away.
 *
 * "Entered" means today's `CashDay` row exists. The cash route creates that
 * row only when an opening figure is sent, so a row always means the owner
 * typed one — see `app/api/admin/shop/[slug]/cash/route.ts`.
 *
 * Enforced here, on the server, as well as on the screen: a rule that lives
 * only in a disabled button is not a rule.
 */

/** Has this shop entered today's opening cash? Today on the shop's own clock. */
export async function openedToday(shopId: string, now: Date = new Date()): Promise<boolean> {
  const row = await prisma.cashDay.findUnique({
    where: { shopId_day: { shopId, day: formatIsoDay(now) } },
    select: { id: true },
  });
  return row !== null;
}

/**
 * The refusal, in one shape every caller shares. The owner app recognises it
 * by `errors.openingPaise === 'required'` and says it in the owner's language;
 * the English here is for anything else that reads it.
 */
export function openingCashRequired() {
  return fail('Enter today’s opening cash first. The shop cannot open without it.', 409, {
    openingPaise: 'required',
  });
}
