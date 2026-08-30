/**
 * The one service worker, for every installed DukaanFlow app.
 *
 * Served from the root so it may take any narrower scope — `/owner/<slug>/` for
 * a shopkeeper's app, `/shop/` for a customer's — and so the /admin gate cannot
 * redirect it.
 *
 * It does three things.
 *
 * 1. IT MAKES THE APP INSTALLABLE. Chrome wants a registered worker with a
 *    fetch handler before it offers a real install.
 *
 * 2. IT DELIVERS PUSH. A new order for the owner, a status change for the
 *    customer. Everything about what a notification says arrives in the payload;
 *    nothing about DukaanFlow is decided here.
 *
 * 3. IT SURVIVES A BAD SIGNAL. This is the part that needed the most care,
 *    because this worker used to be network-only ON PURPOSE — a shopkeeper must
 *    never be shown a stale price or a shop they have already deleted. That
 *    reasoning has not changed and is why the rules below are what they are:
 *
 *      - Hashed build assets are cached hard. Their URL changes whenever their
 *        content does, so there is no such thing as a stale one.
 *      - Pages are NETWORK FIRST, always, with the cached copy used only when
 *        the network genuinely fails. Nobody is ever shown yesterday's page
 *        while today's is reachable.
 *      - Anything under /api is never cached in either direction. A price, a
 *        stock count or an order status read from a cache is exactly the lie
 *        the original comment was guarding against.
 *
 *    So the offline copy is a fallback and only ever a fallback — what a shop
 *    on one bar of 4G sees instead of a dinosaur, not what it is served in
 *    preference to the truth.
 */

export const runtime = 'nodejs';

/**
 * Bumped by the deployment, so a release cannot leave old shells behind.
 *
 * On Vercel this is the commit; locally it is a constant, which is right —
 * a developer wants the worker to stop reinstalling itself on every save.
 */
const VERSION = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ?? 'dev';

const SOURCE = `
const CACHE = 'dukaanflow-${VERSION}';

// What a page falls back to when it was never visited and there is no network.
// Inline, because fetching an offline page while offline is the joke it sounds
// like. Deliberately three languages and no branding: whoever is reading this
// is not in a mood to be marketed at.
const OFFLINE_PAGE = \`<!doctype html>
<html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>No internet</title>
<style>
 body{margin:0;min-height:100dvh;display:flex;align-items:center;justify-content:center;
      font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:#f1f5f9;color:#334155}
 div{max-width:22rem;padding:2rem;text-align:center}
 p{margin:.4rem 0}
 b{display:block;font-size:1.15rem;color:#0f172a;margin-bottom:.75rem}
 button{margin-top:1.25rem;height:3rem;padding:0 1.5rem;border:0;border-radius:.75rem;
        background:#0b9057;color:#fff;font-size:1rem;font-weight:600}
</style></head>
<body><div>
 <p style="font-size:2.5rem;margin:0">📶</p>
 <b>No internet</b>
 <p>ইন্টারনেট নেই। একটু পরে আবার চেষ্টা করুন।</p>
 <p>इंटरनेट नहीं है। थोड़ी देर बाद कोशिश कीजिए।</p>
 <button onclick="location.reload()">Try again</button>
</div></body></html>\`;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Every cache but this build's. A shell kept across a deploy is how a
    // shopkeeper ends up running last week's app against this week's database.
    const names = await caches.keys();
    await Promise.all(names.map((name) => (name === CACHE ? null : caches.delete(name))));
    await self.clients.claim();
  })());
});

/** Build output. The hash IS the version, so this can never go stale. */
function isBuildAsset(url) {
  return url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/_next/image');
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Another origin's problem — a font, a CDN, an analytics beacon. Left alone.
  if (url.origin !== self.location.origin) return;

  // NEVER an API. A price, a stock count or an order status served from a
  // cache is worse than an error, because the shopkeeper believes it.
  if (url.pathname.startsWith('/api/')) return;

  if (isBuildAsset(url)) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(CACHE);
        cache.put(request, response.clone());
      }
      return response;
    })());
    return;
  }

  // Pages. Network first, every time — the cache is a parachute, not a plan.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE);
          cache.put(request, response.clone());
        }
        return response;
      } catch (error) {
        const cached = await caches.match(request, { ignoreSearch: true });
        if (cached) return cached;
        return new Response(OFFLINE_PAGE, {
          status: 503,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
    })());
  }
});

/**
 * A new order, or news about one.
 *
 * The payload decides everything — the title, the words, and where a tap goes.
 * A worker that made any of those decisions itself would need redeploying to
 * change a sentence, and every already-installed phone would keep the old one
 * until it happened to update.
 */
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (error) {
    payload = {};
  }

  const title = payload.title || 'DukaanFlow';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || '',
      icon: '/admin-icon?size=192',
      badge: '/admin-icon?size=192',
      // Vibration matters more than sound here: this phone is on a counter in a
      // shop with a television on.
      vibrate: [200, 100, 200],
      tag: payload.tag || undefined,
      // A shopkeeper serving somebody must be able to come back to it. Left to
      // itself a notification disappears after a few seconds, which is exactly
      // the few seconds they were busy.
      requireInteraction: true,
      data: { url: payload.url || '/' },
    }),
  );
});

/**
 * Tapping it opens the order, in the tab that is already there if there is one.
 *
 * Focusing an existing window rather than opening another is the whole point:
 * a shopkeeper who taps six notifications in a rush should end up with one app
 * open on the orders list, not six copies of it.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if (client.url.includes(target) && 'focus' in client) return client.focus();
    }
    for (const client of windows) {
      if ('navigate' in client) {
        await client.focus();
        return client.navigate(target);
      }
    }
    return self.clients.openWindow(target);
  })());
});
`.trim();

export function GET() {
  return new Response(SOURCE, {
    headers: {
      'Content-Type': 'text/javascript; charset=utf-8',
      'Cache-Control': 'no-cache',
      // Served from the root, so it may take any narrower scope: /admin/ for
      // the Super Admin app, /owner/<slug>/ for a shop owner's, /shop/ for a
      // customer's.
      'Service-Worker-Allowed': '/',
    },
  });
}
