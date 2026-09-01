'use client';

/**
 * Choosing HOW MUCH, not how many.
 *
 * A kirana prices posto at ₹1,500 a kilo and sells fifty grams of it; it prices
 * rice at ₹55 a kilo and sells five kilos. Both are the same item shape — a
 * price and a unit — and until now the only control over either was a +/−
 * counter of whole packs, so the posto customer could be offered ₹1,500 or
 * nothing. That is not a rounding problem, it is the shop being unable to sell
 * what it sells.
 *
 * So for anything weighed or poured, this replaces the counter: chips for the
 * amounts people ask for out loud, a stepper that moves by a sensible step for
 * the size of the pile, and the amount itself always on screen in grams or
 * kilos — never as the fraction of a pack that is stored underneath.
 *
 * Counted goods — a plate, a packet, a bottle, a piece — keep the whole-number
 * counter, because 0.4 of a bottle is not something a shop can hand over. The
 * caller decides which control to show; this one is only for the divisible kind.
 */

import { useState } from 'react';
import clsx from 'clsx';
import { formatPaise, linePaise } from '@/lib/money';
import {
  MIN_LOOSE_BASE,
  baseFromQuantity,
  baseLabel,
  presetBases,
  quantityFromBase,
  stepBase,
} from '@/lib/units';
import { dict, type Locale } from '@/lib/i18n';

/** The most of one item anybody may order — mirrors the server's cap. */
const MOST_PACKS = 99;

export function AmountStepper({
  unit,
  pricePaise,
  quantity,
  onChange,
  locale,
  /** A compact form for the basket, where the price is already printed above. */
  compact = false,
}: {
  unit: string;
  pricePaise: number;
  /** Multiples of `unit`. 0.05 of a "1 kg" is fifty grams. */
  quantity: number;
  onChange: (next: number) => void;
  locale: Locale;
  compact?: boolean;
}) {
  const t = dict(locale);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState('');

  const base = baseFromQuantity(unit, quantity);
  const presets = presetBases(unit);
  const step = stepBase(unit, base);
  const most = baseFromQuantity(unit, MOST_PACKS);

  function setBase(next: number) {
    // Clamped rather than refused: a shopper holding + down has said "more",
    // and stopping at the cap is the answer to that, not an error.
    const clamped = Math.min(Math.max(next, 0), most);
    onChange(clamped <= 0 ? 0 : quantityFromBase(unit, clamped));
  }

  function commitTyped() {
    const typed = Number(draft.replace(/[^\d.]/g, ''));
    setTyping(false);
    setDraft('');
    if (!Number.isFinite(typed) || typed <= 0) return;
    // Typed in the unit on screen — grams for a mass item under a kilo, and
    // for one over it too: "1500" is a kilo and a half, which is what somebody
    // typing into a box beside "g" means.
    setBase(Math.max(typed, MIN_LOOSE_BASE));
  }

  return (
    <div className={clsx('w-full', compact ? 'space-y-2' : 'space-y-2')}>
      {/* THE AMOUNT, IN WORDS THE SHOPPER USED. The stored quantity is a
          fraction of a pack and no shopper should ever see it. */}
      <div className="flex items-center gap-1 rounded-xl bg-white p-1 ring-1 ring-brand-200">
        <button
          type="button"
          aria-label={`− ${t.amount}`}
          onClick={() => setBase(base - step)}
          className="h-9 w-9 shrink-0 rounded-lg text-lg font-bold text-brand-800 transition hover:bg-brand-50"
        >
          −
        </button>

        {typing ? (
          <input
            autoFocus
            type="number"
            inputMode="decimal"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commitTyped}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commitTyped();
              if (event.key === 'Escape') {
                setTyping(false);
                setDraft('');
              }
            }}
            aria-label={t.amount}
            className="min-w-0 flex-1 rounded-lg border border-brand-300 px-2 py-1 text-center text-sm font-bold tabular-nums"
          />
        ) : (
          // Tapping the amount lets it be typed. A shopper who wants 80 g of
          // jeera should not have to find it with a stepper, and the presets
          // cannot hold every amount a market asks for.
          <button
            type="button"
            onClick={() => {
              setTyping(true);
              setDraft(String(base));
            }}
            aria-live="polite"
            className="min-w-0 flex-1 rounded-lg px-1 py-1 text-center text-sm font-bold tabular-nums text-slate-900 underline decoration-dotted decoration-slate-300 underline-offset-4"
          >
            {baseLabel(unit, base)}
          </button>
        )}

        <button
          type="button"
          aria-label={`+ ${t.amount}`}
          disabled={base >= most}
          onClick={() => setBase(base + step)}
          className="h-9 w-9 shrink-0 rounded-lg text-lg font-bold text-brand-800 transition hover:bg-brand-50 disabled:opacity-40"
        >
          +
        </button>
      </div>

      {/* What this amount costs, at the shop's own rate. The whole reason a
          fractional amount is safe to offer: the shopper can see that fifty
          grams of ₹1,500 posto is ₹75 before they order it. */}
      <p className="text-xs text-slate-500">
        {baseLabel(unit, base)} · {formatPaise(linePaise(pricePaise, quantity))}
      </p>

      {!compact && presets.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setBase(preset)}
              aria-pressed={Math.abs(preset - base) < 0.001}
              className={clsx(
                'rounded-full px-2.5 py-1 text-xs font-medium transition',
                Math.abs(preset - base) < 0.001
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50',
              )}
            >
              {baseLabel(unit, preset)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
