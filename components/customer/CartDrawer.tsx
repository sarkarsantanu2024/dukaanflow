'use client';

/**
 * The basket, opened from the bar at the bottom.
 *
 * Until now the bar showed a count and a total and nothing else, and the only
 * way to change what was in the basket was to find each item again in the menu
 * — which on a hundred-item kirana list means scrolling back through it, from
 * memory, to correct a single mis-tap. A shopper who cannot see what they are
 * about to order either abandons it or orders the wrong thing, and both land on
 * the shopkeeper as a phone call.
 *
 * Built on the same `Drawer` the console's tools use rather than a sheet of its
 * own. One slide-over, one set of animations, one Escape-and-backdrop
 * behaviour: a second panel that merely resembled it would drift, and the
 * storefront is meant to look like the product the shopkeeper was shown.
 *
 * Deliberately NOT a checkout step. Everything here is reversible — change a
 * quantity, remove a line, empty the lot — and the one irreversible thing, the
 * order itself, stays behind Continue.
 */

import { formatPaise } from '@/lib/money';
import { dict, type Locale } from '@/lib/i18n';
import { Drawer } from '@/components/ui/Drawer';
import { useConfirm } from '@/components/ui/useConfirm';
import { TrashIcon } from '@/components/ui/Icon';

export type CartLine = {
  id: string;
  label: string;
  unit: string;
  quantity: number;
  pricePaise: number;
};

export function CartDrawer({
  open,
  lines,
  totalPaise,
  locale,
  onClose,
  onSetQuantity,
  onClear,
  onContinue,
}: {
  open: boolean;
  lines: CartLine[];
  totalPaise: number;
  locale: Locale;
  onClose: () => void;
  onSetQuantity: (itemId: string, next: number) => void;
  onClear: () => void;
  onContinue: () => void;
}) {
  const t = dict(locale);
  const { confirm, dialog } = useConfirm();

  return (
    <>
      <Drawer
      open={open}
      title={t.cartTitle}
      onClose={onClose}
      // The menu stays live behind it: the basket is meant to fill up in front
      // of the shopper as they pick, not to be a place they visit afterwards.
      modal={false}
      action={
        lines.length > 0 ? (
          <button
            type="button"
            onClick={async () => {
              // A basket is many taps of work; emptying it by accident on a
              // phone is one. The confirm is the cheap insurance — and it is
              // the app's own dialog, so it speaks the shopper's language.
              // `window.confirm` is always in the browser's.
              if (
                await confirm({
                  title: t.cartClear,
                  message: t.cartClearConfirm,
                  confirmLabel: t.cartClear,
                  cancelLabel: t.cancel,
                  danger: true,
                })
              ) {
                onClear();
                onClose();
              }
            }}
            aria-label={t.cartClear}
            title={t.cartClear}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-red-600 transition hover:bg-red-50"
          >
            <TrashIcon className="h-6 w-6" />
          </button>
        ) : undefined
      }
    >
      {lines.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">{t.cartEmpty}</p>
      ) : (
        <>
          <ul className="space-y-2">
            {lines.map((line) => (
              <li key={line.id} className="rounded-2xl bg-white p-3 shadow-card">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{line.label}</p>
                    <p className="text-sm text-slate-500">
                      {formatPaise(line.pricePaise)}
                      {line.unit && <span className="text-slate-400"> / {line.unit}</span>}
                    </p>
                  </div>

                  {/* The line total, not just the unit price: "3 × ₹50" is
                      arithmetic the shopper should not have to do to check
                      the number on the button below. */}
                  <p className="shrink-0 font-semibold tabular-nums text-slate-900">
                    {formatPaise(line.pricePaise * line.quantity)}
                  </p>
                </div>

                <div className="mt-2.5 flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded-xl bg-brand-50 p-1">
                    <button
                      type="button"
                      aria-label="−"
                      onClick={() => onSetQuantity(line.id, line.quantity - 1)}
                      className="h-9 w-9 rounded-lg text-lg font-bold text-brand-800 transition hover:bg-brand-100"
                    >
                      −
                    </button>
                    <span className="w-7 text-center font-bold tabular-nums text-slate-900">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="+"
                      onClick={() => onSetQuantity(line.id, line.quantity + 1)}
                      className="h-9 w-9 rounded-lg text-lg font-bold text-brand-800 transition hover:bg-brand-100"
                    >
                      +
                    </button>
                  </div>

                  {/* The bin alone. "Remove" beside it said the same thing
                      twice, in a word that had to be translated three ways,
                      and the pair still gave a smaller tap target than one
                      properly sized icon does. */}
                  <button
                    type="button"
                    onClick={() => onSetQuantity(line.id, 0)}
                    aria-label={`${t.cartRemove} — ${line.label}`}
                    title={t.cartRemove}
                    className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <TrashIcon className="h-6 w-6" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {/* The total and Continue travel with the list rather than pinning to
              the foot of the panel: a basket of three items would otherwise
              leave a bar floating below a screen of empty grey. */}
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-500">{t.total}</p>
              <p className="text-xl font-bold tabular-nums text-slate-900">
                {formatPaise(totalPaise)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onContinue();
              }}
              className="h-12 shrink-0 rounded-xl bg-brand-600 px-5 text-base font-semibold text-white transition hover:bg-brand-700"
            >
              {t.continue} →
            </button>
          </div>
        </>
      )}
      </Drawer>

      {/* After the drawer, not before it. Both sit at z-50, so paint order is
          what decides which is on top — rendered first, the confirm opened
          behind the panel that asked for it. */}
      {dialog}
    </>
  );
}
