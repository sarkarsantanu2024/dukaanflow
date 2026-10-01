'use client';

/**
 * "Same as last time."
 *
 * How a kirana actually works: the customer wants the same four things they
 * bought on Tuesday, and rebuilding that basket by hand is the friction that
 * stops them ordering at all. One tap refills it.
 *
 * The last order is kept in this browser's own storage rather than looked up
 * on the server. The customer page has no login and asking for a phone number
 * before showing anything would cost more orders than it saves — and a
 * shopper's basket history is nobody's business but theirs.
 */

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { formatPaise, linePaise } from '@/lib/money';
import { amountLabel, localUnit } from '@/lib/units';
import { dict, type Locale } from '@/lib/i18n';
import type { CustomerItem } from './ItemCard';
import { itemName } from './ItemCard';
import { CloseIcon } from '@/components/ui/Icon';

const KEY = 'halkhata:last-order';

type StoredOrder = { slug: string; at: number; lines: { id: string; quantity: number }[] };

/** Remembers what was just ordered, for the next visit. */
export function rememberOrder(slug: string, cart: Record<string, number>): void {
  const lines = Object.entries(cart)
    .filter(([, quantity]) => quantity > 0)
    .map(([id, quantity]) => ({ id, quantity }));
  if (lines.length === 0) return;

  try {
    window.localStorage.setItem(KEY, JSON.stringify({ slug, at: Date.now(), lines } as StoredOrder));
  } catch {
    // Private windows refuse storage; the shop still works without this.
  }
}

export function RepeatOrder({
  slug,
  items,
  locale,
  onRepeat,
}: {
  slug: string;
  items: CustomerItem[];
  locale: Locale;
  onRepeat: (lines: { id: string; quantity: number }[]) => void;
}) {
  const t = dict(locale);
  const [order, setOrder] = useState<StoredOrder | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredOrder;
      // Only this shop, and only while it is still plausibly "last time".
      const fresh = Date.now() - parsed.at < 1000 * 60 * 60 * 24 * 60;
      if (parsed.slug === slug && fresh && Array.isArray(parsed.lines)) setOrder(parsed);
    } catch {
      // Corrupt or unavailable storage is simply no suggestion.
    }
  }, [slug]);

  if (!order) return null;

  // Anything since sold out or removed quietly drops off the suggestion.
  const available = order.lines
    .map((line) => {
      const item = items.find((candidate) => candidate.id === line.id && candidate.inStock);
      return item ? { item, quantity: line.quantity } : null;
    })
    .filter(Boolean) as { item: CustomerItem; quantity: number }[];

  if (available.length === 0) return null;

  const total = available.reduce(
    (sum, line) => sum + linePaise(line.item.pricePaise, line.quantity),
    0,
  );

  function dismiss() {
    setOrder(null);
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* nothing to clear */
    }
  }

  // Lines, not the sum of the amounts: "1.25 items" is not a count.
  const count = available.length;

  /**
   * FIXED TO THE BOTTOM, WITH A ✕ (2026-10-01, by request).
   *
   * It sat folded shut below the menu, where a shopper had to scroll past the
   * whole list to find it. It is now a bar fixed to the bottom of the screen
   * while the basket is empty — the parent stops drawing it the moment the
   * first item goes in — and ✕ puts it away for this visit. The list opens
   * upward from the bar, so the bar never moves under the thumb.
   */
  return (
    <section className="pointer-events-auto w-full max-w-lg self-center overflow-hidden rounded-2xl border border-brand-200 bg-card shadow-float">
      {open && (
        <>
          <ul className="max-h-[45vh] divide-y divide-slate-100 overflow-y-auto">
            {available.map(({ item, quantity }) => (
              <li key={item.id} className="flex items-center gap-3 px-4 py-2">
                {/* The amount for anything weighed — a chip reading "0.25" is the
                    stored fraction of a pack, which is meaningless to a shopper. */}
                <span className="flex h-7 min-w-[1.75rem] shrink-0 items-center justify-center rounded-lg bg-brand-100 px-1.5 text-sm font-semibold tabular-nums text-brand-800">
                  {localUnit(amountLabel(item.unit, quantity) ?? String(quantity), locale)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-800">{itemName(item, locale)}</span>
                  {item.unit && <span className="block text-xs text-slate-400">{localUnit(item.unit, locale)}</span>}
                </span>
                <span className="shrink-0 text-sm tabular-nums text-slate-600">
                  {formatPaise(linePaise(item.pricePaise, quantity))}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2 border-y border-slate-100 bg-sunk p-3">
            <button
              type="button"
              onClick={() => {
                onRepeat(available.map((line) => ({ id: line.item.id, quantity: line.quantity })));
                setOrder(null);
              }}
              className="h-11 flex-1 rounded-xl bg-brand-600 px-4 font-semibold text-white transition hover:bg-brand-700"
            >
              {t.repeatAdd} · {formatPaise(total)}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="h-11 shrink-0 rounded-xl px-3 text-sm font-medium text-slate-500 transition hover:bg-white hover:text-slate-700"
            >
              {t.repeatDismiss}
            </button>
          </div>
        </>
      )}

      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-3 bg-brand-50 px-4 py-3 text-left transition hover:bg-brand-100"
        >
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-slate-900">{t.repeatTitle}</span>
            <span className="mt-0.5 block truncate text-xs text-slate-500">
              {count} {t.items} · {formatPaise(total)}
            </span>
          </span>
          <span aria-hidden className={clsx('shrink-0 text-slate-400 transition-transform', !open && 'rotate-180')}>
            ▾
          </span>
        </button>
        <button
          type="button"
          onClick={() => setOrder(null)}
          aria-label={t.saveShopLater}
          className="flex h-full min-h-14 w-12 shrink-0 items-center justify-center bg-brand-50 text-slate-500 transition hover:bg-brand-100 hover:text-slate-800"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
