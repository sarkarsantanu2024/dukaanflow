import { prisma } from '@/lib/prisma';
import { openedToday, openingCashRequired } from '@/lib/cash-day';
import { requireShopWrite } from '@/lib/guard';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { saleSchema } from '@/lib/validators';
import { upsertCustomer } from '@/lib/khata';
import { linePaise } from '@/lib/money';
import { amountLabel, isLooseUnit } from '@/lib/units';

export const runtime = 'nodejs';

type Context = { params: Promise<{ slug: string }> };

/** Below the 3 dp that quantities are kept to: anything less is an empty shelf. */
const EMPTY_SHELF = 0.0005;

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

  // No counter sale before today's opening cash is in. See `lib/cash-day.ts`.
  if (!(await openedToday(shop.id))) return openingCashRequired();

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

  /**
   * Whole numbers only for anything counted rather than weighed — the same rule
   * the order route enforces, for the same reason: nobody hands over 0.4 of a
   * bottle. Refused rather than rounded, because rounding here charged for one
   * amount while the stock below moved by another.
   */
  const indivisible = items
    .map((line) => byId.get(line.itemId))
    .filter((item, index) => item && !isLooseUnit(item.unit) && !Number.isInteger(items[index]!.quantity));
  if (indivisible.length > 0) {
    return fail(
      `${indivisible.map((item) => [item!.name, item!.unit].filter(Boolean).join(' ')).join(', ')} — sold whole. Please choose a whole number.`,
      409,
    );
  }

  const lines: { name: string; unit: string; quantity: number; pricePaise: number; amountPaise: number }[] = [];
  let totalAmountPaise = 0;

  for (const line of items) {
    const item = byId.get(line.itemId);
    // An item deleted mid-sale simply drops out; the rest of the sale stands.
    if (!item) continue;
    /**
     * A COUNTER SALE IS WEIGHED TOO — COUNTED OR NOT.
     *
     * The till sells whatever the shop sells, in whatever amount the customer
     * asked for at the counter — fifty grams of posto off a kilo price is the
     * same sale here as on the shop page. So the quantity may be fractional,
     * and the money is rounded to the paise once, here.
     *
     * It used to be whole whenever the item had a stock count, a leftover from
     * when `stockQty` was an integer. The card still offered 250 g of counted
     * rice, the stock moved by 0.25 and the bill charged a full kilo. The amount
     * charged and the amount taken off the shelf are now the same number.
     */
    const quantity = line.quantity;
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

  /**
   * The sale, the stock and the udhaar, together or not at all.
   *
   * These used to be separate writes: a failure between them left a sale with
   * no khata entry (goods gone on credit that nobody owes for), and the stock
   * was set from a count read before the sale, so a QR order landing in the
   * same moment had its decrement silently overwritten.
   */
  const sale = await prisma.$transaction(
    async (tx) => {
      const sale = await tx.sale.create({
        data: { shopId: shop.id, itemsJson: lines, totalAmountPaise, paymentMode },
        select: { id: true, totalAmountPaise: true, createdAt: true },
      });

      /**
       * The till moves stock too.
       *
       * Otherwise the count means nothing: a shop that sells six of its eight
       * packets across the counter would still be offering eight on its shop
       * page, and the whole point of counting is that the page stops offering
       * what has gone.
       *
       * Deliberately not refused. The customer is standing at the counter with
       * the packet in their hand — this is a record of something that has
       * already happened, and an app that refuses to write down a sale because
       * its own count disagreed would be telling a shopkeeper they did not just
       * sell what they just sold. So the count is floored at zero and the sale
       * stands either way.
       *
       * The decrement is atomic (the quantity is in the WHERE, as in the order
       * route) rather than read-then-write, so concurrent orders are not lost.
       * Fractions are fine: `stockQty` is a decimal in the item's own unit, so
       * 300 g off a kilo leaves 0.7 on the shelf.
       */
      for (const line of items) {
        const item = byId.get(line.itemId);
        if (!item || item.stockQty === null) continue;
        const taken = await tx.item.updateMany({
          where: { id: item.id, stockQty: { gte: line.quantity } },
          data: { stockQty: { decrement: line.quantity } },
        });
        // Not enough left by the count (or it ran out meanwhile): floor at zero.
        // Otherwise only tidy a float remainder at zero. Either way, reaching
        // zero takes the item off the shop page.
        await tx.item.updateMany({
          where:
            taken.count === 0
              ? { id: item.id, stockQty: { not: null } }
              : { id: item.id, stockQty: { lt: EMPTY_SHELF } },
          data: { stockQty: 0, inStock: false },
        });
      }

      // One action at the counter, two records: the sale, and what is now owed.
      if (paymentMode === 'KHATA' && customerPhone) {
        const customer = await upsertCustomer(shop.id, customerPhone, customerName, customerArea, '', {
          client: tx,
        });
        await tx.ledgerEntry.create({
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

      return sale;
    },
    // A long till (dozens of lines) is two statements per line; the 5 s
    // default is too tight against a database a few tens of ms away.
    { timeout: 20_000 },
  );

  return ok(sale, 201);
}
