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

import { useState } from 'react';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { SaveShopCard } from './SaveShopCard';
import { enablePush, pushSupported } from '@/lib/push-client';
import { dict, type Locale } from '@/lib/i18n';

export function OrderPlaced({
  orderId,
  shopSlug,
  locale,
  wasRemembered,
  onClose,
}: {
  orderId: string;
  shopSlug: string;
  locale: Locale;
  /** Were this phone's details already saved before this order? */
  wasRemembered: boolean;
  onClose: () => void;
}) {
  const t = dict(locale);
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
  const [asking, setAsking] = useState(false);
  /** null until they answer; then what came of it. */
  const [notify, setNotify] = useState<'on' | 'denied' | 'no' | null>(null);

  const canAsk = Boolean(publicKey) && pushSupported() && notify === null;

  async function turnOn() {
    setAsking(true);
    try {
      const outcome = await enablePush({
        // The order id is the authorisation — the shop and the phone number are
        // read off the order, never sent. See the route for why.
        endpoint: `/api/order/${orderId}/push`,
        // One worker for every shop this phone uses, so the tea stall and the
        // kirana are not two registrations fighting over the same cache.
        scope: '/shop/',
        publicKey,
      });
      setNotify(outcome === 'subscribed' ? 'on' : outcome === 'denied' ? 'denied' : 'no');
    } finally {
      setAsking(false);
    }
  }

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
      {t.orderPlacedHint}

      {!wasRemembered && <span className="mt-2 block text-slate-500">{t.savedForNextTime}</span>}

      {/* THE ASK. On a tap, once, and never repeated — a browser that has been
          refused cannot be asked again from code, and a customer who says no
          here has said no for good. So the wording promises exactly one thing
          and nothing else: they will be told when it is ready. */}
      {canAsk && (
        <div className="mt-3 rounded-xl bg-slate-50 p-3">
          <p className="font-semibold text-slate-900">{t.notifyTitle}</p>
          <p className="mt-0.5 text-sm text-slate-600">{t.notifyBody}</p>
          <div className="mt-2.5 flex gap-2">
            <button
              type="button"
              disabled={asking}
              onClick={turnOn}
              className="h-10 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              {t.notifyYes}
            </button>
            <button
              type="button"
              disabled={asking}
              onClick={() => setNotify('no')}
              className="h-10 rounded-lg px-3 text-sm font-semibold text-slate-600"
            >
              {t.notifyLater}
            </button>
          </div>
        </div>
      )}

      {notify === 'on' && (
        <p className="mt-3 rounded-xl bg-brand-50 px-3 py-2 text-sm font-medium text-brand-800">
          {t.notifyOn}
        </p>
      )}
      {notify === 'denied' && (
        <p className="mt-3 text-sm text-slate-500">{t.notifyDenied}</p>
      )}

      {/* The page they can come back to whatever they decided about
          notifications — and the one that will show them a shortened order if
          the shop turns out not to have everything. */}
      <Link
        href={`/track/${orderId}`}
        className="mt-3 block text-sm font-semibold text-brand-700 underline"
      >
        {t.trackTitle} →
      </Link>

      <SaveShopCard locale={locale} />
    </Modal>
  );
}
