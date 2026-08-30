import type { NextConfig } from 'next';

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
  distDir: process.env.NEXT_DIST_DIR || '.next',
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // `microphone=(self)`, not `()`: voice entry and voice ordering need
          // the mic on our own origin, and an empty allowlist blocks it for
          // everyone including us — no site permission toggle can override a
          // Permissions-Policy header. Camera and geolocation stay off, and
          // `self` still denies every embedded third-party frame.
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
