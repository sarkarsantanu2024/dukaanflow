'use client';

/**
 * The counter till.
 *
 * Deliberately a different screen from Items: selling and cataloguing are
 * different jobs done at different moments, and mixing them means the owner
 * hunts past an "add item" form while a customer waits with a ten-rupee note.
 *
 * Everything here is one-thumb sized. Tap an item to add one, tap again for
 * two. The totalPaise is always on screen. Payment is cash or a UPI QR carrying the
 * exact amount, so the customer scans and pays without anyone typing figures.
 */

import { Drawer } from '@/components/ui/Drawer';
import { formatClock } from '@/lib/time';
import { CartIcon } from '@/components/ui/Icon';
import { SwipeToRemove } from '@/components/ui/SwipeToRemove';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { handledExpiredSession } from './sessionGuard';
import clsx from 'clsx';
import { QRCodeCanvas } from 'qrcode.react';
import { upiPayUrlWithAmount } from '@/lib/qr';
import { useToast } from '@/components/ui/Toast';
import { formatPaise } from '@/lib/money';
import { ownerDict } from '@/lib/owner-i18n';
import { translateCategory } from '@/lib/speech';
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

function label(item: SellItem, locale: Locale): string {
  if (locale === 'bn') return item.nameBn || item.name;
  if (locale === 'hi') return item.nameHi || item.name;
  return item.name;
}


export function SellScreen({
  slug,
  shopName,
  upiId,
  upiQrData,
  items,
  locale,
  todayTotalPaise,
  todayCount,
  sales,
  customers,
}: {
  slug: string;
  shopName: string;
  upiId: string;
  upiQrData: string;
  items: SellItem[];
  locale: Locale;
  todayTotalPaise: number;
  todayCount: number;
  /** Today's sales, newest first, each with the moment it was rung up. */
  sales: {
    id: string;
    totalAmountPaise: number;
    paymentMode: string;
    createdAt: string;
    count: number;
  }[];
  /** Regulars already in the khata, so udhaar is a tap not a typing job. */
  customers: { id: string; name: string; phone: string; area: string }[];
}) {
  const router = useRouter();
  const { push } = useToast();
  const t = ownerDict(locale);

  const [cart, setCart] = useState<Cart>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [khata, setKhata] = useState<{ name: string; phone: string; area: string } | null>(null);

  // Only what the shop actually has. A till is for ringing up what is on the
  // shelf, and a grid padded with things that cannot be sold makes the owner
  // read past them every time.
  const sellable = useMemo(() => items.filter((item) => item.inStock), [items]);

  // No search: the grid is everything the shop has in stock, straight from the
  // items list, so there is nothing here that typing could reveal.
  const visible = sellable;

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

  const totalPaise = lines.reduce((sum, line) => sum + line.item.pricePaise * line.quantity, 0);

  function add(id: string) {
    setCart((current) => ({ ...current, [id]: Math.min((current[id] ?? 0) + 1, 99) }));
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
   * The cart, in a drawer.
   *
   * It used to sit above the item grid, growing downward as the customer added
   * things and pushing the grid — the thing being tapped — further off the
   * screen with every line. The totalPaise already lives on the payment bar; this is
   * where the owner goes when they want to see what makes it up, or change a
   * quantity.
   */
  const cartDrawer = (
    <Drawer
      open={cartOpen && lines.length > 0}
      title={t.sellTotal}
      action={
        <button
          type="button"
          onClick={() => setCart({})}
          className="shrink-0 rounded-lg px-2 py-1 text-sm font-semibold text-red-600 transition hover:bg-red-50"
        >
          {t.sellClear}
        </button>
      }
      onClose={() => setCartOpen(false)}
    >
        <ul className="divide-y divide-slate-100 rounded-2xl bg-white shadow-card">
        {lines.map(({ item, quantity }) => (
          <li key={item.id}>
            <SwipeToRemove
              onRemove={() => setQuantity(item.id, 0)}
              label={`${t.delete} — ${label(item, locale)}`}
            >
              <div className="flex items-center gap-3 py-3 pl-3 pr-12">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-900">
                {label(item, locale)}
                {item.unit && <span className="font-normal text-slate-500"> · {item.unit}</span>}
              </p>
              <p className="text-sm tabular-nums text-slate-500">
                {quantity} × {formatPaise(item.pricePaise)} ={' '}
                <strong className="text-slate-800">{formatPaise(item.pricePaise * quantity)}</strong>
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1 rounded-xl border border-brand-200 bg-brand-50 p-1">
              <button
                type="button"
                aria-label={`−1 ${label(item, locale)}`}
                onClick={() => setQuantity(item.id, quantity - 1)}
                className="h-9 w-9 rounded-lg text-lg font-bold text-brand-700 hover:bg-white"
              >
                −
              </button>
              <span className="w-7 text-center font-bold tabular-nums">{quantity}</span>
              <button
                type="button"
                aria-label={`+1 ${label(item, locale)}`}
                onClick={() => setQuantity(item.id, quantity + 1)}
                className="h-9 w-9 rounded-lg text-lg font-bold text-brand-700 hover:bg-white"
              >
                +
              </button>
            </div>
              </div>
            </SwipeToRemove>
          </li>
        ))}
      </ul>

      {/* The total and the payment button live with the basket they describe.
          They used to be a bar fixed across the screen as well, so the owner
          had the same two numbers in two places and two ways to reach the same
          till — and the bar cost a strip of every screen to say what the
          basket badge already said. */}
      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card">
        <div className="min-w-0 flex-1">
          <p className="text-xs leading-tight text-slate-500">
            {lines.length} {t.itemsCount}
          </p>
          <p className="text-xl font-bold leading-tight tabular-nums text-slate-900">
            {formatPaise(totalPaise)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setCartOpen(false);
            setPaying(true);
          }}
          className="h-12 shrink-0 rounded-xl bg-brand-600 px-5 font-semibold text-white hover:bg-brand-700"
        >
          {t.sellTakePayment}
        </button>
      </div>
    </Drawer>
  );

  return (
    /* The basket button floats over the bottom of this list, so the last row
       of items needs room to scroll clear of it — and the last row is the one
       an owner is usually reaching for. The space appears only while there is
       a button to clear. */
    <div className={clsx('space-y-4', lines.length > 0 && 'pb-20')}>
      {/* Today's takings, and nothing else.
          This was a card carrying a heading that repeated the tab the owner
          had just pressed, a line telling them to tap what the customer is
          buying, and a paragraph explaining why counter sales and WhatsApp
          orders are separate records. All true, all read once, and then read
          again every single morning for the life of the shop — four lines of
          instruction above the grid the owner actually came to press.

          The takings stay, because that number changes through the day and is
          the reason to glance up here at all. */}
      <div className="flex items-baseline justify-between gap-3 rounded-2xl bg-white px-4 py-2.5 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t.sellToday}
        </p>
        <p className="flex items-baseline gap-2">
          <span className="text-lg font-bold tabular-nums text-slate-900">
            {formatPaise(todayTotalPaise)}
          </span>
          <span className="text-xs text-slate-500">
            {todayCount} {t.sellTodayCount}
          </span>
        </p>
      </div>

      {/* What has actually been taken today, with the time of each. The totalPaise
          on its own can only be agreed with or doubted; this is the list a
          shopkeeper counts the drawer against. */}
      {sales.length > 0 && lines.length === 0 && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t.sellToday}
          </h2>
          <ul className="divide-y divide-slate-100 rounded-2xl bg-white shadow-card">
            {sales.map((sale) => (
              <li key={sale.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="w-20 shrink-0 text-sm tabular-nums text-slate-500">
                  {formatClock(sale.createdAt)}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-slate-600">
                  {sale.count} {t.itemsCount}
                  {' · '}
                  {sale.paymentMode === 'CASH'
                    ? t.sellCash
                    : sale.paymentMode === 'UPI'
                      ? t.sellUpi
                      : t.sellKhata}
                </span>
                <span className="shrink-0 font-bold tabular-nums text-slate-900">
                  {formatPaise(sale.totalAmountPaise)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}


      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-slate-500">
          {t.sellMissingItem}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {visible.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => add(item.id)}
              className={clsx(
                'flex min-h-[76px] flex-col justify-between rounded-xl border bg-white p-3 text-left transition',
                cart[item.id]
                  ? 'border-brand-500 ring-2 ring-brand-200'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
              )}
            >
              <span className="line-clamp-2 text-sm font-semibold text-slate-900">
                {label(item, locale)}
              </span>
              <span className="mt-1 flex items-baseline gap-1">
                <span className="font-bold tabular-nums text-brand-700">
                  {formatPaise(item.pricePaise)}
                </span>
                {item.unit && <span className="text-xs text-slate-500">/ {item.unit}</span>}
              </span>
            </button>
          ))}
        </div>
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
      {lines.length > 0 && !cartOpen && (
        <div className="no-print fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-3xl justify-end px-4">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={`${lines.length} ${t.itemsCount} · ${formatPaise(totalPaise)}`}
            className="relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-700 text-white shadow-lg shadow-brand-900/30 ring-4 ring-slate-100/70 transition hover:bg-brand-800 active:scale-95"
          >
            <CartIcon className="h-6 w-6" />
            <span className="absolute -right-1 -top-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1 text-xs font-bold tabular-nums text-brand-800 ring-2 ring-brand-700">
              {lines.length}
            </span>
          </button>
        </div>
      )}

      {cartDrawer}
    </div>
  );
}
