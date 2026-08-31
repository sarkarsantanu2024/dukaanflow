import { BRAND_LOGO, BRAND_NAME } from '@/lib/brand';
/**
 * Web app manifest for the shopkeeper's installed admin app.
 *
 * Served from the site root rather than under /admin for two reasons: the
 * middleware gate on /admin/* would redirect the browser's manifest fetch to
 * the login page (Chrome fetches it without credentials), and a manifest at the
 * root may declare any same-origin scope.
 *
 * The customer shop page deliberately links no manifest — a shopper scans a QR
 * and orders; there is nothing for them to install.
 */

export const runtime = 'nodejs';

const MANIFEST = {
  id: '/admin',
  name: `${BRAND_NAME} Admin`,
  short_name: BRAND_NAME,
  description: 'Manage shops, items and QR codes. Add items by voice.',
  start_url: '/admin',
  scope: '/admin',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#f1f5f9',
  theme_color: '#0b9057',
  categories: ['business', 'shopping'],
  icons: [
    { src: BRAND_LOGO.icon192, sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: BRAND_LOGO.icon512, sizes: '512x512', type: 'image/png', purpose: 'any' },
    // A maskable copy keeps the glyph inside Android's safe zone when the
    // launcher crops the icon to a circle or squircle.
    { src: BRAND_LOGO.maskable512, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
};

export function GET() {
  return new Response(JSON.stringify(MANIFEST), {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
