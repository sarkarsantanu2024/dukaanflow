'use client';

/**
 * "No internet" — said once, at the top, while it is true.
 *
 * WHY IT IS NEEDED AT ALL. The service worker now keeps the last version of a
 * page so a shop on one bar of 4G sees their prices instead of a dinosaur. That
 * is a real improvement and it introduces a real danger: a shopkeeper looking
 * at a cached page has no way of knowing it is cached, so a price they changed
 * on another phone, or an order that arrived a minute ago, is simply missing
 * with nothing on screen to say so.
 *
 * A strip that says the connection is gone is what makes the cache honest. It
 * is the whole reason the worker was allowed to keep pages at all — see the
 * argument at the top of `app/admin-sw.js/route.ts`.
 *
 * `navigator.onLine` is famously imprecise: it reports whether the device has
 * a network interface, not whether anything is reachable through it, so a phone
 * connected to a wifi with no internet reads as online. That is acceptable
 * here — it is a hint, not a diagnosis, and the failure it misses shows up
 * anyway the moment something is tapped. What it never does is claim to be
 * offline while a request is going through, which is the direction that would
 * actually mislead somebody.
 */

import { useEffect, useState } from 'react';

export function OfflineBanner({ label, hint }: { label: string; hint?: string }) {
  // Starts online, always. The server has no idea, and rendering "no internet"
  // on the first paint of a perfectly good connection would be a lie shown to
  // everybody for a fraction of a second.
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-medium text-white"
    >
      📶 {label}
      {hint && <span className="mt-0.5 block text-xs text-slate-300">{hint}</span>}
    </div>
  );
}
