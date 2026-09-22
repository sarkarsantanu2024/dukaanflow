'use client';

/**
 * Everything a shop sets once, behind one closed line, on every screen.
 *
 * WHAT BELONGS IN HERE IS DECIDED BY HOW OFTEN IT IS TOUCHED, not by how
 * important it is. Paying for the plan is the most important thing in the
 * product to us and among the rarest to an owner; the customer notice is
 * rewritten every few weeks; the delivery terms are set on the day the shop
 * opens and then left alone for its whole life.
 *
 * THE SMALLEST-ORDER FIELD THAT WAS HERE IS GONE, and nothing replaced it. The
 * minimum is derived from how much the shop has listed (see `lib/basket.ts`),
 * so there is no longer anything for an owner to set, mis-set, or find. None of
 * them is worth a permanent line on a phone screen, and stacked on the Items
 * tab they were four cards an owner scrolled past every time they went to look
 * at their own items.
 *
 * ON EVERY SCREEN, NOT ON THE ITEMS TAB. They lived on Items for no better
 * reason than that Items was where the first of them was built, so an owner on
 * the till who wanted to change their notice had to know to go to a tab about
 * something else. One place, reachable from wherever they are standing.
 *
 * Closed by default and it stays closed: the whole saving is that it is one
 * line until somebody wants it.
 */

import Link from 'next/link';
import { ChevronRightIcon, RupeeIcon } from '@/components/ui/Icon';
import { NoticeCard } from './NoticeCard';
import { DeliveryCard } from './DeliveryCard';
import { DELIVERY_AVAILABLE } from '@/lib/delivery';
import { ownerDict } from '@/lib/owner-i18n';
import type { Locale } from '@/lib/i18n';

/** The once-a-shop settings, carried through the shell to here. */
export type OwnerSettings = {
  noticeText: string;
  /** "YYYY-MM-DD" each, or blank. */
  noticeFrom: string;
  noticeTo: string;
  deliveryEnabled: boolean;
  deliveryFeePaise: number;
  freeDeliveryAbovePaise: number;
  minOrderPaise: number;
};

export function MoreDrawer({
  slug,
  locale,
  settings,
  open,
  onClose,
}: {
  slug: string;
  locale: Locale;
  settings: OwnerSettings;
  /**
   * OPENED FROM THE HEADER NOW, not from a line at the foot of the screen.
   *
   * This owned its own open/closed state and rendered a full-width "আরও সেটিং"
   * row under everything else — a permanent line on every home screen for
   * things a shop sets once in its life. The gear beside the shop's name says
   * the same thing in 36px, so the state lives in `OwnerShell` and this only
   * draws the tray.
   */
  open: boolean;
  onClose: () => void;
}) {
  const t = ownerDict(locale);

  // Closed is nothing at all. The gear in the header is the whole of its
  // presence on a screen nobody came here to configure.
  if (!open) return null;

  return (
    <div>
      {/* NO HEADING. The panel hangs off the gear that opened it, an arm's
          length above — a title repeating "settings" under a settings icon is
          a row spent saying what the shopper already pressed. Escape and a tap
          outside close it; see `OwnerHeader`. */}

      {/* ONE CARD, HAIRLINES BETWEEN THE ROWS — the shape a settings list has
          on every phone, rather than a stack of separate cards with gaps. It
          was an indented tray with a left rule, which made sense when this sat
          in the page under a row it belonged to; in a dropdown the panel IS the
          grouping, so the rule and the indent were saying it twice.

          `divide-y` rather than borders on each child, so a row can be added or
          removed without anyone having to remember which one is last. */}
      <div className="divide-y divide-slate-200 overflow-hidden rounded-xl bg-card">
      {/* THE PERMANENT WAY TO PAY US, moved off the header.
          `PlanBanner` only appears in the last week of a trial or near a
          catalogue limit, and the roadblock only once an owner is already
          locked out — so a shop comfortably inside its plan still needs a route
          to a payment screen that does not depend on something going wrong. */}
      <Link
        href={`/owner/${slug}/renew`}
        className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-brand-50"
      >
        {/* The icon is what makes a list of rows scannable rather than read —
            an owner finds "plan" by its shape long before they finish the word. */}
        <RupeeIcon className="h-5 w-5 shrink-0 text-slate-400" />
        <span className="font-medium text-slate-700">{t.renewOpen}</span>
        <ChevronRightIcon className="ml-auto h-4 w-4 shrink-0 text-slate-400" />
      </Link>

      <NoticeCard
        slug={slug}
        locale={locale}
        noticeText={settings.noticeText}
        noticeFrom={settings.noticeFrom}
        noticeTo={settings.noticeTo}
      />

      {/* Only for shops that actually deliver. Turning delivery on is a Super
          Admin setting, so a collection-only shop met a card it could read and
          could not act on. */}
      {DELIVERY_AVAILABLE && settings.deliveryEnabled && (
        <DeliveryCard
          slug={slug}
          locale={locale}
          deliveryEnabled={settings.deliveryEnabled}
          deliveryFeePaise={settings.deliveryFeePaise}
          freeDeliveryAbovePaise={settings.freeDeliveryAbovePaise}
          minOrderPaise={settings.minOrderPaise}
        />
      )}
      </div>
    </div>
  );
}
