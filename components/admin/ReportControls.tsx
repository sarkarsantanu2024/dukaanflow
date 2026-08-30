'use client';

/**
 * The one row of filters above the report, plus the two ways out of it.
 *
 * The whole state lives in the URL. That is what makes a particular report
 * something an operator can bookmark, or paste to somebody else, and it is what
 * lets the CSV button be a plain link to the same query — the download and the
 * page on screen cannot drift apart, because they are the same four parameters
 * read by the same parser.
 *
 * Changing a select navigates immediately. A separate "Apply" would be one more
 * click on every look, for a page whose entire job is looking.
 */

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@/components/ui/Button';
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

  return (
    <div className="no-print mb-5 rounded-2xl bg-white px-4 py-4 shadow-card">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-56">
          <Select
            label="Shop"
            value={query.shopSlug}
            onChange={(event) => go({ shopSlug: event.target.value })}
          >
            <option value="">Every shop (by type)</option>
            {shops.map((shop) => (
              <option key={shop.slug} value={shop.slug}>
                {shop.isDemo ? `${shop.name} (demo)` : shop.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-full sm:w-56">
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
        </div>

        <div className="w-full sm:w-36">
          <Select
            label="Period"
            value={query.granularity}
            onChange={(event) =>
              go({ granularity: event.target.value as ReportQuery['granularity'] })
            }
          >
            <option value="day">Daily</option>
            <option value="month">Monthly</option>
            <option value="year">Yearly</option>
          </Select>
        </div>

        {query.granularity !== 'year' && (
          <div className="w-full sm:w-40">
            <Select
              label="Month"
              value={String(query.month ?? 1)}
              onChange={(event) => go({ month: Number(event.target.value) })}
            >
              {MONTH_NAMES.map((name, index) => (
                <option key={name} value={index + 1}>
                  {name}
                </option>
              ))}
            </Select>
          </div>
        )}

        {query.granularity === 'day' && (
          <div className="w-full sm:w-24">
            <Select
              label="Day"
              value={String(query.day ?? 1)}
              onChange={(event) => go({ day: Number(event.target.value) })}
            >
              {/* All 31, whatever the month. A short month simply reports an
                  empty day, which is honest — silently clamping the 31st to the
                  28th would show a different day than the one asked for. */}
              {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="w-full sm:w-28">
          <Select
            label="Year"
            value={String(query.year)}
            onChange={(event) => go({ year: Number(event.target.value) })}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </Select>
        </div>

        <div className="ml-auto flex items-center gap-2 pb-0.5">
          {pending && <Spinner />}
          {/* A plain link, not a fetch: the browser's own download handling is
              better than anything rebuilt with a blob, and it survives the
              file being large. */}
          <a
            href={`/api/admin/reports?${reportSearch(query)}`}
            download
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
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
