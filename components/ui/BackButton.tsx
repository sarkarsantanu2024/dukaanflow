'use client';

/**
 * A VISIBLE WAY BACK, ON EVERY PAGE THAT IS NOT WHERE THE SHOPPER STARTED.
 *
 * The tracking page, the closed-shop page and the legal pages had no back
 * control at all — only a small logo that went somewhere the shopper did not
 * expect. On a phone opened from a notification there is not even a browser
 * back to fall back on.
 *
 * WHERE "BACK" GOES. To the screen they came from, when they came from inside
 * this app in this tab (so the storefront comes back as they left it: search,
 * scroll and basket). Otherwise — opened from a notification, a WhatsApp link, a
 * QR — to `fallback`, the page back would sensibly mean: the order's shop for a
 * tracking page, the home page for the rest. Never out of the app to wherever
 * the tab happened to be before.
 *
 * `NavMemory` (mounted once in the root layout) is what knows the difference:
 * `document.referrer` does not change on in-app navigation, so it cannot.
 */

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { ArrowLeftIcon } from './Icon';

const IN_APP = 'halkhata:in-app';

/** Marks this tab once the shopper has moved from one page of the app to another. */
export function NavMemory() {
  const pathname = usePathname();
  const first = useRef<string | null>(null);
  useEffect(() => {
    if (first.current === null) {
      first.current = pathname;
      return;
    }
    if (pathname !== first.current) {
      try {
        window.sessionStorage.setItem(IN_APP, '1');
      } catch {
        // Storage refused: back falls back to `fallback`, which is still right.
      }
    }
  }, [pathname]);
  return null;
}

function cameFromInsideApp(): boolean {
  try {
    if (window.history.length <= 1) return false;
    if (window.sessionStorage.getItem(IN_APP) === '1') return true;
    return Boolean(document.referrer) && new URL(document.referrer).origin === window.location.origin;
  } catch {
    return false;
  }
}

export function BackButton({
  fallback,
  label,
  tone = 'dark',
  showLabel = false,
  className,
}: {
  /** Where back goes when there is no screen of ours to go back to. */
  fallback: string;
  /** Said to screen readers; shown beside the arrow from `sm` up. */
  label: string;
  /** `dark` sits on the chrome bar, `light` on a white one. */
  tone?: 'dark' | 'light';
  /** Show the word on phones too, where the arrow is not the only thing on the page. */
  showLabel?: boolean;
  className?: string;
}) {
  const router = useRouter();

  return (
    <Link
      href={fallback}
      aria-label={label}
      title={label}
      onClick={(event) => {
        if (!cameFromInsideApp()) return; // the Link goes to `fallback`
        event.preventDefault();
        router.back();
      }}
      className={clsx(
        // 44px: a thumb's target, the same as the bell beside it.
        'inline-flex h-11 min-w-[2.75rem] shrink-0 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-medium transition',
        tone === 'dark' ? 'text-white hover:bg-white/10' : 'text-brand-700 hover:bg-brand-50',
        className,
      )}
    >
      <ArrowLeftIcon className="h-6 w-6" />
      <span className={showLabel ? 'inline' : 'hidden sm:inline'}>{label}</span>
    </Link>
  );
}
