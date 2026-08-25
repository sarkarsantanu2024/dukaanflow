import { cookies } from 'next/headers';
import { OWNER_COOKIE, sessionCookieOptions } from '@/lib/auth';
import { fail, ok, sameOrigin } from '@/lib/http';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail('Bad request', 403);

  const store = await cookies();
  store.set(OWNER_COOKIE, '', sessionCookieOptions(0));

  return ok({ success: true });
}
