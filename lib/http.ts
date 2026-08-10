import { NextResponse } from 'next/server';
import type { ZodError } from 'zod';
import { fieldErrors } from './validators';

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400, errors?: Record<string, string>) {
  return NextResponse.json({ error: message, errors: errors ?? {} }, { status });
}

export function invalid(error: ZodError) {
  return fail('Please check the highlighted fields', 422, fieldErrors(error));
}

/**
 * CSRF defence for cookie-authenticated mutations. Browsers cannot forge the
 * Origin header cross-site, so requiring it to match our own host blocks the
 * classic form-post CSRF without any token plumbing.
 */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // non-browser client (curl, server-to-server)
  try {
    return new URL(origin).host === request.headers.get('host');
  } catch {
    return false;
  }
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
