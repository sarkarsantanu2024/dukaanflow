/**
 * Service worker for the installed admin app.
 *
 * Deliberately network-only. Chrome wants a registered worker with a fetch
 * handler before it offers a real install, but caching admin pages would be
 * actively harmful — a shopkeeper must never see a stale price or a shop they
 * already deleted. So this one registers, claims, and otherwise gets out of
 * the way. Served from the root so the /admin gate cannot redirect it.
 */

export const runtime = 'nodejs';

const SOURCE = `
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
// Present so the app is installable; never calls respondWith, so every request
// goes to the network exactly as it would without a service worker.
self.addEventListener('fetch', () => {});
`.trim();

export function GET() {
  return new Response(SOURCE, {
    headers: {
      'Content-Type': 'text/javascript; charset=utf-8',
      'Cache-Control': 'no-cache',
      // Served from the root, so it may take any narrower scope: /admin/ for
      // the Super Admin app, /owner/<slug>/ for a shop owner's.
      'Service-Worker-Allowed': '/',
    },
  });
}
