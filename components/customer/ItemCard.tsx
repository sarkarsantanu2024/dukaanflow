'use client';

import clsx from 'clsx';
import { Badge } from '@/components/ui/Badge';
import { CartIcon } from '@/components/ui/Icon';
import { formatPaise } from '@/lib/money';
import type { Locale } from '@/lib/i18n';
import { dict } from '@/lib/i18n';

export type CustomerItem = {
  id: string;
  name: string;
  nameBn: string;
  nameHi: string;
  pricePaise: number;
  unit: string;
  category: string;
  inStock: boolean;
};

/**
 * The item's name in the shopper's language, falling back to the primary name.
 * A shop that only ever typed English still reads; one stocked by voice in
 * Bengali reads to a Bengali shopper in Bengali.
 */
export function itemName(item: CustomerItem, locale: Locale): string {
  if (locale === 'bn') return item.nameBn || item.name;
  if (locale === 'hi') return item.nameHi || item.name;
  return item.name;
}

/**
 * One item on the shop's menu.
 *
 * THE CARD IS NOT ONE BUTTON, and it cannot be. It was, until the stepper
 * arrived: an `<button>` cannot legally contain the − and + buttons, and
 * browsers respond to it by dropping or re-parenting the inner ones, which is
 * a bug that appears in one browser and not another.
 *
 * So the details are a button — the large, obvious target that adds one — and
 * the stepper sits beside it as its own controls. Both live inside the card,
 * which carries the highlight.
 */
export function ItemCard({
  item,
  quantity,
  onChange,
  locale,
}: {
  item: CustomerItem;
  quantity: number;
  onChange: (next: number) => void;
  locale: Locale;
}) {
  const t = dict(locale);
  const disabled = !item.inStock;
  const label = itemName(item, locale);
  const inBasket = quantity > 0;

  return (
    <li
      className={clsx(
        'group flex items-center gap-2 rounded-2xl border p-3 shadow-card transition',
        disabled
          ? 'border-slate-200 bg-white opacity-60'
          : inBasket
            ? 'border-brand-400 bg-brand-50'
            : 'border-slate-200 bg-white hover:border-brand-300 hover:shadow-md',
      )}
    >
      {/* Everything except the stepper adds one. A shopper reaches for the
          name, not for a control at the far edge of the row. */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(quantity + 1)}
        aria-label={inBasket ? `${t.add} — ${label} (${quantity})` : `${t.add} — ${label}`}
        className={clsx(
          '-m-1 min-w-0 flex-1 rounded-xl p-1 text-left transition',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
          disabled ? 'cursor-not-allowed' : 'active:scale-[0.99]',
        )}
      >
        <p className="truncate font-semibold text-slate-900">{label}</p>
        <span className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-base font-bold text-brand-700">{formatPaise(item.pricePaise)}</span>
          {item.unit && <span className="text-sm text-slate-500">/ {item.unit}</span>}
          <Badge tone={item.inStock ? 'green' : 'red'}>
            {item.inStock ? t.inStock : t.outOfStock}
          </Badge>
        </span>
      </button>

      {disabled ? (
        <span className="shrink-0 text-sm font-medium text-slate-400">{t.outOfStock}</span>
      ) : inBasket ? (
        // The same stepper the basket uses, so the two places a shopper can
        // change a quantity look and behave identically. Reaching a count of
        // three should not mean tapping Add three times and then opening the
        // basket to undo the fourth.
        <div className="flex shrink-0 items-center gap-1 rounded-xl bg-white p-1 ring-1 ring-brand-200">
          <button
            type="button"
            aria-label={`− ${label}`}
            onClick={() => onChange(quantity - 1)}
            className="h-9 w-9 rounded-lg text-lg font-bold text-brand-800 transition hover:bg-brand-50"
          >
            −
          </button>
          <span aria-live="polite" className="w-7 text-center font-bold tabular-nums text-slate-900">
            {quantity}
          </span>
          <button
            type="button"
            aria-label={`+ ${label}`}
            disabled={quantity >= 99}
            onClick={() => onChange(quantity + 1)}
            className="h-9 w-9 rounded-lg text-lg font-bold text-brand-800 transition hover:bg-brand-50 disabled:opacity-40"
          >
            +
          </button>
        </div>
      ) : (
        // A bare basket with no button around it: the card beside it is
        // already the target, and a filled pill here advertised a second one.
        <span
          aria-hidden
          className="shrink-0 pr-1 text-slate-300 transition group-hover:text-brand-600"
        >
          <CartIcon className="h-6 w-6" />
        </span>
      )}
    </li>
  );
}
