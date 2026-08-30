'use client';

/**
 * The basket, as one floating button.
 *
 * This was a full-width bar pinned across the foot of the page carrying a
 * count, a total and a Continue button. It cost a strip of every screen, and it
 * duplicated the drawer: two places showing the same total, two routes to
 * checkout, and the menu shortened by both.
 *
 * It then carried "2 items / ₹80" as text, which made it three times the width
 * of the round buttons beside it and pushed the floating row across another
 * column of the menu. The count lives on the badge and the total is one tap
 * away inside the basket; neither was worth covering an item to say twice.
 */

import { formatPaise } from '@/lib/money';
import { dict, type Locale } from '@/lib/i18n';
import { CartIcon } from '@/components/ui/Icon';

export function CartBar({
  totalItems,
  totalAmountPaise,
  onReview,
  locale,
}: {
  totalItems: number;
  totalAmountPaise: number;
  /** Opens the basket. The only thing this button does. */
  onReview: () => void;
  locale: Locale;
}) {
  const t = dict(locale);
  if (totalItems === 0) return null;

  // No positioning of its own: it is one item in the storefront's floating
  // row, and three separately-fixed elements in one corner would each have to
  // know the others' sizes.
  return (
    <button
      type="button"
      onClick={onReview}
      // The figures still reach anyone who cannot read the badge.
      aria-label={`${t.cartReview} — ${totalItems} ${t.items}, ${formatPaise(totalAmountPaise)}`}
      className="pointer-events-auto relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white shadow-lg shadow-brand-900/30 ring-4 ring-slate-100/70 transition hover:bg-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 active:scale-95"
    >
      <CartIcon className="h-6 w-6" />
      <span className="absolute -right-1 -top-1 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-white px-1 text-xs font-bold tabular-nums text-brand-800 ring-2 ring-brand-700">
        {totalItems}
      </span>
    </button>
  );
}
