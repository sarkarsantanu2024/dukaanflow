import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ShopForm } from '@/components/admin/ShopForm';
import { QrPanel } from '@/components/admin/QrPanel';
import { DeleteShopButton } from '@/components/admin/DeleteShopButton';
import { OwnerAccessPanel } from '@/components/admin/OwnerAccessPanel';
import { SubscriptionPanel } from '@/components/admin/SubscriptionPanel';
import { ShopPhotos } from '@/components/admin/ShopPhotos';
import { shopEntitlement } from '@/lib/billing';
import { formatRupees } from '@/lib/money';
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
      address: true,
      upiId: true,
      active: true,
      id: true,
      ownerPinHash: true,
      ownerPinSetAt: true,
      ownerName: true,
      locale: true,
      imageData: true,
      ownerImageData: true,
      plan: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      currentPeriodEnd: true,
      activatedAt: true,
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, amount: true, plan: true, periodEnd: true, method: true },
      },
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          customerName: true,
          customerPhone: true,
          orderType: true,
          totalAmount: true,
          createdAt: true,
        },
      },
      _count: { select: { orders: true, items: true } },
    },
  });

  if (!shop) notFound();

  const billing = await shopEntitlement(shop.id);

  return (
    <div className="min-h-dvh bg-slate-100">
      <AdminHeader title={shop.name} backHref="/admin">
        <Link
          href={`/admin/shop/${shop.slug}/items`}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Items ({shop._count.items})
        </Link>
        <Link
          href={`/admin/shop/${shop.slug}/poster`}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          🖨 QR poster
        </Link>
      </AdminHeader>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <QrPanel slug={shop.slug} shopName={shop.name} upiId={shop.upiId} />

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Shop details
          </h2>
          <ShopForm
            editingSlug={shop.slug}
            initial={{
              name: shop.name,
              ownerName: shop.ownerName,
              locale: shop.locale as 'en' | 'bn' | 'hi',
              slug: shop.slug,
              type: shop.type,
              phone: shop.phone,
              address: shop.address,
              upiId: shop.upiId,
              active: shop.active,
            }}
          />
        </section>

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
              amount: payment.amount,
              plan: payment.plan,
              periodEnd: payment.periodEnd.toISOString(),
              method: payment.method,
            })),
          }}
        />

        <ShopPhotos
          slug={shop.slug}
          imageData={shop.imageData}
          ownerImageData={shop.ownerImageData}
        />

        <OwnerAccessPanel
          slug={shop.slug}
          baseUrl={baseUrl()}
          hasPin={Boolean(shop.ownerPinHash)}
          setAt={shop.ownerPinSetAt ? shop.ownerPinSetAt.toLocaleDateString('en-IN') : null}
        />

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Recent orders ({shop._count.orders})
          </h2>
          <div className="rounded-2xl bg-white p-4 shadow-card">
            {shop.orders.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-500">
                No orders yet. Orders appear here the moment a customer sends one on WhatsApp.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {shop.orders.map((order) => (
                  <li key={order.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {order.customerName || 'Guest'} · {order.customerPhone}
                      </p>
                      <p className="text-xs text-slate-500">
                        {order.orderType === 'DELIVERY' ? 'Delivery' : 'Pickup'} ·{' '}
                        {order.createdAt.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <p className="shrink-0 font-bold text-slate-900">
                      {formatRupees(order.totalAmount)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <h2 className="font-semibold text-red-800">Danger zone</h2>
          <p className="mb-3 mt-1 text-sm text-red-700">
            Deleting removes the shop, its items and its order history. The QR stops working.
          </p>
          <DeleteShopButton slug={shop.slug} shopName={shop.name} />
        </section>
      </main>
    </div>
  );
}
