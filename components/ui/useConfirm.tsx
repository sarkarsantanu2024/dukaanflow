'use client';

/**
 * `window.confirm`, replaced by something that belongs to this app.
 *
 * Every caller wants the same shape — ask a question, wait, act on the answer —
 * and rewriting that as component state at each of the six call sites would
 * mean six chances to get the focus, the escape key or the busy state subtly
 * different. So the awaiting is kept here and the call site keeps reading the
 * way it did:
 *
 *     if (!(await confirm({ title: 'Delete this?', confirmLabel: 'Delete' }))) return;
 *
 * The promise resolves false on cancel, on escape and on a backdrop click, so
 * there is no path where a caller is left waiting for an answer that never
 * comes.
 */

import { useCallback, useRef, useState } from 'react';
import { ConfirmDialog } from './Modal';

type Ask = {
  title: string;
  message?: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
};

export function useConfirm(): {
  confirm: (ask: Ask) => Promise<boolean>;
  /** Render this once, anywhere in the component's tree. */
  dialog: React.ReactNode;
} {
  const [ask, setAsk] = useState<Ask | null>(null);
  const resolveRef = useRef<((answer: boolean) => void) | null>(null);

  const confirm = useCallback((next: Ask) => {
    setAsk(next);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const answer = useCallback((value: boolean) => {
    setAsk(null);
    resolveRef.current?.(value);
    resolveRef.current = null;
  }, []);

  return {
    confirm,
    dialog: ask ? (
      <ConfirmDialog
        open
        title={ask.title}
        message={ask.message}
        confirmLabel={ask.confirmLabel}
        cancelLabel={ask.cancelLabel ?? 'Cancel'}
        danger={ask.danger}
        onConfirm={() => answer(true)}
        onCancel={() => answer(false)}
      />
    ) : null,
  };
}
