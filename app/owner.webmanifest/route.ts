import { prisma } from '@/lib/prisma';
import { BRAND_LOGO, BRAND_NAME } from '@/lib/brand';

/**
 * Per-shop manifest, so each owner installs an app that opens on their own
 * price list and carries their shop's name under the icon.
 *
 * Served from the root for the same reason as the admin one: Chrome fetches a
 * manifest without credentials, and anything under /owner is behind the PIN
 * gate. A shop name is public — it is printed on the QR poster — so answering
 * this unauthenticated gives nothing away.
 */

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get('slug') ?? '';
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return new Response('Not found', { status: 404 });
  }

  const shop = await prisma.shop.findUnique({ where: { slug }, select: { name: true } });
  if (!shop) return new Response('Not found', { status: 404 });

  const manifest = {
    id: `/owner/${slug}`,
    name: `${shop.name} — ${BRAND_NAME}`,
    short_name: shop.name.slice(0, 12),
    description: 'Update your prices and stock. Add items by voice.',
    start_url: `/owner/${slug}/sell`,
    // The trailing slash matters: without it, "ramu-grocery" would also scope
    // "ramu-grocery-2", and two shops on one phone would collide.
    scope: `/owner/${slug}/`,
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f1f5f9',
    theme_color: '#0b9057',
    icons: [
      { src: BRAND_LOGO.icon192, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: BRAND_LOGO.icon512, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: BRAND_LOGO.maskable512, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      // Explicit charset, or a Bengali shop name can reach the launcher as
      // mojibake on some Android builds.
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
