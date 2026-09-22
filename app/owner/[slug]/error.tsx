'use client';

/**
 * WHAT THE OWNER SEES WHEN A SCREEN FAILS TO LOAD.
 *
 * Until this file existed, they saw nothing at all. Every owner screen is
 * `force-dynamic` and the home screen alone fires eight database reads before it
 * can render a pixel; the database is serverless and cold-starts. When one of
 * those reads threw, there was no boundary anywhere in the app to catch it — so
 * `loading.tsx` flushed its skeleton, the throw tore it down, and nothing took
 * its place. A blank phone, mid-sale, with no way to tell that the shop was
 * fine and a second tap would have worked.
 *
 * THAT IS THE WHOLE OF WHAT THIS FIXES: it turns a dead screen into a retry.
 * `reset()` re-renders the segment without a full page load, which is what makes
 * it worth a button — a cold Neon connection is usually warm by the second try.
 *
 * ALL THREE LANGUAGES AT ONCE, like the QR poster, and for a stronger reason
 * than the poster has. Every other owner screen knows its language because the
 * shop record says so — and the read that fetches the shop record is one of the
 * reads that can throw. An error page that needs the thing that just failed in
 * order to word itself is not an error page. Three short lines cost less than
 * being wrong.
 */

import { useEffect } from 'react';

export default function OwnerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // The digest is the only thread back to the real stack in the server logs;
  // without it a report of "it went blank" is unmatchable to anything.
  useEffect(() => {
    console.error('Owner screen failed to render', error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-16 text-center">
      <div className="w-full rounded-2xl border border-slate-200 bg-card px-5 py-8 shadow-sm">
        <p className="text-lg font-bold text-slate-900">কিছু একটা ভুল হয়েছে</p>
        <p className="mt-1 text-base font-semibold text-slate-700">कुछ गड़बड़ हो गई</p>
        <p className="mt-1 text-sm font-medium text-slate-500">Something went wrong</p>

        {/* The reassurance is the point. An owner whose screen went blank
            assumes the shop's data is gone, because that is what a blank screen
            looks like from the outside. Nothing here was lost. */}
        <p className="mt-4 text-sm text-slate-600">
          আপনার হিসাব ঠিক আছে · आपका हिसाब सुरक्षित है · Your records are safe
        </p>

        <button
          type="button"
          onClick={reset}
          className="mt-6 w-full rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white transition hover:brightness-95"
        >
          আবার চেষ্টা করুন · दोबारा कोशिश करें · Try again
        </button>

        {error.digest && (
          <p className="mt-4 font-mono text-[11px] text-slate-400">{error.digest}</p>
        )}
      </div>
    </div>
  );
}
