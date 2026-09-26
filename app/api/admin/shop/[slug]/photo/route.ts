import { z } from 'zod';
import { requireShopWrite } from '@/lib/guard';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { rateLimit } from '@/lib/rate-limit';
import { identifyFromPhoto } from '@/lib/photo-identify';
import { localNames } from '@/lib/transliterate';
import { normaliseItemName, normaliseUnit } from '@/lib/units';

type Context = { params: Promise<{ slug: string }> };

/** The browser resizes to ~1280px JPEG first; this is the backstop (≈1.5 MB of base64). */
const bodySchema = z.object({
  image: z
    .string()
    .max(2_000_000, 'Photo is too large')
    .regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/, 'That does not look like a photo'),
});

/**
 * Reads a packet photo and says what product it is. Writes nothing: the owner's
 * phone lists what comes back through the ordinary items route, so the plan
 * limit, duplicates and every other rule apply exactly as for typed items.
 *
 * `available: false` means this deployment has no model key, and the phone
 * should read the photo itself (the older in-browser OCR).
 */
export async function POST(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  const { slug } = await params;
  if (!(await requireShopWrite(slug))) return fail('Not authenticated', 401);

  // Each photo costs money. Generous for an owner photographing a shelf, and a
  // hard stop for anything scripted.
  const limit = rateLimit(`photo:${slug}`, 60, 10 * 60 * 1000);
  if (!limit.ok) return fail('Too many photos at once. Wait a minute and try again.', 429);

  const parsed = bodySchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  let products;
  try {
    products = await identifyFromPhoto(parsed.data.image.slice('data:image/jpeg;base64,'.length));
  } catch (error) {
    console.error('photo identify failed', error);
    // The phone falls back to its own reader rather than showing a dead end.
    return ok({ available: false });
  }
  if (products === null) return ok({ available: false });

  return ok({
    available: true,
    products: products.map((product) => {
      const name = normaliseItemName(product.name);
      const local = localNames(name);
      return {
        name,
        nameBn: local.bn,
        nameHi: local.hi,
        unit: product.unit ? normaliseUnit(product.unit) : '',
        category: product.category,
        confidence: product.confidence,
      };
    }),
  });
}
