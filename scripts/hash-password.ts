/**
 * Generates the bcrypt hash for ADMIN_PASSWORD_HASH.
 *
 *   npm run hash -- "my-strong-password"
 *
 * Paste the printed value into .env (single-quoted) or Vercel's env UI.
 */
import bcrypt from 'bcryptjs';

const password = process.argv[2];

if (!password) {
  console.error('Usage: npm run hash -- "your-password"');
  process.exit(1);
}

/**
 * The same rule the Sign-in screen applies — at least one letter and one
 * number, no length floor (see `adminAccountSchema`).
 *
 * Kept in step deliberately. This script and that screen set the SAME
 * credential by two different routes, and a script that refused a password the
 * form had just accepted would read as a bug in the password rather than a
 * disagreement between two files.
 */
if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
  console.error('Use at least one letter and one number.');
  process.exit(1);
}

// Not a refusal — this is the only credential for the whole console, and a
// short one is worth a word even when it is allowed.
if (password.length < 12) {
  console.warn(
    `\n  Note: ${password.length} characters. Login attempts are rate-limited per\n` +
      '  serverless instance only, so length is the real defence here.\n',
  );
}

// Cost 12: ~250ms per verification, which is fine for a once-a-day login and
// painful for anyone brute-forcing a leaked hash.
const hash = bcrypt.hashSync(password, 12);

console.log('\n  Vercel — paste this value exactly as it is:\n');
console.log('    ' + hash);
console.log('\n  Local .env — dollars escaped, or it will not load:\n');
console.log("    ADMIN_PASSWORD_HASH='" + hash.replaceAll('$', '\\$') + "'\n");
