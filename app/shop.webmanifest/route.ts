import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

/**
 * Per-shop manifest for the CUSTOMER's installed shop.
 *
 * WHY IT EXISTS. A QR on a counter is scanned once. Everything after that first
 * scan — ordering from home, ordering next week, ordering from the bus — needs
 * a way back that is not the sticker in the shop. This is the strongest one
 * available without asking a customer to register: the shop's own icon, with
 * the shop's own name under it, on the home screen.
 *
 * Served from the root like the owner's, and for the same reason: Chrome
 * fetches a manifest without credentials. Nothing here is private — a shop's
 * name is printed on its poster.
 *
 * `id` and `start_url` are per shop so two shops installed on one phone are two
 * icons, not one that opens whichever was installed last. `scope` has no
 * trailing slash on purpose: the storefront lives at `/shop/<slug>` exactly,
 * and `/shop/<slug>/` would not contain the page the icon opens.
 */
export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get('slug') ?? '';
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return new Response('Not found', { status: 404 });
  }

  const shop = await prisma.shop.findUnique({
    where: { slug },
    select: { name: true, active: true },
  });
  if (!shop) return new Response('Not found', { status: 404 });

  const manifest = {
    id: `/shop/${slug}`,
    name: shop.name,
    short_name: shop.name.slice(0, 12),
    description: `Order from ${shop.name}`,
    start_url: `/shop/${slug}`,
    scope: `/shop/${slug}`,
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f1f5f9',
    theme_color: '#0b9057',
    icons: [
      { src: '/admin-icon?size=192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/admin-icon?size=512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/admin-icon?size=512&maskable=1', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      // Explicit charset, or a Bengali shop name reaches the launcher as
      // mojibake on some Android builds.
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
