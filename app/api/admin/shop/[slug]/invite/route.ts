import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/guard';
import { fail, ok, sameOrigin } from '@/lib/http';
import { createInviteToken, inviteMessage } from '@/lib/invite';
import { generateOwnerPin, hashOwnerPin } from '@/lib/password';
import { baseUrl } from '@/lib/qr';
import { toWhatsAppNumber } from '@/lib/whatsapp';

export const runtime = 'nodejs';

type Context = { params: Promise<{ slug: string }> };

/**
 * Mints an invite link for this shop's owner and returns a ready-to-send
 * WhatsApp message.
 *
 * A PIN is issued at the same time when the shop has none, so the owner has a
 * way back in after the one-time link is spent — otherwise the first invite
 * would be the only way they could ever reach their shop.
 */
export async function POST(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  if (!(await requireAdmin())) return fail('Not authenticated', 401);

  const { slug } = await params;
  const shop = await prisma.shop.findUnique({
    where: { slug },
    select: { id: true, name: true, phone: true, ownerPinHash: true },
  });
  if (!shop) return fail('Shop not found', 404);

  const invite = createInviteToken();
  const pin = shop.ownerPinHash ? null : generateOwnerPin();

  await prisma.shop.update({
    where: { id: shop.id },
    data: {
      inviteTokenHash: invite.hash,
      inviteTokenExpiresAt: invite.expiresAt,
      ...(pin ? { ownerPinHash: await hashOwnerPin(pin), ownerPinSetAt: new Date() } : {}),
    },
  });

  const url = `${baseUrl()}/join/${invite.token}`;
  const message = inviteMessage(shop.name, url, pin);

  return ok({
    url,
    pin,
    message,
    // Opens WhatsApp with the message already typed, addressed to the shop's
    // own number — one tap for the Super Admin, nothing to copy or paste.
    whatsappUrl: `https://wa.me/${toWhatsAppNumber(shop.phone)}?text=${encodeURIComponent(message)}`,
    expiresAt: invite.expiresAt.toISOString(),
  });
}
