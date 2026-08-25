import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { createOwnerToken, OWNER_COOKIE, OWNER_TTL_MS, sessionCookieOptions } from '@/lib/auth';
import { verifyOwnerPin } from '@/lib/password';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { ownerLoginSchema } from '@/lib/validators';

export const runtime = 'nodejs';

type Context = { params: Promise<{ slug: string }> };

export async function POST(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);

  const { slug } = await params;

  // Six digits is only a million codes, so the PIN leans on these limits far
  // more than the admin password does. Two buckets: one stops a single phone
  // guessing, the other caps total guesses against one shop no matter how many
  // addresses they come from.
  const perClient = rateLimit(`owner-login:${slug}:${clientIp(request)}`, 5, 15 * 60 * 1000);
  const perShop = rateLimit(`owner-login-shop:${slug}`, 30, 60 * 60 * 1000);
  if (!perClient.ok || !perShop.ok) {
    return fail('Too many attempts. Please wait and try again.', 429);
  }

  const parsed = ownerLoginSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  const shop = await prisma.shop.findUnique({
    where: { slug },
    select: { active: true, ownerPinHash: true, ownerPinSetAt: true },
  });

  // A missing shop still runs the PIN comparison below via the decoy hash, so
  // this endpoint cannot be used to enumerate which slugs exist.
  const matches = await verifyOwnerPin(parsed.data.pin, shop?.ownerPinHash ?? null);
  if (!shop || !shop.ownerPinSetAt || !matches) return fail('Incorrect PIN', 401);

  if (!shop.active) return fail('This shop is currently deactivated.', 403);

  const store = await cookies();
  store.set(
    OWNER_COOKIE,
    await createOwnerToken(slug, shop.ownerPinSetAt.getTime()),
    sessionCookieOptions(OWNER_TTL_MS / 1000),
  );

  return ok({ success: true });
}
