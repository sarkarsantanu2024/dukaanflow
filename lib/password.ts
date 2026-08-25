import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';

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

/* ------------------------------------------------------------------ */
/* Shop owner PINs                                                     */
/* ------------------------------------------------------------------ */

/** Cheaper than the admin's 12 — a PIN is checked on a phone, on a counter. */
const PIN_ROUNDS = 10;

export const OWNER_PIN_LENGTH = 6;

/**
 * A 6-digit PIN from a CSPRNG — never Math.random, which is predictable enough
 * that a determined guesser could narrow a million codes to a handful.
 * Leading zeros are kept: "004821" is a perfectly good PIN.
 */
export function generateOwnerPin(): string {
  let pin = '';
  for (let i = 0; i < OWNER_PIN_LENGTH; i += 1) pin += String(randomInt(0, 10));
  return pin;
}

export function hashOwnerPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, PIN_ROUNDS);
}

/**
 * Six digits is a small space, so this is only ever safe behind the rate limit
 * on the owner login route. Never call it in a loop.
 */
export async function verifyOwnerPin(pin: string, hash: string | null): Promise<boolean> {
  try {
    // Compare against a decoy when no PIN is set, so "this shop has no owner
    // access" and "wrong PIN" take the same time to answer.
    return await bcrypt.compare(pin, hash ?? DECOY_HASH);
  } catch {
    return false;
  }
}
