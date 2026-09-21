'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/Modal';

/**
 * Wipes a demo shop's data so the full flow can be run again from a clean slate.
 *
 * Only rendered for demo shops — the server refuses it on any other, so this is
 * the second lock, not the only one. A plain yes/no confirm rather than
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
      <Button variant="secondary" onClick={() => setAsking(true)} loading={busy}>
        Reset shop data
      </Button>

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
