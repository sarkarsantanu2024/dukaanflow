'use client';

/**
 * The same catch, one level up, for everything outside `/owner/<slug>`.
 *
 * The owner tree has its own boundary because that is where a blank screen
 * costs a sale. This one is the backstop for the console, the customer's shop
 * page and the marketing pages: the app had NO error boundary at all, so any
 * throw on any route rendered nothing.
 *
 * Deliberately not a shared component with the owner's. That one speaks to a
 * shopkeeper mid-sale and says their records are safe; this one is read by an
 * operator at a desk or a customer on a shop page, and inheriting the wrong
 * reassurance is worse than writing eight lines twice.
 */

import { useEffect } from 'react';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page failed to render', error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <div className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-8 shadow-sm">
        <p className="text-lg font-bold text-slate-900">Something went wrong</p>
        <p className="mt-1 text-sm text-slate-600">কিছু একটা ভুল হয়েছে · कुछ गड़बड़ हो गई</p>

        <button
          type="button"
          onClick={reset}
          className="mt-6 w-full rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white transition hover:brightness-95"
        >
          Try again · আবার চেষ্টা করুন
        </button>

        {error.digest && (
          <p className="mt-4 font-mono text-[11px] text-slate-400">{error.digest}</p>
        )}
      </div>
    </div>
  );
}
