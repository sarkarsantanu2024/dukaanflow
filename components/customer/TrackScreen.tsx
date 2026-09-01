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
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatPaise } from '@/lib/money';
import { amountLabel } from '@/lib/units';
import { formatClock, formatDay } from '@/lib/time';
import { BrandMark } from '@/components/ui/BrandMark';
import { LangToggle } from './LangToggle';
import { WhatsAppIcon } from '@/components/ui/Icon';
import { dict, LOCALES, type Locale } from '@/lib/i18n';

const LOCALE_STORAGE_KEY = 'halkhata:locale';

export type TrackedOrder = {
  id: string;
  status: 'NEW' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  orderType: 'DELIVERY' | 'PICKUP';
  totalAmountPaise: number;
  deliveryFeePaise: number;
  /** Did the shop cut this order down to what they actually had? */
  revised: boolean;
  placedAt: string;
  customerName: string;
  shopName: string;
  shopSlug: string;
  shopPhone: string;
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

export function TrackScreen({ order }: { order: TrackedOrder | null }) {
  // Bengali first, then whatever this phone last chose on any shop page — the
  // same rule the storefront follows, so a customer's language does not change
  // when they follow a link out of a notification.
  const [locale, setLocale] = useState<Locale>('bn');
  const t = dict(locale);
  const router = useRouter();

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
  const waiting = order?.status === 'NEW' || order?.status === 'CONFIRMED';

  useEffect(() => {
    if (!waiting) return;
    // Half a minute. A kirana order takes minutes to fill, so anything faster
    // is load without news; anything slower and the page feels stuck.
    const timer = setInterval(() => {
      if (!document.hidden) router.refresh();
    }, 30_000);
    return () => clearInterval(timer);
  }, [waiting, router]);

  const header = (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-2.5">
        <BrandMark className="text-sm" />
        <div className="ml-auto">
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
          <h1 className="mt-3 text-xl font-bold text-slate-900">{t.trackNotFound}</h1>
          <p className="mt-1 text-slate-600">{t.trackNotFoundHint}</p>
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
      ? {
          tone: 'bg-green-50 text-green-800',
          line: order.orderType === 'PICKUP' ? t.trackStateReadyPickup : t.trackStateReadyDelivery,
        }
      : order.status === 'CANCELLED'
        ? { tone: 'bg-slate-100 text-slate-600', line: t.trackStateCancelled }
        : { tone: 'bg-brand-50 text-brand-800', line: t.trackStatePreparing };

  const goodsPaise = order.totalAmountPaise - order.deliveryFeePaise;

  return (
    <div className="min-h-dvh bg-slate-100">
      {header}

      <main className="mx-auto max-w-lg space-y-3 px-4 py-4">
        <section className="rounded-2xl bg-white p-4 shadow-card">
          <p className="text-sm text-slate-500">{order.shopName}</p>
          <h1 className="text-xl font-bold text-slate-900">{t.trackTitle}</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            {t.trackPlaced} {formatDay(order.placedAt)} · {formatClock(order.placedAt)} ·{' '}
            {order.orderType === 'DELIVERY' ? t.delivery : t.pickup}
          </p>

          <p className={`mt-3 rounded-xl px-3 py-2 text-sm font-semibold ${state.tone}`}>
            {state.line}
          </p>
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

        <section className="rounded-2xl bg-white p-4 shadow-card">
          <ul className="space-y-1.5 text-sm">
            {order.lines.map((line, index) => (
              <li key={index} className="flex justify-between gap-3 text-slate-700">
                <span className="min-w-0">
                  {lineName(line, locale)}
                  {line.unit ? ` · ${line.unit}` : ''}{' '}
                  {/* The amount, where the item is sold by weight: "× 0.05"
                      is what a fractional quantity looks like as a multiplier,
                      and the customer needs to read back the 50 g they
                      asked for. */}
                  {amountLabel(line.unit, line.quantity) ?? `× ${line.quantity}`}
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

          <p className="mt-3 flex justify-between border-t border-slate-100 pt-3 text-base font-bold text-slate-900">
            <span>{t.total}</span>
            <span className="tabular-nums">{formatPaise(order.totalAmountPaise)}</span>
          </p>
        </section>

        {/* The shop is one tap away in both directions: a question goes to
            WhatsApp, another order goes to the shop page. */}
        <div className="flex gap-2">
          <a
            href={`https://wa.me/91${order.shopPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] text-sm font-semibold text-white"
          >
            <WhatsAppIcon className="h-5 w-5" />
            {order.shopName}
          </a>
        </div>

        <Link
          href={`/shop/${order.shopSlug}`}
          className="block rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-brand-700 shadow-card"
        >
          {t.trackOrderAgain}
        </Link>

        <p className="px-1 text-center text-xs text-slate-500">{t.trackHint}</p>
      </main>
    </div>
  );
}
