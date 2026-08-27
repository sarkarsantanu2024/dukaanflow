'use client';

import { formatRupees } from '@/lib/money';
import { dict, type Locale } from '@/lib/i18n';

export function CartBar({
  totalItems,
  totalAmount,
  onContinue,
  locale,
}: {
  totalItems: number;
  totalAmount: number;
  onContinue: () => void;
  locale: Locale;
}) {
  const t = dict(locale);
  if (totalItems === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-sheet backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-1">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-500">
            {totalItems} {t.items}
          </p>
          <p className="text-xl font-bold text-slate-900">{formatRupees(totalAmount)}</p>
        </div>
        <button
          type="button"
          onClick={onContinue}
          className="h-12 rounded-xl bg-brand-600 px-6 text-base font-semibold text-white transition hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          {t.continue} →
        </button>
      </div>
    </div>
  );
}
