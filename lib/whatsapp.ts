import { plainRupees } from './money';

export type OrderLine = {
  name: string;
  unit: string;
  price: number; // integer rupees, unit price
  quantity: number;
  lineTotal: number; // integer rupees
};

export type OrderMessageInput = {
  shopName: string;
  orderType: 'DELIVERY' | 'PICKUP';
  lines: OrderLine[];
  totalAmount: number;
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
    return `• ${label} ×${line.quantity} = ${plainRupees(line.lineTotal)}`;
  });

  const parts = [
    '🛒 New Order',
    '',
    `Shop: ${escapeWhatsAppText(input.shopName)}`,
    '',
    'Items',
    ...lines,
    '',
    `Total: ${plainRupees(input.totalAmount)}`,
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
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NEW';
  totalAmount: number;
  orderType: 'DELIVERY' | 'PICKUP';
  /** What was ordered. A total with nothing behind it cannot be checked. */
  lines: { name: string; unit: string; quantity: number; amount: number }[];
}): string {
  const hello = input.customerName ? `Namaste ${input.customerName},` : 'Namaste,';
  const shop = escapeWhatsAppText(input.shopName);

  const body =
    input.status === 'COMPLETED'
      ? input.orderType === 'PICKUP'
        ? `your order is ready. Please collect it from ${shop}.`
        : `your order is ready and on its way from ${shop}.`
      : input.status === 'CONFIRMED'
        ? `we have your order and are getting it ready. ${shop}`
        : input.status === 'CANCELLED'
          ? `sorry — we could not take your order this time. ${shop}`
          : `we have received your order. ${shop}`;

  // A cancellation is not a bill, so it carries neither items nor a total.
  if (input.status === 'CANCELLED' || input.totalAmount <= 0) {
    return `${hello} ${body}`;
  }

  // The items, not just the sum. A customer who is told "Total: ₹130" has
  // nothing to check it against, and the one question they will ask on the
  // phone is what the ₹130 was for — which is the call this message exists to
  // save. Same bullet shape the order message used, so it reads familiarly.
  const items = input.lines
    .map((line) => {
      const label = escapeWhatsAppText([line.name, line.unit].filter(Boolean).join(' '));
      return `• ${label} ×${line.quantity} = ${plainRupees(line.amount)}`;
    })
    .join('\n');

  const itemBlock = items ? `\n\n${items}` : '';
  return `${hello} ${body}${itemBlock}\n\nTotal: ${plainRupees(input.totalAmount)}`;
}
