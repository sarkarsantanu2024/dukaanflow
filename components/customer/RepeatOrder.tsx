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
import { formatRupees } from '@/lib/money';
import { dict, type Locale } from '@/lib/i18n';
import type { CustomerItem } from './ItemCard';
import { itemName } from './ItemCard';

const KEY = 'dukaanflow:last-order';

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

  const total = available.reduce((sum, line) => sum + line.item.price * line.quantity, 0);

  function dismiss() {
    setOrder(null);
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* nothing to clear */
    }
  }

  return (
    <section className="mt-2 rounded-2xl border border-brand-200 bg-brand-50/70 p-3">
      <p className="font-semibold text-slate-900">{t.repeatTitle}</p>
      <p className="mt-0.5 text-xs text-slate-500">{t.repeatHint}</p>

      <ul className="mt-2 space-y-0.5 text-sm text-slate-700">
        {available.map(({ item, quantity }) => (
          <li key={item.id} className="flex justify-between gap-3">
            <span className="min-w-0 truncate">
              {itemName(item, locale)}
              {item.unit ? ` · ${item.unit}` : ''} × {quantity}
            </span>
            <span className="shrink-0 tabular-nums text-slate-500">
              {formatRupees(item.price * quantity)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            onRepeat(available.map((line) => ({ id: line.item.id, quantity: line.quantity })));
            setOrder(null);
          }}
          className="h-11 rounded-xl bg-brand-600 px-4 font-semibold text-white hover:bg-brand-700"
        >
          {t.repeatAdd} · {formatRupees(total)}
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="h-11 rounded-xl px-3 text-sm font-medium text-slate-500 hover:bg-white"
        >
          {t.repeatDismiss}
        </button>
      </div>
    </section>
  );
}
