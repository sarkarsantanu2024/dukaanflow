import { prisma } from '@/lib/prisma';
import { requireShopWrite } from '@/lib/guard';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { starterSchema } from '@/lib/validators';
import { starterCatalogue } from '@/lib/starter-catalogue';
import { checkItemAllowance, markActivated } from '@/lib/billing';

export const runtime = 'nodejs';

type Context = { params: Promise<{ slug: string }> };

/**
 * Adds picked items from the shop-type starter catalogue.
 *
 * They arrive priced at ₹1 and marked out of stock: an item with an invented
 * price is worse than no item at all, so nothing a customer sees goes live
 * until the owner sets a real price. The names, units, categories and all three
 * translations are already correct, which is the part that takes an evening to
 * dictate.
 */
export async function POST(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  const { slug } = await params;
  if (!(await requireShopWrite(slug))) return fail('Not authenticated', 401);

  const shop = await prisma.shop.findUnique({ where: { slug }, select: { id: true, type: true } });
  if (!shop) return fail('Shop not found', 404);

  const parsed = starterSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  const catalogue = starterCatalogue(shop.type);
  const picked = catalogue.filter((item) => parsed.data.names.includes(item.name));
  if (picked.length === 0) return fail('Nothing selected', 400);

  const refusal = await checkItemAllowance(shop.id, picked.length);
  if (refusal) return fail(refusal.message, refusal.status);

  let created = 0;
  for (const item of picked) {
    const result = await prisma.item.upsert({
      where: { shopId_name_unit: { shopId: shop.id, name: item.name, unit: item.unit } },
      create: {
        shopId: shop.id,
        name: item.name,
        nameBn: item.nameBn,
        nameHi: item.nameHi,
        unit: item.unit,
        category: item.category,
        price: 1,
        inStock: true,
      },
      // Already listed? Leave the owner's own price and stock completely alone.
      update: {},
      select: { id: true, createdAt: true, updatedAt: true },
    });
    if (result.createdAt.getTime() === result.updatedAt.getTime()) created += 1;
  }

  if (created > 0) await markActivated(shop.id);

  return ok({ created, requested: picked.length }, 201);
}
