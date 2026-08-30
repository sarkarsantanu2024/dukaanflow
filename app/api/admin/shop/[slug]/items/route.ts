import { prisma } from '@/lib/prisma';
import { requireShopWrite } from '@/lib/guard';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { itemDeleteSchema, itemPatchSchema, itemUpsertSchema } from '@/lib/validators';
import { checkEditAllowance, checkItemAllowance, markActivated } from '@/lib/billing';
import { normaliseItemName, normaliseUnit } from '@/lib/units';

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

  const { nameBn, nameHi, pricePaise, category, inStock, priced } = parsed.data;

  // Canonical spelling before anything else touches these.
  //
  // The unique key is (shop, name, unit) on the exact strings, which every
  // variant spelling satisfies: "Rice"/"1kg" and "Rice"/"1 KG" are two rows to
  // Postgres and one shelf to a shopkeeper. Normalising here is what makes the
  // key mean what it looks like it means.
  const name = normaliseItemName(parsed.data.name);
  const unit = normaliseUnit(parsed.data.unit);

  // Re-pricing something the shop already has is an edit, not a new item, so
  // it stays allowed right up to the catalogue limit rather than being refused
  // at it — a shop at its limit must still be able to correct a price.
  //
  // Matched case-insensitively, because "rice" typed today must find "Rice"
  // listed last week rather than sit beside it. The existing row keeps its own
  // capitalisation: the owner chose it, and a re-price is not a rename.
  const existing = await prisma.item.findFirst({
    where: {
      shopId,
      name: { equals: name, mode: 'insensitive' },
      unit: { equals: unit, mode: 'insensitive' },
    },
    select: { id: true },
  });

  const refusal = existing
    ? await checkEditAllowance(shopId)
    : await checkItemAllowance(shopId, 1);
  if (refusal) return fail(refusal.message, refusal.status);

  const shape = {
    id: true,
    name: true,
    nameBn: true,
    nameHi: true,
    pricePaise: true,
    priced: true,
    unit: true,
    category: true,
    inStock: true,
  } as const;

  const item = existing
    ? await prisma.item.update({
        where: { id: existing.id },
        // Blank translations on an update mean "unchanged", never "clear it" —
        // a quick voice re-price must not wipe names typed by hand earlier.
        data: {
          pricePaise,
          // A re-price is always deliberate, so it puts the item on sale even
          // if it arrived as a placeholder.
          priced: priced || undefined,
          category,
          inStock,
          ...(nameBn ? { nameBn } : {}),
          ...(nameHi ? { nameHi } : {}),
        },
        select: shape,
      })
    : await prisma.item.create({
        data: { shopId, name, nameBn, nameHi, pricePaise, priced, unit, category, inStock },
        select: shape,
      });

  if (!existing) await markActivated(shopId);

  // Which of the two happened is the caller's business. Silently overwriting a
  // price and reporting "added" is how an owner comes to believe they have two
  // rows for rice when they have one.
  return ok({ ...item, duplicate: Boolean(existing) }, existing ? 200 : 201);
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
