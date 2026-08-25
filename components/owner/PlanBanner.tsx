'use client';

/**
 * What the owner's plan lets them do, said once, at the top.
 *
 * Shown only when it matters: a trial running out, a catalogue near its limit,
 * or a lapsed subscription. A shop comfortably inside its plan sees nothing —
 * a permanent billing strip on a working tool is just noise.
 */

import { ownerDict } from '@/lib/owner-i18n';
import type { Locale } from '@/lib/i18n';

export type PlanState = {
  planName: string;
  status: string;
  itemCount: number;
  itemLimit: number;
  canEdit: boolean;
  trialDaysLeft: number | null;
  /** Pre-built wa.me link to the DukaanFlow operator. */
  renewUrl: string;
};

export function PlanBanner({
  slug,
  locale,
  plan,
}: {
  slug: string;
  locale: Locale;
  plan: PlanState;
}) {
  const t = ownerDict(locale);
  const remaining = plan.itemLimit - plan.itemCount;
  const nearLimit = remaining <= Math.max(3, Math.round(plan.itemLimit * 0.1));

  if (!plan.canEdit) {
    return (
      <div className="rounded-2xl border border-red-300 bg-red-50 p-4">
        <p className="text-sm font-medium text-red-800">{t.planExpired}</p>
        <a
          href={plan.renewUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex h-11 items-center rounded-xl bg-[#25D366] px-4 text-sm font-semibold text-white"
        >
          {t.renewOnWhatsApp}
        </a>
      </div>
    );
  }

  if (plan.trialDaysLeft !== null && plan.trialDaysLeft <= 7) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-3">
        <p className="min-w-0 flex-1 text-sm text-amber-900">
          <strong>{plan.trialDaysLeft}</strong> {t.trialDaysLeft}
        </p>
        <a
          href={plan.renewUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 shrink-0 items-center rounded-lg bg-amber-600 px-3 text-sm font-semibold text-white"
        >
          {t.planUpgrade}
        </a>
      </div>
    );
  }

  if (nearLimit) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-3">
        <p className="min-w-0 flex-1 text-sm text-amber-900">
          {remaining <= 0 ? (
            <strong>{t.planFull}</strong>
          ) : (
            <>
              <strong>
                {plan.itemCount} {t.ofLimit} {plan.itemLimit}
              </strong>{' '}
              {t.itemsCount} · {plan.planName}
            </>
          )}
        </p>
        <a
          href={plan.renewUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 shrink-0 items-center rounded-lg bg-amber-600 px-3 text-sm font-semibold text-white"
        >
          {t.planUpgrade}
        </a>
      </div>
    );
  }

  return null;
}
