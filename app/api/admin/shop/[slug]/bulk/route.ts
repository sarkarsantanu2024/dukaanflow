import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/guard';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { bulkSchema } from '@/lib/validators';
import { matchKey, parseBulk, splitNameAndUnit } from '@/lib/bulk';

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
  if (!(await requireAdmin())) return fail('Not authenticated', 401);

  const { slug } = await params;
  const shop = await prisma.shop.findUnique({ where: { slug }, select: { id: true } });
  if (!shop) return fail('Shop not found', 404);

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

  for (const line of lines) {
    const key = matchKey(line.label, '');
    const itemId = byKey.get(key);

    if (itemId) {
      await prisma.item.update({
        where: { id: itemId },
        data: line.kind === 'price' ? { price: line.price } : { inStock: line.inStock },
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

    const item = await prisma.item.upsert({
      where: { shopId_name_unit: { shopId: shop.id, name, unit } },
      create: { shopId: shop.id, name, unit, price: line.price },
      update: { price: line.price },
      select: { id: true },
    });
    byKey.set(matchKey(name, unit), item.id);
    created += 1;
  }

  return ok({ updated, created, failed: failedRows.length, failedRows });
}
