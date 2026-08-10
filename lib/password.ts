import bcrypt from 'bcryptjs';

/**
 * Node-runtime only. Kept out of `lib/auth.ts` so that Edge middleware can
 * import session helpers without pulling bcrypt into the Edge bundle.
 */
export async function verifyAdminPassword(candidate: string): Promise<boolean> {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) {
    // Fail closed, and never echo the reason to the client.
    console.error('ADMIN_PASSWORD_HASH is not configured');
    return false;
  }
  try {
    return await bcrypt.compare(candidate, hash);
  } catch {
    return false;
  }
}
