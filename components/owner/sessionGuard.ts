'use client';

/**
 * What to do when the shop's own app is told "not authenticated".
 *
 * An owner session dies for one ordinary reason: the Super Admin reissued the
 * shop's PIN. That deliberately invalidates every token already out there —
 * it is what makes revoking a PIN mean anything — and it happens while the
 * owner is holding a phone that looks perfectly signed in.
 *
 * The failure is quiet in the worst way. Middleware checks only the token's
 * signature on the Edge, so every page still renders; the database check that
 * actually rejects the session runs on Node, inside the write. So the owner
 * taps "ধার · ₹275", the row does not appear, and nothing on screen explains
 * why. They tap again. They conclude the button is broken.
 *
 * So a 401 gets a sentence in their own language and a trip to the PIN screen,
 * rather than the generic network error that told them nothing.
 */

import type { OwnerDictionary } from '@/lib/owner-i18n';

type Push = (message: string, tone?: 'success' | 'error') => void;

/**
 * Returns true when the response was a dead session and has been handled —
 * the caller should stop, not fall through to its own error message.
 */
export function handledExpiredSession({
  response,
  slug,
  t,
  push,
}: {
  response: Response;
  slug: string;
  t: OwnerDictionary;
  push: Push;
}): boolean {
  if (response.status !== 401) return false;

  push(t.sessionEnded, 'error');
  // A full navigation, not a router push: the session cookie is now worthless
  // and every cached server component rendered with it is too.
  window.location.href = `/owner/${slug}/login`;
  return true;
}
