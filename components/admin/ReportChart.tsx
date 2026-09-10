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

  /**
   * `items-stretch`, NOT `items-end`.
   *
   * Each bar is sized as a percentage of its column, so the column has to have
   * a height for that percentage to resolve against. `items-end` sized every
   * column to its own content — the axis label, 14px — and each bar then
   * computed to 0. The chart drew its labels, its tooltips and its aria
   * summary correctly, and not one visible bar.
   *
   * The column already carries `justify-end`, and that is what actually sits
   * the bars on the axis; aligning the columns themselves was never what did
   * it.
   */
  return (
    <div className="flex h-40 items-stretch gap-[2px]" role="img" aria-label={summarise(rows)}>
      {rows.map((row, index) => {
        const share = row.transactions / peak;
        const isPeak = row.transactions === peak;
        // A CEILING ON HOW WIDE ONE BAR MAY GET. `flex-1` alone divides the
        // full width between however many columns there are — so a period with
        // a single day of trade drew one bar 1,200px wide and 160px tall, which
        // reads as a solid green rectangle rather than as a chart. A bar chart
        // with two bars in it should look like a chart with two bars in it.
        return (
          <div
            key={row.label}
            className="group relative flex min-w-0 max-w-[3.5rem] flex-1 flex-col justify-end"
          >
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

/**
 * The period's shape, as an area under a line.
 *
 * WHY A LINE AND NOT MORE COLUMNS. Columns are for comparing buckets that have
 * no order — weekdays, payment methods, items. Time has an order, and the thing
 * a reader wants from a trend is the SHAPE: climbing, falling, one spike. A row
 * of separate bars makes them read thirty heights and assemble the shape
 * themselves; a line hands it to them.
 *
 * Measured in money, not transactions. Two hundred rupees of rice and two
 * hundred rupees of biscuits are the same day to a shopkeeper deciding whether
 * this month beat last, and a count would show the biscuits winning.
 *
 * Hand-drawn SVG rather than a charting library: this is one polyline and a
 * fill, the page must print, and the alternative is 60KB of JavaScript plus a
 * CDN the artifact CSP would have to allow.
 */
export function TrendArea({
  rows,
  empty,
  labelEvery = 1,
}: {
  rows: ChartRow[];
  empty: string;
  labelEvery?: number;
}) {
  const peak = Math.max(...rows.map((row) => row.revenuePaise), 0);
  if (rows.length === 0 || peak === 0) return <ChartEmpty>{empty}</ChartEmpty>;

  // A fixed viewBox with `preserveAspectRatio="none"`: the chart stretches to
  // whatever width the card gives it, and the maths below stays in round
  // numbers instead of chasing a measured pixel width.
  const W = 1000;
  const H = 260;
  // Room under the line for the axis labels, and a little over it so the peak
  // never touches the top edge and read as clipped.
  const TOP = 12;
  const BOTTOM = 28;

  const step = rows.length === 1 ? 0 : W / (rows.length - 1);
  const y = (paise: number) => TOP + (1 - paise / peak) * (H - TOP - BOTTOM);
  const x = (index: number) => (rows.length === 1 ? W / 2 : index * step);

  const points = rows.map((row, index) => `${x(index)},${y(row.revenuePaise)}`).join(' ');
  // The fill is the same path closed along the baseline.
  const area = `${x(0)},${H - BOTTOM} ${points} ${x(rows.length - 1)},${H - BOTTOM}`;

  const peakIndex = rows.findIndex((row) => row.revenuePaise === peak);

  return (
    <figure className="w-full" role="img" aria-label={summarise(rows)}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-52 w-full">
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(47 122 94)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="rgb(47 122 94)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Three rules, so a height can be read rather than only compared. */}
        {[0.25, 0.5, 0.75].map((fraction) => (
          <line
            key={fraction}
            x1={0}
            x2={W}
            y1={TOP + fraction * (H - TOP - BOTTOM)}
            y2={TOP + fraction * (H - TOP - BOTTOM)}
            stroke="rgb(226 232 240)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        <polygon points={area} fill="url(#trend-fill)" />
        <polyline
          points={points}
          fill="none"
          stroke="rgb(47 122 94)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          // Without this the stroke stretches with the viewBox and the line is
          // fat on a wide screen and hairline on a narrow one.
          vectorEffect="non-scaling-stroke"
        />

        {peakIndex >= 0 && (
          <circle
            cx={x(peakIndex)}
            cy={y(peak)}
            r={3.5}
            fill="rgb(47 122 94)"
            stroke="white"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>

      {/* The axis as text under the drawing, not inside it — labels inside a
          stretched viewBox stretch with it. */}
      <div className="mt-1 flex justify-between text-[10px] tabular-nums text-slate-400">
        {rows.map((row, index) =>
          index % labelEvery === 0 || index === rows.length - 1 ? (
            <span key={row.label} className="truncate">
              {row.label}
            </span>
          ) : null,
        )}
      </div>
    </figure>
  );
}
