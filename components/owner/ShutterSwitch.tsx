'use client';

/**
 * Open or shut, in the header, on every screen.
 *
 * IT LIVES IN THE HEADER BECAUSE OF WHEN IT IS USED. Every other setting in
 * this app is touched on the day the shop opens and then never again, which is
 * why they are folded away together. This one is touched on an ordinary
 * Tuesday, at nine in the morning, by somebody who has just decided not to open
 * — and again that evening, by the same person, in a hurry. A control like that
 * cannot be two taps inside an accordion on one particular tab. It took the
 * place of the pay link, which is the opposite kind of thing: important, and
 * wanted roughly twice a year.
 *
 * It is the shopkeeper's own shutter and NOT the console's Pause — see the note
 * on `Shop.ownerClosed`. An owner can never reopen a shop the operator closed,
 * and the operator's Pause is invisible here rather than shown as a switch that
 * does nothing.
 *
 * THE LABEL IS THE STATE, NOT THE ACTION. "Closed" beside a switch that is off
 * is one reading; "Close the shop" beside the same switch is the opposite one,
 * and a shopkeeper glancing at it while serving somebody will take whichever
 * they expected to see. So it says what is true now, and the switch is what
 * changes it.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { useToast } from '@/components/ui/Toast';
import { handledExpiredSession } from './sessionGuard';
import { ownerDict } from '@/lib/owner-i18n';
import type { Locale } from '@/lib/i18n';

export function ShutterSwitch({
  slug,
  locale,
  ownerClosed,
}: {
  slug: string;
  locale: Locale;
  ownerClosed: boolean;
}) {
  const t = ownerDict(locale);
  const router = useRouter();
  const { push } = useToast();
  const [busy, setBusy] = useState(false);

  const open = !ownerClosed;

  async function toggle() {
    setBusy(true);
    const next = !ownerClosed;
    try {
      const response = await fetch(`/api/owner/${slug}/trading`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerClosed: next }),
      });
      if (handledExpiredSession({ response, slug, t, push })) return;
      if (!response.ok) {
        push(t.networkError, 'error');
        return;
      }
      push(next ? t.shutterShut : t.shutterOpened, 'success');
      router.refresh();
    } catch {
      push(t.networkError, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={open}
      disabled={busy}
      onClick={toggle}
      title={open ? t.shutterCloseAction : t.shutterOpenAction}
      className={clsx(
        'inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-2 transition disabled:opacity-60',
        // Amber, loudly, while the shop is shut. An owner who closed for the
        // afternoon and forgot is the failure this exists to prevent, and it
        // has to be readable from across a counter without being looked for.
        open ? 'hover:bg-white/10' : 'bg-amber-400/25 ring-1 ring-amber-300/50',
      )}
    >
      <span
        aria-hidden
        className={clsx(
          'relative h-5 w-9 shrink-0 rounded-full transition',
          open ? 'bg-brand-400' : 'bg-white/35',
        )}
      >
        <span
          className={clsx(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all',
            open ? 'left-[1.15rem]' : 'left-0.5',
          )}
        />
      </span>
      {/* Hidden on the narrowest phones, where the header has four other things
          on it — the switch itself still reads, and its colour carries the
          state. */}
      <span
        className={clsx(
          'hidden truncate text-sm font-semibold sm:inline',
          open ? 'text-white/85' : 'text-amber-200',
        )}
      >
        {open ? t.shutterOpen : t.shutterClosed}
      </span>
    </button>
  );
}
