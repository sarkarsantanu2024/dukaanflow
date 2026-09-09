'use client';

/**
 * WHAT CAME IN, AND IN WHAT FORM.
 *
 * The closing question, and until now the app could not answer it: an owner
 * could see that the day took ₹3,240 and had no way to know how much of that
 * was cash in the drawer, how much had gone to the phone, and how much had
 * walked out of the shop on credit.
 *
 * THREE FIGURES AND A TOTAL, and the three add up to the total exactly. That is
 * the whole design constraint. A closing figure that does not reconcile is
 * worse than no closing figure, because the shopkeeper spends the evening
 * hunting for the difference — so anything that is NOT settled money is held
 * out below the line and labelled, rather than quietly folded in.
 *
 * Today and this month, because those are the two questions actually asked —
 * one at closing, one when the rent is due. Anything finer belongs in the
 * spreadsheet the khata already exports.
 */

import { useState } from 'react';
import clsx from 'clsx';
import { formatPaise } from '@/lib/money';
import { ownerDict } from '@/lib/owner-i18n';
import type { Locale } from '@/lib/i18n';
import type { Drawer, Takings } from '@/lib/takings';
import { DrawerPanel } from './DrawerPanel';

type Period = 'today' | 'month';

export function TakingsPanel({
  slug,
  today,
  month,
  drawer,
  locale,
}: {
  slug: string;
  today: Takings;
  month: Takings;
  /**
   * Today's cash drawer, or null before the owner has typed the opening float.
   *
   * Only ever shown under "today". A month has no drawer — it has thirty of
   * them — and a reconciliation offered against a month's cash sales would be
   * a number that can never balance.
   */
  drawer: Drawer | null;
  locale: Locale;
}) {
  const t = ownerDict(locale);
  const [period, setPeriod] = useState<Period>('today');
  const figures = period === 'today' ? today : month;

  /**
   * The three ways money is taken.
   *
   * Colour carries the meaning at a glance, and the meaning is not "good and
   * bad" — it is where the money IS. Cash and UPI are money the shop has;
   * credit is money it does not, which is why that row is amber wherever it
   * appears in this app.
   */
  const rows: { label: string; paise: number; count: number; tone: string }[] = [
    { label: t.takingsCash, paise: figures.cashPaise, count: figures.cashCount, tone: 'text-slate-900' },
    { label: t.takingsUpi, paise: figures.upiPaise, count: figures.upiCount, tone: 'text-slate-900' },
    {
      label: t.takingsKhata,
      paise: figures.khataPaise,
      count: figures.khataCount,
      tone: 'text-amber-700',
    },
  ];

  return (
    <div className="space-y-3">
      {/* THE DRAWER COMES FIRST, and before anything else on the first morning.
          Until the float is in, the reckoning below is the only thing this
          screen can honestly show — so the ask sits at the top, where an owner
          opening up meets it, rather than under a table they have not read
          yet. */}
      {period === 'today' && <DrawerPanel slug={slug} drawer={drawer} locale={locale} />}

      {/* Two periods, as a switch rather than a date picker: a shopkeeper
          closing up has one question, and a calendar is four taps of answering
          a question they did not ask. */}
      <div className="flex gap-2">
        {(
          [
            { id: 'today' as const, label: t.takingsToday },
            { id: 'month' as const, label: t.takingsMonth },
          ]
        ).map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setPeriod(option.id)}
            aria-pressed={period === option.id}
            className={clsx(
              'h-10 flex-1 rounded-xl text-sm font-semibold transition',
              period === option.id
                ? 'bg-brand-600 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-card">
        <p className="text-sm text-slate-500">{t.takingsTotal}</p>
        <p className="text-3xl font-bold tabular-nums text-slate-900">
          {formatPaise(figures.totalPaise)}
        </p>

        {figures.totalPaise === 0 && figures.pendingPaise === 0 ? (
          <p className="mt-3 text-sm text-slate-500">{t.takingsNothing}</p>
        ) : (
          <dl className="mt-3 divide-y divide-slate-100 border-t border-slate-100">
            {rows.map((row) => (
              <div key={row.label} className="flex items-baseline justify-between gap-3 py-2.5">
                <dt className="flex items-baseline gap-2 text-sm text-slate-600">
                  {row.label}
                  {/* How many transactions made the figure. It is the check an
                      owner actually performs — "seven cash sales, that sounds
                      about right" — and it costs nothing to print. */}
                  {row.count > 0 && (
                    <span className="text-xs tabular-nums text-slate-400">{row.count}</span>
                  )}
                </dt>
                <dd className={clsx('font-semibold tabular-nums', row.tone)}>
                  {formatPaise(row.paise)}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {/* BELOW THE LINE, AND DELIBERATELY NOT IN THE TOTAL.
          Both of these are real money and neither belongs in "what the shop
          sold in this period": an unfinished order has taken nothing yet, and a
          repayment is an old sale being settled, not a new one. Adding either
          in would break the one promise the panel above makes — that its three
          figures come to its total. */}
      {(figures.pendingPaise > 0 || figures.khataCollectedPaise > 0) && (
        <div className="space-y-2 rounded-2xl border border-dashed border-slate-300 bg-white p-4">
          {figures.khataCollectedPaise > 0 && (
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm text-slate-600">{t.takingsCollected}</p>
              <p className="font-semibold tabular-nums text-brand-700">
                {formatPaise(figures.khataCollectedPaise)}
              </p>
            </div>
          )}

          {figures.pendingPaise > 0 && (
            <div>
              <div className="flex items-baseline justify-between gap-3">
                <p className="flex items-baseline gap-2 text-sm text-slate-600">
                  {t.takingsPending}
                  <span className="text-xs tabular-nums text-slate-400">
                    {figures.pendingCount}
                  </span>
                </p>
                <p className="font-semibold tabular-nums text-slate-500">
                  {formatPaise(figures.pendingPaise)}
                </p>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">{t.takingsPendingHint}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
