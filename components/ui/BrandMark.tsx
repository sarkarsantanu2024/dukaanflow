/**
 * The DukaanFlow mark.
 *
 * The console had one of these hand-rolled in its sidebar and the customer's
 * shop page had none at all, which left the storefront looking like a page from
 * some other product that happened to be the same green. One component now, so
 * the mark is the same square, the same weight and the same wordmark wherever
 * it appears — and so there is exactly one place to change it.
 */

import Link from 'next/link';
import clsx from 'clsx';

export function BrandMark({
  href = '/',
  tone = 'light',
  className,
}: {
  /** Where the mark goes. The console points at its own root, not the site's. */
  href?: string;
  /** `light` for a white background, `dark` for the brand-coloured header. */
  tone?: 'light' | 'dark';
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="DukaanFlow — home"
      className={clsx('inline-flex items-center gap-2.5', className)}
    >
      <span
        aria-hidden
        className={clsx(
          'flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold',
          tone === 'dark' ? 'bg-white/20 text-white backdrop-blur' : 'bg-brand-600 text-white',
        )}
      >
        DF
      </span>
      <span
        className={clsx(
          'font-bold leading-tight',
          tone === 'dark' ? 'text-white' : 'text-slate-900',
        )}
      >
        DukaanFlow
      </span>
    </Link>
  );
}
