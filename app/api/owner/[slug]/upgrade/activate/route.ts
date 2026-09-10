import { prisma } from '@/lib/prisma';
import { requireShopWrite } from '@/lib/guard';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { activationSchema } from '@/lib/validators';
import { ACTIVATION_MAX_ATTEMPTS, verifyActivationCode } from '@/lib/activation-code';
import { grantSubscription } from '@/lib/subscription';

export const runtime = 'nodejs';

type Context = { params: Promise<{ slug: string }> };

/**
 * POST — the owner types the 4 digits the operator sent them.
 *
 * WHAT THIS ACTIVATES IS THE REQUEST, NOT THE REQUEST BODY. The plan and the
 * months come off the stored row — the one the operator looked at and priced
 * against a real payment — so nothing the browser sends can change what is
 * bought. A code issued for one month of Starter activates one month of
 * Starter, and there is no field in this route that could make it do otherwise.
 */
export async function POST(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  const { slug } = await params;
  if (!(await requireShopWrite(slug))) return fail('Not authenticated', 401);

  // A second line of defence only. The real one is the attempt counter on the
  // row below, because this map lives in one serverless instance's memory and
  // an attacker who spreads guesses across instances walks straight past it.
  const limit = rateLimit(`activate:${clientIp(request)}`, 20, 10 * 60 * 1000);
  if (!limit.ok) return fail('Too many attempts. Please wait a few minutes.', 429);

  const parsed = activationSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  const shop = await prisma.shop.findUnique({ where: { slug }, select: { id: true } });
  if (!shop) return fail('Shop not found', 404);

  const found = await prisma.paymentRequest.findFirst({
    where: { shopId: shop.id, status: 'CODE_ISSUED' },
    orderBy: { createdAt: 'desc' },
  });

  // Said the same way whether no code was ever issued or one was already spent.
  // "There is no code waiting for you" is the honest answer to both, and the
  // owner's next move — ask the operator — is the same either way.
  if (!found) {
    return fail('No code is waiting for this shop yet. Please ask us for one.', 409);
  }

  if (found.attempts >= ACTIVATION_MAX_ATTEMPTS) {
    return fail('That code is locked after too many tries. Please ask us for a new one.', 423);
  }

  if (found.codeExpiresAt && found.codeExpiresAt <= new Date()) {
    return fail('That code has expired. Please ask us for a new one.', 410);
  }

  const matches = await verifyActivationCode(parsed.data.code, found.codeHash);

  if (!matches) {
    // Counted in Postgres, and counted BEFORE anything is said back, so a
    // client that hangs up mid-response has still used its try.
    const updated = await prisma.paymentRequest.update({
      where: { id: found.id },
      data: { attempts: { increment: 1 } },
      select: { attempts: true },
    });
    const left = Math.max(0, ACTIVATION_MAX_ATTEMPTS - updated.attempts);

    return fail(
      left === 0
        ? 'That code is locked after too many tries. Please ask us for a new one.'
        : `That code is not right. ${left} ${left === 1 ? 'try' : 'tries'} left.`,
      left === 0 ? 423 : 401,
    );
  }

  /**
   * MARK IT SPENT FIRST, THEN GRANT.
   *
   * A conditional update on the row's current status is the lock: two taps
   * arriving together both read CODE_ISSUED, but only one of them can move it
   * to ACTIVATED, and the loser's `count` comes back zero. Granting first and
   * marking afterwards would give a shop two months for one payment on nothing
   * more exotic than a double tap.
   */
  const claimed = await prisma.paymentRequest.updateMany({
    where: { id: found.id, status: 'CODE_ISSUED' },
    data: {
      status: 'ACTIVATED',
      activatedAt: new Date(),
      codeHash: null,
      /**
       * THE SCREENSHOT HAS DONE ITS JOB, SO IT GOES.
       *
       * It exists for one moment: the operator holding it against their bank
       * feed before issuing a code. Past activation nobody looks at it again,
       * and it is a base64 image sitting in a Postgres column — the single
       * fastest-growing thing in this database, on a free tier measured in
       * hundreds of megabytes, accumulating with every upgrade forever.
       *
       * The audit trail is untouched: who paid, from which UPI id, on which
       * phone, for which plan, how many months, and when it was activated are
       * all separate columns and all still here. What is dropped is the
       * picture, which proves none of them.
       */
      screenshotData: '',
    },
  });
  if (claimed.count === 0) return fail('That code has already been used.', 409);

  const { periodEnd } = await grantSubscription({
    shopId: shop.id,
    plan: found.plan,
    months: found.months,
    method: 'UPI',
    // The request id, so a payment row in the console can always be traced back
    // to the screenshot and the UPI id the shop sent with it.
    reference: found.id,
    note: 'Activated by code',
  });

  return ok({
    success: true,
    plan: found.plan,
    months: found.months,
    periodEnd: periodEnd.toISOString(),
  });
}
