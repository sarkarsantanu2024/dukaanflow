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
import { formatPaise } from '@/lib/money';
import { dict, type Locale } from '@/lib/i18n';
import type { CustomerItem } from './ItemCard';
import { itemName } from './ItemCard';

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

  const total = available.reduce((sum, line) => sum + line.item.pricePaise * line.quantity, 0);

  function dismiss() {
    setOrder(null);
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* nothing to clear */
    }
  }

  const count = available.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-brand-200 bg-white">
      {/* Folded shut. Down here below the menu it is a thing the shopper can
          go and look for, not a panel that greets them with somebody else's
          shopping — and the summary line is enough to decide whether opening
          it is worth the tap. */}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 bg-brand-50 px-4 py-3 text-left transition hover:bg-brand-100"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-slate-900">{t.repeatTitle}</span>
          <span className="mt-0.5 block truncate text-xs text-slate-500">
            {count} {t.items} · {formatPaise(total)}
          </span>
        </span>
        <span
          aria-hidden
          className={clsx(
            'shrink-0 text-slate-400 transition-transform',
            open && 'rotate-180',
          )}
        >
          ▾
        </span>
      </button>

      {/* One item per row on white, with the quantity as a chip rather than
          "× 1" tacked onto the name. The old list ran four dense grey lines of
          "Atta · 1 kg × 1" against a right-aligned price — three numbers per
          line, in two units, with nothing separating the pack size from how
          many of them. Nobody could see at a glance what they were about to
          re-order, which is the only thing this panel is for. */}
      {open && (
        <>
      <ul className="divide-y divide-slate-100">
        {available.map(({ item, quantity }) => (
          <li key={item.id} className="flex items-center gap-3 px-4 py-2">
            <span className="flex h-7 min-w-[1.75rem] shrink-0 items-center justify-center rounded-lg bg-brand-100 px-1.5 text-sm font-bold tabular-nums text-brand-800">
              {quantity}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-slate-800">
                {itemName(item, locale)}
              </span>
              {item.unit && <span className="block text-xs text-slate-400">{item.unit}</span>}
            </span>
            <span className="shrink-0 text-sm tabular-nums text-slate-600">
              {formatPaise(item.pricePaise * quantity)}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50 p-3">
        <button
          type="button"
          onClick={() => {
            onRepeat(available.map((line) => ({ id: line.item.id, quantity: line.quantity })));
            setOrder(null);
          }}
          className="h-11 rounded-xl bg-brand-600 px-5 font-semibold text-white transition hover:bg-brand-700"
        >
          {t.repeatAdd} · {formatPaise(total)}
        </button>
        <span className="text-xs text-slate-500">
          {count} {t.items}
        </span>
        <button
          type="button"
          onClick={dismiss}
          className="ml-auto h-11 rounded-xl px-3 text-sm font-medium text-slate-500 transition hover:bg-white hover:text-slate-700"
        >
          {t.repeatDismiss}
        </button>
      </div>
        </>
      )}
    </section>
  );
}
