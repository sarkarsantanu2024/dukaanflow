'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { SearchIcon } from '@/components/ui/Icon';
import { ShopHeader, type ShopSummary } from './ShopHeader';
import { ItemCard, itemName, type CustomerItem } from './ItemCard';
import { CartBar } from './CartBar';
import { CartDrawer, type CartLine } from './CartDrawer';
import { CheckoutSheet, type CheckoutSubmit } from './CheckoutSheet';
import { VoiceOrder } from './VoiceOrder';
import { RepeatOrder, rememberOrder } from './RepeatOrder';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { dict, LOCALES, type Locale } from '@/lib/i18n';
import { matchesSearch, translateCategory } from '@/lib/speech';

const LOCALE_STORAGE_KEY = 'dukaanflow:locale';

/**
 * What this phone told a shop last time.
 *
 * Kept per browser, not per shop: a customer's name, number and para do not
 * change between the kirana and the tea stall next door, and asking twice for
 * the same three facts is the friction that makes somebody give up and walk in
 * instead.
 *
 * Deliberately NOT a gate on the shop page. Demanding a phone number before
 * anybody can see a price would cost more orders than retyping ever did — the
 * whole appeal of a QR on a counter is that it opens straight onto the goods.
 * So the form stays where it was always needed, at checkout, and simply
 * arrives filled in.
 */
const CUSTOMER_STORAGE_KEY = 'dukaanflow:customer';

type RememberedCustomer = {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerArea: string;
};

function readRemembered(): RememberedCustomer | null {
  try {
    const raw = window.localStorage.getItem(CUSTOMER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RememberedCustomer>;
    // A phone number is the only field worth restoring on its own; without one
    // there is nothing here that saves anybody a keystroke.
    if (typeof parsed.customerPhone !== 'string' || !parsed.customerPhone) return null;
    return {
      customerName: parsed.customerName ?? '',
      customerPhone: parsed.customerPhone,
      customerAddress: parsed.customerAddress ?? '',
      customerArea: parsed.customerArea ?? '',
    };
  } catch {
    // Private browsing, cleared storage, or a value written by an older
    // version. Falling back to an empty form is always safe.
    return null;
  }
}

type Cart = Record<string, number>;

/**
 * How many items a shop needs before a search box earns its place on its page.
 */
const SEARCH_FROM = 15;

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
  const [cartOpen, setCartOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [remembered, setRemembered] = useState<RememberedCustomer | null>(null);
  /** Whether the details we prefilled were already on this phone. */
  const [wasRemembered, setWasRemembered] = useState(false);

  const t = dict(locale);

  useEffect(() => {
    const saved = readRemembered();
    setRemembered(saved);
    setWasRemembered(Boolean(saved));
  }, []);

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
    return items.filter((item) => {
      if (category && item.category !== category) return false;
      // All three names, and spelling-tolerant: "ata" has to find "Atta", and
      // "chawal" an item listed only as "Rice". See `matchesSearch`.
      return matchesSearch(
        [item.name, item.nameBn, item.nameHi, item.unit, item.category],
        query,
      );
    });
  }, [items, query, category]);

  const { totalItems, totalAmountPaise } = useMemo(() => {
    let count = 0;
    let amount = 0;
    for (const item of items) {
      const quantity = cart[item.id] ?? 0;
      if (quantity > 0) {
        count += quantity;
        amount += quantity * item.pricePaise;
      }
    }
    return { totalItems: count, totalAmountPaise: amount };
  }, [cart, items]);

  /**
   * What is in the basket, as lines to show.
   *
   * Built from `items` rather than from the cart's own keys so the order
   * matches the menu the shopper just scrolled — a basket that lists things in
   * the order they happened to be tapped is a basket they have to re-read.
   */
  const cartLines: CartLine[] = useMemo(
    () =>
      items
        .filter((item) => (cart[item.id] ?? 0) > 0)
        .map((item) => ({
          id: item.id,
          label: itemName(item, locale),
          unit: item.unit,
          quantity: cart[item.id]!,
          pricePaise: item.pricePaise,
        })),
    [items, cart, locale],
  );

  /**
   * ADDING SOMETHING NEVER OPENS THE BASKET.
   *
   * It used to, and it was wrong in the ordinary case: a shopper picking eight
   * things had a panel thrown over the menu on the first tap and then went on
   * choosing behind it, or closed it and had it come back. The count and total
   * on the floating button already say the tap registered, which is all the
   * feedback an add actually needs.
   *
   * The basket opens on the basket button, and closes only on its own close or
   * on checkout — nothing here opens or shuts it.
   */

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
          customerArea: values.customerArea,
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

      // And the person, so the next order needs no typing at all.
      try {
        const keep: RememberedCustomer = {
          customerName: values.customerName,
          customerPhone: values.customerPhone,
          customerAddress: values.customerAddress,
          customerArea: values.customerArea,
        };
        window.localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(keep));
        setRemembered(keep);
      } catch {
        // Storage refused. The order still went through, which is what matters.
      }

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
      {/* The basket floats OVER the menu and never reflows it. Reserving width
          for it moved every card sideways the moment it opened — the item the
          shopper was reaching for slid out from under their thumb, and the
          whole grid re-laid itself on each open and close. */}
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-4 lg:pt-6">
        {items.length === 0 ? (
          <EmptyState title={t.emptyShop} hint={t.emptyShopHint} />
        ) : (
          <>
            {/* FILTERS LIVE WITH THE LIST; ACTIONS FLOAT.
                That is the whole rule, and breaking it is what made the
                floating search box unusable. A search field parked in the
                empty space to the right of the grid has no visual
                relationship to the grid, so nothing on screen says what
                typing in it will do — the shopper has to guess. The mic and
                the basket float because they DO something; search and
                categories narrow what is below them, so they sit above it.

                Sticky, so both are still reachable ten items down. */}
            <div className="sticky top-[3.25rem] z-10 -mx-4 bg-slate-100/95 px-4 pb-2 pt-3 backdrop-blur">
              {/* SEARCH ONLY WHEN THERE IS SOMETHING TO SEARCH.
                  A shop with a dozen items fits in a screen and a half of
                  scrolling, which is faster than typing and needs nothing
                  explained. A search box over it solves a problem the shopper
                  does not have and asks them to work out why it is there.

                  Same rule the category chips below have always followed:
                  they hide themselves when there is only one category,
                  because a filter that cannot change anything reads as
                  broken rather than as absent. */}
              {items.length >= SEARCH_FROM && (
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t.search}
                  aria-label={t.search}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-base placeholder:text-slate-400 focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-brand-600"
                />
              </div>
              )}

              {/* Two chips are needed before there is a choice to make. With a
                  single category, "All" and that category list exactly the same
                  items, so the row is a control that cannot change anything —
                  which reads as broken rather than as absent. */}
              {categories.length > 1 && (
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

            {/* What the search actually did. Without this a shopper who typed
                a stray letter sees a short list and no reason for it. */}
            {query.trim() !== '' && visibleItems.length > 0 && (
              <p className="mt-2 text-sm text-slate-500">
                {visibleItems.length} / {items.length}
              </p>
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

        {/* Below the menu, not above it. This is what the shopper bought LAST
            time; the shop's actual list is what they came for, and a panel
            offering four old items was standing between them and it. Folded
            shut as well, so it is an answer to a question the shopper can ask
            rather than one asked of them on arrival.

            Still only while the basket is empty — once they have begun
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

        <p className="mt-8 text-center text-xs text-slate-400">
          Powered by{' '}
          <Link href="/" className="font-medium text-slate-500 underline hover:text-brand-700">
            DukaanFlow
          </Link>{' '}
          · Scan → Select → Order
        </p>
      </main>

      {/* Everything a shopper reaches for, in the one corner their thumb
          already rests in.

          Two things only — speak an order, and open the basket. Both DO
          something; search and categories only narrow the list, so they live
          above the list instead.

          The wrapper is `pointer-events-none` and only the buttons themselves
          take a click, so the gaps between them are still the live page — a
          fixed box here once swallowed taps and left a card underneath
          refusing to respond. `main` also carries enough bottom padding that
          the last card scrolls clear rather than living under the stack.

          WHEN THE BASKET IS OPEN the stack steps aside for it. The basket is a
          panel down the right-hand edge and the mic sits in that same corner,
          so it was simply buried — a shopper could not speak an order while
          looking at what they had already ordered, which is exactly when they
          would. On a phone the panel takes the screen, so there is nowhere to
          step aside to and the stack waits instead. */}
      <div
        className={clsx(
          'pointer-events-none fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 flex flex-col items-end gap-3 px-4 transition-[padding]',
          cartOpen && 'hidden lg:flex lg:pr-[29rem]',
        )}
      >
          <VoiceOrder items={items} locale={locale} onAdd={addQuantity} />

          {!cartOpen && (
            <CartBar
              totalItems={totalItems}
              totalAmountPaise={totalAmountPaise}
              onReview={() => setCartOpen(true)}
              locale={locale}
            />
          )}
      </div>

      <CartDrawer
        open={cartOpen}
        lines={cartLines}
        totalPaise={totalAmountPaise}
        locale={locale}
        onClose={() => setCartOpen(false)}
        onSetQuantity={setQuantity}
        onClear={() => setCart({})}
        onContinue={() => setCheckoutOpen(true)}
      />

      <CheckoutSheet
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSubmit={placeOrder}
        submitting={submitting}
        totalItems={totalItems}
        totalAmountPaise={totalAmountPaise}
        locale={locale}
        deliveryEnabled={shop.deliveryEnabled}
        remembered={remembered}
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
        {!wasRemembered && (
          <span className="mt-2 block text-slate-500">{t.savedForNextTime}</span>
        )}
      </Modal>
    </div>
  );
}
