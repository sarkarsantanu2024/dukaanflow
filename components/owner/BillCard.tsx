'use client';

/**
 * THE BILL, OFFERED AFTER THE SALE IS ALREADY RECORDED.
 *
 * It appears once a sale goes through and it asks for nothing until it is
 * tapped. That ordering is the whole design: the till is the screen most
 * sensitive to speed, and most counter customers walk away without wanting a
 * bill. A phone-number field inside the sale flow would tax every sale to serve
 * the few — so the sale finishes exactly as fast as it always did, and this
 * sits underneath afterwards for the customer who asks.
 *
 * DISMISSABLE, AND IT DISMISSES ITSELF ON THE NEXT SALE. A card that stayed
 * would soon be showing the bill for a sale three customers ago, which is how
 * the wrong bill gets sent.
 *
 * WHY A DOWNLOAD AND A SEPARATE WHATSAPP OPEN, rather than one button that
 * sends the file: `wa.me` links carry TEXT ONLY. There is no URL that attaches
 * a file to a WhatsApp message, from a web page or anywhere else. So the honest
 * flow is the two steps the owner would do by hand anyway — take the file, then
 * open the chat — and the hint under the button says so plainly rather than
 * leaving them waiting for an attachment that is never going to appear.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { downloadBillPdf, type Bill } from '@/lib/bill-pdf';
import { toWhatsAppNumber } from '@/lib/whatsapp';
import { formatPaise } from '@/lib/money';
import type { OwnerDictionary } from '@/lib/owner-i18n';

export function BillCard({
  bill,
  slug,
  t,
  onDone,
  onError,
  onSent,
}: {
  bill: Bill;
  slug: string;
  t: OwnerDictionary;
  /** Dismiss — the owner is done with this sale. */
  onDone: () => void;
  onError: (message: string) => void;
  onSent: (message: string) => void;
}) {
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [bad, setBad] = useState<string | undefined>();

  async function send() {
    // Ten digits, the same shape every other phone field in this product takes.
    const digits = phone.replace(/\D/g, '').replace(/^91/, '');
    if (digits.length !== 10) {
      setBad(t.billBadPhone);
      return;
    }

    setBusy(true);
    try {
      await downloadBillPdf(
        bill,
        {
          bill: t.billDoc,
          total: t.billTotal,
          paidBy: t.billPaidBy,
          paymentMode: { CASH: t.sellCash, UPI: t.sellUpi, KHATA: t.sellKhata },
          credit: `${t.billDoc} · ${bill.shopName}`,
        },
        `bill-${slug}-${bill.at.getTime()}.pdf`,
      );

      // The message carries the total in words as well as the file, because the
      // file is an attachment the owner has still to add — and a message that
      // arrives with the figure in it is already useful if they forget.
      const text = `${bill.shopName}\n${t.billDoc} · ${formatPaise(bill.totalPaise)}`;
      window.open(
        `https://wa.me/${toWhatsAppNumber(digits)}?text=${encodeURIComponent(text)}`,
        '_blank',
        'noopener,noreferrer',
      );
      onSent(t.billReady);
      onDone();
    } catch {
      onError(t.networkError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-3">
      <div className="flex items-baseline gap-2">
        <p className="font-semibold text-slate-900">{t.billTitle}</p>
        <p className="ml-auto text-sm font-bold tabular-nums text-slate-900">
          {formatPaise(bill.totalPaise)}
        </p>
      </div>

      <div className="mt-2 flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <Input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            aria-label={t.billPhone}
            placeholder={t.billPhone}
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
              setBad(undefined);
            }}
            error={bad}
          />
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <Button onClick={send} loading={busy} className="flex-1">
          {t.billSend}
        </Button>
        <button
          type="button"
          onClick={onDone}
          className="shrink-0 px-3 py-2.5 text-sm font-medium text-slate-500"
        >
          {t.billSkip}
        </button>
      </div>

      <p className="mt-2 text-xs text-slate-500">{t.billHint}</p>
    </div>
  );
}
