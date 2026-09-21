'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { RefreshIcon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/Modal';
import { HEADER_ACTION } from './headerStyles';

/**
 * Wipes a demo shop's data so the full flow can be run again from a clean slate.
 *
 * Rendered as a top-bar action, in the same shape as the other header controls,
 * and only for demo shops — the server refuses it on any other, so this is the
 * second lock, not the only one. A plain yes/no confirm rather than
 * type-to-confirm: nothing here is irreplaceable (it is a test shop by
 * definition), and the point of the button is to reset quickly and often.
 */
export function ResetShopButton({ slug, shopName }: { slug: string; shopName: string }) {
  const router = useRouter();
  const { push } = useToast();
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);

  async function reset() {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/shop/${slug}/reset`, { method: 'POST' });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        push(payload.error ?? 'Could not reset the shop', 'error');
        return;
      }
      push('Shop data reset — clean slate', 'success');
      router.refresh();
    } catch {
      push('Network error. Please try again.', 'error');
    } finally {
      setBusy(false);
      setAsking(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAsking(true)}
        disabled={busy}
        aria-label="Reset shop data"
        title="Reset shop data"
        className={clsx(HEADER_ACTION, 'border border-amber-300 text-amber-800 hover:bg-amber-50 disabled:opacity-50')}
      >
        <RefreshIcon className="h-[18px] w-[18px]" />
        <span className="hidden sm:inline">Reset data</span>
      </button>

      <ConfirmDialog
        open={asking}
        title="Reset this shop's data?"
        message={
          <>
            Clears every order, counter sale, khata entry, customer and cash-day
            for <strong>{shopName}</strong>, and puts its items back to in-stock
            and not-counted. The shop, its PIN and its item list stay. Good for
            running the flow again; there is no undo.
          </>
        }
        confirmLabel="Reset data"
        cancelLabel="Cancel"
        busy={busy}
        onConfirm={reset}
        onCancel={() => setAsking(false)}
      />
    </>
  );
}
