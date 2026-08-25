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
 * Opening it signs them in and sends them to their shop. The token is spent in
 * the same breath: a link forwarded to somebody else, or sitting in a chat
 * backup a year later, is worthless once it has been used.
 */
export async function GET(request: Request, { params }: Context) {
  const { token } = await params;

  const shop = await prisma.shop.findFirst({
    where: {
      inviteTokenHash: hashInviteToken(token),
      inviteTokenExpiresAt: { gt: new Date() },
    },
    select: { id: true, slug: true, active: true, ownerPinSetAt: true },
  });

  if (!shop || !shop.active || !shop.ownerPinSetAt) {
    return NextResponse.redirect(new URL('/join/expired', request.url));
  }

  await prisma.shop.update({
    where: { id: shop.id },
    data: { inviteTokenHash: null, inviteTokenExpiresAt: null },
  });

  const store = await cookies();
  store.set(
    OWNER_COOKIE,
    await createOwnerToken(shop.slug, shop.ownerPinSetAt.getTime()),
    sessionCookieOptions(OWNER_TTL_MS / 1000),
  );

  return NextResponse.redirect(new URL(`/owner/${shop.slug}/inventory?welcome=1`, request.url));
}
