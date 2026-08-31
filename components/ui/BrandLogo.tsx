/**
 * The Halkhata mark, as an image.
 *
 * It used to be an SVG that took `currentColor`, so one component served the
 * white-on-dark header and the green-on-white page. The mark is now a supplied
 * full-colour illustration, so there is nothing to tint — callers size it and
 * nothing else. `lib/brand.ts` holds the paths; `scripts/build-brand-icons.ts`
 * regenerates every size from the master.
 *
 * A plain `<img>` rather than `next/image`: this renders at 28px in a header
 * that is already server-rendered, and the file it points at is a pre-sized
 * 96px PNG. The optimiser would add a round trip to save nothing.
 */

import { BRAND_LOGO, BRAND_LOGO_ALT } from '@/lib/brand';

export function BrandLogo({
  className = 'h-6 w-6',
  /** Decorative beside the wordmark, which already names the product. */
  decorative = true,
}: {
  className?: string;
  decorative?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={BRAND_LOGO.small}
      alt={decorative ? '' : BRAND_LOGO_ALT}
      aria-hidden={decorative || undefined}
      width={96}
      height={96}
      className={className}
      draggable={false}
    />
  );
}
