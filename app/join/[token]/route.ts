import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createOwnerToken, OWNER_COOKIE, OWNER_TTL_MS, sessionCookieOptions } from '@/lib/auth';
import { hashInviteToken } from '@/lib/invite';

export const runtime = 'nodejs';

type Context = { params: Promise<{ token: string }> };

/**
 * The link the owner receives on WhatsApp.
 *
 * A route handler rather than a page, because signing them in means setting a
 * cookie and Next only allows that outside of rendering.
 *
 * Opening it signs them in and sends them to their shop. THE TOKEN IS NOT SPENT
 * (changed on request): the same link opens the shop again a week later or on a
 * second phone, and it does not expire. It stops working only when a fresh link
 * is minted or the owner's access is revoked.
 */
export async function GET(request: Request, { params }: Context) {
  const { token } = await params;

  const shop = await prisma.shop.findFirst({
    where: { inviteTokenHash: hashInviteToken(token) },
    select: { id: true, slug: true, active: true, ownerPinSetAt: true },
  });

  if (!shop || !shop.active || !shop.ownerPinSetAt) {
    return NextResponse.redirect(new URL('/join/expired', request.url));
  }

  const store = await cookies();
  store.set(
    OWNER_COOKIE,
    await createOwnerToken(shop.slug, shop.ownerPinSetAt.getTime()),
    sessionCookieOptions(OWNER_TTL_MS / 1000),
  );

  return NextResponse.redirect(new URL(`/owner/${shop.slug}/inventory?welcome=1`, request.url));
}
