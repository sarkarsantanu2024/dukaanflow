import { prisma } from './prisma';
import { entitlement, type Entitlement, type Plan, type SubStatus } from './plans';

/**
 * Server-side billing checks.
 *
 * The rule the whole business rests on: a shop may keep as many items as its
 * plan allows. It is enforced here, on the server, for every path that can
 * create an item — the single form, voice, and the bulk paste — because a limit
 * enforced only in the UI is not a limit.
 */

export type ShopEntitlement = Entitlement & {
  itemCount: number;
  /** How many more items may be created right now. */
  remaining: number;
  atLimit: boolean;
};

const BILLING_SELECT = {
  plan: true,
  subscriptionStatus: true,
  trialEndsAt: true,
  currentPeriodEnd: true,
} as const;

export async function shopEntitlement(shopId: string): Promise<ShopEntitlement | null> {
  const [shop, itemCount] = await Promise.all([
    prisma.shop.findUnique({ where: { id: shopId }, select: BILLING_SELECT }),
    prisma.item.count({ where: { shopId } }),
  ]);
  if (!shop) return null;

  const base = entitlement({
    plan: shop.plan as Plan,
    subscriptionStatus: shop.subscriptionStatus as SubStatus,
    trialEndsAt: shop.trialEndsAt,
    currentPeriodEnd: shop.currentPeriodEnd,
  });

  const remaining = Math.max(0, base.itemLimit - itemCount);
  return { ...base, itemCount, remaining, atLimit: remaining === 0 };
}

export type BillingRefusal = { status: 402 | 403; message: string };

/**
 * May this shop create `count` more items?
 *
 * Returns a refusal rather than throwing, so each route can answer in its own
 * shape. The messages are written for the shopkeeper who will read them on a
 * phone, not for a developer reading a log.
 */
export async function checkItemAllowance(
  shopId: string,
  count = 1,
): Promise<BillingRefusal | null> {
  const state = await shopEntitlement(shopId);
  if (!state) return { status: 403, message: 'Shop not found' };

  if (!state.canEdit) {
    return {
      status: 402,
      message: 'Your subscription has ended. Renew to add or change items — your shop page and QR keep working.',
    };
  }

  if (state.itemCount + count > state.itemLimit) {
    const room = Math.max(0, state.itemLimit - state.itemCount);
    return {
      status: 402,
      message:
        room === 0
          ? `Your ${state.plan.name} plan holds ${state.itemLimit} items and you have used them all. Upgrade to add more.`
          : `Your ${state.plan.name} plan has room for ${room} more item${room === 1 ? '' : 's'}. Upgrade to add the rest.`,
    };
  }

  return null;
}

/** Editing an item the shop already has is allowed up to the grace window. */
export async function checkEditAllowance(shopId: string): Promise<BillingRefusal | null> {
  const state = await shopEntitlement(shopId);
  if (!state) return { status: 403, message: 'Shop not found' };
  if (state.canEdit) return null;

  return {
    status: 402,
    message: 'Your subscription has ended. Renew to change prices — your shop page and QR keep working.',
  };
}

/**
 * Stamps the moment a shop first lists anything. This is the activation metric:
 * without it there is no way to tell an owner who was onboarded from one who
 * actually started.
 */
export async function markActivated(shopId: string): Promise<void> {
  await prisma.shop.updateMany({
    where: { id: shopId, activatedAt: null },
    data: { activatedAt: new Date() },
  });
}
