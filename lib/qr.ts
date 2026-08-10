/** Pure URL builders. QR rendering itself happens client-side via qrcode.react. */

export function baseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, '');
  return configured || 'http://localhost:3000';
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
