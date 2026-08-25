import { prisma } from '@/lib/prisma';
import { requireShopWrite } from '@/lib/guard';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { orderStatusSchema } from '@/lib/validators';

export const runtime = 'nodejs';

type Context = { params: Promise<{ slug: string }> };

/**
 * PATCH — move an order through its states.
 *
 * Orders already arrive on WhatsApp; this is what turns that message into a
 * queue the owner can actually work: mark it taken, or mark it cancelled, and
 * know which ones are still waiting.
 */
export async function PATCH(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  const { slug } = await params;
  if (!(await requireShopWrite(slug))) return fail('Not authenticated', 401);

  const shop = await prisma.shop.findUnique({ where: { slug }, select: { id: true } });
  if (!shop) return fail('Shop not found', 404);

  const parsed = orderStatusSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  // Scoped by shopId so one shop can never touch another's orders.
  const result = await prisma.order.updateMany({
    where: { id: parsed.data.id, shopId: shop.id },
    data: { status: parsed.data.status },
  });
  if (result.count === 0) return fail('Order not found', 404);

  return ok({ success: true });
}
