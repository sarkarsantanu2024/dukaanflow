'use client';

import clsx from 'clsx';
import { LOCALES, LOCALE_LABELS, type Locale } from '@/lib/i18n';

export function LangToggle({
  value,
  onChange,
}: {
  value: Locale;
  onChange: (locale: Locale) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Language"
      // A segmented control on a light bar, matching the one the console uses
      // for its own filters — it used to be white-on-green for a header that
      // no longer exists.
      className="inline-flex shrink-0 rounded-full bg-slate-100 p-0.5"
    >
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => onChange(locale)}
          aria-pressed={value === locale}
          className={clsx(
            'min-w-[44px] rounded-full px-3 py-1.5 text-xs font-semibold transition',
            value === locale
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800',
          )}
        >
          {LOCALE_LABELS[locale]}
        </button>
      ))}
    </div>
  );
}
