'use client';

/**
 * The console's top bar.
 *
 * On a desk this is a row of labelled buttons. On a phone the same row wrapped
 * onto two and three lines — "← Back", "Install app" and "Sign out" spelled out
 * in full next to a shop name — which read as a cramped web page rather than an
 * app. Below `sm` every action collapses to its icon on a 40px tap target and
 * the labels come back as `aria-label`, so the bar stays one line at 375px and
 * the title keeps the space.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import clsx from 'clsx';
import { ArrowLeftIcon, SignOutIcon } from '@/components/ui/Icon';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { HEADER_ACTION } from './headerStyles';

export function AdminHeader({
  title,
  eyebrow,
  backHref,
  children,
}: {
  title: string;
  /**
   * The context the title sits in — usually the shop. Titles like
   * "Ramu Grocery — Items" truncated to "Ramu Grocery …" on a phone, losing the
   * half that says which screen you are on. Split in two, both halves survive.
   */
  eyebrow?: string;
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
    <header className="no-print sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex items-center gap-1 px-2 py-2 sm:gap-3 sm:px-4 sm:py-3 lg:px-6">
        {backHref && (
          <Link
            href={backHref}
            aria-label="Back"
            title="Back"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 sm:h-9 sm:w-auto sm:gap-1.5 sm:rounded-lg sm:px-2.5 sm:text-sm sm:font-medium"
          >
            <ArrowLeftIcon className="h-5 w-5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>
        )}

        <div className="mr-auto min-w-0">
          {eyebrow && (
            <p className="truncate text-[11px] font-medium leading-tight text-slate-500 sm:text-xs">
              {eyebrow}
            </p>
          )}
          <h1 className="truncate text-base font-bold leading-tight text-slate-900 sm:text-lg">
            {title}
          </h1>
        </div>

        {children}

        <button
          type="button"
          onClick={logout}
          disabled={loggingOut}
          aria-label="Sign out"
          title="Sign out"
          className={clsx(HEADER_ACTION, 'text-slate-600 hover:bg-slate-100 disabled:opacity-50')}
        >
          {loggingOut ? <Spinner /> : <SignOutIcon className="h-[18px] w-[18px]" />}
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
