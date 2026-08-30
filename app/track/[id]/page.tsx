import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { SiteFooter } from '@/components/ui/SiteFooter';
import { TrackScreen, type TrackedOrder } from '@/components/customer/TrackScreen';

/**
 * One order, as its customer sees it.
 *
 * NO LOGIN, AND THERE NEVER WILL BE ONE. Asking somebody to register before a
 * kirana can tell them their rice is ready would cost more orders than the
 * whole page is worth. The order id is a random uuid, it is handed to exactly
 * one person — the one who placed the order — and nothing else on the site
 * reveals it. That is the authorisation, and it is the same reasoning the push
 * subscribe route runs on.
 *
 * Nothing here is indexed. An order is one household's business, and a search
 * engine that found one would be a leak with no upside.
 */
export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: 'Your order — DukaanFlow',
  robots: { index: false, follow: false },
};

/** The snapshot, narrowed out of JSON — see the note in the order PUT route. */
function toLines(itemsJson: unknown): TrackedOrder['lines'] {
  if (!Array.isArray(itemsJson)) return [];
  const num = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  return itemsJson.flatMap((raw) => {
    if (!raw || typeof raw !== 'object') return [];
    const row = raw as Record<string, unknown>;
    return [
      {
        name: String(row.name ?? ''),
        nameBn: String(row.nameBn ?? ''),
        nameHi: String(row.nameHi ?? ''),
        unit: String(row.unit ?? ''),
        quantity: num(row.quantity),
        // Old rows carry rupees under a bare name. Reading one as paise would
        // show a ₹130 order as ₹1.30 to the person who paid it.
        amountPaise:
          row.amountPaise !== undefined
            ? num(row.amountPaise)
            : Math.round(num(row.lineTotal ?? row.amount) * 100),
      },
    ];
  });
}

export default async function TrackPage({ params }: PageProps) {
  const { id } = await params;

  // A malformed id is a 404 rather than a database error — this link is pasted
  // between phones and truncated by every chat app that has ever existed.
  const order = /^[0-9a-f-]{36}$/i.test(id)
    ? await prisma.order.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          orderType: true,
          totalAmountPaise: true,
          deliveryFeePaise: true,
          revisedAt: true,
          createdAt: true,
          itemsJson: true,
          customerName: true,
          shop: { select: { name: true, slug: true, phone: true } },
        },
      })
    : null;

  return (
    <>
      <TrackScreen
        order={
          order && {
            id: order.id,
            status: order.status,
            orderType: order.orderType,
            totalAmountPaise: order.totalAmountPaise,
            deliveryFeePaise: order.deliveryFeePaise,
            revised: order.revisedAt !== null,
            placedAt: order.createdAt.toISOString(),
            customerName: order.customerName,
            shopName: order.shop.name,
            shopSlug: order.shop.slug,
            shopPhone: order.shop.phone,
            lines: toLines(order.itemsJson),
          }
        }
      />
      <SiteFooter />
    </>
  );
}
