/**
 * Prints the five environment variables in the form Vercel expects.
 *
 *   npm run vercel:env
 *
 * The only transformation is un-escaping `\$` in the bcrypt hash. Local `.env`
 * files need `\$` because Next.js expands `$name` when it parses them; values
 * typed into Vercel's dashboard are injected straight into process.env and are
 * never expanded, so the backslashes must NOT be carried over.
 */
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd(), true, { info: () => {}, error: console.error });

const KEYS = [
  'DATABASE_URL',
  'DIRECT_URL',
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD_HASH',
  'COOKIE_SECRET',
  'NEXT_PUBLIC_BASE_URL',
] as const;

console.log('\nPaste each value into Vercel → Settings → Environment Variables.');
console.log('No surrounding quotes. No backslashes. Tick Production, Preview and Development.\n');

let missing = 0;

for (const key of KEYS) {
  const value = process.env[key];
  if (!value) {
    console.log(`${key}\n  !! MISSING from your local .env\n`);
    missing += 1;
    continue;
  }
  console.log(`${key}\n  ${value}\n`);
}

const hash = process.env.ADMIN_PASSWORD_HASH ?? '';
if (hash && hash.length !== 60) {
  console.log(
    `WARNING: ADMIN_PASSWORD_HASH is ${hash.length} characters, expected 60.\n` +
      `Your .env is probably missing the \\$ escaping, so the value is being mangled.\n`,
  );
}

if (missing > 0) process.exit(1);

console.log('After saving all five, redeploy — NEXT_PUBLIC_BASE_URL is baked in at build time.\n');
