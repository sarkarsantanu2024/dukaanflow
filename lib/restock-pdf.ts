/**
 * The reorder list as a real PDF, built in the browser.
 *
 * SAME TRICK AS THE KHATA STATEMENT, AND FOR THE SAME REASON — see the note at
 * the top of `lib/khata-pdf.ts`. Every PDF library in JavaScript ships Latin
 * fonts only, so `doc.text('মুসুর ডাল')` comes out as a row of boxes, and
 * embedding a Bengali and a Devanagari font is megabytes of download on a phone
 * for a sheet that gets made once a week. So the page is DRAWN with the
 * browser's own text rendering and the finished bitmap goes into the PDF: the
 * browser already has the fonts and already knows how to shape conjuncts.
 *
 * WHY A PDF AT ALL, when the WhatsApp message next door says the same thing. A
 * supplier standing at the counter is handed a phone or a printed sheet and
 * ticks down it; a wholesaler who takes orders by email wants a file; and a
 * message scrolls away behind the next forty in the thread while a file stays
 * findable. The two are the same list, and the owner picks by who they are
 * dealing with.
 *
 * TWO COLUMNS AND NO ORNAMENT: what to bring, and how much of it.
 *
 * It had three. The middle one was the shop's own RETAIL pack size — what it
 * breaks a sack down into on its own shelf — and a supplier has no use for
 * that: he loads bostas and cartons, and knowing the shop bags rice in 500 g
 * tells him nothing. Sitting between the name and the amount it also read as a
 * quantity, so "500 g" beside "5 kg" on one line looked like a contradiction
 * somebody had to resolve. The tick box and the "how much is left" note went
 * earlier, for the same reason: this sheet is an order, not a report on the
 * shop's shelves.
 */

const PAGE_W = 1240;
const PAGE_H = 1754;
const MARGIN = 80;
const BOTTOM = PAGE_H - MARGIN;

const FONT =
  '"Noto Sans Bengali", "Noto Sans Devanagari", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

const INK = '#0f172a';
const MUTED = '#64748b';
const RULE = '#cbd5e1';
const HAIRLINE = '#e2e8f0';

/** The words on the sheet, in the shop's own language. */
export type RestockLabels = {
  /** "Order list" — the heading under the shop's name. */
  heading: string;
  /** Column head over the item names. */
  item: string;
  /** Column head over how much to bring. */
  wanted: string;
  /** "Items" — the count at the foot. */
  total: string;
  /** Shown when there is nothing to reorder. */
  empty: string;
};

export type RestockRow = { name: string; wanted: string };

type Sheet = { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D };

function newSheet(): Sheet {
  const canvas = document.createElement('canvas');
  canvas.width = PAGE_W;
  canvas.height = PAGE_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
  ctx.textBaseline = 'alphabetic';
  return { canvas, ctx };
}

function text(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  { size = 24, weight = '400', colour = INK, align = 'left' as CanvasTextAlign } = {},
): void {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fillStyle = colour;
  ctx.textAlign = align;
  ctx.fillText(value, x, y);
  ctx.textAlign = 'left';
}

function rule(ctx: CanvasRenderingContext2D, y: number, colour = RULE, thickness = 2): void {
  ctx.fillStyle = colour;
  ctx.fillRect(MARGIN, y, PAGE_W - MARGIN * 2, thickness);
}

/** Truncates to fit a column rather than letting a long name run into the next. */
function fit(ctx: CanvasRenderingContext2D, value: string, width: number, size: number): string {
  ctx.font = `400 ${size}px ${FONT}`;
  if (ctx.measureText(value).width <= width) return value;

  let cut = value;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > width) {
    cut = cut.slice(0, -1);
  }
  return `${cut}…`;
}

/**
 * Draws the list and hands back the finished PDF as a Blob.
 *
 * Paginates properly. A kirana that has let its shelves run down has forty
 * things to reorder, and a renderer that assumes one page silently drops
 * everything past the fold — on a list somebody is going to buy from, that is
 * the shop paying for the bug twice.
 */
export async function restockPdf(input: {
  shopName: string;
  rows: RestockRow[];
  labels: RestockLabels;
  /** Already formatted in the owner's language by the caller. */
  dateLabel: string;
}): Promise<Blob> {
  const { shopName, rows, labels, dateLabel } = input;

  /**
   * The name on the left, the amount hard against the right edge where a
   * quantity column belongs. The amount is set in ink and in bold rather than
   * grey: it is the instruction, and it has to survive a photocopy and a
   * godown's lighting.
   */
  const NAME_X = MARGIN;
  const WANTED_X = PAGE_W - MARGIN;
  const ROW_H = 52;

  /** The masthead, repeated on every sheet. Returns where the body may start. */
  const heading = (sheet: Sheet): number => {
    const { ctx } = sheet;
    text(ctx, shopName, MARGIN, MARGIN + 34, { size: 40, weight: '700' });
    text(ctx, labels.heading, MARGIN, MARGIN + 76, { size: 26, colour: MUTED });
    text(ctx, dateLabel, PAGE_W - MARGIN, MARGIN + 76, { size: 24, colour: MUTED, align: 'right' });

    rule(ctx, MARGIN + 100);

    text(ctx, labels.item, NAME_X, MARGIN + 142, { size: 22, weight: '700', colour: MUTED });
    text(ctx, labels.wanted, WANTED_X, MARGIN + 142, {
      size: 22,
      weight: '700',
      colour: MUTED,
      align: 'right',
    });
    rule(ctx, MARGIN + 158, HAIRLINE);

    return MARGIN + 158 + ROW_H;
  };

  const sheets: Sheet[] = [];
  let sheet = newSheet();
  sheets.push(sheet);
  let y = heading(sheet);

  if (rows.length === 0) {
    text(sheet.ctx, labels.empty, MARGIN, y, { size: 26, colour: MUTED });
  }

  for (const row of rows) {
    if (y + ROW_H > BOTTOM) {
      sheet = newSheet();
      sheets.push(sheet);
      y = heading(sheet);
    }

    const { ctx } = sheet;
    // The name may run most of the sheet now that only the amount follows it,
    // so a long one is far less likely to be cut.
    text(ctx, fit(ctx, row.name, PAGE_W - MARGIN * 2 - 280, 26), NAME_X, y, { size: 26 });
    if (row.wanted) {
      text(ctx, fit(ctx, row.wanted, 260, 26), WANTED_X, y, {
        size: 26,
        weight: '700',
        align: 'right',
      });
    }

    rule(ctx, y + 14, HAIRLINE, 1);
    y += ROW_H;
  }

  if (rows.length > 0) {
    const last = sheets[sheets.length - 1];
    // The count goes under the last row wherever that fell, not at a fixed
    // foot: a fixed foot on a part-filled page reads as a page of its own.
    const footY = Math.min(y + 30, BOTTOM);
    text(last.ctx, `${labels.total}: ${rows.length}`, MARGIN, footY, {
      size: 26,
      weight: '700',
    });
  }

  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  sheets.forEach((finished, index) => {
    if (index > 0) doc.addPage();
    // JPEG at 0.92 rather than PNG, like the khata sheet: a page of text as PNG
    // runs to megabytes and this has to send over WhatsApp on a village line.
    doc.addImage(finished.canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297);
  });

  return doc.output('blob');
}
