'use client';

/**
 * What this shop is paying, and how to record that it paid.
 *
 * DukaanFlow collects over UPI from shopkeepers who have spoken to a person,
 * so the Super Admin records the payment here rather than a gateway posting a
 * webhook. The route behind this is shaped so a gateway can take over without
 * anything above it changing.
 */

import { formatDay } from '@/lib/time';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { formatRupees } from '@/lib/money';
import { PLAN_ORDER, PLAN_SPECS, type Plan, type SubStatus } from '@/lib/plans';

export type SubscriptionState = {
  plan: Plan;
  status: SubStatus;
  itemCount: number;
  itemLimit: number;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  payments: { id: string; amount: number; plan: Plan; periodEnd: string; method: string }[];
};

const STATUS_TONE: Record<SubStatus, string> = {
  TRIALING: 'bg-sky-50 text-sky-700',
  ACTIVE: 'bg-green-50 text-green-700',
  PAST_DUE: 'bg-amber-50 text-amber-700',
  CANCELLED: 'bg-red-50 text-red-700',
};

export function SubscriptionPanel({
  slug,
  state,
}: {
  slug: string;
  state: SubscriptionState;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [plan, setPlan] = useState<Plan>(state.plan);
  const [months, setMonths] = useState('1');
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);

  const spec = PLAN_SPECS[plan];
  const amount = spec.price * Math.max(1, Number(months) || 1);
  const usage = state.itemLimit > 0 ? Math.min(1, state.itemCount / state.itemLimit) : 0;

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

  return (
    <section className="rounded-2xl bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-auto font-semibold text-slate-900">Subscription</h2>
        <span
          className={clsx(
            'rounded-full px-2.5 py-1 text-xs font-semibold',
            STATUS_TONE[state.status],
          )}
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

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-slate-700">Plan</span>
          <select
            value={plan}
            onChange={(event) => setPlan(event.target.value as Plan)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"
          >
            {PLAN_ORDER.map((id) => (
              <option key={id} value={id}>
                {PLAN_SPECS[id].name} — {PLAN_SPECS[id].itemLimit} items
              </option>
            ))}
          </select>
        </label>

        <Input
          label="Months"
          type="number"
          min={1}
          max={24}
          value={months}
          onChange={(event) => setMonths(event.target.value)}
        />

        <Input
          label="UPI reference"
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          placeholder="UTR / txn id"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          loading={busy}
          onClick={() =>
            post(
              { plan, months: Math.max(1, Number(months) || 1), reference },
              `Recorded ${formatRupees(amount)}`,
            )
          }
        >
          Record {formatRupees(amount)} payment
        </Button>

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
          onClick={() => {
            if (!window.confirm('Cancel this subscription? The owner can no longer edit items.')) {
              return;
            }
            post({ plan, status: 'CANCELLED' }, 'Subscription cancelled');
          }}
        >
          Cancel
        </Button>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Paid time is added to whatever is left, so renewing early never costs the shop days. A
        lapsed shop keeps its QR and its customers — only item editing stops.
      </p>

      {state.payments.length > 0 && (
        <ul className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-sm">
          {state.payments.map((payment) => (
            <li key={payment.id} className="flex justify-between gap-3 text-slate-600">
              <span>
                {PLAN_SPECS[payment.plan].name} · {payment.method}
              </span>
              <span className="tabular-nums">
                {formatRupees(payment.amount)} → {formatDay(payment.periodEnd)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
