import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/guard';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { subscriptionSchema } from '@/lib/validators';
import { PLAN_SPECS } from '@/lib/plans';

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
    select: { id: true, currentPeriodEnd: true },
  });
  if (!shop) return fail('Shop not found', 404);

  const parsed = subscriptionSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  const { plan, months, status, method, reference, note } = parsed.data;
  const spec = PLAN_SPECS[plan];

  if (status) {
    await prisma.shop.update({ where: { id: shop.id }, data: { plan, subscriptionStatus: status } });
    return ok({ success: true });
  }

  // Paid time is added to whatever is left, never replacing it — renewing a
  // week early must not cost the shop that week.
  const now = new Date();
  const from = shop.currentPeriodEnd && shop.currentPeriodEnd > now ? shop.currentPeriodEnd : now;
  const periodEnd = new Date(from);
  periodEnd.setMonth(periodEnd.getMonth() + months);

  const amount = spec.price * months;

  await prisma.$transaction([
    prisma.shop.update({
      where: { id: shop.id },
      data: {
        plan,
        subscriptionStatus: 'ACTIVE',
        currentPeriodEnd: periodEnd,
        // A paid shop is out of its trial, whatever was left of it.
        trialEndsAt: null,
      },
    }),
    prisma.payment.create({
      data: {
        shopId: shop.id,
        amount,
        plan,
        periodStart: from,
        periodEnd,
        method,
        reference,
        note,
      },
    }),
  ]);

  return ok({ success: true, periodEnd: periodEnd.toISOString(), amount });
}
