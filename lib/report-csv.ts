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
import { PAISE_PER_RUPEE } from './money';
import type { Report } from './analytics';

/**
 * Money for a spreadsheet: rupees with two decimals, unformatted.
 *
 * Not `formatPaise`. That produces "₹1,250" for a person to read, and a
 * spreadsheet handed a currency symbol and a thousands separator stores text —
 * so the column will not sum, which is the first thing anybody does with an
 * exported report. A bare "1250.00" is a number in every locale Excel opens.
 */
function rupees(paise: number): string {
  return (Math.round(paise) / PAISE_PER_RUPEE).toFixed(2);
}

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
      ['Revenue (₹)', rupees(h.revenuePaise)],
      ['Transactions', h.transactions],
      ['Average basket (₹)', rupees(h.averageBasketPaise)],
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
    ['Item', 'Revenue (₹)', 'Quantity', 'Transactions', 'Shops selling it', 'Share of revenuePaise %'],
    report.topProducts.map((product) => [
      product.label,
      rupees(product.revenuePaise),
      product.quantity,
      product.transactions,
      product.shops,
      product.revenueShare,
    ]),
  );

  section(
    'Occasions',
    ['Occasion', 'Dates', 'Revenue (₹)', 'Last year (₹)', 'Change %', 'Moved most'],
    report.occasions.map((occasion) => [
      occasion.name,
      occasion.when,
      rupees(occasion.revenuePaise),
      occasion.lastYearRevenuePaise === null ? '' : rupees(occasion.lastYearRevenuePaise),
      occasion.change ?? '',
      occasion.topItems
        .slice(0, 5)
        .map((item) => `${item.label} (${rupees(item.revenuePaise)})`)
        .join('; '),
    ]),
  );

  section(
    'Where customers come from',
    ['Area', 'Orders', 'Share %', 'Customers', 'Revenue (₹)'],
    [
      ...report.localities.map((area) => [
        area.area,
        area.orders,
        area.share,
        area.customers,
        rupees(area.revenuePaise),
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
    ['Hour', 'Transactions', 'Revenue (₹)'],
    report.byHour.map((slot) => [slot.label, slot.transactions, rupees(slot.revenuePaise)]),
  );

  section(
    'Busiest days of the week',
    ['Day', 'Transactions', 'Revenue (₹)'],
    report.byWeekday.map((slot) => [slot.label, slot.transactions, rupees(slot.revenuePaise)]),
  );

  section(
    report.period.granularity === 'year' ? 'Month by month' : 'Day by day',
    [report.period.granularity === 'year' ? 'Month' : 'Day', 'Transactions', 'Revenue (₹)'],
    report.overTime.map((slot) => [slot.label, slot.transactions, rupees(slot.revenuePaise)]),
  );

  section(
    'Where the money came from',
    ['Channel', 'Transactions', 'Revenue (₹)'],
    [
      ['WhatsApp orders', report.channels.orders.transactions, rupees(report.channels.orders.revenuePaise)],
      ['Counter sales', report.channels.counter.transactions, rupees(report.channels.counter.revenuePaise)],
    ],
  );

  section(
    'Payment modes',
    ['Mode', 'Transactions', 'Revenue (₹)'],
    report.paymentModes.map((slot) => [slot.label, slot.transactions, rupees(slot.revenuePaise)]),
  );

  section(
    'Delivery or pickup',
    ['Type', 'Orders', 'Revenue (₹)'],
    report.orderTypes.map((slot) => [slot.label, slot.transactions, rupees(slot.revenuePaise)]),
  );

  section(
    'Order outcomes',
    ['Status', 'Orders', 'Value'],
    report.orderStatuses.map((slot) => [slot.label, slot.transactions, rupees(slot.revenuePaise)]),
  );

  section(
    report.singleShop ? 'This shop' : 'Shops',
    [
      'Shop',
      'Type',
      'Revenue (₹)',
      'Transactions',
      'Average basket (₹)',
      'Items listed',
      'Items that sold nothing',
    ],
    report.shops.map((shop) => [
      shop.name,
      shop.typeLabel,
      rupees(shop.revenuePaise),
      shop.transactions,
      rupees(shop.averageBasketPaise),
      shop.items,
      shop.deadItems,
    ]),
  );

  section(
    'Proven sellers currently out of stock',
    ['Item', 'Shop', 'Revenue this period'],
    report.outOfStockSellers.map((entry) => [entry.label, entry.shop, rupees(entry.revenuePaise)]),
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
