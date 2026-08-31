/**
 * The Halkhata mark.
 *
 * The console had one of these hand-rolled in its sidebar and the customer's
 * shop page had none at all, which left the storefront looking like a page from
 * some other product that happened to be the same green. One component now, so
 * the mark is the same square, the same weight and the same wordmark wherever
 * it appears — and so there is exactly one place to change it.
 */

import Link from 'next/link';
import clsx from 'clsx';
import { BrandLogo } from './BrandLogo';
import { BRAND_NAME, BRAND_WORDMARK } from '@/lib/brand';

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
      aria-label={`${BRAND_NAME} — home`}
      className={clsx('inline-flex items-center gap-2.5', className)}
    >
      {/* The mark stands on its own — no tile behind it.
          It was a green rounded square with the letters "DF" in it, which is
          what an app icon looks like, not what a logo looks like. A logo sits
          on the page in its own colour beside its own name. The "DF" is also
          two initials the product no longer has. */}
      <BrandLogo
        className={clsx('h-7 w-7 shrink-0', tone === 'dark' ? 'text-white' : 'text-brand-600')}
      />
      {/* Two tones, one word. "Halkhata" set in a single weight was a label;
          the colour break is what makes the compound read as a name, and it
          ties the wordmark to the mark beside it. */}
      <span
        className={clsx(
          '-tracking-[0.01em] font-bold leading-tight',
          tone === 'dark' ? 'text-white' : 'text-slate-900',
        )}
      >
        {BRAND_WORDMARK.head}
        {BRAND_WORDMARK.tail && (
          <span className={tone === 'dark' ? 'text-brand-200' : 'text-brand-600'}>
            {BRAND_WORDMARK.tail}
          </span>
        )}
      </span>
    </Link>
  );
}
