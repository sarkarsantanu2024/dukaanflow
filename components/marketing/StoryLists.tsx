/**
 * The two lists that tell the story: how it works, and what it fixes.
 *
 * THEY LIVE HERE BECAUSE THEY USED TO LIVE TWICE. Both were written into the
 * pricing page, and then written again, differently, into the landing page —
 * same words out of `lib/marketing-copy.ts`, two sets of markup, two sets of
 * spacing decisions. The copy was shared and the presentation was not, which is
 * the arrangement most likely to end with two pages that look like different
 * products.
 *
 * Each takes a language rather than rendering both at once, because they are
 * meant to sit inside `LangTabs` — the reader picks. Rendering English and
 * Bengali stacked on the same card, which is what the landing page did first,
 * doubles the length of every section and leaves both readers scanning past
 * half of it.
 */

import { AlertIcon, CheckIcon } from '@/components/ui/Icon';
import { PROBLEMS, STEPS } from '@/lib/marketing-copy';

/** The numbered steps, in one language. */
export function StepList({ lang }: { lang: 'en' | 'bn' }) {
  return (
    <ol className="mt-6 grid gap-4 lg:grid-cols-2">
      {STEPS.map((step, index) => (
        <li
          key={step.en}
          className="flex gap-4 rounded-2xl border border-brand-100 bg-card p-5 shadow-raised transition hover:-translate-y-0.5 hover:shadow-float"
        >
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-base font-bold text-white shadow-raised"
          >
            {index + 1}
          </span>
          <p className="text-slate-700">{step[lang]}</p>
        </li>
      ))}
    </ol>
  );
}

/** The problem/answer pairs, in one language. */
export function ProblemList({ lang }: { lang: 'en' | 'bn' }) {
  return (
    <ul className="mt-6 grid gap-4 md:grid-cols-2">
      {PROBLEMS.map((row) => (
        <li
          key={row.problem.en}
          className="overflow-hidden rounded-2xl border border-brand-100 bg-card shadow-raised"
        >
          {/* THE TWO HALVES ARE TWO COLOURS, and they are the product's own
              two colours for exactly these meanings: red is what is wrong,
              green is what answers it. Both halves were grey-on-grey, which
              made the card one paragraph the eye slid off — a reader could not
              see at a glance that this was a before and an after.

              The complaint is the heading and the fix is the line under it,
              not the other way round. A shopkeeper scanning this page has to
              find themselves in it before any feature means anything. */}
          <div className="flex gap-3 border-l-4 border-accent-500 bg-accent-50/60 p-5">
            <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-accent-600" />
            <p className="font-semibold leading-snug text-slate-900">{row.problem[lang]}</p>
          </div>
          <div className="flex gap-3 border-l-4 border-brand-500 bg-brand-50/70 p-5">
            <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
            <p className="text-base leading-relaxed text-slate-700">{row.answer[lang]}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
