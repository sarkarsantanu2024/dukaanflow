'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { Badge } from '@/components/ui/Badge';
import { CartIcon } from '@/components/ui/Icon';
import { formatPaise } from '@/lib/money';
import { amountLabel, isLooseUnit, MOST_PER_LINE } from '@/lib/units';
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
 * ONE CONDITION NOW, and it is the shop's own setting rather than anything the
 * customer chooses: the unit has to be a weight or a volume. A plate, a packet
 * and a bottle are handed over whole.
 *
 * There was a second condition — that nobody was counting the item — and it is
 * gone. It existed only because `stockQty` was a whole number of packs with
 * nowhere to keep the 700 g left over from selling 300 g, which meant an owner
 * who started counting their rice could no longer sell it by weight. The column
 * holds decimals now. The order route enforces exactly this same test, so a
 * card can never offer an amount the server will refuse.
 */
export function sellsAnyAmount(item: { unit: string; stockQty: number | null }): boolean {
  return isLooseUnit(item.unit);
}

export function ItemCard({
  item,
  quantity,
  onChange,
  locale,
  showStock = false,
}: {
  item: CustomerItem;
  quantity: number;
  onChange: (next: number) => void;
  locale: Locale;
  /**
   * Print the stock figure on every counted row, rather than only when it is
   * running low. For the owner's till, which is the screen they sell from —
   * see the note where the badge is drawn. Off for customers.
   */
  showStock?: boolean;
}) {
  const t = dict(locale);
  const label = itemName(item, locale);
  /**
   * What is in the quantity box while it is being typed, or null when nobody is
   * typing and it should simply show the basket's own number.
   *
   * A DRAFT IS NEEDED BECAUSE "12" IS TYPED AS "1" FIRST. Writing every
   * keystroke straight to the basket is mostly fine — a shopper who lands on 1
   * on the way to 12 has not broken anything — but an EMPTY box is not a
   * quantity at all, and reading it as zero would drop the item out of the
   * basket the moment somebody selected the number to replace it, taking the
   * box they were typing into with it.
   */
  const [draft, setDraft] = useState<string | null>(null);
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
    /* IT HAS TO LOOK LIKE SOMETHING YOU CAN TURN OFF.
       Chosen and not chosen were the same grey cart in two shades, which says
       "this one is in the basket" and says nothing at all about a second tap
       taking it out. Selected is now a filled brand tile — the shape every
       toggle on a phone uses — so the row reads as pressed rather than merely
       marked, and pressing a pressed thing is a gesture nobody has to be
       taught. */
    <span
      aria-hidden
      className={clsx(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition',
        inBasket
          ? 'bg-brand-600 text-white shadow-sm'
          : 'text-slate-300 group-hover:text-brand-600',
      )}
    >
      <CartIcon className="h-5 w-5" />
    </span>
  );

  return (
    <li
      className={clsx(
        // A column, so a weighed item's amount picker gets the card's full
        // width on its own row instead of being squeezed into the corner the
        // whole-number stepper fits in.
        'group flex flex-col gap-2 rounded-2xl border p-3 shadow-raised transition',
        disabled
          ? 'border-slate-200 bg-gradient-to-b from-slate-100 to-slate-200 opacity-60'
          : inBasket
            ? 'border-brand-400 bg-brand-50'
            : 'border-slate-300/70 bg-gradient-to-b from-card to-sunk hover:border-brand-300 hover:shadow-float',
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
        /**
         * A SECOND TAP TAKES IT BACK OUT — FOR EVERY ITEM, WEIGHED OR COUNTED.
         *
         * Tapping used to only ever add one, so an item put in the basket by
         * mistake had to be counted back down in the stepper. Tapping a row
         * that is already in the basket now clears it, which is what a tap on a
         * chosen thing means everywhere else.
         *
         * WEIGHED GOODS WERE EXCLUDED AND SHOULD NOT HAVE BEEN. The rule that
         * kept them out — "adding one more kilo to 50 g of posto is nobody's
         * intention" — was written when a tap could only ADD. It is the exact
         * opposite of true now: a second tap removes, and removing a weighed
         * item is the case that needed help most. At 1 kg the stepper takes
         * EIGHT presses to reach zero (1000 → 750 → 500 → 250 → 200 → 150 →
         * 100 → 50 → 0), so a shopper who picked the wrong sack had no way out
         * that anybody would find.
         *
         * IT CLEARS RATHER THAN DECREMENTS. Two taps to add two and a third to
         * go back to two would be a toggle that is not a toggle; "put it back"
         * is what a second tap expresses, and the stepper is still there for
         * anyone who wants a count.
         */
        disabled={disabled || (!inBasket && atMost)}
        onClick={() => onChange(inBasket ? 0 : quantity + 1)}
        aria-label={inBasket ? `${label} (${quantity})` : `${t.add} — ${label}`}
        // Says whether the thing is in the basket, which is what a second tap
        // now acts on. Cheaper and more accurate than a new label in three
        // languages, and screen readers announce the change on toggle.
        aria-pressed={inBasket}
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
          {/* AVAILABLE, OR NOT AVAILABLE — nothing else about the shelf.
              This used to read "any amount" on weighed rows, to say that the
              rate quoted is not the minimum. The owner asked for that off: it
              is a sentence about pricing in a spot where a shopper is looking
              for one thing only, whether they can have it today. The rate is
              still not the minimum — the amount picker on a weighed row opens
              on fractions, and the order route accepts them.

              Out of stock is said once, at the far end of the row (`trailing`),
              so this spot only carries the other half of the answer. Off at the
              till, where the badge below prints the count instead. */}
          {!showStock && !disabled && (
            <span className="text-xs font-medium text-emerald-600">{t.inStock}</span>
          )}
          {/* A CUSTOMER IS TOLD THE WORD, NEVER THE NUMBER.

              The word is above: available, or out of stock. The count is what
              stays off a customer's screen. "Only 1 kg left" was well meant — it
              let
              somebody reaching for three of something find out here rather than
              at checkout — but how much is on a shop's shelf is the shop's
              business, and printing it to whoever scans the QR is a running
              inventory report published to the street. The owner asked for it
              off and they are right. Nothing is lost at the till either: the
              amount picker is already capped at what the shop has (see `most`),
              so a customer cannot ask for more than exists — they simply are
              not told why.

              OUT OF STOCK IS STILL OBVIOUS, and needs no badge to be: the card
              greys out and the far end of the row reads "out of stock" — see
              `trailing`.

              THE TILL IS THE EXCEPTION. The person behind the counter sells
              from this screen, the figure moves under them all day as orders
              come in, and a row they have not counted is the one that will be
              oversold — so there, every row carries a badge. */}
          {showStock &&
            (item.stockQty === null ? (
              <Badge tone="slate">{t.notCounted}</Badge>
            ) : (
              <Badge
                tone={
                  item.stockQty <= 0
                    ? 'red'
                    : item.stockQty <= SHOW_COUNT_AT_OR_BELOW
                      ? 'amber'
                      : 'green'
                }
              >
                {/* "500 g", not "0.5". The count is a decimal in multiples of
                    the pack, and a raw one is a number nobody in this chain
                    speaks. Counted goods keep the plain number. */}
                {amountLabel(item.unit, item.stockQty) ?? item.stockQty}
              </Badge>
            ))}
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
        <div className="flex shrink-0 items-center gap-1 rounded-xl bg-card p-1 ring-1 ring-brand-200">
          <button
            type="button"
            aria-label={`− ${label}`}
            onClick={() => onChange(quantity - 1)}
            className="h-9 w-9 rounded-lg text-lg font-bold text-brand-800 transition hover:bg-brand-50"
          >
            −
          </button>
          {/* TYPED, NOT ONLY TAPPED.
              This was a read-only number, so a shopper wanting a dozen eggs
              tapped + twelve times and a shopkeeper ringing up a case of
              biscuits did the same. The count is the one thing on this row a
              customer actually knows in advance, so it takes a number.

              The − and + stay: they are faster for the ones and twos that most
              orders are, and they are the whole control on a phone where a
              numeric keyboard covering half the screen to change 2 into 3 is
              the worse trade. Typing is for when the number is large. */}
          <input
            type="text"
            inputMode="numeric"
            aria-label={`${t.amount} — ${label}`}
            value={draft ?? String(quantity)}
            onChange={(event) => {
              // Digits only: a stray "-" or "." here is a quantity nobody can
              // be sold, and stripping is kinder than an error on a box this
              // small.
              const raw = event.target.value.replace(/\D/g, '');
              setDraft(raw);
              if (raw === '') return;
              // Clamped to what the shop actually has, exactly as + is. The
              // order route refuses more anyway, and finding that out at
              // checkout — after a name, a number and an address — is the
              // worst possible moment to be told.
              onChange(Math.min(most, Number(raw)));
            }}
            onBlur={() => setDraft(null)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur();
            }}
            className="w-9 rounded-lg bg-transparent text-center font-bold tabular-nums text-slate-900 focus:bg-brand-50 focus:outline-none"
          />
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
