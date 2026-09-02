import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';
import { prisma } from './prisma';

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

/** Cost for the one account that can see every shop. Slower on purpose. */
const ADMIN_ROUNDS = 12;

/**
 * The single row that holds the Super Admin's sign-in, if they have set one.
 *
 * A fixed literal id rather than a generated one: there is exactly one Super
 * Admin, so there is exactly one row, and an auto-generated key would make it
 * possible to write a second and then have to decide which of them is real.
 */
export const ADMIN_CREDENTIAL_ID = 'super';

export type AdminCredentials = { username: string; passwordHash: string };

/**
 * What the console signs in against: the row the admin set, or the environment
 * it was deployed with.
 *
 * The row wins wherever it exists. That ordering is what makes "change my
 * password" mean anything — an env variable that still overrode it would leave
 * the old password working, which is the one outcome a password change must
 * never have. A deployment that has never had the row falls back to
 * `ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH` exactly as before, so nothing about
 * a fresh clone or an existing install changes until somebody uses the screen.
 *
 * A database that cannot be reached falls back too, rather than locking the one
 * account that can fix anything out of the console.
 */
export async function currentAdminCredentials(): Promise<AdminCredentials | null> {
  try {
    const row = await prisma.adminCredential.findUnique({
      where: { id: ADMIN_CREDENTIAL_ID },
      select: { username: true, passwordHash: true },
    });
    if (row) return row;
  } catch (error) {
    console.error('Could not read admin credentials, falling back to env', error);
  }

  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) return null;
  return { username: process.env.ADMIN_USERNAME || DEFAULT_USERNAME, passwordHash: hash };
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
  const stored = await currentAdminCredentials();
  if (!stored) {
    // Fail closed, and never echo the reason to the client.
    console.error('No admin credentials are configured');
    return false;
  }

  const usernameMatches =
    username.trim().toLowerCase() === stored.username.trim().toLowerCase();

  try {
    // Always run bcrypt, even on a username miss, to keep timing flat.
    const passwordMatches = await bcrypt.compare(
      password,
      usernameMatches ? stored.passwordHash : DECOY_HASH,
    );
    return usernameMatches && passwordMatches;
  } catch {
    return false;
  }
}

/**
 * Writes the Super Admin's new sign-in.
 *
 * An upsert on the fixed id, so the first change creates the row and every one
 * after it replaces the same row. The caller has already checked the current
 * password — see `adminAccountSchema`.
 */
export async function saveAdminCredentials(username: string, password: string): Promise<void> {
  const passwordHash = await bcrypt.hash(password, ADMIN_ROUNDS);
  const data = { username: username.trim(), passwordHash };
  await prisma.adminCredential.upsert({
    where: { id: ADMIN_CREDENTIAL_ID },
    create: { id: ADMIN_CREDENTIAL_ID, ...data },
    update: data,
  });
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
