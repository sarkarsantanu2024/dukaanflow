import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/guard';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { subscriptionSchema } from '@/lib/validators';
import { PLAN_SPECS, listingChargePaise } from '@/lib/plans';
import { rupeesToPaise } from '@/lib/money';

export const runtime = 'nodejs';

type Context = { params: Promise<{ slug: string }> };

/**
 * Super Admin only: move a shop between plans and record what it paid.
 *
 * DukaanFlow collects over UPI, and this is where that lands — the Super Admin
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

  const { plan, months, status, listedItems, method, reference, note } = parsed.data;
  const spec = PLAN_SPECS[plan];

  if (status) {
    await prisma.shop.update({ where: { id: shop.id }, data: { plan, subscriptionStatus: status } });
    return ok({ success: true });
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

  // Paid time is added to whatever is left, never replacing it — renewing a
  // week early must not cost the shop that week.
  //
  // "Whatever is left" includes unused trial. An owner who is convinced on day
  // three and pays used to lose the other eleven days, which punished exactly
  // the behaviour we want: deciding early. The two are the same fact — time the
  // shop has already been given — so the new period starts from whichever of
  // them runs longest.
  const now = new Date();
  const remaining = [shop.currentPeriodEnd, shop.trialEndsAt].filter(
    (date): date is Date => date !== null && date > now,
  );
  const from = remaining.reduce((latest, date) => (date > latest ? date : latest), now);
  const periodEnd = new Date(from);
  periodEnd.setMonth(periodEnd.getMonth() + months);

  const amountPaise = rupeesToPaise(spec.price * months);

  await prisma.$transaction([
    prisma.shop.update({
      where: { id: shop.id },
      data: {
        plan,
        subscriptionStatus: 'ACTIVE',
        currentPeriodEnd: periodEnd,
        // Cleared because it has been spent, not discarded: whatever was left
        // of the trial is inside `periodEnd` above. Leaving it set would make
        // the same days count twice the next time this runs.
        trialEndsAt: null,
      },
    }),
    prisma.payment.create({
      data: {
        shopId: shop.id,
        amountPaise,
        plan,
        kind: 'SUBSCRIPTION',
        periodStart: from,
        periodEnd,
        method,
        reference,
        note,
      },
    }),
  ]);

  return ok({ success: true, periodEnd: periodEnd.toISOString(), amountPaise });
}
