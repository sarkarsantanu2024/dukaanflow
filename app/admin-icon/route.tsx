/**
 * Home-screen icons for the installed admin app, drawn on demand.
 *
 * Generating them beats committing PNGs: the brand colour stays in one place
 * and there is no binary asset to regenerate when it changes.
 */

import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';

const BRAND = '#0b9057';

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
          background: BRAND,
          color: 'white',
          fontSize: glyph,
          fontWeight: 700,
          letterSpacing: -glyph * 0.04,
        }}
      >
        DF
      </div>
    ),
    {
      width: size,
      height: size,
      headers: { 'Cache-Control': 'public, max-age=86400, immutable' },
    },
  );
}
