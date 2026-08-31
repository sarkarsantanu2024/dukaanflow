'use client';

/**
 * The wall an owner meets when the trial or a paid period has ended.
 *
 * Deliberately a roadblock and not a banner. The banner it replaces was honest
 * and completely ignorable — an owner could carry on using the app for weeks
 * with a red strip at the top, which meant the moment we most needed a decision
 * was the moment we asked for it most quietly.
 *
 * It is also deliberately not a paywall in the usual sense: the shop's page and
 * QR keep serving customers behind it, and everything the owner has — items,
 * khata, customers — is still there. What is blocked is *editing*, which is the
 * one thing that costs the owner nothing to lose for a day and costs them a
 * conversation with us to get back.
 *
 * There is no dismiss. Not because we want to trap anybody — the shop is still
 * trading, and the WhatsApp button reaches a person in seconds — but because a
 * "Later" here produces an owner who has clicked past the only screen that told
 * them what to do, three times, and then rings up asking why they cannot add an
 * item. The way out is to pay or to talk to us, and both are on the screen.
 */

import { QRCodeCanvas } from 'qrcode.react';
import { useState } from 'react';
import { ownerDict } from '@/lib/owner-i18n';
import { WhatsAppIcon } from '@/components/ui/Icon';
import { formatPaise, paiseToUpiAmount, rupeesToPaise } from '@/lib/money';
import type { Locale } from '@/lib/i18n';
import { BRAND_NAME } from '@/lib/brand';

export type RoadblockState = {
  /** Why the owner is here. Paused means the storefront is off too. */
  reason: 'trial-over' | 'paused';
  planName: string;
  planPriceRupees: number;
  planItemLimit: number;
  itemCount: number;
  /** Whole rupees for a year of this plan, paid up front (two months free). */
  planYearRupees: number;
  /** What paying yearly saves against twelve monthly payments. */
  planYearSavingRupees: number;
  /** `upi://pay?...` with the plan's monthly price filled in, or "" when unconfigured. */
  payUrl: string;
  /** The same, for a year. Empty when no UPI id is configured. */
  payUrlYear: string;
  /** The UPI id itself, printed under the code so it can be typed by hand. */
  upiId: string;
  /** wa.me link to the operator, carrying the shop's name and slug. */
  helpUrl: string;
};

export function SubscriptionRoadblock({
  locale,
  state,
}: {
  locale: Locale;
  state: RoadblockState;
}) {
  const t = ownerDict(locale);
  const paused = state.reason === 'paused';

  /**
   * WHICH PERIOD THIS SCREEN OPENS ON.
   *
   * Monthly, deliberately, even though the year is the better deal for both
   * sides. An owner reaching this screen is locked out of their own shop and
   * anxious; opening on ₹2,490 when they were braced for ₹249 risks losing the
   * payment altogether, and a shop that pays nothing churns harder than one
   * that pays monthly. The yearly option sits beside it with its saving in
   * plain sight, and the pricing page — read calmly, before any of this —
   * leads with the year instead.
   */
  const [yearly, setYearly] = useState(false);

  const pricePaise = rupeesToPaise(yearly ? state.planYearRupees : state.planPriceRupees);
  const payUrl = yearly ? state.payUrlYear : state.payUrl;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="roadblock-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 p-4 backdrop-blur-sm"
    >
      <div className="mx-auto my-auto flex min-h-full max-w-md items-center">
        <div className="w-full overflow-hidden rounded-2xl bg-white shadow-xl">
          <div
            className={
              paused
                ? 'bg-red-600 px-5 py-4 text-white'
                : 'bg-chrome px-5 py-4 text-white'
            }
          >
            <h2 id="roadblock-title" className="text-lg font-bold leading-tight">
              {paused ? t.blockPausedTitle : t.blockTitle}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-white/85">
              {paused ? t.blockPaused : t.blockTrialOver}
            </p>
          </div>

          <div className="px-5 py-4">
            {/* The plan is chosen from what the shop actually holds, not
                offered as a menu. An owner staring at four tiers on a phone
                while their shop is blocked is being asked to do our job. */}
            <p className="text-sm text-slate-600">
              {t.blockPlanFor} <strong className="tabular-nums">{state.itemCount}</strong>{' '}
              {t.blockItems}
            </p>
            <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
              <span className="text-2xl font-bold text-slate-900">{state.planName}</span>
              <span className="text-2xl font-bold tabular-nums text-brand-700">
                {formatPaise(pricePaise)}
              </span>
              <span className="text-sm text-slate-500">
                {yearly ? t.blockYear : t.blockMonth}
              </span>
            </p>

            {/* Month or year, as two buttons rather than a switch: a switch
                has an on-state to work out, and these are two prices to
                compare. The saving is on the control itself, because it is the
                reason to press it. */}
            <div className="mt-3 inline-flex rounded-xl bg-slate-100 p-1" role="group">
              <button
                type="button"
                aria-pressed={!yearly}
                onClick={() => setYearly(false)}
                className={
                  'rounded-lg px-3 py-1.5 text-sm font-semibold transition ' +
                  (yearly ? 'text-slate-600' : 'bg-white text-slate-900 shadow-sm')
                }
              >
                {t.blockPerMonth}
              </button>
              <button
                type="button"
                aria-pressed={yearly}
                onClick={() => setYearly(true)}
                className={
                  'rounded-lg px-3 py-1.5 text-sm font-semibold transition ' +
                  (yearly ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600')
                }
              >
                {t.blockPerYear}
                <span className="ml-1 font-bold text-brand-700">
                  −₹{state.planYearSavingRupees.toLocaleString('en-IN')}
                </span>
              </button>
            </div>

            {payUrl ? (
              <div className="mt-4 flex flex-col items-center">
                <p className="mb-2 text-sm font-semibold text-slate-700">{t.blockScan}</p>
                <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                  {/* The amount is inside the code, so the owner confirms a
                      figure rather than typing one — a digit out here is a
                      payment we have to chase and refund. */}
                  <QRCodeCanvas
                    value={payUrl}
                    size={512}
                    level="M"
                    marginSize={2}
                    style={{ width: '11rem', height: 'auto', display: 'block' }}
                  />
                </div>
                {state.upiId && (
                  <p className="mt-2 break-all text-center text-xs text-slate-500">
                    {state.upiId}
                  </p>
                )}

                {/* A phone showing this QR cannot scan it. On the same device
                    the intent link opens the payment app directly. */}
                <a
                  href={payUrl}
                  className="mt-3 inline-flex h-11 items-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white"
                >
                  {t.blockScan} · {formatPaise(pricePaise)}
                </a>

                <p className="mt-3 text-center text-xs leading-relaxed text-slate-500">
                  {t.blockAfterPaying}
                </p>
              </div>
            ) : (
              // No UPI id configured. Rather than showing a QR that pays
              // nobody, the conversation becomes the only route.
              <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                {t.blockAfterPaying}
              </p>
            )}

            <a
              href={state.helpUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] text-sm font-semibold text-white"
            >
              <WhatsAppIcon className="h-5 w-5" />
              {t.blockHelp}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The `upi://pay` intent for a plan, with the price already filled in. */
export function planPayUrl(upiId: string, planName: string, priceRupees: number): string {
  if (!upiId) return '';
  const params = new URLSearchParams({
    pa: upiId,
    pn: BRAND_NAME,
    am: paiseToUpiAmount(rupeesToPaise(priceRupees)),
    cu: 'INR',
    tn: `${BRAND_NAME} ${planName}`,
  });
  return `upi://pay?${params.toString()}`;
}
