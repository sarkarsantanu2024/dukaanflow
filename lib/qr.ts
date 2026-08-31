/** Pure URL builders. QR rendering itself happens client-side via qrcode.react. */

export function baseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, '');
  // Fall back to production rather than localhost: a QR is a physical artefact
  // that outlives the session that printed it, so a misconfigured environment
  // should yield a working code, not one pointing at someone's laptop.
  return configured || 'https://dukaanflow.vercel.app';
}

export function shopUrl(slug: string): string {
  return `${baseUrl()}/shop/${slug}`;
}

/**
 * UPI deep link per the NPCI spec. `pa` = payee address (VPA), `pn` = payee
 * name, `cu` = currency. No amount — the customer types it, so no gateway and
 * no reconciliation problem.
 */
export function upiPayUrl(upiId: string, shopName: string): string {
  const params = new URLSearchParams({ pa: upiId, pn: shopName, cu: 'INR' });
  return `upi://pay?${params.toString()}`;
}

/** Filesystem-safe download name. */
export function qrFileName(slug: string, kind: 'shop' | 'upi'): string {
  return `halkhata-${slug}-${kind}-qr.png`;
}

/**
 * A UPI intent with the amount filled in — the customer confirms rather than
 * types, which is the difference between a payment that is right and one that
 * is a digit out.
 *
 * Lives here rather than beside one screen because two screens now take
 * payments: the till, and an order being completed. Two copies of this would
 * eventually disagree about the payee name or the currency, and the symptom
 * would be a customer's app showing the wrong shop.
 */
export function upiPayUrlWithAmount(upiId: string, shopName: string, amount: number): string {
  const params = new URLSearchParams({
    pa: upiId,
    pn: shopName,
    am: String(amount),
    cu: 'INR',
  });
  return `upi://pay?${params.toString()}`;
}
