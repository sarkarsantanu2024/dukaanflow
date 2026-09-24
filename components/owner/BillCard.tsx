'use client';

/**
 * THE BILL, AS A POPUP AFTER THE SALE — asked for by the owner.
 *
 * It used to be a card over the till grid, and on the phones this runs on it
 * handed the PDF to the share sheet with no number at all — which reaches only
 * saved contacts and recent chats, so a walk-in customer could not be sent a
 * bill. Now, in two short steps:
 *
 *  1. WHO IT IS FOR. Name, WhatsApp number and para. Only the number is
 *     required; a khata sale arrives with all three already filled in. "Not
 *     now" closes it, so a customer who wants no bill costs one tap.
 *  2. SEND. A small summary of who and how much, and one green button that
 *     opens THAT customer's chat with the whole bill written out — every line
 *     with its quantity, the total and how it was paid. A wa.me link carries
 *     text and a number but never a file, so the bill travels as text; the
 *     PDF is one tap beside it for anyone who wants the file.
 *
 * The sale is already recorded before this opens. Nothing here writes to the
 * server, and nothing here can undo or change the sale.
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PdfIcon, PencilIcon, WhatsAppIcon } from '@/components/ui/Icon';
import { toAsciiDigits } from '@/lib/digits';
import { billPdfBlob, downloadBillPdf, lineDetail, type Bill } from '@/lib/bill-pdf';
import { isValidMobile } from '@/lib/validators';
import { toWhatsAppNumber } from '@/lib/whatsapp';
import { formatPaise } from '@/lib/money';
import type { OwnerDictionary } from '@/lib/owner-i18n';

export type BillCustomer = { name: string; phone: string; area: string };

export function BillCard({
  bill,
  slug,
  t,
  customer,
  onDone,
  onError,
  onSent,
}: {
  bill: Bill;
  slug: string;
  t: OwnerDictionary;
  /** Already known — a khata sale names its customer. Fills the first step. */
  customer?: BillCustomer | null;
  /** Close — the owner is done with this sale. */
  onDone: () => void;
  onError: (message: string) => void;
  onSent: (message: string) => void;
}) {
  const [step, setStep] = useState<'who' | 'send'>('who');
  const [name, setName] = useState(customer?.name ?? bill.customerName ?? '');
  const [phone, setPhone] = useState(customer?.phone ?? '');
  const [area, setArea] = useState(customer?.area ?? '');
  const [bad, setBad] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  /** Can this phone hand a PDF to another app? Asked once, with a stand-in file. */
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

  // Ten digits, accepting Bengali and Hindi keyboards and a pasted +91.
  const digits = toAsciiDigits(phone).replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '');

  /** The whole bill as a WhatsApp message, in the owner's language. */
  const text = [
    bill.shopName,
    `${t.billDoc} · ${bill.at.toLocaleString()}`,
    name.trim(),
    '',
    ...bill.lines.map((line) => {
      const detail = lineDetail(line);
      if (line.quantity <= 0) return `• ${line.name}${line.note ? ` — ${line.note}` : ''}`;
      return `• ${line.name}${detail ? ` — ${detail}` : ''} = ${formatPaise(line.amountPaise)}${line.note ? ` (${line.note})` : ''}`;
    }),
    '',
    `${t.billTotal}: ${formatPaise(bill.totalPaise)}`,
    ...(bill.paymentMode ? [`${t.billPaidBy}: ${labels.paymentMode[bill.paymentMode]}`] : []),
  ]
    .filter((line, index, all) => !(line === '' && all[index - 1] === ''))
    .join('\n');

  const waUrl = `https://wa.me/${toWhatsAppNumber(digits)}?text=${encodeURIComponent(text)}`;
  const withName = { ...bill, customerName: name.trim() || bill.customerName };

  function next() {
    if (!isValidMobile(digits)) {
      setBad(t.billBadPhone);
      return;
    }
    setBad(undefined);
    setStep('send');
  }

  /** The PDF, to the share sheet where the phone has one, otherwise downloaded. */
  async function pdf() {
    setBusy(true);
    try {
      const fileName = `bill-${slug}-${bill.at.getTime()}.pdf`;
      if (canSharePdf) {
        const blob = await billPdfBlob(withName, labels);
        await navigator.share({ files: [new File([blob], fileName, { type: 'application/pdf' })], text });
      } else {
        await downloadBillPdf(withName, labels, fileName);
        onSent(t.billReady);
      }
    } catch (error) {
      // Closing the share sheet is the owner changing their mind.
      if ((error as { name?: string })?.name === 'AbortError') return;
      onError(t.networkError);
    } finally {
      setBusy(false);
    }
  }

  if (step === 'who') {
    return (
      <Modal
        open
        title={`${t.billTitle} · ${formatPaise(bill.totalPaise)}`}
        onClose={onDone}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={onDone}>
              {t.billSkip}
            </Button>
            <Button onClick={next} data-autofocus>
              {t.billNext}
            </Button>
          </>
        }
      >
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            next();
          }}
        >
          <Input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            label={t.billPhone}
            placeholder="98XXXXXXXX"
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
              setBad(undefined);
            }}
            error={bad}
          />
          <Input label={t.billName} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} />
          <Input label={t.billArea} value={area} onChange={(event) => setArea(event.target.value)} />
          {/* Enter on a phone keyboard moves on, as the button does. */}
          <button type="submit" hidden aria-hidden tabIndex={-1} />
        </form>
      </Modal>
    );
  }

  return (
    <Modal open title={t.billTitle} onClose={onDone} size="sm">
      <dl className="space-y-1.5 rounded-xl bg-sunk px-4 py-3 text-sm">
        {name.trim() && (
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">{t.billName}</dt>
            <dd className="truncate font-semibold text-slate-900">{name.trim()}</dd>
          </div>
        )}
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">{t.billPhone}</dt>
          <dd className="font-semibold tabular-nums text-slate-900">{digits}</dd>
        </div>
        {area.trim() && (
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">{t.billArea}</dt>
            <dd className="truncate font-semibold text-slate-900">{area.trim()}</dd>
          </div>
        )}
        <div className="flex justify-between gap-3 border-t border-slate-200 pt-1.5">
          <dt className="text-slate-500">{t.billTotal}</dt>
          <dd className="text-base font-semibold tabular-nums text-slate-900">{formatPaise(bill.totalPaise)}</dd>
        </div>
      </dl>

      {/* A real link: WhatsApp has to be opened by a navigation the browser can
          see the owner asked for, or pop-up blockers stop it. Full width, so
          the one thing to do here reads on one line. */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => window.setTimeout(onDone, 300)}
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-base font-semibold text-white shadow-sm transition hover:bg-[#1eb457]"
      >
        <WhatsAppIcon className="h-5 w-5 shrink-0" />
        {t.billSendWa}
      </a>

      <div className="mt-2 grid grid-cols-2 gap-2">
        {/* Back to the first step, to correct the number. */}
        <button
          type="button"
          onClick={() => setStep('who')}
          aria-label={t.billPhone}
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-card px-3 text-sm font-semibold tabular-nums text-slate-700 transition hover:bg-sunk"
        >
          <PencilIcon className="h-4 w-4 shrink-0" />
          {digits}
        </button>
        <button
          type="button"
          onClick={pdf}
          disabled={busy}
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-card px-3 text-sm font-semibold text-slate-700 transition hover:bg-sunk disabled:opacity-50"
        >
          <PdfIcon className="h-5 w-5 shrink-0" />
          {t.billPdfShare}
        </button>
      </div>
    </Modal>
  );
}
