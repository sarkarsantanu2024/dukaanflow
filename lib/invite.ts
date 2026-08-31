import { createHash, randomBytes } from 'node:crypto';
import { BRAND_NAME } from './brand';

/**
 * One-time invite links.
 *
 * The Super Admin sends the owner a WhatsApp message with a link; opening it
 * signs them in and drops them straight into their shop. No PIN typing on the
 * first run — which is exactly where a shopkeeper who is not sure this is for
 * them gives up. The PIN stays, for coming back afterwards.
 *
 * The token is random, stored only as a SHA-256 hash, single use, and expires.
 * SHA-256 rather than bcrypt is deliberate and safe here: unlike a 6-digit PIN,
 * a 256-bit random token has nothing to brute-force, so the slow hash buys
 * nothing and would only make the link slower to open.
 */

/** A week is long enough for a shopkeeper to get around to it, short enough to matter. */
export const INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export function createInviteToken(): { token: string; hash: string; expiresAt: Date } {
  const token = randomBytes(32).toString('base64url');
  return {
    token,
    hash: hashInviteToken(token),
    expiresAt: new Date(Date.now() + INVITE_TTL_MS),
  };
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
