import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/guard';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { shopCreateSchema } from '@/lib/validators';
import { slugify, uniqueSlug } from '@/lib/slug';
import { TRIAL_DAYS } from '@/lib/plans';

export const runtime = 'nodejs';

/** POST /api/admin/shop — create a shop. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  if (!(await requireAdmin())) return fail('Not authenticated', 401);

  const parsed = shopCreateSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  // Everything the form collects. This used to destructure seven fields and
  // silently drop the rest, so the owner's name, their language, the shop's
  // state, its delivery setting and the demo flag were all accepted by the
  // validator and then thrown away — they only ever saved on a later edit.
  const {
    name,
    ownerName,
    locale,
    slug,
    type,
    phone,
    address,
    state,
    openTime,
    closeTime,
    deliveryEnabled,
    isDemo,
    upiId,
    active,
  } = parsed.data;

  const requestedSlug = slug ? slugify(slug) : '';
  if (requestedSlug) {
    const taken = await prisma.shop.findUnique({ where: { slug: requestedSlug }, select: { id: true } });
    if (taken) return fail('That slug is already used', 409, { slug: 'This slug is already taken' });
  }

  const finalSlug =
    requestedSlug ||
    (await uniqueSlug(name, async (candidate) =>
      Boolean(await prisma.shop.findUnique({ where: { slug: candidate }, select: { id: true } })),
    ));

  try {
    const shop = await prisma.shop.create({
      data: {
        name,
        ownerName,
        locale,
        slug: finalSlug,
        type,
        phone,
        address,
        state,
        openTime,
        closeTime,
        deliveryEnabled,
        isDemo,
        upiId,
        active,
        // The trial has to be stamped here, because nothing else ever stamps
        // it. The console promises "14 days of Pro" on this very screen, and
        // a shop created without it has a null `trialEndsAt` — which reads to
        // `entitlement()` as a subscription that ended before it began, and
        // locks the owner out of their own item list on day one.
        plan: 'PRO',
        subscriptionStatus: 'TRIALING',
        trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 86_400_000),
      },
      select: { id: true, slug: true, name: true },
    });
    return ok(shop, 201);
  } catch (error) {
    // Two admins creating the same slug at once still lands here.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return fail('That slug is already used', 409, { slug: 'This slug is already taken' });
    }
    throw error;
  }
}
