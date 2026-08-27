import { prisma } from '@/lib/prisma';
import { requireShopWrite } from '@/lib/guard';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { identifySchema } from '@/lib/validators';
import { identifyItem } from '@/lib/identify';

export const runtime = 'nodejs';

type Context = { params: Promise<{ slug: string }> };

/**
 * POST — read an item's name off a photograph.
 *
 * The photo arrives, is read, and is dropped. Nothing is written: the response
 * is a suggestion for the add-item form, and the owner still has to agree to it
 * and supply the price. That is the point — a picture is an input method here,
 * the same as speech, not something the product keeps.
 */
export async function POST(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  const { slug } = await params;
  if (!(await requireShopWrite(slug))) return fail('Not authenticated', 401);

  // Every call costs money and takes a second of someone's time. 30 photos in
  // 10 minutes is a generous listing session and a poor way to run up a bill.
  const limit = rateLimit(`identify:${clientIp(request)}`, 30, 10 * 60 * 1000);
  if (!limit.ok) {
    return fail(`Too many photos. Please wait ${limit.retryAfterSeconds}s.`, 429);
  }

  const shop = await prisma.shop.findUnique({ where: { slug }, select: { id: true } });
  if (!shop) return fail('Shop not found', 404);

  const parsed = identifySchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  // The shop's own categories, so a recognised item lands in the list the
  // owner already keeps rather than starting a fourteenth name for "Staples".
  const rows = await prisma.item.findMany({
    where: { shopId: shop.id, NOT: { category: '' } },
    distinct: ['category'],
    select: { category: true },
    take: 30,
  });

  const result = await identifyItem(parsed.data.imageData, rows.map((row) => row.category));

  if (!result.ok) {
    const message =
      result.reason === 'unconfigured'
        ? 'Photo listing is not switched on yet.'
        : result.reason === 'not-an-item'
          ? 'Could not tell what that is. Try a closer photo, or type the name.'
          : 'Could not read that photo. Try again, or type the name.';
    return fail(message, result.reason === 'unconfigured' ? 503 : 422);
  }

  return ok({ item: result.item });
}
