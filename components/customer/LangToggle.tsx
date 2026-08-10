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
      className="inline-flex rounded-full bg-white/15 p-0.5 backdrop-blur"
    >
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => onChange(locale)}
          aria-pressed={value === locale}
          className={clsx(
            'min-w-[44px] rounded-full px-3 py-1 text-xs font-semibold transition',
            value === locale ? 'bg-white text-brand-700' : 'text-white/90 hover:bg-white/10',
          )}
        >
          {LOCALE_LABELS[locale]}
        </button>
      ))}
    </div>
  );
}
