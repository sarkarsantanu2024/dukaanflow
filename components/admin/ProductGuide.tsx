'use client';

/**
 * The product tour: what DukaanFlow is, in the order it happens to a shop.
 *
 * Two jobs in one component, deliberately. On screen it is the reference an
 * operator reads while a shopkeeper is asking questions on the phone. Printed
 * (Ctrl-P, save as PDF) it is the deck they leave behind — the print rules in
 * globals.css already strip the console's chrome, so one page serves both and
 * there is no separate slide file to fall out of date with the product.
 *
 * Screenshots are optional by design. Each step names the file it wants in
 * `public/tour/`, and shows a labelled placeholder until that file exists, so
 * the tour is usable today and gets better one image at a time.
 */

import { useState } from 'react';
import clsx from 'clsx';
import { TOUR_ANSWERS, TOUR_STEPS, type TourStep } from '@/lib/product-tour';
import { PrinterIcon } from '@/components/ui/Icon';

const ACTOR_LABEL: Record<TourStep['actor'], string> = {
  operator: 'We do this',
  owner: 'The shopkeeper',
  customer: 'Their customer',
};

const ACTOR_TONE: Record<TourStep['actor'], string> = {
  operator: 'bg-slate-100 text-slate-700',
  owner: 'bg-brand-50 text-brand-800 ring-1 ring-brand-100',
  customer: 'bg-saffron-50 text-saffron-800 ring-1 ring-saffron-200',
};

export function ProductGuide() {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-5 shadow-card print-sheet">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto min-w-0">
          <h2 className="font-semibold text-slate-900">How DukaanFlow works</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            The tour, in the order a shopkeeper meets it. Print this as the leave-behind.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="no-print inline-flex h-9 items-center gap-1.5 rounded-lg border border-brand-200 px-3 text-sm font-semibold text-brand-800 hover:bg-brand-50"
        >
          <PrinterIcon className="h-4 w-4" />
          Print / PDF
        </button>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          className="no-print inline-flex h-9 items-center rounded-lg bg-brand-600 px-3 text-sm font-semibold text-white hover:bg-brand-700"
        >
          {open ? 'Hide tour' : 'Open tour'}
        </button>
      </div>

      {/* Collapsed on screen so the dashboard stays about the numbers, but
          always expanded in print — a deck with its slides folded away is not
          a deck. */}
      <div className={clsx(open ? 'block' : 'hidden', 'print:block')}>
        <ol className="mt-5 space-y-4">
          {TOUR_STEPS.map((step, index) => (
            <li
              key={step.id}
              className="grid gap-4 rounded-2xl border border-slate-200 p-4 sm:grid-cols-[minmax(0,1fr)_15rem]"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <h3 className="font-semibold text-slate-900">{step.title}</h3>
                  <span
                    className={clsx(
                      'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                      ACTOR_TONE[step.actor],
                    )}
                  >
                    {ACTOR_LABEL[step.actor]}
                  </span>
                </div>

                <p className="mt-2 text-sm font-medium text-brand-800">{step.point}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{step.detail}</p>
              </div>

              <Shot step={step} />
            </li>
          ))}
        </ol>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4">
          <h3 className="font-semibold text-slate-900">What they always ask</h3>
          <dl className="mt-3 space-y-3">
            {TOUR_ANSWERS.map((entry) => (
              <div key={entry.question}>
                <dt className="text-sm font-semibold text-slate-800">{entry.question}</dt>
                <dd className="mt-0.5 text-sm leading-relaxed text-slate-600">{entry.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

/**
 * The screenshot for a step, or a frame saying which one is missing.
 *
 * `onError` rather than checking the filesystem: this is a client component and
 * the file may be added at any time without a rebuild, so the browser failing
 * to load it is the only honest signal that it is not there yet.
 */
function Shot({ step }: { step: TourStep }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex min-h-[8rem] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-center">
        <p className="text-xs font-semibold text-slate-500">Screenshot missing</p>
        <p className="mt-1 break-all font-mono text-[11px] text-slate-400">
          public/tour/{step.screenshot}
        </p>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/tour/${step.screenshot}`}
      alt={step.title}
      onError={() => setFailed(true)}
      className="w-full rounded-xl object-cover ring-1 ring-slate-200"
    />
  );
}
