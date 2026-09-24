/**
 * The orders this phone has placed, remembered on this phone.
 *
 * There are no customer accounts, and there will not be one for this: the
 * customer's bell only needs to know which order ids to ask about. Kept for 90
 * days and at most 20, newest first, which is more than a kirana's regular
 * places in that time.
 *
 * Nothing here goes to a server. The bell sends these ids to
 * `/api/order/status`, which answers from the orders themselves.
 */

const KEY = 'halkhata:my-orders';
const KEEP_DAYS = 90;
const KEEP_MOST = 20;

export type MyOrder = { id: string; slug: string; at: number };

export function readMyOrders(): MyOrder[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as MyOrder[]) : [];
    const since = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000;
    return Array.isArray(list) ? list.filter((order) => order && order.id && order.at >= since) : [];
  } catch {
    return [];
  }
}

export function rememberMyOrder(id: string, slug: string): void {
  try {
    const next = [{ id, slug, at: Date.now() }, ...readMyOrders().filter((order) => order.id !== id)].slice(
      0,
      KEEP_MOST,
    );
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage refused: the order still went through; only the bell misses it.
  }
}
