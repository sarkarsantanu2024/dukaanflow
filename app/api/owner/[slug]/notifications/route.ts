import { prisma } from '@/lib/prisma';
import { requireShopWrite } from '@/lib/guard';
import { fail, ok } from '@/lib/http';

export const runtime = 'nodejs';

type Context = { params: Promise<{ slug: string }> };

/**
 * GET — the orders still waiting on this shop, newest first, for the owner's
 * bell.
 *
 * The bell sits on every owner screen, so an order that arrives while the owner
 * is on the till or the khata is seen there, not only when they happen to open
 * Orders. Only what the bell prints: who, their number, how much, when. Which of
 * these the owner has read or removed lives on their phone, not here — see
 * `OwnerBell`.
 *
 * READY is included only because old orders may still carry it; nothing sets
 * it any more.
 */
export async function GET(_request: Request, { params }: Context) {
  const { slug } = await params;
  if (!(await requireShopWrite(slug))) return fail('Not authenticated', 401);

  const shop = await prisma.shop.findUnique({ where: { slug }, select: { id: true } });
  if (!shop) return fail('Shop not found', 404);

  const orders = await prisma.order.findMany({
    where: { shopId: shop.id, status: { in: ['NEW', 'CONFIRMED', 'READY'] } },
    orderBy: { createdAt: 'desc' },
    take: 30,
    select: {
      id: true,
      customerName: true,
      customerPhone: true,
      orderType: true,
      totalAmountPaise: true,
      createdAt: true,
    },
  });

  return ok({
    orders: orders.map((order) => ({ ...order, createdAt: order.createdAt.toISOString() })),
  });
}
