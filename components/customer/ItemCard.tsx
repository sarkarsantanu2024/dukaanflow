'use client';

import clsx from 'clsx';
import { Badge } from '@/components/ui/Badge';
import { CartIcon } from '@/components/ui/Icon';
import { formatPaise } from '@/lib/money';
import { isLooseUnit, MOST_PER_LINE } from '@/lib/units';
import { AmountStepper } from './AmountStepper';
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
 * THE CARD IS NOT ONE BUTTON, and it cannot be. An `<button>` cannot legally
 * contain the stepper's − and + buttons; browsers respond by dropping or
 * re-parenting the inner ones, which is a bug that appears in one browser and
 * not another.
 *
 * But that is only a constraint WHILE THE STEPPER IS THERE, and most of the
 * time it is not. So the tap target is as big as the card allows: everything
 * on the row — the name, the price, the badge and the basket icon at the far
 * edge — is one button, and only when a stepper has to appear does that button
 * give up the corner it needs. Anything less means an owner ringing up a sale
 * at arm's length taps the right-hand end of a card and nothing happens.
 */
/**
 * Can this item be sold in any amount the customer asks for?
 *
 * Two conditions, and both are the shop's own settings rather than anything the
 * customer chooses. The unit has to be a weight or a volume — a plate, a packet
 * and a bottle are handed over whole — and nobody can be counting it, because a
 * count is a whole number of packs with nowhere to keep the 700 g left over
 * from selling 300 g. The order route enforces exactly this test, so a card can
 * never offer an amount the server will refuse.
 */
export function sellsAnyAmount(item: { unit: string; stockQty: number | null }): boolean {
  return isLooseUnit(item.unit) && item.stockQty === null;
}

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
  const loose = sellsAnyAmount(item);
  /**
   * What this shop can actually hand over. 99 where nobody is counting.
   *
   * Kept apart from `disabled`, which greys the whole card and prints "out of
   * stock": a basket already holding the last two packets is not an item the
   * shop has none of, and saying so would send the shopper away from something
   * they have already got.
   */
  const most = Math.min(MOST_PER_LINE, item.stockQty ?? MOST_PER_LINE);
  const atMost = quantity >= most;

  /**
   * Is the stepper on this row?
   *
   * The one case that stops the row being a single button — see the note above
   * the component. A weighed item in the basket is changed on its own row
   * underneath, so it does not count.
   */
  const showStepper = !disabled && inBasket && !loose;

  /**
   * What sits at the right-hand end of the row, when the stepper does not.
   *
   * Rendered INSIDE the button rather than beside it, so the corner of the card
   * adds an item like the rest of it does.
   */
  const trailing = disabled ? (
    <span className="shrink-0 text-sm font-medium text-slate-400">{t.outOfStock}</span>
  ) : (
    // A bare basket with no button around it: the row it sits in is already the
    // target, and a filled pill here advertised a second one.
    <span
      aria-hidden
      className={clsx(
        'shrink-0 pr-1 transition',
        inBasket ? 'text-brand-600' : 'text-slate-300 group-hover:text-brand-600',
      )}
    >
      <CartIcon className="h-6 w-6" />
    </span>
  );

  return (
    <li
      className={clsx(
        // A column, so a weighed item's amount picker gets the card's full
        // width on its own row instead of being squeezed into the corner the
        // whole-number stepper fits in.
        'group flex flex-col gap-2 rounded-2xl border p-3 shadow-card transition',
        disabled
          ? 'border-slate-200 bg-white opacity-60'
          : inBasket
            ? 'border-brand-400 bg-brand-50'
            : 'border-slate-200 bg-white hover:border-brand-300 hover:shadow-md',
      )}
    >
      <div className="flex items-center gap-2">
      {/* The whole row adds one, right out to the basket icon at its end —
          only a stepper, when there is one, keeps its own corner. */}
      <button
        type="button"
        /**
         * A weighed item already in the basket is changed by its amount row,
         * not by tapping the card again: adding "one more kilo" to 50 g of
         * posto is nobody's intention, and 1.05 kg is what that tap would
         * produce. The first tap still adds one of whatever the price quotes,
         * which is the amount the shopper has just read.
         */
        disabled={disabled || atMost || (inBasket && loose)}
        onClick={() => onChange(quantity + 1)}
        aria-label={inBasket ? `${t.add} — ${label} (${quantity})` : `${t.add} — ${label}`}
        className={clsx(
          // Stretches across the whole row and swallows the card's own padding,
          // so the tap target reaches the edges rather than stopping at the
          // text — the difference between a card that responds and one that
          // seems broken when tapped anywhere but the name.
          '-m-1 flex min-w-0 flex-1 items-center gap-2 rounded-xl p-1 text-left transition',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
          disabled ? 'cursor-not-allowed' : 'active:scale-[0.99]',
        )}
      >
        <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-slate-900">{label}</span>
        <span className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-base font-bold text-brand-700">{formatPaise(item.pricePaise)}</span>
          {item.unit && <span className="text-sm text-slate-500">/ {item.unit}</span>}
          {/* THE RATE IS NOT THE MINIMUM, and the card has to say so before
              the shopper decides they cannot afford ₹1,500 of poppy seeds.
              Only where it is true: a plate or a bottle really is sold
              whole. */}
          {loose && !disabled && <span className="text-xs text-slate-400">· {t.anyAmount}</span>}
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
        </span>

        {/* The far end of the row, inside the target rather than beside it. */}
        {!showStepper && trailing}
      </button>

      {showStepper && (
        // The same stepper the basket uses, so the two places a shopper can
        // change a quantity look and behave identically. Reaching a count of
        // three should not mean tapping Add three times and then opening the
        // basket to undo the fourth.
        //
        // The one thing that cannot live inside the button above — buttons do
        // not nest — so it is the one case where the row's right-hand corner
        // does something other than add.
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
      )}
      </div>

      {/* SOLD BY WEIGHT, SO CHOSEN BY WEIGHT.
          Its own row, full width, because this is a stepper, a typed amount,
          a price and a row of common amounts — none of which fits in the
          corner a +/− counter occupies. */}
      {!disabled && inBasket && loose && (
        <AmountStepper
          unit={item.unit}
          pricePaise={item.pricePaise}
          quantity={quantity}
          onChange={onChange}
          locale={locale}
        />
      )}
    </li>
  );
}
