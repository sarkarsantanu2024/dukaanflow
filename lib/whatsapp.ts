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
