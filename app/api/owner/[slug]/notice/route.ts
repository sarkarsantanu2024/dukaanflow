import { prisma } from '@/lib/prisma';
import { requireShopWrite } from '@/lib/guard';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { shopNoticeSchema } from '@/lib/validators';
import { dateColumnValue } from '@/lib/notice';

export const runtime = 'nodejs';

type Context = { params: Promise<{ slug: string }> };

/**
 * PATCH — the notice the shopkeeper wants their customers to read, and when.
 *
 * On `requireShopWrite` rather than `requireAdmin`, unlike every other shop
 * setting. The rest of them — the WhatsApp number, the slug, the plan, the
 * hours — are the operator's business. What a shop tells its own customers this
 * week is not, and it changes far too often to be worth a phone call: "no
 * delivery Thursday", "puja orders close Friday", "back from the village on the
 * 5th". Routed through the operator, it would simply never be written.
 */
export async function PATCH(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  const { slug } = await params;
  if (!(await requireShopWrite(slug))) return fail('Not authenticated', 401);

  const parsed = shopNoticeSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  const { noticeText, noticeFrom, noticeTo } = parsed.data;

  const result = await prisma.shop.updateMany({
    where: { slug },
    data: {
      noticeText,
      // Clearing a date is a real edit, so blank writes null rather than being
      // skipped — a notice whose end date cannot be removed is one that ends
      // whether the owner wants it to or not.
      noticeFrom: dateColumnValue(noticeFrom),
      noticeTo: dateColumnValue(noticeTo),
    },
  });
  if (result.count === 0) return fail('Shop not found', 404);

  return ok({ success: true });
}
