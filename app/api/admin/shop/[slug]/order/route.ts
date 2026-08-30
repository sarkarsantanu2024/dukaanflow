import { prisma } from '@/lib/prisma';
import { requireShopWrite } from '@/lib/guard';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { orderStatusSchema } from '@/lib/validators';
import { upsertCustomer } from '@/lib/khata';

export const runtime = 'nodejs';

type Context = { params: Promise<{ slug: string }> };

/**
 * PATCH — move an order through its states.
 *
 * Orders already arrive on WhatsApp; this is what turns that message into a
 * queue the owner can actually work: placed, being prepared, done — or
 * cancelled.
 *
 * COMPLETING WITHOUT PAYMENT POSTS TO THE KHATA. Goods that left the shop
 * unpaid are a debt whether or not anybody wrote it down, and not writing it
 * down is the exact thing DukaanFlow exists to end. So an order marked done
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

  const shop = await prisma.shop.findUnique({ where: { slug }, select: { id: true } });
  if (!shop) return fail('Shop not found', 404);

  const parsed = orderStatusSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  const { id, status, paymentReceived, paymentMode } = parsed.data;

  // Read it back scoped by shopId, so one shop can never touch another's orders.
  const order = await prisma.order.findFirst({
    where: { id, shopId: shop.id },
    select: {
      id: true,
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

  let khataAmount = 0;

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
      khataAmount = order.totalAmountPaise;
    }
  }

  // Paid after all? Take the debt back off the book rather than leaving the
  // customer owing for something they have settled.
  if (status !== 'COMPLETED' || paymentReceived) {
    await prisma.ledgerEntry.deleteMany({ where: { orderId: order.id } });
  }

  return ok({ success: true, khataAmount });
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
