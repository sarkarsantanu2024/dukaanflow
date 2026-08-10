import bcrypt from 'bcryptjs';

/**
 * Node-runtime only. Kept out of `lib/auth.ts` so that Edge middleware can
 * import session helpers without pulling bcrypt into the Edge bundle.
 */

/** Default when ADMIN_USERNAME is not set, so a fresh clone still starts. */
const DEFAULT_USERNAME = 'admin';

/**
 * A real bcrypt hash of a value nobody knows. Compared against when the
 * username is wrong, so a bad username costs the same ~250ms as a bad
 * password. Without it, response time would reveal which usernames exist.
 */
const DECOY_HASH = '$2a$12$Na5PgxUdsmQV5GgMVTxPyehshtKuo.LB3TGQFTohrWDUcLZI7BeYG';

function expectedUsername(): string {
  return (process.env.ADMIN_USERNAME || DEFAULT_USERNAME).trim().toLowerCase();
}

/**
 * Verifies the single Super Admin's username and password.
 *
 * The username is an identifier, not a secret, so it is stored in plain text;
 * only the password is hashed. Both are checked before returning, and the
 * caller reports one generic error for either failure — never "wrong password
 * for a valid user", which would confirm the username to an attacker.
 */
export async function verifyAdminCredentials(
  username: string,
  password: string,
): Promise<boolean> {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) {
    // Fail closed, and never echo the reason to the client.
    console.error('ADMIN_PASSWORD_HASH is not configured');
    return false;
  }

  const usernameMatches = username.trim().toLowerCase() === expectedUsername();

  try {
    // Always run bcrypt, even on a username miss, to keep timing flat.
    const passwordMatches = await bcrypt.compare(password, usernameMatches ? hash : DECOY_HASH);
    return usernameMatches && passwordMatches;
  } catch {
    return false;
  }
}
