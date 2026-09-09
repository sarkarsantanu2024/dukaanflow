import type { Metadata } from 'next';
import { LegalPage } from '@/components/ui/LegalPage';
import { COMPANY, companyLocation } from '@/lib/company';
import { BRAND_NAME } from '@/lib/brand';
import { supportDetails } from '@/lib/support';

/**
 * How to reach a human.
 *
 * A WHATSAPP NUMBER, NOT A FORM. The people using this run a counter with one
 * hand and a phone with the other; a contact form is a thing they will not fill
 * in, and a reply that arrives by email is a reply they will not read. The
 * number is the product's real support channel, so it is what this page leads
 * with.
 *
 * It also carries the operator's identity and address, which is what a payment
 * aggregator and a customer both look for before trusting a business with money.
 */
export const metadata: Metadata = {
  title: `Contact — ${BRAND_NAME}`,
  description: `How to reach ${COMPANY.name} about ${BRAND_NAME}.`,
  robots: { index: true, follow: true },
};

export default function ContactPage() {
  const support = supportDetails();

  return (
    <LegalPage title="Contact" intro={`How to reach the people who build and run ${BRAND_NAME}.`}>
      <h2>Support</h2>
      {support.phone ? (
        <p>
          Call or message us on WhatsApp at{' '}
          <a href={`tel:+91${support.phone}`}>+91 {support.phone}</a>. We answer during shop hours,
          and within 2 working days at the latest.
        </p>
      ) : (
        <p>Support details are shown at the foot of every page in the app.</p>
      )}
      <p>
        Tell us your <strong>shop name</strong> and what you were doing when it went wrong. That
        is almost always enough for us to find it without a long back-and-forth.
      </p>

      <h2>If you ordered from a shop</h2>
      <p>
        We build the software; we do not sell the goods. Anything about a particular order — what
        arrived, what it cost, a refund — is for the shop itself, and its number is on its own
        page and on your order. If you cannot reach the shop at all, tell us and we will try to
        help.
      </p>

      <h2>Business details</h2>
      <p>
        <strong>{COMPANY.name}</strong>
        <br />
        {companyLocation()}
      </p>

      <h2>Privacy and data requests</h2>
      <p>
        To get a copy of what we hold about you, correct it, or have it deleted, use the same
        number above and say so. What we hold and how long we keep it is set out in the{' '}
        <a href="/privacy">privacy policy</a>.
      </p>

      <h2>Also here</h2>
      <p>
        <a href="/terms">Terms of Service</a> · <a href="/refund">Refunds &amp; cancellation</a> ·{' '}
        <a href="/pricing">Pricing</a>
      </p>
    </LegalPage>
  );
}
