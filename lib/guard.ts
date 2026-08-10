import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySessionToken } from './auth';

/**
 * Route-handler side auth check. Middleware already gates /api/admin/shop/*,
 * but every mutating handler re-checks: a matcher typo should not become an
 * open write endpoint.
 */
export async function requireAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}
