import { prisma } from '@/lib/prisma';
import { requireShopWrite } from '@/lib/guard';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { saleSchema } from '@/lib/validators';
import { upsertCustomer } from '@/lib/khata';
import { linePaise } from '@/lib/money';
import { amountLabel, isLooseUnit } from '@/lib/units';

export const runtime = 'nodejs';

type Context = { params: Promise<{ slug: string }> };

/**
 * Records a counter sale.
 *
 * Prices come from the database, never from the client — the same rule the
 * customer order route follows. The till total must be the shop's own prices
 * even when the request comes from the shop's own phone.
 */
export async function POST(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  const { slug } = await params;
  if (!(await requireShopWrite(slug))) return fail('Not authenticated', 401);

  const shop = await prisma.shop.findUnique({ where: { slug }, select: { id: true } });
  if (!shop) return fail('Shop not found', 404);

  const parsed = saleSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  const { items, paymentMode, customerPhone, customerName, customerArea } = parsed.data;

  // Goods leaving on credit need somebody to owe for them.
  if (paymentMode === 'KHATA' && !customerPhone) {
    return fail('Choose who the udhaar is for', 422, {
      customerPhone: 'Whose khata is this?',
    });
  }

  const rows = await prisma.item.findMany({
    where: { shopId: shop.id, id: { in: items.map((line) => line.itemId) } },
    select: { id: true, name: true, unit: true, pricePaise: true, stockQty: true },
  });
  const byId = new Map(rows.map((row) => [row.id, row]));

  const lines = [];
  let totalAmountPaise = 0;

  for (const line of items) {
    const item = byId.get(line.itemId);
    // An item deleted mid-sale simply drops out; the rest of the sale stands.
    if (!item) continue;
    /**
     * A COUNTER SALE IS WEIGHED TOO.
     *
     * The till sells whatever the shop sells, in whatever amount the customer
     * asked for at the counter — fifty grams of posto off a kilo price is the
     * same sale here as on the shop page. So the quantity may be fractional,
     * and the money is rounded to the paise once, here.
     *
     * Whole for anything counted rather than weighed: the same rule the order
     * route enforces, for the same reason — nobody hands over 0.4 of a bottle.
     */
    const quantity =
      isLooseUnit(item.unit) && item.stockQty === null
        ? line.quantity
        : Math.max(1, Math.round(line.quantity));
    const amountPaise = linePaise(item.pricePaise, quantity);
    totalAmountPaise += amountPaise;
    // The snapshot keys carry their unit. Readers of this JSON get no help
    // from the compiler, so the name is the only thing telling them these are
    // paise and not rupees — see `linePaise` in lib/analytics.ts.
    lines.push({
      name: item.name,
      unit: item.unit,
      quantity,
      pricePaise: item.pricePaise,
      amountPaise,
    });
  }

  if (lines.length === 0) return fail('Nothing to record', 400);

  const sale = await prisma.sale.create({
    data: { shopId: shop.id, itemsJson: lines, totalAmountPaise, paymentMode },
    select: { id: true, totalAmountPaise: true, createdAt: true },
  });

  /**
   * The till moves stock too.
   *
   * Otherwise the count means nothing: a shop that sells six of its eight
   * packets across the counter would still be offering eight on its shop page,
   * and the whole point of counting is that the page stops offering what has
   * gone.
   *
   * Deliberately AFTER the sale is recorded and deliberately not refused. The
   * customer is standing at the counter with the packet in their hand — this is
   * a record of something that has already happened, and an app that refuses to
   * write down a sale because its own count disagreed would be telling a
   * shopkeeper they did not just sell what they just sold. So the count is
   * floored at zero and the sale stands either way.
   */
  for (const line of items) {
    const item = byId.get(line.itemId);
    if (!item || item.stockQty === null) continue;
    // A counted item is never sold in fractions (see above), so this stays a
    // whole number going into a whole-number column.
    const left = Math.max(0, item.stockQty - Math.round(line.quantity));
    await prisma.item.update({
      where: { id: item.id },
      data: { stockQty: left, ...(left === 0 ? { inStock: false } : {}) },
    });
  }

  // One action at the counter, two records: the sale, and what is now owed.
  if (paymentMode === 'KHATA' && customerPhone) {
    const customer = await upsertCustomer(shop.id, customerPhone, customerName, customerArea);
    await prisma.ledgerEntry.create({
      data: {
        shopId: shop.id,
        customerId: customer.id,
        kind: 'DEBIT',
        amountPaise: totalAmountPaise,
        // "Posto 50 g", not "Posto x0.05" — the udhaar note is read by the
        // shopkeeper and, at a statement, by the customer who owes it.
        note: lines
          .map((line) => `${line.name} ${amountLabel(line.unit, line.quantity) ?? `x${line.quantity}`}`)
          .join(', ')
          .slice(0, 120),
        saleId: sale.id,
      },
    });
  }

  return ok(sale, 201);
}
