/**
 * Session handling for the single Super Admin.
 *
 * Deliberately Web Crypto only — no `node:crypto`, no bcrypt — so that
 * `middleware.ts` can import it and run on the Edge runtime. Password
 * verification (bcrypt, Node-only) lives in `lib/password.ts` and is imported
 * exclusively by the login route handler.
 *
 * Cookie value: `<expiresAtMs>.<base64url hmac>`
 * The HMAC covers the expiry, so a client cannot extend its own session.
 */

export const SESSION_COOKIE = 'df_admin';
export const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

const SUBJECT = 'admin';

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
