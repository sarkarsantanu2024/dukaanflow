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
import { amountLabel, localUnit, type UnitLocale } from '@/lib/units';

export type BillLine = {
  name: string;
  unit: string;
  quantity: number;
  amountPaise: number;
  /**
   * A line printed under the name, such as "out of stock, back on 26/09".
   * A line with a note and nothing sold (quantity 0) is the customer being
   * told in writing about something they asked for and did not get.
   */
  note?: string;
};

export type Bill = {
  shopName: string;
  lines: BillLine[];
  totalPaise: number;
  /**
   * How it was paid — omitted when nobody knows.
   *
   * A till sale always knows: the owner just pressed Cash, UPI or Udhaar. An
   * order does not carry it to the browser, and a bill that printed "Paid by:
   * Cash" over a delivery the customer has not paid for yet would be a receipt
   * for money that never changed hands. Absent, the line is simply not drawn.
   */
  paymentMode?: 'CASH' | 'UPI' | 'KHATA';
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
  /** Which language "packet" and "kg" are printed in. */
  unitLocale?: UnitLocale;
};

/** Canvas geometry. A receipt is narrow; everything below is in these pixels. */
const WIDTH = 720;
const PAD = 48;
/** An item's name line. */
const ROW = 52;
/**
 * The line under a name saying how much of it — "250 g", "2 × ₹10 · 1 packet".
 * Drawn close under its own name and followed by a gap, so it reads as part of
 * the item above and never as the heading of the one below.
 */
const DETAIL_ROW = 34;
/** The extra height a line with a note takes. */
const NOTE_ROW = 30;
/** Space between one item and the next. */
const GAP = 14;

/**
 * How much of this line was bought, as a shopper would read it.
 *
 * Weighed and poured goods say the amount ("250 g", "1.5 kg"). Counted goods
 * say the count and the price of one ("2 × ₹10 · 1 packet") — without it a
 * bill read "Parle-G ₹20" and nobody could tell two packets from one, and the
 * weight printed under the item above looked as if it belonged to this one.
 */
export function lineDetail(line: BillLine, locale?: UnitLocale): string | null {
  if (line.quantity <= 0) return null;
  const measure = amountLabel(line.unit, line.quantity);
  if (measure) return localUnit(measure, locale);
  const each = formatPaise(Math.round(line.amountPaise / line.quantity));
  return [`${line.quantity} × ${each}`, localUnit(line.unit.trim(), locale)].filter(Boolean).join(' · ');
}

/** The bill written and saved to the phone, for the till and the fallback. */
export async function downloadBillPdf(
  bill: Bill,
  labels: BillLabels,
  fileName: string,
): Promise<void> {
  const blob = await billPdfBlob(bill, labels);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * The bill as a PDF file in memory, so it can be handed to the share sheet
 * and go into WhatsApp with the message rather than only into Downloads.
 */
export async function billPdfBlob(bill: Bill, labels: BillLabels): Promise<Blob> {
  // Height is worked out from the line count rather than fixed, so a two-item
  // bill is not three-quarters white space and a twenty-item one does not run
  // off the bottom.
  const rowHeight = (line: BillLine) =>
    ROW + (lineDetail(line, labels.unitLocale) ? DETAIL_ROW : 0) + (line.note ? NOTE_ROW : 0) + GAP;
  const height = PAD * 2 + 210 + bill.lines.reduce((sum, line) => sum + rowHeight(line), 0) + 190;

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

    // Nothing sold on a note-only line, so no "₹0" beside it.
    if (line.quantity > 0) {
      const amount = formatPaise(line.amountPaise);
      ctx.textAlign = 'right';
      ctx.fillText(amount, right, y);
      ctx.textAlign = 'left';
    }

    const detail = lineDetail(line, labels.unitLocale);
    let under = y + 38;
    if (detail) {
      ctx.fillStyle = '#64748b';
      ctx.font = '22px system-ui, sans-serif';
      ctx.fillText(detail, PAD, under);
      under += DETAIL_ROW;
    }
    if (line.note) {
      // Amber, the colour the app uses for "not today".
      ctx.fillStyle = '#b45309';
      ctx.font = '22px system-ui, sans-serif';
      ctx.fillText(line.note, PAD, under);
    }
    y += rowHeight(line);
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

  if (bill.paymentMode) {
    ctx.fillStyle = '#64748b';
    ctx.font = '24px system-ui, sans-serif';
    ctx.fillText(`${labels.paidBy}: ${labels.paymentMode[bill.paymentMode]}`, PAD, y);
    y += 52;
  }

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText(labels.credit, PAD, y);

  const { jsPDF } = await import('jspdf');
  // THE ORIENTATION IS STATED, NOT LEFT TO jsPDF. Its default is portrait, and
  // given a page wider than tall it swaps the two sides to make one — so a
  // short bill (one or two lines is 720 × ~550) came out 550 wide with the
  // image cut off down the right, and every price was in the part cut off.
  const doc = new jsPDF({
    unit: 'px',
    format: [WIDTH, height],
    orientation: WIDTH > height ? 'landscape' : 'portrait',
  });
  doc.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, WIDTH, height);
  return doc.output('blob');
}

function rule(ctx: CanvasRenderingContext2D, y: number, right: number) {
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD, y);
  ctx.lineTo(right, y);
  ctx.stroke();
}
