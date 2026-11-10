import { cookies } from 'next/headers';
import { createSessionToken, SESSION_COOKIE, SESSION_TTL_MS, sessionCookieOptions } from '@/lib/auth';
import { authenticateAdmin } from '@/lib/password';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { loginSchema } from '@/lib/validators';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail('Bad request', 403);

  // 8 attempts per 10 minutes per IP — enough for a fat-fingered admin,
  // far too slow to brute-force a real password.
  const limit = await rateLimit(`login:${clientIp(request)}`, 8, 10 * 60 * 1000);
  if (!limit.ok) return fail('Too many attempts. Please wait and try again.', 429);

  const parsed = loginSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  const authenticated = await authenticateAdmin(parsed.data.username, parsed.data.password);
  if (!authenticated) {
    // One message for both fields — never confirm that a username exists,
    // and never reveal whether the hash is even configured.
    return fail('Incorrect username or password', 401);
  }

  // Stamped with the credential version, so a later password change can
  // revoke it — see requireAdmin().
  const token = await createSessionToken(authenticated.version);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions(SESSION_TTL_MS / 1000));

  return ok({ success: true });
}
