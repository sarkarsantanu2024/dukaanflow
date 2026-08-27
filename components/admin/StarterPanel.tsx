'use client';

/**
 * The common-items list, in the Super Admin console.
 *
 * The same catalogue the owner gets on their first day, put where an operator
 * can use it on the owner's behalf — because the request that actually arrives
 * is "please put the usual things on my list", by phone, from someone who is
 * not going to tap through it themselves.
 *
 * This wrapper exists because the picker needs a way to close the drawer it is
 * shown in, and the drawer's content is built in a server component where a
 * function prop cannot cross the boundary. The close comes from context on this
 * side instead.
 */

import { StarterPicker } from '@/components/owner/StarterPicker';
import { useDrawerClose } from '@/components/ui/Drawer';
import type { StarterItem } from '@/lib/starter-catalogue';

export function StarterPanel({
  slug,
  catalogue,
  remaining,
}: {
  slug: string;
  catalogue: StarterItem[];
  remaining: number;
}) {
  const close = useDrawerClose();

  return (
    <StarterPicker
      slug={slug}
      catalogue={catalogue}
      // The console is one operator, and it stays English.
      locale="en"
      remaining={remaining}
      onDismiss={close ?? undefined}
    />
  );
}
