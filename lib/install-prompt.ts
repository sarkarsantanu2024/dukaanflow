'use client';

/**
 * Catching the browser's install offer before the thing that uses it exists.
 *
 * `beforeinstallprompt` fires ONCE, early, shortly after the page loads — and
 * if nothing is listening at that moment it is gone, with no way to ask for it
 * again. The card that offers to keep the shop on the home screen is shown
 * after an order, minutes later, so a listener living inside that card would
 * never fire: the event had already come and gone while the shopper was
 * choosing rice.
 *
 * So the listening starts as soon as the shop page mounts and the event is
 * held here, at module scope, until something wants it. Module scope is right
 * rather than lazy: there is exactly one browser and exactly one such event per
 * page load, so this is describing a fact about the page rather than holding
 * state that belongs to a component.
 *
 * The same module registers the service worker, because Chrome will not make
 * the offer without one — and because that worker is also what keeps the shop
 * page readable when the signal drops.
 */

export type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let captured: InstallPromptEvent | null = null;
let started = false;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

/** Idempotent: called from every shop page mount, does its work once. */
export function watchInstallPrompt(): void {
  if (started || typeof window === 'undefined') return;
  started = true;

  /**
   * One worker for every shop this phone visits, scoped to `/shop/`.
   *
   * Deliberately not per shop: a customer uses the kirana, the tea stall and
   * the sweet shop, and one worker caching all three is the behaviour they
   * want. The MANIFEST stays per shop, so each still installs as its own icon
   * with its own name — see `app/shop.webmanifest/route.ts`.
   */
  navigator.serviceWorker?.register('/admin-sw.js', { scope: '/shop/' }).catch(() => {
    // Without it the page works exactly as it always did; it simply cannot be
    // installed or read on a dead signal. Never worth an error in front of a
    // shopper.
  });

  window.addEventListener('beforeinstallprompt', (event) => {
    // Stops Chrome showing its own mini-infobar, so the offer is made at the
    // moment it means something — after an order — rather than over the menu.
    event.preventDefault();
    captured = event as InstallPromptEvent;
    notify();
  });

  window.addEventListener('appinstalled', () => {
    captured = null;
    notify();
  });
}

export function getInstallPrompt(): InstallPromptEvent | null {
  return captured;
}

/** Single-use, whatever the answer was — the browser will not replay it. */
export function clearInstallPrompt(): void {
  captured = null;
  notify();
}

export function subscribeInstallPrompt(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isStandalone(): boolean {
  return (
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as { standalone?: boolean }).standalone === true)
  );
}
