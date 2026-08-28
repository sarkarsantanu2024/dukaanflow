'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { formatRupees } from '@/lib/money';
import { phoneSchema, pincodeSchema } from '@/lib/validators';
import { dict, type Locale } from '@/lib/i18n';

const checkoutSchema = z.object({
  customerName: z.string().trim().max(60),
  customerPhone: phoneSchema,
  customerAddress: z.string().trim().max(200),
  customerPincode: pincodeSchema,
});

export type CheckoutValues = z.infer<typeof checkoutSchema>;

export type CheckoutSubmit = CheckoutValues & { orderType: 'DELIVERY' | 'PICKUP' };

export function CheckoutSheet({
  open,
  onClose,
  onSubmit,
  submitting,
  totalItems,
  totalAmount,
  locale,
  deliveryEnabled = true,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CheckoutSubmit) => void;
  submitting: boolean;
  totalItems: number;
  totalAmount: number;
  locale: Locale;
  /** Collection-only shops never show the choice at all. */
  deliveryEnabled?: boolean;
}) {
  const t = dict(locale);
  // A shop that cannot deliver starts and stays on pickup. Offering the choice
  // and then refusing it at the server would be a worse version of not
  // offering it.
  const [orderType, setOrderType] = useState<'DELIVERY' | 'PICKUP'>(
    deliveryEnabled ? 'DELIVERY' : 'PICKUP',
  );
  const panelRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      customerPincode: '',
    },
  });

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
    <div className="fixed inset-0 z-50 flex items-end justify-center">
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
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-4 pb-6 shadow-sheet"
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300" />

        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-bold text-slate-900">{t.yourOrder}</h2>
          <p className="text-sm text-slate-500">
            {totalItems} {t.items} · <span className="font-bold text-slate-900">{formatRupees(totalAmount)}</span>
          </p>
        </div>

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
            hint={t.optional}
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
              hint={t.optional}
              rows={2}
              autoComplete="street-address"
              placeholder={t.addressPlaceholder}
              error={errors.customerAddress?.message}
              {...register('customerAddress')}
            />
          )}

          {/* Asked on pickup too. "Which localities do our customers come from"
              is about where the person lives, not how the goods travel — and a
              customer walking in is exactly the flow worth understanding. */}
          <Input
            label={t.pincode}
            hint={t.optional}
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={6}
            placeholder={t.pincodePlaceholder}
            error={errors.customerPincode?.message}
            {...register('customerPincode')}
          />

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" size="lg" onClick={onClose} disabled={submitting}>
              {t.back}
            </Button>
            <Button type="submit" variant="whatsapp" size="lg" fullWidth loading={submitting}>
              {submitting ? t.sending : t.sendOnWhatsApp}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
