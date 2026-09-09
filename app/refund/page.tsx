import type { Metadata } from 'next';
import { LegalPage } from '@/components/ui/LegalPage';
import { COMPANY, companyLocation } from '@/lib/company';
import { BRAND_NAME } from '@/lib/brand';
import { AUTO_PAUSE_DAYS, TRIAL_DAYS } from '@/lib/plans';
import { supportDetails } from '@/lib/support';

/**
 * What happens to money already paid.
 *
 * TWO DIFFERENT KINDS OF MONEY GET CONFUSED HERE, and separating them is most
 * of the page's job: the subscription a shopkeeper pays us, and the price of a
 * bag of rice a customer pays a shop. We can refund the first and have nothing
 * to do with the second — a customer who arrives here wanting their ₹200 back
 * needs to be sent to the shop, clearly and in the first paragraph, rather than
 * reading a page of terms that were never about them.
 */
export const metadata: Metadata = {
  title: `Refunds & Cancellation — ${BRAND_NAME}`,
  description: `How ${COMPANY.name} handles subscription cancellations and refunds for ${BRAND_NAME}.`,
  robots: { index: true, follow: true },
};

export default function RefundPage() {
  const support = supportDetails();

  return (
    <LegalPage
      title="Refunds &amp; Cancellation"
      intro="Cancelling a subscription, and when money paid for one comes back."
    >
      <h2>First — which money is this about?</h2>
      <p>
        This page is about the <strong>subscription a shop pays {COMPANY.name}</strong> to use{' '}
        {BRAND_NAME}.
      </p>
      <p>
        <strong>If you ordered goods from a shop</strong> and want your money back, that is
        between you and that shop. We never hold that payment — a UPI payment goes straight from
        your app to the shop&rsquo;s account, and cash never comes near us. The shop&rsquo;s phone
        number is on its own page and on your order. Please contact them.
      </p>

      <h2>Try before you pay</h2>
      <p>
        Every new shop gets {TRIAL_DAYS} days of the Pro plan free, with no card, no advance and
        nothing to cancel. That is deliberately the answer to &ldquo;is this worth paying
        for&rdquo; — decide during the trial and you never pay for something you did not want.
      </p>

      <h2>Cancelling</h2>
      <p>
        Tell us and we will stop the subscription. There is no notice period and no cancellation
        fee. Your shop keeps working until the end of the period you have already paid for.
      </p>
      <p>
        You do not have to tell us at all if you would rather not: a subscription that is simply
        not renewed steps down on its own — editing stops, the shop page stays live for{' '}
        {AUTO_PAUSE_DAYS} days so customers who did nothing wrong are not turned away, and it then
        goes offline. Nothing is charged automatically at any point.
      </p>

      <h2>Refunds</h2>
      <p>We will refund a subscription payment in these cases:</p>
      <ul>
        <li>
          <strong>Paid twice, or paid the wrong amount.</strong> Refunded in full, and we would
          rather find these ourselves than wait to be asked.
        </li>
        <li>
          <strong>Paid, and the shop was never activated.</strong> Refunded in full.
        </li>
        <li>
          <strong>{BRAND_NAME} was unusable for a meaningful stretch</strong> because of a fault
          on our side. Refunded for the days affected, or those days added to your plan —
          whichever you prefer.
        </li>
        <li>
          <strong>Paid within the last 7 days and you have changed your mind.</strong> Refunded in
          full, provided the trial had not already run.
        </li>
      </ul>
      <p>
        Outside those, a period already begun is not refunded part-way through, because the
        service was there to be used for it. We will always look at a case on its facts — if
        something has genuinely gone wrong for your shop, tell us.
      </p>

      <h2>How a refund is paid</h2>
      <p>
        Back to the UPI ID or account the payment came from, and to no other. We aim to send it
        within <strong>5 working days</strong> of agreeing it; how long it then takes to appear is
        up to your bank, usually another 2 to 5 working days.
      </p>

      <h2>Asking for one</h2>
      <p>
        {support.phone ? (
          <>
            Call or message <a href={`tel:+91${support.phone}`}>{support.phone}</a> with your shop
            name, the date of the payment and the amount.
          </>
        ) : (
          <>Contact us with your shop name, the date of the payment and the amount.</>
        )}{' '}
        We will reply within 2 working days and tell you either way.
      </p>

      <h2>Contact</h2>
      <p>
        {COMPANY.name}, {companyLocation()} — details on the{' '}
        <a href="/contact">contact page</a>.
      </p>
    </LegalPage>
  );
}
