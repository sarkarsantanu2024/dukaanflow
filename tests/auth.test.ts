import { beforeAll, describe, expect, it } from 'vitest';

/**
 * Session tokens: what the Edge can verify (signature, expiry) and what Node
 * then checks against the database (the version). Pure Web Crypto, no Prisma.
 */

process.env.COOKIE_SECRET = 'test-cookie-secret-that-is-long-enough';

type Auth = typeof import('@/lib/auth');
let auth: Auth;

beforeAll(async () => {
  auth = await import('@/lib/auth');
});

const HOUR = 60 * 60 * 1000;

describe('admin session token', () => {
  it('round-trips the credential version it was issued with', async () => {
    const token = await auth.createSessionToken(1_700_000_000_000);
    await expect(auth.readSessionToken(token)).resolves.toEqual({ credentialVersion: 1_700_000_000_000 });
    await expect(auth.verifySessionToken(token)).resolves.toBe(true);
  });

  it('issues a distinct token for the env-credential version 0', async () => {
    const token = await auth.createSessionToken(auth.ENV_CREDENTIAL_VERSION);
    await expect(auth.readSessionToken(token)).resolves.toEqual({ credentialVersion: 0 });
  });

  it('refuses a token whose version was edited — the signature covers it', async () => {
    const token = await auth.createSessionToken(100);
    const [expiresAt, , signature] = token.split('.');
    // Same expiry, same signature, a different version: must not verify.
    await expect(auth.readSessionToken(`${expiresAt}.101.${signature}`)).resolves.toBeNull();
  });

  it('refuses a token whose expiry was pushed forward', async () => {
    const token = await auth.createSessionToken(100);
    const [expiresAt, version, signature] = token.split('.');
    const later = Number(expiresAt) + HOUR;
    await expect(auth.readSessionToken(`${later}.${version}.${signature}`)).resolves.toBeNull();
  });

  it('refuses an expired token', async () => {
    const issuedLongAgo = Date.now() - auth.SESSION_TTL_MS - HOUR;
    const token = await auth.createSessionToken(100, issuedLongAgo);
    await expect(auth.readSessionToken(token)).resolves.toBeNull();
    await expect(auth.verifySessionToken(token)).resolves.toBe(false);
  });

  it('refuses the pre-version two-part format outright', async () => {
    const expiresAt = Date.now() + HOUR;
    await expect(auth.readSessionToken(`${expiresAt}.not-a-real-signature`)).resolves.toBeNull();
  });

  it('refuses garbage', async () => {
    for (const bad of [undefined, null, '', '.', '...', 'abc.def.ghi', `${Date.now() + HOUR}.NaN.sig`]) {
      await expect(auth.readSessionToken(bad)).resolves.toBeNull();
    }
  });
});

describe('owner session token', () => {
  it('round-trips slug and pinVersion', async () => {
    const token = await auth.createOwnerToken('ramu-grocery', 1_700_000_000_000);
    await expect(auth.readOwnerToken(token)).resolves.toEqual({
      slug: 'ramu-grocery',
      pinVersion: 1_700_000_000_000,
    });
  });

  it('cannot be repointed at another shop', async () => {
    const token = await auth.createOwnerToken('ramu-grocery', 1);
    const [expiresAt, , pinVersion, signature] = token.split('.');
    await expect(auth.readOwnerToken(`${expiresAt}.other-shop.${pinVersion}.${signature}`)).resolves.toBeNull();
  });

  it('cannot carry a forged pinVersion', async () => {
    const token = await auth.createOwnerToken('ramu-grocery', 1);
    const [expiresAt, slug, , signature] = token.split('.');
    await expect(auth.readOwnerToken(`${expiresAt}.${slug}.2.${signature}`)).resolves.toBeNull();
  });
});
