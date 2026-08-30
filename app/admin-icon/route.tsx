/**
 * Home-screen icons for the installed admin app, drawn on demand.
 *
 * Generating them beats committing PNGs: the brand colour stays in one place
 * and there is no binary asset to regenerate when it changes.
 */

import { ImageResponse } from 'next/og';
import { BRAND_GREEN, LOGO_SHAPES } from '@/lib/brand';

export const runtime = 'nodejs';

export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const requested = Number(params.get('size'));
  const size = Number.isFinite(requested) ? Math.min(Math.max(requested, 48), 1024) : 512;
  // Android crops maskable icons to a circle; keeping the glyph inside the
  // middle 80% guarantees nothing important is cut off.
  const maskable = params.get('maskable') === '1';
  const glyph = Math.round(size * (maskable ? 0.34 : 0.46));

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
        }}
      >
        {/* The mark in its own green on white, not white inside a green tile.
            The logo is the logo wherever it appears; a launcher icon is not a
            place to invert it. An opaque ground rather than transparency,
            because iOS composites a transparent icon onto black. */}
        <svg width={glyph} height={glyph} viewBox="0 0 24 24" fill={BRAND_GREEN}>
          {LOGO_SHAPES.map((shape) => (
            <path key={shape.d} d={shape.d} fillRule={shape.evenOdd ? 'evenodd' : undefined} />
          ))}
        </svg>
      </div>
    ),
    {
      width: size,
      height: size,
      headers: { 'Cache-Control': 'public, max-age=86400, immutable' },
    },
  );
}
