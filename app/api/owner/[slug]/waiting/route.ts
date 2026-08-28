import { prisma } from '@/lib/prisma';
import { requireShopWrite } from '@/lib/guard';
import { fail, ok } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ slug: string }> };

/**
 * GET — how many orders this shop has not finished yet.
 *
 * The one number the header bell needs, and deliberately nothing else. Polled
 * every twenty seconds from a phone on mobile data, so the response is a single
 * integer rather than a list of orders the caller would throw away.
 *
 * Reads are usually straight from Prisma in a Server Component here, but a
 * count that changes while the owner is standing on a different screen has to
 * come from somewhere the client can ask again.
 */
export async function GET(_request: Request, { params }: Context) {
  const { slug } = await params;
  if (!(await requireShopWrite(slug))) return fail('Not authenticated', 401);

  const shop = await prisma.shop.findUnique({ where: { slug }, select: { id: true } });
  if (!shop) return fail('Shop not found', 404);

  const waiting = await prisma.order.count({
    where: { shopId: shop.id, status: { in: ['NEW', 'CONFIRMED'] } },
  });

  return ok({ waiting });
}
