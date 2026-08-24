'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { InstallApp } from './InstallApp';

export function AdminHeader({
  title,
  backHref,
  children,
}: {
  title: string;
  backHref?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.replace('/admin/login');
      router.refresh();
    } catch {
      push('Could not sign out', 'error');
      setLoggingOut(false);
    }
  }

  return (
    <header className="no-print border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
        {backHref && (
          <Link
            href={backHref}
            className="rounded-lg px-2 py-1 text-sm font-medium text-slate-500 hover:bg-slate-100"
          >
            ← Back
          </Link>
        )}
        <h1 className="mr-auto truncate text-lg font-bold text-slate-900">{title}</h1>
        {children}
        <InstallApp />
        <Button variant="ghost" size="sm" onClick={logout} loading={loggingOut}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
