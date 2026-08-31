/**
 * Who to call when Halkhata itself goes wrong.
 *
 * The shop's own phone number is on its page already — that is for orders. This
 * is the other number: the people who built and run the product, for a
 * shopkeeper whose QR has stopped working or a customer who cannot place an
 * order at all. Without it the only route back to anybody is the shop, which is
 * the one party who cannot fix it.
 *
 * Read from `NEXT_PUBLIC_*` so a deployment can be rebranded without touching
 * components, with the defaults being the people who run this one. A blank
 * number is simply not rendered rather than shown as an empty line.
 */

export type SupportDetails = {
  name: string;
  /** 10-digit Indian mobile, digits only, or blank. */
  phone: string;
};

/**
 * Digits only, and without the country code.
 *
 * `NEXT_PUBLIC_SUPPORT_PHONE` is documented as carrying the country code —
 * "919876543210" — because the owner app pastes it straight into a `wa.me`
 * link. Everything here adds the 91 itself, so a value that already has one
 * would produce `wa.me/91919876543210`, a number that reaches nobody. Both
 * shapes are accepted and reduced to the same ten digits.
 */
function digits(value: string): string {
  const only = value.replace(/\D/g, '');
  return only.length === 12 && only.startsWith('91') ? only.slice(2) : only;
}

export function supportDetails(): SupportDetails {
  return {
    name: process.env.NEXT_PUBLIC_SUPPORT_NAME || 'Nexvora Technologies',
    phone: digits(process.env.NEXT_PUBLIC_SUPPORT_PHONE || '9804243159'),
  };
}
