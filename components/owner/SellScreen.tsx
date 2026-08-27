'use client';

/**
 * The counter till.
 *
 * Deliberately a different screen from Items: selling and cataloguing are
 * different jobs done at different moments, and mixing them means the owner
 * hunts past an "add item" form while a customer waits with a ten-rupee note.
 *
 * Everything here is one-thumb sized. Tap an item to add one, tap again for
 * two. The total is always on screen. Payment is cash or a UPI QR carrying the
 * exact amount, so the customer scans and pays without anyone typing figures.
 */

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { QRCodeCanvas } from 'qrcode.react';
import { useToast } from '@/components/ui/Toast';
import { formatRupees } from '@/lib/money';
import { ownerDict } from '@/lib/owner-i18n';
import { translateCategory } from '@/lib/speech';
import type { Locale } from '@/lib/i18n';

export type SellItem = {
  id: string;
  name: string;
  nameBn: string;
  nameHi: string;
  price: number;
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

/** UPI intent with the amount filled in — the customer confirms, never types. */
function upiUrl(upiId: string, shopName: string, amount: number): string {
  const params = new URLSearchParams({
    pa: upiId,
    pn: shopName,
    am: String(amount),
    cu: 'INR',
  });
  return `upi://pay?${params.toString()}`;
}

export function SellScreen({
  slug,
  shopName,
  upiId,
  upiQrData,
  items,
  locale,
  todayTotal,
  todayCount,
  customers,
}: {
  slug: string;
  shopName: string;
  upiId: string;
  upiQrData: string;
  items: SellItem[];
  locale: Locale;
  todayTotal: number;
  todayCount: number;
  /** Regulars already in the khata, so udhaar is a tap not a typing job. */
  customers: { id: string; name: string; phone: string }[];
}) {
  const router = useRouter();
  const { push } = useToast();
  const t = ownerDict(locale);

  const [cart, setCart] = useState<Cart>({});
  const [query, setQuery] = useState('');
  const [paying, setPaying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [khata, setKhata] = useState<{ name: string; phone: string } | null>(null);

  // Everything listed is shown, in stock or not. Hiding the out-of-stock ones
  // left an owner staring at a short list wondering where the rest went, when
  // what they usually want is to sell the last of something and mark it out —
  // or to be reminded, at the counter, that it is out. They are shown greyed
  // and cannot be added.
  const sellable = items;

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return sellable;
    return sellable.filter((item) =>
      `${item.name} ${item.nameBn} ${item.nameHi} ${item.unit} ${item.category}`
        .toLowerCase()
        .includes(needle),
    );
  }, [sellable, query]);

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

  const total = lines.reduce((sum, line) => sum + line.item.price * line.quantity, 0);

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
            ? { customerPhone: khata.phone, customerName: khata.name }
            : {}),
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };

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

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3 rounded-2xl bg-white p-4 shadow-card">
        <div>
          <h2 className="font-semibold text-slate-900">{t.sellTitle}</h2>
          <p className="text-sm text-slate-500">{t.sellHint}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-slate-400">{t.sellToday}</p>
          <p className="text-lg font-bold tabular-nums text-slate-900">{formatRupees(todayTotal)}</p>
          <p className="text-xs text-slate-500">
            {todayCount} {t.sellTodayCount}
          </p>
        </div>
      </div>

      {lines.length > 0 && (
        <ul className="divide-y divide-slate-100 rounded-2xl bg-white shadow-card">
          {lines.map(({ item, quantity }) => (
            <li key={item.id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">
                  {label(item, locale)}
                  {item.unit && <span className="font-normal text-slate-500"> · {item.unit}</span>}
                </p>
                <p className="text-sm tabular-nums text-slate-500">
                  {quantity} × {formatRupees(item.price)} ={' '}
                  <strong className="text-slate-800">{formatRupees(item.price * quantity)}</strong>
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
            </li>
          ))}
        </ul>
      )}

      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t.sellSearch}
        aria-label={t.sellSearch}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base"
      />

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
              disabled={!item.inStock}
              className={clsx(
                'flex min-h-[76px] flex-col justify-between rounded-xl border bg-white p-3 text-left transition',
                !item.inStock
                  ? 'cursor-not-allowed border-slate-200 opacity-50'
                  : cart[item.id]
                    ? 'border-brand-500 ring-2 ring-brand-200'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
              )}
            >
              <span className="line-clamp-2 text-sm font-semibold text-slate-900">
                {label(item, locale)}
              </span>
              <span className="mt-1 flex items-baseline gap-1">
                {item.inStock ? (
                  <>
                    <span className="font-bold tabular-nums text-brand-700">
                      {formatRupees(item.price)}
                    </span>
                    {item.unit && <span className="text-xs text-slate-500">/ {item.unit}</span>}
                  </>
                ) : (
                  <span className="text-xs font-semibold text-red-600">{t.outOfStock}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}

      {lines.length > 0 && (
        <div className="fixed inset-x-0 bottom-[68px] z-20 border-t border-slate-200 bg-white p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <button
              type="button"
              onClick={() => setCart({})}
              className="shrink-0 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600"
            >
              {t.sellClear}
            </button>
            <div className="mr-auto">
              <p className="text-xs uppercase tracking-wide text-slate-400">{t.sellTotal}</p>
              <p className="text-xl font-bold tabular-nums text-slate-900">{formatRupees(total)}</p>
            </div>
            <button
              type="button"
              onClick={() => setPaying(true)}
              className="h-12 shrink-0 rounded-xl bg-brand-600 px-5 font-semibold text-white hover:bg-brand-700"
            >
              {t.sellTakePayment}
            </button>
          </div>
        </div>
      )}

      {paying && (
        <div
          className="fixed inset-0 z-30 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl">
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg font-bold text-slate-900">{t.sellTakePayment}</h3>
              <p className="text-2xl font-bold tabular-nums text-brand-700">
                {formatRupees(total)}
              </p>
            </div>

            {/* A generated QR carries the amount, so the customer confirms
                rather than types — that beats the shop's static printed code,
                which is kept only as the fallback when there is no UPI ID. */}
            {upiId ? (
              <div className="mt-4 flex flex-col items-center gap-2 rounded-xl bg-slate-50 p-4">
                <QRCodeCanvas
                  value={upiUrl(upiId, shopName, total)}
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
                onClick={() => setKhata(khata ?? { name: '', phone: '' })}
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
                        onClick={() => setKhata({ name: customer.name, phone: customer.phone })}
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
                  {t.sellKhata} · {formatRupees(total)}
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
    </div>
  );
}
