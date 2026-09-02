import { NextResponse, type NextRequest } from 'next/server';
import { OWNER_COOKIE, readOwnerToken, SESSION_COOKIE, verifySessionToken } from '@/lib/auth';

/**
 * Gate for the two signed-in areas.
 *
 * `/admin/*` is the Super Admin's. `/owner/<slug>` belongs to one shop owner
 * and is reachable with that shop's PIN session — or by the Super Admin, who
 * can already do everything an owner can and often needs to look.
 *
 * Cookies are verified here (Web Crypto, Edge-safe) so an unauthenticated
 * request never reaches a page that queries the database. `/admin/login`,
 * `/owner/<slug>/login` and the login/logout API routes stay open.
 */

/** `/api/admin/shop/<slug>/…` and `/owner/<slug>/…` → `<slug>`. */
function slugAt(pathname: string, index: number): string | null {
  const segment = pathname.split('/')[index];
  return segment && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(segment) ? segment : null;
}

async function isAdmin(request: NextRequest): Promise<boolean> {
  return verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

/**
 * Signature and expiry only — the Edge has no database. Whether the PIN behind
 * this session still exists is re-checked in `lib/guard.ts`, on Node, before
 * anything is written.
 */
async function ownerSlug(request: NextRequest): Promise<string | null> {
  const session = await readOwnerToken(request.cookies.get(OWNER_COOKIE)?.value);
  return session?.slug ?? null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /* ---------------- Shop owner ---------------- */
  if (pathname.startsWith('/owner/')) {
    // "/owner/<slug>" → slug is segment 2.
    const slug = slugAt(pathname, 2);
    if (!slug) return NextResponse.redirect(new URL('/', request.url));

    if (pathname === `/owner/${slug}/login`) {
      // Already signed in for this shop? Skip the form.
      if ((await ownerSlug(request)) === slug) {
        return NextResponse.redirect(new URL(`/owner/${slug}`, request.url));
      }
      return NextResponse.next();
    }

    if ((await ownerSlug(request)) === slug || (await isAdmin(request))) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL(`/owner/${slug}/login`, request.url));
  }

  /* ---------------- Item APIs ---------------- */
  // Shared by both roles. The owner's token must name this exact shop; the
  // handlers re-check, and shop-level PATCH/DELETE still demand the admin.
  if (pathname.startsWith('/api/admin/shop')) {
    if (await isAdmin(request)) return NextResponse.next();

    const slug = slugAt(pathname, 4);
    if (slug && (await ownerSlug(request)) === slug) return NextResponse.next();

    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  /* ---------------- Console APIs ---------------- */
  // Super Admin only, and no owner exception: a report spans every shop. An API
  // answers 401 rather than redirecting to a sign-in form nobody can render.
  if (pathname.startsWith('/api/admin/')) {
    if (await isAdmin(request)) return NextResponse.next();
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  /* ---------------- Super Admin ---------------- */
  if (pathname === '/admin/login') {
    if (await isAdmin(request)) return NextResponse.redirect(new URL('/admin', request.url));
    return NextResponse.next();
  }

  if (await isAdmin(request)) return NextResponse.next();

  const loginUrl = new URL('/admin/login', request.url);
  if (pathname !== '/admin') loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/owner/:path*',
    // Protect admin mutations too — belt and braces alongside the per-route check.
    '/api/admin/shop/:path*',
    '/api/admin/reports/:path*',
    '/api/admin/occasions/:path*',
    // Changing the Super Admin's own sign-in. The handler re-checks, but this
    // is the last endpoint that should depend on a single check.
    '/api/admin/account/:path*',
  ],
};
