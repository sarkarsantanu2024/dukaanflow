import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/guard';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { shopImagesSchema } from '@/lib/validators';

export const runtime = 'nodejs';

type Context = { params: Promise<{ slug: string }> };

/**
 * Storefront and owner photos.
 *
 * Kept off the main shop PATCH because the payloads are two orders of magnitude
 * larger than the rest of a shop's fields, and a slow photo upload should never
 * be able to fail a rename. An empty string clears a photo.
 */
export async function PATCH(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  if (!(await requireAdmin())) return fail('Not authenticated', 401);

  const { slug } = await params;
  const shop = await prisma.shop.findUnique({ where: { slug }, select: { id: true } });
  if (!shop) return fail('Shop not found', 404);

  const parsed = shopImagesSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  const { imageData, ownerImageData } = parsed.data;
  if (imageData === undefined && ownerImageData === undefined) {
    return fail('Nothing to update', 400);
  }

  await prisma.shop.update({
    where: { id: shop.id },
    data: {
      ...(imageData === undefined ? {} : { imageData }),
      ...(ownerImageData === undefined ? {} : { ownerImageData }),
    },
  });

  return ok({ success: true });
}
