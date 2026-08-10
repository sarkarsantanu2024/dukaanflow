import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/guard';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { itemDeleteSchema, itemPatchSchema, itemUpsertSchema } from '@/lib/validators';

export const runtime = 'nodejs';

type Context = { params: Promise<{ slug: string }> };

async function shopIdFor(slug: string): Promise<string | null> {
  const shop = await prisma.shop.findUnique({ where: { slug }, select: { id: true } });
  return shop?.id ?? null;
}

/**
 * POST — create or update an item, keyed by (shopId, name, unit).
 * Re-adding "Rice / 1 kg" updates the existing row instead of creating a twin.
 */
export async function POST(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  if (!(await requireAdmin())) return fail('Not authenticated', 401);

  const { slug } = await params;
  const shopId = await shopIdFor(slug);
  if (!shopId) return fail('Shop not found', 404);

  const parsed = itemUpsertSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  const { name, price, unit, category, inStock } = parsed.data;

  const item = await prisma.item.upsert({
    where: { shopId_name_unit: { shopId, name, unit } },
    create: { shopId, name, price, unit, category, inStock },
    update: { price, category, inStock },
    select: { id: true, name: true, price: true, unit: true, category: true, inStock: true },
  });

  return ok(item, 201);
}

/** PATCH — price / stock / category of one existing item. */
export async function PATCH(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  if (!(await requireAdmin())) return fail('Not authenticated', 401);

  const { slug } = await params;
  const shopId = await shopIdFor(slug);
  if (!shopId) return fail('Shop not found', 404);

  const parsed = itemPatchSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  const { id, ...changes } = parsed.data;

  // Scoped by shopId so one shop's id can never mutate another shop's item.
  const result = await prisma.item.updateMany({ where: { id, shopId }, data: changes });
  if (result.count === 0) return fail('Item not found', 404);

  return ok({ success: true });
}

/** DELETE — remove one item from this shop. */
export async function DELETE(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  if (!(await requireAdmin())) return fail('Not authenticated', 401);

  const { slug } = await params;
  const shopId = await shopIdFor(slug);
  if (!shopId) return fail('Shop not found', 404);

  const parsed = itemDeleteSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  const result = await prisma.item.deleteMany({ where: { id: parsed.data.id, shopId } });
  if (result.count === 0) return fail('Item not found', 404);

  return ok({ success: true });
}
