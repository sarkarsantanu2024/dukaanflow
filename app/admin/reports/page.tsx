import { AdminHeader } from '@/components/admin/AdminHeader';
import { ReportControls } from '@/components/admin/ReportControls';
import { BarList, ColumnChart } from '@/components/admin/ReportChart';
import { buildPeriod, loadReport, peakOf, type BucketRow, type Report } from '@/lib/analytics';
import { parseReportQuery } from '@/lib/report-query';
import { prisma } from '@/lib/prisma';
import { demoFilter, showingDemoShops } from '@/lib/demo';
import { formatPaise } from '@/lib/money';
import { formatDayTime, shopClock } from '@/lib/time';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'DukaanFlow — Reports' };

/**
 * The Super Admin's business report, for one business type and one period.
 *
 * Every section answers a question somebody would otherwise ask by hand. Where
 * an answer is thin — no area on an order, no occasion dated for a year —
 * the page says so in its caveats rather than presenting a gap as a zero.
 *
 * The page prints. The chrome is already `no-print`, so Ctrl+P — or the button
 * in the filter row — produces the report on its own, which is the form it
 * usually needs to be in to be any use to anybody outside this console.
 */
export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = parseReportQuery(await searchParams);

  // The picker lists every shop, not only those of the chosen type: switching
  // to a shop is how you leave a type behind, and a picker that hid the shop
  // you wanted until you first fixed a filter above it would be a maze.
  const includeDemo = await showingDemoShops();

  const [report, pickable] = await Promise.all([
    loadReport({ ...query, includeDemo }, buildPeriod(query.granularity, query.year, query.month)),
    prisma.shop.findMany({
      where: demoFilter(includeDemo),
      select: { name: true, slug: true, isDemo: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <>
      <AdminHeader title="Reports" eyebrow="Business analytics" backHref="/admin" />

      <main className="px-4 py-5 lg:px-6">
        <ReportControls
          query={query}
          shops={pickable}
          latestYear={shopClock(new Date()).year}
        />

        <div className="print-sheet space-y-5">
          <ReportTitle report={report} />
          <Headline report={report} />

          <Section
            title="What sells"
            note="Ranked by what it took, not by how many left the shelf — a hundred rupees is a hundred rupees whether that was one sack or fifty cups."
          >
            <BarList
              measure="revenuePaise"
              rows={report.topProducts.map((product) => ({
                label: product.label,
                transactions: product.transactions,
                revenuePaise: product.revenuePaise,
              }))}
              empty="Nothing was sold in this period."
            />
            {report.topProducts.length > 0 && (
              <p className="mt-3 text-sm text-slate-500">
                {report.topProducts[0].label} led with {report.topProducts[0].revenueShare}% of all
                revenuePaise
                {report.singleShop
                  ? ''
                  : `, across ${report.topProducts[0].shops} ${report.topProducts[0].shops === 1 ? 'shop' : 'shops'}`}
                .
              </p>
            )}
          </Section>

          <Section
            title="Occasions"
            note="Read from the rolled-up totals, which are kept permanently — so a festival stays comparable year on year long after its orders have been deleted."
          >
            {report.occasions.length === 0 ? (
              <Nothing>
                No occasion on the calendar falls in this period. Add them under{' '}
                <a href="/admin/occasions" className="font-semibold text-brand-700 underline">
                  Occasions
                </a>
                .
              </Nothing>
            ) : (
              <div className="space-y-4">
                {report.occasions.map((occasion) => (
                  <div key={`${occasion.name}-${occasion.when}`} className="rounded-xl bg-slate-50 px-4 py-3">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="text-sm font-bold text-slate-900">{occasion.name}</h3>
                      <span className="text-xs tabular-nums text-slate-500">{occasion.when}</span>
                      <span className="ml-auto text-lg font-bold tabular-nums text-slate-900">
                        {formatPaise(occasion.revenuePaise)}
                      </span>
                    </div>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {occasion.change === null ? (
                        occasion.lastYearRevenuePaise === null ? (
                          'First year on record — nothing to compare against yet.'
                        ) : (
                          'Nothing was taken last year, so there is no percentage to give.'
                        )
                      ) : (
                        <>
                          <span
                            className={
                              occasion.change >= 0
                                ? 'font-semibold text-brand-700'
                                : 'font-semibold text-red-600'
                            }
                          >
                            {occasion.change >= 0 ? '▲' : '▼'} {Math.abs(occasion.change)}%
                          </span>{' '}
                          against {formatPaise(occasion.lastYearRevenuePaise ?? 0)} last year
                        </>
                      )}
                    </p>

                    {occasion.topItems.length > 0 && (
                      <p className="mt-2 text-xs leading-relaxed text-slate-600">
                        <span className="font-semibold">Moved most:</span>{' '}
                        {occasion.topItems
                          .slice(0, 5)
                          .map((item) => `${item.label} (${formatPaise(item.revenuePaise)})`)
                          .join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section
            title="Where customers come from"
            note={
              report.ordersWithoutArea > 0
                ? `By area, from the orders that gave one. ${report.ordersWithoutArea} order${report.ordersWithoutArea === 1 ? '' : 's'} named none and ${report.ordersWithoutArea === 1 ? 'is' : 'are'} not counted below.`
                : 'By the area customers gave at checkout.'
            }
          >
            {report.localities.length === 0 ? (
              <Nothing>
                No order in this period named an area. Orders placed before the area box existed
                carry none.
              </Nothing>
            ) : (
              <Table
                head={['Area', 'Orders', 'Share', 'Customers', 'Revenue']}
                rows={report.localities.map((area) => [
                  area.area,
                  area.orders,
                  `${area.share}%`,
                  area.customers,
                  formatPaise(area.revenuePaise),
                ])}
              />
            )}
          </Section>

          <div className="grid gap-5 lg:grid-cols-2">
            <Section
              title="When customers come — hour by hour"
              note="Shop time, not server time. Use it for staffing and for when to push an offer."
            >
              <ColumnChart
                rows={report.byHour}
                labelEvery={3}
                empty="No trade to place on a clock yet."
              />
              <Peak rows={report.byHour} noun="hour" />
            </Section>

            <Section title="Which day of the week" note="Seven buckets, every week in the period stacked together.">
              <BarList rows={report.byWeekday} empty="No trade to place on a calendar yet." />
              <Peak rows={report.byWeekday} noun="day" />
            </Section>
          </div>

          <Section
            title={report.period.granularity === 'year' ? 'Month by month' : 'Day by day'}
            note="The shape of the period. A single tall bar is usually a festival or a market day — worth naming before next year."
          >
            <ColumnChart
              rows={report.overTime}
              labelEvery={report.period.granularity === 'year' ? 1 : 3}
              empty="Nothing was recorded in this period."
            />
          </Section>

          <div className="grid gap-5 lg:grid-cols-2">
            <Section title="Where the money came from">
              <Table
                head={['Channel', 'Sales', 'Revenue']}
                rows={[
                  [
                    'WhatsApp orders',
                    report.channels.orders.transactions,
                    formatPaise(report.channels.orders.revenuePaise),
                  ],
                  [
                    'Counter sales',
                    report.channels.counter.transactions,
                    formatPaise(report.channels.counter.revenuePaise),
                  ],
                ]}
              />
            </Section>

            <Section title="How it was paid and taken">
              <Table
                head={['Split', 'Count', 'Value']}
                rows={[
                  ...report.paymentModes.map((row) => [
                    prettyLabel(row.label),
                    row.transactions,
                    formatPaise(row.revenuePaise),
                  ]),
                  ...report.orderTypes.map((row) => [
                    prettyLabel(row.label),
                    row.transactions,
                    formatPaise(row.revenuePaise),
                  ]),
                ]}
              />
            </Section>
          </div>

          <Section
            title="What happened to the orders"
            note={`${report.completionRate}% completed, ${report.cancellationRate}% cancelled. A cancellation rate climbing is usually stock, not demand.`}
          >
            <Table
              head={['Status', 'Orders', 'Value']}
              rows={report.orderStatuses.map((row) => [
                prettyLabel(row.label),
                row.transactions,
                formatPaise(row.revenuePaise),
              ])}
            />
          </Section>

          {/* A one-row leaderboard is not a leaderboard. When the report is
              about one shop, its totals are already the headline above. */}
          {!report.singleShop && (
            <Section
              title="Shop by shop"
              note="Sorted by revenuePaise. A shop with items listed and nothing sold is the one to call."
            >
              <Table
                head={['Shop', 'Type', 'Revenue', 'Sales', 'Avg basket', 'Items', 'Sold nothing']}
                rows={report.shops.map((shop) => [
                  shop.name,
                  shop.typeLabel,
                  formatPaise(shop.revenuePaise),
                  shop.transactions,
                  formatPaise(shop.averageBasketPaise),
                  shop.items,
                  shop.deadItems,
                ])}
              />
            </Section>
          )}

          <div className="grid gap-5 lg:grid-cols-2">
            <Section
              title="Proven sellers, currently out of stock"
              note="Money being lost right now, not last month."
            >
              {report.outOfStockSellers.length === 0 ? (
                <Nothing>Every strong seller is in stock.</Nothing>
              ) : (
                <Table
                  head={['Item', 'Shop', 'Took this period']}
                  rows={report.outOfStockSellers.map((entry) => [
                    entry.label,
                    entry.shop,
                    formatPaise(entry.revenuePaise),
                  ])}
                />
              )}
            </Section>

            <Section
              title="Listed, but sold nothing"
              note="Dead shelf space in the catalogue — and a plan the shop may be paying for by item count."
            >
              {report.deadProducts.length === 0 ? (
                <Nothing>Everything listed sold at least once.</Nothing>
              ) : (
                <Table
                  head={['Item', 'Shops holding it']}
                  rows={report.deadProducts.map((entry) => [entry.label, entry.shops])}
                />
              )}
            </Section>
          </div>

          <section className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <h2 className="text-sm font-bold text-amber-900">Read this alongside the numbers</h2>
            <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-amber-900">
              {report.caveats.map((note) => (
                <li key={note}>· {note}</li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </>
  );
}

/* ----------------------------------------------------------------- pieces */

function ReportTitle({ report }: { report: Report }) {
  return (
    <header className="rounded-2xl bg-white px-5 py-4 shadow-card">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        DukaanFlow business report
      </p>
      <h1 className="mt-0.5 text-xl font-bold text-slate-900">
        {report.scopeLabel} · {report.period.label}
      </h1>
      <p className="mt-1 text-xs text-slate-500">
        Generated {formatDayTime(report.generatedAt)} · all days and hours are shop time
        (Asia/Kolkata) · amounts in whole rupees
      </p>
    </header>
  );
}

function Headline({ report }: { report: Report }) {
  const h = report.headline;
  return (
    <dl className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-2xl bg-white px-5 py-4 shadow-card">
      <Stat label="Revenue" value={formatPaise(h.revenuePaise)} />
      <Stat label="Sales" value={h.transactions} />
      <Stat label="Avg basket" value={formatPaise(h.averageBasketPaise)} />
      {report.singleShop ? (
        <Stat label="Items listed" value={report.shops[0]?.items ?? 0} />
      ) : (
        <>
          <Stat label="Shops" value={h.shops} />
          <Stat
            label="No trade"
            value={h.silentShops}
            tone={h.silentShops > 0 ? 'warn' : undefined}
          />
        </>
      )}
      <Stat label="Customers" value={h.customers} />
      <Stat label="Repeat" value={`${h.repeatRate}%`} />
      <Stat label="First-timers" value={h.newCustomers} />
    </dl>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: 'warn';
}) {
  return (
    <div className="flex items-baseline gap-2">
      <dd
        className={
          tone === 'warn'
            ? 'text-2xl font-bold tabular-nums text-amber-600'
            : 'text-2xl font-bold tabular-nums text-slate-900'
        }
      >
        {value}
      </dd>
      <dt className="text-sm text-slate-500">{label}</dt>
    </div>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="break-inside-avoid rounded-2xl bg-white px-5 py-4 shadow-card">
      <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      {note && <p className="mb-3 mt-0.5 text-xs leading-relaxed text-slate-500">{note}</p>}
      <div className={note ? '' : 'mt-3'}>{children}</div>
    </section>
  );
}

function Peak({ rows, noun }: { rows: BucketRow[]; noun: string }) {
  const best = peakOf(rows);
  if (!best) return null;
  return (
    <p className="mt-3 text-sm text-slate-500">
      Busiest {noun}: <span className="font-semibold text-slate-900">{best.label}</span> —{' '}
      {best.transactions} {best.transactions === 1 ? 'sale' : 'sales'},{' '}
      {formatPaise(best.revenuePaise)}.
    </p>
  );
}

function Table({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  if (rows.length === 0) return <Nothing>Nothing in this period.</Nothing>;
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[28rem] text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            {head.map((cell, index) => (
              <th key={cell} className={index === 0 ? 'py-2 pr-3' : 'py-2 pr-3 text-right'}>
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-slate-100 last:border-0">
              {row.map((cell, index) => (
                <td
                  key={index}
                  className={
                    index === 0
                      ? 'py-2 pr-3 text-slate-900'
                      : 'py-2 pr-3 text-right tabular-nums text-slate-700'
                  }
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Nothing({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">{children}</p>
  );
}

/** `PAST_DUE` → `Past due`. Enum names are for the database, not the report. */
function prettyLabel(value: string): string {
  const words = value.toLowerCase().replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}
