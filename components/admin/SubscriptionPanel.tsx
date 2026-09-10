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
import { formatPaise, paiseToInput, parsePaise, rupeesToPaise } from '@/lib/money';
import { periodFor } from '@/lib/period';
import {
  LISTING_MINIMUM_ITEMS,
  LISTING_MINIMUM_PAISE,
  LISTING_PAISE_PER_ITEM,
  PLAN_ORDER,
  PLAN_SPECS,
  listingChargePaise,
  priceForMonths,
  yearSaving,
  type Plan,
  type SubStatus,
} from '@/lib/plans';

export type SubscriptionState = {
  plan: Plan;
  status: SubStatus;
  itemCount: number;
  itemLimit: number;
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

const STATUS_TONE: Record<SubStatus, string> = {
  TRIALING: 'bg-sky-50 text-sky-700',
  ACTIVE: 'bg-green-50 text-green-700',
  PAST_DUE: 'bg-amber-50 text-amber-700',
  CANCELLED: 'bg-red-50 text-red-700',
};

/** A labelled block, so each job on this card is visibly a separate job. */
function Block({
  title,
  hint,
  children,
  tone = 'plain',
}: {
  title: string;
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
  const [busy, setBusy] = useState(false);
  // Seeded from the shop's stored deal, so the boxes read back what is in force
  // rather than starting blank over a live custom price.
  const [customPrice, setCustomPrice] = useState(
    state.customPricePaise === null ? '' : paiseToInput(state.customPricePaise),
  );
  const [customLimit, setCustomLimit] = useState(
    state.customItemLimit === null ? '' : String(state.customItemLimit),
  );
  const [customName, setCustomName] = useState(state.customPlanName);
  // Pre-filled with what the shop already holds, because that is the job in
  // almost every case: the operator has just finished listing this catalogue.
  const [listedItems, setListedItems] = useState(String(state.itemCount || ''));

  const monthCount = Math.max(1, Math.min(24, months));
  // Priced through the same function the server charges from, so the figure the
  // operator reads out to a shopkeeper on the phone is the figure that gets
  // recorded. Twelve months and up carry the two-months-free yearly rate.
  const amountPaise = rupeesToPaise(priceForMonths(plan, monthCount));
  const listedCount = Math.max(0, Math.trunc(Number(listedItems) || 0));
  const listingPaise = listingChargePaise(listedCount);
  const atListingFloor = listedCount > 0 && listedCount < LISTING_MINIMUM_ITEMS;
  const usage = state.itemLimit > 0 ? Math.min(1, state.itemCount / state.itemLimit) : 0;

  /**
   * The date this payment will actually run to, before it is recorded.
   *
   * The same `periodFor` the server applies, so the operator can say it out
   * loud on the call and be right. Without it the panel asked somebody to
   * commit a shopkeeper's money to an outcome it declined to show them.
   */
  const { periodEnd } = periodFor(
    {
      currentPeriodEnd: state.currentPeriodEnd ? new Date(state.currentPeriodEnd) : null,
      trialEndsAt: state.trialEndsAt ? new Date(state.trialEndsAt) : null,
    },
    monthCount,
  );

  const downgrade = PLAN_SPECS[plan].itemLimit < state.itemCount;

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

      {/* ---- 1. Where this shop stands ---- */}
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-auto font-semibold text-slate-900">Subscription</h2>
        <span
          className={clsx('rounded-full px-2.5 py-1 text-xs font-semibold', STATUS_TONE[state.status])}
        >
          {state.status}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
          {PLAN_SPECS[state.plan].name}
        </span>
      </div>

      <div className="mt-3">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium tabular-nums text-slate-800">
            {state.itemCount} / {state.itemLimit} items
          </span>
          <span className="text-slate-500">
            {state.currentPeriodEnd
              ? `Paid to ${formatDay(state.currentPeriodEnd)}`
              : state.trialEndsAt
                ? `Trial to ${formatDay(state.trialEndsAt)}`
                : 'No paid period'}
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className={clsx(
              'h-full rounded-full transition-all',
              usage >= 1 ? 'bg-red-500' : usage > 0.85 ? 'bg-amber-500' : 'bg-brand-500',
            )}
            style={{ width: `${Math.max(3, usage * 100)}%` }}
          />
        </div>
      </div>

      {/* ---- 2. Record a payment ---- */}
      <Block
        title="Record a payment"
        hint="For a shop that paid you in cash or over the phone. A shop that pays from its own app comes through Payments instead, and you issue a code there."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">Plan</span>
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
                  ₹{priceForMonths(plan, option).toLocaleString('en-IN')}
                  {option === 12 && (
                    <span className="ml-1 text-xs font-semibold">
                      saves ₹{yearSaving(plan).toLocaleString('en-IN')}
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
            This shop lists {state.itemCount} items — more than {PLAN_SPECS[plan].name} holds. They
            would not be able to edit their own catalogue.
          </p>
        )}

        <Button
          fullWidth
          size="lg"
          className="mt-3"
          loading={busy}
          onClick={() =>
            post({ plan, months: monthCount, reference }, `Recorded ${formatPaise(amountPaise)}`)
          }
        >
          Record {formatPaise(amountPaise)} · {PLAN_SPECS[plan].name}
        </Button>

        {/* THE CONSEQUENCE, BEFORE THE BUTTON IS PRESSED. */}
        <p className="mt-2 text-center text-sm font-medium text-slate-700">
          Runs to <strong>{formatDay(periodEnd)}</strong>
        </p>
        <p className="mt-1 text-center text-xs leading-relaxed text-slate-500">
          Time is added to whatever is left — unused trial days included — so paying early never
          costs the shop days.
        </p>
      </Block>

      {/* ---- 3. Listing service ---- */}
      {/* Boxed off from the controls above on purpose. This charges for work
          done and buys the shop no time at all, so it must never be reachable
          by an operator who thinks they are recording a renewal. */}
      <Block
        tone="quiet"
        title="Listing service"
        hint={`Charged when we catalogue the shop's items for them. 50 paise per item, minimum ${formatPaise(
          LISTING_MINIMUM_PAISE,
        )}. Buys no subscription time.`}
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
            disabled={busy || listedCount < 1}
            onClick={() =>
              post(
                { plan, listedItems: listedCount, reference },
                `Charged ${formatPaise(listingPaise)} for ${listedCount} items`,
              )
            }
          >
            Charge {formatPaise(listingPaise)}
          </Button>

          {atListingFloor && (
            <p className="text-xs text-slate-800">
              {listedCount} × 50p is {formatPaise(listedCount * LISTING_PAISE_PER_ITEM)} — the{' '}
              {formatPaise(LISTING_MINIMUM_PAISE)} minimum applies.
            </p>
          )}
        </div>
      </Block>

      {/* ---- 4. Corrections ---- */}
      {/* Last, quiet, and away from the money. These move a shop's state
          without any payment behind it, and one of them takes an owner's
          ability to edit their shop away today. */}
      <Block
        tone="quiet"
        title="Corrections"
        hint="Changes this shop's state without recording any money."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => post({ plan, status: 'PAST_DUE' }, 'Marked past due')}
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
                    'The owner can no longer add or change items. Their shop page and QR keep working, and nothing is deleted.',
                  confirmLabel: 'Cancel subscription',
                  cancelLabel: 'Keep it',
                  danger: true,
                }))
              ) {
                return;
              }
              post({ plan, status: 'CANCELLED' }, 'Subscription cancelled');
            }}
          >
            Cancel subscription
          </Button>
        </div>
        <p className="mt-2 text-xs text-slate-600">
          A lapsed shop keeps its QR and its customers; only item editing stops.
        </p>
      </Block>

      {/* ---- A price agreed with this shop alone ---- */}
      <Block
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
            Items
            <input
              value={customLimit}
              onChange={(event) => setCustomLimit(event.target.value)}
              inputMode="numeric"
              placeholder={String(PLAN_SPECS[plan].itemLimit)}
              className="mt-1 block h-10 w-24 rounded-lg border border-slate-300 px-2 text-sm font-normal tabular-nums"
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
