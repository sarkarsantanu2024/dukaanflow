import { prisma } from '@/lib/prisma';
import { requireShopWrite } from '@/lib/guard';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { saleSchema } from '@/lib/validators';
import { upsertCustomer } from '@/lib/khata';

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
    select: { id: true, name: true, unit: true, price: true },
  });
  const byId = new Map(rows.map((row) => [row.id, row]));

  const lines = [];
  let totalAmount = 0;

  for (const line of items) {
    const item = byId.get(line.itemId);
    // An item deleted mid-sale simply drops out; the rest of the sale stands.
    if (!item) continue;
    const amount = item.price * line.quantity;
    totalAmount += amount;
    lines.push({
      name: item.name,
      unit: item.unit,
      quantity: line.quantity,
      price: item.price,
      amount,
    });
  }

  if (lines.length === 0) return fail('Nothing to record', 400);

  const sale = await prisma.sale.create({
    data: { shopId: shop.id, itemsJson: lines, totalAmount, paymentMode },
    select: { id: true, totalAmount: true, createdAt: true },
  });

  // One action at the counter, two records: the sale, and what is now owed.
  if (paymentMode === 'KHATA' && customerPhone) {
    const customer = await upsertCustomer(shop.id, customerPhone, customerName, customerArea);
    await prisma.ledgerEntry.create({
      data: {
        shopId: shop.id,
        customerId: customer.id,
        kind: 'DEBIT',
        amount: totalAmount,
        note: lines.map((line) => `${line.name} x${line.quantity}`).join(', ').slice(0, 120),
        saleId: sale.id,
      },
    });
  }

  return ok(sale, 201);
}
