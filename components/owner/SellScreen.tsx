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
 *
 * ORDER MODE — THE SHOPKEEPER WHO IS ALSO THE PACKER.
 *
 * A shop with nobody to help had to read an order on the Orders tab and pick
 * the goods off this grid, which is a tab switch per line: over to remember the
 * next item, back to find it, over again. So an order can be carried here, and
 * while one is loaded this screen packs and settles that order instead of
 * ringing up a new sale.
 *
 * IT DOES NOT WRITE A `Sale`, AND THAT IS THE WHOLE SAFETY ARGUMENT. An order
 * already took its stock when it was placed (`app/api/order/route.ts`), and the
 * reports add `Order` and `Sale` rows together (`lib/analytics.ts`), so a till
 * that recorded a counter sale for an order would count the money twice, take
 * the stock twice, and — unpaid — owe it to the khata twice. One order is one
 * record, and that record is always the `Order` row: the payment buttons below
 * PATCH the order, exactly as the buttons on its card do.
 *
 * For the same reason the grid is inert while an order is loaded. Two baskets
 * on one screen, one of which must not be sold, is the mistake waiting to
 * happen; the owner leaves the order first, which is one tap.
 */

import { SearchIcon } from '@/components/ui/Icon';
import { EmptyState } from '@/components/ui/EmptyState';
import { ItemCard, itemName, sellsAnyAmount } from '@/components/customer/ItemCard';
import { VoiceOrder } from '@/components/customer/VoiceOrder';
import { CartBar } from '@/components/customer/CartBar';
import { CartDrawer, type CartLine } from '@/components/customer/CartDrawer';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { handledExpiredSession } from './sessionGuard';
import clsx from 'clsx';
import { QRCodeCanvas } from 'qrcode.react';
import { upiPayUrlWithAmount } from '@/lib/qr';
import { useToast } from '@/components/ui/Toast';
import { formatPaise, linePaise } from '@/lib/money';
import { amountLabel, isLooseUnit, MOST_PER_LINE, roundQuantity } from '@/lib/units';
import { CheckIcon, PinIcon } from '@/components/ui/Icon';
import type { SnapshotLine } from '@/lib/order-snapshot';
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
  /** Has a human chosen this price, or is it still the Re 1 placeholder? */
  priced: boolean;
  unit: string;
  category: string;
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

/**
 * An order carried over from the queue, already checked on the server: it
 * belongs to this shop and is still one of NEW, CONFIRMED or READY.
 */
export type TillOrder = {
  id: string;
  customerName: string;
  customerPhone: string;
  orderType: 'DELIVERY' | 'PICKUP';
  /** Goods plus delivery — what the customer owes, and what the QR will carry. */
  totalAmountPaise: number;
  deliveryFeePaise: number;
  lines: SnapshotLine[];
};

type Cart = Record<string, number>;

/** An order line in the owner's language, falling back to the primary name. */
function lineName(line: SnapshotLine, locale: Locale): string {
  if (locale === 'bn') return line.nameBn || line.name;
  if (locale === 'hi') return line.nameHi || line.name;
  return line.name;
}

/**
 * How much of a line, as the person weighing it out needs to read it.
 *
 * "× 0.05" cannot be put on a scale. Only counted goods keep a multiplier —
 * the same rule the orders queue follows.
 */
function packAmount(line: SnapshotLine): string {
  return amountLabel(line.unit, line.quantity) ?? `× ${line.quantity}`;
}

/**
 * A stable key for one line of an order.
 *
 * The index is in it because `itemId` is blank on orders taken before the
 * snapshot carried one, and two such lines would otherwise share a tick.
 */
function lineKey(line: SnapshotLine, index: number): string {
  return `${line.itemId}#${index}`;
}

/** Where a half-packed order's ticks live between reloads. */
function packedStorageKey(orderId: string): string {
  return `halkhata:packed:${orderId}`;
}

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
  tillOrder = null,
}: {
  slug: string;
  shopName: string;
  upiId: string;
  upiQrData: string;
  items: SellItem[];
  locale: Locale;
  /** Regulars already in the khata, so udhaar is a tap not a typing job. */
  customers: { id: string; name: string; phone: string; area: string }[];
  /**
   * The order being packed at the till, or null for an ordinary counter sale.
   *
   * Null is the normal state and the one everything below still behaves as it
   * always did — see ORDER MODE at the top of this file.
   */
  tillOrder?: TillOrder | null;
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

  /**
   * Which lines of the loaded order are already in the bag.
   *
   * Kept in the browser, not the database. It is a note to the one person
   * holding the phone for the two minutes a packing job lasts, nobody else ever
   * needs to read it, and a column for it would be a column to purge later.
   *
   * It does survive a reload, though, because this screen reloads itself: the
   * PWA can be killed by the phone mid-pack, and an owner four items into seven
   * who came back to seven empty boxes would simply stop ticking them.
   */
  const [packed, setPacked] = useState<Record<string, boolean>>({});

  // Keyed on the id, not the order object: this screen re-renders from the
  // server on every refresh, and reloading the ticks each time would undo one
  // the owner had just made on a phone that cannot write to storage.
  const tillOrderId = tillOrder?.id ?? null;
  useEffect(() => {
    if (!tillOrderId) return;
    try {
      const saved = window.localStorage.getItem(packedStorageKey(tillOrderId));
      setPacked(saved ? (JSON.parse(saved) as Record<string, boolean>) : {});
    } catch {
      // A phone with storage blocked packs without ticks rather than not at all.
      setPacked({});
    }
  }, [tillOrderId]);

  function togglePacked(key: string) {
    setPacked((current) => {
      const next = { ...current, [key]: !current[key] };
      if (!next[key]) delete next[key];
      if (tillOrder) {
        try {
          window.localStorage.setItem(packedStorageKey(tillOrder.id), JSON.stringify(next));
        } catch {
          // See above — the tick still works for this visit.
        }
      }
      return next;
    });
  }

  const packedCount = tillOrder
    ? tillOrder.lines.filter((line, index) => packed[lineKey(line, index)]).length
    : 0;
  const allPacked = tillOrder !== null && packedCount === tillOrder.lines.length;

  /** Back to an ordinary till, leaving the order exactly where it was. */
  function leaveOrder() {
    setPaying(false);
    router.replace(`/owner/${slug}/sell`);
  }

  /**
   * A tap on the grid while an order is loaded.
   *
   * It says why rather than doing nothing: a button that ignores you is a
   * broken button, and the owner's next move is to tap it harder.
   */
  function lockedByOrder(): boolean {
    if (!tillOrder) return false;
    push(t.orderTillLocked, 'error');
    return true;
  }

  /**
   * Move the loaded order along — packed, or done and paid.
   *
   * THIS IS THE ONLY WAY MONEY LEAVES THIS SCREEN IN ORDER MODE, and it is the
   * order's own route, the same one its card on the Orders tab calls. Nothing
   * here writes a `Sale`; see ORDER MODE at the top of this file for why that
   * would count the order twice over.
   *
   * The khata needs no name and no phone number: an order already knows whose
   * it is, and the server posts the debt against that customer itself.
   */
  async function settleOrder(
    status: 'READY' | 'COMPLETED',
    paymentReceived = false,
    paymentMode: '' | 'CASH' | 'UPI' = '',
  ) {
    if (!tillOrder) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/shop/${slug}/order`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tillOrder.id, status, paymentReceived, paymentMode }),
      });
      if (handledExpiredSession({ response, slug, t, push })) return;

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        khataAmountPaise?: number;
      };

      if (!response.ok) {
        // 409 is the order having been finished somewhere else — another tab,
        // or the owner's own second phone — between opening this and paying.
        push(response.status === 409 ? t.orderTillGone : (payload.error ?? t.networkError), 'error');
        if (response.status === 409) leaveOrder();
        return;
      }

      if (payload.khataAmountPaise && payload.khataAmountPaise > 0) {
        push(`${t.paymentKhataDone} · ${formatPaise(payload.khataAmountPaise)}`, 'success');
      } else {
        push(status === 'COMPLETED' ? t.orderTillDone : t.markReady, 'success');
      }

      if (status === 'COMPLETED') {
        // The ticks are about a bag that has now gone out of the door.
        try {
          window.localStorage.removeItem(packedStorageKey(tillOrder.id));
        } catch {
          // Nothing to clean up on a phone that never stored them.
        }
        leaveOrder();
      } else {
        setPaying(false);
        router.refresh();
      }
    } catch {
      push(t.networkError, 'error');
    } finally {
      setSaving(false);
    }
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
  const payablePaise = tillOrder ? tillOrder.totalAmountPaise : totalPaise;

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
  }

  /** Relative — saying "rice" twice means two of them. */
  function addQuantity(id: string, more: number) {
    if (lockedByOrder()) return;
    setCart((current) => ({
      ...current,
      [id]: Math.min(roundQuantity((current[id] ?? 0) + more), MOST_PER_LINE),
    }));
  }

  function setQuantity(id: string, next: number) {
    if (lockedByOrder()) return;
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
      {/* THE ORDER, ON THE SCREEN THE GOODS ARE ON.
          Sticky, because the whole point is that it is still there ten items
          down the grid — the scrolling and the reading used to be on two
          different tabs.

          A tick per line, and they are the reason this is not just the order
          card moved across: the owner is holding a phone in one hand and a
          scoop in the other, and "which one was I on" is the question that
          sends them back to the beginning. Tapping a line is the whole
          gesture; the box is a target, not a control of its own. */}
      {tillOrder && (
        <section
          className={clsx(
            'sticky top-[3.25rem] z-20 -mx-4 border-b px-4 py-3 backdrop-blur',
            allPacked ? 'border-brand-300 bg-brand-50/95' : 'border-amber-200 bg-amber-50/95',
          )}
        >
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-900">
                {tillOrder.customerName || tillOrder.customerPhone}
              </p>
              <p className="flex items-center gap-1 text-xs text-slate-500">
                <PinIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                {tillOrder.orderType === 'DELIVERY' ? t.delivery : t.pickup} ·{' '}
                <span className="tabular-nums">
                  {packedCount}/{tillOrder.lines.length}
                </span>{' '}
                {t.orderTillProgress}
              </p>
            </div>
            {/* Leaving must be as cheap as arriving: an owner who brought the
                wrong order over is otherwise stuck with a locked grid. */}
            <button
              type="button"
              onClick={leaveOrder}
              className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600"
            >
              {t.orderTillLeave}
            </button>
          </div>

          <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto">
            {tillOrder.lines.map((line, index) => {
              const key = lineKey(line, index);
              const done = Boolean(packed[key]);
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => togglePacked(key)}
                    aria-pressed={done}
                    className={clsx(
                      'flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition',
                      done ? 'border-brand-200 bg-brand-50' : 'border-slate-200 bg-white',
                    )}
                  >
                    <span
                      className={clsx(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2',
                        done ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300',
                      )}
                    >
                      {done && <CheckIcon className="h-4 w-4" />}
                    </span>
                    <span
                      className={clsx(
                        'min-w-0 flex-1 truncate text-sm font-medium',
                        done ? 'text-slate-400 line-through' : 'text-slate-900',
                      )}
                    >
                      {lineName(line, locale)}
                      {/* No pack size beside a weighed amount — the amount is
                          the instruction, and "500 g · 50 g" is two of them. */}
                      {line.unit && !isLooseUnit(line.unit) ? ` · ${line.unit}` : ''}
                    </span>
                    <span
                      className={clsx(
                        'shrink-0 text-sm font-semibold tabular-nums',
                        done ? 'text-slate-400' : 'text-slate-700',
                      )}
                    >
                      {packAmount(line)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

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
            <div
              className={clsx(
                '-mx-4 bg-slate-100/95 px-4 pb-2 pt-3 backdrop-blur',
                // Two things cannot be stuck to the same edge. While an order
                // is being packed IT is the thing that must stay on screen, so
                // the filters go back to scrolling with the grid.
                !tillOrder && 'sticky top-[3.25rem] z-10',
              )}
            >
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
                {formatPaise(payablePaise)}
              </p>
            </div>

            {/* Whose money this is, when it is an order's. The name is the
                check the owner makes before taking it. */}
            {tillOrder && (
              <p className="mt-1 truncate text-sm text-slate-500">
                {tillOrder.customerName || tillOrder.customerPhone}
              </p>
            )}

            {/* A generated QR carries the amount, so the customer confirms
                rather than types — that beats the shop's static printed code,
                which is kept only as the fallback when there is no UPI ID. */}
            {upiId ? (
              <div className="mt-4 flex flex-col items-center gap-2 rounded-xl bg-slate-50 p-4">
                <QRCodeCanvas
                  value={upiPayUrlWithAmount(upiId, shopName, payablePaise)}
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
                onClick={() => (tillOrder ? settleOrder('COMPLETED', true, 'CASH') : record('CASH'))}
                className="h-12 rounded-xl border border-slate-300 font-semibold text-slate-800 disabled:opacity-50"
              >
                {t.sellCash}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => (tillOrder ? settleOrder('COMPLETED', true, 'UPI') : record('UPI'))}
                className="h-12 rounded-xl bg-brand-600 font-semibold text-white disabled:opacity-50"
              >
                {t.sellUpi}
              </button>
              {/* Goods leaving on credit is a payment mode here, because at the
                  counter that is exactly what it is — the third thing that can
                  happen when the customer is ready to go.

                  An order needs no form behind this button: it already knows
                  whose it is, and the server posts the debt against that
                  customer itself. */}
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  tillOrder
                    ? settleOrder('COMPLETED', false)
                    : setKhata(khata ?? { name: '', phone: '', area: '' })
                }
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
        {/* The mic fills a basket, and in order mode there is no basket to
            fill — an order is what the customer asked for, not what the shop
            decides to put in the bag. */}
        {!tillOrder && <VoiceOrder items={sellable} locale={locale} onApply={applyVoice} />}

        {tillOrder ? (
          /* WHERE THE BASKET WOULD BE, AND DOING THE ORDER'S JOB.
             Same corner, same two actions in the same order — pack it, then
             take the money — so an owner reaches for it without looking.
             Ready is offered until everything is ticked, because that is the
             tap that tells the customer to come; once it is all in the bag,
             money is the only thing left. */
          <div className="pointer-events-auto flex w-full max-w-md items-center gap-2">
            {!allPacked && (
              <button
                type="button"
                disabled={saving}
                onClick={() => void settleOrder('READY')}
                className="h-12 shrink-0 rounded-xl bg-amber-500 px-4 text-sm font-semibold text-white shadow-lg transition hover:bg-amber-600 disabled:opacity-50"
              >
                {t.markReady}
              </button>
            )}
            <button
              type="button"
              disabled={saving}
              onClick={() => setPaying(true)}
              className="flex h-12 flex-1 items-center justify-between gap-3 rounded-xl bg-brand-600 px-4 font-semibold text-white shadow-lg disabled:opacity-50"
            >
              <span>{t.sellTakePayment}</span>
              <span className="tabular-nums">{formatPaise(payablePaise)}</span>
            </button>
          </div>
        ) : (
          !cartOpen && (
            <CartBar
              // One per line: "0.05 items" is not a count anybody wants to read.
              totalItems={lines.length}
              totalAmountPaise={totalPaise}
              onReview={() => setCartOpen(true)}
              locale={locale}
            />
          )
        )}
      </div>

      {!tillOrder && cartDrawer}
    </div>
  );
}
