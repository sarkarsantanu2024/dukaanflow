/**
 * The two chart shapes this report needs, drawn in HTML.
 *
 * No chart library. Every series here is one measure over one ordered set of
 * buckets — a shape CSS draws exactly, at a fraction of the weight, and which
 * survives the print stylesheet that a canvas-based library would not. Printing
 * is not incidental: the whole point of this page is a report somebody takes
 * away.
 *
 * One series means one hue, so there is no legend to read and no palette to
 * check for colour blindness. Identity is carried by the row label, and the
 * only bar that gets a colour of its own is the peak — because "when is it
 * busiest" is the question, and answering it in the picture beats making the
 * reader compare twenty-four bars by eye. Numbers stay in ink, never in the
 * series colour.
 */

import clsx from 'clsx';
import { formatPaise } from '@/lib/money';

export type ChartRow = { label: string; transactions: number; revenuePaise: number };

function tooltip(row: ChartRow): string {
  const trade = `${row.transactions} ${row.transactions === 1 ? 'sale' : 'sales'}`;
  return `${row.label} — ${trade}, ${formatPaise(row.revenuePaise)}`;
}

/**
 * Vertical columns, for buckets that are read left to right as time: hours of
 * the day, days of the month, months of the year.
 *
 * `labelEvery` thins the axis. Twenty-four hour labels under 24 columns on a
 * phone is a grey smear; every third one is still a readable scale.
 */
export function ColumnChart({
  rows,
  labelEvery = 1,
  empty,
}: {
  rows: ChartRow[];
  labelEvery?: number;
  empty: string;
}) {
  const peak = Math.max(...rows.map((row) => row.transactions), 0);
  if (peak === 0) return <ChartEmpty>{empty}</ChartEmpty>;

  return (
    <div className="flex h-40 items-end gap-[2px]" role="img" aria-label={summarise(rows)}>
      {rows.map((row, index) => {
        const share = row.transactions / peak;
        const isPeak = row.transactions === peak;
        return (
          <div key={row.label} className="group relative flex min-w-0 flex-1 flex-col justify-end">
            <div
              title={tooltip(row)}
              style={{ height: `${Math.max(share * 100, row.transactions > 0 ? 3 : 0)}%` }}
              className={clsx(
                'w-full rounded-t transition-colors',
                isPeak ? 'bg-brand-700' : 'bg-brand-300 group-hover:bg-brand-500',
              )}
            />
            <span
              className={clsx(
                'mt-1 truncate text-center text-[10px] leading-none',
                isPeak ? 'font-semibold text-slate-900' : 'text-slate-400',
              )}
            >
              {isPeak || index % labelEvery === 0 ? row.label : ' '}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Horizontal bars, for buckets whose labels are words: weekdays, item names.
 * A name never fits under a column, and rotating it to make it fit is how a
 * chart becomes something people stop reading.
 */
export function BarList({
  rows,
  empty,
  measure = 'transactions',
}: {
  rows: ChartRow[];
  empty: string;
  /** Which number sets the bar length. The other is still shown beside it. */
  measure?: 'transactions' | 'revenuePaise';
}) {
  const value = (row: ChartRow) => (measure === 'revenuePaise' ? row.revenuePaise : row.transactions);
  const peak = Math.max(...rows.map(value), 0);
  if (peak === 0) return <ChartEmpty>{empty}</ChartEmpty>;

  return (
    <ol className="space-y-1.5">
      {rows.map((row) => {
        const share = value(row) / peak;
        const isPeak = value(row) === peak;
        return (
          <li key={row.label} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3">
            <span className="truncate text-sm text-slate-700" title={row.label}>
              {row.label}
            </span>
            <span className="flex h-2.5 items-center rounded bg-slate-100">
              <span
                title={tooltip(row)}
                style={{ width: `${Math.max(share * 100, value(row) > 0 ? 2 : 0)}%` }}
                className={clsx('h-2.5 rounded', isPeak ? 'bg-brand-700' : 'bg-brand-400')}
              />
            </span>
            <span className="text-right text-sm font-semibold tabular-nums text-slate-900">
              {measure === 'revenuePaise' ? formatPaise(row.revenuePaise) : row.transactions}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function ChartEmpty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">{children}</p>
  );
}

/** What a screen reader is told instead of the picture. */
function summarise(rows: ChartRow[]): string {
  return rows.map((row) => `${row.label}: ${row.transactions}`).join(', ');
}
