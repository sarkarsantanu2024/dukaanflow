'use client';

/**
 * The plan screen: where this shop stands, then how to pay.
 *
 * It is deliberately thin. Everything about paying — choosing a plan, the QR,
 * sending proof, typing the activation code — is `UpgradeFlow`, the same
 * component the banner's dialog and the roadblock render. What this file adds
 * is the half a paying customer actually comes here for and a dialog has no
 * room for: what plan they are on, how much of it they have used, and the date
 * it runs out.
 */

import { ownerDict } from '@/lib/owner-i18n';
import { UpgradeFlow } from './UpgradeFlow';
import type { PlanState } from './PlanBanner';
import type { Locale } from '@/lib/i18n';

export function RenewScreen({
  slug,
  locale,
  plan,
  expiresOn,
}: {
  slug: string;
  locale: Locale;
  plan: PlanState;
  /** Already formatted on the server, so the two sides cannot disagree. */
  expiresOn: string | null;
}) {
  const t = ownerDict(locale);

  return (
    <div className="space-y-4">
      {/* WHERE THEY STAND, first and in plain words. An owner opening this
          screen is asking one question — am I paid up, and until when — and
          everything below is meaningless until that one is answered. */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h1 className="text-lg font-bold text-slate-900">{t.renewTitle}</h1>
        <p className="mt-2 flex flex-wrap items-baseline gap-x-2 text-slate-700">
          <span className="text-2xl font-bold text-slate-900">{plan.planName}</span>
          {/* `itemsCount`, not `blockItems` — the latter reads "for items" in
              Bengali and Hindi, a sentence fragment the roadblock completes and
              this line does not. */}
          <span className="text-sm tabular-nums text-slate-500">
            {plan.itemCount} {t.ofLimit} {plan.itemLimit} {t.itemsCount}
          </span>
        </p>

        <p className="mt-1.5 text-sm text-slate-600">
          {plan.trialDaysLeft !== null ? (
            <>
              {t.renewTrialUntil} <strong>{expiresOn}</strong>
            </>
          ) : !plan.canEdit ? (
            <span className="font-semibold text-red-700">{t.planExpired}</span>
          ) : expiresOn ? (
            <>
              {t.renewPaidUntil} <strong>{expiresOn}</strong>
            </>
          ) : null}
        </p>

        {/* The reason to pay before the date rather than on it. Without this
            said out loud, paying early looks like throwing away the days you
            have left, and an owner waits until the last one. */}
        <p className="mt-3 rounded-xl bg-brand-50 px-3 py-2 text-sm leading-relaxed text-brand-900">
          {t.renewEarlyHint}
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <UpgradeFlow
          slug={slug}
          locale={locale}
          itemCount={plan.itemCount}
          suggested={plan.suggested}
          helpUrl={plan.helpUrl}
        />
      </section>
    </div>
  );
}
