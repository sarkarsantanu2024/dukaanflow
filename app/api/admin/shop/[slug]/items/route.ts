import { prisma } from '@/lib/prisma';
import { requireShopWrite } from '@/lib/guard';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { itemDeleteSchema, itemPatchSchema, itemUpsertSchema } from '@/lib/validators';
import { checkEditAllowance, checkItemAllowance, markActivated } from '@/lib/billing';

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
  const { slug } = await params;
  if (!(await requireShopWrite(slug))) return fail('Not authenticated', 401);

  const shopId = await shopIdFor(slug);
  if (!shopId) return fail('Shop not found', 404);

  const parsed = itemUpsertSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  const { name, nameBn, nameHi, price, unit, category, inStock } = parsed.data;

  // Re-pricing something the shop already has is an edit, not a new item, so
  // it stays allowed right up to the catalogue limit rather than being refused
  // at it — a shop at its limit must still be able to correct a price.
  const existing = await prisma.item.findUnique({
    where: { shopId_name_unit: { shopId, name, unit } },
    select: { id: true },
  });

  const refusal = existing
    ? await checkEditAllowance(shopId)
    : await checkItemAllowance(shopId, 1);
  if (refusal) return fail(refusal.message, refusal.status);

  const item = await prisma.item.upsert({
    where: { shopId_name_unit: { shopId, name, unit } },
    create: { shopId, name, nameBn, nameHi, price, unit, category, inStock },
    // Blank translations on an update mean "unchanged", never "clear it" — a
    // quick voice re-price must not wipe names typed by hand earlier.
    update: {
      price,
      category,
      inStock,
      ...(nameBn ? { nameBn } : {}),
      ...(nameHi ? { nameHi } : {}),
    },
    select: {
      id: true,
      name: true,
      nameBn: true,
      nameHi: true,
      price: true,
      unit: true,
      category: true,
      inStock: true,
    },
  });

  if (!existing) await markActivated(shopId);

  return ok(item, 201);
}

/** PATCH — price / stock / category of one existing item. */
export async function PATCH(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  const { slug } = await params;
  if (!(await requireShopWrite(slug))) return fail('Not authenticated', 401);

  const shopId = await shopIdFor(slug);
  if (!shopId) return fail('Shop not found', 404);

  const refusal = await checkEditAllowance(shopId);
  if (refusal) return fail(refusal.message, refusal.status);

  const parsed = itemPatchSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  const { id, ...changes } = parsed.data;

  try {
    // Scoped by shopId so one shop's id can never mutate another shop's item.
    const result = await prisma.item.updateMany({ where: { id, shopId }, data: changes });
    if (result.count === 0) return fail('Item not found', 404);
  } catch (error) {
    // (shopId, name, unit) is unique, so re-pricing a unit onto one the shop
    // already lists collides. Said plainly rather than as a database error:
    // the owner meant to have one of these, not to be told about a constraint.
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      return fail('You already have this item in that unit. Edit that one instead.', 409);
    }
    throw error;
  }

  return ok({ success: true });
}

/** DELETE — remove one item from this shop. */
export async function DELETE(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  const { slug } = await params;
  if (!(await requireShopWrite(slug))) return fail('Not authenticated', 401);

  const shopId = await shopIdFor(slug);
  if (!shopId) return fail('Shop not found', 404);

  const parsed = itemDeleteSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  const result = await prisma.item.deleteMany({ where: { id: parsed.data.id, shopId } });
  if (result.count === 0) return fail('Item not found', 404);

  return ok({ success: true });
}
