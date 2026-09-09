import type { Metadata } from 'next';
import { LegalPage } from '@/components/ui/LegalPage';
import { COMPANY, companyLocation } from '@/lib/company';
import { BRAND_NAME } from '@/lib/brand';
import { supportDetails } from '@/lib/support';

/**
 * What this product does with people's data, said plainly.
 *
 * WRITTEN FROM THE CODE, NOT FROM A TEMPLATE. Every claim below is a fact
 * about this system and can be checked against it — the fields are the ones in
 * `prisma/schema.prisma`, the retention window is `RETENTION_YEARS` in
 * `lib/retention.ts`, and "we do not sell data" is true because there is no
 * code that could. Where a policy would normally hedge, this says the specific
 * thing instead: a shopkeeper who cannot understand the page cannot consent to
 * it, and most of the people signing up read Bengali more comfortably than
 * legal English.
 *
 * KEEP IT TRUE. If a field is added to an order, or an analytics script is
 * added to a page, this page is wrong until it is changed too.
 */
export const metadata: Metadata = {
  title: `Privacy Policy — ${BRAND_NAME}`,
  description: `How ${COMPANY.name} collects, uses and keeps the information in ${BRAND_NAME}.`,
  // Explicitly public. The root layout defaults everything to noindex so that
  // shops, orders and the console cannot leak into search; a policy nobody can
  // find is the opposite problem.
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  const support = supportDetails();

  return (
    <LegalPage
      title="Privacy Policy"
      intro={`What ${BRAND_NAME} collects, why, how long it is kept, and what you can ask us to do with it.`}
    >
      <p>
        {BRAND_NAME} is operated by {COMPANY.name}, {companyLocation()} (&ldquo;we&rdquo;,
        &ldquo;us&rdquo;). This policy covers the {BRAND_NAME} website, the shop pages we host
        for shopkeepers, and the owner and administrator applications.
      </p>

      <h2>Who the people here are</h2>
      <p>Two different groups, with different information:</p>
      <ul>
        <li>
          <strong>Shopkeepers</strong> — the people who use {BRAND_NAME} to run a shop.
        </li>
        <li>
          <strong>Customers</strong> — the people who scan a shop&rsquo;s QR code and place an
          order with that shop.
        </li>
      </ul>
      <p>
        For a customer&rsquo;s order details the shop is the one deciding what is collected and
        why; we hold and process it on that shop&rsquo;s behalf. If you are a customer and want an
        order changed or removed, the fastest route is to ask the shop, and you can also ask us.
      </p>

      <h2>What we collect</h2>
      <p>From a shopkeeper, when the shop is set up and used:</p>
      <ul>
        <li>Shop name, shop type, address, opening hours and the area it serves.</li>
        <li>The owner&rsquo;s name and mobile number, and a delivery helper&rsquo;s number if one
          is given.</li>
        <li>A UPI ID, if the shop chooses to accept UPI payments at its counter.</li>
        <li>The item list — names, prices, units, stock counts and any photographs uploaded.</li>
        <li>A six-digit sign-in PIN, stored only as a one-way hash. We cannot read it back.</li>
        <li>Sales rung up at the counter, and the credit book (khata) entries the shopkeeper
          writes.</li>
      </ul>
      <p>From a customer, when an order is placed:</p>
      <ul>
        <li>Name, mobile number and the locality (para) they are in.</li>
        <li>A delivery address, only when the order is for delivery.</li>
        <li>What was ordered, and what it came to.</li>
      </ul>
      <p>
        If either of you turns on notifications, the browser gives us a subscription for that one
        device — a URL and two encryption keys. They can only be used to send a notification to
        that device and nothing else.
      </p>
      <p>
        <strong>Voice.</strong> Adding items by speaking uses your own browser&rsquo;s speech
        recognition. What you say is handled by your browser and its operating system; we receive
        only the text it produces, and we do not store the audio.
      </p>

      <h2>What we do not do</h2>
      <ul>
        <li>We do not sell or rent anyone&rsquo;s information.</li>
        <li>We do not run advertising networks, ad pixels or third-party behavioural trackers on
          these pages.</li>
        <li>We do not take a commission on orders, so we have no reason to profile buyers.</li>
        <li>We never see or store a card number, a UPI PIN or a bank credential. A UPI payment
          happens in the customer&rsquo;s own payment app, between them and the shop.</li>
        <li>One shop can never see another shop&rsquo;s customers, orders or credit book.</li>
      </ul>

      <h2>Why we are allowed to hold it</h2>
      <p>
        Because it is needed to do the thing you asked for — showing a shop&rsquo;s items,
        delivering an order to the right address, telling a customer their order is ready, and
        keeping a shopkeeper&rsquo;s own accounts. Notifications are sent only to a device that
        has agreed to them, and that agreement can be withdrawn in the app or in the
        browser&rsquo;s own settings.
      </p>

      <h2>Who else touches it</h2>
      <p>
        Only the services that have to, and only so the product can run: our hosting and database
        providers, and the browser vendor&rsquo;s push service when a notification is sent. We do
        not pass information to anyone else except where the law requires it.
      </p>

      <h2>How long it is kept</h2>
      <p>
        Orders and counter sales are kept for <strong>one subscription year per shop</strong> and
        are then deleted automatically. Before they go, they are summarised into figures that
        carry no customer name, number or address, so a shop keeps its long-run reporting without
        us keeping the people in it.
      </p>
      <p>
        A shop&rsquo;s item list, credit book and settings are kept while the shop is with us. If
        a shop is deleted, everything belonging to it goes with it, including its customers and
        their orders.
      </p>

      <h2>Getting your data, or getting rid of it</h2>
      <p>
        A shopkeeper can export the credit book as a spreadsheet or a PDF from inside the app at
        any time, without asking us. Beyond that, you can ask us to give you a copy of what we
        hold about you, correct it, or delete it. Write to us at the number below and we will act
        on it as quickly as we can.
      </p>
      <p>
        Deleting a shop&rsquo;s data cannot be undone, and it removes the shop&rsquo;s own
        records of who owes it money. We will say so before doing it.
      </p>

      <h2>Keeping it safe</h2>
      <p>
        Traffic is encrypted in transit. Sign-in PINs and passwords are stored as one-way hashes.
        Sessions are held in signed, HTTP-only cookies. Access to the operator console is limited
        to {COMPANY.name} staff who need it. No system is perfect, and we will tell affected
        people promptly if something goes wrong.
      </p>

      <h2>Children</h2>
      <p>
        {BRAND_NAME} is a tool for running a shop and is not directed at children. We do not
        knowingly collect information from anyone under 18.
      </p>

      <h2>Changes</h2>
      <p>
        If this policy changes, the date at the top of this page changes with it. Material changes
        will be told to shopkeepers in the app.
      </p>

      <h2>Contact</h2>
      <p>
        {COMPANY.name}, {companyLocation()}.
        {support.phone && (
          <>
            {' '}
            Call or message <a href={`tel:+91${support.phone}`}>{support.phone}</a>.
          </>
        )}{' '}
        There is more on the <a href="/contact">contact page</a>.
      </p>
    </LegalPage>
  );
}
