'use client';

/**
 * The orders queue.
 *
 * Orders arrive here, from the shop's own QR page, and this is the only place
 * they arrive: WhatsApp is where the owner TELLS a customer something, never
 * where an order comes in. What the owner needs from this screen is what a
 * WhatsApp thread cannot give — a worklist showing what is still waiting, and a
 * way to mark off what has been done.
 *
 * The screen is built around one question an owner asks about twenty times a
 * day — "what still needs doing?" — so it opens on the orders that do. A flat
 * list answered that question only while the shop was quiet; by the evening the
 * three that matter are buried under thirty that are finished. Hence the tabs,
 * and hence NEW being the one you land on whenever anything is waiting.
 *
 * The strip at the top is the other question, asked once at closing: what did
 * today take? Cancelled orders are excluded from it — money that never arrived
 * is not takingsPaise, and an owner checking the figure against the cash drawer must
 * not find the app optimistic.
 */

import { formatClock, formatDay, formatIsoDay, startOfBusinessDay } from '@/lib/time';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { handledExpiredSession } from './sessionGuard';
import clsx from 'clsx';
import { toAsciiDigits } from '@/lib/digits';
import { useToast } from '@/components/ui/Toast';
import {
  CartIcon,
  CheckIcon,
  CloseIcon,
  PencilIcon,
  PhoneIcon,
  PinIcon,
  TruckIcon,
  WhatsAppIcon,
} from '@/components/ui/Icon';
import { billPdfBlob, type Bill } from '@/lib/bill-pdf';
import { useConfirm } from '@/components/ui/useConfirm';
import { formatPaise } from '@/lib/money';
import {
  amountLabel,
  baseFromQuantity,
  isLooseUnit,
  quantityFromBase,
  stepBase,
} from '@/lib/units';
import {
  buildRevisedMessage,
  buildRoundMessage,
  buildStatusMessage,
  toWhatsAppNumber,
} from '@/lib/whatsapp';
import { QRCodeCanvas } from 'qrcode.react';
import { upiPayUrlWithAmount } from '@/lib/qr';
import { ownerDict } from '@/lib/owner-i18n';
import type { Locale } from '@/lib/i18n';

/**
 * An ordered line in the owner's language, falling back to the primary name.
 * Orders placed before the snapshot carried translations have only that one.
 */
function lineName(
  line: { name: string; nameBn?: string; nameHi?: string },
  locale: Locale,
): string {
  if (locale === 'bn') return line.nameBn || line.name;
  if (locale === 'hi') return line.nameHi || line.name;
  return line.name;
}

export type OrderStatus = 'NEW' | 'CONFIRMED' | 'READY' | 'COMPLETED' | 'CANCELLED';

export type OwnerOrder = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  orderType: 'DELIVERY' | 'PICKUP';
  status: OrderStatus;
  /** Goods plus delivery — what the customer owes. */
  totalAmountPaise: number;
  /** What was charged for sending it out, already inside the total above. */
  deliveryFeePaise: number;
  /** Has the owner already cut this order down to what they had? */
  revised: boolean;
  /**
   * Has this customer's phone agreed to be told things, so the server can
   * reach them on its own?
   *
   * When it can, the owner is shown nothing to tap. See `worthMessaging`.
   */
  reachable: boolean;
  createdAt: string;
  lines: {
    /** Blank on orders taken before the snapshot carried it. */
    itemId: string;
    name: string;
    nameBn?: string;
    nameHi?: string;
    unit: string;
    quantity: number;
    amountPaise: number;
  }[];
};

/**
 * IS THIS ORDER WORTH LEAVING THE APP FOR?
 *
 * The WhatsApp button used to sit on every card in every state, and by the
 * evening that is thirty invitations to do something that is usually either
 * unnecessary or already done. The real cost is not the tap: it is that
 * WhatsApp opens over the till, the owner sends, and then has to find their way
 * back — twice per order, in the middle of a rush.
 *
 * So the button appears only when a message would actually tell the customer
 * something they do not otherwise learn:
 *
 *  - **Cancelled — always, even when the phone has notifications.** This is the
 *    one piece of news that costs somebody a walk to the shop if it fails to
 *    arrive, and a notification is exactly the thing that arrives late on the
 *    phones this market runs on. Belt and braces, deliberately.
 *  - **Ready — only if we cannot tell them ourselves.** Verified: a subscribed
 *    customer gets "Your order is ready" on their phone within seconds of the
 *    owner tapping Ready, so showing the button as well would be asking the
 *    shopkeeper to leave the app to repeat a message already delivered.
 *  - **Ready with no subscription — always, collection or delivery.** This used
 *    to exclude delivery outright, on the reasoning that the bag arriving is the
 *    message. True for a customer whose phone we can reach, and wrong for one we
 *    cannot: they are then told nothing at all, and a delivery they do not know
 *    is coming is a door nobody answers.
 *  - **Still preparing — never.** An order that arrived accepted has nothing to
 *    report, and "we have your order" is news to nobody who just placed one.
 */
function worthMessaging(order: OwnerOrder): boolean {
  // Only a cancellation is news now: the "ready" step is gone, and a finished
  // order reaches the customer as its bill.
  return order.status === 'CANCELLED';
}

/**
 * How often an open orders screen asks the server what it has missed.
 *
 * Twenty seconds is the compromise: fast enough that a customer who orders and
 * then walks in is not ahead of the shop's own screen, slow enough to be
 * nothing on a Vercel bill or a 4G connection.
 */
const ORDERS_POLL_MS = 20_000;

type Tab = 'ALL' | OrderStatus;

const TAB_ORDER: Tab[] = ['NEW', 'CONFIRMED', 'READY', 'COMPLETED', 'ALL', 'CANCELLED'];

/**
 * The states an order can still be worked in.
 *
 * A completed one is a record, and a cancelled one no longer exists — turning
 * an order away now removes it. So the whole action grid is shown for these
 * three and for nothing else.
 */
const WORKABLE: OrderStatus[] = ['NEW', 'CONFIRMED', 'READY'];

/**
 * One action on an order, as an equal tile: icon over word.
 *
 * The card used to carry two labelled buttons, four bare icon squares and an
 * orange bar, which on a narrow phone wrapped differently for every state — so
 * the button in the bottom-left corner was a different button on each card.
 * Tiles are all one size and always in the same order, which is what lets an
 * owner reach for one without reading it.
 *
 * A link or a button depending on what it does, because "go to the till" is a
 * navigation and the rest are not.
 */
function Tile({
  href,
  onClick,
  disabled,
  icon: Icon,
  label,
  tone = 'plain',
}: {
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  icon: (props: { className?: string }) => React.ReactElement;
  label: string;
  /**
   * EACH ACTION ITS OWN COLOUR, AND ONLY DONE IS SOLID GREEN.
   *
   * Four grey-outlined tiles read as four of the same thing. Each action now
   * has a colour of its own, carried by a solid icon badge on a soft tint of
   * the same colour, the way a phone's app buttons look. Four solid slabs of
   * colour were tried first and were too loud together. "Done" alone is a
   * solid green button, because green is what finishing looks like in the
   * app, and it should be the one the eye lands on.
   *
   * Words are the tint's -900 on its -50, well past 4.5:1. The badges are
   * icons, which need 3:1 against white: every -600 here clears that.
   */
  tone?: 'plain' | 'blue' | 'violet' | 'amber' | 'green';
}) {
  const className = clsx(
    'flex h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-2xl border px-1 text-center text-xs font-semibold leading-tight shadow-sm transition active:scale-95',
    tone === 'blue' && 'border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100',
    tone === 'violet' && 'border-violet-200 bg-violet-50 text-violet-900 hover:bg-violet-100',
    tone === 'amber' && 'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100',
    tone === 'green' && 'border-brand-600 bg-brand-600 text-white hover:bg-brand-700',
    tone === 'plain' && 'border-slate-300 bg-card text-slate-700 shadow-none hover:bg-slate-50',
    disabled && 'opacity-50',
  );
  const badge = clsx(
    'flex h-7 w-7 items-center justify-center rounded-full text-white',
    tone === 'blue' && 'bg-sky-600',
    tone === 'violet' && 'bg-violet-600',
    tone === 'amber' && 'bg-amber-600',
    tone === 'green' && 'bg-white/20',
    tone === 'plain' && 'bg-slate-500',
  );

  const inner = (
    <>
      <span className={badge}>
        <Icon className="h-[18px] w-[18px] shrink-0" />
      </span>
      {/* Two lines at most: "Change amounts" is two words in every language
          this ships in, and a tile that grows for one of them breaks the row. */}
      <span className="line-clamp-2">{label}</span>
    </>
  );

  if (href?.startsWith('https://')) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }
  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {inner}
    </button>
  );
}

/**
 * Today in the shop's own day.
 *
 * The local-date comparison this replaces asked the *machine* what day it was,
 * which is UTC on the server and IST in the browser — so the two could count
 * different numbers of orders for the same list and React would throw the tree
 * away. Anchored to the shop's midnight, both agree.
 */
function isToday(iso: string): boolean {
  return new Date(iso) >= startOfBusinessDay();
}

/**
 * One tap of the owner's revise stepper, in the same amounts the customer's
 * picker uses: 50 g at a time under a kilo, 250 g up to five, a kilo above —
 * and whole packs for anything counted.
 */
function reviseStep(unit: string, quantity: number, direction: 1 | -1): number {
  if (!isLooseUnit(unit)) return quantity + direction;
  const base = baseFromQuantity(unit, quantity);
  const step = stepBase(unit, base);
  return Math.max(0, quantityFromBase(unit, base + step * direction));
}

/**
 * How much of a line, as the person packing it needs to read it.
 *
 * "× 0.05" cannot be weighed out. Since a customer may now order any amount of
 * anything sold by weight or volume — fifty grams of posto priced by the kilo —
 * the packing list has to name the amount, and only counted goods keep a
 * multiplier.
 */
function lineAmount(line: { unit: string; quantity: number }): string {
  return amountLabel(line.unit, line.quantity) ?? `× ${line.quantity}`;
}

export function OrdersScreen({
  slug,
  shopName,
  orders,
  locale,
  upiId,
  upiQrData,
  labourPhone,
}: {
  slug: string;
  /** Named in the message the owner sends the customer, and in the UPI QR. */
  shopName: string;
  /**
   * Whoever runs the deliveries, set by the operator, or blank.
   *
   * Blank is a supported state, not a missing setting: the send button then
   * opens WhatsApp's own contact picker, which is also how the round reaches a
   * second boy or the owner's son on a day the usual one is off.
   */
  labourPhone: string;
  orders: OwnerOrder[];
  locale: Locale;
  /** Generates a QR carrying the exact amount, so the customer confirms rather than types. */
  upiId: string;
  /** The shop's own printed code, used when there is no UPI ID. */
  upiQrData: string;
}) {
  const router = useRouter();
  const { push } = useToast();
  const { confirm, dialog } = useConfirm();
  const t = ownerDict(locale);
  const [busyId, setBusyId] = useState<string | null>(null);
  /** The order whose bill is being written, so its button cannot be double-tapped. */
  const [billing, setBilling] = useState<string | null>(null);
  /** The order whose payment question is currently open, if any. */
  const [settling, setSettling] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab | null>(null);

  /**
   * THE BILL GOES WITH THE MESSAGE, AS A PDF, in one tap on the WhatsApp icon.
   *
   * There used to be a printer icon beside it that saved the PDF, and the owner
   * then had to open WhatsApp and attach the file by hand. `navigator.share`
   * with a file is the only way a browser can put a document into WhatsApp (a
   * wa.me link carries text only), so where the phone can share files the
   * share sheet opens with the bill attached and the message as its caption,
   * the same as the restock list. The owner picks WhatsApp and the customer
   * there; the sheet cannot be told which chat.
   *
   * Where it cannot (a computer, mostly) the icon stays a link to the
   * customer's chat and the bill is saved alongside, to attach by hand.
   *
   * `paymentMode` is deliberately left off. The browser is not told how an
   * order was paid, and a bill that printed "Paid by: Cash" over a delivery
   * nobody has paid for yet would be a receipt for money that never moved.
   */
  const [canSharePdf, setCanSharePdf] = useState(false);
  useEffect(() => {
    try {
      const probe = new File([''], 'bill.pdf', { type: 'application/pdf' });
      const able = Boolean(navigator.canShare?.({ files: [probe] }));
      setCanSharePdf(able);
      // Loaded ahead of the tap: the share sheet must open within the few
      // seconds a browser allows after a tap, and jsPDF is the slow part.
      if (able) void import('jspdf');
    } catch {
      setCanSharePdf(false);
    }
  }, []);

  function billFor(order: OwnerOrder): Bill {
    return {
      shopName,
      lines: order.lines.map((line) => ({
        name: lineName(line, locale),
        unit: line.unit,
        quantity: line.quantity,
        amountPaise: line.amountPaise,
      })),
      totalPaise: order.totalAmountPaise,
      at: new Date(order.createdAt),
      customerName: order.customerName,
    };
  }

  /** The news when there is some (see `worthMessaging`), otherwise the bill's own line. */
  function messageFor(order: OwnerOrder): string {
    return worthMessaging(order)
      ? buildStatusMessage({
          shopName,
          customerName: order.customerName,
          status: order.status,
          totalAmountPaise: order.totalAmountPaise,
          orderType: order.orderType,
          lines: order.lines.map((line) => ({ ...line, name: lineName(line, locale) })),
          words: t.customerWords,
        })
      : `${shopName}\n${t.billDoc} · ${formatPaise(order.totalAmountPaise)}`;
  }

  function chatUrl(order: OwnerOrder): string {
    return `https://wa.me/${toWhatsAppNumber(order.customerPhone)}?text=${encodeURIComponent(messageFor(order))}`;
  }

  async function sendBill(order: OwnerOrder) {
    setBilling(order.id);
    try {
      const blob = await billPdfBlob(billFor(order), {
        bill: t.billDoc,
        total: t.billTotal,
        paidBy: t.billPaidBy,
        paymentMode: { CASH: t.sellCash, UPI: t.sellUpi, KHATA: t.sellKhata },
        credit: `${t.billDoc} · ${shopName}`,
      });
      const file = new File([blob], `bill-${order.id}.pdf`, { type: 'application/pdf' });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: messageFor(order) });
        return;
      }

      // The fallback: the link the owner tapped is opening the chat, and the
      // bill is saved to attach there.
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
      push(t.billReady, 'success');
    } catch (error) {
      // Closing the share sheet is the owner changing their mind, not a fault.
      if ((error as { name?: string })?.name === 'AbortError') return;
      push(t.networkError, 'error');
    } finally {
      setBilling(null);
    }
  }

  /** The one WhatsApp control, on a live card and on a history row alike. */
  function whatsAppBill(order: OwnerOrder, tone: 'news' | 'plain') {
    const label = `${t.messageCustomer} · ${t.billDoc}`;
    const className = clsx(
      'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition disabled:opacity-50',
      tone === 'news'
        ? 'border-[#25D366] bg-[#25D366] text-white'
        : 'border-slate-300 text-[#25D366] hover:bg-slate-50',
    );
    if (canSharePdf) {
      return (
        <button
          type="button"
          onClick={() => sendBill(order)}
          disabled={billing === order.id}
          aria-label={label}
          title={label}
          className={className}
        >
          <WhatsAppIcon className="h-[18px] w-[18px]" />
        </button>
      );
    }
    return (
      <a
        href={chatUrl(order)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => void sendBill(order)}
        aria-label={label}
        title={label}
        className={className}
      >
        <WhatsAppIcon className="h-[18px] w-[18px]" />
      </a>
    );
  }

  /**
   * The order being cut down to what the shop actually has, and the amounts
   * the owner is proposing — item id to quantity.
   *
   * A draft rather than a save on every tap: an owner going from 2 kg to 1 kg
   * passes through nothing meaningful, and the customer must be told once, at
   * the end, rather than twice on the way.
   */
  const [revising, setRevising] = useState<string | null>(null);
  const [revision, setRevision] = useState<Record<string, number>>({});
  /**
   * The message waiting to be sent about an order that has just been changed.
   *
   * Kept until the owner sends it or leaves the screen. Push has already gone
   * to whoever allowed it, but push is not the system of record — the WhatsApp
   * message is what actually reaches everybody, and this is the one moment the
   * shopkeeper genuinely must not skip it.
   */
  const [pendingShare, setPendingShare] = useState<{ orderId: string; url: string } | null>(null);

  /**
   * An order just turned away, and the message about it.
   *
   * Screen-level rather than on a card, because the card is gone — the order
   * has been deleted. This is the only thing left that can tell the customer,
   * and a cancellation not delivered is somebody walking to a shop for a bag
   * that is not there.
   */
  const [removed, setRemoved] = useState<{ name: string; url: string } | null>(null);

  const counts = useMemo(() => {
    const tally: Record<Tab, number> = {
      ALL: orders.length,
      NEW: 0,
      CONFIRMED: 0,
      READY: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    for (const order of orders) tally[order.status === 'READY' ? 'CONFIRMED' : order.status] += 1;
    return tally;
  }, [orders]);

  const today = useMemo(() => {
    let count = 0;
    let takingsPaise = 0;
    for (const order of orders) {
      if (!isToday(order.createdAt) || order.status === 'CANCELLED') continue;
      count += 1;
      // Only money the owner has actually agreed to. An order sitting
      // unanswered is not takingsPaise, and a figure checked against the cash
      // drawer must never be the optimistic one.
      if (
        order.status === 'CONFIRMED' ||
        order.status === 'READY' ||
        order.status === 'COMPLETED'
      ) {
        takingsPaise += order.totalAmountPaise;
      }
    }
    return { count, takingsPaise };
  }, [orders]);

  // A READY order is still waiting: it is packed and nobody has it yet.
  const waiting = counts.NEW + counts.CONFIRMED + counts.READY;

  /**
   * What is still to go out, oldest first — the round, in the order it should
   * be walked. Finished and cancelled orders are not somebody's afternoon.
   */
  const pending = useMemo(
    () =>
      orders
        .filter(
          (order) =>
            order.status === 'NEW' || order.status === 'CONFIRMED' || order.status === 'READY',
        )
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [orders],
  );

  /**
   * WHICH WAITING ORDERS GO TO THE HELPER.
   *
   * NOTHING IS TICKED TO BEGIN WITH, by request: an order goes to the helper
   * only because the owner chose it. The strip above the cards has tick-all
   * for the day everything is going out.
   */
  const [forHelper, setForHelper] = useState<Set<string>>(() => new Set());
  const helperIds = forHelper;
  const helperOrders = pending.filter((order) => helperIds.has(order.id));
  function toggleHelper(id: string) {
    const next = new Set(helperIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setForHelper(next);
  }

  /**
   * The helper's list, in the owner's language: item names as the cards show
   * them and the words around them from the dictionary.
   */
  function helperMessage(list: OwnerOrder[]): string {
    return buildRoundMessage({
      shopName,
      orders: list.map((order) => ({
        ...order,
        lines: order.lines.map((line) => ({ ...line, name: lineName(line, locale) })),
      })),
      labels: {
        heading: t.roundHeading,
        pickup: t.roundPickup,
        noAddress: t.roundNoAddress,
        customer: t.roundCustomer,
      },
    });
  }

  const visible = useMemo(() => {
    // One list, so it has to carry both jobs at once. Work still to be done
    // sits on top; everything finished sits under it. Both halves now read
    // NEWEST FIRST — the order that just arrived is the one the owner is
    // looking for, and it was landing at the bottom of the waiting half.
    //
    // THIS GIVES UP FIFO, AND THAT IS THE COST TO WATCH. The waiting half used
    // to run oldest first, which is the rule a queue at a counter already
    // follows: whoever ordered first is served first. Newest-first puts the
    // longest-waiting customer at the BOTTOM of the list, which is exactly
    // where an order gets forgotten on a busy evening. The badge on each card
    // and the time under the name are what now have to carry that, so if
    // orders start going stale, this sort is the first thing to look at.
    const rank = (status: OrderStatus) =>
      status === 'NEW' || status === 'CONFIRMED' || status === 'READY' ? 0 : 1;
    return orders.filter((order) => order.status !== 'COMPLETED').sort((a, b) => {
      const byRank = rank(a.status) - rank(b.status);
      if (byRank !== 0) return byRank;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [orders]);

  /**
   * WHICH HALF OF THE SCREEN IS SHOWING: the orders still to do, or the
   * completed ones. Completed orders are a section of their own, by request,
   * with filters an owner can use to find one bill among three months of them.
   */
  const [view, setView] = useState<'live' | 'done'>('live');

  /**
   * THE ORDER THE BELL WAS TAPPED FOR. `?order=<id>` arrives from the bell in
   * the header of every owner screen; the order is brought into view and
   * outlined for a few seconds, on whichever tab it now lives on.
   */
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('order');
  const [highlight, setHighlight] = useState<string | null>(null);
  useEffect(() => {
    if (!selectedId) return;
    const target = orders.find((order) => order.id === selectedId);
    if (!target) return;
    setView(target.status === 'COMPLETED' ? 'done' : 'live');
    setHighlight(selectedId);
    const scroll = window.setTimeout(() => {
      document.getElementById(`order-${selectedId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
    const clear = window.setTimeout(() => setHighlight(null), 4000);
    return () => {
      window.clearTimeout(scroll);
      window.clearTimeout(clear);
    };
    // Only when the link changes, not on every poll of the orders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);
  const [doneSearch, setDoneSearch] = useState('');
  /**
   * HOW FAR BACK: today, the last 7 days, the last 30, or all three months.
   * Four buttons rather than a month list, because "this week's orders" is the
   * question an owner asks, and a named month is not. A specific date (below)
   * wins over this when one is picked.
   */
  const [doneRange, setDoneRange] = useState<1 | 7 | 30 | 90>(90);
  const [doneDate, setDoneDate] = useState('');

  const doneAll = useMemo(
    () =>
      orders
        .filter((order) => order.status === 'COMPLETED')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [orders],
  );

  /** What the filters leave. A picked date wins over the range buttons. */
  const doneShown = useMemo(() => {
    const needle = toAsciiDigits(doneSearch).trim().toLowerCase();
    // The first day inside the range, in the shop's own calendar.
    const since = formatIsoDay(new Date(Date.now() - (doneRange - 1) * 24 * 60 * 60 * 1000));
    return doneAll.filter((order) => {
      const day = formatIsoDay(order.createdAt);
      if (doneDate) {
        if (day !== doneDate) return false;
      } else if (day < since) {
        return false;
      }
      if (!needle) return true;
      return (
        order.customerName.toLowerCase().includes(needle) ||
        order.customerPhone.includes(needle)
      );
    });
  }, [doneAll, doneSearch, doneRange, doneDate]);

  const doneTotalPaise = doneShown.reduce((sum, order) => sum + order.totalAmountPaise, 0);

  /** Completed orders the filters leave, newest first, grouped under their day. */
  const historyDays = useMemo(() => {
    const todayKey = formatIsoDay(new Date());
    const yesterdayKey = formatIsoDay(new Date(Date.now() - 24 * 60 * 60 * 1000));
    const days: { key: string; label: string; orders: OwnerOrder[] }[] = [];
    for (const order of doneShown) {
      const key = formatIsoDay(order.createdAt);
      let day = days[days.length - 1];
      if (!day || day.key !== key) {
        const label =
          key === todayKey
            ? t.historyToday
            : key === yesterdayKey
              ? t.historyYesterday
              : formatDay(order.createdAt);
        day = { key, label, orders: [] };
        days.push(day);
      }
      day.orders.push(order);
    }
    return days;
  }, [doneShown, t.historyToday, t.historyYesterday]);

  /**
   * THE SCREEN CANNOT BE A SNAPSHOT.
   *
   * An owner leaves this open on the counter all day. Until now the only thing
   * that ever refreshed it was the owner's own tap, so an order placed while
   * they were looking at it never appeared — the waiting count sat there being
   * wrong, and the only alert was a push notification, which is exactly the
   * thing the phones in this market drop.
   *
   * So: a poll while the tab is actually being looked at, and an immediate
   * refresh the moment it is looked at again. `router.refresh()` re-runs the
   * server component and diffs — it does not scroll, does not clear a form and
   * does not close the panel the owner has open.
   *
   * Paused while hidden on purpose. A phone in a pocket with a dozen tabs open
   * should not be polling anybody's database, and coming back to the tab
   * refreshes anyway.
   */
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer) return;
      timer = setInterval(() => router.refresh(), ORDERS_POLL_MS);
    };
    const stop = () => {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        router.refresh();
        start();
      } else {
        stop();
      }
    };

    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onVisibility);
    };
  }, [router]);

  /**
   * A new order that arrived on its own is worth a word, once.
   *
   * The poll above makes it appear; this makes the owner look up. Only ever an
   * increase, and never on first render — a screen that announces the orders
   * already on it every time it loads is a screen people learn to ignore.
   */
  const seenWaiting = useRef<number | null>(null);
  useEffect(() => {
    const previous = seenWaiting.current;
    seenWaiting.current = waiting;
    if (previous === null || waiting <= previous) return;
    push(t.newOrderAlert, 'success');
  }, [waiting, push, t.newOrderAlert]);

  async function setStatus(
    id: string,
    status: OrderStatus,
    paymentReceived = false,
    paymentMode: '' | 'CASH' | 'UPI' = '',
  ) {
    setBusyId(id);
    try {
      const response = await fetch(`/api/admin/shop/${slug}/order`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, paymentReceived, paymentMode }),
      });
      if (handledExpiredSession({ response, slug, t, push })) return;
      if (!response.ok) {
        push(t.networkError, 'error');
        return;
      }

      // Say it out loud when money has just become a debt. An owner who taps
      // "not yet" and sees nothing happen has no reason to believe the khata
      // knows about it, and will go and write it on paper as well.
      const payload = (await response.json().catch(() => ({}))) as { khataAmountPaise?: number };
      if (payload.khataAmountPaise && payload.khataAmountPaise > 0) {
        push(`${t.paymentKhataDone} · ${formatPaise(payload.khataAmountPaise)}`, 'success');
      }

      setSettling(null);
      router.refresh();
    } catch {
      push(t.networkError, 'error');
    } finally {
      setBusyId(null);
    }
  }

  /**
   * Turn an order away, and take it off the queue for good.
   *
   * A cancelled order used to stay as a greyed card forever, so by the evening
   * the list an owner works was mostly orders that were not happening. It is
   * deleted now — the goods go back on the shelf server-side first.
   *
   * THE MESSAGE HAS TO OUTLIVE THE CARD. A cancellation is the one piece of
   * news that costs somebody a walk to the shop if it fails to arrive, and the
   * WhatsApp button that carried it lived on the card that is about to vanish.
   * So the message is lifted to the top of the screen and stays there until it
   * is sent or dismissed.
   */
  async function removeOrder(order: OwnerOrder) {
    const yes = await confirm({
      title: t.markCancelled,
      message: t.markCancelledConfirm,
      confirmLabel: t.markCancelled,
      cancelLabel: t.no,
      danger: true,
    });
    if (!yes) return;

    setBusyId(order.id);
    try {
      const response = await fetch(`/api/admin/shop/${slug}/order`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id }),
      });
      if (handledExpiredSession({ response, slug, t, push })) return;
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        push(payload.error ?? t.networkError, 'error');
        return;
      }

      // Built from the order we still hold, because the row it describes is
      // already gone from the database.
      setRemoved({
        name: order.customerName || order.customerPhone,
        url: `https://wa.me/${toWhatsAppNumber(order.customerPhone)}?text=${encodeURIComponent(
          buildStatusMessage({
            shopName,
            customerName: order.customerName,
            status: 'CANCELLED',
            totalAmountPaise: order.totalAmountPaise,
            orderType: order.orderType,
            lines: order.lines.map((line) => ({ ...line, name: lineName(line, locale) })),
            words: t.customerWords,
          }),
        )}`,
      });
      push(t.orderRemoved, 'success');
      router.refresh();
    } catch {
      push(t.networkError, 'error');
    } finally {
      setBusyId(null);
    }
  }

  /**
   * Save what the shop can actually give, and put the message in the owner's
   * hand.
   *
   * The server is the authority on the new total — it re-reads the delivery
   * terms, which a shorter order may now fail to qualify for — so the message
   * is built from what it sends back rather than from what this screen guessed.
   */
  async function saveRevision(order: OwnerOrder) {
    setBusyId(order.id);
    try {
      const response = await fetch(`/api/admin/shop/${slug}/order`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: order.id,
          lines: order.lines
            .filter((line) => line.itemId)
            .map((line) => ({
              itemId: line.itemId,
              quantity: revision[line.itemId] ?? line.quantity,
            })),
        }),
      });
      if (handledExpiredSession({ response, slug, t, push })) return;

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        changed?: boolean;
        totalAmountPaise?: number;
        lines?: { itemId: string; name: string; unit: string; quantity: number; amountPaise: number }[];
        removed?: { name: string; unit: string; quantity: number }[];
      };

      if (!response.ok) {
        push(payload.error ?? t.networkError, 'error');
        return;
      }

      setRevising(null);
      setRevision({});

      if (payload.changed === false) {
        router.refresh();
        return;
      }

      // Each line's old quantity, so the message can say what it was rather
      // than only what it now is — which is the question the customer has.
      const before = new Map(order.lines.map((line) => [line.itemId, line.quantity]));
      const message = buildRevisedMessage({
        shopName,
        customerName: order.customerName,
        totalAmountPaise: payload.totalAmountPaise ?? order.totalAmountPaise,
        lines: (payload.lines ?? []).map((line) => ({
          // The owner's name for it, not the catalogue's English.
          name: (() => {
            const own = order.lines.find((candidate) => candidate.itemId === line.itemId);
            return own ? lineName(own, locale) : line.name;
          })(),
          unit: line.unit,
          quantity: line.quantity,
          wasQuantity: before.get(line.itemId) ?? line.quantity,
          amountPaise: line.amountPaise,
        })),
        removed: (payload.removed ?? []).map((line) => {
          const own = order.lines.find((candidate) => candidate.name === line.name);
          return own ? { ...line, name: lineName(own, locale) } : line;
        }),
        words: t.customerWords,
      });

      setPendingShare({
        orderId: order.id,
        // Normalised rather than "91" glued on: a number stored as +91 or with
        // spaces in it would otherwise build a wa.me link to nobody.
        url: `https://wa.me/${toWhatsAppNumber(order.customerPhone)}?text=${encodeURIComponent(message)}`,
      });
      push(t.reviseDone, 'success');
      router.refresh();
    } catch {
      push(t.networkError, 'error');
    } finally {
      setBusyId(null);
    }
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-card p-8 text-center">
        <p className="font-semibold text-slate-800">{t.noOrders}</p>
        <p className="mt-1 text-sm text-slate-500">{t.noOrdersHint}</p>
      </div>
    );
  }

  const statusLabel: Record<OrderStatus, string> = {
    NEW: t.orderNew,
    CONFIRMED: t.orderConfirmed,
    READY: t.orderConfirmed,
    COMPLETED: t.orderCompleted,
    CANCELLED: t.orderCancelled,
  };

  const tabLabel: Record<Tab, string> = { ...statusLabel, ALL: t.ordersAll };

  return (
    <div className="space-y-3">
      {/* Today at a glance. Three numbers, no chart — this gets read standing
          up, between customers. */}
      <dl className="flex items-center gap-5 rounded-2xl border border-glass-edge bg-glass px-4 py-3 shadow-raised">
        <div>
          <dt className="text-xs text-slate-500">{t.ordersToday}</dt>
          <dd className="text-xl font-semibold tabular-nums text-slate-900">{today.count}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">{t.ordersTakings}</dt>
          <dd className="text-xl font-semibold tabular-nums text-slate-900">
            {formatPaise(today.takingsPaise)}
          </dd>
        </div>
        <div className="ml-auto text-right">
          <dt className="text-xs text-slate-500">{t.ordersWaiting}</dt>
          <dd
            className={clsx(
              'text-xl font-semibold tabular-nums',
              waiting > 0 ? 'text-amber-600' : 'text-slate-400',
            )}
          >
            {waiting}
          </dd>
        </div>
      </dl>

      {/* TWO SECTIONS, ONE SWITCH. The orders still to do, and the completed
          ones for three months. Two equal halves so neither looks like a
          setting. */}
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-sunk p-1" role="tablist">
        {(['live', 'done'] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={view === key}
            onClick={() => setView(key)}
            className={clsx(
              'rounded-xl px-3 py-2.5 text-sm font-semibold transition',
              view === key ? 'bg-card text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
            )}
          >
            {key === 'live' ? t.ordersLiveTab : t.ordersHistory}
            <span className="ml-1.5 tabular-nums text-slate-400">
              {key === 'live' ? visible.length : doneAll.length}
            </span>
          </button>
        ))}
      </div>

      {/* THE ASK LANDS HERE, AND ONLY HERE.
          This screen returns early when there are no orders at all, so an
          owner never meets this before they have seen the product do
          something. That is the whole placement argument: the browser's
          permission prompt cannot be shown twice, and a shopkeeper looking at
          an order that arrived while they were serving somebody is the one
          moment the answer is obviously yes. */}

      {/* THE ONE MESSAGE THAT MUST NOT BE MISSED, on the one screen that can
          still send it. The order it is about no longer exists, so there is no
          card to hang this on and no second chance to find it later. It stays
          until the owner sends it or says they have. */}
      {removed && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3">
          <p className="text-sm font-semibold text-red-900">
            {t.orderRemovedTell.replace('{name}', removed.name)}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <a
              href={removed.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setRemoved(null)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white"
            >
              <WhatsAppIcon className="h-[18px] w-[18px]" />
              {t.messageCustomer}
            </a>
            <button
              type="button"
              onClick={() => setRemoved(null)}
              className="shrink-0 px-3 py-2.5 text-sm font-medium text-slate-500"
            >
              {t.no}
            </button>
          </div>
        </div>
      )}

      {/* THE ROUND, IN ONE MESSAGE.
          Whoever runs the deliveries has a phone and WhatsApp and nothing
          else — no login, and there never will be one. Until now the owner
          read the orders off this screen and dictated them, or forwarded four
          separate customer messages, and the address is the part that gets
          lost doing that at six in the evening.

          Straight to his number when the operator has set one, and to
          WhatsApp's contact picker when they have not — which is also how the
          round reaches a second boy, or the owner's own son. */}
      {/* SENDING THE TICKED ORDERS TO THE HELPER.
          This was a green "send list on WhatsApp" bar floating over the
          orders, with nothing saying what list or to whom, and the same green
          as "done". It now says what it does in words, sits right above the
          cards whose tick boxes feed it, offers tick-all and untick-all, and
          wears the helper's purple, the same as the "send to helper" button on
          each card. Only the ticked orders go — see `forHelper`. */}
      {view === 'live' && pending.length > 0 && (
        <section className="rounded-2xl border border-violet-200 bg-violet-50 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="mr-auto text-sm font-medium text-violet-900">{t.helperTickHint}</p>
            <button
              type="button"
              onClick={() => setForHelper(new Set(pending.map((order) => order.id)))}
              className="rounded-lg bg-white/70 px-3 py-1 text-xs font-medium text-violet-900 transition hover:bg-white"
            >
              {t.restockAll}
            </button>
            <button
              type="button"
              onClick={() => setForHelper(new Set())}
              className="rounded-lg bg-white/70 px-3 py-1 text-xs font-medium text-violet-900 transition hover:bg-white"
            >
              {t.restockClear}
            </button>
          </div>
          <a
            href={`https://wa.me/${labourPhone ? toWhatsAppNumber(labourPhone) : ''}?text=${encodeURIComponent(
              helperMessage(helperOrders),
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={helperOrders.length === 0}
            onClick={(event) => {
              if (helperOrders.length === 0) event.preventDefault();
            }}
            className={clsx(
              'mt-2 flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-violet-700',
              helperOrders.length === 0 && 'cursor-not-allowed opacity-50',
            )}
          >
            <TruckIcon className="h-5 w-5" />
            {t.helperSendTicked.replace('{n}', String(helperOrders.length))}
          </a>
        </section>
      )}

      {/* The status filter strip lived here. Five chips, four of them usually
          reading zero, above a list short enough to read whole — it cost a row
          of screen and answered a question nobody was asking. The badge on each
          card already says what state it is in. */}

      {view === 'live' && (visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-card p-8 text-center">
          <p className="text-sm text-slate-500">{t.noOrdersHere}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((order) => (
            <li
              key={order.id}
              id={`order-${order.id}`}
              className={clsx(
                'scroll-mt-40 rounded-2xl border border-glass-edge bg-glass p-4 shadow-raised transition',
                highlight === order.id && 'ring-4 ring-brand-500',
                busyId === order.id && 'opacity-60',
                order.status === 'CANCELLED' && 'opacity-70',
                // A new order gets an edge you can find without reading — the
                // one card in the list that is asking for something.
                order.status === 'NEW' && 'ring-2 ring-amber-300',
              )}
            >
              <div className="flex flex-wrap items-start gap-2">
                {WORKABLE.includes(order.status) && (
                  <input
                    type="checkbox"
                    checked={helperIds.has(order.id)}
                    onChange={() => toggleHelper(order.id)}
                    aria-label={`${t.ordersSendRound} — ${order.customerName || order.customerPhone}`}
                    className="mt-1 h-5 w-5 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">
                    {order.customerName || '—'} · {order.customerPhone}
                  </p>
                  {/* Where it goes belongs with who it is for, not under the
                      list of what is in it — sitting there it read as another
                      line of the order. */}
                  {order.customerAddress && (
                    <p className="flex items-start gap-1 text-xs text-slate-500">
                      <PinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="min-w-0">{order.customerAddress}</span>
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    {order.orderType === 'DELIVERY' ? t.delivery : t.pickup} ·{' '}
                    {formatClock(order.createdAt)}
                    {!isToday(order.createdAt) &&
                      ` · ${formatDay(order.createdAt)}`}
                  </p>
                </div>
                {/* Said on the card, not only in the message that went out.
                    An owner scrolling back through the day has to be able to
                    see which orders they cut, because that is the one the
                    customer will ring about. */}
                {order.revised && (
                  <span className="shrink-0 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
                    {t.revisedBadge}
                  </span>
                )}
                <span
                  className={clsx(
                    'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
                    order.status === 'NEW' && 'bg-amber-50 text-amber-700',
                    (order.status === 'CONFIRMED' || order.status === 'READY') && 'bg-blue-50 text-blue-700',
                    order.status === 'COMPLETED' && 'bg-green-50 text-green-700',
                    order.status === 'CANCELLED' && 'bg-slate-100 text-slate-500',
                  )}
                >
                  {statusLabel[order.status]}
                </span>
              </div>

              {revising === order.id ? (
                /* WHAT THE SHOP CAN ACTUALLY GIVE.
                   A customer asks for two kilos of basmati and the sack has
                   one. Cancelling is wrong — the shop wants to send the kilo
                   and the customer wants it — and a phone call leaves the app
                   still insisting on a total nobody is going to pay, which is
                   then what the khata would post if the order were completed
                   unpaid.

                   So: one stepper per line, capped at what was ordered. The
                   amounts only ever come down. Putting something INTO
                   somebody's order on their behalf is the shop deciding what a
                   customer buys, and the server refuses it too. */
                <div className="mt-3 space-y-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                  <p className="text-sm font-semibold text-slate-800">{t.reviseTitle}</p>
                  <p className="text-xs text-slate-600">{t.reviseHint}</p>

                  <ul className="space-y-1.5">
                    {order.lines.map((line, index) => {
                      const next = revision[line.itemId] ?? line.quantity;
                      return (
                        <li
                          key={`${order.id}-revise-${index}`}
                          className="flex items-center gap-2 rounded-lg bg-card px-2.5 py-2"
                        >
                          <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                            {lineName(line, locale)}
                            {line.unit && !isLooseUnit(line.unit) ? ` · ${line.unit}` : ''}
                            {next !== line.quantity && (
                              <span className="text-slate-400">
                                {' '}
                                · {t.reviseWas} {lineAmount(line)}
                              </span>
                            )}
                          </span>

                          {/* A line with no item id cannot be named to the
                              server, so it is shown and left alone rather than
                              offered as something changeable that would then
                              silently do nothing. */}
                          {line.itemId ? (
                            <span className="flex shrink-0 items-center gap-1 rounded-lg bg-slate-100 p-1">
                              <button
                                type="button"
                                aria-label="−"
                                onClick={() =>
                                  setRevision((current) => ({
                                    ...current,
                                    [line.itemId]: Math.max(0, reviseStep(line.unit, next, -1)),
                                  }))
                                }
                                className="h-8 w-8 rounded text-lg font-semibold text-slate-700"
                              >
                                −
                              </button>
                              <span className="w-16 text-center font-semibold tabular-nums">
                                {lineAmount({ unit: line.unit, quantity: next })}
                              </span>
                              <button
                                type="button"
                                aria-label="+"
                                disabled={next >= line.quantity}
                                onClick={() =>
                                  setRevision((current) => ({
                                    ...current,
                                    [line.itemId]: Math.min(
                                      line.quantity,
                                      reviseStep(line.unit, next, 1),
                                    ),
                                  }))
                                }
                                className="h-8 w-8 rounded text-lg font-semibold text-slate-700 disabled:opacity-30"
                              >
                                +
                              </button>
                            </span>
                          ) : (
                            <span className="shrink-0 text-sm tabular-nums text-slate-500">
                              {lineAmount(line)}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setRevising(null);
                        setRevision({});
                      }}
                      className="h-10 rounded-lg border border-slate-300 bg-card px-3 text-sm font-semibold text-slate-700"
                    >
                      {t.reviseCancel}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === order.id}
                      onClick={() => saveRevision(order)}
                      className="h-10 flex-1 rounded-lg bg-brand-600 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {t.reviseSave}
                    </button>
                  </div>
                </div>
              ) : (
                <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm">
                  {order.lines.map((line, index) => (
                    <li
                      key={`${order.id}-${index}`}
                      className="flex justify-between gap-3 text-slate-600"
                    >
                      <span className="min-w-0 truncate">
                        {lineName(line, locale)}
                        {/* No pack size beside a weighed amount — see the
                             note on the customer's track page. */}
                        {line.unit && !isLooseUnit(line.unit) ? ` · ${line.unit}` : ''}{' '}
                        {lineAmount(line)}
                      </span>
                      <span className="shrink-0 tabular-nums">{formatPaise(line.amountPaise)}</span>
                    </li>
                  ))}

                  {/* Broken out, because a total that silently includes a
                      journey is a total the owner cannot check against the
                      goods in the bag. */}
                  {order.deliveryFeePaise > 0 && (
                    <li className="flex justify-between gap-3 text-slate-500">
                      <span>{t.delivery}</span>
                      <span className="shrink-0 tabular-nums">
                        {formatPaise(order.deliveryFeePaise)}
                      </span>
                    </li>
                  )}
                </ul>
              )}

              {/* AFTER AN ORDER IS CUT, WHO SAYS SO.
                  A cut order changes what the customer pays, so somebody has
                  to tell them — but not necessarily the shopkeeper. The server
                  has already sent it to any phone that agreed to be told, and
                  the tracking page carries the full new list.

                  So this is loud only when the server could not reach them: a
                  green bar that stays put until it is sent. When it could, it
                  shrinks to one line saying so, with a quiet way to send it
                  anyway — the owner who wants to add a word of their own can,
                  and everyone else carries on serving. */}
              {pendingShare?.orderId === order.id &&
                (order.reachable ? (
                  <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                    <CheckIcon className="h-4 w-4 shrink-0 text-brand-600" />
                    {t.reviseToldCustomer}
                    <a
                      href={pendingShare.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setPendingShare(null)}
                      className="ml-auto shrink-0 font-semibold text-[#25D366] underline"
                    >
                      {t.reviseSendAnyway}
                    </a>
                  </p>
                ) : (
                  <a
                    href={pendingShare.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setPendingShare(null)}
                    className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white"
                  >
                    <WhatsAppIcon className="h-5 w-5" />
                    {t.reviseTellCustomer}
                  </a>
                ))}

              {/* THE ACTION ROW, REBUILT.
                  It was a wrap of eight controls in three shapes — two word
                  buttons, four icon squares, an orange bar — and on a 375px
                  phone it folded into three ragged rows whose order changed
                  with the order's state. Nothing on it read as the main thing
                  to do.

                  Now: the money and the two ways to reach the customer on one
                  line, then the things you DO to the order as a grid of equal
                  tiles, each an icon over a word. Same size, same order every
                  time, so an owner learns positions rather than reading four
                  buttons in a rush. Turning an order away sits under a rule on
                  its own, because it is the one act here with no undo. */}
              <div className="mt-3 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2">
                  <p className="mr-auto text-lg font-semibold tabular-nums text-slate-900">
                    {formatPaise(order.totalAmountPaise)}
                  </p>

                  {/* Reaching the customer is one tap from the order, not a
                      hunt back through WhatsApp for which message was theirs. */}
                  <a
                    href={`tel:+91${order.customerPhone}`}
                    aria-label={t.callCustomer}
                    title={t.callCustomer}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 text-slate-600 transition hover:bg-sunk"
                  >
                    <PhoneIcon className="h-[18px] w-[18px]" />
                  </a>

                  {/* WHATSAPP, WITH THE BILL. The printer icon that used to sit
                      here is gone: the PDF bill now travels with the message
                      itself — see `sendBill`. Green when there is news the
                      customer would not otherwise hear (`worthMessaging`); the
                      bill goes either way. */}
                  {whatsAppBill(order, worthMessaging(order) ? 'news' : 'plain')}
                </div>

                {settling === order.id ? (
                  /* The one question that decides where the money goes, asked
                     at the only moment the owner knows the answer. Plain
                     buttons rather than a dialog: this is a phone held in one
                     hand across a counter. */
                  <div className="mt-3 rounded-xl bg-sunk p-3">
                    <p className="text-sm font-semibold text-slate-700">{t.paymentAsk}</p>

                    {/* The same code the till shows, on the order itself.
                        Without it the till was the only screen that could take
                        a UPI payment, so an owner whose customer wanted to scan
                        had to re-enter the whole order over there — and that
                        second record is the double count. */}
                    {(upiId || upiQrData) && (
                      <div className="mt-2 flex flex-col items-center gap-1.5 rounded-lg bg-card p-3">
                        {upiId ? (
                          <QRCodeCanvas
                            value={upiPayUrlWithAmount(upiId, shopName, order.totalAmountPaise)}
                            size={148}
                            includeMargin
                            level="M"
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={upiQrData} alt="UPI QR" className="max-w-[9rem]" />
                        )}
                        <span className="text-xs text-slate-600">{t.sellScanToPay}</span>
                      </div>
                    )}

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        disabled={busyId === order.id}
                        onClick={() => setStatus(order.id, 'COMPLETED', true, 'CASH')}
                        className="h-11 rounded-xl border border-slate-300 bg-card text-sm font-semibold text-slate-800 disabled:opacity-50"
                      >
                        {t.sellCash}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === order.id}
                        onClick={() => setStatus(order.id, 'COMPLETED', true, 'UPI')}
                        className="h-11 rounded-xl bg-brand-600 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {t.sellUpi}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === order.id}
                        onClick={() => setStatus(order.id, 'COMPLETED', false)}
                        className="h-11 rounded-xl border border-amber-400 bg-amber-50 text-sm font-semibold text-amber-800 disabled:opacity-50"
                      >
                        {t.sellKhata}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSettling(null)}
                      className="mt-2 w-full py-1.5 text-sm font-medium text-slate-500"
                    >
                      {t.no}
                    </button>
                  </div>
                ) : (
                  revising !== order.id &&
                  WORKABLE.includes(order.status) && (
                    <>
                      {/* Equal tiles, icon over word. Two columns on a narrow
                          phone and four where there is room — never a wrap that
                          moves a button somewhere new. */}
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {/* THE OWNER WHO IS ALSO THE PACKER. A shop with nobody
                            to help reads the order here and picks the goods off
                            the Sell grid, which meant a tab switch per line.
                            This carries it to the till, where it stays on screen
                            with a tick box per line. */}
                        <Tile
                          href={`/owner/${slug}/sell?order=${order.id}`}
                          icon={CartIcon}
                          label={t.orderToTill}
                          tone="blue"
                        />

                        {/* ONE ORDER TO THE HELPER. The "Ready — tell them"
                            tile that sat here is gone by request: owners did
                            not know what it did. In its place, this order
                            alone to whoever does the running — the same
                            message the list button at the top sends for the
                            ticked orders, to the helper's number when the shop
                            has one set and to WhatsApp's contact picker when
                            it does not. */}
                        <Tile
                          href={`https://wa.me/${labourPhone ? toWhatsAppNumber(labourPhone) : ''}?text=${encodeURIComponent(
                            helperMessage([order]),
                          )}`}
                          icon={TruckIcon}
                          label={t.orderToHelper}
                          tone="violet"
                        />

                        {/* "We only have one." The third answer, between doing
                            the order and turning it away — and the one a kirana
                            actually gives most often. Hidden on orders whose
                            snapshot is too old to name its items. */}
                        {order.lines.some((line) => line.itemId) && (
                          <Tile
                            onClick={() => {
                              setRevising(order.id);
                              setRevision({});
                              setSettling(null);
                            }}
                            disabled={busyId === order.id}
                            icon={PencilIcon}
                            label={t.reviseOpen}
                            tone="amber"
                          />
                        )}

                        <Tile
                          onClick={() => setSettling(order.id)}
                          disabled={busyId === order.id}
                          icon={CheckIcon}
                          label={t.markCompleted}
                          tone="green"
                        />
                      </div>

                      {/* Under a rule and in words, because it is the one act on
                          this card that cannot be undone — and it now REMOVES
                          the order rather than greying it out. An unlabelled ✗
                          beside a ✓ is a mis-tap that turns a customer away. */}
                      <button
                        type="button"
                        disabled={busyId === order.id}
                        onClick={() => void removeOrder(order)}
                        className="mt-3 flex w-full items-center justify-center gap-1.5 border-t border-slate-100 pt-2.5 text-sm font-medium text-red-600 transition hover:text-red-700 disabled:opacity-50"
                      >
                        <CloseIcon className="h-4 w-4" />
                        {t.markCancelled}
                      </button>
                    </>
                  )
                )}
              </div>
            </li>
          ))}
        </ul>
      ))}

      {/* THE COMPLETED ORDERS, THREE MONTHS OF THEM, AS A SECTION OF THEIR OWN.
          Each is one line: who, their number, the time, and the WhatsApp icon
          that sends that order's PDF bill. The orders themselves are kept in
          the database, so any day's bill can be sent again. Narrowed by today,
          7 days, 30 days or all 3 months, by one date, or by name or number,
          with the count and the money for whatever is shown. */}
      {view === 'done' && (
        <section className="rounded-2xl border border-glass-edge bg-glass p-4 shadow-raised">
          <p className="text-xs text-slate-500">{t.ordersHistoryHint}</p>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {/* How far back, as one dropdown: today, 7 days, 30 days, 3 months. */}
            <select
              value={doneDate ? '' : String(doneRange)}
              onChange={(event) => {
                setDoneRange(Number(event.target.value) as 1 | 7 | 30 | 90);
                setDoneDate('');
              }}
              aria-label={t.historyRange}
              className="h-11 rounded-xl border border-slate-300 bg-card px-3 text-base"
            >
              {doneDate && <option value="">{t.historyDate}</option>}
              <option value="1">{t.historyToday}</option>
              <option value="7">{t.history7}</option>
              <option value="30">{t.history30}</option>
              <option value="90">{t.history90}</option>
            </select>
            <input
              type="search"
              value={doneSearch}
              onChange={(event) => setDoneSearch(event.target.value)}
              placeholder={t.historySearch}
              aria-label={t.historySearch}
              className="h-11 rounded-xl border border-slate-300 bg-card px-3 text-base focus:border-brand-500 focus:outline-none"
            />
            <input
              type="date"
              value={doneDate}
              onChange={(event) => setDoneDate(event.target.value)}
              aria-label={t.historyDate}
              className="h-11 rounded-xl border border-slate-300 bg-card px-3 text-base"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-sunk px-3 py-2">
            <p className="text-sm font-semibold tabular-nums text-slate-900">
              {t.historyCount.replace('{n}', String(doneShown.length))} · {formatPaise(doneTotalPaise)}
            </p>
            {(doneSearch || doneRange !== 90 || doneDate) && (
              <button
                type="button"
                onClick={() => {
                  setDoneSearch('');
                  setDoneRange(90);
                  setDoneDate('');
                }}
                className="ml-auto text-sm font-semibold text-brand-700"
              >
                {t.historyClear}
              </button>
            )}
          </div>

          {historyDays.length === 0 ? (
            <p className="mt-4 text-center text-sm text-slate-500">{t.historyNone}</p>
          ) : (
            historyDays.map((day) => (
              <div key={day.key} className="mt-3">
                <p className="text-xs font-semibold text-slate-500">{day.label}</p>
                <ul className="mt-1 divide-y divide-slate-100">
                  {day.orders.map((order) => (
                    <li
                      key={order.id}
                      id={`order-${order.id}`}
                      className={clsx(
                        'flex scroll-mt-40 items-center gap-3 rounded-lg py-2 transition',
                        highlight === order.id && 'bg-brand-50 ring-2 ring-brand-500',
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {order.customerName}
                        </p>
                        <p className="text-xs tabular-nums text-slate-500">
                          {order.customerPhone} · {formatClock(order.createdAt)}
                        </p>
                      </div>
                      {whatsAppBill(order, 'plain')}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </section>
      )}

      {dialog}
    </div>
  );
}
