import { notFound, redirect } from 'next/navigation';
import { prisma } from './prisma';
import { currentOwnerSlug, requireAdmin } from './guard';
import { shopEntitlement } from './billing';
import { baseUrl } from './qr';
import type { Locale } from './i18n';
import type { PlanState } from '@/components/owner/PlanBanner';

/**
 * Everything the three owner screens share: the access check, the shop, and
 * the plan state that decides what they may do.
 *
 * Middleware has already checked the cookie's signature on the Edge. This
 * re-check runs on Node with a database, which is the only place a PIN that
 * has since been revoked can actually be noticed.
 */
export async function loadOwnerShop(slug: string) {
  const [owner, admin] = await Promise.all([currentOwnerSlug(), requireAdmin()]);
  if (owner !== slug && !admin) redirect(`/owner/${slug}/login`);

  const shop = await prisma.shop.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      phone: true,
      upiId: true,
      locale: true,
    },
  });
  if (!shop) notFound();

  const billing = await shopEntitlement(shop.id);

  const plan: PlanState = {
    planName: billing?.plan.name ?? 'Free',
    status: billing?.status ?? 'ACTIVE',
    itemCount: billing?.itemCount ?? 0,
    itemLimit: billing?.itemLimit ?? 25,
    canEdit: billing?.canEdit ?? true,
    trialDaysLeft: billing?.trialDaysLeft ?? null,
    renewUrl: renewUrl(shop.name, shop.slug),
  };

  return { shop, plan, locale: (shop.locale as Locale) ?? 'en' };
}

/**
 * Upgrading is a WhatsApp conversation with the DukaanFlow operator, not a
 * checkout page. That is deliberate for this market: shopkeepers pay by UPI to
 * a person they have spoken to, and a card form would lose most of them.
 */
function renewUrl(shopName: string, slug: string): string {
  const support = process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? '';
  const message = `DukaanFlow — ${shopName} (${slug}). I want to upgrade my plan.`;
  const text = encodeURIComponent(message);
  return support
    ? `https://wa.me/${support}?text=${text}`
    : `${baseUrl()}/pricing`;
}
