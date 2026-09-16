/**
 * What the nightly trial job would do tonight, without doing any of it.
 *
 *   npx tsx scripts/trial-watch-check.ts
 *
 * Read-only. It runs the same selection the cron route runs and prints the
 * decision for each shop, so the job can be checked against real data before it
 * is trusted to message real shopkeepers.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const WARN_WITHIN_DAYS = 3;
const DAY = 86_400_000;

async function main() {
  const now = new Date();
  const horizon = new Date(now.getTime() + WARN_WITHIN_DAYS * DAY);

  const shops = await prisma.shop.findMany({
    where: {
      active: true,
      trialEndsAt: { not: null, lte: horizon },
      OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { lte: now } }],
    },
    select: {
      name: true,
      slug: true,
      locale: true,
      trialEndsAt: true,
      trialEndNoticedAt: true,
      currentPeriodEnd: true,
    },
    orderBy: { trialEndsAt: 'asc' },
  });

  console.log(`\n  ${shops.length} shop(s) in range (trial ends within ${WARN_WITHIN_DAYS} days, not paid)\n`);

  for (const shop of shops) {
    const trialEndsAt = shop.trialEndsAt!;
    const told =
      shop.trialEndNoticedAt !== null &&
      shop.trialEndNoticedAt.getTime() === trialEndsAt.getTime();
    const daysLeft = Math.ceil((trialEndsAt.getTime() - now.getTime()) / DAY);

    const action = told
      ? 'skip — already told about this end date'
      : daysLeft <= 0
        ? 'NOTIFY "trial has ended", then stamp so it is not repeated'
        : `NOTIFY "${daysLeft} day${daysLeft === 1 ? '' : 's'} left"`;

    console.log(
      `  ${shop.name.padEnd(30)} ends=${trialEndsAt.toISOString().slice(0, 10)}  daysLeft=${String(daysLeft).padStart(3)}  ${action}`,
    );
  }
  console.log();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
