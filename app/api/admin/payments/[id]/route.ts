import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/guard';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { paymentReviewSchema } from '@/lib/validators';
import {
  activationExpiry,
  generateActivationCode,
  hashActivationCode,
} from '@/lib/activation-code';
import { activationMessage } from '@/lib/activation-message';
import { periodFor } from '@/lib/subscription';
import { PLAN_SPECS, type Plan } from '@/lib/plans';
import { LOCALES, type Locale } from '@/lib/i18n';

export const runtime = 'nodejs';

type Context = { params: Promise<{ id: string }> };

/**
 * POST — the operator's verdict on one payment request.
 *
 * `issue` generates the 4-digit code and returns it ONCE, in plaintext, in this
 * response. It is never stored and never readable again — the row keeps only a
 * bcrypt hash — so the console has to show it at this moment and the operator
 * has to send it before they navigate away. That is a deliberate cost: a code
 * that could be re-read from a list is a code that leaks with the list.
 *
 * Re-issuing on an already-issued request is allowed and replaces the old code,
 * which is what "the shopkeeper never got the message" needs, and it resets the
 * attempt counter so a locked-out shop is unlocked by the same action.
 */
export async function POST(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  if (!(await requireAdmin())) return fail('Not authenticated', 401);

  const { id } = await params;
  const parsed = paymentReviewSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  const found = await prisma.paymentRequest.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      plan: true,
      months: true,
      amountPaise: true,
      shop: {
        select: {
          name: true,
          phone: true,
          slug: true,
          ownerName: true,
          locale: true,
          currentPeriodEnd: true,
          trialEndsAt: true,
        },
      },
    },
  });
  if (!found) return fail('Request not found', 404);

  // Once a shop has redeemed a code, the money has bought time and a row in
  // Payment. Re-issuing against it would hand out a second month for the same
  // rupees; refusing it after the fact would not take the time back.
  if (found.status === 'ACTIVATED') {
    return fail('That request has already been activated', 409);
  }

  if (parsed.data.action === 'reject') {
    await prisma.paymentRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewNote: parsed.data.reviewNote,
        // Any code that was out there stops working the moment it is refused.
        codeHash: null,
        codeExpiresAt: null,
      },
    });
    return ok({ success: true, status: 'REJECTED' });
  }

  const code = generateActivationCode();
  await prisma.paymentRequest.update({
    where: { id },
    data: {
      status: 'CODE_ISSUED',
      codeHash: await hashActivationCode(code),
      codeIssuedAt: new Date(),
      codeExpiresAt: activationExpiry(),
      // A re-issue unlocks a shop that burned its five tries on a wrong code.
      attempts: 0,
      reviewNote: '',
    },
  });

  /**
   * The message, written out in all three languages.
   *
   * All three rather than only the shop's, because the operator is the one
   * pressing send and knows things the `locale` column does not: that this
   * particular shopkeeper reads Hindi despite a Bengali shopfront, or that the
   * number belongs to a son who will read English. The shop's own language is
   * what the console opens on, which is right far more often than not — it is a
   * default, not a decision made for them.
   *
   * Composed here rather than in the console's browser so the renewal date is
   * formatted once, in Indian time, whatever clock the operator is on.
   */
  const { periodEnd } = periodFor(found.shop, found.months);
  const spec = PLAN_SPECS[found.plan as Plan];

  const common = {
    shopName: found.shop.name,
    ownerName: found.shop.ownerName,
    planName: spec?.name ?? found.plan,
    planItemLimit: spec?.itemLimit ?? 0,
    months: found.months,
    amountPaise: found.amountPaise,
    renewsOn: periodEnd,
    code,
  };

  const messages = Object.fromEntries(
    LOCALES.map((locale) => [locale, activationMessage({ locale, ...common })]),
  ) as Record<Locale, string>;

  return ok({
    success: true,
    status: 'CODE_ISSUED',
    // The only time this string exists outside the operator's screen.
    code,
    shopName: found.shop.name,
    shopPhone: found.shop.phone,
    ownerName: found.shop.ownerName,
    planName: common.planName,
    months: found.months,
    // For the console's own summary line, which is read by the operator and so
    // stays in English whatever the shop reads.
    renewsOn: periodEnd.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    }),
    /** What the console opens on — overridable by the operator. */
    defaultLocale: (found.shop.locale as Locale) ?? 'en',
    messages,
  });
}
