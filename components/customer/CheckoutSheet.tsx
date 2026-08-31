'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { formatPaise } from '@/lib/money';
import { phoneSchema } from '@/lib/validators';
import { dict, type Locale } from '@/lib/i18n';
import { quoteDelivery, type DeliveryTerms } from '@/lib/delivery';

const checkoutSchema = z.object({
  customerName: z.string().trim().min(1, 'Please give your name').max(60),
  customerPhone: phoneSchema,
  customerAddress: z.string().trim().max(200),
  customerArea: z.string().trim().min(1, 'Which area are you in?').max(60),
});

export type CheckoutValues = z.infer<typeof checkoutSchema>;

export type CheckoutSubmit = CheckoutValues & { orderType: 'DELIVERY' | 'PICKUP' };

export function CheckoutSheet({
  open,
  onClose,
  onSubmit,
  submitting,
  totalItems,
  totalAmountPaise,
  locale,
  deliveryEnabled = true,
  terms,
  remembered,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CheckoutSubmit) => void;
  submitting: boolean;
  totalItems: number;
  totalAmountPaise: number;
  locale: Locale;
  /** Collection-only shops never show the choice at all. */
  deliveryEnabled?: boolean;
  /**
   * What this shop charges to deliver, and its smallest delivery.
   *
   * Re-quoted here on every switch between Delivery and Pickup, because that
   * switch is exactly what changes the answer — and a customer who moves to
   * Pickup to escape a minimum has to see the minimum disappear, or they will
   * not believe it did.
   */
  terms: DeliveryTerms;
  /** What this phone gave last time, so nobody types it twice. */
  remembered?: Partial<CheckoutValues> | null;
}) {
  const t = dict(locale);
  // A shop that cannot deliver starts and stays on pickup. Offering the choice
  // and then refusing it at the server would be a worse version of not
  // offering it.
  const [orderType, setOrderType] = useState<'DELIVERY' | 'PICKUP'>(
    deliveryEnabled ? 'DELIVERY' : 'PICKUP',
  );
  const panelRef = useRef<HTMLDivElement>(null);

  // Recomputed as the shopper switches between Delivery and Pickup, from the
  // same function the order route uses. Two implementations of a discount rule
  // is two chances to charge somebody the wrong amount.
  const quote = quoteDelivery(terms, totalAmountPaise, orderType);
  /** Too small to deliver. Pickup is never blocked, so this only ever bites one way. */
  const belowMinimum = quote.shortfallPaise > 0;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: remembered?.customerName ?? '',
      customerPhone: remembered?.customerPhone ?? '',
      customerAddress: remembered?.customerAddress ?? '',
      customerArea: remembered?.customerArea ?? '',
    },
  });

  /**
   * Fill the form once the saved details have loaded.
   *
   * `defaultValues` is read on the very first render, and what this phone
   * remembers is read from localStorage in an effect a tick later — so without
   * this the prefill would arrive too late every single time and the boxes
   * would sit empty. Re-running on open also means a customer who cleared a
   * field and backed out gets their saved details again rather than the blanks
   * they left behind.
   */
  useEffect(() => {
    if (!open) return;
    reset({
      customerName: remembered?.customerName ?? '',
      customerPhone: remembered?.customerPhone ?? '',
      customerAddress: remembered?.customerAddress ?? '',
      customerArea: remembered?.customerArea ?? '',
    });
  }, [open, remembered, reset]);

  // Lock background scroll and move focus into the sheet while it is open.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector<HTMLElement>('input')?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    /* Centred rather than a bottom sheet. On a laptop the sheet sat glued to
       the bottom edge with the shop showing above it, which read as a browser
       notification rather than the checkout; on a phone `items-center` still
       fills the screen because the panel is taller than the space. */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t.yourOrder}
        className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-4 pb-6 shadow-sheet"
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300" />

        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-bold text-slate-900">{t.yourOrder}</h2>
          <p className="text-sm text-slate-500">
            {totalItems} {t.items} ·{' '}
            <span className="font-bold text-slate-900">{formatPaise(quote.totalPaise)}</span>
          </p>
        </div>

        {/* What the total is made of, once delivery has a price. Two lines, and
            only when there is something to explain — a shop that delivers free
            shows nothing here, as it always did. */}
        {quote.deliveryFeePaise > 0 && (
          <dl className="mb-4 space-y-1 rounded-xl bg-slate-50 px-3 py-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <dt>{t.goods}</dt>
              <dd className="tabular-nums">{formatPaise(quote.goodsPaise)}</dd>
            </div>
            <div className="flex justify-between text-slate-600">
              <dt>{t.deliveryCharge}</dt>
              <dd className="tabular-nums">{formatPaise(quote.deliveryFeePaise)}</dd>
            </div>
          </dl>
        )}

        <form onSubmit={handleSubmit((values) => onSubmit({ ...values, orderType }))} className="space-y-4">
          {/* A collection-only shop gets no chooser at all — not a disabled
              delivery button, which reads as something that might work later.
              One line saying where to come is the whole message. */}
          {deliveryEnabled ? (
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Order type">
              {(['DELIVERY', 'PICKUP'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setOrderType(option)}
                  aria-pressed={orderType === option}
                  className={clsx(
                    'h-12 rounded-xl border-2 text-sm font-semibold transition',
                    orderType === option
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                  )}
                >
                  {option === 'DELIVERY' ? `🛵 ${t.delivery}` : `🏪 ${t.pickup}`}
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-700">
              🏪 {t.pickup}
            </p>
          )}

          <Input
            label={t.name}
            hint={t.required}
            autoComplete="name"
            placeholder={t.namePlaceholder}
            error={errors.customerName?.message}
            {...register('customerName')}
          />

          <Input
            label={t.phone}
            hint={t.required}
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            maxLength={13}
            placeholder={t.phonePlaceholder}
            error={errors.customerPhone?.message}
            {...register('customerPhone')}
          />

          {orderType === 'DELIVERY' && (
            <Textarea
              label={t.address}
              hint={t.required}
              rows={2}
              autoComplete="street-address"
              placeholder={t.addressPlaceholder}
              error={errors.customerAddress?.message}
              {...register('customerAddress')}
            />
          )}

          <Input
            label={t.area}
            hint={t.required}
            autoComplete="address-level3"
            placeholder={t.areaPlaceholder}
            error={errors.customerArea?.message}
            {...register('customerArea')}
          />

          {/* Refused here rather than by the server after the form is filled
              in. The wording is an amount and a way out — "₹55 more, or choose
              Pickup" — because a shopper who is only told "too small" has to
              guess by how much. The shop's own rule is named above it so it
              does not read as a fault in the app. */}
          {belowMinimum && (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
              {t.minOrder} {formatPaise(terms.minOrderPaise)}.{' '}
              {formatPaise(quote.shortfallPaise)} {t.addMoreToOrder}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" size="lg" onClick={onClose} disabled={submitting}>
              {t.back}
            </Button>
            <Button
              type="submit"
              // Was `whatsapp` — WhatsApp's own green, on a button that has
              // not opened WhatsApp since the order handoff was removed. A
              // customer reading that green expects to be handed to a chat and
              // is instead shown a confirmation, which is the button lying
              // about where it goes. The primary action gets the primary style.
              variant="primary"
              size="lg"
              fullWidth
              disabled={belowMinimum}
              loading={submitting}
            >
              {submitting ? t.sending : t.placeOrder}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
