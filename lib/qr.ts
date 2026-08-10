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
  return `dukaanflow-${slug}-${kind}-qr.png`;
}
