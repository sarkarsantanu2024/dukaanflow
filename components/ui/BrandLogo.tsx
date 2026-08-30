/**
 * The DukaanFlow glyph — a D cut through on the diagonal.
 *
 * Takes the colour of whatever it sits in, and its holes show whatever is
 * behind. The paths live in `lib/brand.ts`, so the launcher icon and the
 * favicon draw exactly the shape the header does.
 */

import { LOGO_SHAPES } from '@/lib/brand';

export function BrandLogo({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      {LOGO_SHAPES.map((shape) => (
        <path key={shape.d} d={shape.d} fillRule={shape.evenOdd ? 'evenodd' : undefined} />
      ))}
    </svg>
  );
}
