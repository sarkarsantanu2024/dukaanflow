import type { Metadata } from 'next';
import { LegalPage } from '@/components/ui/LegalPage';
import { COMPANY, companyLocation } from '@/lib/company';
import { BRAND_NAME } from '@/lib/brand';
import { AUTO_PAUSE_DAYS, GRACE_DAYS, TRIAL_DAYS } from '@/lib/plans';
import { RETENTION_YEARS } from '@/lib/retention';

/**
 * The agreement, in the words the product actually behaves in.
 *
 * NUMBERS COME FROM THE CODE, NOT FROM THIS FILE — the trial length, the grace
 * period and the pause window are imported, so a term can never drift from what
 * the software does to a shop. That drift is the usual way terms of service
 * become untrue, and here it would be untrue about somebody's livelihood.
 *
 * PRICES ARE NOT QUOTED, deliberately. They change; the pricing page is the one
 * place that carries them, and a figure repeated here would be the stale one
 * somebody quotes back at us.
 */
export const metadata: Metadata = {
  title: `Terms of Service — ${BRAND_NAME}`,
  description: `The terms on which ${COMPANY.name} provides ${BRAND_NAME} to shopkeepers.`,
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro={`The agreement between you and ${COMPANY.name} for the use of ${BRAND_NAME}.`}
    >
      <p>
        These terms apply when you use {BRAND_NAME}, operated by {COMPANY.name},{' '}
        {companyLocation()}. Using the service means you accept them. If you are accepting on
        behalf of a shop, you confirm you may bind that shop.
      </p>

      <h2>What the service is</h2>
      <p>
        {BRAND_NAME} is software for running a small shop: listing what you sell, taking orders
        from a QR code, ringing up sales at the counter and keeping a credit book. We provide the
        software. <strong>We are not a party to anything you sell.</strong> The contract for goods
        is between the shop and its customer, and the shop is responsible for its own prices,
        stock, weights, quality, delivery and any tax it owes.
      </p>
      <p>
        <strong>We take no commission on your orders</strong>, whatever their number or value.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>Your shop is reached with a six-digit PIN or a single-use invite link. Keep them to
          yourself — anyone holding them can act as your shop.</li>
        <li>Tell us at once if you think somebody else has got in.</li>
        <li>You are responsible for what is done through your shop&rsquo;s account.</li>
        <li>You must be able to enter a contract under Indian law to run a shop here.</li>
      </ul>

      <h2>Payment, and what happens when it stops</h2>
      <p>
        Plans are priced per shop by how many items you list, and are set out on the{' '}
        <a href="/pricing">pricing page</a>, which is the only place prices are stated.{' '}
        <strong>Prices and plan limits can change.</strong> A change will not alter a period you
        have already paid for, and we will tell shopkeepers in the app before a new price applies
        to them.
      </p>
      <p>A new shop starts on {TRIAL_DAYS} days of the Pro plan, free, with nothing to pay up front.</p>
      <p>When a paid period ends and is not renewed, the service steps down rather than stopping:</p>
      <ul>
        <li>
          For the first {GRACE_DAYS} days you carry on as normal.
        </li>
        <li>
          After that you can no longer edit your items, but{' '}
          <strong>your shop page stays live and customers can still order</strong>, your counter
          till still works, and your credit book is still yours to read and write. We do not take
          a working shop offline over a late payment.
        </li>
        <li>
          Only after {AUTO_PAUSE_DAYS} days unpaid does the shop page itself go offline. Paying
          brings it straight back.
        </li>
      </ul>
      <p>
        Paying by UPI to the account shown in the app is how a subscription is renewed. Your
        payment is confirmed by us before the plan resumes.
      </p>

      <h2>Your data, and ours</h2>
      <p>
        Your item list, your orders and your credit book are <strong>yours</strong>. You can
        export the credit book as a spreadsheet or a PDF from inside the app at any time, without
        asking us, and you can ask us for the rest.
      </p>
      <p>
        Orders and counter sales are kept for {RETENTION_YEARS === 1 ? 'one subscription year' : `${RETENTION_YEARS} subscription years`}{' '}
        and are then deleted, after being summarised into figures that name nobody. See the{' '}
        <a href="/privacy">privacy policy</a>.
      </p>
      <p>
        The software, the {BRAND_NAME} name and the design remain ours. You may use them to run
        your shop and for nothing else.
      </p>

      <h2>What you must not do</h2>
      <ul>
        <li>List anything you may not lawfully sell, or describe goods in a way that misleads a
          customer.</li>
        <li>Use the service to send unsolicited messages to people who have not dealt with your
          shop.</li>
        <li>Try to reach another shop&rsquo;s data, break the service, or work around its limits.</li>
        <li>Resell or rebrand the service without our written agreement.</li>
      </ul>
      <p>
        We may suspend a shop that does any of these, and will say why.
      </p>

      <h2>Availability</h2>
      <p>
        We work to keep {BRAND_NAME} running and available, but we do not promise it will never be
        interrupted. Maintenance, a hosting failure or a network problem can take it offline.
        Notifications are delivered by the browser vendor&rsquo;s push service and can be delayed
        or dropped by the phone — <strong>do not rely on a notification alone</strong> for
        anything that matters; the orders screen is the record.
      </p>

      <h2>Liability</h2>
      <p>
        {BRAND_NAME} is provided as it is. To the extent the law allows, we are not liable for
        lost profits, lost sales or lost data, and our total liability for any claim is limited to
        what that shop paid us in the twelve months before the claim.
      </p>
      <p>Nothing here limits liability that cannot lawfully be limited.</p>

      <h2>Ending it</h2>
      <p>
        You can stop using {BRAND_NAME} whenever you like and ask us to delete your shop. We can
        end the agreement for a serious or repeated breach of these terms. See the{' '}
        <a href="/refund">refunds and cancellation policy</a> for what happens to money already
        paid.
      </p>

      <h2>Law</h2>
      <p>
        These terms are governed by the law of India, and the courts of {COMPANY.city},{' '}
        {COMPANY.state} have jurisdiction.
      </p>

      <h2>Contact</h2>
      <p>
        {COMPANY.name}, {companyLocation()} — details on the{' '}
        <a href="/contact">contact page</a>.
      </p>
    </LegalPage>
  );
}
