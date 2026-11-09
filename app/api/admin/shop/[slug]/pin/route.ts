import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/guard';
import { fail, ok, sameOrigin } from '@/lib/http';
import { generateOwnerPin, hashOwnerPin } from '@/lib/password';

export const runtime = 'nodejs';

type Context = { params: Promise<{ slug: string }> };

/**
 * Issues this shop's owner PIN. Super Admin only — an owner cannot mint or
 * rotate their own access.
 *
 * The plaintext PIN is returned exactly once, in this response, and only the
 * bcrypt hash is stored. There is no "show PIN again": a lost PIN is reissued,
 * which is also what you want when a phone goes missing.
 *
 * Reissuing also retires the WhatsApp invite link. The link signs in without a
 * PIN, so leaving it alive would let a lost phone (which still has the chat)
 * walk straight back in with the new PIN's session. Send a fresh invite if the
 * owner wants a one-tap link again.
 */
export async function POST(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  if (!(await requireAdmin())) return fail('Not authenticated', 401);

  const { slug } = await params;
  const pin = generateOwnerPin();

  const updated = await prisma.shop.updateMany({
    where: { slug },
    data: {
      ownerPinHash: await hashOwnerPin(pin),
      ownerPinSetAt: new Date(),
      inviteTokenHash: null,
      inviteTokenExpiresAt: null,
    },
  });
  if (updated.count === 0) return fail('Shop not found', 404);

  return ok({ pin });
}

/** Revokes owner access. Existing sessions keep working until they expire. */
export async function DELETE(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  if (!(await requireAdmin())) return fail('Not authenticated', 401);

  const { slug } = await params;
  const updated = await prisma.shop.updateMany({
    where: { slug },
    data: { ownerPinHash: null, ownerPinSetAt: null, inviteTokenHash: null, inviteTokenExpiresAt: null },
  });
  if (updated.count === 0) return fail('Shop not found', 404);

  return ok({ success: true });
}
