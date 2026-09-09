/**
 * Reading an order's item snapshot back out of JSON.
 *
 * An order stores what was bought as JSON, not as rows, so there is no compiler
 * between the column and whoever reads it. Two screens now need the same lines —
 * the orders queue, and the till when an order has been carried over to it — and
 * a second hand-rolled decoder is how the two would come to disagree about what
 * a customer ordered.
 *
 * THE MONEY IS THE PART THAT MUST NOT DRIFT. Rows written since money moved to
 * paise carry `amountPaise`; older ones carry `amount` or `lineTotal` and hold
 * RUPEES. Reading an old row as paise shows a ₹130 order as ₹1.30 — on the
 * owner's own screen, and in anything computed from it.
 */

/** The names an item is known by now, for orders taken before snapshots carried them. */
export type SnapshotNames = Map<string, { nameBn: string; nameHi: string }>;

export type SnapshotLine = {
  /** Blank on orders taken before the snapshot carried it. */
  itemId: string;
  name: string;
  nameBn: string;
  nameHi: string;
  unit: string;
  quantity: number;
  amountPaise: number;
};

function num(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** What one snapshot line came to, in paise — see the note at the top. */
export function snapshotPaise(line: Record<string, unknown>): number {
  if (line.amountPaise !== undefined) return num(line.amountPaise);
  const legacyRupees = line.lineTotal ?? line.amount;
  return legacyRupees === undefined ? 0 : Math.round(num(legacyRupees) * 100);
}

/**
 * The lines of an order, narrowed and named.
 *
 * Snapshots only began carrying translations recently, so orders taken before
 * that hold one name and would read in English on a Bengali screen. Where the
 * item is still listed, `known` fills the gap — the snapshot stays the authority
 * on price and quantity, the parts that must never move, and borrows only the
 * wording.
 *
 * Quantities are NOT rounded: they are multiples of the item's unit and may be
 * fractional, because fifty grams of a kilo-priced item is fifty grams.
 */
export function readOrderLines(itemsJson: unknown, known?: SnapshotNames): SnapshotLine[] {
  if (!Array.isArray(itemsJson)) return [];
  return itemsJson.flatMap((raw) => {
    if (!raw || typeof raw !== 'object') return [];
    const row = raw as Record<string, unknown>;
    const itemId = String(row.itemId ?? '');
    const fallback = known?.get(itemId);
    return [
      {
        itemId,
        name: String(row.name ?? ''),
        nameBn: String(row.nameBn ?? fallback?.nameBn ?? ''),
        nameHi: String(row.nameHi ?? fallback?.nameHi ?? ''),
        unit: String(row.unit ?? ''),
        quantity: num(row.quantity),
        amountPaise: snapshotPaise(row),
      },
    ];
  });
}
