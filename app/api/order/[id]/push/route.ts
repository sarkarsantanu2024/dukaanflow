import { prisma } from '@/lib/prisma';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { pushConfigured } from '@/lib/push';
import { pushSubscribeSchema } from '@/lib/validators';

export const runtime = 'nodejs';

type Context = { params: Promise<{ id: string }> };

/**
 * POST — this customer's phone would like to be told what happens to this order.
 *
 * THE ORDER ID IS THE AUTHORISATION, and that is deliberate. A customer has no
 * account and never will: asking somebody to register before a kirana can tell
 * them their rice is ready would cost more orders than the whole feature is
 * worth. What they do have is the id of the order they just placed, which is a
 * random uuid nobody else can guess and which nothing else on the site will
 * reveal.
 *
 * So the shop and the phone number are taken FROM the order rather than from
 * the request. A caller who somehow holds an order id can subscribe to that one
 * order's customer — which is the same person, because that is where the id
 * came from — and cannot reach anybody else's.
 */
export async function POST(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);

  // The id is unguessable, so this is not really a defence against enumeration
  // — it is a defence against a loop with a bug in it filling the table.
  const limit = rateLimit(`push:${clientIp(request)}`, 20, 5 * 60 * 1000);
  if (!limit.ok) return fail('Please wait a moment and try again.', 429);

  if (!pushConfigured()) return fail('Notifications are not switched on for this site', 503);

  const { id } = await params;
  const parsed = pushSubscribeSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  const order = await prisma.order.findUnique({
    where: { id },
    select: { shopId: true, customerPhone: true },
  });
  if (!order) return fail('Order not found', 404);

  const { endpoint, keys } = parsed.data;

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: {
      shopId: order.shopId,
      role: 'CUSTOMER',
      customerPhone: order.customerPhone,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
    // A phone is one household's, and households order from more than one shop.
    // Re-subscribing repoints the device at whichever order was placed last,
    // which is the one they are waiting on.
    update: {
      shopId: order.shopId,
      role: 'CUSTOMER',
      customerPhone: order.customerPhone,
      p256dh: keys.p256dh,
      auth: keys.auth,
      lastSeenAt: new Date(),
    },
  });

  return ok({ success: true });
}
