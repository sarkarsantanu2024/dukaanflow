'use client';

/**
 * THE CASH DRAWER, RECONCILED.
 *
 * ```
 * started with
 *   + cash sales
 *   + repayments taken in cash
 *   = what should be in the drawer
 * ```
 *
 * Every line of that is shown, in that order, because the answer on its own is
 * not usable: an owner who counts ₹2,450 against an expected ₹2,500 needs to
 * see which of the three numbers to argue with. The sum is the working, not a
 * result.
 *
 * IT OPENS BY ASKING FOR THE FLOAT, and nothing below appears until it has one.
 * The morning's change in the drawer is the single figure nothing in the
 * database can derive, and reconciling against an assumed zero would hand the
 * shopkeeper a confident wrong number — which is worse than no number, because
 * they would go looking for the difference.
 *
 * A difference is not called an error. Money spent out of the till during the
 * day is real, common and unknown to this app, and it shows up here as being
 * short — so the screen says that in plain words rather than leaving an owner
 * hunting for a rupee they spent on tea.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { handledExpiredSession } from './sessionGuard';
import { formatPaise, paiseToInput, parsePaise } from '@/lib/money';
import { ownerDict } from '@/lib/owner-i18n';
import type { Locale } from '@/lib/i18n';
import type { Drawer } from '@/lib/takings';

export function DrawerPanel({
  slug,
  drawer,
  locale,
}: {
  slug: string;
  /** Null before the owner has started the day — then this asks for the float. */
  drawer: Drawer | null;
  locale: Locale;
}) {
  const router = useRouter();
  const { push } = useToast();
  const t = ownerDict(locale);

  const [busy, setBusy] = useState(false);
  const [opening, setOpening] = useState('');
  const [counted, setCounted] = useState(
    drawer?.countedPaise === null || drawer?.countedPaise === undefined
      ? ''
      : paiseToInput(drawer.countedPaise),
  );
  /** Reopens the float box on a day already started, for a mistyped figure. */
  const [editingOpening, setEditingOpening] = useState(false);

  async function save(body: { openingPaise?: number; countedPaise?: number | null }) {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/shop/${slug}/cash`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (handledExpiredSession({ response, slug, t, push })) return;
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        push(payload.error ?? t.networkError, 'error');
        return;
      }
      setEditingOpening(false);
      push(body.openingPaise === undefined ? t.drawerCountSave : t.drawerStarted, 'success');
      router.refresh();
    } catch {
      push(t.networkError, 'error');
    } finally {
      setBusy(false);
    }
  }

  /* ---------------------------------------------------- before the shutter */

  if (!drawer || editingOpening) {
    const value = parsePaise(editingOpening ? opening : opening);
    return (
      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4">
        <p className="font-semibold text-slate-900">{t.drawerStartTitle}</p>
        <p className="mt-0.5 text-sm text-slate-600">{t.drawerStartHint}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              ₹
            </span>
            <input
              inputMode="decimal"
              value={opening}
              onChange={(event) => setOpening(event.target.value)}
              aria-label={t.drawerStartTitle}
              autoFocus
              className="h-11 w-32 rounded-lg border border-slate-300 pl-6 pr-2 text-base tabular-nums"
            />
          </label>
          <Button
            loading={busy}
            // Zero is a real answer — a drawer can genuinely start empty — so
            // the guard is "did they type a number", not "is it more than nil".
            disabled={value === null}
            onClick={() => value !== null && save({ openingPaise: value })}
          >
            {t.drawerStartSave}
          </Button>
          {drawer && (
            <button
              type="button"
              onClick={() => setEditingOpening(false)}
              className="px-2 py-2 text-sm font-medium text-slate-500"
            >
              {t.no}
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------- the working out */

  const countedValue = parsePaise(counted);
  const short = drawer.differencePaise !== null && drawer.differencePaise < 0;
  const over = drawer.differencePaise !== null && drawer.differencePaise > 0;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <p className="text-sm font-semibold text-slate-900">{t.drawerTitle}</p>

      <dl className="mt-2 divide-y divide-slate-100 border-y border-slate-100">
        <Line label={t.drawerOpening} paise={drawer.openingPaise}>
          {/* A mistyped float poisons every figure under it, so it stays
              correctable all day rather than only in the first minute. */}
          <button
            type="button"
            onClick={() => {
              setOpening(paiseToInput(drawer.openingPaise));
              setEditingOpening(true);
            }}
            className="text-xs font-semibold text-brand-700 underline"
          >
            {t.drawerEdit}
          </button>
        </Line>
        <Line label={t.drawerCashSales} paise={drawer.cashSalesPaise} />
        <Line label={t.drawerCollected} paise={drawer.cashCollectedPaise} />
      </dl>

      <div className="mt-3 flex items-baseline justify-between gap-3">
        <p className="font-semibold text-slate-700">{t.drawerExpected}</p>
        <p className="text-2xl font-bold tabular-nums text-slate-900">
          {formatPaise(drawer.expectedPaise)}
        </p>
      </div>

      {/* Said before the owner starts hunting: some repayments never recorded
          whether they were cash, so the figure above can be low. */}
      {drawer.unexplainedCollectedPaise > 0 && (
        <p className="mt-1 text-xs text-amber-700">
          {t.drawerUnknownHint.replace('{n}', formatPaise(drawer.unexplainedCollectedPaise))}
        </p>
      )}

      <div className="mt-4 border-t border-slate-100 pt-3">
        <label className="block text-sm text-slate-600" htmlFor="drawer-count">
          {t.drawerCount}
        </label>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              ₹
            </span>
            <input
              id="drawer-count"
              inputMode="decimal"
              value={counted}
              onChange={(event) => setCounted(event.target.value)}
              className="h-11 w-32 rounded-lg border border-slate-300 pl-6 pr-2 text-base tabular-nums"
            />
          </span>
          <Button
            loading={busy}
            disabled={countedValue === null}
            onClick={() => countedValue !== null && save({ countedPaise: countedValue })}
          >
            {t.drawerCountSave}
          </Button>
        </div>

        {drawer.differencePaise !== null && (
          <div className="mt-3">
            <p
              className={clsx(
                'font-semibold tabular-nums',
                drawer.differencePaise === 0
                  ? 'text-brand-700'
                  : short
                    ? 'text-amber-700'
                    : 'text-slate-700',
              )}
            >
              {drawer.differencePaise === 0
                ? t.drawerMatches
                : short
                  ? t.drawerShort.replace('{n}', formatPaise(-drawer.differencePaise))
                  : t.drawerOver.replace('{n}', formatPaise(drawer.differencePaise))}
            </p>
            {/* THE COMMONEST REASON, SAID OUT LOUD. Halkhata is not told about
                money paid out of the till, so a shop that buys a crate of eggs
                at the door counts short by exactly that. It is a true
                difference, not a mistake to be hunted. */}
            {(short || over) && (
              <p className="mt-0.5 text-xs text-slate-500">{t.drawerSpentHint}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** One line of the working, with room for a control at the end. */
function Line({
  label,
  paise,
  children,
}: {
  label: string;
  paise: number;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <dt className="flex items-baseline gap-2 text-sm text-slate-600">
        {label}
        {children}
      </dt>
      <dd className="font-semibold tabular-nums text-slate-800">{formatPaise(paise)}</dd>
    </div>
  );
}
