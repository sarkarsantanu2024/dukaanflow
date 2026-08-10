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

/** DELETE /api/admin/shop/[slug] — removes the shop, its items and its orders. */
export async function DELETE(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  if (!(await requireAdmin())) return fail('Not authenticated', 401);

  const { slug } = await params;
  const shop = await prisma.shop.findUnique({ where: { slug }, select: { id: true } });
  if (!shop) return fail('Shop not found', 404);

  await prisma.shop.delete({ where: { id: shop.id } });
  return ok({ success: true });
}
