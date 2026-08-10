'use client';

import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { ShopHeader, type ShopSummary } from './ShopHeader';
import { ItemCard, type CustomerItem } from './ItemCard';
import { CartBar } from './CartBar';
import { CheckoutSheet, type CheckoutSubmit } from './CheckoutSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { dict, LOCALES, type Locale } from '@/lib/i18n';

const LOCALE_STORAGE_KEY = 'dukaanflow:locale';

type Cart = Record<string, number>;

export function StoreFront({ shop, items }: { shop: ShopSummary; items: CustomerItem[] }) {
  const { push } = useToast();
  const [locale, setLocale] = useState<Locale>('en');
  const [cart, setCart] = useState<Cart>({});
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const t = dict(locale);

  // Remember the shopper's language across visits to any DukaanFlow shop.
  useEffect(() => {
    const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved && (LOCALES as readonly string[]).includes(saved)) setLocale(saved as Locale);
  }, []);

  function changeLocale(next: Locale) {
    setLocale(next);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
  }

  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.category).filter(Boolean))).sort(),
    [items],
  );

  const visibleItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (category && item.category !== category) return false;
      if (!needle) return true;
      return `${item.name} ${item.unit} ${item.category}`.toLowerCase().includes(needle);
    });
  }, [items, query, category]);

  const { totalItems, totalAmount } = useMemo(() => {
    let count = 0;
    let amount = 0;
    for (const item of items) {
      const quantity = cart[item.id] ?? 0;
      if (quantity > 0) {
        count += quantity;
        amount += quantity * item.price;
      }
    }
    return { totalItems: count, totalAmount: amount };
  }, [cart, items]);

  function setQuantity(itemId: string, next: number) {
    setCart((current) => {
      const updated = { ...current };
      if (next <= 0) delete updated[itemId];
      else updated[itemId] = Math.min(next, 99);
      return updated;
    });
  }

  async function placeOrder(values: CheckoutSubmit) {
    setSubmitting(true);
    try {
      const response = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopSlug: shop.slug,
          customerName: values.customerName,
          customerPhone: values.customerPhone,
          customerAddress: values.customerAddress,
          orderType: values.orderType,
          // Only ids and quantities travel to the server. Prices are re-read
          // from the database there — the client never quotes a total.
          items: Object.entries(cart).map(([itemId, quantity]) => ({ itemId, quantity })),
        }),
      });

      const payload = (await response.json()) as {
        whatsappUrl?: string;
        error?: string;
      };

      if (!response.ok || !payload.whatsappUrl) {
        push(payload.error ?? t.orderFailed, 'error');
        return;
      }

      push(t.openingWhatsApp, 'success');
      setCheckoutOpen(false);
      setCart({});
      window.location.href = payload.whatsappUrl;
    } catch {
      push(t.orderFailed, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-slate-50 pb-28">
      <ShopHeader shop={shop} locale={locale} onLocaleChange={changeLocale} payLabel={t.payViaUpi} />

      <main className="mx-auto max-w-2xl px-4 py-4">
        {items.length === 0 ? (
          <EmptyState title={t.emptyShop} hint={t.emptyShopHint} />
        ) : (
          <>
            <div className="sticky top-0 z-10 -mx-4 bg-slate-50/95 px-4 pb-2 pt-3 backdrop-blur">
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.search}
                aria-label={t.search}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base placeholder:text-slate-400 focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-brand-600"
              />

              {categories.length > 0 && (
                <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                  {[{ value: '', label: t.all }, ...categories.map((c) => ({ value: c, label: c }))].map(
                    (option) => (
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
                    ),
                  )}
                </div>
              )}
            </div>

            {visibleItems.length === 0 ? (
              <div className="pt-6">
                <EmptyState title={t.noResults} />
              </div>
            ) : (
              <ul className="mt-2 space-y-2">
                {visibleItems.map((item) => (
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

        <p className="mt-8 text-center text-xs text-slate-400">
          Powered by DukaanFlow · Scan → Select → WhatsApp
        </p>
      </main>

      <CartBar
        totalItems={totalItems}
        totalAmount={totalAmount}
        onContinue={() => setCheckoutOpen(true)}
        locale={locale}
      />

      <CheckoutSheet
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSubmit={placeOrder}
        submitting={submitting}
        totalItems={totalItems}
        totalAmount={totalAmount}
        locale={locale}
      />
    </div>
  );
}
