/**
 * The order statuses the app works with.
 *
 * THERE IS NO "READY" STEP (removed 2026-09-24, and from the code 2026-10-01).
 * An order goes from waiting straight to done, and the customer hears about it
 * from the bill the owner sends. The database enum still declares READY,
 * because dropping an enum value is a destructive schema change on a database
 * that has lost its data to one before; no row carries it (checked 2026-10-01)
 * and `orderStatusSchema` refuses it, so nothing can set it again.
 */

export type OrderStatus = 'NEW' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

/** Still to be done by the shop: the queue, the bell and the home count. */
export const WAITING_STATUSES: ('NEW' | 'CONFIRMED')[] = ['NEW', 'CONFIRMED'];

export function isWaiting(status: string): boolean {
  return status === 'NEW' || status === 'CONFIRMED';
}

/**
 * A status as read from the database, in the app's terms. The enum still
 * declares READY (see above); should a row ever carry it, it is an order being
 * prepared.
 */
export function appStatus(status: OrderStatus | 'READY'): OrderStatus {
  return status === 'READY' ? 'CONFIRMED' : status;
}
