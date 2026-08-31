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
          on the page beside its own name.

          No colour class here any more. The mark is a full-colour illustration
          that carries its own palette, so `tone` now only reaches the wordmark;
          passing it a text colour would have been a class that silently did
          nothing. */}
      {/* 40px, where the old glyph was 28.
          A one-colour glyph reads at any size because there is one shape to
          recognise. This mark is a little scene — an awning, a chart, an arrow
          around both — and at 28px those collapse into a coloured smudge. An
          illustration has to be given the room to be an illustration, or it
          should not be the logo.

          ON THE DARK RAIL IT GETS A WHITE TILE, and that reverses an older
          rule here. The rule was right for a glyph that took `currentColor`:
          a logo sits on the page in its own colour, and a tile behind it makes
          it look like an app icon pasted in. But this mark contains a deep navy
          chart panel, and navy on a dark green rail is not a logo, it is a
          smudge — most of the artwork simply stopped being visible. A picture
          with dark ink in it needs light under it, so the tile is what keeps
          the mark legible rather than what decorates it. */}
      <span
        className={clsx(
          'inline-flex shrink-0 items-center justify-center',
          tone === 'dark' && 'rounded-xl bg-white p-1 shadow-sm ring-1 ring-white/60',
        )}
      >
        <BrandLogo className="h-10 w-10" />
      </span>
      {/* Two tones, one word. "Halkhata" set in a single weight was a label;
          the colour break is what makes the compound read as a name, and it
          ties the wordmark to the mark beside it. */}
      <span
        className={clsx(
          '-tracking-[0.01em] text-[1.0625rem] font-bold leading-tight',
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
