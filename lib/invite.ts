import { createHash, randomBytes } from 'node:crypto';
import { BRAND_NAME } from './brand';

/**
 * Owner invite links.
 *
 * The Super Admin sends the owner a WhatsApp message with a link; opening it
 * signs them in and drops them straight into their shop. No PIN typing on the
 * first run — which is exactly where a shopkeeper who is not sure this is for
 * them gives up. The PIN stays, for coming back afterwards.
 *
 * THE LINK DOES NOT EXPIRE AND MAY BE OPENED MORE THAN ONCE (changed on request):
 * a shopkeeper who taps it a week later, or on a second phone, still lands in
 * their shop. It is invalidated only by minting a fresh one, or by revoking the
 * owner's access. The trade this makes is deliberate — the link is now a
 * standing way into the shop, so it should be sent only to the owner, and
 * revoking access (which reissues the PIN) is what cuts a leaked one off.
 *
 * The token is random and stored only as a SHA-256 hash. SHA-256 rather than
 * bcrypt is safe here: unlike a 6-digit PIN, a 256-bit random token has nothing
 * to brute-force, so the slow hash buys nothing.
 */

export function createInviteToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashInviteToken(token) };
}

export function hashInviteToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** The message the Super Admin sends. Written to be read on a phone, by a shopkeeper. */
export function inviteMessage(shopName: string, url: string, pin: string | null): string {
  const lines = [
    `${shopName} — your ${BRAND_NAME} shop is ready.`,
    '',
    `Open this link on your phone: ${url}`,
    '',
    'It opens your shop app. Add your items by speaking — in Bengali, Hindi or English.',
  ];
  if (pin) {
    lines.push('', `If it ever asks for a PIN, it is ${pin}.`);
  }
  return lines.join('\n');
}
