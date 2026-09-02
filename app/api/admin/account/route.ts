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

  const limit = rateLimit(`admin-account:${clientIp(request)}`, 8, 10 * 60 * 1000);
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

  await saveAdminCredentials(username, newPassword);

  /**
   * The session is deliberately left alone.
   *
   * Signing the admin out of the browser they just made the change in would
   * teach them that changing a password breaks the console, and the token
   * carries no credential version to revoke against anyway — a change here does
   * not shorten any session that already exists. Twelve hours is the ceiling on
   * that either way.
   */
  return ok({ success: true, username });
}
