import { prisma } from '@/lib/prisma';
import { requireShopWrite } from '@/lib/guard';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { cashDaySchema } from '@/lib/validators';
import { formatIsoDay } from '@/lib/time';

export const runtime = 'nodejs';

type Context = { params: Promise<{ slug: string }> };

/**
 * POST — the day's cash drawer: what it opened with, what was counted in it.
 *
 * THE OPENING FLOAT CANNOT BE DERIVED. A shop starts the morning with change
 * already in the drawer so the first five-hundred note can be broken, and no
 * amount of reading sales will ever say how much. It is typed once, before the
 * shutter goes up, and it is the number that makes "what should be in the
 * drawer" answerable at all.
 *
 * Deliberately NOT gated on the subscription, for the same reason the khata is
 * not: this is the shopkeeper's own cash, recorded in what is effectively their
 * notebook, and locking them out of counting their own drawer over a late
 * payment would be indefensible.
 *
 * The day is decided HERE, from the shop's own clock, and never taken from the
 * request. A client that could name the day could post this morning's float
 * onto last Tuesday, and the one thing a reconciliation must be is anchored.
 */
export async function POST(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  const { slug } = await params;
  if (!(await requireShopWrite(slug))) return fail('Not authenticated', 401);

  const shop = await prisma.shop.findUnique({ where: { slug }, select: { id: true } });
  if (!shop) return fail('Shop not found', 404);

  const parsed = cashDaySchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  const { openingPaise, countedPaise } = parsed.data;
  if (openingPaise === undefined && countedPaise === undefined) {
    return fail('Nothing to record', 400);
  }

  const day = formatIsoDay(new Date());

  /**
   * Upsert on the day, updating only what was sent.
   *
   * The two figures are typed twelve hours apart — the float in the morning,
   * the count at night — so a request carrying one must leave the other alone.
   * Spreading `parsed.data` would write `undefined` over the morning's float
   * when the evening's count arrives.
   */
  const record = await prisma.cashDay.upsert({
    where: { shopId_day: { shopId: shop.id, day } },
    create: {
      shopId: shop.id,
      day,
      openingPaise: openingPaise ?? 0,
      countedPaise: countedPaise ?? null,
    },
    update: {
      ...(openingPaise === undefined ? {} : { openingPaise }),
      ...(countedPaise === undefined ? {} : { countedPaise }),
    },
    select: { day: true, openingPaise: true, countedPaise: true },
  });

  return ok(record);
}
