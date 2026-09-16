import { prisma } from '@/lib/prisma';
import { fail, ok } from '@/lib/http';
import { sendPush } from '@/lib/push';
import { trialNotification } from '@/lib/push-text';
import type { Locale } from '@/lib/i18n';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * How many days before the end the owner is warned.
 *
 * Three, because a shopkeeper who has to arrange a UPI payment needs a working
 * day or two and no more — warn a fortnight out and it is forgotten, warn on
 * the morning it ends and the warning is not a warning, it is an announcement.
 */
const WARN_WITHIN_DAYS = 3;

const DAY = 86_400_000;

/**
 * GET /api/cron/trials — tells an owner their free trial is ending, once.
 *
 * WHY A JOB AND NOT A CHECK ON PAGE LOAD. The owner this matters to most is the
 * one who has stopped opening the app, and a check that runs when they open the
 * app cannot reach them. A trial that lapses in silence is a shop that
 * discovers it on the morning it tries to change a price, which is the worst
 * possible way to learn it and the likeliest way to lose the shop.
 *
 * EXACTLY ONCE PER TRIAL END, and that is what `trialEndNoticedAt` is for. It
 * stores the trial date that was warned about rather than a flag, so a shop
 * given another week by the operator is warned again when THAT week runs out —
 * a flag would have gone quiet forever after the first notice.
 *
 * Shops that have paid are skipped entirely: `currentPeriodEnd` in the future
 * means the trial is irrelevant, and telling somebody who has already paid that
 * their free time is running out is the kind of message that makes an owner
 * doubt the books.
 *
 * Wired to the daily Vercel cron in `vercel.json`, and refuses anything without
 * the shared secret — same rule as the purge job. It sends notifications to
 * real shopkeepers' phones, and an open URL that does that is one somebody will
 * eventually find and use.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return fail('CRON_SECRET is not configured', 503);
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return fail('Not authenticated', 401);
  }

  const now = new Date();
  const horizon = new Date(now.getTime() + WARN_WITHIN_DAYS * DAY);

  const shops = await prisma.shop.findMany({
    where: {
      active: true,
      trialEndsAt: { not: null, lte: horizon },
      // Already paying. Their trial date is a leftover fact about the past.
      OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { lte: now } }],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      locale: true,
      trialEndsAt: true,
      trialEndNoticedAt: true,
    },
  });

  const warned: string[] = [];
  const ended: string[] = [];

  for (const shop of shops) {
    const trialEndsAt = shop.trialEndsAt!;

    // Told about THIS end already. A later extension moves the date and this
    // stops matching, which is exactly when they should hear from us again.
    if (shop.trialEndNoticedAt && shop.trialEndNoticedAt.getTime() === trialEndsAt.getTime()) {
      continue;
    }

    // Rounded up, so a trial with eleven hours left says "1 day" rather than
    // "0 days" — which would read as "it is over" to somebody who still has
    // this evening to act.
    const daysLeft = Math.ceil((trialEndsAt.getTime() - now.getTime()) / DAY);

    const { title, body } = trialNotification({
      locale: (shop.locale as Locale) ?? 'en',
      daysLeft,
    });

    await sendPush(
      { shopId: shop.id, role: 'OWNER' },
      {
        title,
        body,
        url: `/owner/${shop.slug}/renew`,
        // Collapsed per shop: a warning at three days and the notice on the day
        // itself are the same conversation, and the later one should replace
        // the earlier rather than stacking two trial messages on a lock screen.
        tag: `trial:${shop.id}`,
      },
    );

    /**
     * Stamped whether or not a notification actually went out.
     *
     * An owner who has never turned push on has no subscription to send to, and
     * retrying them every night forever would be a query per shop per day that
     * can never succeed. The operator's list below is how those shops get
     * reached, and it does not depend on this stamp.
     *
     * Only stamped once the trial has actually ENDED, though: a warning at
     * three days out must not silence the message on the day itself.
     */
    if (daysLeft <= 0) {
      await prisma.shop.update({
        where: { id: shop.id },
        data: { trialEndNoticedAt: trialEndsAt },
      });
      ended.push(shop.slug);
    } else {
      warned.push(shop.slug);
    }
  }

  return ok({ checked: shops.length, warned, ended });
}
