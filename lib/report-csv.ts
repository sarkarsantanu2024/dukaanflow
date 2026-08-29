/**
 * The downloadable form of a report.
 *
 * One CSV holding every section, each behind its own header row and separated
 * by a blank line. Spreadsheets read this fine, and it keeps a period's whole
 * analysis in one file an operator can mail to somebody — which several small
 * files, one per section, would not.
 *
 * The alternative — one flat table — would need a "section" column repeated on
 * every row and columns that mean different things depending on it. That reads
 * worse in Excel, not better.
 */

import { formatDayTime } from './time';
import type { Report } from './analytics';

/**
 * RFC 4180 quoting. A leading `=`, `+`, `-` or `@` is also prefixed with a
 * quote, because a spreadsheet treats those as the start of a formula — and
 * item names come from shop owners typing into their own phones.
 */
function cell(value: string | number): string {
  const text = String(value ?? '');
  const guarded = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

function row(values: (string | number)[]): string {
  return values.map(cell).join(',');
}

export function reportToCsv(report: Report): string {
  const lines: string[] = [];

  const section = (title: string, header: string[], body: (string | number)[][]) => {
    lines.push(row([title]));
    lines.push(row(header));
    if (body.length === 0) lines.push(row(['(nothing in this period)']));
    for (const entry of body) lines.push(row(entry));
    lines.push('');
  };

  lines.push(row(['DukaanFlow business report']));
  // One shop, or a whole trade — never both, because saying "All business
  // types" twice under two different labels reads as a bug in the export.
  lines.push(
    report.singleShop
      ? row(['Shop', report.scopeLabel])
      : row(['Business type', report.typeLabel]),
  );
  lines.push(row(['Period', report.period.label]));
  lines.push(row(['Generated', formatDayTime(report.generatedAt)]));
  lines.push(row(['Currency', 'INR, whole rupees']));
  lines.push(row(['Timezone', 'Asia/Kolkata — all days and hours are shop time']));
  lines.push('');

  const h = report.headline;
  section(
    'Headline',
    ['Measure', 'Value'],
    [
      ['Revenue', h.revenue],
      ['Transactions', h.transactions],
      ['Average basket', h.averageBasket],
      ['Shops in scope', h.shops],
      ['Shops with no trade', h.silentShops],
      ['Customers who ordered', h.customers],
      ['Repeat customer rate %', h.repeatRate],
      ['First-time customers', h.newCustomers],
      ['Order completion rate %', report.completionRate],
      ['Order cancellation rate %', report.cancellationRate],
    ],
  );

  section(
    'Best selling items',
    ['Item', 'Revenue', 'Quantity', 'Transactions', 'Shops selling it', 'Share of revenue %'],
    report.topProducts.map((product) => [
      product.label,
      product.revenue,
      product.quantity,
      product.transactions,
      product.shops,
      product.revenueShare,
    ]),
  );

  section(
    'Occasions',
    ['Occasion', 'Dates', 'Revenue', 'Last year', 'Change %', 'Moved most'],
    report.occasions.map((occasion) => [
      occasion.name,
      occasion.when,
      occasion.revenue,
      occasion.lastYearRevenue ?? '',
      occasion.change ?? '',
      occasion.topItems
        .slice(0, 5)
        .map((item) => `${item.label} (${item.revenue})`)
        .join('; '),
    ]),
  );

  section(
    'Where customers come from',
    ['Area', 'Orders', 'Share %', 'Customers', 'Revenue'],
    [
      ...report.localities.map((area) => [
        area.area,
        area.orders,
        area.share,
        area.customers,
        area.revenue,
      ]),
      // Named, not hidden: a share table that quietly omits its denominator is
      // how a chart of 40% of the orders gets read as all of them.
      ...(report.ordersWithoutArea > 0
        ? [['(no area given)', report.ordersWithoutArea, '', '', '']]
        : []),
    ],
  );

  section(
    'Busiest hours (shop time)',
    ['Hour', 'Transactions', 'Revenue'],
    report.byHour.map((slot) => [slot.label, slot.transactions, slot.revenue]),
  );

  section(
    'Busiest days of the week',
    ['Day', 'Transactions', 'Revenue'],
    report.byWeekday.map((slot) => [slot.label, slot.transactions, slot.revenue]),
  );

  section(
    report.period.granularity === 'year' ? 'Month by month' : 'Day by day',
    [report.period.granularity === 'year' ? 'Month' : 'Day', 'Transactions', 'Revenue'],
    report.overTime.map((slot) => [slot.label, slot.transactions, slot.revenue]),
  );

  section(
    'Where the money came from',
    ['Channel', 'Transactions', 'Revenue'],
    [
      ['WhatsApp orders', report.channels.orders.transactions, report.channels.orders.revenue],
      ['Counter sales', report.channels.counter.transactions, report.channels.counter.revenue],
    ],
  );

  section(
    'Payment modes',
    ['Mode', 'Transactions', 'Revenue'],
    report.paymentModes.map((slot) => [slot.label, slot.transactions, slot.revenue]),
  );

  section(
    'Delivery or pickup',
    ['Type', 'Orders', 'Revenue'],
    report.orderTypes.map((slot) => [slot.label, slot.transactions, slot.revenue]),
  );

  section(
    'Order outcomes',
    ['Status', 'Orders', 'Value'],
    report.orderStatuses.map((slot) => [slot.label, slot.transactions, slot.revenue]),
  );

  section(
    report.singleShop ? 'This shop' : 'Shops',
    ['Shop', 'Type', 'Revenue', 'Transactions', 'Average basket', 'Items listed', 'Items that sold nothing'],
    report.shops.map((shop) => [
      shop.name,
      shop.typeLabel,
      shop.revenue,
      shop.transactions,
      shop.averageBasket,
      shop.items,
      shop.deadItems,
    ]),
  );

  section(
    'Proven sellers currently out of stock',
    ['Item', 'Shop', 'Revenue this period'],
    report.outOfStockSellers.map((entry) => [entry.label, entry.shop, entry.revenue]),
  );

  section(
    'Listed but never sold this period',
    ['Item', 'Shops holding it'],
    report.deadProducts.map((entry) => [entry.label, entry.shops]),
  );

  section(
    'Read this alongside the numbers',
    ['Note'],
    report.caveats.map((note) => [note]),
  );

  return lines.join('\r\n');
}

/** `dukaanflow-ramu-grocery-august-2026.csv` — sortable, and says what it holds. */
export function reportFilename(report: Report): string {
  const scope = report.scopeLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const period = report.period.label.toLowerCase().replace(/\s+/g, '-');
  return `dukaanflow-${scope}-${period}.csv`;
}
