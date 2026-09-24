'use client';

import { LOCALES, LOCALE_LABELS, type Locale } from '@/lib/i18n';

/**
 * The customer's language switch, and it is now the owner's: one compact
 * dropdown on the green bar, in the same place and the same style.
 *
 * It was a three-button segmented control, a white pill wider than the rest of
 * the bar put together, which crowded the new bell off a small phone. The
 * owner's header already used a native select, which is also the control a
 * shopper's phone knows how to draw large and legible.
 *
 * The options carry their own colours: the closed box is white text on the
 * green bar, and an open list would otherwise inherit that white onto the
 * browser's white list.
 */
export function LangToggle({
  value,
  onChange,
}: {
  value: Locale;
  onChange: (locale: Locale) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as Locale)}
      aria-label="Language"
      className="h-8 shrink-0 cursor-pointer rounded-lg border border-white/30 bg-white/10 px-2 text-sm font-medium text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/60"
    >
      {LOCALES.map((locale) => (
        <option key={locale} value={locale} className="bg-white text-slate-900">
          {LOCALE_LABELS[locale]}
        </option>
      ))}
    </select>
  );
}
