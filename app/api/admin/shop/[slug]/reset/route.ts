import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/guard';
import { fail, ok, sameOrigin } from '@/lib/http';

export const runtime = 'nodejs';

type Context = { params: Promise<{ slug: string }> };

/**
 * POST /api/admin/shop/[slug]/reset — wipe a shop back to a clean slate.
 *
 * The console button next to it lets an operator run the full customer→owner
 * flow on a test shop again and again without building a new shop each time. It
 * does exactly what `scripts/reset-shop.ts` does: clears every transaction —
 * orders, counter sales, the khata ledger, customers, cash-days and the shop's
 * customer push subscriptions — and resets each item to how a freshly-added one
 * looks (in stock, nobody counting), while keeping the shop, its PIN and its
 * item list.
 *
 * DEMO SHOPS ONLY. This is destructive and there is no undo, so it is refused on
 * any shop not flagged `isDemo`. A real shop's khata is money real people owe;
 * it must never be wiped from a button. To reset a test shop, mark it as a demo
 * shop first (the toggle on the shop form).
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

  // FK-safe order: the ledger points at customers and at orders/sales, so it is
  // cleared first. Items and the shop itself are deliberately kept.
  await prisma.ledgerEntry.deleteMany({ where });
  await prisma.sale.deleteMany({ where });
  await prisma.order.deleteMany({ where });
  await prisma.cashDay.deleteMany({ where });
  await prisma.customer.deleteMany({ where });
  await prisma.pushSubscription.deleteMany({ where: { shopId: shop.id, role: 'CUSTOMER' } });

  // Each item back to how a new one looks: in stock, nobody counting — so no
  // stale stock counts, "out of stock" flags or supplier-list entries linger.
  await prisma.item.updateMany({ where, data: { stockQty: null, inStock: true } });

  return ok({ success: true });
}
