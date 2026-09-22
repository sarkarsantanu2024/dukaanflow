import type { Metadata } from 'next';
import Link from 'next/link';
import { BRAND_NAME } from '@/lib/brand';

export const metadata: Metadata = { title: `${BRAND_NAME} — Link not valid` };

export default function JoinExpiredPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-glass-edge bg-glass p-6 shadow-raised">
        <p className="text-xs font-bold uppercase tracking-wide text-brand-700">{BRAND_NAME}</p>
        <h1 className="mt-1 text-xl font-bold text-slate-900">This link is not valid</h1>
        <p className="mt-2 text-sm text-slate-600">
          It may have been replaced by a newer link, or the shop&apos;s access was reset. Ask for a
          fresh link, or sign in with your shop PIN.
        </p>
        <Link
          href="/pricing"
          className="mt-4 inline-flex h-11 items-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
        >
          About {BRAND_NAME}
        </Link>
      </div>
    </main>
  );
}
