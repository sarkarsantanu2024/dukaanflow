import { prisma } from '@/lib/prisma';
import { requireShopWrite } from '@/lib/guard';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { itemDeleteSchema, itemPatchSchema, itemUpsertSchema } from '@/lib/validators';
import { checkEditAllowance, checkItemAllowance, markActivated } from '@/lib/billing';
import { normaliseItemName, normaliseUnit } from '@/lib/units';
import { suggestNames } from '@/lib/speech';

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

  const { pricePaise, category, inStock, priced } = parsed.data;

  // Canonical spelling before anything else touches these.
  //
  // The unique key is (shop, name, unit) on the exact strings, which every
  // variant spelling satisfies: "Rice"/"1kg" and "Rice"/"1 KG" are two rows to
  // Postgres and one shelf to a shopkeeper. Normalising here is what makes the
  // key mean what it looks like it means.
  const name = normaliseItemName(parsed.data.name);
  const unit = normaliseUnit(parsed.data.unit);

  /**
   * THE OTHER TWO LANGUAGES, FILLED HERE RATHER THAN HOPED FOR.
   *
   * An item's name shows in the reader's own language and falls back to the
   * primary one, so a row saved with `nameBn` blank reads in roman letters to a
   * Bengali owner and a Bengali customer — which is what "Basmoti Rice" sitting
   * in a Bengali shop actually was. Every client had its own half of this logic
   * and each of them could skip it: the typed form filled the fields, voice
   * filled them only for names it recognised, the photo scanner filled them
   * only on a catalogue hit, and the bulk paste never filled them at all.
   *
   * One place, on the way in, covers all four. Only blanks are filled — a
   * translation the client sent is the owner's and always wins — and only exact
   * vocabulary hits are used, because a guessed translation is one the owner
   * cannot read back to check.
   */
  const known = suggestNames(name);
  const nameBn = parsed.data.nameBn || known?.bn || '';
  const nameHi = parsed.data.nameHi || known?.hi || '';

  // Re-pricing something the shop already has is an edit, not a new item, so
  // it stays allowed right up to the catalogue limit rather than being refused
  // at it — a shop at its limit must still be able to correct a price.
  //
  // Matched case-insensitively, because "rice" typed today must find "Rice"
  // listed last week rather than sit beside it. The existing row keeps its own
  // capitalisation: the owner chose it, and a re-price is not a rename.
  let existing = await prisma.item.findFirst({
    where: {
      shopId,
      name: { equals: name, mode: 'insensitive' },
      unit: { equals: unit, mode: 'insensitive' },
    },
    select: { id: true, unit: true },
  });

  /**
   * A NAME WITH NO PACK SIZE IS NOT A SECOND PRODUCT.
   *
   * The key is (shop, name, unit), which is right and has to stay right: Dal
   * 500 g beside Dal 1 kg is a kirana doing its job. But an empty unit is not a
   * pack size — it is the absence of one — and treating it as a distinct value
   * meant every path that saves without a unit (the mic, a photographed packet,
   * a form left blank) created a twin of a row the shop already had. The owner
   * was promised "same name, and the old one changes"; what they got was মুড়ি
   * listed twice at two prices, which is exactly what a customer cannot choose
   * between.
   *
   * So a unit-less save lands on the row that already carries that name, and
   * keeps that row's pack size — the owner chose it, and saying the name again
   * is not an instruction to forget it. Only when the shop has no row of that
   * name at all does this create one.
   *
   * The reverse is deliberately NOT done: a save that names a pack size means
   * that pack size, and must be free to open a second shelf beside an existing
   * unit-less row rather than silently overwriting it.
   */
  if (!existing && !unit) {
    existing = await prisma.item.findFirst({
      where: { shopId, name: { equals: name, mode: 'insensitive' } },
      orderBy: { createdAt: 'asc' },
      select: { id: true, unit: true },
    });
  }

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

  // Same canonical spelling a create gets. The unique key is (shop, name, unit)
  // on the exact strings, so a rename that skipped this could slip "Rice " in
  // beside "Rice" — two rows to Postgres, one shelf to a shopkeeper.
  if (changes.name !== undefined) changes.name = normaliseItemName(changes.name);
  if (changes.unit !== undefined) changes.unit = normaliseUnit(changes.unit);

  /**
   * A count and a stock switch must never disagree.
   *
   * `inStock` stays the one flag the storefront, the till and every report
   * read. So a count arriving here decides it: zero takes the item off the shop
   * page, anything above zero puts it back on. Without this an owner could type
   * "0 left" and go on taking orders for it, which is the exact bug the count
   * was added to fix.
   *
   * An explicit `inStock` in the same request still wins — that is an owner
   * saying something deliberate, such as pulling a counted item off sale
   * because the packets on the shelf are damaged.
   */
  if (changes.stockQty !== undefined && changes.stockQty !== null && changes.inStock === undefined) {
    changes.inStock = changes.stockQty > 0;
  }

  try {
    // Scoped by shopId so one shop's id can never mutate another shop's item.
    const result = await prisma.item.updateMany({ where: { id, shopId }, data: changes });
    if (result.count === 0) return fail('Item not found', 404);
  } catch (error) {
    // (shopId, name, unit) is unique, so editing a name or a unit onto one the
    // shop already lists collides. Said plainly rather than as a database
    // error: the owner meant to have one of these, not to be told about a
    // constraint.
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      return fail('You already have this item in that unit. Edit that one instead.', 409);
    }
    throw error;
  }

  return ok({ success: true });
}

/**
 * DELETE — remove one item, a chosen handful, or every item this shop has.
 *
 * Every branch is scoped by `shopId`, so an id belonging to another shop
 * silently matches nothing rather than deleting somebody else's stock, and
 * `all` can only ever mean "all of this shop's".
 */
export async function DELETE(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  const { slug } = await params;
  if (!(await requireShopWrite(slug))) return fail('Not authenticated', 401);

  const shopId = await shopIdFor(slug);
  if (!shopId) return fail('Shop not found', 404);

  const parsed = itemDeleteSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);
  const target = parsed.data;

  const where =
    'all' in target
      ? { shopId }
      : 'ids' in target
        ? { shopId, id: { in: target.ids } }
        : { shopId, id: target.id };

  const result = await prisma.item.deleteMany({ where });

  // Nothing matched only means "not found" when something specific was named.
  // Emptying a shop that is already empty is not an error; it is a no-op the
  // caller asked for, and answering 404 would make the button look broken.
  if (result.count === 0 && !('all' in target)) return fail('Item not found', 404);

  return ok({ success: true, deleted: result.count });
}
