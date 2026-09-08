import { prisma } from '@/lib/prisma';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { PaymentSettingsForm } from '@/components/admin/PaymentSettingsForm';
import {
  PaymentRequestsPanel,
  type AdminPaymentRequest,
} from '@/components/admin/PaymentRequestsPanel';
import { canBePaid, operatorPayment } from '@/lib/payment-settings';
import { BRAND_NAME } from '@/lib/brand';
import type { Plan } from '@/lib/plans';

export const dynamic = 'force-dynamic';
export const metadata = { title: `${BRAND_NAME} — Payments` };

/**
 * One screen for the money side of the business: where shops send it, and who
 * says they have sent it.
 *
 * Together rather than as two pages, because they are one job done in one
 * sitting — an operator opens this to check payments, and the reason a payment
 * did not arrive is very often that the details at the top are wrong.
 *
 * The queue is deliberately first. Settings change twice a year; the queue is
 * why anybody opens this page.
 */
export default async function PaymentsPage() {
  const [settings, rows] = await Promise.all([
    operatorPayment(),
    prisma.paymentRequest.findMany({
      // Waiting-for-you first, then codes still out, then history. Postgres
      // cannot sort on the enum's declared order (it appends new values at the
      // end whatever the schema says), so the ranking is applied below.
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        plan: true,
        months: true,
        amountPaise: true,
        payerUpiId: true,
        payerPhone: true,
        screenshotData: true,
        status: true,
        attempts: true,
        reviewNote: true,
        createdAt: true,
        shop: { select: { name: true, slug: true, phone: true } },
      },
    }),
  ]);

  const RANK: Record<string, number> = { SUBMITTED: 0, CODE_ISSUED: 1, REJECTED: 2, ACTIVATED: 3 };

  const requests: AdminPaymentRequest[] = rows
    .map((row) => ({
      id: row.id,
      shopName: row.shop.name,
      shopSlug: row.shop.slug,
      shopPhone: row.shop.phone,
      plan: row.plan as Plan,
      months: row.months,
      amountPaise: row.amountPaise,
      payerUpiId: row.payerUpiId,
      payerPhone: row.payerPhone,
      screenshotData: row.screenshotData,
      status: row.status as AdminPaymentRequest['status'],
      attempts: row.attempts,
      reviewNote: row.reviewNote,
      createdAt: row.createdAt.toISOString(),
    }))
    .sort((a, b) => {
      const byStatus = (RANK[a.status] ?? 9) - (RANK[b.status] ?? 9);
      if (byStatus !== 0) return byStatus;
      return b.createdAt.localeCompare(a.createdAt);
    });

  const waiting = requests.filter((row) => row.status === 'SUBMITTED').length;

  return (
    <>
      <AdminHeader title="Payments" eyebrow="Super Admin" backHref="/admin" />

      <main className="space-y-8 px-4 py-5 lg:px-6">
        {!canBePaid(settings) && (
          // Loud, because until this is filled in every shop's payment screen
          // shows them nothing to pay against and the operator will never hear
          // about it — the shop simply stops.
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            No payment details are set, so shops have nothing to scan. Fill in the form below.
          </p>
        )}

        <section>
          <h2 className="text-base font-bold text-slate-900">
            Payment requests
            {waiting > 0 && (
              <span className="ml-2 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                {waiting} waiting
              </span>
            )}
          </h2>
          <p className="mb-4 mt-1 max-w-2xl text-sm text-slate-600">
            Each row is a shop telling you what it bought and showing you its payment. Check the
            amount against your bank, then <strong>Issue code</strong> — you get a 4-digit code and
            a WhatsApp link to send it. The shop types it into their app and the plan turns on.
          </p>
          <PaymentRequestsPanel requests={requests} />
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-900">Where shops pay you</h2>
          <p className="mb-4 mt-1 max-w-2xl text-sm text-slate-600">
            This is what every shop sees on their payment screen. Upload your own PhonePe or Google
            Pay QR — it carries merchant details a generated code cannot.
          </p>
          <PaymentSettingsForm initial={settings} />
        </section>
      </main>
    </>
  );
}
