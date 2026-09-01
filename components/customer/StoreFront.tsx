'use client';

import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { SearchIcon } from '@/components/ui/Icon';
import { ShopHeader, type ShopSummary } from './ShopHeader';
import { ItemCard, itemName, sellsAnyAmount, type CustomerItem } from './ItemCard';
import { CartBar } from './CartBar';
import { CartDrawer, type CartLine } from './CartDrawer';
import { CheckoutSheet, type CheckoutSubmit } from './CheckoutSheet';
import { VoiceOrder } from './VoiceOrder';
import { RepeatOrder, rememberOrder } from './RepeatOrder';
import { EmptyState } from '@/components/ui/EmptyState';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { dict, LOCALES, type Locale } from '@/lib/i18n';
import { matchesSearch, translateCategory } from '@/lib/speech';
import { roundQuantity } from '@/lib/units';
import { linePaise } from '@/lib/money';
import { quoteDelivery } from '@/lib/delivery';
import { rememberShop } from '@/lib/saved-shops';
import { OrderPlaced } from './OrderPlaced';
import { watchInstallPrompt } from '@/lib/install-prompt';
import { buildOfflineOrderMessage, buildWhatsAppUrl } from '@/lib/whatsapp';

const LOCALE_STORAGE_KEY = 'halkhata:locale';

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
const CUSTOMER_STORAGE_KEY = 'halkhata:customer';

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

/**
 * What is in the basket: item id → how much of it, in multiples of that item's
 * own unit.
 *
 * FRACTIONAL, since a pack size is a rate and not a minimum — 0.05 against a
 * kilo-priced item is the fifty grams of posto the customer asked for. See the
 * note at the head of `lib/units.ts`.
 */
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
  /** The order that just went through, so it can be tracked and followed. */
  const [placed, setPlaced] = useState<{
    orderId: string;
    orderType: 'DELIVERY' | 'PICKUP';
  } | null>(null);
  /**
   * The order that could not be sent, and the WhatsApp message that carries it
   * instead.
   *
   * A separate state from an error toast because it is not an error the shopper
   * can do anything about by trying harder. On one bar of 4G — which is where
   * this product lives — the basket they spent five minutes building has to go
   * somewhere, and WhatsApp is the thing that still works when nothing else
   * does.
   */
  const [offline, setOffline] = useState<{ url: string } | null>(null);
  const [remembered, setRemembered] = useState<RememberedCustomer | null>(null);
  /** Whether the details we prefilled were already on this phone. */
  const [wasRemembered, setWasRemembered] = useState(false);

  const t = dict(locale);

  useEffect(() => {
    const saved = readRemembered();
    setRemembered(saved);
    setWasRemembered(Boolean(saved));
  }, []);

  /**
   * Register the worker and start listening for the browser's install offer.
   *
   * On the shop page rather than in the card that uses it, because
   * `beforeinstallprompt` fires seconds after load and the card appears
   * minutes later, after an order. This is also what puts the offline copy of
   * the shop in place — a shopper on a bad signal needs it before they know
   * they need it, not after. See lib/install-prompt.ts.
   */
  useEffect(() => {
    watchInstallPrompt();
  }, []);

  // Remember the shopper's language across visits to any Halkhata shop.
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
        // ONE PER LINE, not the sum of the quantities. "0.05 items" is not a
        // number anybody wants on the basket button, and half a kilo of posto
        // plus a kilo of rice is two things in a bag either way.
        count += 1;
        amount += linePaise(item.pricePaise, quantity);
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
  /**
   * What delivery would cost this basket.
   *
   * Quoted for DELIVERY while the shopper is still choosing, because that is
   * what they are assumed to be doing until they say otherwise — and because
   * the charge and the minimum are facts they need BEFORE the checkout form,
   * not after it. The checkout re-quotes on the actual choice, and the server
   * quotes again and is the only one that counts.
   */
  const quote = useMemo(
    () =>
      quoteDelivery(shop, totalAmountPaise, shop.deliveryEnabled ? 'DELIVERY' : 'PICKUP'),
    [shop, totalAmountPaise],
  );

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
          loose: sellsAnyAmount(item),
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
    setCart((current) => ({
      ...current,
      [itemId]: Math.min(roundQuantity((current[itemId] ?? 0) + more), 99),
    }));
  }

  function setQuantity(itemId: string, next: number) {
    setCart((current) => {
      const updated = { ...current };
      // Rounded to the thousandth on the way in, so a fraction of a pack
      // arrives at the server exactly as it was shown to the shopper — and so
      // no float tail can survive into a price.
      if (next <= 0) delete updated[itemId];
      else updated[itemId] = Math.min(roundQuantity(next), 99);
      return updated;
    });
  }

  /**
   * Send the order, and try more than once before giving up.
   *
   * A single failed fetch on a weak signal is not an answer — it is one packet
   * lost between a phone and a tower, and trying again a second later usually
   * works. Only a network failure is retried: a 409 saying an item has sold out
   * is a real answer and repeating it would only make the shopper wait longer
   * to hear it.
   */
  async function postOrder(body: string): Promise<Response> {
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await fetch('/api/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        });
      } catch (error) {
        lastError = error;
        // Half a second, then a second and a half. Long enough to outlast a
        // handover between towers, short enough that nobody puts the phone
        // down.
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
    throw lastError;
  }

  async function placeOrder(values: CheckoutSubmit) {
    setSubmitting(true);
    try {
      const response = await postOrder(
        JSON.stringify({
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
      );

      const payload = (await response.json()) as { orderId?: string; error?: string };

      if (!response.ok || !payload.orderId) {
        push(payload.error ?? t.orderFailed, 'error');
        return;
      }

      // Remembered before the cart is cleared, so the next visit can offer it.
      rememberOrder(shop.slug, cart);

      // And the shop itself, so the customer can find it again from the front
      // page of this site without the QR sticker in front of them. See
      // lib/saved-shops.ts for why this is storage and not an account.
      rememberShop({ slug: shop.slug, name: shop.name });

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
      setPlaced({ orderId: payload.orderId, orderType: values.orderType });
    } catch {
      /**
       * Three tries and the network never answered.
       *
       * THE BASKET IS NOT THROWN AWAY. It stays exactly as it is, so the
       * shopper can try again the moment a bar comes back — and beside that,
       * the whole order as a WhatsApp message, which is the one channel that
       * still works on a signal this bad and the one every shop in this market
       * already runs on.
       *
       * No Order row exists for that path, and that is honest: the shop has
       * been told by a person, not by the app, and the shopkeeper will take it
       * the way they took orders before Halkhata. Losing the sale would be
       * the alternative.
       */
      setOffline({
        url: buildWhatsAppUrl(
          shop.phone,
          buildOfflineOrderMessage({
            shopName: shop.name,
            orderType: values.orderType,
            lines: cartLines.map((line) => ({
              name: line.label,
              unit: line.unit,
              pricePaise: line.pricePaise,
              quantity: line.quantity,
              amountPaise: linePaise(line.pricePaise, line.quantity),
            })),
            totalAmountPaise: totalAmountPaise,
            customerName: values.customerName,
            customerPhone: values.customerPhone,
            customerAddress: values.customerAddress,
          }),
        ),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    // No bottom padding of its own. It used to reserve 7rem for the floating
    // buttons, `main` reserved another 7rem, and the footer then added its own
    // — three separate guesses at the same clearance, stacked into a screen of
    // empty grey. The footer is the last thing on the page now, so it is the
    // one place that has to clear the mic.
    <div className="min-h-dvh bg-slate-100">
      <ShopHeader shop={shop} locale={locale} onLocaleChange={changeLocale} payLabel={t.payViaUpi} />

      {/* One column of controls above one grid of items, at every width — the
          same shape the rest of the product uses. Only the number of items in a
          row changes with the screen. */}
      {/* The basket floats OVER the menu and never reflows it. Reserving width
          for it moved every card sideways the moment it opened — the item the
          shopper was reaching for slid out from under their thumb, and the
          whole grid re-laid itself on each open and close. */}
      <main className="mx-auto max-w-6xl px-4 pb-4 pt-3">
        {/* The prices below may be the copy this phone saw last time. Nothing
            else on the page would say so, and a shopper deciding on a price
            deserves to know which one they are looking at. */}
        <div className="mb-2 empty:hidden">
          <OfflineBanner label={t.offlineTitle} />
        </div>

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

      </main>
      {/* "Powered by Halkhata" used to sit here, inside `main`, above the
          repeat-order panel — a footer in the middle of the page. It has moved
          to the real one, at the very bottom, beside the support details. */}

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

          WHEN THE BASKET IS OPEN THE MIC RISES OVER IT rather than moving.
          The basket is a panel down the right-hand edge and the mic sits in
          that same corner, so it was buried — a shopper could not speak an
          order while looking at what they had already ordered, which is
          exactly when they would. It was then made to step aside on a wide
          screen and hide on a narrow one, which was worse: the one control a
          shopper reaches for by muscle memory left its corner and crossed the
          page, or vanished. It stays put and floats above the panel instead —
          one fixed corner, whatever else is open. */}
      <div
        className={clsx(
          'pointer-events-none fixed inset-x-0 flex flex-col items-end gap-3 px-4 transition-[bottom]',
          // Above the drawer's own z-50 while it is open, and back below it
          // afterwards so nothing here sits over an ordinary page.
          //
          // It also RISES ABOVE THE TOTAL BAR rather than landing on top of
          // it: floating over the list is what the mic is for, floating over
          // the button that places the order is a mis-tap waiting to happen.
          cartOpen
            ? 'z-[60] bottom-[calc(5.25rem+env(safe-area-inset-bottom))]'
            : 'z-40 bottom-[calc(1rem+env(safe-area-inset-bottom))]',
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
        quote={quote}
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
        terms={shop}
        remembered={remembered}
      />

      {placed && (
        <OrderPlaced
          orderId={placed.orderId}
          shopSlug={shop.slug}
          orderType={placed.orderType}
          locale={locale}
          wasRemembered={wasRemembered}
          onClose={() => setPlaced(null)}
        />
      )}

      {/* THE SIGNAL WENT, AND THE BASKET DID NOT.
          Not a toast: this needs a decision, and the decision is worth the
          screen. The order is already written into a WhatsApp message behind
          the button — one tap and the shop has it, exactly as shops in this
          market have always received orders. */}
      <Modal
        open={offline !== null}
        title={t.offlineTitle}
        onClose={() => setOffline(null)}
        footer={
          <>
            <a
              href={offline?.url ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOffline(null)}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#25D366] px-4 text-sm font-semibold text-white"
            >
              {t.offlineWhatsApp}
            </a>
            <Button variant="secondary" onClick={() => setOffline(null)} data-autofocus>
              {t.back}
            </Button>
          </>
        }
      >
        {t.offlineBody}
      </Modal>
    </div>
  );
}
