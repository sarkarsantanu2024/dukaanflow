'use client';

/**
 * Deactivate or delete a shop from the list.
 *
 * Both used to live only inside the edit page, two clicks away from where the
 * operator actually notices they want them. Deactivating in particular is a
 * routine act — a shop closes for a fortnight, the QR should stop taking
 * orders — and routine acts belong on the list.
 *
 * The two are deliberately unequal. Deactivating is one click and instantly
 * reversible. Deleting takes the shop's items, orders and sales with it, so it
 * asks for the name to be typed, exactly as the edit page does.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { TypeToConfirmDialog } from '@/components/ui/Modal';
import { PauseIcon, PlayIcon, TrashIcon } from '@/components/ui/Icon';

export function ShopRowActions({
  slug,
  shopName,
  active,
}: {
  slug: string;
  shopName: string;
  active: boolean;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);

  async function toggleActive() {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/shop/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !active }),
      });
      if (!response.ok) {
        push('Could not change the shop', 'error');
        return;
      }
      push(active ? `${shopName} is no longer taking orders` : `${shopName} is open again`, 'success');
      router.refresh();
    } catch {
      push('Network error. Please try again.', 'error');
    } finally {
      setBusy(false);
    }
  }

  // Typing the name is deliberate friction — deleting a shop also deletes
  // every item, order and sale recorded against it. The dialog holds that
  // check now, so by the time this runs the name already matches.
  async function remove() {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/shop/${slug}`, { method: 'DELETE' });
      if (!response.ok) {
        push('Could not delete the shop', 'error');
        return;
      }
      push(`${shopName} deleted`, 'success');
      router.refresh();
    } catch {
      push('Network error. Please try again.', 'error');
    } finally {
      setBusy(false);
      setAsking(false);
    }
  }

  // Icons, sized as proper targets and titled — the card's action row carries
  // five controls now, and two of them spelled out in words were taking the
  // width that the shop links needed. The colour still ranks them: pausing is
  // slate and reversible, deleting turns red under the cursor.
  return (
    <>
      <button
        type="button"
        onClick={toggleActive}
        disabled={busy}
        aria-label={active ? `Pause ${shopName}` : `Activate ${shopName}`}
        title={active ? 'Pause — stops taking orders' : 'Activate — takes orders again'}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
      >
        {active ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
      </button>
      <button
        type="button"
        onClick={() => setAsking(true)}
        disabled={busy}
        aria-label={`Delete ${shopName}`}
        title="Delete this shop"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
      >
        <TrashIcon className="h-4 w-4" />
      </button>

      <TypeToConfirmDialog
        open={asking}
        title="Delete this shop?"
        message={
          <>
            This removes <strong>{shopName}</strong>, its items, orders and sales
            permanently. Its QR stops working and nothing can be restored.
          </>
        }
        expected={shopName}
        inputLabel={`Type "${shopName}" to confirm`}
        confirmLabel="Delete shop"
        busy={busy}
        onConfirm={remove}
        onCancel={() => setAsking(false)}
      />
    </>
  );
}
