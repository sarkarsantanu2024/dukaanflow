'use client';

/**
 * Turning notifications on, from the browser's side.
 *
 * Every awkward part of the Push API lives here so the two components that use
 * it — the shopkeeper's "sound on this phone too" and the customer's "tell me
 * when it is ready" — are both about ten lines.
 *
 * THE PERMISSION PROMPT IS ONE-SHOT AND THERE IS NO SECOND CHANCE. A browser
 * that has been refused cannot be asked again from code, ever; the customer has
 * to go into site settings and undo it, which nobody does. So neither caller
 * asks on page load. Both ask on a deliberate tap, once the person has a reason
 * to say yes — the shopkeeper after they have seen a real order arrive, the
 * customer at the moment they have just placed one.
 */

/** Why a subscribe attempt ended the way it did. */
export type PushOutcome =
  | 'subscribed'
  /** The browser has no push at all, or the page is not on https. */
  | 'unsupported'
  /** Refused — now or on some earlier visit. Cannot be asked again. */
  | 'denied'
  /** The prompt was dismissed without an answer. Asking again is allowed. */
  | 'dismissed'
  /** Everything worked here; the server would not take it. */
  | 'failed';

export function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/** Already agreed on this device? Drives whether the button says on or off. */
export async function currentSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    return (await registration?.pushManager.getSubscription()) ?? null;
  } catch {
    return null;
  }
}

/**
 * The VAPID public key as the `applicationServerKey` option wants it.
 *
 * The key is base64url text and the API takes bytes. The two padding and
 * alphabet differences below are the whole conversion, and getting either wrong
 * fails at subscribe time with a message that says nothing useful.
 */
function toApplicationServerKey(base64Url: string): ArrayBuffer {
  const padded = base64Url.padEnd(base64Url.length + ((4 - (base64Url.length % 4)) % 4), '=');
  const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  // An ArrayBuffer rather than the view over it. `Uint8Array` is a
  // `Uint8Array<ArrayBufferLike>` in current TypeScript and the DOM signature
  // wants an `ArrayBuffer` specifically, so handing over the buffer is both
  // what the API takes and the one form that needs no cast.
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return buffer;
}

/**
 * Ask, subscribe, and register the result with `endpoint`.
 *
 * `scope` is where the worker should control — `/owner/<slug>/` for a
 * shopkeeper, `/shop/` for a customer. The worker itself is the same file for
 * everybody; only what it is allowed to see differs.
 */
export async function enablePush(options: {
  endpoint: string;
  scope: string;
  publicKey: string;
}): Promise<PushOutcome> {
  if (!pushSupported() || !options.publicKey) return 'unsupported';

  // Asked before the worker is registered, so a refusal costs nothing.
  let permission = Notification.permission;
  if (permission === 'default') {
    try {
      permission = await Notification.requestPermission();
    } catch {
      return 'unsupported';
    }
  }
  if (permission === 'denied') return 'denied';
  if (permission !== 'granted') return 'dismissed';

  try {
    const registration = await navigator.serviceWorker.register('/admin-sw.js', {
      scope: options.scope,
    });
    // A worker that is still installing has no push manager to speak of. This
    // resolves once one is in control of the page.
    await navigator.serviceWorker.ready;

    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        // Every push carries a payload the person is shown, so there is never a
        // silent one. Chrome refuses anything else regardless.
        userVisibleOnly: true,
        applicationServerKey: toApplicationServerKey(options.publicKey),
      }));

    const response = await fetch(options.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription.toJSON()),
    });

    return response.ok ? 'subscribed' : 'failed';
  } catch {
    return 'failed';
  }
}

/**
 * Turn it off: drop the browser's subscription and tell the server.
 *
 * Both, and in that order. Dropping only the local one leaves the server
 * posting to an endpoint that answers 410 until something prunes it; telling
 * only the server leaves the browser holding a subscription it will hand back
 * the next time anything asks, so the button would come back on by itself.
 */
export async function disablePush(endpoint: string): Promise<void> {
  const subscription = await currentSubscription();
  if (!subscription) return;

  const url = subscription.endpoint;
  try {
    await subscription.unsubscribe();
  } catch {
    // Already gone. The server still needs telling.
  }
  try {
    await fetch(endpoint, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: url }),
    });
  } catch {
    // Offline. The row is pruned on its next 410 instead.
  }
}
