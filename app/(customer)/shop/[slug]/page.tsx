import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { StoreFront } from '@/components/customer/StoreFront';
import { formatClockRange } from '@/lib/hours';
import { liveNotice } from '@/lib/notice';
import { SHOP_TYPE_LABELS } from '@/lib/validators';
import { SiteFooter } from '@/components/ui/SiteFooter';
import { entitlement, type Plan, type SubStatus } from '@/lib/plans';

// The menu changes whenever the admin edits an item, so this page is always
// rendered fresh. Reads go straight to Prisma — no API hop for GETs.
export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ slug: string }> };

async function loadShop(slug: string) {
  return prisma.shop.findUnique({
    where: { slug },
    select: {
      name: true,
      slug: true,
      type: true,
      phone: true,
      address: true,
      upiId: true,
      active: true,
      openTime: true,
      closeTime: true,
      closedNote: true,
      noticeText: true,
      noticeFrom: true,
      noticeTo: true,
      deliveryEnabled: true,
      plan: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      currentPeriodEnd: true,
      ownerName: true,
      imageData: true,
      ownerImageData: true,
      items: {
        // An unpriced row is not a product yet, whatever its stock says.
        //
        // The guard used to be `price > 1`, which quietly hid every genuine one
        // rupee item a kirana sells — a toffee, a matchbox, one biscuit. A
        // placeholder price and a chosen price are different facts, so `priced`
        // records which this is and Re 1 can mean what it says.
        where: { priced: true },
        orderBy: [{ category: 'asc' }, { inStock: 'desc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          nameBn: true,
          nameHi: true,
          pricePaise: true,
          unit: true,
          category: true,
          inStock: true,
        },
      },
    },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const shop = await prisma.shop.findUnique({
    where: { slug },
    select: { name: true, type: true, address: true, phone: true },
  });
  if (!shop) return { title: 'Shop not found' };

  /**
   * What a scanner, WhatsApp or a search result shows for this link.
   *
   * The card image itself is `opengraph-image.tsx` beside this file, which the
   * framework attaches on its own. This is the text under it: the trade, where
   * the shop is, and the number to ring — the same three things the page opens
   * with, for anyone who has only the link.
   */
  const description = [SHOP_TYPE_LABELS[shop.type], shop.address, `+91 ${shop.phone}`]
    .filter(Boolean)
    .join(' · ');

  return {
    title: `${shop.name} — Order on WhatsApp`,
    description,
    openGraph: { title: shop.name, description, type: 'website' },
    twitter: { card: 'summary_large_image', title: shop.name, description },
  };
}

export default async function ShopPage({ params }: PageProps) {
  const { slug } = await params;
  const shop = await loadShop(slug);

  if (!shop) notFound();

  const hours = formatClockRange(shop.openTime, shop.closeTime);
  // Checked here, not in the browser: a notice whose run has ended must not
  // reach the page at all, and a client-side date is the shopper's clock rather
  // than the shop's.
  const notice = liveNotice(shop);

  // Three months unpaid takes the storefront offline. Derived on read rather
  // than stored, so it lifts the instant a payment is recorded — an owner who
  // has just paid must not wait on a nightly job to reopen.
  const billing = entitlement({
    plan: shop.plan as Plan,
    subscriptionStatus: shop.subscriptionStatus as SubStatus,
    trialEndsAt: shop.trialEndsAt,
    currentPeriodEnd: shop.currentPeriodEnd,
  });

  if (!shop.active || billing.autoPaused) {
    return (
      <>
      {/* `flex-1` rather than `min-h-dvh`: the page is now a column with a
          footer under it, and a main that is a full screen tall on its own
          would push that footer off the bottom of every closed shop. */}
      <main className="mx-auto flex min-h-[80dvh] max-w-md flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-5xl">🔒</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">{shop.name}</h1>
        <p className="mt-2 text-slate-600">
          This shop is not accepting orders right now. / এই দোকান এখন অর্ডার নিচ্ছে না। / यह दुकान अभी
          ऑर्डर नहीं ले रही है।
        </p>

        {/* The shopkeeper's own words. The difference between a customer
            trying again tomorrow and deciding the shop has gone.

            Their running notice serves when there is no closure note, because a
            shop that is shut with something to say has usually said it there —
            "back from the village on the 5th" answers this page's question
            exactly. */}
        {(shop.closedNote || notice) && (
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-base font-medium text-amber-900">
            {shop.closedNote || notice}
          </p>
        )}

        {hours && <p className="mt-3 text-sm text-slate-500">{hours}</p>}
      </main>
      <SiteFooter />
      </>
    );
  }

  const {
    items,
    active: _active,
    closedNote: _note,
    noticeText: _noticeText,
    noticeFrom: _noticeFrom,
    noticeTo: _noticeTo,
    plan: _plan,
    subscriptionStatus: _status,
    trialEndsAt: _trialEnds,
    currentPeriodEnd: _periodEnd,
    ...summary
  } = shop;
  // `notice` rather than the three stored columns: the page has already decided
  // whether it is running, and handing the browser the dates would invite a
  // second, different answer.
  return (
    <>
      <StoreFront shop={{ ...summary, notice }} items={items} />
      {/* Outside the storefront, so it is the last thing on the page rather
          than another block inside the menu. */}
      <SiteFooter />
    </>
  );
}
