import { prisma } from '@/lib/prisma';
import { requireShopWrite } from '@/lib/guard';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { z } from 'zod';

export const runtime = 'nodejs';

const schema = z.object({ locale: z.enum(['en', 'bn', 'hi']) });

type Context = { params: Promise<{ slug: string }> };

/**
 * The owner's app language, stored on the shop rather than in the browser so
 * it follows them to whichever phone they sign in from — a shopkeeper who
 * switches handsets should not have to find the language switch again.
 */
export async function POST(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  const { slug } = await params;
  if (!(await requireShopWrite(slug))) return fail('Not authenticated', 401);

  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  const updated = await prisma.shop.updateMany({
    where: { slug },
    data: { locale: parsed.data.locale },
  });
  if (updated.count === 0) return fail('Shop not found', 404);

  return ok({ success: true });
}
