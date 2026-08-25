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

  async function remove() {
    // Typing the name is deliberate friction — deleting a shop also deletes
    // every item, order and sale recorded against it.
    const typed = window.prompt(
      `Deleting "${shopName}" removes its items, orders and sales permanently.\n\nType the shop name to confirm:`,
    );
    if (typed !== shopName) {
      if (typed !== null) push('Name did not match — nothing was deleted', 'info');
      return;
    }

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
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={toggleActive}
        disabled={busy}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {active ? 'Deactivate' : 'Activate'}
      </button>
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        className="rounded-lg px-2.5 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        Delete
      </button>
    </>
  );
}
