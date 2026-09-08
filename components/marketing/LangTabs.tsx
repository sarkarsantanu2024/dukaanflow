'use client';

/**
 * Two tabs — English and বাংলা — over the same section of the pricing page.
 *
 * The audience for this page is split in a way a single language cannot serve.
 * The person who decides is often a son or a nephew who reads English; the
 * person who will stand behind the counter using it reads Bengali, and is the
 * one who has to believe the claims. Translating the page wholesale would mean
 * choosing which of them it is for, and picking by browser language would mean
 * guessing — on a shared phone, wrongly.
 *
 * So both are on the page and the reader chooses. It also makes the page
 * something a field agent can hold up and turn around mid-sentence.
 *
 * BOTH PANELS ARE RENDERED, one hidden. Swapping them on click would leave the
 * Bengali out of the HTML a crawler reads and out of a browser's find-in-page,
 * and the text is short enough that keeping both costs nothing.
 */

import { useId, useState } from 'react';
import clsx from 'clsx';

type Lang = 'en' | 'bn';

const LABELS: Record<Lang, string> = { en: 'English', bn: 'বাংলা' };

export function LangTabs({
  en,
  bn,
  className,
}: {
  en: React.ReactNode;
  bn: React.ReactNode;
  className?: string;
}) {
  const [lang, setLang] = useState<Lang>('en');
  // Unique per instance: the page has two of these, and duplicate ids would
  // point every tab at the first section's panels.
  const base = useId();

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label="Language"
        className="inline-flex rounded-xl bg-slate-200/70 p-1"
      >
        {(['en', 'bn'] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            id={`${base}-tab-${option}`}
            aria-selected={lang === option}
            aria-controls={`${base}-panel-${option}`}
            onClick={() => setLang(option)}
            className={clsx(
              'rounded-lg px-4 py-1.5 text-sm font-semibold transition',
              lang === option
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900',
            )}
          >
            {LABELS[option]}
          </button>
        ))}
      </div>

      {(['en', 'bn'] as const).map((option) => (
        <div
          key={option}
          role="tabpanel"
          id={`${base}-panel-${option}`}
          aria-labelledby={`${base}-tab-${option}`}
          hidden={lang !== option}
          // Bengali renders taller than English at the same size; without this
          // the page jumps under the reader's thumb when they switch.
          lang={option === 'bn' ? 'bn' : 'en'}
        >
          {option === 'en' ? en : bn}
        </div>
      ))}
    </div>
  );
}
