import { prisma } from '@/lib/prisma';
import { requireShopWrite } from '@/lib/guard';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { bulkSchema } from '@/lib/validators';
import { matchKey, parseBulk, splitNameAndUnit } from '@/lib/bulk';
import { suggestNames } from '@/lib/speech';
import { checkEditAllowance, markActivated, shopEntitlement } from '@/lib/billing';

export const runtime = 'nodejs';

type Context = { params: Promise<{ slug: string }> };

/**
 * POST /api/admin/shop/[slug]/bulk
 *
 * Price mode creates items that do not exist yet (a shop's whole catalogue can
 * be pasted in one go). Stock mode never creates — flipping stock on an item
 * that isn't there is a typo, and is reported as a failed row.
 */
export async function POST(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  const { slug } = await params;
  if (!(await requireShopWrite(slug))) return fail('Not authenticated', 401);

  const shop = await prisma.shop.findUnique({ where: { slug }, select: { id: true } });
  if (!shop) return fail('Shop not found', 404);

  const refusal = await checkEditAllowance(shop.id);
  if (refusal) return fail(refusal.message, refusal.status);

  const parsed = bulkSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  const { mode, text } = parsed.data;
  const { parsed: lines, failed } = parseBulk(text, mode);

  const existing = await prisma.item.findMany({
    where: { shopId: shop.id },
    select: { id: true, name: true, unit: true },
  });
  const byKey = new Map(existing.map((item) => [matchKey(item.name, item.unit), item.id]));

  let updated = 0;
  let created = 0;
  const failedRows = [...failed];
  // A paste that runs past the plan limit fills the remaining room and reports
  // the rest, rather than refusing the whole paste. The shopkeeper keeps the
  // work they did, and is told exactly what did not fit.
  const state = await shopEntitlement(shop.id);
  let room = state ? state.remaining : 0;
  const overLimit: string[] = [];

  for (const line of lines) {
    const key = matchKey(line.label, '');
    const itemId = byKey.get(key);

    if (itemId) {
      await prisma.item.update({
        where: { id: itemId },
        data:
          line.kind === 'price'
            ? // `priced` is what the storefront reads, not the number. A paste
              // that set the number and left the flag alone is why an owner
              // could see "₹50" on a row and "No price set" beside it, and the
              // customer saw no row at all. Typing a price into the row set the
              // flag; pasting the same price did not.
              { pricePaise: line.pricePaise, priced: true }
            : { inStock: line.inStock },
      });
      updated += 1;
      continue;
    }

    if (line.kind === 'stock') {
      failedRows.push(line.raw);
      continue;
    }

    const { name, unit } = splitNameAndUnit(line.label);
    if (!name) {
      failedRows.push(line.raw);
      continue;
    }

    if (room <= 0) {
      overLimit.push(line.raw);
      continue;
    }
    room -= 1;

    // A pasted list is typed in one language and read in three. Without this
    // a Bengali shop that pastes "Rice 1 kg = 55" lists a row its own owner
    // reads in roman letters.
    const known = suggestNames(name);

    const item = await prisma.item.upsert({
      where: { shopId_name_unit: { shopId: shop.id, name, unit } },
      // A pasted price list is somebody stating prices, so every row it
      // creates goes on sale — otherwise a shop pastes its whole catalogue and
      // the shop page stays empty with no explanation.
      create: {
        shopId: shop.id,
        name,
        unit,
        nameBn: known?.bn ?? '',
        nameHi: known?.hi ?? '',
        pricePaise: line.pricePaise,
        priced: true,
      },
      update: { pricePaise: line.pricePaise, priced: true },
      select: { id: true },
    });
    byKey.set(matchKey(name, unit), item.id);
    created += 1;
  }

  if (created > 0) await markActivated(shop.id);

  return ok({
    updated,
    created,
    failed: failedRows.length,
    failedRows,
    overLimit: overLimit.length,
    overLimitRows: overLimit,
    itemLimit: state?.itemLimit ?? null,
    planName: state?.plan.name ?? null,
  });
}
