import { prisma } from '@/lib/prisma';
import { fail, ok } from '@/lib/http';

export const runtime = 'nodejs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET ?ids=a,b,c — where each of this phone's orders stands, for the
 * customer's bell.
 *
 * The same public facts the tracking page at /track/<id> already shows to
 * anyone holding the order's id, and nothing more: no name, no phone, no
 * address. An order id is a random UUID the customer's own phone was handed
 * when they placed it, so knowing one is the permission to read it.
 *
 * An id that no longer exists is simply absent from the answer. The bell reads
 * that as the shop having turned the order away, because turning an order away
 * deletes it.
 */
export async function GET(request: Request) {
  const ids = (new URL(request.url).searchParams.get('ids') ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter((id) => UUID.test(id))
    .slice(0, 20);
  if (ids.length === 0) return fail('No orders', 400);

  const orders = await prisma.order.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      status: true,
      revisedAt: true,
      totalAmountPaise: true,
      createdAt: true,
      completedAt: true,
      shop: { select: { name: true, slug: true } },
    },
  });

  return ok({
    orders: orders.map((order) => ({
      id: order.id,
      status: order.status,
      revisedAt: order.revisedAt?.toISOString() ?? null,
      totalAmountPaise: order.totalAmountPaise,
      createdAt: order.createdAt.toISOString(),
      completedAt: order.completedAt?.toISOString() ?? null,
      shopName: order.shop.name,
      shopSlug: order.shop.slug,
    })),
  });
}
