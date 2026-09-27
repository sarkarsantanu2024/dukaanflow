'use client';

/**
 * The top of the home, and the start of the day: today's cash, and the way to
 * the till, side by side.
 *
 * The opening float used to sit inside the takings panel with its own "start
 * the day" button. It belongs at the very top instead — it is the first thing
 * an owner does on opening up — and it no longer needs a button of its own: the
 * amount saves when the box loses focus, and the one button on this row is the
 * one an owner actually wants next, "বিক্রি করুন". Typing the cash and tapping
 * sell are the morning, in one row.
 *
 * TODAY'S CASH IS MANDATORY (2026-09-28, by the owner): the till does not open
 * until it is in. ₹0 counts; a blank does not. The server refuses a sale or an
 * "open" switch without it too — see `lib/cash-day.ts` — so this screen is the
 * friendly half of a rule that holds anyway.
 *
 * `gate` is the same row standing in for the till itself, on the Sell tab,
 * when the owner reached it without passing the home screen: it asks for the
 * cash and, once saved, the page reloads into the till.
 */

import { useRef, useState } from 'react';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { CartIcon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { handledExpiredSession } from './sessionGuard';
import { paiseToInput, parsePaise } from '@/lib/money';
import { ownerDict } from '@/lib/owner-i18n';
import type { Locale } from '@/lib/i18n';
import type { Drawer } from '@/lib/takings';

export function StartDayRow({
  slug,
  drawer,
  locale,
  gate = false,
}: {
  slug: string;
  /** Today's drawer, so a float already set for the day shows in the box. */
  drawer: Drawer | null;
  locale: Locale;
  /** Shown in place of the till — see the note above. */
  gate?: boolean;
}) {
  const t = ownerDict(locale);
  const router = useRouter();
  const { push } = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [cash, setCash] = useState(drawer ? paiseToInput(drawer.openingPaise) : '');
  const [busy, setBusy] = useState(false);
  /** Asked to sell with the box empty — the box goes red until it is filled. */
  const [missing, setMissing] = useState(false);
  /** True once today's cash is on the server, typed now or earlier today. */
  const [opened, setOpened] = useState(drawer !== null);

  /**
   * Saves the opening float. Returns whether today's cash is now recorded.
   * Silent on a blank box when blurring: an owner who has not typed anything
   * has not asked to save.
   */
  /**
   * The save in flight, shared. Tapping the sell button right after typing
   * blurs the box first, which starts a save — and the tap must wait for THAT
   * save rather than be swallowed by a disabled button or post a second time.
   */
  const inFlight = useRef<Promise<boolean> | null>(null);

  function saveOpening(refresh = true): Promise<boolean> {
    if (inFlight.current) return inFlight.current;
    const value = parsePaise(cash);
    if (value === null) return Promise.resolve(opened);
    if (opened && savedValue.current === value) return Promise.resolve(true);
    inFlight.current = postOpening(value, refresh).finally(() => {
      inFlight.current = null;
    });
    return inFlight.current;
  }

  /** The last opening figure the server has, so an unchanged box is not re-sent. */
  const savedValue = useRef<number | null>(drawer ? drawer.openingPaise : null);

  async function postOpening(value: number, refresh: boolean): Promise<boolean> {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/shop/${slug}/cash`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openingPaise: value }),
      });
      if (handledExpiredSession({ response, slug, t, push })) return false;
      if (response.ok) {
        savedValue.current = value;
        setOpened(true);
        setMissing(false);
        push(t.drawerStarted, 'success');
        if (refresh) router.refresh();
        return true;
      }
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      push(payload.error ?? t.networkError, 'error');
      return false;
    } catch {
      push(t.networkError, 'error');
      return false;
    } finally {
      setBusy(false);
    }
  }

  /** The sell button: never past this row without today's cash. */
  async function startSelling() {
    if (parsePaise(cash) === null && !opened) {
      setMissing(true);
      push(t.cashRequired, 'error');
      input.current?.focus();
      return;
    }
    // On the Sell tab a refresh brings the till; from home, go to it.
    if (!(await saveOpening(gate))) return;
    if (!gate) router.push(`/owner/${slug}/sell`);
  }

  return (
    <div
      className={clsx(
        'rounded-2xl border bg-glass p-4 shadow-raised',
        missing ? 'border-red-300' : 'border-glass-edge',
      )}
    >
      <p className="flex flex-wrap items-center gap-2 font-semibold text-slate-900">
        {gate ? t.cashGateTitle : t.drawerStartTitle}
        {!opened && (
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
            {t.cashRequiredMark}
          </span>
        )}
      </p>
      <p className={clsx('mt-0.5 text-sm', missing ? 'text-red-700' : 'text-slate-600')}>
        {missing ? t.cashRequired : t.drawerStartHint}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">₹</span>
          <input
            ref={input}
            inputMode="decimal"
            value={cash}
            onChange={(event) => {
              setCash(event.target.value);
              if (event.target.value.trim()) setMissing(false);
            }}
            onBlur={() => void saveOpening()}
            readOnly={busy}
            required
            aria-required="true"
            aria-invalid={missing}
            aria-label={t.drawerStartTitle}
            className={clsx(
              'h-11 w-full rounded-xl border bg-sunk pl-6 pr-2 text-sm font-medium tabular-nums',
              missing ? 'border-red-400 ring-2 ring-red-200' : 'border-brand-200',
            )}
          />
        </label>
        <button
          type="button"
          onClick={() => void startSelling()}
          aria-busy={busy}
          className="btn-ring flex h-11 items-center justify-center gap-2 rounded-full text-sm font-medium text-white shadow-raised transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60 [--ring-fill:theme(colors.brand.600)]"
        >
          <CartIcon className="h-5 w-5" />
          {gate ? t.cashGateStart : t.todaySellNow}
        </button>
      </div>
    </div>
  );
}
