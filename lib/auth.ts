/**
 * Session handling for the two kinds of sign-in: the single Super Admin, who
 * can touch every shop, and a shop owner, who can touch exactly one.
 *
 * Deliberately Web Crypto only — no `node:crypto`, no bcrypt — so that
 * `middleware.ts` can import it and run on the Edge runtime. Password and PIN
 * verification (bcrypt, Node-only) lives in `lib/password.ts` and is imported
 * exclusively by the login route handlers.
 *
 * Admin cookie: `<expiresAtMs>.<credentialVersion>.<base64url hmac>`
 * Owner cookie: `<expiresAtMs>.<slug>.<pinVersion>.<base64url hmac>`
 * The HMAC covers the expiry — and the slug, and the version — so a client can
 * neither extend its own session nor repoint it at another shop.
 *
 * Both tokens carry a VERSION of the credential they were issued against, and
 * that is what makes revocation real for a self-contained token. The admin's is
 * `AdminCredential.updatedAt` (or `ENV_CREDENTIAL_VERSION` while the sign-in
 * still comes from the environment); changing the password moves it, and
 * `requireAdmin()` on Node refuses every token carrying the old one. Before
 * this, a changed password left every existing admin session — the lost laptop
 * the change was made for — valid for the rest of its twelve hours.
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

/**
 * The credential version a session carries while the admin sign-in still comes
 * from `ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH`. The first saved password moves
 * the version to the row's `updatedAt`, so sessions issued against the env pair
 * stop working the moment a real password exists — which is the point.
 */
export const ENV_CREDENTIAL_VERSION = 0;

export type AdminSession = {
  /** `AdminCredential.updatedAt` (epoch ms) when the session began, or 0. */
  credentialVersion: number;
};

export async function createSessionToken(
  credentialVersion: number,
  now = Date.now(),
): Promise<string> {
  const expiresAt = now + SESSION_TTL_MS;
  const payload = `${SUBJECT}.${credentialVersion}.${expiresAt}`;
  return `${expiresAt}.${credentialVersion}.${await sign(payload)}`;
}

/**
 * Signature and expiry only — safe on the Edge, where there is no database.
 * Whether the credential behind the session is still the current one is
 * checked in `lib/guard.ts`, on Node, which is where every write is authorised.
 */
export async function readSessionToken(
  token: string | undefined | null,
): Promise<AdminSession | null> {
  if (!token) return null;

  const parts = token.split('.');
  // Tokens from before the version was added have two parts. They are simply
  // invalid now: one forced sign-in on deploy is the cost of being able to
  // revoke, and it is paid once.
  if (parts.length !== 3) return null;

  const [expiresAtRaw, versionRaw, signature] = parts as [string, string, string];
  const expiresAt = Number(expiresAtRaw);
  const credentialVersion = Number(versionRaw);
  if (!Number.isFinite(expiresAt) || !Number.isFinite(credentialVersion)) return null;
  if (expiresAt < Date.now()) return null;

  try {
    const expected = await sign(`${SUBJECT}.${credentialVersion}.${expiresAt}`);
    return timingSafeEqual(signature, expected) ? { credentialVersion } : null;
  } catch {
    return null;
  }
}

/** Convenience for the Edge gate: is this a well-formed, unexpired admin token? */
export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  return (await readSessionToken(token)) !== null;
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
