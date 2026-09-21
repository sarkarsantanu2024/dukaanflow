import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/guard';
import { fail, ok, sameOrigin } from '@/lib/http';
import { createInviteToken, inviteMessage } from '@/lib/invite';
import { generateOwnerPin, hashOwnerPin } from '@/lib/password';
import { baseUrl } from '@/lib/qr';
import { toWhatsAppNumber } from '@/lib/whatsapp';
import type { Locale } from '@/lib/i18n';

export const runtime = 'nodejs';

type Context = { params: Promise<{ slug: string }> };

/**
 * Mints an invite link for this shop's owner and returns a ready-to-send
 * WhatsApp message, in the shop's own language.
 *
 * A FRESH PIN IS ISSUED WITH EVERY INVITE and included in the message, so the
 * link always arrives with the way to come back — not left in a hash nobody can
 * read. Re-sending an invite therefore rolls the PIN: the newest link and PIN
 * are the live ones, and any old ones stop working, which is the right outcome
 * for a "here is your access" message.
 */
export async function POST(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  if (!(await requireAdmin())) return fail('Not authenticated', 401);

  const { slug } = await params;
  const shop = await prisma.shop.findUnique({
    where: { slug },
    select: { id: true, name: true, phone: true, locale: true },
  });
  if (!shop) return fail('Shop not found', 404);

  const invite = createInviteToken();
  const pin = generateOwnerPin();

  await prisma.shop.update({
    where: { id: shop.id },
    data: {
      inviteTokenHash: invite.hash,
      // No expiry — the link stays valid until a fresh one replaces it. See
      // `lib/invite.ts`.
      inviteTokenExpiresAt: null,
      ownerPinHash: await hashOwnerPin(pin),
      ownerPinSetAt: new Date(),
    },
  });

  const url = `${baseUrl()}/join/${invite.token}`;
  const message = inviteMessage(shop.name, url, pin, shop.locale as Locale);

  return ok({
    url,
    pin,
    message,
    // Opens WhatsApp with the message already typed, addressed to the shop's
    // own number — one tap for the Super Admin, nothing to copy or paste.
    whatsappUrl: `https://wa.me/${toWhatsAppNumber(shop.phone)}?text=${encodeURIComponent(message)}`,
  });
}
