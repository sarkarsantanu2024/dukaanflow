import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';

/**
 * Gate for /admin/*. The signed cookie is verified here (Web Crypto, Edge-safe)
 * so an unauthenticated request never reaches a page that queries the database.
 * `/admin/login` and the login/logout API routes stay open.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin/login') {
    // Already signed in? Skip the form.
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (await verifySessionToken(token)) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (await verifySessionToken(token)) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const loginUrl = new URL('/admin/login', request.url);
  if (pathname !== '/admin') loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/admin/:path*',
    // Protect admin mutations too — belt and braces alongside the per-route check.
    '/api/admin/shop/:path*',
  ],
};
