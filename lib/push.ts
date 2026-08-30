/**
 * Web push — the sound that tells a shopkeeper an order has arrived.
 *
 * WHY THIS EXISTS AT ALL. A customer scans the code, chooses, and taps Place
 * order. The row appears in the database instantly, and until now the shop
 * learned about it whenever somebody next happened to open the app. A kirana
 * cannot watch a screen; that gap is how an order sits for two hours and a
 * customer decides the thing does not work.
 *
 * WHY NOT WHATSAPP. Sending a WhatsApp message from a server needs the
 * Business API: Meta approval, a BSP, and a per-message cost on every order in
 * every shop. Web push is free, needs nobody's permission but the owner's, and
 * fires the moment the row is created.
 *
 * WHAT THIS IS NOT. It is not the system of record and must never be described
 * as one. Xiaomi, Oppo, Vivo and Realme kill background processes hard, and
 * this market is built out of exactly those phones — a push arrives late, or
 * not at all, and no amount of code fixes it. So: the orders screen, the
 * WhatsApp buttons and the tracking page all work identically with this
 * switched off, nothing in the product promises a shopkeeper they will be told,
 * and every send is fire-and-forget. A push that fails must never fail an
 * order.
 *
 * The keys live in three env vars. With any of them missing, every function
 * here quietly does nothing and the rest of the product is unaffected — which
 * is the correct behaviour on a deployment that has not set them up yet.
 */

import webpush from 'web-push';
import { prisma } from './prisma';

/** What a notification carries. Read by the `push` handler in the worker. */
export type PushPayload = {
  title: string;
  body: string;
  /** Where tapping it should land. Always a path on this origin. */
  url: string;
  /**
   * Collapses repeats on the device. Two orders arriving a second apart should
   * be two notifications; a status change re-sent for the same order should
   * replace the one already showing.
   */
  tag?: string;
};

export function pushConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT,
  );
}

let configured = false;

function ensureConfigured(): boolean {
  if (!pushConfigured()) return false;
  if (!configured) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT!,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    );
    configured = true;
  }
  return true;
}

/**
 * Sends to every device in `where`, and forgets the dead ones.
 *
 * A push service answers 404 or 410 for an endpoint that no longer exists —
 * the app was uninstalled, the browser data cleared, the permission revoked.
 * Those rows are deleted here rather than retried forever: a subscription table
 * nobody prunes grows into a list of ghosts that slow every send down.
 *
 * Never throws. Callers are hooking this onto an order being placed or worked,
 * and neither of those may fail because a notification did.
 */
export async function sendPush(
  where: { shopId: string; role: 'OWNER' | 'CUSTOMER'; customerPhone?: string },
  payload: PushPayload,
): Promise<{ sent: number; removed: number }> {
  if (!ensureConfigured()) return { sent: 0, removed: 0 };

  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        shopId: where.shopId,
        role: where.role,
        // Only meaningful for a customer. Passing it for an owner would match
        // nothing, so it is only applied when given.
        ...(where.customerPhone ? { customerPhone: where.customerPhone } : {}),
      },
      select: { id: true, endpoint: true, p256dh: true, auth: true },
    });

    if (subscriptions.length === 0) return { sent: 0, removed: 0 };

    const body = JSON.stringify(payload);
    const dead: string[] = [];
    let sent = 0;

    await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: { p256dh: subscription.p256dh, auth: subscription.auth },
            },
            body,
            // A phone that is off overnight should still find the order in the
            // morning; one that has been off for a day should not be told about
            // an order that was cooked and eaten. Twelve hours is the shape of
            // a shop's day.
            { TTL: 60 * 60 * 12, urgency: 'high' },
          );
          sent += 1;
        } catch (error) {
          const status = (error as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) dead.push(subscription.id);
        }
      }),
    );

    if (dead.length > 0) {
      await prisma.pushSubscription.deleteMany({ where: { id: { in: dead } } });
    }

    return { sent, removed: dead.length };
  } catch {
    // A push is never worth an error page. The order is already saved.
    return { sent: 0, removed: 0 };
  }
}
