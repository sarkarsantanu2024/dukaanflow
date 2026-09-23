import type { NextConfig } from "next";

/**
 * THE OLD ADDRESS FORWARDS TO THE NEW ONE — BUT ONLY ONCE THE NEW ONE IS LIVE.
 *
 * `dukaanflow.vercel.app` is printed under every QR taped to a counter, so it
 * must stay attached to this project for good (never rename the project). What
 * changes is that a visit to it lands on the canonical address instead, path
 * and query intact, so `/shop/<slug>` from an old poster opens the same shop.
 *
 * The switch is `NEXT_PUBLIC_BASE_URL`. While it still names the old host this
 * list is empty; set it to the new domain only after that domain serves the
 * app, redeploy, and the forwarding turns on in the same build. Pointing it at
 * a domain that does not answer yet would send every QR scan to a dead page.
 *
 * NOT FORWARDED: `/api/*` — a request already in flight from an open tab, a
 * cron, or a webhook would be turned into a cross-origin hop it cannot follow
 * (and a POST loses its cookies) — and `/admin-sw.js`, because a browser will
 * not accept a redirected service-worker script, and the worker installed on
 * the old origin has to be able to update itself.
 */
const LEGACY_HOST = "dukaanflow.vercel.app";

function legacyHostRedirects() {
  const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "");
  if (!base) return [];
  let host: string;
  try {
    host = new URL(base).host;
  } catch {
    return [];
  }
  if (host === LEGACY_HOST) return [];
  return [
    {
      source: "/:path((?!api/|admin-sw\\.js$).*)",
      has: [{ type: "host" as const, value: LEGACY_HOST }],
      destination: `${base}/:path`,
      permanent: true,
    },
  ];
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  /**
   * Where the build output goes, so a check-build cannot kill a dev server.
   *
   * `next build` and `next dev` both write to `.next`, and running one while
   * the other is up takes the dev server down with
   * `__webpack_modules__[moduleId] is not a function` — which looks like a bug
   * in the app and is not. Setting `NEXT_DIST_DIR` for the one command sends
   * its output somewhere else and the two stop colliding:
   *
   *   NEXT_DIST_DIR=.next-verify npx next build
   *
   * Unset — which is every real build, local and on Vercel — this is exactly
   * the default.
   */
  distDir: process.env.NEXT_DIST_DIR || ".next",
  /**
   * `/pricing` IS NOW PART OF THE FRONT PAGE, NOT A PAGE OF ITS OWN.
   *
   * It held the plans, the yearly price, the ₹1-an-item listing and the list of
   * what every plan includes — and the front page carried a teaser of the same
   * thing, so the two drifted and competed with each other for the same search.
   * All of it lives under `/#plans` now, where a shopkeeper who has just been
   * convinced does not have to leave the page that convinced them.
   *
   * THE ADDRESS STAYS ALIVE, AND THAT IS THE POINT OF THIS ENTRY. It has been
   * on WhatsApp messages, in the footer of every legal page, and in a sitemap
   * Google has already crawled. Deleting it would turn every one of those into
   * a 404 for somebody trying to find out what this costs — the worst possible
   * moment to show a shopkeeper a broken link.
   *
   * IN THE CONFIG RATHER THAN IN A ROUTE HANDLER: this is answered by the
   * router before anything renders, it is a real 308 that tells a search engine
   * the move is permanent so the old page's ranking follows it, and it cannot
   * be broken by a change to a page file.
   */
  async redirects() {
    return [
      // First, so an old `/pricing` link goes straight to the new host's
      // `/pricing`, which then answers with `/#plans` itself.
      ...legacyHostRedirects(),
      { source: "/pricing", destination: "/#plans", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // `microphone=(self)`, not `()`: voice entry and voice ordering need
          // the mic on our own origin, and an empty allowlist blocks it for
          // everyone including us — no site permission toggle can override a
          // Permissions-Policy header. Camera and geolocation stay off, and
          // `self` still denies every embedded third-party frame.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
