import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { prisma } from './prisma';
import { requireAdmin } from './guard';
import { OWNER_COOKIE, readOwnerToken } from './auth';
import { entitlementFrom, type ShopEntitlement } from './billing';
import { PLAN_SPECS, planFor } from './plans';
import type { Locale } from './i18n';
import type { PlanState } from '@/components/owner/PlanBanner';
import type { RoadblockState } from '@/components/owner/SubscriptionRoadblock';
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
    // The cheapest plan that actually holds this shop's catalogue, so the
    // payment dialog opens on the right one instead of making an owner work out
    // which tier they are. Quoting the entry tier to a shop with 180 items and
    // then refusing those items after they pay is how a first payment becomes a
    // refund.
    suggested: planFor(billing.itemCount).id,
    helpUrl: supportUrl(shop.name, shop.slug),
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

  return {
    reason: billing.autoPaused ? 'paused' : 'trial-over',
    planName: planFor(billing.itemCount).name,
    itemCount: billing.itemCount,
    suggested: planFor(billing.itemCount).id,
    helpUrl: supportUrl(shop.name, shop.slug),
  };
}

/**
 * A chat with the operator, or nothing at all.
 *
 * IT NO LONGER FALLS BACK TO /pricing. It used to, and that was the wrong end
 * of the product to send a signed-in shopkeeper to: /pricing is a page for
 * somebody deciding whether to buy, it does not know which shop is reading it,
 * and it cannot take a payment. An owner who tapped "Upgrade" and landed on a
 * marketing page had been sent backwards.
 *
 * Blank when there is no support number, and every caller hides its WhatsApp
 * button on blank rather than rendering one that goes nowhere. Paying does not
 * depend on this — the payment dialog does that on its own.
 */
function supportUrl(shopName: string, slug: string): string {
  const support = process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? '';
  if (!support) return '';
  const text = encodeURIComponent(`${BRAND_NAME} — ${shopName} (${slug}).`);
  return `https://wa.me/${support}?text=${text}`;
}
