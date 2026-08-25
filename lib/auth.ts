/**
 * Session handling for the two kinds of sign-in: the single Super Admin, who
 * can touch every shop, and a shop owner, who can touch exactly one.
 *
 * Deliberately Web Crypto only — no `node:crypto`, no bcrypt — so that
 * `middleware.ts` can import it and run on the Edge runtime. Password and PIN
 * verification (bcrypt, Node-only) lives in `lib/password.ts` and is imported
 * exclusively by the login route handlers.
 *
 * Admin cookie: `<expiresAtMs>.<base64url hmac>`
 * Owner cookie: `<expiresAtMs>.<slug>.<base64url hmac>`
 * The HMAC covers the expiry — and, for an owner, the slug — so a client can
 * neither extend its own session nor repoint it at another shop.
 */

export const SESSION_COOKIE = 'df_admin';
export const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

export const OWNER_COOKIE = 'df_owner';
// Far longer than the admin's 12 hours: a shopkeeper updates prices from the
// counter between customers, and a login screen every morning is the kind of
// friction that gets a tool abandoned. The blast radius is one shop's item
// list, and the Super Admin can revoke the PIN at any time.
export const OWNER_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

const SUBJECT = 'admin';
const OWNER_SUBJECT = 'owner';

function secret(): string {
  const value = process.env.COOKIE_SECRET;
  if (!value || value.length < 16) {
    throw new Error('COOKIE_SECRET is missing or too short (need 16+ characters)');
  }
  return value;
}

function toBase64Url(bytes: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return toBase64Url(signature);
}

/** Constant-time string compare — avoids leaking the signature byte by byte. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken(now = Date.now()): Promise<string> {
  const expiresAt = now + SESSION_TTL_MS;
  const payload = `${SUBJECT}.${expiresAt}`;
  return `${expiresAt}.${await sign(payload)}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const separator = token.indexOf('.');
  if (separator < 1) return false;

  const expiresAtRaw = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

  try {
    return timingSafeEqual(signature, await sign(`${SUBJECT}.${expiresAt}`));
  } catch {
    return false;
  }
}

export type OwnerSession = {
  slug: string;
  /** `ownerPinSetAt` when the session began, as epoch ms. */
  pinVersion: number;
};

/**
 * `pinVersion` is what makes revocation real. The token is self-contained and
 * lives 30 days, so without it, clearing a shop's PIN would leave every phone
 * already holding a session signed in for a month. Node-side callers compare
 * it against the shop's current `ownerPinSetAt`; reissuing or revoking the PIN
 * moves that value and every older token stops authorising anything.
 */
export async function createOwnerToken(
  slug: string,
  pinVersion: number,
  now = Date.now(),
): Promise<string> {
  const expiresAt = now + OWNER_TTL_MS;
  const signature = await sign(`${OWNER_SUBJECT}.${slug}.${pinVersion}.${expiresAt}`);
  return `${expiresAt}.${slug}.${pinVersion}.${signature}`;
}

/**
 * Verifies the signature and expiry only. The caller must still check the slug
 * against the shop being acted on — a valid token for shop A is never
 * authorisation for shop B — and, wherever a database is available, check
 * `pinVersion` against the shop's current one.
 */
export async function readOwnerToken(
  token: string | undefined | null,
): Promise<OwnerSession | null> {
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 4) return null;

  const [expiresAtRaw, slug, pinVersionRaw, signature] = parts as [string, string, string, string];
  const expiresAt = Number(expiresAtRaw);
  const pinVersion = Number(pinVersionRaw);
  if (!slug || !Number.isFinite(expiresAt) || !Number.isFinite(pinVersion)) return null;
  if (expiresAt < Date.now()) return null;

  try {
    const expected = await sign(`${OWNER_SUBJECT}.${slug}.${pinVersion}.${expiresAt}`);
    return timingSafeEqual(signature, expected) ? { slug, pinVersion } : null;
  } catch {
    return null;
  }
}

/** Cookie attributes shared by the login and logout routes. */
export function sessionCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}
