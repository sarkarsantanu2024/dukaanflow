import { prisma } from '@/lib/prisma';
import { requireShopWrite } from '@/lib/guard';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { pushConfigured } from '@/lib/push';
import { pushSubscribeSchema, pushUnsubscribeSchema } from '@/lib/validators';

export const runtime = 'nodejs';

type Context = { params: Promise<{ slug: string }> };

/**
 * POST — this phone would like a sound when an order arrives.
 *
 * One row per device, keyed on the endpoint, so a shopkeeper who taps the
 * button again after reinstalling replaces their old subscription instead of
 * collecting a second one. `upsert` also refreshes the keys, which a browser
 * may rotate on its own.
 */
export async function POST(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  const { slug } = await params;
  if (!(await requireShopWrite(slug))) return fail('Not authenticated', 401);

  // Said plainly rather than silently accepted. A shopkeeper who has just
  // granted notification permission and gets a cheerful "done" from a
  // deployment with no VAPID keys would wait all day for a sound that was never
  // going to come.
  if (!pushConfigured()) return fail('Notifications are not switched on for this site', 503);

  const parsed = pushSubscribeSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  const shop = await prisma.shop.findUnique({ where: { slug }, select: { id: true } });
  if (!shop) return fail('Shop not found', 404);

  const { endpoint, keys } = parsed.data;

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: {
      shopId: shop.id,
      role: 'OWNER',
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
    // The shop too: a phone that was once an owner's device for one shop and is
    // now signed into another must not keep hearing the first shop's orders.
    update: {
      shopId: shop.id,
      role: 'OWNER',
      customerPhone: '',
      p256dh: keys.p256dh,
      auth: keys.auth,
      lastSeenAt: new Date(),
    },
  });

  return ok({ success: true });
}

/** DELETE — the owner turned the sound off. The row goes, not a flag on it. */
export async function DELETE(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  const { slug } = await params;
  if (!(await requireShopWrite(slug))) return fail('Not authenticated', 401);

  const parsed = pushUnsubscribeSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  const shop = await prisma.shop.findUnique({ where: { slug }, select: { id: true } });
  if (!shop) return fail('Shop not found', 404);

  // Scoped by shop as well as endpoint, so one shop's owner can never delete
  // another's subscription by quoting its endpoint.
  await prisma.pushSubscription.deleteMany({
    where: { endpoint: parsed.data.endpoint, shopId: shop.id },
  });

  return ok({ success: true });
}
