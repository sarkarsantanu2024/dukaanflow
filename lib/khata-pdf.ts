/**
 * The khata as a real PDF file, built in the browser.
 *
 * WHY A CANVAS AND NOT TEXT. Every PDF library in JavaScript ships with Latin
 * fonts only, so `doc.text('রেখা দাস')` comes out as a row of boxes — and
 * embedding a Bengali and a Devanagari font is megabytes of download on a phone
 * for a file that gets made once a month. So the sheet is DRAWN, with the
 * browser's own text rendering, and the finished bitmap is what goes into the
 * PDF. The browser already has the fonts and already knows how to shape
 * conjuncts; nothing has to be shipped. This is the same trick the QR poster
 * uses, for the same reason.
 *
 * The cost is that the text is not selectable in the finished file. For a
 * statement that gets sent to a customer's phone and looked at, that is the
 * right trade — and the CSV next door is the machine-readable copy for anything
 * that needs adding up.
 */

import { formatPaise } from './money';
import { formatDay, formatDayTime } from './time';

/** One person's account, in the shape the khata screen already holds. */
export type StatementAccount = {
  name: string;
  phone: string;
  area: string;
  balancePaise: number;
  entries: {
    kind: 'DEBIT' | 'CREDIT';
    amountPaise: number;
    note: string;
    createdAt: string;
  }[];
};

/** The words on the sheet, in the shop's own language. */
export type StatementLabels = {
  book: string;
  statement: string;
  history: string;
  gave: string;
  got: string;
  total: string;
  outstanding: string;
  nobody: string;
};

/* A4 at roughly 150dpi. Big enough to stay crisp on a phone screen and when
 * printed, small enough that a ten-page book is still a file that sends. */
const PAGE_W = 1240;
const PAGE_H = 1754;
const MARGIN = 80;
const BOTTOM = PAGE_H - MARGIN;

/**
 * A stack that names the Indic families explicitly before falling back.
 *
 * Windows in particular will happily render Bengali in a default font that has
 * no conjuncts and produce something a reader can half-follow; naming Noto
 * first gets the right shapes wherever they are installed.
 */
const FONT =
  '"Noto Sans Bengali", "Noto Sans Devanagari", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

const INK = '#0f172a';
const MUTED = '#64748b';
const RULE = '#cbd5e1';
const HAIRLINE = '#e2e8f0';

/** Right edges of the three money columns, and where the date column starts. */
const COL_GAVE = 720;
const COL_GOT = 930;
const COL_BALANCE = PAGE_W - MARGIN;

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

/**
 * Lays a statement out over as many sheets as it takes.
 *
 * A khata that has run for a year is not one page, and a renderer that assumes
 * it is silently drops everything past the fold — which on a document about
 * money is the worst possible failure. So the cursor knows where the bottom is
 * and starts a new sheet when it reaches it.
 */
class Layout {
  readonly sheets: Sheet[] = [];
  private sheet: Sheet;
  private y = MARGIN;

  constructor(private readonly heading: (sheet: Sheet) => number) {
    this.sheet = newSheet();
    this.sheets.push(this.sheet);
    this.y = this.heading(this.sheet);
  }

  get ctx(): CanvasRenderingContext2D {
    return this.sheet.ctx;
  }

  /** Makes sure `height` more pixels are available, starting a sheet if not. */
  room(height: number): void {
    if (this.y + height <= BOTTOM) return;
    this.sheet = newSheet();
    this.sheets.push(this.sheet);
    this.y = this.heading(this.sheet);
  }

  /** Starts the next sheet whatever is left on this one. */
  break(): void {
    this.sheet = newSheet();
    this.sheets.push(this.sheet);
    this.y = this.heading(this.sheet);
  }

  advance(by: number): number {
    this.y += by;
    return this.y;
  }

  get cursor(): number {
    return this.y;
  }
}

function text(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  {
    size = 24,
    weight = '400',
    colour = INK,
    align = 'left' as CanvasTextAlign,
  } = {},
): void {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fillStyle = colour;
  ctx.textAlign = align;
  ctx.fillText(value, x, y);
  ctx.textAlign = 'left';
}

/** Breaks a note across lines so a long one cannot run off the sheet. */
function wrap(ctx: CanvasRenderingContext2D, value: string, width: number, size: number): string[] {
  ctx.font = `400 ${size}px ${FONT}`;
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= width) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    line = word;
  }
  if (line) lines.push(line);
  // Four lines of note is already more than anybody writes; past that the
  // entry rows stop being readable as a list.
  return lines.slice(0, 4);
}

function rule(ctx: CanvasRenderingContext2D, y: number, colour = RULE, thickness = 2): void {
  ctx.fillStyle = colour;
  ctx.fillRect(MARGIN, y, PAGE_W - MARGIN * 2, thickness);
}

/**
 * Draws the statement and hands back the finished PDF as a Blob.
 *
 * One account or the whole book: each person starts a fresh sheet, so the file
 * a shopkeeper downloads for everybody is still one page per customer and can
 * be printed and torn up into individual statements.
 */
export async function khataStatementPdf(input: {
  shopName: string;
  accounts: StatementAccount[];
  labels: StatementLabels;
  generatedAt?: Date;
}): Promise<Blob> {
  const { shopName, accounts, labels } = input;
  const generatedAt = input.generatedAt ?? new Date();

  /** The shop's name and the date, repeated at the top of every sheet. */
  const heading = (sheet: Sheet): number => {
    text(sheet.ctx, shopName, MARGIN, MARGIN + 34, { size: 42, weight: '700' });
    text(sheet.ctx, `${labels.book} · ${labels.statement}`, MARGIN, MARGIN + 72, {
      size: 22,
      colour: MUTED,
    });
    text(sheet.ctx, formatDayTime(generatedAt), COL_BALANCE, MARGIN + 72, {
      size: 20,
      colour: MUTED,
      align: 'right',
    });
    rule(sheet.ctx, MARGIN + 92);
    return MARGIN + 92;
  };

  const layout = new Layout(heading);

  if (accounts.length === 0) {
    text(layout.ctx, labels.nobody, MARGIN, layout.advance(80), { size: 24, colour: MUTED });
  }

  accounts.forEach((account, index) => {
    // Each person on their own sheet — which is what makes a whole-book
    // download printable as a stack of individual statements.
    if (index > 0) layout.break();

    let y = layout.advance(64);
    text(layout.ctx, account.name || '—', MARGIN, y, { size: 30, weight: '700' });
    const who = [account.phone && `+91 ${account.phone}`, account.area].filter(Boolean).join(' · ');
    if (who) {
      y = layout.advance(32);
      text(layout.ctx, who, MARGIN, y, { size: 22, colour: MUTED });
    }

    y = layout.advance(40);
    text(layout.ctx, labels.history, MARGIN, y, { size: 20, weight: '600', colour: MUTED });
    text(layout.ctx, labels.gave, COL_GAVE, y, { size: 20, weight: '600', colour: MUTED, align: 'right' });
    text(layout.ctx, labels.got, COL_GOT, y, { size: 20, weight: '600', colour: MUTED, align: 'right' });
    text(layout.ctx, labels.total, COL_BALANCE, y, {
      size: 20,
      weight: '600',
      colour: MUTED,
      align: 'right',
    });
    rule(layout.ctx, layout.advance(12), RULE, 2);

    /**
     * OLDEST FIRST, and the running balance beside each line.
     *
     * The screen shows newest first, which is right for working; a statement is
     * read forwards, and a running total means nothing unless the rows above it
     * are what came before. This is one person's account, so the counter is
     * theirs alone — the whole-book export used to run one counter across
     * everybody and print totals that belonged to nobody.
     */
    let runningPaise = 0;
    const ordered = [...account.entries].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    for (const entry of ordered) {
      runningPaise += entry.kind === 'DEBIT' ? entry.amountPaise : -entry.amountPaise;
      const noteLines = entry.note ? wrap(layout.ctx, entry.note, 560, 19) : [];
      layout.room(46 + noteLines.length * 24);

      const row = layout.advance(38);
      text(layout.ctx, formatDay(entry.createdAt), MARGIN, row, { size: 22 });
      text(
        layout.ctx,
        entry.kind === 'DEBIT' ? formatPaise(entry.amountPaise) : '',
        COL_GAVE,
        row,
        { size: 22, align: 'right' },
      );
      text(
        layout.ctx,
        entry.kind === 'CREDIT' ? formatPaise(entry.amountPaise) : '',
        COL_GOT,
        row,
        { size: 22, align: 'right' },
      );
      text(layout.ctx, formatPaise(runningPaise), COL_BALANCE, row, {
        size: 22,
        weight: '700',
        align: 'right',
      });

      for (const line of noteLines) {
        text(layout.ctx, line, MARGIN, layout.advance(24), { size: 19, colour: MUTED });
      }

      rule(layout.ctx, layout.advance(10), HAIRLINE, 1);
    }

    layout.room(70);
    rule(layout.ctx, layout.advance(18), INK, 3);
    const totalRow = layout.advance(38);
    text(layout.ctx, labels.outstanding, MARGIN, totalRow, { size: 26, weight: '700' });
    text(layout.ctx, formatPaise(account.balancePaise), COL_BALANCE, totalRow, {
      size: 26,
      weight: '700',
      align: 'right',
    });
  });

  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  layout.sheets.forEach((sheet, index) => {
    if (index > 0) doc.addPage();
    // JPEG at 0.92 rather than PNG: a page of text as PNG runs to megabytes,
    // and this has to travel over WhatsApp on a village connection.
    doc.addImage(sheet.canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297);
  });

  return doc.output('blob');
}

/**
 * The filename a shopkeeper will recognise, and a customer will receive.
 *
 * Ascii only. A Bengali name in a filename survives a modern phone and is
 * mangled by enough of everything else — the name is printed on the first line
 * of the sheet itself, where it is always right.
 *
 * WHICH IS EXACTLY WHY THE PHONE NUMBER IS THE FALLBACK. Stripping a Bengali
 * name to ascii leaves nothing at all, so every Bengali-named customer's
 * statement came out as `khata-<shop>-<date>.pdf` — the same name as each
 * other's, and the same name as the whole book. A shopkeeper sending three
 * statements in an evening would have three files called the same thing,
 * told apart only by the browser's "(1)" and "(2)", which is no way to find the
 * one you meant to attach. A phone number is ascii by construction and is what
 * identifies the customer anyway.
 */
/**
 * Hands a finished Blob to the browser as a download.
 *
 * The object URL is revoked on the next tick rather than immediately: Safari
 * and several Android WebViews start the download asynchronously, and pulling
 * the URL out from under them in the same frame produces a file that silently
 * never arrives.
 */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function statementFilename(
  shopName: string,
  on: Date,
  who?: { name: string; phone: string } | null,
): string {
  const safe = (value: string) =>
    value.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();

  // `all` rather than nothing, so the whole book can never collide with one
  // customer's statement either.
  const person = who ? safe(who.name) || safe(who.phone) || 'customer' : 'all';

  return `${['khata', safe(shopName) || 'shop', person, on.toISOString().slice(0, 10)].join('-')}.pdf`;
}
