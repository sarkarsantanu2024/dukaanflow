'use client';

/**
 * What the shop has done with one order.
 *
 * WHY A PAGE AND NOT ONLY A NOTIFICATION. Push is never the system of record —
 * on the Xiaomis, Oppos and Realmes this market runs on, a notification can
 * simply never arrive, and a customer who was promised one and got nothing has
 * been let down by the app rather than by the shop. This page is the thing that
 * is always true, reachable from the link handed over the moment the order was
 * placed, and it is what a notification opens when one does arrive.
 *
 * THE CASE IT WAS REALLY BUILT FOR is the shortened order: a customer asks for
 * two kilos of basmati, the sack has one, and the shop sends the one. The
 * shopkeeper cuts the line in their own app; this page then shows what is
 * actually coming and what it now costs, with the change said out loud at the
 * top. Without it the customer's only record of their order is the number they
 * agreed to, which is no longer the number they will be asked for — and that
 * gap is an argument at the door.
 *
 * A client component only because the shopper's language lives in this
 * browser's storage. Everything shown is server-rendered data.
 */

import { useEffect, useState } from 'react';
import { CustomerBell } from './CustomerBell';
import { InstallButton } from './InstallButton';
import { AlponaMotif } from '@/components/ui/Ornament';
import { readMyOrders } from '@/lib/my-orders';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatPaise } from '@/lib/money';
import { downloadBillPdf } from '@/lib/bill-pdf';
import { ownerDict } from '@/lib/owner-i18n';
import { amountLabel, isLooseUnit, localUnit } from '@/lib/units';
import { formatClock, formatDay } from '@/lib/time';
import { BrandMark } from '@/components/ui/BrandMark';
import { LangToggle } from './LangToggle';
import { CartIcon, PdfIcon } from '@/components/ui/Icon';
import { dict, LOCALES, type Locale } from '@/lib/i18n';
import { useHtmlLang } from '@/components/ui/useHtmlLang';
import { isWaiting, type OrderStatus } from '@/lib/order-status';

const LOCALE_STORAGE_KEY = 'halkhata:locale';

export type TrackedOrder = {
  id: string;
  status: OrderStatus;
  orderType: 'DELIVERY' | 'PICKUP';
  totalAmountPaise: number;
  deliveryFeePaise: number;
  /** Did the shop cut this order down to what they actually had? */
  revised: boolean;
  placedAt: string;
  /** How it was paid, once the order is done; null before that. */
  paymentMode: 'CASH' | 'UPI' | 'KHATA' | null;
  customerName: string;
  shopName: string;
  shopSlug: string;
  lines: {
    name: string;
    nameBn: string;
    nameHi: string;
    unit: string;
    quantity: number;
    amountPaise: number;
  }[];
};

function lineName(
  line: { name: string; nameBn: string; nameHi: string },
  locale: Locale,
): string {
  if (locale === 'bn') return line.nameBn || line.name;
  if (locale === 'hi') return line.nameHi || line.name;
  return line.name;
}

export function TrackScreen({ order, orderId }: { order: TrackedOrder | null; orderId: string }) {
  // Bengali first, then whatever this phone last chose on any shop page — the
  // same rule the storefront follows, so a customer's language does not change
  // when they follow a link out of a notification.
  const [locale, setLocale] = useState<Locale>('bn');

  /** The bill PDF is being drawn, so its button cannot be double-tapped. */
  const [sharing, setSharing] = useState(false);
  const t = dict(locale);
  const router = useRouter();
  useHtmlLang(locale);

  useEffect(() => {
    const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved && (LOCALES as readonly string[]).includes(saved)) setLocale(saved as Locale);
  }, []);

  function changeLocale(next: Locale) {
    setLocale(next);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
  }

  /**
   * Keeps itself current while the order is still live.
   *
   * FOR THE CUSTOMER WHO SAID NO TO NOTIFICATIONS — and for a shop that only
   * does collection, where every order ends with somebody deciding when to walk
   * over. Without this they have a page that was true when it loaded and a
   * shopkeeper who has to message them by hand; with it, leaving the tab open
   * is enough.
   *
   * Only while there is something to wait for: a completed or cancelled order
   * has reached its last state and will never change again, so polling it would
   * be a request every half minute, forever, for nothing.
   *
   * `document.hidden` is checked on each tick rather than a listener, because a
   * phone with this in a background tab is a phone in somebody's pocket — and
   * that is exactly the case that should cost the server nothing.
   */
  // Worth watching while the shop is still working on it, and while it is packed
  // and not yet collected — a customer refreshing this page is asking exactly
  // "has anything happened?".
  const waiting = order ? isWaiting(order.status) : false;

  useEffect(() => {
    if (!waiting) return;
    // Half a minute. A kirana order takes minutes to fill, so anything faster
    // is load without news; anything slower and the page feels stuck.
    const timer = setInterval(() => {
      if (!document.hidden) router.refresh();
    }, 30_000);
    return () => clearInterval(timer);
  }, [waiting, router]);

  /**
   * The shop this order is from. For an order that no longer exists (turned
   * away, or purged) the server cannot say, but this phone remembers which shop
   * it placed it at — so back still goes to that shop, not the landing page.
   */
  const [rememberedSlug, setRememberedSlug] = useState('');
  useEffect(() => {
    if (!order) setRememberedSlug(readMyOrders().find((mine) => mine.id === orderId)?.slug ?? '');
  }, [order, orderId]);
  const shopHref = order ? `/shop/${order.shopSlug}` : rememberedSlug ? `/shop/${rememberedSlug}` : '/';

  /**
   * THE SHOP PAGE'S OWN BAR, and no back arrow (2026-10-01, by request): the
   * order page looked like a different app from the shop it came from. The
   * mark goes to the shop; the phone's back button goes wherever they came
   * from, and the shop page then offers the way back here — see `MyOrderBar`.
   */
  const header = (
    <header className="z-20 bg-chrome">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
        <BrandMark href={shopHref} tone="dark" className="text-sm" />
        <div className="ml-auto flex items-center gap-1">
          <InstallButton locale={locale} />
          <CustomerBell locale={locale} viewingOrderId={orderId} />
          <LangToggle value={locale} onChange={changeLocale} />
        </div>
      </div>
    </header>
  );

  if (!order) {
    return (
      <div className="min-h-dvh bg-slate-100">
        {header}
        {/* Orders are purged on each shop's subscription anniversary, so an old
            link genuinely stops working. Said as a fact about age rather than
            as an error, because the customer did nothing wrong. */}
        <main className="mx-auto max-w-lg px-4 py-10 text-center">
          <p className="text-4xl">🔎</p>
          <h1 className="mt-3 text-xl font-semibold text-slate-900">{t.trackNotFound}</h1>
          <p className="mt-1 text-slate-600">{t.trackNotFoundHint}</p>
          {/* A dead end no longer: an order that is gone was most often turned
              away, and the next thing wanted is the shop itself. */}
          {rememberedSlug && (
            <Link
              href={shopHref}
              className="mt-6 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-brand-700 active:scale-[0.99]"
            >
              <CartIcon className="h-4 w-4 shrink-0" />
              {t.trackOrderAgain}
            </Link>
          )}
        </main>
      </div>
    );
  }

  /**
   * Where the order is, in the customer's own words.
   *
   * NEW and CONFIRMED read the same on purpose. The difference between "the
   * shop has it" and "the shop has accepted it" is real to the shopkeeper and
   * means nothing to the person waiting — orders arrive accepted anyway, and
   * two near-identical states would only look like something had stalled.
   */
  const state =
    order.status === 'COMPLETED'
        ? { tone: 'bg-green-50 text-green-800', line: t.trackStateDone }
        : order.status === 'CANCELLED'
          ? { tone: 'bg-slate-100 text-slate-600', line: t.trackStateCancelled }
          : { tone: 'bg-brand-50 text-brand-800', line: t.trackStatePreparing };

  const goodsPaise = order.totalAmountPaise - order.deliveryFeePaise;


  /**
   * THE BILL, SAVED TO THE PHONE — where the shop's "your bill" link lands.
   *
   * Drawn here, in the customer's browser, because that is where the Bengali
   * and Hindi fonts are (see `lib/bill-pdf.ts`). In the customer's language,
   * with how it was paid once the order is done — the same bill the shop's own
   * PDF button makes.
   */
  async function saveBill() {
    if (!order) return;
    setSharing(true);
    try {
      const tb = ownerDict(locale);
      await downloadBillPdf(
        {
          shopName: order.shopName,
          lines: order.lines.map((line) => ({
            name: lineName(line, locale),
            unit: line.unit,
            quantity: line.quantity,
            amountPaise: line.amountPaise,
          })),
          totalPaise: order.totalAmountPaise,
          ...(order.paymentMode ? { paymentMode: order.paymentMode } : {}),
          at: new Date(order.placedAt),
          customerName: order.customerName,
        },
        {
          bill: tb.billDoc,
          total: tb.billTotal,
          paidBy: tb.billPaidBy,
          paymentMode: { CASH: tb.sellCash, UPI: tb.sellUpi, KHATA: tb.sellKhata },
          credit: `${tb.billDoc} · ${order.shopName}`,
          unitLocale: locale,
        },
        `bill-${order.id.slice(0, 8)}.pdf`,
      );
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="min-h-dvh bg-slate-100">
      {header}

      <main className="mx-auto max-w-lg space-y-3 px-4 pb-6 pt-3">
        {/* The shop page's dark card, so this reads as the same shop. */}
        <section className="relative overflow-hidden rounded-2xl bg-hero p-4 shadow-float">
          <AlponaMotif className="pointer-events-none absolute -right-6 -top-10 h-36 w-36 text-white/10" />
          <div className="relative">
            <p className="text-sm text-brand-100">{order.shopName}</p>
            <h1 className="text-xl font-medium text-white">{t.trackTitle}</h1>
            <p className="mt-0.5 text-xs text-brand-100">
              {t.trackPlaced} {formatDay(order.placedAt)} · {formatClock(order.placedAt)} ·{' '}
              {order.orderType === 'DELIVERY' ? t.delivery : t.pickup}
            </p>

            <p className={`mt-3 rounded-xl px-3 py-2 text-sm font-semibold ${state.tone}`}>
              {state.line}
            </p>
          </div>
        </section>

        {/* SAID FIRST, IN AMBER, ABOVE THE LIST.
            A customer who agreed to two kilos and is coming for one has to meet
            that fact before the numbers, not work it out from them. */}
        {order.revised && (
          <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
            <p className="font-semibold text-amber-900">{t.trackChanged}</p>
            <p className="mt-0.5 text-sm text-amber-800">{t.trackChangedHint}</p>
          </section>
        )}

        <section className="rounded-2xl border border-glass-edge bg-glass p-4 shadow-raised">
          <ul className="space-y-1.5 text-sm">
            {order.lines.map((line, index) => (
              <li key={index} className="flex justify-between gap-3 text-slate-700">
                <span className="min-w-0">
                  {lineName(line, locale)}
                  {/* THE PACK SIZE IS NOT PRINTED BESIDE A WEIGHED AMOUNT.
                      "QA Posto · 1 kg 250 g" is what that produced, and it
                      reads as a kilo and a quarter rather than as a quarter of
                      a kilo bought at a kilo's rate. For a weighed line the
                      amount says everything; for a counted one the pack size
                      is what "× 2" is two of. */}
                  {line.unit && !isLooseUnit(line.unit) ? ` · ${localUnit(line.unit, locale)}` : ''}{' '}
                  {/* The amount, where the item is sold by weight: "× 0.05"
                      is what a fractional quantity looks like as a multiplier,
                      and the customer needs to read back the 50 g they
                      asked for. */}
                  {localUnit(amountLabel(line.unit, line.quantity) ?? `× ${line.quantity}`, locale)}
                </span>
                <span className="shrink-0 tabular-nums">{formatPaise(line.amountPaise)}</span>
              </li>
            ))}

            {order.deliveryFeePaise > 0 && (
              <>
                <li className="flex justify-between gap-3 border-t border-slate-100 pt-1.5 text-slate-500">
                  <span>{t.goods}</span>
                  <span className="tabular-nums">{formatPaise(goodsPaise)}</span>
                </li>
                <li className="flex justify-between gap-3 text-slate-500">
                  <span>{t.deliveryCharge}</span>
                  <span className="tabular-nums">{formatPaise(order.deliveryFeePaise)}</span>
                </li>
              </>
            )}
          </ul>

          <p className="mt-3 flex justify-between border-t border-slate-100 pt-3 text-base font-semibold text-slate-900">
            <span>{t.total}</span>
            <span className="tabular-nums">{formatPaise(order.totalAmountPaise)}</span>
          </p>

          {/* The shop's WhatsApp message links here as "your bill": once the
              order is done, the bill itself is one tap to keep. */}
          {order.status === 'COMPLETED' && (
            <button
              type="button"
              onClick={() => void saveBill()}
              disabled={sharing}
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-brand-300 bg-card px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 disabled:opacity-50"
            >
              <PdfIcon className="h-5 w-5" />
              {t.trackDownloadBill}
            </button>
          )}
        </section>

        {/* ONE THING TO DO FROM HERE: order again.
            A "message the shop on WhatsApp" button sat beside this, removed
            by request (27 Sep): the page, the bell, the spoken alert and the
            push already tell the customer what the shop did, and the shop's
            own WhatsApp is one tap away on the shop page this goes to. */}
        <Link
          href={`/shop/${order.shopSlug}`}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-md transition hover:bg-brand-700 active:scale-[0.99]"
        >
          <CartIcon className="h-5 w-5 shrink-0" />
          {t.trackOrderAgain}
        </Link>

        <p className="px-1 text-center text-xs text-slate-500">{t.trackHint}</p>
      </main>
    </div>
  );
}
