import { cookies } from 'next/headers';
import { OWNER_COOKIE, readOwnerToken, readSessionToken, SESSION_COOKIE } from './auth';
import { currentAdminCredentials } from './password';
import { prisma } from './prisma';

/**
 * Route-handler side auth checks. Middleware already gates these paths, but
 * every mutating handler re-checks: a matcher typo should not become an open
 * write endpoint.
 */

/**
 * Is the caller the Super Admin, holding a session issued against the CURRENT
 * credentials?
 *
 * Middleware has already checked signature and expiry on the Edge. This adds
 * the one thing the Edge cannot: a read of `AdminCredential` to compare the
 * token's `credentialVersion` with the row's `updatedAt`. Changing the password
 * moves that value, so every session issued before the change — the browser on
 * the laptop that went missing — is refused here, on the next write. The
 * version is exactly the same mechanism `currentOwnerSlug` uses for PINs.
 *
 * Fails closed: if the credentials cannot be read, nobody is the admin.
 */
export async function requireAdmin(): Promise<boolean> {
  const store = await cookies();
  const session = await readSessionToken(store.get(SESSION_COOKIE)?.value);
  if (!session) return false;

  const stored = await currentAdminCredentials();
  if (!stored) return false;
  return stored.version === session.credentialVersion;
}

/**
 * The signed-in shop owner's slug, if the session is still current.
 *
 * Unlike middleware — which runs on the Edge with no database and can only
 * check the signature — this reads the shop back and compares the token's
 * `pinVersion` against `ownerPinSetAt`. Revoking or reissuing a PIN therefore
 * invalidates every session that was already out there, which is the whole
 * point of revoking it.
 */
export async function currentOwnerSlug(): Promise<string | null> {
  const store = await cookies();
  const session = await readOwnerToken(store.get(OWNER_COOKIE)?.value);
  if (!session) return null;

  const shop = await prisma.shop.findUnique({
    where: { slug: session.slug },
    select: { active: true, ownerPinHash: true, ownerPinSetAt: true },
  });

  if (!shop || !shop.active || !shop.ownerPinHash || !shop.ownerPinSetAt) return null;
  return shop.ownerPinSetAt.getTime() === session.pinVersion ? session.slug : null;
}

/**
 * May the caller edit this shop's items?
 *
 * True for the Super Admin, and for a shop owner holding a current PIN session
 * for this exact slug. Shop-level settings — phone number, UPI id, deleting
 * the shop — stay on `requireAdmin`: an owner manages their price list, not
 * the shop's identity.
 */
export async function requireShopWrite(slug: string): Promise<boolean> {
  if (await requireAdmin()) return true;
  return (await currentOwnerSlug()) === slug;
}
