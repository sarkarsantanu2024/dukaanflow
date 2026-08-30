import { prisma } from '@/lib/prisma';
import { requireShopWrite } from '@/lib/guard';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { deliveryTermsSchema } from '@/lib/validators';

export const runtime = 'nodejs';

type Context = { params: Promise<{ slug: string }> };

/**
 * PATCH — what this shop charges to deliver, and the smallest order it sends.
 *
 * On `requireShopWrite` for the same reason the notice is: a delivery charge
 * moves with the price of petrol and with who is free to run the round this
 * week. The operator sets the shop's identity; the shopkeeper sets the terms
 * they trade on.
 */
export async function PATCH(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  const { slug } = await params;
  if (!(await requireShopWrite(slug))) return fail('Not authenticated', 401);

  const parsed = deliveryTermsSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  const result = await prisma.shop.updateMany({ where: { slug }, data: parsed.data });
  if (result.count === 0) return fail('Shop not found', 404);

  // Orders already placed keep the charge they were quoted — `deliveryFeePaise`
  // on the order is a snapshot for exactly that reason. Nothing here reaches
  // back into them.
  return ok({ success: true });
}
