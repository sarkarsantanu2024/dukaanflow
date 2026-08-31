import { after } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireShopWrite } from '@/lib/guard';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { orderReviseSchema, orderStatusSchema } from '@/lib/validators';
import { upsertCustomer } from '@/lib/khata';
import { sendPush } from '@/lib/push';
import { orderRevisedNotification, orderStatusNotification } from '@/lib/push-text';
import { quoteDelivery } from '@/lib/delivery';
import type { Locale } from '@/lib/i18n';

export const runtime = 'nodejs';

type Context = { params: Promise<{ slug: string }> };

/** One line of an order's snapshot, once it has been read back out of JSON. */
type SnapshotLine = {
  itemId: string;
  name: string;
  nameBn: string;
  nameHi: string;
  unit: string;
  pricePaise: number;
  quantity: number;
  amountPaise: number;
};

/**
 * PATCH — move an order through its states.
 *
 * This is what turns an arriving order into a queue the owner can actually
 * work: placed, being prepared, done — or cancelled.
 *
 * COMPLETING WITHOUT PAYMENT POSTS TO THE KHATA. Goods that left the shop
 * unpaid are a debt whether or not anybody wrote it down, and not writing it
 * down is the exact thing Halkhata exists to end. So an order marked done
 * with `paymentReceived: false` creates a DEBIT against that customer in the
 * same breath, the way a counter sale rung up on credit already does.
 *
 * `LedgerEntry.orderId` is unique, so this is safe to call twice: a second tap
 * on "not paid yet" finds the entry already there rather than doubling what the
 * customer owes.
 */
export async function PATCH(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  const { slug } = await params;
  if (!(await requireShopWrite(slug))) return fail('Not authenticated', 401);

  const shop = await prisma.shop.findUnique({
    where: { slug },
    select: { id: true, name: true, locale: true },
  });
  if (!shop) return fail('Shop not found', 404);

  const parsed = orderStatusSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  const { id, status, paymentReceived, paymentMode } = parsed.data;

  // Read it back scoped by shopId, so one shop can never touch another's orders.
  const order = await prisma.order.findFirst({
    where: { id, shopId: shop.id },
    select: {
      id: true,
      status: true,
      orderType: true,
      totalAmountPaise: true,
      customerName: true,
      customerPhone: true,
      itemsJson: true,
    },
  });
  if (!order) return fail('Order not found', 404);

  await prisma.order.update({
    where: { id: order.id },
    // Payment only means anything on a completed order. Recording it on a
    // cancelled or still-preparing one would leave a stale "paid" behind if the
    // order later moved somewhere else.
    data: {
      status,
      paymentReceived: status === 'COMPLETED' ? paymentReceived : false,
      // Only a completed, paid order has a payment mode. Keeping one on an
      // order that moved back to preparing would leave a stale "paid by UPI"
      // behind it.
      paymentMode: status === 'COMPLETED' && paymentReceived ? paymentMode : '',
    },
  });

  /**
   * A cancelled order puts its goods back on the shelf.
   *
   * Only on the way IN to cancelled — `order.status` is what it was before this
   * request — because an owner tapping a cancelled order again must not credit
   * the shop with a second packet of biscuits it never had.
   *
   * Items nobody is counting are skipped, and an item whose count was raised
   * back above zero comes back on sale, which is the same rule the sale itself
   * used in reverse.
   */
  if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
    await restoreStock(shop.id, readSnapshot(order.itemsJson));
  }

  let khataAmountPaise = 0;

  if (status === 'COMPLETED' && !paymentReceived && order.totalAmountPaise > 0) {
    const existing = await prisma.ledgerEntry.findUnique({
      where: { orderId: order.id },
      select: { id: true },
    });

    if (!existing) {
      const customer = await upsertCustomer(shop.id, order.customerPhone, order.customerName);
      await prisma.ledgerEntry.create({
        data: {
          shopId: shop.id,
          customerId: customer.id,
          kind: 'DEBIT',
          amountPaise: order.totalAmountPaise,
          note: summarise(order.itemsJson),
          orderId: order.id,
        },
      });
      khataAmountPaise = order.totalAmountPaise;
    }
  }

  // Paid after all? Take the debt back off the book rather than leaving the
  // customer owing for something they have settled.
  if (status !== 'COMPLETED' || paymentReceived) {
    await prisma.ledgerEntry.deleteMany({ where: { orderId: order.id } });
  }

  /**
   * And the customer is told, without the owner having to remember to tell them.
   *
   * The WhatsApp button beside this is not going anywhere and stays the channel
   * that actually delivers — but it needs a shopkeeper to press it, in a rush,
   * on every order, and mostly it does not get pressed. This costs nobody a tap.
   *
   * Only on the states that are news. Moving an order to "preparing" is not
   * worth interrupting somebody for; `orderStatusNotification` returns null for
   * those and nothing is sent.
   */
  if (status !== order.status) {
    after(async () => {
      const notification = orderStatusNotification({
        locale: shop.locale as Locale,
        shopName: shop.name,
        status,
        orderType: order.orderType,
      });
      if (!notification) return;
      await sendPush(
        { shopId: shop.id, role: 'CUSTOMER', customerPhone: order.customerPhone },
        { ...notification, url: `/track/${order.id}`, tag: `order-${order.id}` },
      );
    });
  }

  return ok({ success: true, khataAmountPaise });
}

/**
 * PUT — the shop has one kilo and the customer asked for two.
 *
 * THE CASE THIS EXISTS FOR. A customer orders 2 kg of basmati; the sack has 1 kg
 * in it. Cancelling is wrong — the shop wants to send the kilo and the customer
 * wants it — and until now the only way to say so was a phone call, with the app
 * still insisting on a total nobody was going to pay and a khata that would post
 * the wrong debt if the order were completed unpaid.
 *
 * So the owner cuts the line to what they have. The snapshot is rewritten, the
 * total and the delivery charge are recomputed from the shop's current terms,
 * the difference goes back on the shelf, and the customer is told what changed
 * and what they now owe — by push if they allowed it, and by a WhatsApp message
 * the owner sends either way. Both sides then agree on one number, which is the
 * whole job.
 *
 * QUANTITIES MAY ONLY GO DOWN. Adding to somebody's order on their behalf is
 * the shop deciding what a customer buys, and no amount of good intention makes
 * that acceptable.
 */
export async function PUT(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  const { slug } = await params;
  if (!(await requireShopWrite(slug))) return fail('Not authenticated', 401);

  const shop = await prisma.shop.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      locale: true,
      deliveryFeePaise: true,
      freeDeliveryAbovePaise: true,
      minOrderPaise: true,
    },
  });
  if (!shop) return fail('Shop not found', 404);

  const parsed = orderReviseSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  const order = await prisma.order.findFirst({
    where: { id: parsed.data.id, shopId: shop.id },
    select: {
      id: true,
      status: true,
      orderType: true,
      itemsJson: true,
      totalAmountPaise: true,
      customerPhone: true,
    },
  });
  if (!order) return fail('Order not found', 404);

  // A finished order is a record, not a worklist. Editing what a customer
  // already took home would rewrite history — and the khata entry that may
  // already have been posted against it.
  if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
    return fail('This order is finished and can no longer be changed.', 409);
  }

  const before = readSnapshot(order.itemsJson);
  if (before.length === 0) return fail('This order has nothing to change.', 409);

  const wanted = new Map(parsed.data.lines.map((line) => [line.itemId, line.quantity]));

  const after_: SnapshotLine[] = [];
  const removed: SnapshotLine[] = [];
  /** What goes back on the shelf, by item id. */
  const returning = new Map<string, number>();

  for (const line of before) {
    // A line the request did not mention is left exactly as it was. The screen
    // sends every line, but a partial payload must not silently drop goods.
    const next = wanted.has(line.itemId) ? Math.min(wanted.get(line.itemId)!, line.quantity) : line.quantity;

    if (next < line.quantity) returning.set(line.itemId, line.quantity - next);

    if (next <= 0) {
      removed.push(line);
      continue;
    }
    after_.push({ ...line, quantity: next, amountPaise: line.pricePaise * next });
  }

  if (after_.length === 0) {
    return fail(
      'Nothing would be left. Cancel the order instead, so the customer is told properly.',
      409,
    );
  }

  const unchanged =
    removed.length === 0 && after_.every((line, index) => line.quantity === before[index]?.quantity);
  if (unchanged) return ok({ success: true, changed: false, totalAmountPaise: order.totalAmountPaise });

  const goodsPaise = after_.reduce((sum, line) => sum + line.amountPaise, 0);
  // Re-quoted, not carried over. A shorter order may now fall under the
  // free-delivery threshold, and charging a customer a waiver they no longer
  // qualify for is as wrong as charging them for rice they did not get.
  const quote = quoteDelivery(shop, goodsPaise, order.orderType);

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        itemsJson: after_,
        totalAmountPaise: quote.totalPaise,
        deliveryFeePaise: quote.deliveryFeePaise,
        revisedAt: new Date(),
      },
    });

    // What the customer is not getting goes back on the shelf, so the next
    // person can be sold it.
    for (const [itemId, quantity] of returning) {
      await tx.item.updateMany({
        where: { id: itemId, shopId: shop.id, stockQty: { not: null } },
        data: { stockQty: { increment: quantity }, inStock: true },
      });
    }

    // A khata entry posted against the old total is now wrong. It can only
    // exist on a COMPLETED order, which is refused above — this is belt and
    // braces against a future path that completes and revises in one go.
    await tx.ledgerEntry.deleteMany({ where: { orderId: order.id } });
  });

  after(async () => {
    const notification = orderRevisedNotification({
      locale: shop.locale as Locale,
      shopName: shop.name,
      totalAmountPaise: quote.totalPaise,
    });
    await sendPush(
      { shopId: shop.id, role: 'CUSTOMER', customerPhone: order.customerPhone },
      { ...notification, url: `/track/${order.id}`, tag: `order-${order.id}` },
    );
  });

  return ok({
    success: true,
    changed: true,
    totalAmountPaise: quote.totalPaise,
    deliveryFeePaise: quote.deliveryFeePaise,
    lines: after_,
    removed,
  });
}

/**
 * The order's snapshot, narrowed out of JSON.
 *
 * Defensive about the money for the same reason `snapshotPaise` on the orders
 * page is: rows written since money moved to paise carry `amountPaise`, older
 * ones carry `amount` in RUPEES, and there is no compiler between this and the
 * column. A revision that misread an old row would rewrite a ₹130 order as
 * ₹1.30 and post that to somebody's khata.
 */
function readSnapshot(itemsJson: unknown): SnapshotLine[] {
  if (!Array.isArray(itemsJson)) return [];
  const num = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  return itemsJson.flatMap((raw) => {
    if (!raw || typeof raw !== 'object') return [];
    const row = raw as Record<string, unknown>;
    const quantity = Math.max(0, Math.round(num(row.quantity)));
    const amountPaise =
      row.amountPaise !== undefined
        ? num(row.amountPaise)
        : Math.round(num(row.lineTotal ?? row.amount) * 100);
    const pricePaise =
      row.pricePaise !== undefined
        ? num(row.pricePaise)
        : quantity > 0
          ? Math.round(amountPaise / quantity)
          : 0;

    return [
      {
        itemId: String(row.itemId ?? ''),
        name: String(row.name ?? ''),
        nameBn: String(row.nameBn ?? ''),
        nameHi: String(row.nameHi ?? ''),
        unit: String(row.unit ?? ''),
        pricePaise,
        quantity,
        amountPaise,
      },
    ];
  });
}

/** Puts a cancelled order's goods back, for the items somebody is counting. */
async function restoreStock(shopId: string, lines: SnapshotLine[]): Promise<void> {
  for (const line of lines) {
    if (!line.itemId || line.quantity <= 0) continue;
    await prisma.item.updateMany({
      // `stockQty: { not: null }` is the whole guard: an item nobody counts must
      // stay uncounted rather than acquiring a total out of a cancellation.
      where: { id: line.itemId, shopId, stockQty: { not: null } },
      data: { stockQty: { increment: line.quantity }, inStock: true },
    });
  }
}

/** "Rice x2, Dal x1" — enough to recognise the entry in the credit book. */
function summarise(itemsJson: unknown): string {
  if (!Array.isArray(itemsJson)) return '';
  return itemsJson
    .map((raw) => {
      if (!raw || typeof raw !== 'object') return '';
      const row = raw as Record<string, unknown>;
      const name = typeof row.name === 'string' ? row.name : '';
      return name ? `${name} x${Number(row.quantity) || 1}` : '';
    })
    .filter(Boolean)
    .join(', ')
    .slice(0, 120);
}
