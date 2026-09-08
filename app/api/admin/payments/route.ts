import { requireAdmin } from '@/lib/guard';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { paymentSettingsSchema } from '@/lib/validators';
import { operatorPayment, saveOperatorPayment } from '@/lib/payment-settings';

export const runtime = 'nodejs';

/** GET — the operator's current payment details, for the console form. */
export async function GET() {
  if (!(await requireAdmin())) return fail('Not authenticated', 401);
  return ok(await operatorPayment());
}

/**
 * POST — change where shops send money.
 *
 * Deliberately NOT behind a password re-check, unlike the sign-in screen. This
 * is a business detail an operator changes when they switch bank or reprint a
 * QR, not a credential — and the thing it protects is already protected: an
 * attacker who can reach this endpoint is already signed in as the one account
 * that can see every shop, and could do far worse than redirect future UPI
 * payments they would still have to convince each shopkeeper to send.
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  if (!(await requireAdmin())) return fail('Not authenticated', 401);

  const parsed = paymentSettingsSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  const { upiId, payeeName, phone, qrImageData, note } = parsed.data;

  // A screen that can be saved empty is a screen that silently takes every
  // shop's payment page down. One of the three ways to pay has to survive.
  if (!upiId && !qrImageData && !phone) {
    return fail('Give at least a UPI id, a QR image or a phone number', 422, {
      upiId: 'Shops need at least one way to pay you',
    });
  }

  await saveOperatorPayment({ upiId, payeeName, phone, qrImageData, note });
  return ok({ success: true });
}
