/**
 * The icon iOS uses when a shop page is added to a home screen.
 *
 * Safari ignores `icon.svg` for that and looks for an apple-touch-icon, so a
 * shopper who saves their kirana's page would otherwise get a screenshot of the
 * page as its icon. Drawn from the same paths as everything else, and squared
 * off rather than rounded because iOS applies its own mask.
 */

import { ImageResponse } from 'next/og';
import { BRAND_GREEN, LOGO_SHAPES } from '@/lib/brand';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
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
        <svg width={110} height={110} viewBox="0 0 24 24" fill={BRAND_GREEN}>
          {LOGO_SHAPES.map((shape) => (
            <path key={shape.d} d={shape.d} fillRule={shape.evenOdd ? 'evenodd' : undefined} />
          ))}
        </svg>
      </div>
    ),
    size,
  );
}
