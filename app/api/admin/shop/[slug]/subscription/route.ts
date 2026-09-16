import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/guard';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { subscriptionSchema } from '@/lib/validators';
import { listingChargePaise } from '@/lib/plans';
import { grantSubscription } from '@/lib/subscription';

export const runtime = 'nodejs';

type Context = { params: Promise<{ slug: string }> };

/**
 * Super Admin only: move a shop between plans and record what it paid.
 *
 * Halkhata collects over UPI, and this is where that lands — the Super Admin
 * records the payment and the period it bought. The shape is deliberately the
 * shape a gateway webhook would write, so plugging in Razorpay later means
 * calling this logic from a webhook rather than rebuilding it.
 */
export async function POST(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  if (!(await requireAdmin())) return fail('Not authenticated', 401);

  const { slug } = await params;
  const shop = await prisma.shop.findUnique({
    where: { slug },
    select: { id: true, currentPeriodEnd: true, trialEndsAt: true },
  });
  if (!shop) return fail('Shop not found', 404);

  const parsed = subscriptionSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  const { plan, months, status, listedItems, trialDays, method, reference, note } = parsed.data;

  if (status) {
    await prisma.shop.update({ where: { id: shop.id }, data: { plan, subscriptionStatus: status } });
    return ok({ success: true });
  }

  /**
   * More free trial, at the owner's request. No money, no Payment row.
   *
   * COUNTED FROM WHICHEVER IS LATER — the trial's own end, or today. A shop
   * whose trial ran out three days ago and is given "seven more days" means
   * seven days from now, not four; counting from a date already past would hand
   * the operator a number that quietly shrinks the longer they take to answer
   * the WhatsApp message asking for it.
   *
   * The status goes back to TRIALING because that is what the shop now is.
   * Without it a shop that had already lapsed keeps a CANCELLED status while
   * holding a live trial date, and `entitlement()` would go on refusing them —
   * an extension the owner was promised and never received.
   *
   * `currentPeriodEnd` is deliberately untouched. A trial and paid time are
   * different facts, and a shop that has paid must not have that overwritten by
   * a goodwill week.
   */
  if (trialDays !== undefined) {
    const now = new Date();

    /**
     * REFUSED FOR A SHOP THAT HAS PAID, and this guard is the whole lesson of
     * the block.
     *
     * The first version set `subscriptionStatus: 'TRIALING'` unconditionally,
     * which on a paying shop was a quiet disaster: `entitlement` reads TRIALING
     * as "inside the free look" and grants `TRIAL_PLAN` — the TOP tier. A Basic
     * shop paid up until 2027 was silently moved to Business and 1000 items,
     * for nothing, while its own console still read "Paid to 14/09/2027". Two
     * contradictory truths on one panel, and the generous one winning.
     *
     * There is no sensible meaning to give the action anyway. A shop holding
     * paid time is not trialling, and "more free days" for one of them is a
     * discount on the next renewal — which is `customPricePaise`, a different
     * control, with a different record, that does not pretend to be a trial.
     */
    if (shop.currentPeriodEnd && shop.currentPeriodEnd > now) {
      return fail(
        `This shop has paid to ${shop.currentPeriodEnd.toISOString().slice(0, 10)}, so it is not on a trial. Use the custom price to give it a better rate instead.`,
        409,
      );
    }

    const from = shop.trialEndsAt && shop.trialEndsAt > now ? shop.trialEndsAt : now;
    const trialEndsAt = new Date(from.getTime() + trialDays * 86_400_000);

    await prisma.shop.update({
      where: { id: shop.id },
      data: { trialEndsAt, subscriptionStatus: 'TRIALING' },
    });

    return ok({ success: true, trialEndsAt: trialEndsAt.toISOString() });
  }

  // The cataloguing service: a one-off charge for work done, not time bought.
  // It records money and nothing else — the shop's plan, period and status are
  // untouched, because listing a shop's items is not a renewal and must never
  // silently extend a subscription somebody has not paid for.
  if (listedItems !== undefined) {
    const amountPaise = listingChargePaise(listedItems);
    const at = new Date();
    await prisma.payment.create({
      data: {
        shopId: shop.id,
        amountPaise,
        plan,
        kind: 'LISTING',
        itemsListed: listedItems,
        // Equal, because this buys no period. A one-off charge with a span
        // would look like time bought to anything reading these rows later.
        periodStart: at,
        periodEnd: at,
        method,
        reference,
        note,
      },
    });
    return ok({ success: true, amountPaise, itemsListed: listedItems });
  }

  // Adding time to whatever is left, pricing it, and recording the payment all
  // live in lib/subscription.ts now — the owner's activation-code route has to
  // do exactly the same thing, and two copies of "when does this shop's month
  // start" is how one of them quietly starts costing a shop a week.
  const { periodEnd, amountPaise } = await grantSubscription({
    shopId: shop.id,
    plan,
    months,
    method,
    reference,
    note,
  });

  return ok({ success: true, periodEnd: periodEnd.toISOString(), amountPaise });
}
