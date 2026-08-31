'use client';

/**
 * What was earned, by month and by year.
 *
 * Subscription and listing income are shown as separate columns rather than one
 * total, because they behave differently: subscription money repeats next month
 * on its own, listing money only repeats if somebody does the work again. A
 * single figure would let a strong month of one-off cataloguing read as growth.
 *
 * The bar under each month is drawn against the best month in view, not against
 * a fixed scale — the question this page is actually asked is "is it going up",
 * and a relative bar answers that at a glance where a column of rupees does not.
 */

import { useState } from 'react';
import clsx from 'clsx';
import { formatPaise } from '@/lib/money';
import type { EarningsBucket } from '@/lib/earnings';

export function EarningsTable({
  months,
  years,
}: {
  months: EarningsBucket[];
  years: EarningsBucket[];
}) {
  const [view, setView] = useState<'months' | 'years'>('months');
  const rows = view === 'months' ? months : years;
  const peak = Math.max(1, ...rows.map((row) => row.totalPaise));

  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-5 shadow-card">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="mr-auto font-semibold text-slate-900">Earnings</h2>
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {(['months', 'years'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setView(option)}
              aria-pressed={view === option}
              className={clsx(
                'rounded-lg px-3 py-1.5 text-sm font-semibold capitalize transition',
                view === option
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          No payments recorded yet. The first one a shop makes shows up here.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="pb-2 pr-3">{view === 'months' ? 'Month' : 'Year'}</th>
                <th className="pb-2 pr-3 text-right">Subscriptions</th>
                <th className="pb-2 pr-3 text-right">Listing</th>
                <th className="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={`${row.year}-${row.month ?? 'y'}`}>
                  <td className="py-2 pr-3">
                    <span className="block font-medium text-slate-800">{row.label}</span>
                    <span className="mt-1 block h-1.5 w-full max-w-[8rem] overflow-hidden rounded-full bg-slate-100">
                      <span
                        className="block h-full rounded-full bg-brand-500"
                        style={{ width: `${Math.max(2, (row.totalPaise / peak) * 100)}%` }}
                      />
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums text-slate-600">
                    {formatPaise(row.subscriptionPaise)}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums text-slate-700">
                    {row.listingPaise > 0 ? formatPaise(row.listingPaise) : '—'}
                  </td>
                  <td className="py-2 text-right font-semibold tabular-nums text-slate-900">
                    {formatPaise(row.totalPaise)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
