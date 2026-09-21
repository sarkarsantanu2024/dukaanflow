/**
 * The counter bill, as a PDF the owner can hand to WhatsApp.
 *
 * DRAWN ONTO A CANVAS AND EMBEDDED AS A PICTURE, exactly as the QR poster is,
 * and for exactly the same reason — see the note at the top of
 * `components/admin/PosterSheet.tsx` and the longer one on the khata statement.
 * jsPDF's built-in fonts have no Bengali or Devanagari glyphs, so a bill laid
 * out with `doc.text()` would render "চাল" as empty boxes for the majority of
 * this product's customers. Shipping those fonts is megabytes per shop for a
 * file that is looked at once. The browser already has the fonts and already
 * shapes the text; a canvas borrows both for free.
 *
 * The trade is the poster's trade: the text in the PDF is not selectable. For a
 * receipt that is read on a phone and thrown away, that costs nothing.
 *
 * WHY A FILE AT ALL, when the khata statement is a printable page instead. A
 * statement is read by the owner, who has the browser's print dialogue two taps
 * away. A bill is SENT, and WhatsApp cannot attach a page — only a file the
 * owner already has. So this one is a download.
 */

import { formatPaise } from '@/lib/money';
import { amountLabel } from '@/lib/units';

export type BillLine = {
  name: string;
  unit: string;
  quantity: number;
  amountPaise: number;
};

export type Bill = {
  shopName: string;
  lines: BillLine[];
  totalPaise: number;
  paymentMode: 'CASH' | 'UPI' | 'KHATA';
  at: Date;
  customerName?: string;
};

/** The words on the sheet, so the bill speaks the owner's language. */
export type BillLabels = {
  bill: string;
  total: string;
  paidBy: string;
  paymentMode: Record<'CASH' | 'UPI' | 'KHATA', string>;
  credit: string;
};

/** Canvas geometry. A receipt is narrow; everything below is in these pixels. */
const WIDTH = 720;
const PAD = 48;
const ROW = 52;

export async function downloadBillPdf(
  bill: Bill,
  labels: BillLabels,
  fileName: string,
): Promise<void> {
  // Height is worked out from the line count rather than fixed, so a two-item
  // bill is not three-quarters white space and a twenty-item one does not run
  // off the bottom.
  const height = PAD * 2 + 210 + bill.lines.length * ROW + 190;

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no canvas');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, WIDTH, height);
  ctx.textBaseline = 'top';

  const right = WIDTH - PAD;
  let y = PAD;

  // The shop's own name is the biggest thing on the bill — it is what tells the
  // customer, days later, which shop this was.
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 40px system-ui, sans-serif';
  ctx.fillText(bill.shopName, PAD, y);
  y += 54;

  ctx.fillStyle = '#64748b';
  ctx.font = '24px system-ui, sans-serif';
  ctx.fillText(`${labels.bill} · ${bill.at.toLocaleString()}`, PAD, y);
  y += 36;

  if (bill.customerName) {
    ctx.fillText(bill.customerName, PAD, y);
    y += 36;
  }

  y += 12;
  rule(ctx, y, right);
  y += 28;

  // One row per item: what it was and how much of it on the left, what it cost
  // on the right, so the column of money reads straight down.
  for (const line of bill.lines) {
    ctx.fillStyle = '#0f172a';
    ctx.font = '28px system-ui, sans-serif';
    ctx.fillText(line.name, PAD, y);

    const amount = formatPaise(line.amountPaise);
    ctx.textAlign = 'right';
    ctx.fillText(amount, right, y);
    ctx.textAlign = 'left';

    const measure = amountLabel(line.unit, line.quantity);
    if (measure) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '22px system-ui, sans-serif';
      ctx.fillText(measure, PAD, y + 30);
    }
    y += ROW;
  }

  y += 8;
  rule(ctx, y, right);
  y += 30;

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 36px system-ui, sans-serif';
  ctx.fillText(labels.total, PAD, y);
  ctx.textAlign = 'right';
  ctx.fillText(formatPaise(bill.totalPaise), right, y);
  ctx.textAlign = 'left';
  y += 56;

  ctx.fillStyle = '#64748b';
  ctx.font = '24px system-ui, sans-serif';
  ctx.fillText(`${labels.paidBy}: ${labels.paymentMode[bill.paymentMode]}`, PAD, y);
  y += 52;

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText(labels.credit, PAD, y);

  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'px', format: [WIDTH, height] });
  doc.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, WIDTH, height);
  doc.save(fileName);
}

function rule(ctx: CanvasRenderingContext2D, y: number, right: number) {
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD, y);
  ctx.lineTo(right, y);
  ctx.stroke();
}
