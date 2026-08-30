'use client';

/**
 * Show or hide demonstration shops across the console.
 *
 * The setting lives in a cookie rather than in `localStorage`, because the
 * pages it affects render on the server: a value only the browser can read
 * would mean shipping every shop to the client and hiding some of them, which
 * is both slower and a lie about what the page contains.
 *
 * Not `HttpOnly` and not signed — it is a display preference, not a permission.
 * The worst a forged value can do is show its owner a shop they are already
 * entitled to see.
 */

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import clsx from 'clsx';

export const DEMO_COOKIE = 'df_show_demo';

export function DemoToggle({ showing, count }: { showing: boolean; count: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !showing;
    // A year, path-wide, so the choice survives a refresh and applies to every
    // console screen rather than only the one it was made on.
    document.cookie = `${DEMO_COOKIE}=${next ? '1' : '0'}; path=/; max-age=31536000; SameSite=Lax`;
    startTransition(() => router.refresh());
  }

  // Nothing to toggle and nothing hidden — the control would be a puzzle.
  if (count === 0 && !showing) return null;

  // shrink-0 and nowrap on the button: it sits at the end of a wrapping stat
  // strip, and as a shrinkable flex item its label was squeezed under the
  // track until the switch sat on top of the word it labels.
  return (
    <button
      type="button"
      role="switch"
      aria-checked={showing}
      onClick={toggle}
      disabled={pending}
      className="inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-2 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
    >
      <span
        className={clsx(
          'relative h-5 w-9 shrink-0 rounded-full ring-1 transition-colors',
          showing ? 'bg-brand-600 ring-brand-700/20' : 'bg-slate-300 ring-slate-400/20',
        )}
      >
        <span
          className={clsx(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
            showing ? 'translate-x-[1.125rem]' : 'translate-x-0.5',
          )}
        />
      </span>
      <span className="font-medium">
        Demo {count === 1 ? 'shop' : 'shops'}
        {count > 0 && <span className="ml-1 text-slate-400">({count})</span>}
      </span>
    </button>
  );
}
