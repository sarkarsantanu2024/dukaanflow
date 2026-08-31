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
 * They arrive at the catalogue's price, in stock, and ON SALE.
 *
 * This is a deliberate reversal, and worth naming. The list used to add items
 * at a Re 1 placeholder and leave them unpriced, on the reasoning that a
 * suggested price is a wrong price. What that produced in practice was an
 * owner ticking sixty items, getting sixty rows reading ₹1 and a banner saying
 * customers could see none of them — sixty prices to type before the shop page
 * showed anything at all. Most owners stopped there, and a shop that lists
 * nothing serves nobody.
 *
 * So the trade is made the other way now: the shop is open from the first tap,
 * at prices in the right neighbourhood, and the owner corrects what is wrong
 * while they are trading rather than before they may begin. The catalogue's
 * numbers are typical retail for the pack size and are stale the day they are
 * written — see the note in `lib/starter-catalogue.ts`. An owner who never
 * looks at them is quoting an average, which is a real cost and is why the
 * unpriced banner and the per-row price box both stay exactly where they are.
 *
 * Stock is the owner's word about their own shelf, and nothing but the owner
 * should ever be the one to say a thing has run out. The names, units,
 * categories and all three translations are already correct, which is the part
 * that takes an evening to dictate.
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
  let repriced = 0;

  for (const item of picked) {
    const existing = await prisma.item.findUnique({
      where: { shopId_name_unit: { shopId: shop.id, name: item.name, unit: item.unit } },
      select: { id: true, priced: true },
    });

    if (!existing) {
      await prisma.item.create({
        data: {
          shopId: shop.id,
          name: item.name,
          nameBn: item.nameBn,
          nameHi: item.nameHi,
          unit: item.unit,
          category: item.category,
          pricePaise: item.pricePaise,
          priced: true,
          inStock: true,
        },
      });
      created += 1;
      continue;
    }

    /**
     * Already listed and already priced? Leave it completely alone — that
     * number is the owner's, and a shop-type average must never overwrite what
     * a shopkeeper actually charges.
     *
     * Already listed and still UNPRICED is the other case, and it is the one
     * that strands a shop: those rows are the Re 1 placeholders from before
     * this list carried prices, invisible to every customer and fixable only
     * one at a time. Ticking the item again is the owner asking for the
     * catalogue's answer, so they get it.
     */
    if (!existing.priced) {
      await prisma.item.update({
        where: { id: existing.id },
        data: { pricePaise: item.pricePaise, priced: true },
      });
      repriced += 1;
    }
  }

  if (created > 0) await markActivated(shop.id);

  return ok({ created, repriced, requested: picked.length }, 201);
}
