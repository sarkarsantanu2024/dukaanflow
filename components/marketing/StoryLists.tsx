/**
 * The getting-started steps, as an infographic.
 *
 * Four numbered icon circles joined by a line: left to right across a wide
 * screen, top to bottom as a timeline on a phone. The line runs from the
 * logo's green into its red, so the journey reads as one path from "contact
 * us" to "selling". Words come from `STEPS` in `lib/marketing-copy.ts`, in all
 * three languages via `Say`.
 */

import clsx from 'clsx';
import { BoxIcon, QrIcon, RupeeIcon, WhatsAppIcon } from '@/components/ui/Icon';
import { STEPS } from '@/lib/marketing-copy';
import { Say } from './Say';

/** One icon per step, in `STEPS` order. */
const STEP_ICONS = [WhatsAppIcon, QrIcon, BoxIcon, RupeeIcon];

export function StepList() {
  return (
    <ol className="relative grid gap-10 lg:grid-cols-4 lg:gap-8">
      {/* The path joining the circles: across on a wide screen, down on a
          phone. Drawn once behind all four, through the circles' centres. */}
      <span
        aria-hidden
        className="absolute left-[12.5%] top-9 hidden h-1 w-3/4 rounded-full bg-gradient-to-r from-brand-500 via-brand-400 to-accent-500 lg:block"
      />
      {STEPS.map((step, index) => {
        const Icon = STEP_ICONS[index] ?? BoxIcon;
        const last = index === STEPS.length - 1;
        return (
          <li key={step.title.en} className="relative flex gap-5 lg:flex-col lg:items-center lg:gap-0 lg:text-center">
            {/* On a phone, each step draws its own line down to the next one,
                so the path ends exactly at the last circle. */}
            {!last && (
              <span
                aria-hidden
                className={clsx(
                  'absolute left-[2.125rem] top-[4.5rem] -bottom-10 w-1 rounded-full lg:hidden',
                  index === STEPS.length - 2 ? 'bg-gradient-to-b from-brand-500 to-accent-500' : 'bg-brand-500',
                )}
              />
            )}
            <div className="relative shrink-0">
              <span
                className={clsx(
                  'relative z-10 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full text-white shadow-float ring-8 ring-card',
                  last ? 'bg-accent-600' : 'bg-brand-600',
                )}
              >
                <Icon className="h-8 w-8" />
              </span>
              <span className="absolute -right-1 -top-1 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white ring-4 ring-card">
                {index + 1}
              </span>
            </div>
            <div className="pt-2 lg:mt-5 lg:max-w-[17rem] lg:pt-0">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent-600">
                <Say
                  en={`Step ${index + 1}`}
                  bn={`ধাপ ${index + 1}`}
                  hi={`चरण ${index + 1}`}
                />
              </p>
              <h3 className="mt-1 text-xl font-bold text-slate-900">
                <Say t={step.title} />
              </h3>
              <p className="mt-2 text-base leading-relaxed text-slate-600">
                <Say t={step.body} />
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
