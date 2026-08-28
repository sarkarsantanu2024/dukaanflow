import { prisma } from '@/lib/prisma';
import { requireShopWrite } from '@/lib/guard';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { shopHoursSchema } from '@/lib/validators';

export const runtime = 'nodejs';

type Context = { params: Promise<{ slug: string }> };

/**
 * PATCH — the hours the shop keeps, whether it is open today, and why not.
 *
 * On `requireShopWrite` rather than `requireAdmin`, unlike every other shop
 * setting. The rest of them — the WhatsApp number, the slug, the plan — are
 * the operator's business. When a shop opens is nobody's business but the
 * shopkeeper's, and it is the one shop-level fact that changes with the
 * seasons, a festival or a family illness. Making them ring the Super Admin to
 * change it would mean it simply stayed wrong.
 */
export async function PATCH(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  const { slug } = await params;
  if (!(await requireShopWrite(slug))) return fail('Not authenticated', 401);

  const parsed = shopHoursSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  const { openTime, closeTime, active, closedNote } = parsed.data;

  const result = await prisma.shop.updateMany({
    where: { slug },
    data: {
      openTime,
      closeTime,
      closedNote,
      // Omitted means "leave it alone" — saving hours must not silently
      // reopen a shop the owner shut this morning.
      ...(active === undefined ? {} : { active }),
    },
  });
  if (result.count === 0) return fail('Shop not found', 404);

  return ok({ success: true });
}
