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
 * trading — but because a "Later" here produces an owner who has clicked past
 * the only screen that told them what to do, three times, and then rings up
 * asking why they cannot add an item. The way out is on the screen.
 *
 * WHAT IS NOT IN THIS FILE ANY MORE: the payment UI. It used to carry its own
 * QR, its own month/year toggle and its own `upi://pay` builder off an
 * environment variable — a second implementation of paying, which drifted from
 * the real one the moment the operator's QR moved into the database. It renders
 * `UpgradeFlow` now, exactly as the banner and the plan screen do, so there is
 * one way to pay and it cannot disagree with itself.
 */

import { ownerDict } from '@/lib/owner-i18n';
import { UpgradeFlow } from './UpgradeFlow';
import type { Plan } from '@/lib/plans';
import type { Locale } from '@/lib/i18n';

export type RoadblockState = {
  /** Why the owner is here. Paused means the storefront is off too. */
  reason: 'trial-over' | 'paused';
  /** The cheapest plan that holds this shop's catalogue, by name and by id. */
  planName: string;
  suggested: Plan;
  itemCount: number;
  /** wa.me link to the operator, or "" when no support number is configured. */
  helpUrl: string;
};

export function SubscriptionRoadblock({
  slug,
  locale,
  state,
}: {
  slug: string;
  locale: Locale;
  state: RoadblockState;
}) {
  const t = ownerDict(locale);
  const paused = state.reason === 'paused';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="roadblock-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 p-4 backdrop-blur-sm"
    >
      <div className="mx-auto my-auto flex min-h-full max-w-md items-center">
        <div className="w-full overflow-hidden rounded-2xl bg-white shadow-xl">
          <div className={paused ? 'bg-red-600 px-5 py-4 text-white' : 'bg-chrome px-5 py-4 text-white'}>
            <h2 id="roadblock-title" className="text-lg font-bold leading-tight">
              {paused ? t.blockPausedTitle : t.blockTitle}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-white/85">
              {paused ? t.blockPaused : t.blockTrialOver}
            </p>
          </div>

          <div className="px-5 py-4">
            <UpgradeFlow
              slug={slug}
              locale={locale}
              itemCount={state.itemCount}
              suggested={state.suggested}
              helpUrl={state.helpUrl}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
