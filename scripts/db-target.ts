/**
 * Says out loud which database is about to be changed, and refuses production.
 *
 * WHY THIS EXISTS. On 2026-08-28 a schema command aimed at what looked like a
 * local database dropped and recreated every table in production — shops, items,
 * orders, customers, the khata, the payments. The cause was not the command; it
 * was that `.env` points `DATABASE_URL` at the production Neon branch, so every
 * schema operation run from a laptop is a production operation and nothing on
 * screen says so.
 *
 * Until a Neon dev branch exists and `.env` points at it, this stands in the
 * way: `npm run db:push` prints the host and stops if that host is production.
 * Deliberate work on production is still possible — `ALLOW_PROD_DB=1` — but it
 * has to be typed, which is the whole difference between a decision and an
 * accident.
 *
 *   npm run db:push                  → refused, with the host named
 *   ALLOW_PROD_DB=1 npm run db:push  → proceeds
 */
import { config } from 'dotenv';

config();

/** Neon branch endpoints known to be production. Extend as branches are added. */
const PRODUCTION_HOSTS = ['ep-holy-lab-azgo7vv2'];

function hostOf(url: string | undefined): string {
  if (!url) return '(no DATABASE_URL set)';
  try {
    return new URL(url).host;
  } catch {
    // A malformed URL must not crash the guard — that would skip the check.
    const match = url.match(/@([^/?]+)/);
    return match ? match[1]! : '(unparseable DATABASE_URL)';
  }
}

const host = hostOf(process.env.DATABASE_URL);
const isProduction = PRODUCTION_HOSTS.some((needle) => host.includes(needle));

console.log(`\n  database: ${host}`);
console.log(`  branch:   ${isProduction ? 'PRODUCTION' : 'non-production'}\n`);

if (isProduction && process.env.ALLOW_PROD_DB !== '1') {
  console.error(
    '  Refused: this would change the PRODUCTION database.\n' +
      '  If that is genuinely what you want:\n\n' +
      '    ALLOW_PROD_DB=1 npm run db:push\n\n' +
      '  Better: create a Neon dev branch and point .env at it, so a mistake\n' +
      '  costs nothing. See DEPLOYMENT.md.\n',
  );
  process.exit(1);
}
