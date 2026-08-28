'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { ShopHeader, type ShopSummary } from './ShopHeader';
import { ItemCard, itemName, type CustomerItem } from './ItemCard';
import { CartBar } from './CartBar';
import { CheckoutSheet, type CheckoutSubmit } from './CheckoutSheet';
import { VoiceOrder } from './VoiceOrder';
import { RepeatOrder, rememberOrder } from './RepeatOrder';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { dict, LOCALES, type Locale } from '@/lib/i18n';
import { translateCategory } from '@/lib/speech';

const LOCALE_STORAGE_KEY = 'dukaanflow:locale';

type Cart = Record<string, number>;

export function StoreFront({ shop, items }: { shop: ShopSummary; items: CustomerItem[] }) {
  const { push } = useToast();
  // Bengali first, and remembered per shopper after that. A customer who
  // scans a code at a Kolkata counter should not have to pick a language
  // before they can read the menu.
  const [locale, setLocale] = useState<Locale>('bn');
  const [cart, setCart] = useState<Cart>({});
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(false);

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
      // Search all three names, so typing "চাল" finds an item listed as Rice.
      return `${item.name} ${item.nameBn} ${item.nameHi} ${item.unit} ${item.category}`
        .toLowerCase()
        .includes(needle);
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

  /** Voice adds are relative — saying "rice" twice means two of them. */
  function addQuantity(itemId: string, more: number) {
    setCart((current) => ({ ...current, [itemId]: Math.min((current[itemId] ?? 0) + more, 99) }));
  }

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
          customerPincode: values.customerPincode,
          orderType: values.orderType,
          // Only ids and quantities travel to the server. Prices are re-read
          // from the database there — the client never quotes a total.
          items: Object.entries(cart).map(([itemId, quantity]) => ({ itemId, quantity })),
        }),
      });

      const payload = (await response.json()) as { orderId?: string; error?: string };

      if (!response.ok || !payload.orderId) {
        push(payload.error ?? t.orderFailed, 'error');
        return;
      }

      // Remembered before the cart is cleared, so the next visit can offer it.
      rememberOrder(shop.slug, cart);

      setCheckoutOpen(false);
      setCart({});
      // The order used to end with a jump into WhatsApp. Now it ends here, so
      // something has to tell the customer it worked — an empty cart and no
      // message reads as a form that silently failed.
      setPlaced(true);
    } catch {
      push(t.orderFailed, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-slate-100 pb-28">
      <ShopHeader shop={shop} locale={locale} onLocaleChange={changeLocale} payLabel={t.payViaUpi} />

      {/* One column of controls above one grid of items, at every width — the
          same shape the rest of the product uses. Only the number of items in a
          row changes with the screen. */}
      <main className="mx-auto max-w-6xl px-4 py-4 lg:py-6">
        {items.length === 0 ? (
          <EmptyState title={t.emptyShop} hint={t.emptyShopHint} />
        ) : (
          <>
            {/* Search stays the full width of the menu it filters, and pins
                directly beneath the brand bar so it is still there ten items
                down. `top` clears that bar rather than hiding behind it. */}
            <div className="sticky top-[3.25rem] z-10 -mx-4 bg-slate-100/95 px-4 pb-2 pt-3 backdrop-blur">
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.search}
                aria-label={t.search}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base placeholder:text-slate-400 focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-brand-600"
              />

              {categories.length > 0 && (
                <div className="mt-2 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
                  {[
                    { value: '', label: t.all },
                    // The value stays the stored category so filtering still
                    // works; only what the shopper reads is translated.
                    ...categories.map((c) => ({ value: c, label: translateCategory(c, locale) })),
                  ].map(
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

            {/* Matched against the whole menu, not the filtered view — a
                shopper speaking an item should never be blocked by a search
                term still sitting in the box. */}
            <VoiceOrder items={items} locale={locale} onAdd={addQuantity} />

            {/* Offered only while the cart is empty — once a shopper has begun
                choosing, suggesting they start over is noise. */}
            {totalItems === 0 && (
              <RepeatOrder
                slug={shop.slug}
                items={items}
                locale={locale}
                onRepeat={(lines) => {
                  for (const line of lines) addQuantity(line.id, line.quantity);
                }}
              />
            )}

            {visibleItems.length === 0 ? (
              <div className="pt-6">
                <EmptyState title={t.noResults} />
              </div>
            ) : (
              /* Two across from a tablet, three from a laptop. Cards any
                 narrower than this and the price, the unit and the stock badge
                 start stacking on top of each other. */
              <ul className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
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
          Powered by{' '}
          <Link href="/" className="font-medium text-slate-500 underline hover:text-brand-700">
            DukaanFlow
          </Link>{' '}
          · Scan → Select → WhatsApp
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
        deliveryEnabled={shop.deliveryEnabled}
      />

      <Modal
        open={placed}
        title={t.orderPlacedTitle}
        tone="success"
        onClose={() => setPlaced(false)}
        footer={
          <Button onClick={() => setPlaced(false)} data-autofocus>
            {t.orderPlacedDone}
          </Button>
        }
      >
        {t.orderPlacedHint}
      </Modal>
    </div>
  );
}
