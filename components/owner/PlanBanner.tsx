'use client';

/**
 * What the owner's plan lets them do, said once, at the top.
 *
 * Shown only when it matters: a trial running out, a catalogue near its limit,
 * or a lapsed subscription. A shop comfortably inside its plan sees nothing —
 * a permanent billing strip on a working tool is just noise.
 *
 * HOW MUCH ROOM IT TAKES IS PART OF THE DESIGN. This used to be a padded card
 * with a paragraph in it, which on a phone pushed the actual work down by most
 * of a thumb — every day, for the whole of a trial. It is now one line: the
 * fact, and the button. Only the lapsed case is allowed to be a block, because
 * by then the fact IS the screen's business.
 */

import { ownerDict } from '@/lib/owner-i18n';
import { UpgradeModal } from './UpgradeModal';
import type { Plan } from '@/lib/plans';
import type { Locale } from '@/lib/i18n';

export type PlanState = {
  planName: string;
  status: string;
  itemCount: number;
  itemLimit: number;
  canEdit: boolean;
  trialDaysLeft: number | null;
  /** The cheapest plan that holds what this shop already lists. */
  suggested: Plan;
  /** wa.me link to the operator, or "" when no support number is configured. */
  helpUrl: string;
};

/*
 * There was a `renewUrl` here — a wa.me link every button on this banner
 * opened. With no support number configured it resolved to /pricing, a page
 * that cannot take a payment and does not know which shop is reading it, so
 * the one prompt we give an owner about money led nowhere.
 *
 * Every button now opens the payment dialog in place. WhatsApp is still inside
 * it — as the way to reach a person once the money has been sent, which is what
 * it was always good for.
 */

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

  const pay = (
    <UpgradeModal
      slug={slug}
      locale={locale}
      itemCount={plan.itemCount}
      suggested={plan.suggested}
      helpUrl={plan.helpUrl}
      label={t.payNow}
      size="sm"
    />
  );

  if (!plan.canEdit) {
    return (
      <div className="rounded-2xl border border-red-300 bg-red-50 p-4">
        <p className="text-sm font-medium text-red-800">{t.planExpired}</p>
        <div className="mt-3">
          <UpgradeModal
            slug={slug}
            locale={locale}
            itemCount={plan.itemCount}
            suggested={plan.suggested}
            helpUrl={plan.helpUrl}
            label={t.payNow}
            size="md"
          />
        </div>
      </div>
    );
  }

  if (plan.trialDaysLeft !== null && plan.trialDaysLeft <= 7) {
    return (
      <Strip>
        <span className="min-w-0 flex-1 truncate">
          <strong className="tabular-nums">{plan.trialDaysLeft}</strong> {t.trialDaysLeft}
        </span>
        {pay}
      </Strip>
    );
  }

  if (nearLimit) {
    return (
      <Strip>
        <span className="min-w-0 flex-1 truncate">
          {remaining <= 0 ? (
            <strong>{t.planFull}</strong>
          ) : (
            <>
              <strong className="tabular-nums">
                {plan.itemCount} {t.ofLimit} {plan.itemLimit}
              </strong>{' '}
              {t.itemsCount}
            </>
          )}
        </span>
        {pay}
      </Strip>
    );
  }

  return null;
}

/**
 * One line, one button, no padding to speak of.
 *
 * `truncate` on the text rather than wrapping: Bengali and Hindi both run
 * longer than the English these strings were measured in, and a banner that
 * grows a second line on two of three languages is a banner designed for one.
 */
function Strip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 py-1.5 pl-3 pr-1.5 text-sm text-amber-900">
      {children}
    </div>
  );
}
