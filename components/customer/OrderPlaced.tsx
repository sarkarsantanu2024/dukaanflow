'use client';

/**
 * The moment after an order goes through — and the only moment worth asking
 * anything.
 *
 * It used to say "the shop has it now" and offer a Done button. Everything else
 * a customer needed after that happened on the shopkeeper's side, by hand: the
 * owner had to remember to press a WhatsApp button on every single order to say
 * it was ready, and mostly nobody did. So this panel does three things, all of
 * them at the one moment the customer is still looking:
 *
 *  1. OFFERS TO TELL THEM. One tap and their phone gets a notification when the
 *     shop marks the order ready. The permission prompt is one-shot in every
 *     browser — refuse once and no code can ever ask again — so it is asked
 *     here, on a deliberate tap, and never on page load.
 *
 *  2. GIVES THEM A PAGE TO COME BACK TO. `/track/<id>` shows what the shop has
 *     done with the order, including the case where the shop only had one of
 *     the two kilos and cut it down. That page needs no login: the order id is
 *     an unguessable uuid and is the only thing that opens it.
 *
 *  3. OFFERS TO KEEP THE SHOP. Which answers the question the QR sticker
 *     cannot: how does somebody order again next week, from home. See
 *     `SaveShopCard`.
 */

import { CartIcon, ChevronRightIcon } from '@/components/ui/Icon';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useAutoPush } from '@/components/ui/useAutoPush';
import { dict, type Locale } from '@/lib/i18n';
import { formatPaise } from '@/lib/money';

export function OrderPlaced({
  orderId,
  shopSlug,
  orderType,
  totalPaise,
  locale,
  onClose,
}: {
  orderId: string;
  shopSlug: string;
  /**
   * Delivery or collection — which changes what the offer is worth saying.
   *
   * A delivery customer learns their order is ready when the bag arrives at
   * the door. A collection customer has to decide when to walk over, so being
   * told is the difference between waiting at a counter and not. Same feature,
   * and only one of them has a reason to grant a permission they can never be
   * asked for twice.
   */
  orderType: 'DELIVERY' | 'PICKUP';
  /** What the order came to, as the server priced it. */
  totalPaise: number;
  locale: Locale;
  /** Were this phone's details already saved before this order? */
  wasRemembered: boolean;
  onClose: () => void;
}) {
  const t = dict(locale);
  // Alerts about this order, on by default — see `useAutoPush`. The order id
  // is the authorisation: the shop and the phone are read off the order on the
  // server. One worker for every shop this phone uses (scope `/shop/`). The
  // customer turns alerts off from the phone's own site settings.
  useAutoPush({ endpoint: `/api/order/${orderId}/push`, scope: '/shop/' });

  return (
    <Modal
      open
      title={t.orderPlacedTitle}
      tone="success"
      onClose={onClose}
      footer={
        <Button onClick={onClose} data-autofocus>
          {t.orderPlacedDone}
        </Button>
      }
    >
      {/* Which order, and for how much — what the customer reads out when the
          shop calls, or checks against the bill. The number is the start of the
          order's id, the same one the tracking page names its bill after. */}
      <p className="mb-3 flex items-baseline justify-between gap-3 rounded-xl bg-sunk/60 px-3 py-2 text-slate-800">
        <span>
          {t.orderPlacedNumber}{' '}
          <span className="font-semibold tracking-wide tabular-nums">{orderId.slice(0, 8).toUpperCase()}</span>
        </span>
        <span>
          {t.total} <span className="font-semibold tabular-nums">{formatPaise(totalPaise)}</span>
        </span>
      </p>
      {t.orderPlacedHint}

      {/* The page they can come back to whatever they decided about
          notifications — and the one that will show them a shortened order if
          the shop turns out not to have everything. */}
      {/* The way to the order, as a button rather than an underlined link:
          it is the one thing on this popup worth tapping. */}
      <Link
        href={`/track/${orderId}`}
        className="mt-4 flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 font-semibold text-brand-800 shadow-sm transition hover:bg-brand-100 active:scale-[0.99]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
          <CartIcon className="h-5 w-5" />
        </span>
        <span className="flex-1">{t.seeOrders}</span>
        <ChevronRightIcon className="h-5 w-5 shrink-0 text-brand-600" />
      </Link>

    </Modal>
  );
}
