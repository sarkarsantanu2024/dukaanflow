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

if (password.length < 10) {
  console.error('Use at least 10 characters — this is the only credential for the whole platform.');
  process.exit(1);
}

// Cost 12: ~250ms per verification, which is fine for a once-a-day login and
// painful for anyone brute-forcing a leaked hash.
const hash = bcrypt.hashSync(password, 12);

console.log('\nADMIN_PASSWORD_HASH=' + JSON.stringify(hash) + '\n');
