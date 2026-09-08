import { prisma } from './prisma';
import { BRAND_NAME } from './brand';

/**
 * Where shops send money — the operator's own UPI id, phone and printed QR.
 *
 * One row, on a fixed literal id, for the same reason `AdminCredential` has one:
 * there is a single operator, so there is a single answer, and a generated key
 * would make it possible to write a second and then have to decide which is
 * real.
 */
export const PAYMENT_SETTING_ID = 'operator';

export type OperatorPayment = {
  upiId: string;
  payeeName: string;
  phone: string;
  /** The operator's printed QR as a data URL, or "" to generate one from `upiId`. */
  qrImageData: string;
  note: string;
};

const EMPTY: OperatorPayment = {
  upiId: '',
  payeeName: '',
  phone: '',
  qrImageData: '',
  note: '',
};

/**
 * What a shop should be shown when it wants to pay.
 *
 * Falls back to `NEXT_PUBLIC_ADMIN_UPI_ID` when the row has never been written,
 * so a deployment that has not yet used the console screen behaves exactly as
 * it did before this table existed. The row wins wherever it has a UPI id —
 * that ordering is what makes the screen mean anything, since an environment
 * variable that still overrode it would leave the operator unable to change
 * their own bank details.
 *
 * A database that cannot be reached falls back rather than throwing: a shop
 * being unable to see a QR is a lost payment, and the env value is still a
 * correct answer.
 */
export async function operatorPayment(): Promise<OperatorPayment> {
  const fallbackUpi = process.env.NEXT_PUBLIC_ADMIN_UPI_ID ?? '';

  try {
    const row = await prisma.paymentSetting.findUnique({
      where: { id: PAYMENT_SETTING_ID },
      select: { upiId: true, payeeName: true, phone: true, qrImageData: true, note: true },
    });
    if (row && (row.upiId || row.qrImageData)) return row;
  } catch (error) {
    console.error('Could not read payment settings, falling back to env', error);
  }

  return { ...EMPTY, upiId: fallbackUpi };
}

/** Is there anything a shop could actually pay against? */
export function canBePaid(settings: OperatorPayment): boolean {
  return Boolean(settings.upiId || settings.qrImageData || settings.phone);
}

/** The name a payer should see. Never blank. */
export function payeeLabel(settings: OperatorPayment): string {
  return settings.payeeName.trim() || BRAND_NAME;
}

export async function saveOperatorPayment(data: OperatorPayment): Promise<void> {
  await prisma.paymentSetting.upsert({
    where: { id: PAYMENT_SETTING_ID },
    create: { id: PAYMENT_SETTING_ID, ...data },
    update: data,
  });
}
