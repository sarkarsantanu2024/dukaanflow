import { plainPaise } from './money';
import { amountLabel } from './units';

/**
 * How much of one item, as a shopkeeper reads it on their phone.
 *
 * "×0.05" is what a fractional quantity looks like written as a multiplier, and
 * it is the one thing nobody in this chain can act on: the shop has to weigh
 * out an amount, so the message has to name one. Weighed goods say "50 g", and
 * counted goods keep the "×3" they always had.
 */
function saidAs(line: { unit: string; quantity: number }): string {
  return amountLabel(line.unit, line.quantity) ?? `×${line.quantity}`;
}

export type OrderLine = {
  name: string;
  unit: string;
  /** PAISE, per unit. */
  pricePaise: number;
  quantity: number;
  /** PAISE, price × quantity. */
  amountPaise: number;
};

export type OrderMessageInput = {
  shopName: string;
  orderType: 'DELIVERY' | 'PICKUP';
  lines: OrderLine[];
  totalAmountPaise: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
};

/**
 * WhatsApp renders `*bold*`, `_italic_`, `~strike~` and ``` `mono` ``` in message
 * text. Shop and item names come from admin input, so neutralise those markers
 * rather than letting a stray asterisk reflow the whole order.
 */
export function escapeWhatsAppText(value: string): string {
  return value.replace(/[*_~`]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Builds the exact customer-facing order message. Server-side only. */
export function buildOrderMessage(input: OrderMessageInput): string {
  const lines = input.lines.map((line) => {
    const label = escapeWhatsAppText([line.name, line.unit].filter(Boolean).join(' '));
    return `• ${label} ${saidAs(line)} = ${plainPaise(line.amountPaise)}`;
  });

  const parts = [
    '🛒 New Order',
    '',
    `Shop: ${escapeWhatsAppText(input.shopName)}`,
    '',
    'Items',
    ...lines,
    '',
    `Total: ${plainPaise(input.totalAmountPaise)}`,
    '',
    'Customer',
    `Name: ${escapeWhatsAppText(input.customerName) || '-'}`,
    `Phone: ${input.customerPhone}`,
    `Address: ${escapeWhatsAppText(input.customerAddress) || '-'}`,
    `Order Type: ${input.orderType === 'DELIVERY' ? 'Delivery' : 'Pickup'}`,
    '',
    'Thank you.',
  ];

  return parts.join('\n');
}

/**
 * The order, sent by the customer, when the order route could not be reached.
 *
 * A DELIBERATE EXCEPTION to "prices are resolved on the server". This is not an
 * order — no row is written and nothing is charged — it is a shopper on one bar
 * of signal telling a shop what they want, in the way that has always worked in
 * this market. The prices are the ones the page was showing them, which is what
 * they would have read out over the phone anyway.
 *
 * It exists because the alternative is worse. Without it, a basket built over
 * five minutes in a shop with a thick wall dies on the Place order button and
 * the customer walks in instead — which is the whole product failing at the one
 * moment it is being used.
 */
export function buildOfflineOrderMessage(input: OrderMessageInput): string {
  // Same shape as the order message the owner already knows how to read, with
  // one line at the top saying why it arrived by hand.
  return `${buildOrderMessage(input)}\n\n(Sent from ${escapeWhatsAppText(input.shopName)}'s page — no internet at the time.)`;
}

/**
 * What the customer is told when the shop cut their order down.
 *
 * The whole message is the difference. A customer who ordered 2 kg and is sent
 * a new total has one question — what changed — and answering it in the message
 * is the phone call this exists to save. So each changed line says what it was
 * and what it now is, and anything the shop could not supply at all is named
 * rather than quietly disappearing from the list.
 */
export function buildRevisedMessage(input: {
  shopName: string;
  customerName: string;
  totalAmountPaise: number;
  /** Lines as they now stand, with `wasQuantity` where it moved. */
  lines: { name: string; unit: string; quantity: number; wasQuantity: number; amountPaise: number }[];
  /** Lines the shop could not supply at all. */
  removed: { name: string; unit: string; quantity: number }[];
}): string {
  const hello = input.customerName ? `Namaste ${input.customerName},` : 'Namaste,';
  const shop = escapeWhatsAppText(input.shopName);
  const label = (line: { name: string; unit: string }) =>
    escapeWhatsAppText([line.name, line.unit].filter(Boolean).join(' '));

  const kept = input.lines.map((line) =>
    line.wasQuantity !== line.quantity
      ? `• ${label(line)} ${saidAs(line)} (was ${saidAs({ unit: line.unit, quantity: line.wasQuantity })}) = ${plainPaise(line.amountPaise)}`
      : `• ${label(line)} ${saidAs(line)} = ${plainPaise(line.amountPaise)}`,
  );

  const gone = input.removed.map((line) => `• ${label(line)} ${saidAs(line)} — not available`);

  return [
    `${hello} we did not have everything you asked for. ${shop}`,
    '',
    'This is what we can send:',
    ...kept,
    ...(gone.length > 0 ? ['', ...gone] : []),
    '',
    `New total: ${plainPaise(input.totalAmountPaise)}`,
  ].join('\n');
}

/** wa.me needs the country code and digits only. Shop phones are stored as 10 digits. */
export function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  return digits;
}

export function buildWhatsAppUrl(shopPhone: string, message: string): string {
  return `https://wa.me/${toWhatsAppNumber(shopPhone)}?text=${encodeURIComponent(message)}`;
}

/**
 * The round, as one message an owner forwards to whoever is doing the running.
 *
 * A delivery boy is not given a login and never will be — he has a phone with
 * WhatsApp on it and that is the whole of it. Until now the owner read the
 * orders off their own screen and dictated them, or forwarded four separate
 * customer messages, and the address is the part that gets lost when you do
 * that at six in the evening.
 *
 * So: every order still to go out, numbered, each with the name, the phone, the
 * address and what to hand over. Addresses and phones are the point — the items
 * are there so nothing is left in the shop, and the total so money can be
 * collected at the door.
 */
export function buildRoundMessage(input: {
  shopName: string;
  orders: {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    orderType: 'DELIVERY' | 'PICKUP';
    totalAmountPaise: number;
    lines: { name: string; unit: string; quantity: number }[];
  }[];
}): string {
  const parts: string[] = [`${escapeWhatsAppText(input.shopName)} — orders to deliver`, ''];

  input.orders.forEach((order, index) => {
    const items = order.lines
      .map((line) => {
        const label = escapeWhatsAppText([line.name, line.unit].filter(Boolean).join(' '));
        return `   • ${label} ${saidAs(line)}`;
      })
      .join('\n');

    parts.push(
      `${index + 1}. ${escapeWhatsAppText(order.customerName) || 'Customer'} — ${order.customerPhone}`,
      // Pickup orders are in the list but marked, so nobody carries a bag to an
      // address the customer is coming to collect from.
      order.orderType === 'PICKUP'
        ? '   PICKUP — customer will collect'
        : `   ${escapeWhatsAppText(order.customerAddress) || 'No address given — call first'}`,
      items,
      `   ${plainPaise(order.totalAmountPaise)}`,
      '',
    );
  });

  return parts.join('\n').trimEnd();
}

/**
 * What the owner sends the customer once an order is worked.
 *
 * The button used to be a bare `wa.me/<number>` — it opened an empty chat and
 * left the shopkeeper to type the whole thing themselves, in a hurry, in a
 * language the keyboard may not be set to. Most never did, so the customer was
 * never told their order was ready, which is the one message this whole product
 * exists to get sent.
 */
export function buildStatusMessage(input: {
  shopName: string;
  customerName: string;
  status: 'CONFIRMED' | 'READY' | 'COMPLETED' | 'CANCELLED' | 'NEW';
  totalAmountPaise: number;
  orderType: 'DELIVERY' | 'PICKUP';
  /** What was ordered. A total with nothing behind it cannot be checked. */
  lines: { name: string; unit: string; quantity: number; amountPaise: number }[];
}): string {
  const hello = input.customerName ? `Namaste ${input.customerName},` : 'Namaste,';
  const shop = escapeWhatsAppText(input.shopName);

  /**
   * READY is where "your order is ready" belongs, and COMPLETED is a receipt.
   *
   * They were one message on one state, which meant the only way to tell a
   * customer their order was waiting was to first declare it handed over and
   * answer for money nobody had been given yet.
   */
  const body =
    input.status === 'READY'
      ? input.orderType === 'PICKUP'
        ? `your order is ready. Please collect it from ${shop}.`
        : `your order is ready and on its way from ${shop}.`
      : input.status === 'COMPLETED'
        ? `thank you — your order is settled. ${shop}`
        : input.status === 'CONFIRMED'
          ? `we have your order and are getting it ready. ${shop}`
          : input.status === 'CANCELLED'
            ? `sorry — we could not take your order this time. ${shop}`
            : `we have received your order. ${shop}`;

  // A cancellation is not a bill, so it carries neither items nor a total.
  if (input.status === 'CANCELLED' || input.totalAmountPaise <= 0) {
    return `${hello} ${body}`;
  }

  // The items, not just the sum. A customer who is told "Total: ₹130" has
  // nothing to check it against, and the one question they will ask on the
  // phone is what the ₹130 was for — which is the call this message exists to
  // save. Same bullet shape the order message used, so it reads familiarly.
  const items = input.lines
    .map((line) => {
      const label = escapeWhatsAppText([line.name, line.unit].filter(Boolean).join(' '));
      return `• ${label} ${saidAs(line)} = ${plainPaise(line.amountPaise)}`;
    })
    .join('\n');

  const itemBlock = items ? `\n\n${items}` : '';
  return `${hello} ${body}${itemBlock}\n\nTotal: ${plainPaise(input.totalAmountPaise)}`;
}
