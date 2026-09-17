'use client';

/**
 * The operator's own controls for one shop's subscription.
 *
 * WHAT THIS SCREEN IS FOR. Most shopkeepers now pay through their own app: they
 * scan, send a screenshot, and the operator issues a code from /admin/payments.
 * This panel is the other path — the one for a shop that cannot do that. An
 * owner who paid in cash, or over the phone, or who simply will not manage it on
 * a handset, and an operator sitting with them sorting it out. So every control
 * here is a manual override, and it should read like one.
 *
 * IT WAS ONE FLAT CARD, and that was the problem. Status, a usage bar, a
 * three-field form, a primary button, two destructive buttons, a separate
 * one-off charge and a payment history all sat at the same visual level, so
 * nothing said which of them was the job. "Cancel" sat a few pixels from
 * "Record payment" wearing almost the same weight.
 *
 * It is four labelled blocks now, in the order an operator needs them:
 *   1. WHERE THIS SHOP STANDS — read-only, because it is the question asked
 *      first and it is never the thing being changed.
 *   2. RECORD A PAYMENT — the job, with the resulting date shown before the
 *      button is pressed.
 *   3. LISTING SERVICE — money for work done, boxed off because it buys no time.
 *   4. CORRECTIONS — past due and cancel, kept quiet and last, because they
 *      are rare and one of them is destructive.
 */

import { formatDay } from '@/lib/time';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/useConfirm';
import { formatPaise, paiseToInput, parsePaise } from '@/lib/money';
import { periodFor } from '@/lib/period';
import {
  AUTO_PAUSE_DAYS,
  GRACE_DAYS,
  LISTING_PAISE_PER_ITEM,
  MONTHS_PER_YEAR_PAID,
  PLAN_ORDER,
  PLAN_SPECS,
  amountForMonthsPaise,
  listingChargePaise,
  standingLabel,
  type Plan,
  type Standing,
  type SubStatus,
} from '@/lib/plans';

export type SubscriptionState = {
  plan: Plan;
  status: SubStatus;
  itemCount: number;
  /** The limit IN FORCE today — a trial's or a custom deal's, not the plan's. */
  itemLimit: number;
  /**
   * The plan name in force today, which is not always `plan`.
   *
   * A trial grants the top tier whatever the shop is stored as, and a custom
   * deal replaces both the name and the limit. The panel used to print the
   * STORED plan beside the EFFECTIVE limit, so a trialling Basic shop read
   * "Basic · 9 / 1000 items" and looked broken — which is exactly how a real
   * billing bug got noticed, and exactly how a real one could hide.
   */
  effectivePlanName: string;
  /** Days of free trial left, or null when the shop is not on one. */
  trialDaysLeft: number | null;
  /** Where the shop stands today, from the dates. See `Entitlement.standing`. */
  standing: Standing;
  /** Days until the shop page goes offline, or null. */
  daysUntilAutoPause: number | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  /** A price agreed with this one shop, or nulls when it is on the ladder. */
  customPricePaise: number | null;
  customItemLimit: number | null;
  customPlanName: string;
  payments: {
    id: string;
    amountPaise: number;
    plan: Plan;
    kind: string;
    itemsListed: number;
    periodEnd: string;
    method: string;
  }[];
};

const STANDING_TONE: Record<Standing, string> = {
  trial: 'bg-sky-50 text-sky-700',
  active: 'bg-green-50 text-green-700',
  overdue: 'bg-amber-50 text-amber-700',
  blocked: 'bg-red-50 text-red-700',
  paused: 'bg-red-50 text-red-700',
  cancelled: 'bg-red-50 text-red-700',
};

/** A labelled block, so each job on this card is visibly a separate job. */
/**
 * One control, with the situation it is for written above it.
 *
 * THE `when` LINE IS THE POINT OF THIS COMPONENT. There are five money controls
 * on this panel and an operator arrives at it holding a phone, mid-call, with a
 * shopkeeper's problem — not with a data model. Titles like "Listing service"
 * and "Custom price for this shop" describe what the control IS, which is only
 * useful to somebody who already knows which one they need. `when` describes
 * the call: "they paid you directly", "they asked for more free time". Read
 * down the panel, the five of them are a list of the situations that exist.
 */
function Block({
  title,
  when,
  hint,
  children,
  tone = 'plain',
}: {
  title: string;
  /** The situation this control is for, in the operator's own words. */
  when?: string;
  hint?: string;
  children: React.ReactNode;
  tone?: 'plain' | 'quiet';
}) {
  return (
    <section
      className={clsx(
        'mt-4 rounded-xl border p-3.5',
        tone === 'quiet' ? 'border-slate-200 bg-slate-50/60' : 'border-slate-200',
      )}
    >
      {when && (
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{when}</p>
      )}
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      {hint && <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function SubscriptionPanel({ slug, state }: { slug: string; state: SubscriptionState }) {
  const router = useRouter();
  const { push } = useToast();
  const { confirm, dialog } = useConfirm();
  const [plan, setPlan] = useState<Plan>(state.plan);
  const [months, setMonths] = useState(1);
  const [reference, setReference] = useState('');
  /** Days of extra free trial to give. Seven is what shops actually ask for. */
  const [trialDays, setTrialDays] = useState('7');
  const [busy, setBusy] = useState(false);
  // Seeded from the shop's stored deal, so the boxes read back what is in force
  // rather than starting blank over a live custom price.
  const [customPrice, setCustomPrice] = useState(
    state.customPricePaise === null ? '' : paiseToInput(state.customPricePaise),
  );
  /**
   * The custom item limit, seeded from the deal in force or — when there is no
   * deal yet — from what the shop actually holds today.
   *
   * The operator agreeing a custom price is almost always looking at a shop
   * whose catalogue they have just finished listing, and the number they need
   * is that count. Making them go and find it is how a deal gets typed as a
   * round guess instead.
   *
   * IT IS A CEILING, THOUGH, AND THE COUNT IS THE FLOOR. Saving it unchanged
   * leaves the shop with no room to add a single item, so the warning under the
   * box says so — see `noHeadroom`. Seeding it is a convenience; agreeing to it
   * has to stay a decision.
   */
  const [customLimit, setCustomLimit] = useState(
    state.customItemLimit === null ? String(state.itemCount) : String(state.customItemLimit),
  );
  const [customName, setCustomName] = useState(state.customPlanName);
  /** Whether the item-limit box has been edited. See `noHeadroom`. */
  const [limitTouched, setLimitTouched] = useState(false);
  // Pre-filled with what the shop already holds, because that is the job in
  // almost every case: the operator has just finished listing this catalogue.
  const [listedItems, setListedItems] = useState(String(state.itemCount || ''));

  const monthCount = Math.max(1, Math.min(24, months));
  // Priced through the same function the server charges from, so the figure the
  // operator reads out to a shopkeeper on the phone is the figure that gets
  // recorded. Twelve months and up carry the two-months-free yearly rate.
  // A custom price replaces the plan's price, exactly as the server charges it.
  const customRate = state.customPricePaise;
  const priceFor = (months: number) => amountForMonthsPaise(plan, months, customRate);
  const amountPaise = priceFor(monthCount);
  const neverPaid = state.currentPeriodEnd === null;
  const trialOver =
    state.trialEndsAt !== null && new Date(state.trialEndsAt).getTime() <= Date.now();
  // The server refuses more trial for a shop still holding paid time.
  const holdsPaidTime =
    state.currentPeriodEnd !== null && new Date(state.currentPeriodEnd).getTime() > Date.now();
  const listedCount = Math.max(0, Math.trunc(Number(listedItems) || 0));
  // The server takes 1–5000 items and 1–90 trial days; anything else is a 400
  // with a raw validation message, so the buttons refuse it first.
  const validListing = listedCount >= 1 && listedCount <= 5000;
  const trialDayCount = Number(trialDays);
  const validTrialDays =
    Number.isInteger(trialDayCount) && trialDayCount >= 1 && trialDayCount <= 90;
  const listingPaise = listingChargePaise(listedCount);
  const usage = state.itemLimit > 0 ? Math.min(1, state.itemCount / state.itemLimit) : 0;

  /**
   * The date this payment will actually run to, before it is recorded.
   *
   * The same `periodFor` the server applies, so the operator can say it out
   * loud on the call and be right. Without it the panel asked somebody to
   * commit a shopkeeper's money to an outcome it declined to show them.
   */
  const { periodEnd } = periodFor(
    // Paid time only. Unused trial days are no longer added on — see the note
    // on `periodFor` — so passing the trial date here would have this preview
    // quote a date the server will not grant.
    { currentPeriodEnd: state.currentPeriodEnd ? new Date(state.currentPeriodEnd) : null },
    monthCount,
  );

  // A custom item limit replaces the plan's, so only the limit that will apply counts.
  const limitAfterPayment =
    customRate !== null && state.customItemLimit !== null
      ? state.customItemLimit
      : PLAN_SPECS[plan].itemLimit;
  const downgrade = limitAfterPayment < state.itemCount;

  /**
   * A custom limit the shop has already reached, so it could not add one item.
   *
   * Worth saying because the box is now seeded with that very number: the
   * convenience of not having to look the count up would otherwise become a
   * shop quietly capped at exactly what it holds, discovered by the owner days
   * later when a save is refused.
   */
  const typedLimit = Number(customLimit.trim());
  /**
   * Only once the operator has actually touched the box.
   *
   * The seeded value is the shop's own count, so the warning was true the
   * instant the panel rendered — an amber field and a red-ish sentence on a
   * form nobody had typed into, which reads as "something is already wrong
   * here" rather than as advice. It is advice, and advice waits to be asked.
   */
  const noHeadroom =
    limitTouched &&
    customLimit.trim() !== '' &&
    Number.isFinite(typedLimit) &&
    typedLimit <= state.itemCount;

  async function post(body: Record<string, unknown>, done: string) {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/shop/${slug}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        push(payload.error ?? 'Could not update the subscription', 'error');
        return;
      }
      push(done, 'success');
      setReference('');
      router.refresh();
    } catch {
      push('Network error. Please try again.', 'error');
    } finally {
      setBusy(false);
    }
  }

  /**
   * The custom plan is a property of the SHOP, not a payment, so it goes to the
   * shop endpoint rather than the subscription one. `post` above records money
   * and moves periods; nothing here does either.
   */
  async function patchShop(body: Record<string, unknown>, done: string) {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/shop/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        push(payload.error ?? 'Could not save the custom price', 'error');
        return;
      }
      push(done, 'success');
      router.refresh();
    } catch {
      push('Network error. Please try again.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl bg-white p-4 shadow-card">
      {dialog}

      {/* ---- 1. WHERE THIS SHOP STANDS ----
           Three facts, each labelled with WHICH KIND of fact it is, because
           the panel's worst failure was printing two of them as if they were
           one. The stored plan sat beside the effective limit, so a trialling
           Basic shop read "Basic · 9 / 1000 items" — and the operator could
           not tell whether that was a bug, a custom deal, or the trial doing
           what trials do. It was the trial. It could have been a bug, and
           nothing on the screen would have said so.

           So: what the shop HAS today, then what it RETURNS TO when today's
           reason ends, then WHEN that is. Only the middle line is conditional,
           and it appears exactly when the two disagree. */}
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-auto font-semibold text-slate-900">Subscription</h2>
        {/* From the dates, not the stored status: a trial that ended yesterday
            is still stored as TRIALING, and the badge used to say so. */}
        <span
          className={clsx(
            'rounded-full px-2.5 py-1 text-xs font-semibold',
            STANDING_TONE[state.standing],
          )}
        >
          {standingLabel(state.standing, neverPaid)}
        </span>
      </div>

      <div className="mt-3 rounded-xl bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          In force today
        </p>
        <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
          <span className="text-lg font-bold text-slate-900">{state.effectivePlanName}</span>
          <span className="text-sm tabular-nums text-slate-600">
            {state.itemCount} of {state.itemLimit} items used
          </span>
        </p>

        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className={clsx(
              'h-full rounded-full transition-all',
              usage >= 1 ? 'bg-red-500' : usage > 0.85 ? 'bg-amber-500' : 'bg-brand-500',
            )}
            style={{ width: `${Math.max(3, usage * 100)}%` }}
          />
        </div>

        {/* WHY IT DIFFERS, whenever it does. A free trial grants the top tier
            and a custom deal replaces the ladder entirely; both are legitimate
            and both look identical to a billing fault until something says
            which it is. */}
        {(state.standing === 'trial' ||
          state.effectivePlanName !== PLAN_SPECS[state.plan].name) && (
          <p className="mt-2 text-xs text-slate-600">
            {state.standing === 'trial' ? (
              <>
                Free trial — the top plan while deciding. Reverts to{' '}
                <strong>{PLAN_SPECS[state.plan].name}</strong> when it ends.
              </>
            ) : (
              <>
                A price agreed with this shop. Stored plan is{' '}
                <strong>{PLAN_SPECS[state.plan].name}</strong>.
              </>
            )}
          </p>
        )}

        {/* THE TWO DATES ARE DIFFERENT FACTS AND ARE SHOWN AS TWO.
            They shared one slot, so a shop with paid time AND a live trial
            showed only one of them — which is how a paying shop quietly
            running on a trial's entitlement stayed invisible. */}
        <dl className="mt-2.5 space-y-0.5 border-t border-slate-200 pt-2 text-xs">
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Paid to</dt>
            <dd className="font-medium tabular-nums text-slate-800">
              {state.currentPeriodEnd ? formatDay(state.currentPeriodEnd) : 'never paid'}
            </dd>
          </div>
          {state.trialEndsAt && (
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Free trial to</dt>
              <dd className="font-medium tabular-nums text-slate-800">
                {formatDay(state.trialEndsAt)}
                {trialOver && <span className="ml-1 font-normal text-red-600">· ended</span>}
                {!trialOver && state.trialDaysLeft !== null && (
                  <span className="ml-1 font-normal text-slate-500">
                    · {state.trialDaysLeft} day{state.trialDaysLeft === 1 ? '' : 's'} left
                  </span>
                )}
              </dd>
            </div>
          )}
        </dl>

        {/* What the lapse means today, so the operator on the phone can say it.
            "Pro" above is only the plan the shop returns to once it pays. */}
        {(state.standing === 'overdue' || state.standing === 'blocked') && (
          <p
            className={clsx(
              'mt-2 rounded-lg px-2.5 py-1.5 text-xs',
              state.standing === 'blocked' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-900',
            )}
          >
            {state.standing === 'blocked'
              ? 'The owner can no longer add or change items.'
              : `The owner can still edit for up to ${GRACE_DAYS} days after it ended.`}
            {state.daysUntilAutoPause !== null &&
              ` The shop page goes offline in ${state.daysUntilAutoPause} day${
                state.daysUntilAutoPause === 1 ? '' : 's'
              } unless a payment is recorded.`}
          </p>
        )}
        {(state.standing === 'paused' || state.standing === 'cancelled') && (
          <p className="mt-2 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs text-red-800">
            The shop page is offline and the owner cannot edit items. Recording a payment reopens
            it at once.
          </p>
        )}
      </div>

      {/* ---- 2. Record a payment ---- */}
      <Block
        when="They paid you"
        title="Record a payment"
        hint="For a shop that paid you in cash or over the phone. A shop that pays from its own app comes through Payments instead, and you issue a code there."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            {/* "Plan" alone was the confusion: the badge above also says a plan,
                and the two are different kinds of thing. This one is a choice
                the operator is making right now — and it silently drives the
                prices below AND the placeholders in the custom-price box, so
                moving it makes three other numbers change with no explanation.
                Saying whose plan it is, and what the shop is on now, costs one
                line and settles all of it. */}
            <span className="mb-1 block text-sm font-semibold text-slate-700">
              Plan to record{' '}
              <span className="font-normal text-slate-500">
                · shop is on {PLAN_SPECS[state.plan].name}
              </span>
            </span>
            <select
              value={plan}
              onChange={(event) => setPlan(event.target.value as Plan)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"
            >
              {PLAN_ORDER.map((id) => (
                <option key={id} value={id}>
                  {PLAN_SPECS[id].name} — {PLAN_SPECS[id].itemLimit} items · ₹
                  {PLAN_SPECS[id].price}/mo
                </option>
              ))}
            </select>
          </label>

          <Input
            label="UPI reference"
            hint="optional"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder="UTR / txn id"
          />
        </div>

        {/* The two periods anybody actually sells, as buttons rather than a
            number box with a link under it. A month and a year are the whole
            of it; anything else is a conversation, and gets the small field. */}
        <div className="mt-3">
          <span className="mb-1 block text-sm font-semibold text-slate-700">For how long</span>
          <div className="flex flex-wrap items-center gap-2">
            {[1, 12].map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={monthCount === option}
                onClick={() => setMonths(option)}
                className={clsx(
                  'rounded-xl border-2 px-3 py-2 text-left transition',
                  monthCount === option
                    ? 'border-brand-600 bg-brand-50'
                    : 'border-slate-200 bg-white hover:border-slate-300',
                )}
              >
                <span className="block text-sm font-semibold text-slate-900">
                  {option === 12 ? '1 year' : '1 month'}
                </span>
                <span className="block text-sm font-bold tabular-nums text-brand-700">
                  {formatPaise(priceFor(option))}
                  {option === 12 && (
                    <span className="ml-1 text-xs font-semibold">
                      saves {formatPaise(priceFor(1) * (12 - MONTHS_PER_YEAR_PAID))}
                    </span>
                  )}
                </span>
              </button>
            ))}

            <label className="flex items-center gap-1.5 text-sm text-slate-600">
              <span>or</span>
              <input
                type="number"
                min={1}
                max={24}
                value={monthCount}
                onChange={(event) => setMonths(Number(event.target.value) || 1)}
                aria-label="Months"
                className="w-16 rounded-xl border border-slate-300 px-2 py-2 tabular-nums"
              />
              <span>months</span>
            </label>
          </div>
        </div>

        {/* A plan smaller than the catalogue the shop already has is a refund
            waiting to happen: they pay, then cannot edit their own items. */}
        {downgrade && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            This shop lists {state.itemCount} items — more than the {limitAfterPayment} this plan
            holds. Their items stay, but they could not add a new one.
          </p>
        )}

        {/* Nothing above changes the shop until this is pressed. An operator
            picked Basic, saw "Pro" still in force, and took it for a fault. */}
        {plan !== state.plan && (
          <p className="mt-3 text-xs text-slate-600">
            The shop stays on <strong>{PLAN_SPECS[state.plan].name}</strong> until you record
            this payment.
          </p>
        )}

        {customRate !== null && (
          <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800">
            This shop has a custom price, so it is charged {formatPaise(customRate)} a month
            whichever plan is chosen.
          </p>
        )}

        <Button
          fullWidth
          size="lg"
          className="mt-3"
          loading={busy}
          onClick={async () => {
            if (
              downgrade &&
              !(await confirm({
                title: `Record ${PLAN_SPECS[plan].name} anyway?`,
                message: `This shop has ${state.itemCount} items but this plan holds ${limitAfterPayment}. The owner will not be able to add items.`,
                confirmLabel: 'Record it',
                cancelLabel: 'Go back',
                danger: true,
              }))
            ) {
              return;
            }
            post({ plan, months: monthCount, reference }, `Recorded ${formatPaise(amountPaise)}`);
          }}
        >
          Record {formatPaise(amountPaise)} · {PLAN_SPECS[plan].name}
        </Button>

        {/* THE CONSEQUENCE, BEFORE THE BUTTON IS PRESSED. */}
        <p className="mt-2 text-center text-sm font-medium text-slate-700">
          Runs to <strong>{formatDay(periodEnd)}</strong>
        </p>
        <p className="mt-1 text-center text-xs leading-relaxed text-slate-500">
          Paid time is added to paid time already held, so renewing early never costs the shop
          days. Unused trial days are not added — the trial is the free look, and paying starts
          the plan.
        </p>
      </Block>

      {/* ---- 3. Listing service ---- */}
      {/* Boxed off from the controls above on purpose. This charges for work
          done and buys the shop no time at all, so it must never be reachable
          by an operator who thinks they are recording a renewal. */}
      <Block
        tone="quiet"
        when="You catalogued their items"
        title="Listing service"
        hint={`Charged when we catalogue the shop's items for them. ${formatPaise(
          LISTING_PAISE_PER_ITEM,
        )} per item, no minimum. Buys no subscription time.`}
      >
        <div className="flex flex-wrap items-end gap-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-900">Items listed</span>
            <input
              type="number"
              min={1}
              max={5000}
              value={listedItems}
              onChange={(event) => setListedItems(event.target.value)}
              className="w-32 rounded-xl border border-slate-300 bg-white px-3 py-2 tabular-nums"
            />
          </label>

          <Button
            variant="secondary"
            disabled={busy || !validListing}
            onClick={() =>
              post(
                { listedItems: listedCount, reference },
                `Charged ${formatPaise(listingPaise)} for ${listedCount} items`,
              )
            }
          >
            Charge {formatPaise(listingPaise)}
          </Button>

        </div>
      </Block>

      {/* ---- 4. More free trial ----
           Its own control rather than a line inside Corrections, because it is
           not a correction. Corrections put right something that went wrong;
           this GIVES a shop something, at its owner's asking, and grouping the
           two taught an operator to look for generosity in the same place as
           "cancel this subscription". */}
      <Block
        when="They asked for more free time"
        title="Extend the trial"
        hint="Free days, at the owner's request. Records no payment and buys no plan time. Counted from the trial's own end or today, whichever is later, so answering late still gives the full run. Not available once a shop has paid — use a custom price instead."
      >
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs font-semibold text-slate-700">
            <span className="mb-1 block">Days</span>
            <input
              type="number"
              min={1}
              max={90}
              value={trialDays}
              onChange={(event) => setTrialDays(event.target.value)}
              className="h-10 w-24 rounded-lg border border-slate-300 px-2 text-sm font-normal tabular-nums"
            />
          </label>
          <Button
            size="sm"
            disabled={busy || holdsPaidTime || !validTrialDays}
            onClick={() =>
              post({ trialDays: Number(trialDays) }, `Trial extended by ${trialDays} days`)
            }
          >
            Give the days
          </Button>
        </div>
        {holdsPaidTime && (
          <p className="mt-2 text-xs text-slate-600">
            This shop has paid time left, so it is not on a trial.
          </p>
        )}
        {!validTrialDays && (
          <p className="mt-2 text-xs text-red-600">Enter a whole number of days from 1 to 90.</p>
        )}
      </Block>

      {/* ---- 5. A price agreed with this shop alone ---- */}
      <Block
        when="You agreed a special rate"
        title="Custom price for this shop"
        tone="quiet"
        hint="A rupee amount and an item limit agreed with this shop, instead of one of the four plans. Leave blank to put the shop back on the standard ladder. It takes effect when the trial ends."
      >
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs font-semibold text-slate-700">
            Name
            <input
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
              placeholder={PLAN_SPECS[plan].name}
              className="mt-1 block h-10 w-32 rounded-lg border border-slate-300 px-2 text-sm font-normal"
            />
          </label>
          <label className="text-xs font-semibold text-slate-700">
            ₹ / month
            <input
              value={customPrice}
              onChange={(event) => setCustomPrice(event.target.value)}
              inputMode="decimal"
              placeholder={String(PLAN_SPECS[plan].price)}
              className="mt-1 block h-10 w-24 rounded-lg border border-slate-300 px-2 text-sm font-normal tabular-nums"
            />
          </label>
          <label className="text-xs font-semibold text-slate-700">
            Items <span className="font-normal text-slate-400">· has {state.itemCount}</span>
            <input
              value={customLimit}
              onChange={(event) => {
                setLimitTouched(true);
                setCustomLimit(event.target.value);
              }}
              inputMode="numeric"
              placeholder={String(PLAN_SPECS[plan].itemLimit)}
              className={clsx(
                'mt-1 block h-10 w-24 rounded-lg border px-2 text-sm font-normal tabular-nums',
                noHeadroom ? 'border-amber-400 bg-amber-50' : 'border-slate-300',
              )}
            />
          </label>

          <Button
            size="sm"
            disabled={busy}
            onClick={() => {
              const rupees = parsePaise(customPrice);
              if (rupees === null) {
                push('Give a price in rupees, or clear it to use the plan', 'error');
                return;
              }
              const limit = Number(customLimit.trim());
              patchShop(
                {
                  customPricePaise: rupees,
                  // Blank means "keep the plan's limit", which is what null says
                  // to `customSpec`.
                  customItemLimit: Number.isFinite(limit) && limit > 0 ? Math.trunc(limit) : null,
                  customPlanName: customName.trim(),
                },
                'Custom price saved',
              );
            }}
          >
            Save
          </Button>

          {/* The seeded number, said back as its consequence.
              Not a refusal — an operator may genuinely mean "this many and no
              more" — but a shop capped at exactly what it holds cannot add one
              item, and that is worth finding out here rather than from the
              owner a week later. */}
          {noHeadroom && (
            <p className="w-full text-xs font-medium text-amber-800">
              {typedLimit === state.itemCount
                ? `This shop already has ${state.itemCount} items, so it could not add another. Raise it to leave room.`
                : `Below what this shop already holds (${state.itemCount}). Existing items stay; nothing new can be added.`}
            </p>
          )}

          {state.customPricePaise !== null && (
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setCustomPrice('');
                setCustomLimit('');
                setCustomName('');
                patchShop(
                  { customPricePaise: null, customItemLimit: null, customPlanName: '' },
                  'Back on the standard plan',
                );
              }}
            >
              Remove
            </Button>
          )}
        </div>

        {state.customPricePaise !== null && (
          <p className="mt-2 text-xs font-semibold text-brand-700">
            On a custom plan: {formatPaise(state.customPricePaise)}/month
            {state.customItemLimit ? ` · ${state.customItemLimit} items` : ''}
          </p>
        )}
      </Block>

      {/* ---- 6. Corrections ---- */}
      {/* Last, quiet, and away from the money. These move a shop's state
          without any payment behind it, and one of them takes an owner's
          ability to edit their shop away today. */}
      <Block
        tone="quiet"
        when="Something needs putting right"
        title="Corrections"
        hint="Changes this shop's state without recording any money."
      >

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => post({ status: 'PAST_DUE' }, 'Marked past due')}
          >
            Mark past due
          </Button>

          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            className="text-red-600 hover:bg-red-50"
            onClick={async () => {
              if (
                !(await confirm({
                  title: 'Cancel this subscription?',
                  message:
                    'The owner can no longer add or change items, and the shop page goes offline today — customers see the closed screen. Nothing is deleted, and recording a payment reopens it.',
                  confirmLabel: 'Cancel subscription',
                  cancelLabel: 'Keep it',
                  danger: true,
                }))
              ) {
                return;
              }
              post({ status: 'CANCELLED' }, 'Subscription cancelled');
            }}
          >
            Cancel subscription
          </Button>
        </div>
        <p className="mt-2 text-xs text-slate-600">
          A lapsed shop keeps trading for {AUTO_PAUSE_DAYS} days — item editing stops after{' '}
          {GRACE_DAYS}, but the QR and its customers carry on. After that the shop page goes to
          the closed screen and no customer can see or order an item. Recording a payment reopens
          it at once; nothing is deleted.
        </p>
      </Block>

      {state.payments.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <h3 className="text-sm font-bold text-slate-900">Recent payments</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {state.payments.map((payment) => (
              <li key={payment.id} className="flex justify-between gap-3 text-slate-600">
                <span className="min-w-0 truncate">
                  {payment.kind === 'LISTING'
                    ? `Listing · ${payment.itemsListed} items`
                    : PLAN_SPECS[payment.plan].name}{' '}
                  · {payment.method}
                </span>
                <span className="shrink-0 tabular-nums">
                  {formatPaise(payment.amountPaise)}
                  {/* A one-off bought no period, so an arrow to a date would be
                      claiming it did. */}
                  {payment.kind !== 'LISTING' && ` → ${formatDay(payment.periodEnd)}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
