'use client';

/**
 * Whether this shop's owner can sign in, said on the card — and a way to give
 * them a PIN without leaving the list.
 *
 * THE EXISTING PIN CANNOT BE SHOWN, HERE OR ANYWHERE. Only its bcrypt hash is
 * stored, which is the whole point of hashing it: a console that could read
 * back every shop's PIN is one stolen session away from being able to sign into
 * every shop. So the card answers the question behind "what is their PIN?" —
 * can this owner get in, and since when — and offers the actual remedy, which
 * is issuing a fresh one.
 *
 * The new PIN appears once, right here, big enough to read off a screen while
 * repeating it down a phone line. After that it is gone for good.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/useConfirm';
import { KeyIcon } from '@/components/ui/Icon';

export function ShopPinBadge({
  slug,
  shopName,
  hasPin,
  /** Already formatted for reading, or null when no PIN was ever issued. */
  pinSetAt,
}: {
  slug: string;
  shopName: string;
  hasPin: boolean;
  pinSetAt: string | null;
}) {
  const router = useRouter();
  const { push } = useToast();
  const { confirm, dialog } = useConfirm();
  const [pin, setPin] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function issue() {
    // Reissuing is not free: it signs the owner out of every phone they used
    // the old PIN on. Asking first is the difference between a deliberate
    // rotation and an operator locking a shop out by mis-tapping a card.
    if (
      hasPin &&
      !(await confirm({
        title: `Issue a new PIN for ${shopName}?`,
        message:
          'The old PIN stops working immediately, and the owner is signed out on every phone they used it on. The PIN they have now cannot be looked up — only replaced.',
        confirmLabel: 'Issue new PIN',
      }))
    ) {
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`/api/admin/shop/${slug}/pin`, { method: 'POST' });
      const payload = (await response.json().catch(() => ({}))) as { pin?: string; error?: string };
      if (!response.ok || !payload.pin) {
        push(payload.error ?? 'Could not issue a PIN', 'error');
        return;
      }
      setPin(payload.pin);
      router.refresh();
    } catch {
      push('Network error. Please try again.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      push(`${what} copied`, 'success');
    } catch {
      push('Could not copy — read it off the card instead', 'error');
    }
  }

  return (
    <>
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span
          className={
            hasPin
              ? 'inline-flex items-center gap-1 text-xs font-medium text-slate-600'
              : 'inline-flex items-center gap-1 text-xs font-medium text-amber-700'
          }
        >
          <KeyIcon className="h-3.5 w-3.5 text-slate-400" />
          {hasPin ? `PIN active${pinSetAt ? ` · ${pinSetAt}` : ''}` : 'No PIN — owner cannot sign in'}
        </span>

        <button
          type="button"
          onClick={issue}
          disabled={busy}
          className="text-xs font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800 disabled:opacity-50"
        >
          {hasPin ? 'New PIN' : 'Create PIN'}
        </button>
      </span>

      {/* Shown once. The card is where it was asked for, so it is shown on the
          card rather than sending the operator to another screen to read it. */}
      {pin && (
        <span className="mt-1.5 flex w-full flex-wrap items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5">
          <span className="font-mono text-lg font-bold tracking-[0.25em] text-brand-900">{pin}</span>
          <button
            type="button"
            onClick={() => copy(pin, 'PIN')}
            className="text-xs font-semibold text-brand-800 underline underline-offset-2"
          >
            Copy
          </button>
          <span className="text-[11px] text-brand-800">Write it down — it cannot be shown again.</span>
        </span>
      )}

      {dialog}
    </>
  );
}
