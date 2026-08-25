'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { InstallApp } from '@/components/admin/InstallApp';

export function OwnerHeader({ slug, shopName }: { slug: string; shopName: string }) {
  const router = useRouter();
  const { push } = useToast();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await fetch('/api/owner/logout', { method: 'POST' });
      router.replace(`/owner/${slug}/login`);
      router.refresh();
    } catch {
      push('Could not sign out', 'error');
      setBusy(false);
    }
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3 px-4 py-3">
        <div className="mr-auto min-w-0">
          <h1 className="truncate text-lg font-bold text-slate-900">{shopName}</h1>
          <p className="text-xs text-slate-500">My prices</p>
        </div>
        <Link
          href={`/shop/${slug}`}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          View my shop
        </Link>
        <InstallApp manifestSlug={slug} />
        <Button variant="ghost" size="sm" onClick={signOut} loading={busy}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
