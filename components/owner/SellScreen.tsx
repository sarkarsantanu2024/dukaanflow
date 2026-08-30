'use client';

/**
 * The counter till.
 *
 * Deliberately a different screen from Items: selling and cataloguing are
 * different jobs done at different moments, and mixing them means the owner
 * hunts past an "add item" form while a customer waits with a ten-rupee note.
 *
 * IT IS THE CUSTOMER'S SHOP PAGE, with the checkout replaced by a cash drawer.
 * The item cards, the search box, the category chips, the floating basket and
 * the basket panel are the customer's own components, not copies of them — an
 * owner who has walked a shopper through their shop page should not then have
 * to learn a second, similar screen to use their own till, and two lookalike
 * implementations drift apart the first time either is touched.
 *
 * What is genuinely different stays different: only stock the shop actually has
 * is offered, and the last step takes money — cash, a UPI QR carrying the exact
 * amount, or the khata.
 */

import { SearchIcon } from '@/components/ui/Icon';
import { EmptyState } from '@/components/ui/EmptyState';
import { ItemCard, itemName } from '@/components/customer/ItemCard';
import { VoiceOrder } from '@/components/customer/VoiceOrder';
import { CartBar } from '@/components/customer/CartBar';
import { CartDrawer, type CartLine } from '@/components/customer/CartDrawer';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { handledExpiredSession } from './sessionGuard';
import clsx from 'clsx';
import { QRCodeCanvas } from 'qrcode.react';
import { upiPayUrlWithAmount } from '@/lib/qr';
import { useToast } from '@/components/ui/Toast';
import { formatPaise } from '@/lib/money';
import { ownerDict } from '@/lib/owner-i18n';
import { dict } from '@/lib/i18n';
import { matchesSearch, translateCategory } from '@/lib/speech';
import type { Locale } from '@/lib/i18n';

export type SellItem = {
  id: string;
  name: string;
  nameBn: string;
  nameHi: string;
  pricePaise: number;
  unit: string;
  category: string;
  inStock: boolean;
};

type Cart = Record<string, number>;

/**
 * How many items before a search box earns its place — the same threshold the
 * shop page uses, and for the same reason: under it, scrolling is faster than
 * typing and a box over the grid asks the owner to work out why it is there.
 */
const SEARCH_FROM = 15;


export function SellScreen({
  slug,
  shopName,
  upiId,
  upiQrData,
  items,
  locale,
  customers,
}: {
  slug: string;
  shopName: string;
  upiId: string;
  upiQrData: string;
  items: SellItem[];
  locale: Locale;
  /** Regulars already in the khata, so udhaar is a tap not a typing job. */
  customers: { id: string; name: string; phone: string; area: string }[];
}) {
  const router = useRouter();
  const { push } = useToast();
  const t = ownerDict(locale);
  // The shopper's dictionary as well, because the item cards and the basket
  // panel are the shopper's components and speak it.
  const c = dict(locale);

  const [cart, setCart] = useState<Cart>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [khata, setKhata] = useState<{ name: string; phone: string; area: string } | null>(null);

  // Only what the shop actually has. A till is for ringing up what is on the
  // shelf, and a grid padded with things that cannot be sold makes the owner
  // read past them every time.
  const sellable = useMemo(() => items.filter((item) => item.inStock), [items]);

  const categories = useMemo(
    () => Array.from(new Set(sellable.map((item) => item.category).filter(Boolean))).sort(),
    [sellable],
  );

  // The shop page's own search: all three names, and spelling-tolerant, so
  // "ata" finds "Atta" while a customer is waiting.
  const visible = useMemo(
    () =>
      sellable.filter((item) => {
        if (category && item.category !== category) return false;
        return matchesSearch([item.name, item.nameBn, item.nameHi, item.unit, item.category], query);
      }),
    [sellable, query, category],
  );

  const lines = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, quantity]) => {
          const item = sellable.find((candidate) => candidate.id === id);
          return item ? { item, quantity } : null;
        })
        .filter(Boolean) as { item: SellItem; quantity: number }[],
    [cart, sellable],
  );

  /**
   * The basket, in the shape the shopper's basket panel takes.
   *
   * Built from `sellable` rather than from the cart's own keys, so the lines
   * come back in the order of the grid the owner just tapped through.
   */
  const cartLines: CartLine[] = useMemo(
    () =>
      sellable
        .filter((item) => (cart[item.id] ?? 0) > 0)
        .map((item) => ({
          id: item.id,
          label: itemName(item, locale),
          unit: item.unit,
          quantity: cart[item.id]!,
          pricePaise: item.pricePaise,
        })),
    [sellable, cart, locale],
  );

  const totalPaise = lines.reduce((sum, line) => sum + line.item.pricePaise * line.quantity, 0);

  /** Voice adds are relative — saying "rice" twice means two of them. */
  function addQuantity(id: string, more: number) {
    setCart((current) => ({ ...current, [id]: Math.min((current[id] ?? 0) + more, 99) }));
  }

  function setQuantity(id: string, next: number) {
    setCart((current) => {
      const updated = { ...current };
      if (next <= 0) delete updated[id];
      else updated[id] = Math.min(next, 99);
      return updated;
    });
  }

  async function record(paymentMode: 'CASH' | 'UPI' | 'KHATA') {
    if (paymentMode === 'KHATA' && !khata?.phone) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/shop/${slug}/sale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: lines.map((line) => ({ itemId: line.item.id, quantity: line.quantity })),
          paymentMode,
          ...(paymentMode === 'KHATA' && khata
            ? {
                customerPhone: khata.phone,
                customerName: khata.name,
                customerArea: khata.area,
              }
            : {}),
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (handledExpiredSession({ response, slug, t, push })) return;
      if (!response.ok) {
        push(payload.error ?? t.networkError, 'error');
        return;
      }

      setCart({});
      setPaying(false);
      setKhata(null);
      push(t.sellRecorded, 'success');
      router.refresh();
    } catch {
      push(t.networkError, 'error');
    } finally {
      setSaving(false);
    }
  }

  /**
   * The basket — the shopper's own panel, with the last button changed.
   *
   * It used to be a hand-built list beside the customer's: same job, same
   * gestures, subtly different everywhere. This is that component, so a
   * quantity is changed the same way on both sides of the counter and emptying
   * the basket asks the same question in the owner's own language.
   */
  const cartDrawer = (
    <CartDrawer
      open={cartOpen && lines.length > 0}
      lines={cartLines}
      totalPaise={totalPaise}
      locale={locale}
      onClose={() => setCartOpen(false)}
      onSetQuantity={setQuantity}
      onClear={() => setCart({})}
      onContinue={() => setPaying(true)}
      continueLabel={t.sellTakePayment}
    />
  );

  return (
    /* The mic and the basket float over the bottom of this list, so the last
       row of items needs room to scroll clear of them — and the last row is
       the one an owner is usually reaching for.

       NOTHING SITS ABOVE THE GRID BUT THE FILTERS. This screen used to open
       with the day's takings and then a list of every sale rung up today —
       two blocks of yesterday's news between an owner and the buttons they
       came to press, on the one screen used with a customer waiting. Takings
       are read at closing, on Orders; the till is for selling. */
    <div className="space-y-4 pb-24">
      {sellable.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-slate-500">
          {t.sellMissingItem}
        </p>
      ) : (
        <>
          {/* FILTERS LIVE WITH THE LIST; ACTIONS FLOAT — the shop page's rule,
              kept here so both screens behave the same way. The basket floats
              because it does something; search and categories narrow what is
              below them, so they sit above it.

              Sticky, so both are still reachable ten items down a rush. */}
          {(sellable.length >= SEARCH_FROM || categories.length > 1) && (
            <div className="sticky top-[3.25rem] z-10 -mx-4 bg-slate-100/95 px-4 pb-2 pt-3 backdrop-blur">
              {sellable.length >= SEARCH_FROM && (
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t.searchItems}
                    aria-label={t.searchItems}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-base placeholder:text-slate-400 focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-brand-600"
                  />
                </div>
              )}

              {/* Two chips are needed before there is a choice to make: with a
                  single category, "All" and that category list the same items,
                  so the row reads as broken rather than as absent. */}
              {categories.length > 1 && (
                <div className="mt-2 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
                  {[
                    { value: '', label: t.allCategories },
                    ...categories.map((name) => ({
                      value: name,
                      label: translateCategory(name, locale),
                    })),
                  ].map((option) => (
                    <button
                      key={option.value || 'all'}
                      type="button"
                      onClick={() => setCategory(option.value)}
                      aria-pressed={category === option.value}
                      className={clsx(
                        'shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition',
                        category === option.value
                          ? 'bg-brand-600 text-white'
                          : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100',
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {visible.length === 0 ? (
            <EmptyState title={c.noResults} />
          ) : (
            /* The shopper's own card, stepper and all. Tapping the row adds
               one; the stepper beside it changes a quantity without hunting
               the item down again in the basket. */
            <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
              {visible.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  quantity={cart[item.id] ?? 0}
                  onChange={(next) => setQuantity(item.id, next)}
                  locale={locale}
                />
              ))}
            </ul>
          )}
        </>
      )}

      {/* Above the drawer, not below it.
          Take payment now sits inside the basket, and the basket is z-50 with
          a 200ms exit animation — at z-30 this opened behind the panel that
          launched it and only appeared once that had finished sliding away. */}
      {paying && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl">
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg font-bold text-slate-900">{t.sellTakePayment}</h3>
              <p className="text-2xl font-bold tabular-nums text-brand-700">
                {formatPaise(totalPaise)}
              </p>
            </div>

            {/* A generated QR carries the amount, so the customer confirms
                rather than types — that beats the shop's static printed code,
                which is kept only as the fallback when there is no UPI ID. */}
            {upiId ? (
              <div className="mt-4 flex flex-col items-center gap-2 rounded-xl bg-slate-50 p-4">
                <QRCodeCanvas
                  value={upiPayUrlWithAmount(upiId, shopName, totalPaise)}
                  size={168}
                  includeMargin
                  level="M"
                />
                <p className="text-sm text-slate-600">{t.sellScanToPay}</p>
              </div>
            ) : upiQrData ? (
              <div className="mt-4 flex flex-col items-center gap-2 rounded-xl bg-slate-50 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={upiQrData} alt="UPI QR" className="h-42 w-42 max-w-[10.5rem]" />
                <p className="text-sm text-slate-600">{t.sellScanToPay}</p>
              </div>
            ) : null}

            <div className="mt-4 grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => record('CASH')}
                className="h-12 rounded-xl border border-slate-300 font-semibold text-slate-800 disabled:opacity-50"
              >
                {t.sellCash}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => record('UPI')}
                className="h-12 rounded-xl bg-brand-600 font-semibold text-white disabled:opacity-50"
              >
                {t.sellUpi}
              </button>
              {/* Goods leaving on credit is a payment mode here, because at the
                  counter that is exactly what it is — the third thing that can
                  happen when the customer is ready to go. */}
              <button
                type="button"
                disabled={saving}
                onClick={() => setKhata(khata ?? { name: '', phone: '', area: '' })}
                className={clsx(
                  'h-12 rounded-xl border font-semibold disabled:opacity-50',
                  khata
                    ? 'border-amber-500 bg-amber-50 text-amber-800'
                    : 'border-slate-300 text-slate-800',
                )}
              >
                {t.sellKhata}
              </button>
            </div>

            {khata && (
              <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3">
                <p className="text-sm font-semibold text-amber-900">{t.sellWhoseKhata}</p>

                {customers.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {customers.slice(0, 8).map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => setKhata({ name: customer.name, phone: customer.phone, area: customer.area })}
                        className={clsx(
                          'rounded-full border px-3 py-1 text-sm font-medium',
                          khata.phone === customer.phone
                            ? 'border-amber-600 bg-amber-600 text-white'
                            : 'border-amber-300 bg-white text-amber-900',
                        )}
                      >
                        {customer.name || customer.phone}
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    value={khata.area}
                    onChange={(event) => setKhata({ ...khata, area: event.target.value })}
                    placeholder={t.khataArea}
                    aria-label={t.khataArea}
                    className="col-span-2 rounded-lg border border-amber-300 bg-white px-3 py-2 text-base"
                  />
                  <input
                    value={khata.name}
                    onChange={(event) => setKhata({ ...khata, name: event.target.value })}
                    placeholder={t.khataCustomer}
                    aria-label={t.khataCustomer}
                    className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-base"
                  />
                  <input
                    value={khata.phone}
                    onChange={(event) => setKhata({ ...khata, phone: event.target.value })}
                    inputMode="numeric"
                    placeholder={t.khataPhone}
                    aria-label={t.khataPhone}
                    className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-base"
                  />
                </div>

                <button
                  type="button"
                  disabled={saving || khata.phone.replace(/\D/g, '').length < 10}
                  onClick={() => record('KHATA')}
                  className="mt-2 h-11 w-full rounded-xl bg-amber-600 font-semibold text-white disabled:opacity-50"
                >
                  {t.sellKhata} · {formatPaise(totalPaise)}
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setPaying(false)}
              className="mt-3 w-full py-2 text-sm font-medium text-slate-500"
            >
              {t.no}
            </button>
          </div>
        </div>
      )}

      {/* The only way into the till, and deliberately the same control the
          shopper has on the storefront: same corner, same size, same badge.
          An owner who has walked a customer through the shop page should not
          have to learn a second basket to use their own. Sits above the tab
          bar rather than over it. */}
      {/* The shopper's own corner, on the shopkeeper's own screen: speak an
          order, and open the basket. Both DO something; search and categories
          only narrow the list, so they stay above it.

          The wrapper takes no clicks and only the buttons do, so the gaps
          between them are still the live page. It rides above the tab bar
          rather than over it, and when the basket opens the mic FLOATS OVER
          the panel rather than moving out of its way — an owner reaches for
          that corner without looking, and a control that slides across the
          screen when a panel opens has to be hunted for at exactly the moment
          somebody is waiting to pay. */}
      <div
        className={clsx(
          'no-print pointer-events-none fixed inset-x-0 mx-auto flex max-w-3xl flex-col items-end gap-3 px-4 transition-[bottom]',
          // Above the drawer's own z-50 while it is open, and back below it
          // afterwards so nothing here sits over an ordinary screen.
          //
          // The offset changes with it: at rest the mic clears the tab bar,
          // and with the basket open it clears the total-and-pay bar at the
          // foot of the panel — which covers the tab bar anyway.
          cartOpen
            ? 'z-[60] bottom-[calc(5.25rem+env(safe-area-inset-bottom))]'
            : 'z-30 bottom-[calc(5.5rem+env(safe-area-inset-bottom))]',
        )}
      >
        <VoiceOrder items={sellable} locale={locale} onAdd={addQuantity} />

        {!cartOpen && (
          <CartBar
            totalItems={lines.reduce((count, line) => count + line.quantity, 0)}
            totalAmountPaise={totalPaise}
            onReview={() => setCartOpen(true)}
            locale={locale}
          />
        )}
      </div>

      {cartDrawer}
    </div>
  );
}
