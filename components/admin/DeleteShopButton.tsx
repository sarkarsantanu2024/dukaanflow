'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { TypeToConfirmDialog } from '@/components/ui/Modal';

export function DeleteShopButton({ slug, shopName }: { slug: string; shopName: string }) {
  const router = useRouter();
  const { push } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [asking, setAsking] = useState(false);

  /**
   * Typing the name is deliberate friction, and it is not decoration: this
   * deletes far more than the row on the card. The dialog holds that check, so
   * by the time this runs the name already matches.
   */
  async function remove() {
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/shop/${slug}`, { method: 'DELETE' });
      if (!response.ok) {
        push('Could not delete the shop', 'error');
        return;
      }
      push('Shop deleted', 'success');
      router.push('/admin');
      router.refresh();
    } catch {
      push('Network error. Please try again.', 'error');
    } finally {
      setDeleting(false);
      setAsking(false);
    }
  }

  return (
    <>
      <Button variant="danger" onClick={() => setAsking(true)} loading={deleting}>
        Delete shop
      </Button>

      <TypeToConfirmDialog
        open={asking}
        title="Delete this shop?"
        /* Everything named, because "its items and orders" was true and
           incomplete — and the two things it left out are the two somebody
           would most want warning about. A shop's khata is a record of real
           money owed by real people, and its rollups are the only surviving
           trace of years whose orders have already been purged. Both go, and
           neither can be got back. */
        message={
          <>
            This permanently removes <strong>{shopName}</strong> and everything
            attached to it: items, orders, counter sales, customers, the whole
            udhaar khata, recorded payments, the yearly and occasion rollups,
            and any phones subscribed to its notifications. Its QR stops
            working. Nothing can be restored.
          </>
        }
        expected={shopName}
        inputLabel={`Type "${shopName}" to confirm`}
        confirmLabel="Delete shop"
        busy={deleting}
        onConfirm={remove}
        onCancel={() => setAsking(false)}
      />
    </>
  );
}
