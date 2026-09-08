'use client';

/**
 * How a shopkeeper pays Halkhata, start to finish, in one place.
 *
 * THE SHAPE OF THE PROBLEM. Money does not arrive through this app — it arrives
 * by UPI, into a bank account, with nothing attached to say which shop sent it.
 * So the flow's real job is not taking a payment; it is producing a record the
 * operator can match against a bank feed, and then a way to switch the plan on
 * once they have. That is three steps and they are all here:
 *
 *   1. CHOOSE — the plan and the period. The owner declares what they are
 *      buying BEFORE they pay, which is the whole reason the operator can later
 *      tell a ₹149 credit from any other ₹149 credit.
 *   2. PAY AND PROVE — scan the operator's QR, then send back the UPI id, the
 *      phone behind it and a screenshot. None of this grants anything; it is
 *      evidence for a human.
 *   3. ACTIVATE — the operator checks the money, sends 4 digits on WhatsApp,
 *      and the owner types them here.
 *
 * Step 3 is a separate visit, days later, from a different phone state. So this
 * component is driven by the SERVER's idea of where the shop is — an open
 * request means "you already paid, type your code" — never by local state that
 * a reload would forget. An owner who closes the app after paying and comes
 * back tomorrow must not be asked to pay again.
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePicker } from '@/components/admin/ImagePicker';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { CheckIcon, CloseIcon, WhatsAppIcon } from '@/components/ui/Icon';
import { ownerDict } from '@/lib/owner-i18n';
import { formatPaise } from '@/lib/money';
import { PLAN_ORDER, PLAN_SPECS, priceForMonths, type Plan } from '@/lib/plans';
import type { Locale } from '@/lib/i18n';

type PayTo = {
  upiId: string;
  payeeName: string;
  phone: string;
  qrImageData: string;
  note: string;
  configured: boolean;
};

type OpenRequest = {
  id: string;
  plan: Plan;
  months: number;
  amountPaise: number;
  status: 'SUBMITTED' | 'CODE_ISSUED';
  attempts: number;
  createdAt: string;
};

type Rejected = { plan: Plan; months: number; reviewNote: string } | null;

/** The two periods a shop can buy. Anything else is a conversation. */
const PERIODS = [1, 12] as const;

export function UpgradeFlow({
  slug,
  locale,
  itemCount,
  /** The cheapest plan that holds what this shop already lists. */
  suggested,
  helpUrl,
  onActivated,
}: {
  slug: string;
  locale: Locale;
  itemCount: number;
  suggested: Plan;
  /** wa.me link to the operator, or "" when no support number is configured. */
  helpUrl: string;
  onActivated?: () => void;
}) {
  const t = ownerDict(locale);
  const router = useRouter();
  const { push } = useToast();

  const [loading, setLoading] = useState(true);
  const [payTo, setPayTo] = useState<PayTo | null>(null);
  const [open, setOpen] = useState<OpenRequest | null>(null);
  const [rejected, setRejected] = useState<Rejected>(null);

  const [plan, setPlan] = useState<Plan>(suggested);
  const [months, setMonths] = useState<number>(1);
  const [payerUpiId, setPayerUpiId] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [screenshot, setScreenshot] = useState('');

  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [done, setDone] = useState(false);

  /**
   * Where this shop actually stands, from the server.
   *
   * Re-read on every mount rather than trusted from a prop, because the thing
   * that changes between visits — the operator issuing a code — happens
   * somewhere else entirely and nothing tells this app about it.
   */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/owner/${slug}/upgrade`);
      if (!response.ok) throw new Error('load failed');
      const body = await response.json();
      setPayTo(body.payTo);
      setOpen(body.request);
      setRejected(body.lastRejected);
      if (body.request) {
        setPlan(body.request.plan);
        setMonths(body.request.months);
      }
    } catch {
      push(t.networkError, 'error');
    } finally {
      setLoading(false);
    }
  }, [slug, push, t.networkError]);

  useEffect(() => {
    void load();
  }, [load]);

  const priceRupees = priceForMonths(plan, months);
  const spec = PLAN_SPECS[plan];

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const response = await fetch(`/api/owner/${slug}/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, months, payerUpiId, payerPhone, screenshotData: screenshot }),
      });
      const body = await response.json();
      if (!response.ok) {
        setErrors(body.errors ?? {});
        push(body.error ?? t.networkError, 'error');
        return;
      }
      // Straight on to the code step, in this same dialog. Closing and
      // reopening to find out what happened is a step nobody should have to
      // guess at.
      setOpen(body.request);
      setRejected(null);
    } catch {
      push(t.networkError, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function activate(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch(`/api/owner/${slug}/upgrade/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const body = await response.json();
      if (!response.ok) {
        push(body.error ?? t.networkError, 'error');
        setCode('');
        return;
      }
      setDone(true);
      push(t.upgradeDone, 'success');
      // The plan, the banner and the roadblock are all server-rendered from the
      // shop row this just changed.
      router.refresh();
      onActivated?.();
    } catch {
      push(t.networkError, 'error');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="py-6 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-100">
          <CheckIcon className="h-8 w-8 text-brand-700" />
        </span>
        <p className="mt-4 text-lg font-bold text-slate-900">{t.upgradeDone}</p>
        <p className="mt-1 text-sm text-slate-600">{t.upgradeDoneHint}</p>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /* Step 3 — a request is already in                                    */
  /* ------------------------------------------------------------------ */
  if (open) {
    const waiting = open.status === 'SUBMITTED';
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-slate-50 p-3.5">
          <p className="text-sm font-semibold text-slate-900">
            {PLAN_SPECS[open.plan]?.name} · {open.months === 12 ? t.perYear : t.perMonth} ·{' '}
            <span className="tabular-nums">{formatPaise(open.amountPaise)}</span>
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {waiting ? t.upgradeWaiting : t.upgradeCodeSent}
          </p>
        </div>

        {/* The code box is shown even while the request is still waiting.
            Hiding it until the status flips would mean an owner who has the
            code in their hand — because it arrived on WhatsApp seconds ago —
            staring at a screen that will not take it. */}
        <form onSubmit={activate} className="space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              {t.upgradeCodeLabel}
            </span>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 4))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="––––"
              // Big, spaced and centred: four digits read off another app, typed
              // one-handed. This is not a form field, it is a keypad target.
              className="w-full rounded-xl border-2 border-slate-300 py-3 text-center text-3xl font-bold tracking-[0.5em] tabular-nums focus:border-brand-600 focus:outline-none"
            />
          </label>
          <Button type="submit" fullWidth size="lg" loading={busy} disabled={code.length !== 4}>
            {t.upgradeActivate}
          </Button>
        </form>

        {helpUrl && (
          <a
            href={helpUrl}
            target="_blank"
            rel="noreferrer"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] text-sm font-semibold text-white"
          >
            <WhatsAppIcon className="h-5 w-5" />
            {t.blockHelp}
          </a>
        )}
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /* Steps 1 and 2 — choose, pay, prove                                  */
  /* ------------------------------------------------------------------ */
  return (
    <form onSubmit={submit} className="space-y-4">
      {rejected && (
        <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-800">
          {t.upgradeRefused}
          {rejected.reviewNote && <> — {rejected.reviewNote}</>}
        </p>
      )}

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">{t.renewChoosePlan}</span>
        <select
          value={plan}
          onChange={(event) => setPlan(event.target.value as Plan)}
          className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base font-semibold text-slate-900"
        >
          {PLAN_ORDER.map((id) => {
            const option = PLAN_SPECS[id];
            return (
              <option key={id} value={id} disabled={option.itemLimit < itemCount}>
                {option.name} — ₹{option.price}
                {t.perMonthShort} · {option.itemLimit.toLocaleString('en-IN')} {t.itemsCount}
                {option.itemLimit < itemCount ? ` (${t.planTooSmall})` : ''}
              </option>
            );
          })}
        </select>
      </label>

      {/* The chosen plan's details, under the dropdown rather than inside it.
          A <select> option cannot hold more than one line, and "what do I get"
          is the question the dropdown raises. */}
      <ul className="space-y-1.5 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
        {spec.features.map((feature) => (
          <li key={feature} className="flex gap-2">
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div role="group" aria-label={t.renewChoosePlan} className="grid grid-cols-2 gap-2">
        {PERIODS.map((option) => {
          const active = months === option;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => setMonths(option)}
              className={
                'rounded-xl border-2 px-3 py-2.5 text-left transition ' +
                (active ? 'border-brand-600 bg-brand-50' : 'border-slate-200 bg-white')
              }
            >
              <span className="block text-sm font-semibold text-slate-900">
                {option === 12 ? t.perYear : t.perMonth}
              </span>
              <span className="block text-lg font-bold tabular-nums text-brand-700">
                ₹{priceForMonths(plan, option).toLocaleString('en-IN')}
              </span>
              {option === 12 && (
                <span className="block text-xs font-semibold text-brand-700">{t.twoMonthsFree}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* PAY. The QR is behind a link rather than inline: it is a big square
          that would push every field below it off a phone screen, and it is
          needed once — at the moment of paying — not while typing. */}
      <div className="rounded-xl border border-slate-200 p-3.5">
        <p className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-sm font-medium text-slate-700">{t.upgradeToPay}</span>
          <span className="text-xl font-bold tabular-nums text-brand-700">
            ₹{priceRupees.toLocaleString('en-IN')}
          </span>
        </p>

        {payTo?.configured ? (
          <>
            <button
              type="button"
              onClick={() => setShowQr(true)}
              className="mt-2 text-sm font-semibold text-brand-700 underline"
            >
              {t.upgradeShowQr}
            </button>
            {payTo.upiId && (
              <p className="mt-1.5 break-all text-xs text-slate-500">
                {t.upgradeUpiLabel}: {payTo.upiId}
              </p>
            )}
            {payTo.phone && (
              <p className="mt-0.5 text-xs text-slate-500">
                {t.upgradePhoneLabel}: {payTo.phone}
              </p>
            )}
            {payTo.note && <p className="mt-1.5 text-xs text-slate-600">{payTo.note}</p>}
          </>
        ) : (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {t.renewNoUpi}
          </p>
        )}
      </div>

      {/* PROVE. Everything here helps a human find one credit in a bank feed. */}
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">{t.upgradeYourUpi}</span>
        <input
          value={payerUpiId}
          onChange={(event) => setPayerUpiId(event.target.value.trim())}
          placeholder="name@bank"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="h-12 w-full rounded-xl border border-slate-300 px-3 text-base"
        />
        {errors.payerUpiId && <span className="mt-1 block text-sm text-red-600">{errors.payerUpiId}</span>}
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">{t.upgradeYourPhone}</span>
        <input
          value={payerPhone}
          onChange={(event) => setPayerPhone(event.target.value.replace(/\D/g, '').slice(0, 10))}
          inputMode="numeric"
          placeholder="9876543210"
          className="h-12 w-full rounded-xl border border-slate-300 px-3 text-base"
        />
        {errors.payerPhone && <span className="mt-1 block text-sm text-red-600">{errors.payerPhone}</span>}
      </label>

      <ImagePicker
        label={t.upgradeScreenshot}
        shape="square"
        value={screenshot}
        busy={busy}
        onChange={setScreenshot}
        onError={(message) => push(message, 'error')}
      />

      <Button type="submit" fullWidth size="lg" loading={busy} disabled={!payTo?.configured}>
        {t.upgradeSubmit}
      </Button>
      <p className="text-center text-xs leading-relaxed text-slate-500">{t.upgradeSubmitHint}</p>

      {/* The QR, full size, over everything — with a cross to get out. */}
      {showQr && payTo && (
        <QrDialog payTo={payTo} label={t.upgradeShowQr} onClose={() => setShowQr(false)} />
      )}
    </form>
  );
}

/**
 * The operator's QR, as large as the screen will allow.
 *
 * Its own dialog rather than the shared `Modal`, for one reason: this is a
 * picture somebody is pointing another phone at, so it wants the whole screen
 * and no chrome competing with it. Everything else about it — escape to close,
 * a backdrop that closes, a real cross icon — matches the rest of the product.
 */
function QrDialog({
  payTo,
  label,
  onClose,
}: {
  payTo: PayTo;
  label: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="relative w-full max-w-xs rounded-2xl bg-white p-4"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        <p className="pr-10 text-sm font-semibold text-slate-900">{payTo.payeeName}</p>

        {payTo.qrImageData ? (
          // The operator's own printed QR. A white ground behind it, always:
          // a scanner reading a code off a dark surface fails silently.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={payTo.qrImageData}
            alt={label}
            className="mt-3 w-full rounded-xl bg-white"
          />
        ) : (
          <p className="mt-3 rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-600">
            {payTo.upiId}
          </p>
        )}

        {payTo.upiId && (
          <p className="mt-2 break-all text-center text-xs text-slate-500">{payTo.upiId}</p>
        )}
        {payTo.phone && (
          <p className="mt-1 text-center text-xs text-slate-500">{payTo.phone}</p>
        )}
      </div>
    </div>
  );
}
