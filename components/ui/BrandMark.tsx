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
  name = true,
  className,
}: {
  /** Where the mark goes. The console points at its own root, not the site's. */
  href?: string;
  /** `light` for a white background, `dark` for the brand-coloured header. */
  tone?: 'light' | 'dark';
  /**
   * Draw the name beside the mark, or the mark on its own.
   *
   * THE MARK CAN CARRY A NARROW BAR BY ITSELF and the name cannot. On a 360px
   * phone the owner's header holds the mark, the shop's name, a clock and a
   * bell; "Halkhata" beside all of that is the one thing on the bar that the
   * person holding it already knows — they are inside the app. The picture is
   * enough to say whose app it is, and the name is on every screen they
   * arrived from.
   *
   * It stays on wherever there is room, because a mark this detailed needs its
   * name the first time somebody meets it. The link keeps its accessible name
   * either way, so nothing is lost to a screen reader.
   */
  name?: boolean;
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
          recognise. This mark is a little scene — a tied ledger, a seal, two
          figures on its cover, leaves at its foot — and at 28px those collapse
          into a red smudge. An illustration has to be given the room to be an
          illustration, or it should not be the logo.

          ON THE DARK RAIL IT GETS A WHITE TILE, and that reverses an older
          rule here. The rule was right for a glyph that took `currentColor`:
          a logo sits on the page in its own colour, and a tile behind it makes
          it look like an app icon pasted in. But the mango leaves at the foot
          of this mark are a green within a hair of the rail's own, and on the
          bare rail they simply vanish — the ledger survives, its leaves do not.
          The tile is what keeps the whole picture rather than what decorates
          it. */}
      <span
        className={clsx(
          'inline-flex shrink-0 items-center justify-center',
          tone === 'dark' && 'rounded-xl bg-card p-1 shadow-sm ring-1 ring-white/60',
        )}
      >
        <BrandLogo className="h-10 w-10" />
      </span>
      {/* Two tones, one word, AND THEY ARE THE LOGOTYPE'S OWN TWO TONES.
          The supplied wordmark sets "Hal" in the shop-front green and "khata"
          in red; this used to set the first half in slate and the second in
          the brand colour, which was the same idea executed in the wrong
          paint. A header that spells the name in different colours from the
          artwork three pixels to its left is the one place a brand cannot
          afford to disagree with itself.

          THE RED HERE IS NOT THE RED THAT MEANS UNPAID. It is the logotype's,
          it appears nowhere else in the product, and `wordmark` in the theme
          says so — see the note on the `brand` ramp. On the dark rail both
          halves go white rather than carrying a red that would fight the rail
          and fail to be read anyway. */}
      {name && (
        <span
          className={clsx(
            '-tracking-[0.01em] text-[1.0625rem] font-bold leading-tight',
            tone === 'dark' ? 'text-white' : 'text-brand-700',
          )}
        >
          {BRAND_WORDMARK.head}
          {BRAND_WORDMARK.tail && (
            <span className={tone === 'dark' ? 'text-white/80' : 'text-wordmark'}>
              {BRAND_WORDMARK.tail}
            </span>
          )}
        </span>
      )}
    </Link>
  );
}
