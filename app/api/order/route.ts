import { prisma } from '@/lib/prisma';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { orderSchema } from '@/lib/validators';
import type { OrderLine } from '@/lib/whatsapp';

export const runtime = 'nodejs';

/**
 * POST /api/order
 *
 * The client sends item ids and quantities only. Prices, stock status and the
 * total are all resolved here from the database — a tampered payload cannot
 * change what the shop is asked to charge.
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail('Bad request', 403);

  // 12 orders per 5 minutes per IP. A family sharing a connection stays fine;
  // a script spamming the shop owner's WhatsApp does not.
  const limit = rateLimit(`order:${clientIp(request)}`, 12, 5 * 60 * 1000);
  if (!limit.ok) {
    return fail(`Too many orders. Please wait ${limit.retryAfterSeconds}s and try again.`, 429);
  }

  const parsed = orderSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  const { shopSlug, customerName, customerPhone, customerAddress, customerPincode, orderType, items } =
    parsed.data;

  const shop = await prisma.shop.findUnique({
    where: { slug: shopSlug },
    select: { id: true, name: true, phone: true, active: true, deliveryEnabled: true },
  });
  if (!shop) return fail('Shop not found', 404);
  if (!shop.active) return fail('This shop is not accepting orders right now', 409);

  // The storefront hides the option, but hiding is not enforcing: a delivery
  // this shop never offered would be a promise its owner has to break by phone.
  if (orderType === 'DELIVERY' && !shop.deliveryEnabled) {
    return fail('This shop is collection only. Please choose Pickup.', 409);
  }

  // Collapse duplicate ids so a repeated line cannot inflate the quantity cap.
  const requested = new Map<string, number>();
  for (const entry of items) {
    requested.set(entry.itemId, Math.min(99, (requested.get(entry.itemId) ?? 0) + entry.quantity));
  }

  const dbItems = await prisma.item.findMany({
    where: { id: { in: [...requested.keys()] }, shopId: shop.id },
    select: {
      id: true,
      name: true,
      nameBn: true,
      nameHi: true,
      unit: true,
      price: true,
      priced: true,
      inStock: true,
    },
  });

  if (dbItems.length !== requested.size) {
    return fail('Some items are no longer available. Please refresh the page.', 409);
  }

  // The storefront never lists these, but a stale tab or a hand-made payload
  // could still name one, and a placeholder Re 1 must never become a sale.
  if (dbItems.some((item) => !item.priced)) {
    return fail('Some items are not on sale yet. Please refresh the page.', 409);
  }

  const outOfStock = dbItems.filter((item) => !item.inStock);
  if (outOfStock.length > 0) {
    const names = outOfStock.map((item) => [item.name, item.unit].filter(Boolean).join(' '));
    return fail(`Out of stock: ${names.join(', ')}. Please remove and try again.`, 409);
  }

  const lines: OrderLine[] = dbItems.map((item) => {
    const quantity = requested.get(item.id)!;
    return {
      name: item.name,
      unit: item.unit,
      price: item.price,
      quantity,
      lineTotal: item.price * quantity,
    };
  });

  const totalAmount = lines.reduce((sum, line) => sum + line.lineTotal, 0);

  const order = await prisma.order.create({
    data: {
      shopId: shop.id,
      customerName,
      customerPhone,
      customerAddress,
      customerPincode,
      orderType,
      // Snapshot: prices here are what was quoted, regardless of later edits.
      //
      // `amount` is the name a Sale's snapshot already uses. This one called it
      // `lineTotal`, and the screen reading it looked for `amount` — so every
      // line showed ₹0 under a correct total. One name for one thing.
      itemsJson: dbItems.map((item) => ({
        itemId: item.id,
        name: item.name,
        // All three, because the snapshot has to stand on its own: the item may
        // be renamed or deleted long before the owner reads the order back, and
        // an order that can only be read in English is no use to a shopkeeper
        // whose app is in Bengali.
        nameBn: item.nameBn,
        nameHi: item.nameHi,
        unit: item.unit,
        price: item.price,
        quantity: requested.get(item.id)!,
        amount: item.price * requested.get(item.id)!,
      })),
      totalAmount,
    },
    select: { id: true },
  });

  // No WhatsApp handoff any more.
  //
  // The order used to be pushed into the owner's WhatsApp as a message the
  // customer sent. It worked, and at volume it buried the owner's personal
  // chats under order after order — the one inbox they also use for their
  // family. The orders now live in the owner's own app, where the header bell
  // counts them from every screen and can chime, and where each one can
  // actually be worked rather than only read.
  return ok({ orderId: order.id, totalAmount });
}
