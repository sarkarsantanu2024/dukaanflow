'use client';

/**
 * The report's filters, plus the two ways out of it.
 *
 * The whole state lives in the URL. That is what makes a particular report
 * something an operator can bookmark, or paste to somebody else, and it is what
 * lets the CSV button be a plain link to the same query — the download and the
 * page on screen cannot drift apart, because they are the same four parameters
 * read by the same parser.
 *
 * Changing a select navigates immediately. A separate "Apply" would be one more
 * click on every look, for a page whose entire job is looking.
 *
 * THE FILTERS FLOAT, as they do on every screen with a filter form (see
 * `FilterFab`): a row of five selects took the top of the page on every look.
 * What stays on the page is one line saying which report this is, and the two
 * ways out.
 */

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { FilterFab } from '@/components/ui/FilterFab';
import { Select } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { PrinterIcon } from '@/components/ui/Icon';
import { MONTH_NAMES } from '@/lib/time';
import { SHOP_TYPES, SHOP_TYPE_LABELS } from '@/lib/validators';
import { FIRST_YEAR, reportSearch, type ReportQuery } from '@/lib/report-query';

export function ReportControls({
  query,
  shops,
  latestYear,
}: {
  query: ReportQuery;
  shops: { name: string; slug: string; isDemo: boolean }[];
  latestYear: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function go(next: Partial<ReportQuery>) {
    const merged = { ...query, ...next };
    startTransition(() => router.push(`/admin/reports?${reportSearch(merged)}`));
  }

  const years: number[] = [];
  for (let year = latestYear; year >= FIRST_YEAR; year -= 1) years.push(year);

  // Which report is on screen, in words — the filters are behind the button.
  const scope = query.shopSlug
    ? (shops.find((shop) => shop.slug === query.shopSlug)?.name ?? query.shopSlug)
    : query.typeFilter === 'ALL'
      ? 'Every shop'
      : SHOP_TYPE_LABELS[query.typeFilter as keyof typeof SHOP_TYPE_LABELS];
  const monthName = MONTH_NAMES[(query.month ?? 1) - 1];
  const period =
    query.granularity === 'year'
      ? String(query.year)
      : query.granularity === 'month'
        ? `${monthName} ${query.year}`
        : `${query.day ?? 1} ${monthName} ${query.year}`;
  /** Filters that narrow the report away from "every shop". */
  const active = (query.shopSlug ? 1 : 0) + (query.typeFilter !== 'ALL' ? 1 : 0);

  return (
    <div className="no-print mb-5 rounded-2xl border border-glass-edge bg-glass px-4 py-3 shadow-raised">
      <FilterFab
        label="Filter"
        clearLabel="Clear"
        doneLabel="Done"
        active={active}
        onClear={() => go({ shopSlug: '', typeFilter: 'ALL' })}
        placement="console"
      >
        <Select label="Shop" value={query.shopSlug} onChange={(event) => go({ shopSlug: event.target.value })}>
          <option value="">Every shop (by type)</option>
          {shops.map((shop) => (
            <option key={shop.slug} value={shop.slug}>
              {shop.isDemo ? `${shop.name} (demo)` : shop.name}
            </option>
          ))}
        </Select>

        <Select
          label="Business type"
          // A named shop is its own scope. Leaving this live would offer a
          // filter that changes nothing on screen, which reads as a bug.
          disabled={query.shopSlug !== ''}
          value={query.typeFilter}
          onChange={(event) => go({ typeFilter: event.target.value as ReportQuery['typeFilter'] })}
        >
          <option value="ALL">All business types</option>
          {SHOP_TYPES.map((type) => (
            <option key={type} value={type}>
              {SHOP_TYPE_LABELS[type]}
            </option>
          ))}
        </Select>

        <Select
          label="Period"
          value={query.granularity}
          onChange={(event) => go({ granularity: event.target.value as ReportQuery['granularity'] })}
        >
          <option value="day">Daily</option>
          <option value="month">Monthly</option>
          <option value="year">Yearly</option>
        </Select>

        {query.granularity !== 'year' && (
          <Select label="Month" value={String(query.month ?? 1)} onChange={(event) => go({ month: Number(event.target.value) })}>
            {MONTH_NAMES.map((name, index) => (
              <option key={name} value={index + 1}>
                {name}
              </option>
            ))}
          </Select>
        )}

        {query.granularity === 'day' && (
          <Select label="Day" value={String(query.day ?? 1)} onChange={(event) => go({ day: Number(event.target.value) })}>
            {/* All 31, whatever the month. A short month simply reports an
                empty day, which is honest — silently clamping the 31st to the
                28th would show a different day than the one asked for. */}
            {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </Select>
        )}

        <Select label="Year" value={String(query.year)} onChange={(event) => go({ year: Number(event.target.value) })}>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </Select>
      </FilterFab>

      <div className="flex flex-wrap items-center gap-3">
        <p className="mr-auto text-sm font-semibold text-slate-900">
          {scope} · <span className="font-normal text-slate-600">{period}</span>
        </p>
        <div className="flex items-center gap-2">
          {pending && <Spinner />}
          {/* A plain link, not a fetch: the browser's own download handling is
              better than anything rebuilt with a blob, and it survives the
              file being large. */}
          <a
            href={`/api/admin/reports?${reportSearch(query)}`}
            download
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-card px-4 text-sm font-semibold text-slate-900 transition hover:bg-sunk"
          >
            Download CSV
          </a>
          <Button variant="secondary" onClick={() => window.print()}>
            <PrinterIcon className="h-4 w-4" />
            Print / PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
