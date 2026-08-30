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

  // Typing the name is deliberate friction — deleting a shop also deletes
  // every item and every stored order for it. The dialog holds that check now,
  // so by the time this runs the name already matches.
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
        message={
          <>
            This removes <strong>{shopName}</strong>, its items, orders and sales
            permanently. Its QR stops working and nothing can be restored.
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
