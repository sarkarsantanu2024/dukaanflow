import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { prisma } from './prisma';
import { requireAdmin } from './guard';
import { OWNER_COOKIE, readOwnerToken } from './auth';
import { entitlementFrom, type ShopEntitlement } from './billing';
import { PLAN_SPECS, planFor, yearPrice, yearSaving } from './plans';
import { baseUrl } from './qr';
import type { Locale } from './i18n';
import type { PlanState } from '@/components/owner/PlanBanner';
import { planPayUrl, type RoadblockState } from '@/components/owner/SubscriptionRoadblock';
import { BRAND_NAME } from './brand';

/**
 * Everything the three owner screens share: the access check, the shop, and
 * the plan state that decides what they may do.
 *
 * Middleware has already checked the cookie's signature on the Edge. This
 * re-check runs on Node with a database, which is the only place a PIN that
 * has since been revoked can actually be noticed.
 */
/**
 * ONE ROUND TRIP, NOT THREE.
 *
 * This used to read the same Shop row three times, one after another: once in
 * `currentOwnerSlug` to check the PIN version, once here for the shop itself,
 * and once inside `shopEntitlement` for the plan columns — each waiting on the
 * one before it. Every owner screen paid for all three before it could begin
 * rendering, so switching from Items to Sell sat on a blank page for as long as
 * the database took to answer three sequential questions about one row. On a
 * phone talking to a serverless function talking to a pooled Postgres that is
 * most of a second of nothing, and it is the whole reason the app felt slow.
 *
 * They are one query now, running alongside the item count, and the session is
 * verified against the row in memory — exactly the comparison `currentOwnerSlug`
 * was making, on data we were fetching anyway.
 */
export async function loadOwnerShop(slug: string) {
  const store = await cookies();
  const [session, admin] = await Promise.all([
    readOwnerToken(store.get(OWNER_COOKIE)?.value),
    requireAdmin(),
  ]);

  const [shop, itemCount] = await Promise.all([
    prisma.shop.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        phone: true,
        upiId: true,
        upiQrData: true,
        labourPhone: true,
        ownerImageData: true,
        locale: true,
        active: true,
        openTime: true,
        closeTime: true,
        closedNote: true,
        noticeText: true,
        noticeFrom: true,
        noticeTo: true,
        // The terms the shop trades on, which the shopkeeper sets themselves.
        deliveryEnabled: true,
        deliveryFeePaise: true,
        freeDeliveryAbovePaise: true,
        minOrderPaise: true,
        // Read here rather than in a second query: the PIN version is what
        // makes revocation real, and the plan columns are what decide whether
        // this owner may still edit anything.
        ownerPinHash: true,
        ownerPinSetAt: true,
        plan: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        currentPeriodEnd: true,
      },
    }),
    prisma.item.count({ where: { shop: { slug } } }),
  ]);
  if (!shop) notFound();

  /**
   * The same test `currentOwnerSlug` ran, against the row already in hand.
   *
   * A signature that is merely valid is not enough — middleware checked that on
   * the Edge. The PIN behind the session has to still exist and still be the
   * one it was issued against, or clearing a shop's PIN would leave every phone
   * holding a 30-day token signed in regardless.
   */
  const ownsThisShop =
    session !== null &&
    session.slug === slug &&
    shop.active &&
    shop.ownerPinHash !== null &&
    shop.ownerPinSetAt !== null &&
    shop.ownerPinSetAt.getTime() === session.pinVersion;

  if (!ownsThisShop && !admin) redirect(`/owner/${slug}/login`);

  const billing: ShopEntitlement = entitlementFrom(shop, itemCount);

  const plan: PlanState = {
    planName: billing?.plan.name ?? PLAN_SPECS.FREE.name,
    status: billing?.status ?? 'ACTIVE',
    itemCount: billing?.itemCount ?? 0,
    itemLimit: billing?.itemLimit ?? 25,
    canEdit: billing?.canEdit ?? true,
    trialDaysLeft: billing?.trialDaysLeft ?? null,
    renewUrl: renewUrl(shop.name, shop.slug),
  };

  return {
    shop,
    plan,
    roadblock: roadblockFor(shop, billing),
    locale: (shop.locale as Locale) ?? 'en',
  };
}

/**
 * The roadblock to show, or null when the owner may carry on working.
 *
 * The plan quoted is the cheapest one that actually fits this shop's catalogue,
 * not the one they were last on. An owner who listed 180 items during the trial
 * should be quoted for 180 items; quoting them the entry tier and then refusing
 * their items after they pay is how a first payment becomes a refund.
 */
function roadblockFor(
  shop: { name: string; slug: string },
  billing: ShopEntitlement | null,
): RoadblockState | null {
  if (!billing || billing.canEdit) return null;

  const spec = planFor(billing.itemCount);
  const upiId = process.env.NEXT_PUBLIC_ADMIN_UPI_ID ?? '';

  return {
    reason: billing.autoPaused ? 'paused' : 'trial-over',
    planName: spec.name,
    planPriceRupees: spec.price,
    planYearRupees: yearPrice(spec.id),
    planYearSavingRupees: yearSaving(spec.id),
    planItemLimit: spec.itemLimit,
    itemCount: billing.itemCount,
    // Two intents, built here rather than in the component: the amount is
    // inside the QR, so it must come from the same price list the server
    // charges from and never from arithmetic done in the browser.
    payUrl: planPayUrl(upiId, spec.name, spec.price),
    payUrlYear: planPayUrl(upiId, `${spec.name} 1yr`, yearPrice(spec.id)),
    upiId,
    helpUrl: renewUrl(shop.name, shop.slug),
  };
}

/**
 * Upgrading is a WhatsApp conversation with the Halkhata operator, not a
 * checkout page. That is deliberate for this market: shopkeepers pay by UPI to
 * a person they have spoken to, and a card form would lose most of them.
 */
function renewUrl(shopName: string, slug: string): string {
  const support = process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? '';
  const message = `${BRAND_NAME} — ${shopName} (${slug}). I want to upgrade my plan.`;
  const text = encodeURIComponent(message);
  return support
    ? `https://wa.me/${support}?text=${text}`
    : `${baseUrl()}/pricing`;
}
