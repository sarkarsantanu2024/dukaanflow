import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/guard';
import { fail, ok, sameOrigin } from '@/lib/http';
import { TRIAL_DAYS } from '@/lib/plans';

export const runtime = 'nodejs';

type Context = { params: Promise<{ slug: string }> };

/**
 * POST /api/admin/shop/[slug]/reset — wipe a shop back to the day it was made.
 *
 * The console button next to it lets an operator run the full customer→owner
 * flow on a test shop again and again without building a new shop each time —
 * so what it leaves behind has to be indistinguishable from a shop created a
 * minute ago, not merely a quiet one. It does exactly what
 * `scripts/reset-shop.ts` does, and clears:
 *
 *  - every transaction and everything derived from one: orders, counter sales,
 *    the khata ledger, customers, cash-day drawers, and the yearly rollups;
 *  - the item list itself, so the shop opens empty and is counted as never
 *    activated;
 *  - the money: recorded payments and the payment requests raised against them;
 *  - every push subscription, owner's and customers' alike — the owner's device
 *    re-subscribes on their next sign-in, and a customer's would otherwise buzz
 *    for a khata that no longer exists.
 *
 * and puts the subscription back to what `POST /api/admin/shop` stamps on a new
 * shop: {TRIAL_DAYS} days of Pro, trialing, with any negotiated price forgotten.
 *
 * WHAT IT KEEPS is the shop's identity and nothing else: name, slug, QR, address,
 * hours, owner details, the owner's PIN, and the demo flag itself. The QR posters
 * printed for a test shop keep working, which is the point of resetting rather
 * than deleting.
 *
 * DEMO SHOPS ONLY. This is destructive and there is no undo, so it is refused on
 * any shop not flagged `isDemo`. A real shop's khata is money real people owe
 * and its payments are money it has paid; neither may be wiped from a button. To
 * reset a test shop, mark it as a demo shop first (the toggle on the shop form).
 */
export async function POST(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  if (!(await requireAdmin())) return fail('Not authenticated', 401);

  const { slug } = await params;
  const shop = await prisma.shop.findUnique({
    where: { slug },
    select: { id: true, isDemo: true },
  });
  if (!shop) return fail('Shop not found', 404);
  if (!shop.isDemo) {
    return fail('Reset is only allowed on demo shops. Mark this shop as a demo first.', 403);
  }

  const where = { shopId: shop.id };

  // One transaction: a reset that half-ran would leave a ledger pointing at
  // customers that are gone, which is worse than not resetting at all.
  //
  // FK-safe order: the ledger points at customers and at orders/sales, so it is
  // cleared first; payment requests point at payments, so they go before them.
  await prisma.$transaction([
    prisma.ledgerEntry.deleteMany({ where }),
    prisma.sale.deleteMany({ where }),
    prisma.order.deleteMany({ where }),
    prisma.cashDay.deleteMany({ where }),
    prisma.customer.deleteMany({ where }),
    prisma.itemPeriodStat.deleteMany({ where }),
    prisma.areaPeriodStat.deleteMany({ where }),
    prisma.paymentRequest.deleteMany({ where }),
    prisma.payment.deleteMany({ where }),
    prisma.pushSubscription.deleteMany({ where }),
    prisma.item.deleteMany({ where }),

    // The subscription, back to what a shop created this minute is given. Every
    // custom-price field is cleared too: a negotiated deal belongs to the shop
    // that negotiated it, and leaving one behind would quietly price the next
    // run of the flow wrong. `activatedAt` goes null because activation means
    // "first item listed", and there are no items now.
    prisma.shop.update({
      where: { id: shop.id },
      data: {
        plan: 'PRO',
        subscriptionStatus: 'TRIALING',
        trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 86_400_000),
        currentPeriodEnd: null,
        trialEndNoticedAt: null,
        activatedAt: null,
        customPricePaise: null,
        customItemLimit: null,
        customPlanName: '',
      },
    }),
  ]);

  return ok({ success: true });
}
