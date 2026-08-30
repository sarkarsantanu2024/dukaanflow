/**
 * Prints the environment variables Vercel needs, in the form it expects.
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
  'NEXT_PUBLIC_SUPPORT_PHONE',
  // Whose name sits in the page footer beside the support number. Optional —
  // it falls back to the default in `lib/support.ts`.
  'NEXT_PUBLIC_SUPPORT_NAME',
  // Signs the daily retention purge. Without it the cron refuses to run and
  // the order and sale tables grow forever.
  'CRON_SECRET',
  /**
   * Web push: the sound a shopkeeper's phone makes when an order arrives, and
   * the message a customer gets when theirs is ready.
   *
   * SET THESE ONCE AND NEVER CHANGE THEM. The key pair is the identity every
   * subscription was issued against — replacing it silently stops every phone
   * that has already said yes, and the browser permission prompt is one-shot,
   * so some of those people can never be asked again.
   *
   * All three blank is a supported state: push is simply off and every screen
   * behaves exactly as it does with it on.
   */
  'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY',
  'VAPID_SUBJECT',
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

console.log('After saving them all, redeploy — NEXT_PUBLIC_BASE_URL is baked in at build time.\n');
