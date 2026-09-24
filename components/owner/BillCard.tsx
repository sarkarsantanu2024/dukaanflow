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
 * THE PDF GOES WITH THE MESSAGE WHERE THE PHONE CAN SHARE FILES, the same
 * as the order bills, the restock list and the khata. `wa.me` links carry
 * text only, but `navigator.share` with a file puts the PDF into WhatsApp as an
 * attachment, with the message as its caption; the owner picks the customer in
 * the share sheet, so no number is asked for.
 *
 * Where it cannot (a computer, mostly), the old two steps remain: the number,
 * then the PDF is saved and the customer's chat opens, and the hint under the
 * button says the file is to be attached by hand.
 */

import { toAsciiDigits } from '@/lib/digits';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { billPdfBlob, downloadBillPdf, type Bill } from '@/lib/bill-pdf';
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

  /** Can this phone hand a PDF to WhatsApp? Asked once, with a stand-in file. */
  const [canSharePdf, setCanSharePdf] = useState(false);
  useEffect(() => {
    try {
      const probe = new File([''], 'bill.pdf', { type: 'application/pdf' });
      setCanSharePdf(Boolean(navigator.canShare?.({ files: [probe] })));
    } catch {
      setCanSharePdf(false);
    }
  }, []);

  const labels = {
    bill: t.billDoc,
    total: t.billTotal,
    paidBy: t.billPaidBy,
    paymentMode: { CASH: t.sellCash, UPI: t.sellUpi, KHATA: t.sellKhata },
    credit: `${t.billDoc} · ${bill.shopName}`,
  };
  const text = `${bill.shopName}\n${t.billDoc} · ${formatPaise(bill.totalPaise)}`;

  /** The share-sheet path: the PDF attached, the message as its caption. */
  async function share() {
    setBusy(true);
    try {
      const blob = await billPdfBlob(bill, labels);
      const file = new File([blob], `bill-${slug}-${bill.at.getTime()}.pdf`, { type: 'application/pdf' });
      await navigator.share({ files: [file], text });
      onSent(t.billReady);
      onDone();
    } catch (error) {
      // Closing the share sheet is the owner changing their mind.
      if ((error as { name?: string })?.name === 'AbortError') return;
      onError(t.networkError);
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    // Ten digits, the same shape every other phone field in this product takes.
    const digits = toAsciiDigits(phone).replace(/\D/g, '').replace(/^91/, '');
    if (digits.length !== 10) {
      setBad(t.billBadPhone);
      return;
    }

    setBusy(true);
    try {
      await downloadBillPdf(bill, labels, `bill-${slug}-${bill.at.getTime()}.pdf`);

      // The message carries the total in words as well as the file, because the
      // file is an attachment the owner has still to add — and a message that
      // arrives with the figure in it is already useful if they forget.
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
        <p className="ml-auto text-sm font-semibold tabular-nums text-slate-900">
          {formatPaise(bill.totalPaise)}
        </p>
      </div>

      {canSharePdf ? (
        <div className="mt-2 flex items-center gap-2">
          <Button onClick={share} loading={busy} className="flex-1">
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
      ) : (
      <>
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
      </>
      )}
    </div>
  );
}
