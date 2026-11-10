import { cookies } from 'next/headers';
import { createSessionToken, SESSION_COOKIE, SESSION_TTL_MS, sessionCookieOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/guard';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { adminAccountSchema } from '@/lib/validators';
import { currentAdminCredentials, saveAdminCredentials, verifyAdminCredentials } from '@/lib/password';

export const runtime = 'nodejs';

/**
 * GET — who the console is currently signed in as.
 *
 * The username only. It is an identifier rather than a secret, and the form
 * needs it prefilled: asking somebody to retype their own username to change
 * their password is how a typo becomes a lockout.
 */
export async function GET() {
  if (!(await requireAdmin())) return fail('Not authenticated', 401);
  const stored = await currentAdminCredentials();
  return ok({ username: stored?.username ?? '' });
}

/**
 * POST — change the Super Admin's own username and password.
 *
 * Being signed in is not enough on its own. The current password is checked
 * again here, against the same function the login route uses, because a session
 * lasts twelve hours and an unattended laptop is exactly where a quiet takeover
 * happens. Rate-limited for the same reason the login route is: this endpoint
 * will confirm a correct password to anyone who can reach it.
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  if (!(await requireAdmin())) return fail('Not authenticated', 401);

  const limit = await rateLimit(`admin-account:${clientIp(request)}`, 8, 10 * 60 * 1000);
  if (!limit.ok) return fail('Too many attempts. Please wait and try again.', 429);

  const parsed = adminAccountSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  const { username, currentPassword, newPassword } = parsed.data;

  // Checked against the username on file rather than the one being typed into
  // the form — otherwise renaming the account would let anybody skip the
  // password check by inventing a new username to go with it.
  const stored = await currentAdminCredentials();
  if (!stored) return fail('No admin account is configured', 500);

  if (!(await verifyAdminCredentials(stored.username, currentPassword))) {
    return fail('Current password is incorrect', 401);
  }

  const { version } = await saveAdminCredentials(username, newPassword);

  /**
   * Every OTHER session is now revoked: the credential version moved, and
   * `requireAdmin()` refuses tokens carrying the old one. That is the reason
   * somebody changes a password — the laptop that went missing, the colleague
   * who left — and before this a change did not shorten a single existing
   * session.
   *
   * THIS browser keeps working: signing the admin out of the screen they just
   * used would teach them that changing a password breaks the console, so the
   * cookie is reissued against the new version in the same response.
   */
  const store = await cookies();
  store.set(SESSION_COOKIE, await createSessionToken(version), sessionCookieOptions(SESSION_TTL_MS / 1000));

  return ok({ success: true, username });
}
