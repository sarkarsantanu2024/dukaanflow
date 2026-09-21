import { prisma } from '@/lib/prisma';
import { BRAND_GREEN, BRAND_GROUND, BRAND_LOGO, BRAND_NAME } from '@/lib/brand';

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
    // THE INSTALLED APP OPENS ON THE DAY, NOT ON THE TILL. It used to launch
    // straight into `/sell`, which answers "I am serving someone right now" —
    // true perhaps twice an hour, and wrong every other time the icon is
    // tapped. An owner opening their shop's app in the morning is asking what
    // is waiting: orders, low stock, who owes. That is `/owner/<slug>`, and the
    // till is one tap away on the tab bar for the times it is the answer.
    // THE TRAILING SLASH IS LOAD-BEARING. A start_url must sit inside `scope`,
    // and scope keeps its slash for the sibling-slug reason below — so bare
    // `/owner/<slug>` is, by strict prefix matching, outside its own app's
    // scope. Next then 308s this to the slashless form, which costs one hop at
    // a cold launch and is the price of the two rules agreeing.
    start_url: `/owner/${slug}/`,
    // The trailing slash matters: without it, "ramu-grocery" would also scope
    // "ramu-grocery-2", and two shops on one phone would collide.
    scope: `/owner/${slug}/`,
    display: 'standalone',
    orientation: 'portrait',
    background_color: BRAND_GROUND,
    theme_color: BRAND_GREEN,
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
