import { after } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { orderSchema } from '@/lib/validators';
import type { OrderLine } from '@/lib/whatsapp';
import { upsertCustomer } from '@/lib/khata';
import { quoteDelivery } from '@/lib/delivery';
import { basketShortfallPaise, minBasketPaise } from '@/lib/basket';
import { entitlement, type Plan, type SubStatus } from '@/lib/plans';
import { formatPaise, linePaise } from '@/lib/money';
import { isLooseUnit, MOST_PER_LINE, roundQuantity } from '@/lib/units';
import { sendPush } from '@/lib/push';
import { newOrderNotification } from '@/lib/push-text';
import type { Locale } from '@/lib/i18n';

export const runtime = 'nodejs';

/**
 * Returned from the create transaction when it rolled back on the idempotency
 * unique constraint — a concurrent request with the same key committed first.
 * A sentinel rather than an error because the caller's response is a success
 * (the order exists), not a failure.
 */
const DUPLICATE_KEY = Symbol('duplicate-key');

/**
 * POST /api/order
 *
 * The client sends item ids and quantities only. Prices, stock, the delivery
 * charge and the total are all resolved here from the database — a tampered
 * payload cannot change what the shop is asked to charge, and the basket's
 * arithmetic is a courtesy to the shopper rather than an input.
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

  const {
    shopSlug,
    customerName,
    customerPhone,
    customerAddress,
    customerArea,
    orderType,
    items,
    idempotencyKey,
    locale,
  } = parsed.data;

  /**
   * Already placed? Hand back the order that exists rather than making a second.
   *
   * The storefront retries a failed POST (see `postOrder`), so the commonest way
   * to arrive here twice is a first request that succeeded on the server and
   * whose response never reached the phone. This is checked BEFORE the shop is
   * even looked up, and regardless of whether the shop has since closed: the
   * order is a fact that already happened, and a retry must return it, not be
   * told the shutter is now down.
   *
   * `select` mirrors exactly what a fresh create returns below, so a replay is
   * indistinguishable from the original success.
   */
  if (idempotencyKey) {
    const existing = await prisma.order.findUnique({
      where: { idempotencyKey },
      select: { id: true, totalAmountPaise: true, deliveryFeePaise: true },
    });
    if (existing) {
      return ok({
        orderId: existing.id,
        totalAmountPaise: existing.totalAmountPaise,
        deliveryFeePaise: existing.deliveryFeePaise,
      });
    }
  }

  const shop = await prisma.shop.findUnique({
    where: { slug: shopSlug },
    select: {
      id: true,
      name: true,
      phone: true,
      active: true,
      ownerClosed: true,
      deliveryEnabled: true,
      deliveryFeePaise: true,
      freeDeliveryAbovePaise: true,
      minOrderPaise: true,
      locale: true,
      plan: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      currentPeriodEnd: true,
    },
  });
  if (!shop) return fail('Shop not found', 404);
  // Every shutter the shop page closes on. `active` is the operator's,
  // `ownerClosed` the shopkeeper's, and `autoPaused` the lapsed subscription's —
  // the page read all three but this route only the first two, so a stale tab
  // or a hand-made request could still place an order at a shop whose own page
  // said it was not taking any. Same `entitlement` the page uses, so the two
  // cannot disagree.
  const billing = entitlement({
    plan: shop.plan as Plan,
    subscriptionStatus: shop.subscriptionStatus as SubStatus,
    trialEndsAt: shop.trialEndsAt,
    currentPeriodEnd: shop.currentPeriodEnd,
  });
  if (!shop.active || shop.ownerClosed || billing.autoPaused) {
    return fail('This shop is not accepting orders right now', 409);
  }

  // The storefront hides the option, but hiding is not enforcing: a delivery
  // this shop never offered would be a promise its owner has to break by phone.
  if (orderType === 'DELIVERY' && !shop.deliveryEnabled) {
    return fail('This shop is collection only. Please choose Pickup.', 409);
  }

  // Collapse duplicate ids so a repeated line cannot inflate the quantity cap.
  const requested = new Map<string, number>();
  for (const entry of items) {
    requested.set(
      entry.itemId,
      Math.min(MOST_PER_LINE, roundQuantity((requested.get(entry.itemId) ?? 0) + entry.quantity)),
    );
  }

  const dbItems = await prisma.item.findMany({
    where: { id: { in: [...requested.keys()] }, shopId: shop.id },
    select: {
      id: true,
      name: true,
      nameBn: true,
      nameHi: true,
      unit: true,
      pricePaise: true,
      priced: true,
      inStock: true,
      stockQty: true,
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

  const label = (item: { name: string; unit: string }) =>
    [item.name, item.unit].filter(Boolean).join(' ');

  /**
   * COUNTING NO LONGER STOPS AN ITEM BEING SPLIT, and that restriction is gone
   * rather than relaxed. It existed for one reason: `stockQty` was a whole
   * number of packs, so there was nowhere to keep the 700 g left over from
   * selling 300 g off a count of one — and an owner who started counting their
   * rice thereby lost the ability to sell it by weight, which is the only way
   * rice is sold. The column holds decimals now, so the cause is gone.
   *
   * What remains is the real rule, and only it: a plate of chowmein, a biscuit
   * packet, a bottle of oil cannot be cut. 0.4 of one is not something anybody
   * can hand over, so a payload naming one is refused rather than rounded into
   * a number the shop would have to guess at. The storefront never offers it
   * either — see `AmountStepper` — but hiding is not enforcing.
   */
  const indivisible = dbItems.filter(
    (item) => !Number.isInteger(requested.get(item.id)!) && !isLooseUnit(item.unit),
  );
  if (indivisible.length > 0) {
    return fail(
      `${indivisible.map(label).join(', ')} — sold whole. Please choose a whole number.`,
      409,
    );
  }

  const outOfStock = dbItems.filter((item) => !item.inStock);
  if (outOfStock.length > 0) {
    return fail(
      `Out of stock: ${outOfStock.map(label).join(', ')}. Please remove and try again.`,
      409,
    );
  }

  /**
   * More asked for than the shop has left.
   *
   * Only for the items somebody is actually counting — `stockQty` is null for
   * everything sold loose off a scale, and those are governed by `inStock`
   * alone exactly as before.
   *
   * The message names the number, because "out of stock" would be a lie about
   * an item the shop has one of. A customer told "Basmati rice 1 kg — only 1
   * left" fixes their own basket in one tap; one told it is unavailable removes
   * it and the shop loses the sale it could have made.
   */
  const short = dbItems.filter(
    (item) => item.stockQty !== null && item.stockQty < requested.get(item.id)!,
  );
  if (short.length > 0) {
    const named = short.map((item) => `${label(item)} — only ${item.stockQty} left`);
    return fail(`${named.join('; ')}. Please change the amount and try again.`, 409);
  }

  const lines: OrderLine[] = dbItems.map((item) => {
    const quantity = requested.get(item.id)!;
    return {
      name: item.name,
      unit: item.unit,
      pricePaise: item.pricePaise,
      quantity,
      // Rounded to the paise HERE and nowhere else. `pricePaise × 0.05` is
      // 6500.000000000001 in floating point, and a total built out of those is
      // a total that fails to equal itself.
      amountPaise: linePaise(item.pricePaise, quantity),
    };
  });

  const goodsPaise = lines.reduce((sum, line) => sum + line.amountPaise, 0);
  const quote = quoteDelivery(shop, goodsPaise, orderType);

  // The basket already said so, in the shopper's own language and before they
  // filled the form in. This is the rule rather than the courtesy: a stale tab
  // whose shop has since set a minimum must not slip an order under it.
  if (quote.shortfallPaise > 0) {
    return fail(
      `This shop delivers orders of ${formatPaise(shop.minOrderPaise)} and above. Add ${formatPaise(quote.shortfallPaise)} more, or choose Pickup.`,
      409,
    );
  }

  /**
   * Below the smallest order this shop takes at all.
   *
   * A DIFFERENT RULE FROM THE ONE ABOVE, and both can be live at once. That one
   * is about a journey the shop makes and is escaped by choosing Pickup; this
   * one is about the work of picking and packing, which happens either way — a
   * ₹10 packet of chips has to be confirmed, bagged, marked ready and messaged
   * about exactly like an ₹800 order.
   *
   * The floor is derived from how much the shop actually has on sale rather
   * than set by anyone, so it is counted here rather than trusted from the
   * client, and a shop below the first size boundary has no floor at all. See
   * `lib/basket.ts`.
   *
   * Checked against `goodsPaise` — the delivery charge is not part of what the
   * shop thinks the order was worth.
   */
  const onSale = await prisma.item.count({
    where: { shopId: shop.id, priced: true, inStock: true },
  });
  const floorPaise = minBasketPaise(onSale);
  const basketShort = basketShortfallPaise(floorPaise, goodsPaise);

  if (basketShort > 0) {
    return fail(
      `This shop takes orders from ${formatPaise(floorPaise)}. Add ${formatPaise(basketShort)} more and try again.`,
      409,
    );
  }

  /**
   * The row and the stock, together or not at all.
   *
   * Two customers can reach the last packet of biscuits in the same second.
   * Without a transaction both orders are written and the count goes to −1;
   * with one, the `decrement` runs inside it and the guard below refuses any
   * update that would take a count under zero, so the second order fails and
   * its customer is told rather than being promised something the shop cannot
   * hand over.
   *
   * `updateMany` with the quantity in the WHERE clause is what makes that
   * check atomic — a read-then-write would have the same race it is meant to
   * close.
   */
  const created = await prisma.$transaction(async (tx) => {
    for (const item of dbItems) {
      if (item.stockQty === null) continue;
      // Fractions are fine here now — `stockQty` is a decimal in multiples of
      // the item's own unit, so 300 g off a kilo leaves 0.7 on the shelf.
      const quantity = requested.get(item.id)!;
      const updated = await tx.item.updateMany({
        where: { id: item.id, stockQty: { gte: quantity } },
        data: {
          stockQty: { decrement: quantity },
          // Reaching zero takes it off the shop page. `inStock` stays the one
          // switch the whole product reads — nothing downstream has to learn
          // about a second kind of "available".
          ...(item.stockQty - quantity <= 0 ? { inStock: false } : {}),
        },
      });
      if (updated.count === 0) {
        throw new StockRaceError(label(item));
      }
    }

    return tx.order.create({
      data: {
        shopId: shop.id,
        customerName,
        customerPhone,
        customerAddress,
        customerArea,
        orderType,
        // Snapshot: prices here are what was quoted, regardless of later edits.
        //
        // The keys say `Paise` because nothing else can. This JSON is read back
        // by reports and rollups with no compiler between them and it, and the
        // older rows in this same column hold rupees under bare names — so the
        // suffix is what tells a reader which hundred it is looking at.
        //
        // Accepted on arrival.
        //
        // There used to be an Accept button, and it asked a question the owner
        // had already answered by having the shop open: of course they will take
        // an order from their own shop page. It bought one signal — "nobody has
        // looked at this yet" — at the cost of a tap on every single order, and
        // that signal is carried better by the waiting count and the bell.
        status: 'CONFIRMED',
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
          pricePaise: item.pricePaise,
          quantity: requested.get(item.id)!,
          amountPaise: linePaise(item.pricePaise, requested.get(item.id)!),
        })),
        // The grand total, goods plus the journey. Every report and the khata
        // read this column as "what this order came to", and a delivery charge
        // is money the shop took.
        totalAmountPaise: quote.totalPaise,
        deliveryFeePaise: quote.deliveryFeePaise,
        // Stamped inside the transaction alongside the stock decrement, so a
        // second request racing on the same key trips the unique constraint and
        // its whole transaction rolls back — the stock it decremented included.
        idempotencyKey,
        locale: locale ?? '',
      },
      select: { id: true },
    });
  }).catch((error: unknown) => {
    if (error instanceof StockRaceError) return error;
    // Two requests with one key reached the create together; this one lost. The
    // winner's order exists, so this is a replay, not a failure — see below.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      idempotencyKey
    ) {
      return DUPLICATE_KEY;
    }
    throw error;
  });

  if (created instanceof StockRaceError) {
    return fail(`${created.itemLabel} has just sold out. Please refresh the page.`, 409);
  }

  if (created === DUPLICATE_KEY) {
    // The concurrent winner has committed by now. Read its order back and return
    // it, exactly as the pre-create replay above would have.
    const twin = idempotencyKey
      ? await prisma.order.findUnique({
          where: { idempotencyKey },
          select: { id: true, totalAmountPaise: true, deliveryFeePaise: true },
        })
      : null;
    if (twin) {
      return ok({
        orderId: twin.id,
        totalAmountPaise: twin.totalAmountPaise,
        deliveryFeePaise: twin.deliveryFeePaise,
      });
    }
    // The conflict was on the key but the row cannot be read — vanishingly
    // unlikely, and safer to ask for a retry than to guess.
    return fail('Please try placing the order again.', 409);
  }

  // Every order makes the customer known to the shop.
  //
  // Until now a Customer row only appeared when somebody took goods on credit,
  // so a shop with fifty regulars ordering weekly had an empty customer list
  // and a khata that could not name any of them. The upsert never clears a
  // field it was not given, so a blank name on a later order leaves the one
  // already recorded alone.
  await upsertCustomer(shop.id, customerPhone, customerName, customerArea, customerAddress);

  /**
   * And the shop is told, on whatever phone said yes.
   *
   * `after` rather than an await: the customer's Place order button must not
   * wait on Google's push service, and a push that fails must never fail an
   * order that is already saved. `sendPush` swallows its own errors for the
   * same reason.
   *
   * This is an accelerator and nothing more. The orders screen, the waiting
   * count and the bell all work exactly as they did with this switched off,
   * which is what makes it safe on the Xiaomis and Realmes that will silently
   * drop it.
   */
  after(async () => {
    const notification = newOrderNotification({
      locale: shop.locale as Locale,
      customerName,
      customerArea,
      orderType,
      totalAmountPaise: quote.totalPaise,
    });
    await sendPush(
      { shopId: shop.id, role: 'OWNER' },
      {
        ...notification,
        url: `/owner/${shopSlug}/orders`,
        // Its own id, so two orders a second apart are two notifications
        // rather than one replacing the other.
        tag: `order-${created.id}`,
      },
    );
  });

  // No WhatsApp handoff any more.
  //
  // The order used to be pushed into the owner's WhatsApp as a message the
  // customer sent. It worked, and at volume it buried the owner's personal
  // chats under order after order — the one inbox they also use for their
  // family. The orders now live in the owner's own app, where the header bell
  // counts them from every screen and can chime, and where each one can
  // actually be worked rather than only read.
  return ok({
    orderId: created.id,
    totalAmountPaise: quote.totalPaise,
    deliveryFeePaise: quote.deliveryFeePaise,
  });
}

/**
 * Raised inside the transaction when somebody else took the last one first.
 *
 * A class rather than a string so it can be told apart from a real database
 * failure at the catch: rolling the transaction back is right for both, but
 * only this one is a 409 the customer can act on.
 */
class StockRaceError extends Error {
  constructor(public readonly itemLabel: string) {
    super('stock race');
  }
}
