'use client';

/**
 * One dialog, centred, for everything the product needs to say or ask.
 *
 * It replaces `window.confirm` and `window.alert`, which were doing this job
 * badly: a browser dialog is pinned to the top of the screen out of thumb
 * reach, renders in the browser's language rather than the shop's, cannot show
 * a price or a name in bold, and on Android says "dukaanflow.vercel.app says"
 * above every question — which reads like a warning from somewhere else rather
 * than a question from the app the owner is holding.
 *
 * Escape closes, the backdrop closes, and focus moves to the confirming button
 * so a keyboard can answer without hunting. Body scroll is locked while it is
 * open, because a dialog you can scroll the page behind is one people miss.
 */

import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { Button } from './Button';

export function Modal({
  open,
  title,
  children,
  onClose,
  /** Rendered under the message. Omit for a dialog that only says something. */
  footer,
  tone = 'normal',
}: {
  open: boolean;
  title: string;
  children?: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
  /** `danger` colours the heading for something destructive. */
  tone?: 'normal' | 'danger' | 'success';
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // The action, not the cancel — the common answer should be the one already
    // under the finger.
    panelRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-sm animate-fade-in rounded-2xl bg-white p-5 shadow-sheet"
      >
        <h2
          className={clsx(
            'text-lg font-bold leading-snug',
            tone === 'danger' ? 'text-red-700' : tone === 'success' ? 'text-brand-700' : 'text-slate-900',
          )}
        >
          {title}
        </h2>

        {children && <div className="mt-2 text-sm leading-relaxed text-slate-600">{children}</div>}

        {footer && <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>
  );
}

/**
 * A yes/no question. The destructive answer is never the default focus, and it
 * is never the one on the left where a thumb rests.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message?: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={busy ? () => {} : onCancel}
      tone={danger ? 'danger' : 'normal'}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={busy}
            data-autofocus={danger ? undefined : true}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {message}
    </Modal>
  );
}
