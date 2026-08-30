'use client';

/**
 * One shop's sales report, downloadable from the card.
 *
 * The Reports page can already produce this, but getting there means leaving
 * the list, choosing the shop out of a select, choosing a period, and coming
 * back — four steps for the question an operator asks while looking straight at
 * the shop: "what did they take?"
 *
 * Every entry is a plain `<a download>` to the same endpoint the Reports page
 * links to, with the same query string built by the same `reportSearch`. The
 * download and the page can therefore never disagree about what a period means,
 * and the browser's own download handling beats anything rebuilt with a blob.
 *
 * The CSV carries the whole analysis — takings, best sellers, payment modes
 * (cash, UPI, khata) and the credit book, name by name — so there is one file
 * to send an owner rather than a menu of half-reports.
 */

import { useState } from 'react';
import { DownloadIcon } from '@/components/ui/Icon';
import { shopClock } from '@/lib/time';
import { reportSearch } from '@/lib/report-query';

export function ShopReportMenu({ slug, shopName }: { slug: string; shopName: string }) {
  const [open, setOpen] = useState(false);

  // The shop's own clock decides which day "today" is — the console is one
  // operator's screen and the shops are all in India, so a laptop set to
  // another timezone must not offer yesterday's takings as today's.
  //
  // Nothing derived from it reaches the DOM until the menu is opened, so a
  // render that straddles midnight cannot produce a hydration mismatch.
  const today = shopClock(new Date());

  const base = { shopSlug: slug, typeFilter: 'ALL' as const };
  const entries = [
    {
      label: 'Today',
      hint: `${today.day}/${today.month}/${today.year}`,
      search: reportSearch({
        ...base,
        granularity: 'day',
        year: today.year,
        month: today.month,
        day: today.day,
      }),
    },
    {
      label: 'This month',
      hint: `${today.month}/${today.year}`,
      search: reportSearch({
        ...base,
        granularity: 'month',
        year: today.year,
        month: today.month,
        day: null,
      }),
    },
    {
      label: 'This year',
      hint: String(today.year),
      search: reportSearch({
        ...base,
        granularity: 'year',
        year: today.year,
        month: null,
        day: null,
      }),
    },
  ];

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={`Download a sales report for ${shopName}`}
        title="Sales report"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
      >
        <DownloadIcon className="h-4 w-4" />
      </button>

      {open && (
        <>
          {/* A full-screen catcher rather than a document listener: one element,
              no cleanup to forget, and a tap anywhere else closes the menu
              before it reaches whatever was underneath. */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />

          <div
            role="menu"
            className="absolute bottom-full right-0 z-50 mb-1 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
          >
            <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Sales report (CSV)
            </p>
            {entries.map((entry) => (
              <a
                key={entry.label}
                role="menuitem"
                href={`/api/admin/reports?${entry.search}`}
                download
                onClick={() => setOpen(false)}
                className="flex items-baseline justify-between gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-800"
              >
                {entry.label}
                <span className="text-xs tabular-nums text-slate-400">{entry.hint}</span>
              </a>
            ))}

            {/* Any other period, on the page built for it. Three presets cover
                what an operator asks for on the spot; a fourth control here
                would rebuild the Reports page inside a dropdown. */}
            <a
              role="menuitem"
              href={`/admin/reports?${entries[1].search}`}
              onClick={() => setOpen(false)}
              className="block border-t border-slate-100 px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            >
              Another period…
            </a>
          </div>
        </>
      )}
    </span>
  );
}
