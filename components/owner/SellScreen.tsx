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

import { toAsciiDigits } from '@/lib/digits';
import { SearchIcon } from '@/components/ui/Icon';
import { EmptyState } from '@/components/ui/EmptyState';
import { ItemCard, itemName, sellsAnyAmount } from '@/components/customer/ItemCard';
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
import { formatPaise, linePaise } from '@/lib/money';
import { MOST_PER_LINE, roundQuantity } from '@/lib/units';
import { CloseIcon, MicIcon } from '@/components/ui/Icon';
import { ownerDict } from '@/lib/owner-i18n';
import { dict } from '@/lib/i18n';
import { matchesSearch, searchRank, spokenSearchText, translateCategory } from '@/lib/speech';
import { isValidMobile } from '@/lib/validators';
import type { VoiceLang } from '@/lib/speech';
import { speak, useVoice } from '@/components/voice/useVoice';
import { useScrolled } from '@/components/ui/useScrolled';
import { spokenSaleTotal } from '@/lib/spoken-money';
import { BillCard, type BillCustomer } from './BillCard';
import { ShortStockModal } from './ShortStockModal';
import { formatDay } from '@/lib/time';
import type { Bill } from '@/lib/bill-pdf';
import type { Locale } from '@/lib/i18n';

/** The shop's language, as the synthesiser names it. */
const RECOGNITION_LANG: Record<Locale, VoiceLang> = {
  en: 'en-IN',
  hi: 'hi-IN',
  bn: 'bn-IN',
};

export type SellItem = {
  id: string;
  name: string;
  nameBn: string;
  nameHi: string;
  pricePaise: number;
  /** Has a human chosen this price, or is it still the Re 1 placeholder? */
  priced: boolean;
  unit: string;
  category: string;
  /** The shop's saved word on this item when it runs out — see `Item.backOn`. */
  backOn?: string;
  stockNote?: string;
  inStock: boolean;
  /**
   * How many are left, or null where nobody is counting.
   *
   * The till shows the same "only 2 left" badge the shop page does, because
   * the owner ringing something up at the counter is the person best placed to
   * notice the count has drifted from the shelf — and worst served by finding
   * out from a customer.
   */
  stockQty: number | null;
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
  /**
   * SEARCHING BY SAYING THE THING'S NAME.
   *
   * It writes what it heard into `query` — the same box the keyboard writes
   * into — so the owner can see it, correct a word, or clear it. A voice search
   * that filters without showing what it thought it heard is one nobody trusts
   * a second time, and on this grid a wrong match is a wrong item rung up.
   *
   * No parsing and no matching of its own: `matchesSearch` already does that
   * over the typed query, and giving speech a second, cleverer path would be
   * two behaviours to keep in step.
   */
  /** Whether the sticky strip is floating over the list yet — see `useScrolled`. */
  const pageScrolled = useScrolled();

  const voiceSearch = useVoice({
    lang: RECOGNITION_LANG[locale],
    // `onPhrase` hands over the recogniser's alternatives, best first — the
    // same shape `resolveSpokenItem` takes. The first is what it is most
    // confident of, and that is what belongs in a box the owner can then edit.
    // What was heard, resolved against this shop's own items — see
    // `spokenSearchText`. The raw first guess used to go in as it was, and a
    // misheard spelling found nothing.
    onPhrase: (alternatives) =>
      setQuery(spokenSearchText(alternatives, sellable, (item) => itemName(item, locale))),
  });
  const [category, setCategory] = useState('');
  const [khata, setKhata] = useState<{ name: string; phone: string; area: string } | null>(null);
  /**
   * The field the last rejected sale named, and what it said about it. Null is
   * the normal state; see the error handling in `record`.
   */
  const [saleError, setSaleError] = useState<{ field: string; message: string } | null>(null);
  /**
   * The sale just recorded, kept only so a bill can be offered for it.
   *
   * Cleared the moment the next sale starts — see `record` — because a card
   * still offering the previous customer's bill is how the wrong bill gets
   * sent to the right number.
   */
  const [lastBill, setLastBill] = useState<Bill | null>(null);
  /** Who the bill popup opens filled in for: the khata customer, when there is one. */
  const [billCustomer, setBillCustomer] = useState<BillCustomer | null>(null);

  /** The item whose shelf just ran out under a sale, if the modal is open. */
  const [short, setShort] = useState<SellItem | null>(null);
  /**
   * Items the customer asked for that the shop does not have, and the day each
   * is back, "2026-09-26". Printed on this sale's bill beside the item's name,
   * then cleared with the basket.
   */
  const [unavailable, setUnavailable] = useState<Record<string, string>>({});

  function unavailableNote(isoDate: string): string {
    return `${t.billNotAvailable} ${formatDay(new Date(`${isoDate}T12:00:00+05:30`))}`;
  }

  /**
   * What the shop can actually sell: in stock, and priced by a human.
   *
   * The `priced` half was missing, and it was expensive. Items added by voice,
   * by photograph or from the starter catalogue land at a placeholder of Re 1
   * with `priced: false`; the customer's page hides those, and the till was
   * showing them at ₹1 and would ring one up at ₹1. A shopkeeper who taps
   * "Rice" during a rush and takes a rupee for it has been failed by the
   * screen, and the shop's own till disagreed with its shop page about what
   * was even for sale.
   */
  const sellable = useMemo(
    () => items.filter((item) => item.inStock && item.priced),
    [items],
  );

  const categories = useMemo(
    () => Array.from(new Set(sellable.map((item) => item.category).filter(Boolean))).sort(),
    [sellable],
  );

  // The shop page's own search: all three names, and spelling-tolerant, so
  // "ata" finds "Atta" while a customer is waiting.
  /**
   * The items the voice order just named, most recent first. They go to the
   * top of the grid, so after saying "two rice and a Bingo" the owner sees
   * those cards, with their counts, without scrolling to find them.
   */
  const [spoken, setSpoken] = useState<string[]>([]);

  const visible = useMemo(() => {
    const shown = sellable.filter((item) => {
      if (category && item.category !== category) return false;
      return matchesSearch([item.name, item.nameBn, item.nameHi, item.unit, item.category], query);
    });
    const spokenAt = (id: string) => {
      const index = spoken.indexOf(id);
      return index < 0 ? Number.POSITIVE_INFINITY : index;
    };
    // Spoken first, then the best search matches first; otherwise the
    // catalogue's own order, which the sort keeps for ties.
    return shown
      .map((item, index) => ({ item, index }))
      .sort(
        (a, b) =>
          spokenAt(a.item.id) - spokenAt(b.item.id) ||
          searchRank([a.item.name, a.item.nameBn, a.item.nameHi], query) -
            searchRank([b.item.name, b.item.nameBn, b.item.nameHi], query) ||
          a.index - b.index,
      )
      .map(({ item }) => item);
  }, [sellable, query, category, spoken]);

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
          // The till weighs things out too: the owner selling fifty grams of
          // posto across the counter gets the same amount picker the customer
          // gets on the shop page.
          loose: sellsAnyAmount(item),
        })),
    [sellable, cart, locale],
  );

  // Rounded per line, never per total: see `linePaise`.
  const totalPaise = lines.reduce(
    (sum, line) => sum + linePaise(line.item.pricePaise, line.quantity),
    0,
  );

  /**
   * What the customer standing here owes.
   *
   * The order's own total in order mode — goods plus whatever was quoted for
   * delivery, worked out by the server when the order was placed or last cut
   * down. The till must never re-price an order from its current shelf prices:
   * the snapshot is what the customer agreed to.
   */
  const payablePaise = totalPaise;

  /**
   * What the mic just heard, put on the till.
   *
   * The same rule the shop page follows: an amount said out loud ("800 g",
   * "two packets") is a statement of the total wanted and REPLACES the line,
   * while a bare item name is "one more of these" and adds. Adding an explicit
   * amount to what was already there is how "800 g" became 1.3 kg.
   */
  function applyVoice(id: string, quantity: number, mode: 'set' | 'add') {
    if (mode === 'set') setQuantity(id, quantity);
    else addQuantity(id, quantity);
    // To the top of the grid, and the grid into view, so what was just said
    // is what the owner is looking at.
    setSpoken((current) => [id, ...current.filter((other) => other !== id)]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * THE ONE PLACE THE TILL CHECKS THE SHELF.
   *
   * The out-of-stock modal used to hang off the card's + alone, so every other
   * way of changing a quantity walked straight past it: the basket drawer's +,
   * a number typed into the drawer, the voice order. The owner put nine
   * Kurkure in a basket with seven on the shelf and was never asked. Every
   * change now comes through here: a counted item is held at what the shelf
   * has, and asking for more opens the modal (add stock now, or tell the
   * customer when it is back). Uncounted items are not limited.
   */
  function withinStock(id: string, wanted: number): number {
    const item = sellable.find((candidate) => candidate.id === id);
    if (!item || item.stockQty === null) return wanted;
    const have = Math.max(item.stockQty, 0);
    if (wanted <= have) return wanted;
    setShort(item);
    return have;
  }

  /** Relative — saying "rice" twice means two of them. */
  function addQuantity(id: string, more: number) {
    const target = withinStock(id, roundQuantity((cart[id] ?? 0) + more));
    setCart((current) => {
      const updated = { ...current };
      if (target <= 0) delete updated[id];
      else updated[id] = Math.min(target, MOST_PER_LINE);
      return updated;
    });
  }

  function setQuantity(id: string, requested: number) {
    const next = withinStock(id, requested);
    setCart((current) => {
      const updated = { ...current };
      // Thousandths, so a weighed amount survives the round trip exactly as
      // the shop page's basket does.
      if (next <= 0) delete updated[id];
      else updated[id] = Math.min(roundQuantity(next), MOST_PER_LINE);
      return updated;
    });
  }

  async function record(paymentMode: 'CASH' | 'UPI' | 'KHATA') {
    if (paymentMode === 'KHATA' && !khata?.phone) return;
    // The previous customer's bill goes the moment this sale starts, not when
    // it finishes — a failed save must not leave the old one sitting there
    // looking like it belongs to the sale the owner just tried to make.
    setLastBill(null);
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
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        errors?: Record<string, string>;
      };

      if (handledExpiredSession({ response, slug, t, push })) return;
      if (!response.ok) {
        /**
         * THE REASON, NOT "PLEASE CHECK THE HIGHLIGHTED FIELDS".
         *
         * `invalid()` answers every rejected save with that sentence in
         * `error` and the actual problem in `errors` — and this read only
         * `error`. So an owner recording udhaar against a number the server
         * would not take was told to check the highlighted fields, nothing was
         * highlighted, and the one sentence that said what was wrong ("Enter a
         * valid 10-digit mobile number") was parsed and thrown away.
         *
         * A message promising a highlight that does not exist is worse than
         * the bare failure: the owner reads it, looks for the red box, finds
         * none, and concludes the app is broken. Which, at that moment, it is.
         */
        // Today's cash was never entered (or the day rolled over mid-sale):
        // the page reloads into the cash box. See `lib/cash-day.ts`.
        if (payload.errors?.openingPaise === 'required') {
          push(t.cashRequired, 'error');
          router.refresh();
          return;
        }
        const fields = Object.entries(payload.errors ?? {});
        const [field, message] = fields[0] ?? [];
        if (field) setSaleError({ field, message: message ?? '' });
        push(message ?? payload.error ?? t.networkError, 'error');
        return;
      }

      setSaleError(null);

      /**
       * SAY THE TOTAL, BEFORE THE BASKET IS EMPTIED.
       *
       * `totalPaise` is derived from the cart, and the next line clears it — so
       * the number has to be taken now or the phone announces zero.
       *
       * A toast says the sale was recorded; it does not say how much, and an
       * owner who cannot read it learns nothing from a green bar. The one thing
       * they need at this moment is the figure to ask the customer for, and it
       * is the same figure whether or not they can read.
       */
      const settled = totalPaise;

      /**
       * THE BILL'S SNAPSHOT, TAKEN BEFORE THE BASKET IS EMPTIED.
       *
       * Same trap as `settled` immediately above: `lines` is derived from the
       * cart and the next statement clears it, so a bill built afterwards would
       * be an empty one. Copied rather than referenced for the same reason —
       * these are the items as they were sold, and nothing that happens at the
       * till afterwards may edit them.
       */
      setLastBill({
        shopName,
        lines: [
          ...lines.map((line) => ({
            name: itemName(line.item, locale),
            unit: line.item.unit,
            quantity: line.quantity,
            amountPaise: linePaise(line.item.pricePaise, line.quantity),
            ...(unavailable[line.item.id]
              ? { note: unavailableNote(unavailable[line.item.id]!) }
              : {}),
          })),
          // Asked for, none sold: still on the bill, so the date goes home
          // with the customer.
          ...Object.entries(unavailable)
            .filter(([id]) => !lines.some((line) => line.item.id === id))
            .flatMap(([id, isoDate]) => {
              const item = sellable.find((candidate) => candidate.id === id);
              return item
                ? [
                    {
                      name: itemName(item, locale),
                      unit: item.unit,
                      quantity: 0,
                      amountPaise: 0,
                      note: unavailableNote(isoDate),
                    },
                  ]
                : [];
            }),
        ],
        totalPaise: settled,
        paymentMode,
        at: new Date(),
        ...(paymentMode === 'KHATA' && khata?.name ? { customerName: khata.name } : {}),
      });

      setBillCustomer(paymentMode === 'KHATA' && khata ? { name: khata.name, phone: khata.phone, area: khata.area } : null);
      setCart({});
      setUnavailable({});
      setSpoken([]);
      setPaying(false);
      setKhata(null);
      push(t.sellRecorded, 'success');
      speak(spokenSaleTotal(locale, settled), RECOGNITION_LANG[locale]);
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
      {/* THE BILL FOR THE SALE JUST MADE, AND THE ONE EXCEPTION TO THE RULE
          DIRECTLY ABOVE. Nothing sits over this grid, because what used to sit
          there was yesterday's news between an owner and the buttons they came
          to press. This is the opposite of that: it is about the customer still
          standing at the counter, it exists for the seconds between taking the
          money and them walking away, and it removes itself on dismissal or on
          the next sale. A card that outlived either would be exactly the kind
          of thing that rule is there to keep off this screen. */}
      <ShortStockModal
        item={short}
        slug={slug}
        locale={locale}
        onClose={() => setShort(null)}
        onStockAdded={(item) => {
          setShort(null);
          // The count is saved; one more goes in, which is what the owner was
          // reaching for.
          setCart((current) => ({
            ...current,
            [item.id]: Math.min(roundQuantity((current[item.id] ?? 0) + 1), MOST_PER_LINE),
          }));
          router.refresh();
        }}
        onNoted={(item, isoDate) => {
          setShort(null);
          setUnavailable((current) => ({ ...current, [item.id]: isoDate }));
          push(`${itemName(item, locale)} · ${unavailableNote(isoDate)}`, 'success');
        }}
      />

      {lastBill && (
        <BillCard
          bill={lastBill}
          slug={slug}
          t={t}
          customer={billCustomer}
          known={customers.map((entry) => ({ name: entry.name, phone: entry.phone, area: entry.area }))}
          onDone={() => setLastBill(null)}
          onError={(message) => push(message, 'error')}
          onSent={(message) => push(message, 'success')}
        />
      )}

      {sellable.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-card p-4 text-center text-sm text-slate-500">
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
            <div
              className={clsx(
                '-mx-4 bg-ground/95 px-4 pb-2 pt-3 backdrop-blur',
                'sticky top-[var(--sticky-top,0px)] z-10',
              )}
            >
              {/* AN iOS-SHAPED FIELD: a soft grey fill and NO BORDER.
                  It was a white box with a slate hairline — the shape a web
                  form has had for twenty years, and on a tinted page a white
                  box reads as a hole rather than as a field. A translucent
                  black fill at 6% is the treatment every phone keyboard, every
                  iOS search bar and every app these owners already use puts on
                  a search box: the FILL is the field, and it darkens rather
                  than outlines on focus.

                  Translucent rather than a fixed grey so it sits correctly on
                  whatever surface it lands on — the till's page and the
                  shopper's are not the same colour.

                  A FLEX ROW, NOT THREE ABSOLUTELY-POSITIONED THINGS.
                  The magnifier was pinned left and the mic pinned right
                  inside a `relative` box, and the mic landed on top of the
                  magnifier — an absolute child whose offset does not resolve
                  falls back to its static position, which put it at the left
                  edge under the icon already there. A row cannot do that:
                  each part takes its own space in order, and the field grows
                  between them.

                  The border moved to the row, so the whole thing lights up
                  on focus rather than just the input inside it. */}
              {sellable.length >= SEARCH_FROM && (
                <div className={clsx(
                    // AT REST IT IS PART OF THE PAGE; PINNED IT IS AN OBJECT.
                    // A soft tint of the ground is right while the field sits
                    // on the ground — it is quiet and it belongs. The moment the
                    // strip is floating over a moving list, that same tint is
                    // translucent grey with cards sliding under it, and the
                    // field stops looking like a field. So it solidifies: an
                    // opaque surface with an edge and a lift.
                    'flex items-center gap-2 rounded-xl pl-3 pr-1.5 transition-[background-color,box-shadow] duration-200',
                    pageScrolled
                      ? 'bg-card shadow-raised ring-1 ring-slate-300/70'
                      : 'bg-slate-900/[.06] focus-within:bg-slate-900/[.09]',
                  )}>
                  <SearchIcon className="pointer-events-none h-[18px] w-[18px] shrink-0 text-slate-500" />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t.searchItems}
                    aria-label={t.searchItems}
                    className="min-w-0 flex-1 bg-transparent py-2 text-base text-slate-900 placeholder:text-slate-500 focus:outline-none"
                  />
                  {/* FINDING A THING BY SAYING ITS NAME.
                      Typing "ছোলার ডাল" on a phone keyboard is the slowest
                      thing on this screen, and the owner this product is for is
                      often the one least able to do it quickly. The mic writes
                      into the SAME query box rather than doing anything of its
                      own, so what it heard is visible, editable and clearable —
                      a voice search that acts without showing its work is one
                      nobody trusts twice.

                      On the right, where a control belongs: the left of a
                      search field is where its icon lives, and two glyphs
                      stacked in one corner is what the previous attempt did.

                      Only rendered where the browser has speech at all. */}
                  {voiceSearch.supported && (
                    <button
                      type="button"
                      onClick={voiceSearch.toggle}
                      // Its own name: it used to share the search box's, so a
                      // screen reader heard two identical "search items".
                      aria-label={dict(locale).searchByVoice}
                      aria-pressed={voiceSearch.listening}
                      className={clsx(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition',
                        voiceSearch.listening
                          ? 'bg-red-500 text-white'
                          : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700',
                      )}
                    >
                      <MicIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              )}

              {/* THE CATEGORY CHIPS ARE GONE, BY REQUEST.
                  They sat under the search box and narrowed the grid by
                  "চাল-আটা", "ডাল" and so on. Search does the same job in one
                  gesture and without a horizontal scroll nobody discovers, and
                  the mic now means an owner can narrow the list by saying the
                  thing's name.

                  `category` and `categories` are still computed and still
                  filter `visible` — nothing in the data path changed — so
                  putting the row back is putting this block back. */}
            </div>
          )}

          {/* What this sale's bill will tell the customer is not here today.
              Removable, in case it was noted on the wrong item. */}
          {Object.keys(unavailable).length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-semibold text-amber-900">{t.shortNotedTitle}</p>
              <ul className="mt-1 space-y-1">
                {Object.entries(unavailable).map(([id, isoDate]) => {
                  const item = sellable.find((candidate) => candidate.id === id);
                  if (!item) return null;
                  return (
                    <li key={id} className="flex items-center gap-2 text-sm text-amber-900">
                      <span className="min-w-0 flex-1 truncate">
                        {itemName(item, locale)} — {unavailableNote(isoDate)}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setUnavailable((current) => {
                            const next = { ...current };
                            delete next[id];
                            return next;
                          })
                        }
                        aria-label={`${t.delete} — ${itemName(item, locale)}`}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-amber-800 hover:bg-amber-100"
                      >
                        <CloseIcon className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
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
                  onBeyondStock={() => setShort(item)}
                  locale={locale}
                  // The till shows what is left on every counted row, not just
                  // the ones running out. This is the screen the shop sells
                  // from, and the figure moves under the owner all day as
                  // orders come in off the shop page.
                  showStock
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
          className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-t-2xl bg-card p-5 sm:rounded-2xl">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-slate-900">{t.sellTakePayment}</h3>
              <p className="ml-auto text-2xl font-semibold tabular-nums text-brand-700">
                {formatPaise(payablePaise)}
              </p>
              <button
                type="button"
                onClick={() => setPaying(false)}
                aria-label={t.no}
                className="-mr-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            {/* A generated QR carries the amount, so the customer confirms
                rather than types — that beats the shop's static printed code,
                which is kept only as the fallback when there is no UPI ID. */}
            {upiId ? (
              <div className="mt-4 flex flex-col items-center gap-2 rounded-xl bg-sunk p-4">
                <QRCodeCanvas
                  value={upiPayUrlWithAmount(upiId, shopName, payablePaise)}
                  size={168}
                  includeMargin
                  level="M"
                />
                <p className="text-sm text-slate-600">{t.sellScanToPay}</p>
              </div>
            ) : upiQrData ? (
              <div className="mt-4 flex flex-col items-center gap-2 rounded-xl bg-sunk p-4">
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
                // Same weight as Cash: a filled UPI read as the default choice.
                className="h-12 rounded-xl border border-slate-300 font-semibold text-slate-800 disabled:opacity-50"
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

            {khata && (() => {
              /**
               * Red only once the owner has given a whole number's worth of
               * digits, or once the server has actually complained about this
               * one. Colouring the box on the first keystroke marks every
               * number as wrong while it is being typed, which is the app
               * arguing with somebody who has not finished talking.
               */
              const typed = toAsciiDigits(khata.phone).replace(/\D/g, '');
              const phoneRejected =
                saleError?.field === 'customerPhone' ||
                (typed.length >= 10 && !isValidMobile(khata.phone));

              return (
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
                    className="col-span-2 rounded-lg border border-amber-300 bg-card px-3 py-2 text-base"
                  />
                  <input
                    value={khata.name}
                    onChange={(event) => setKhata({ ...khata, name: event.target.value })}
                    placeholder={t.khataCustomer}
                    aria-label={t.khataCustomer}
                    className="rounded-lg border border-amber-300 bg-card px-3 py-2 text-base"
                  />
                  <input
                    value={khata.phone}
                    onChange={(event) => {
                      setKhata({ ...khata, phone: event.target.value });
                      // The complaint is about the number as it was; typing is
                      // the owner answering it.
                      if (saleError?.field === 'customerPhone') setSaleError(null);
                    }}
                    inputMode="numeric"
                    placeholder={t.khataPhone}
                    aria-label={t.khataPhone}
                    aria-invalid={phoneRejected || undefined}
                    className={clsx(
                      'rounded-lg border bg-card px-3 py-2 text-base',
                      phoneRejected ? 'border-red-500 ring-1 ring-red-500' : 'border-amber-300',
                    )}
                  />
                </div>

                {/* THE HIGHLIGHT THAT "PLEASE CHECK THE HIGHLIGHTED FIELDS"
                    was promising and never drew. Said in words under the box it
                    is about, because a red border alone tells an owner that
                    something is wrong with a number they can see nothing wrong
                    with — the rule (an Indian mobile starts 6-9) is not one
                    they can infer from a colour. */}
                {phoneRejected && (
                  <p className="mt-1.5 text-sm font-medium text-red-600">
                    {saleError?.message || t.khataPhoneInvalid}
                  </p>
                )}

                {/* Ten digits was never the rule. The server wants a real
                    Indian mobile, so the button asks the same question the
                    server will — a button that enables on a number the save is
                    going to refuse is the app telling the owner they are done
                    and then taking it back. */}
                <button
                  type="button"
                  disabled={saving || !isValidMobile(khata.phone)}
                  onClick={() => record('KHATA')}
                  className="mt-2 h-11 w-full rounded-xl bg-amber-600 font-semibold text-white disabled:opacity-50"
                >
                  {t.sellKhata} · {formatPaise(totalPaise)}
                </button>
              </div>
              );
            })()}

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
        {/* THE MIC IS HIDDEN ON THIS SCREEN, BY REQUEST.
            It used to fill the till basket by voice — "চাল এক কেজি".

            Hidden rather than deleted: `VoiceOrder`, `applyVoice` and `sellable`
            are all still here and still wired to each other, so restoring it is
            putting this one line back:

              <VoiceOrder items={sellable} locale={locale} onApply={applyVoice} />

            Note this removes the only voice route into a till sale, which is
            the one an owner who does not read uses — the khata and item mics
            are untouched and remain their own way in. */}

        {!cartOpen && (
          <CartBar
            // One per line: "0.05 items" is not a count anybody wants to read.
            totalItems={lines.length}
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
