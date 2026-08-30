import { notFound } from 'next/navigation';
import { formatDay, formatDayTime } from '@/lib/time';
import { prisma } from '@/lib/prisma';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { HeaderAction } from '@/components/admin/HeaderAction';
import { BoxIcon, PrinterIcon } from '@/components/ui/Icon';
import { ShopForm } from '@/components/admin/ShopForm';
import { QrPanel } from '@/components/admin/QrPanel';
import { DeleteShopButton } from '@/components/admin/DeleteShopButton';
import { OwnerAccessPanel } from '@/components/admin/OwnerAccessPanel';
import { SubscriptionPanel } from '@/components/admin/SubscriptionPanel';
import { shopEntitlement } from '@/lib/billing';
import { baseUrl } from '@/lib/qr';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ slug: string }> };

export default async function ShopDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const shop = await prisma.shop.findUnique({
    where: { slug },
    select: {
      name: true,
      slug: true,
      type: true,
      phone: true,
      labourPhone: true,
      address: true,
      state: true,
      openTime: true,
      closeTime: true,
      deliveryEnabled: true,
      isDemo: true,
      upiId: true,
      active: true,
      id: true,
      ownerPinHash: true,
      ownerPinSetAt: true,
      ownerName: true,
      locale: true,
      imageData: true,
      ownerImageData: true,
      upiQrData: true,
      plan: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      currentPeriodEnd: true,
      activatedAt: true,
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          amountPaise: true,
          plan: true,
          kind: true,
          itemsListed: true,
          periodEnd: true,
          method: true,
        },
      },
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          customerName: true,
          customerPhone: true,
          orderType: true,
          totalAmountPaise: true,
          createdAt: true,
        },
      },
      _count: { select: { orders: true, items: true } },
    },
  });

  if (!shop) notFound();

  const billing = await shopEntitlement(shop.id);

  return (
    <>
      <AdminHeader title={shop.name} backHref="/admin">
        <HeaderAction
          href={`/admin/shop/${shop.slug}/items`}
          label={`Items (${shop._count.items})`}
          icon={BoxIcon}
          variant="primary"
        />
        <HeaderAction
          href={`/admin/shop/${shop.slug}/poster`}
          label="QR poster"
          icon={PrinterIcon}
          hideOnMobile
        />
      </AdminHeader>

      {/* Editing on the left, reference on the right. The QR, the plan and the
          owner's access are things you look at while changing something else,
          so stacking them above the form pushed the form off the screen and
          left the width empty either side. */}
      {/* The reference column holds two QR codes side by side and a
          subscription form; at 380px their captions were breaking mid-word.
          It widens again on a larger monitor, where the space exists. */}
      <main className="grid items-start gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_440px] lg:px-6 2xl:grid-cols-[minmax(0,1fr)_520px]">
        <div className="min-w-0 space-y-6">
          <ShopForm
            initialImages={{
              imageData: shop.imageData,
              ownerImageData: shop.ownerImageData,
              upiQrData: shop.upiQrData,
            }}
            editingSlug={shop.slug}
            initial={{
              name: shop.name,
              ownerName: shop.ownerName,
              locale: shop.locale as 'en' | 'bn' | 'hi',
              slug: shop.slug,
              type: shop.type,
              phone: shop.phone,
              labourPhone: shop.labourPhone,
              address: shop.address,
              state: shop.state,
              openTime: shop.openTime,
              closeTime: shop.closeTime,
              deliveryEnabled: shop.deliveryEnabled,
              isDemo: shop.isDemo,
              upiId: shop.upiId,
              active: shop.active,
            }}
          />
        {/* The order list lived here and has gone to the owner's app, where it
            is worked rather than looked at. The console had a read-only copy of
            the same rows with no way to act on any of them, which made this the
            longest section on the page and the least useful. Counts stay on the
            dashboard; the queue belongs to whoever fills it. */}

        <section className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <h2 className="font-semibold text-red-800">Danger zone</h2>
          <p className="mb-3 mt-1 text-sm text-red-700">
            Deleting removes the shop, its items and its order history. The QR stops working.
          </p>
          <DeleteShopButton slug={shop.slug} shopName={shop.name} />
        </section>
        </div>

        <div className="space-y-6 lg:sticky lg:top-[4.25rem]">
          <QrPanel
            slug={shop.slug}
            shopName={shop.name}
            upiId={shop.upiId}
            upiQrData={shop.upiQrData}
          />

          <SubscriptionPanel
          slug={shop.slug}
          state={{
            plan: shop.plan,
            status: shop.subscriptionStatus,
            itemCount: billing?.itemCount ?? shop._count.items,
            itemLimit: billing?.itemLimit ?? 25,
            trialEndsAt: shop.trialEndsAt?.toISOString() ?? null,
            currentPeriodEnd: shop.currentPeriodEnd?.toISOString() ?? null,
            payments: shop.payments.map((payment) => ({
              id: payment.id,
              amountPaise: payment.amountPaise,
              plan: payment.plan,
              kind: payment.kind,
              itemsListed: payment.itemsListed,
              periodEnd: payment.periodEnd.toISOString(),
              method: payment.method,
            })),
          }}
        />

          <OwnerAccessPanel
            slug={shop.slug}
            baseUrl={baseUrl()}
            hasPin={Boolean(shop.ownerPinHash)}
            setAt={shop.ownerPinSetAt ? formatDay(shop.ownerPinSetAt) : null}
          />
        </div>

      </main>
    </>
  );
}
