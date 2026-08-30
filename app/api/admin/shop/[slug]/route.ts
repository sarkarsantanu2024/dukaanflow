import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/guard';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { shopUpdateSchema } from '@/lib/validators';
import { slugify } from '@/lib/slug';

export const runtime = 'nodejs';

type Context = { params: Promise<{ slug: string }> };

/** PATCH /api/admin/shop/[slug] — update shop details. */
export async function PATCH(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  if (!(await requireAdmin())) return fail('Not authenticated', 401);

  const { slug } = await params;
  const shop = await prisma.shop.findUnique({ where: { slug }, select: { id: true } });
  if (!shop) return fail('Shop not found', 404);

  const parsed = shopUpdateSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  const data = { ...parsed.data };
  if (data.slug) {
    data.slug = slugify(data.slug);
    if (!data.slug) return fail('Invalid slug', 422, { slug: 'Invalid slug' });
  }

  try {
    const updated = await prisma.shop.update({
      where: { id: shop.id },
      data,
      select: { id: true, slug: true, name: true, active: true },
    });
    return ok(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return fail('That slug is already used', 409, { slug: 'This slug is already taken' });
    }
    throw error;
  }
}

/**
 * DELETE /api/admin/shop/[slug] — removes the shop and everything attached.
 *
 * One statement, because the database does the rest: every table that points at
 * a shop declares `onDelete: Cascade`, so this single delete takes Item, Order,
 * Sale, Payment, Customer, LedgerEntry, ItemPeriodStat, AreaPeriodStat and
 * PushSubscription with it — and LedgerEntry cascades a second time from
 * Customer, so no ledger line can outlive the person it belongs to.
 *
 * DOING IT IN THE DATABASE RATHER THAN IN CODE IS THE POINT. A hand-written
 * chain of `deleteMany` calls is a list somebody has to remember to add to, and
 * the failure mode is silent: a new table added a year from now would simply
 * keep its rows, leaving one deleted shop's customers and khata sitting in a
 * database nothing can reach them from. The constraint cannot be forgotten.
 *
 * `ItemPeriodStat` and `AreaPeriodStat` go too, and that is deliberate rather
 * than an oversight — they exist to outlive the retention purge, not to outlive
 * the shop itself.
 */
export async function DELETE(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  if (!(await requireAdmin())) return fail('Not authenticated', 401);

  const { slug } = await params;
  const shop = await prisma.shop.findUnique({ where: { slug }, select: { id: true } });
  if (!shop) return fail('Shop not found', 404);

  await prisma.shop.delete({ where: { id: shop.id } });
  return ok({ success: true });
}
