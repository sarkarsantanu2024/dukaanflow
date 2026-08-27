'use client';

/**
 * The common-items list, in the Super Admin console.
 *
 * The same catalogue the owner gets on their first day, put where an operator
 * can use it on the owner's behalf — because the request that actually arrives
 * is "please put the usual things on my list", by phone, from someone who is
 * not going to tap through it themselves.
 *
 * It stays folded away by default: the operator's usual job on this page is
 * fixing one price, not restocking a catalogue, and an open picker would push
 * the bulk editor off the screen.
 *
 * The dismiss handler is why this wrapper exists at all — a function cannot be
 * passed from a server page to a client component, so the open/closed state has
 * to live on this side of the boundary.
 */

import { useState } from 'react';
import { StarterPicker } from '@/components/owner/StarterPicker';
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
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border border-dashed border-brand-300 bg-brand-50/60 px-4 py-3 text-left transition hover:bg-brand-50"
      >
        <span className="block font-semibold text-slate-900">Add common items</span>
        <span className="mt-0.5 block text-sm text-slate-600">
          {catalogue.length} usual items for this shop type — pick any, or take a whole group.
        </span>
      </button>
    );
  }

  return (
    <StarterPicker
      slug={slug}
      catalogue={catalogue}
      // The console is one operator, and it stays English.
      locale="en"
      remaining={remaining}
      onDismiss={() => setOpen(false)}
    />
  );
}
