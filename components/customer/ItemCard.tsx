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
  /**
   * How many the shop has left, or null where nobody is counting — which is
   * most of a kirana's list and shows nothing at all.
   */
  stockQty: number | null;
};

/**
 * When to say how many are left.
 *
 * Only when the number is small enough to change what somebody does. "Only 2
 * left" on the last packets is useful and true; "47 left" is inventory data
 * pasted onto a shop page, and printing it beside every counted item would
 * turn a menu into a warehouse report.
 */
const SHOW_COUNT_AT_OR_BELOW = 5;

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
  const label = itemName(item, locale);
  const inBasket = quantity > 0;
  const disabled = !item.inStock;
  /**
   * What this shop can actually hand over. 99 where nobody is counting.
   *
   * Kept apart from `disabled`, which greys the whole card and prints "out of
   * stock": a basket already holding the last two packets is not an item the
   * shop has none of, and saying so would send the shopper away from something
   * they have already got.
   */
  const most = Math.min(99, item.stockQty ?? 99);
  const atMost = quantity >= most;

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
        disabled={disabled || atMost}
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
          {/* "Only 2 left" replaces the plain "In stock" when the shop is
              nearly out. It is the more useful of the two facts and takes the
              same room: a shopper reaching for three of something the shop has
              two of finds out here, rather than at checkout — or, worse, when
              the delivery arrives one short. */}
          {item.inStock && item.stockQty !== null && item.stockQty <= SHOW_COUNT_AT_OR_BELOW ? (
            <Badge tone="amber">
              {t.onlyLeft} {item.stockQty}
            </Badge>
          ) : (
            <Badge tone={item.inStock ? 'green' : 'red'}>
              {item.inStock ? t.inStock : t.outOfStock}
            </Badge>
          )}
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
          {/* The stepper stops at what the shop has.
              A counted item cannot be asked for beyond its count — the order
              route refuses it anyway, and finding that out at checkout, after
              filling in a name, a number and an address, is the worst possible
              moment to be told. Uncounted items keep the old cap of 99. */}
          <button
            type="button"
            aria-label={`+ ${label}`}
            disabled={atMost}
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
