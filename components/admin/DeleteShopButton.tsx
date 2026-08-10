'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export function DeleteShopButton({ slug, shopName }: { slug: string; shopName: string }) {
  const router = useRouter();
  const { push } = useToast();
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    // Typing the name is deliberate friction — deleting a shop also deletes
    // every item and every stored order for it.
    const typed = window.prompt(
      `Deleting "${shopName}" removes its items and order history permanently.\n\nType the shop name to confirm:`,
    );
    if (typed !== shopName) {
      if (typed !== null) push('Name did not match — nothing was deleted', 'info');
      return;
    }

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
    }
  }

  return (
    <Button variant="danger" onClick={remove} loading={deleting}>
      Delete shop
    </Button>
  );
}
