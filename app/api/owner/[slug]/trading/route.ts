import { prisma } from '@/lib/prisma';
import { requireShopWrite } from '@/lib/guard';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { tradingTermsSchema } from '@/lib/validators';
import { openedToday, openingCashRequired } from '@/lib/cash-day';

export const runtime = 'nodejs';

type Context = { params: Promise<{ slug: string }> };

/**
 * PATCH — whether the shop is open right now.
 *
 * On `requireShopWrite` for the same reason the notice and the delivery terms
 * are: these change with the day, not with the shop's identity. An owner
 * shutting for a family function at nine in the morning is not going to ring
 * the operator first, and a shutter they cannot reach is a shutter that stays
 * up while the shop is empty.
 *
 * `ownerClosed` IS NOT `active`. The console's `active` is how a shop is paused
 * for non-payment or suspension, and an owner must never be able to undo that
 * from their own phone — which is exactly what sharing one column would hand
 * them. The storefront closes on either and reopens only when both agree.
 */
export async function PATCH(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  const { slug } = await params;
  if (!(await requireShopWrite(slug))) return fail('Not authenticated', 401);

  const parsed = tradingTermsSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  const shop = await prisma.shop.findUnique({ where: { slug }, select: { id: true } });
  if (!shop) return fail('Shop not found', 404);

  // OPENING needs today's cash; closing never does — a shop must always be able
  // to shut. See `lib/cash-day.ts`.
  if (!parsed.data.ownerClosed && !(await openedToday(shop.id))) return openingCashRequired();

  await prisma.shop.update({
    where: { id: shop.id },
    data: { ownerClosed: parsed.data.ownerClosed },
  });

  // Orders already placed are untouched. A shop that shuts at four still owes
  // the customers whose orders it took at three.
  return ok({ success: true });
}
