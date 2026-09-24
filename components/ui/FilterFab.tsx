'use client';

/**
 * FILTERS BEHIND A FLOATING BUTTON — asked for by the owner.
 *
 * A filter form sitting open at the top of a list (a range dropdown, a search
 * box, a date) took most of a phone screen before the first result, on every
 * visit, for something used now and then. So a filter form lives in a popup
 * behind one round button that floats where the thumb is. The button carries a
 * badge with how many filters are on, so a narrowed list never looks like the
 * whole list; the result line (count and total) stays on the screen.
 *
 * Every screen with a filter form uses this, so it works the same way
 * everywhere: the same button, the same place, Clear and Done at the foot.
 */

import { useState } from 'react';
import clsx from 'clsx';
import { Modal } from './Modal';
import { Button } from './Button';
import { FilterIcon } from './Icon';

export function FilterFab({
  label,
  clearLabel,
  doneLabel,
  active,
  onClear,
  placement = 'owner',
  children,
}: {
  /** "Filter", in the screen's language. Also the popup's title. */
  label: string;
  clearLabel: string;
  doneLabel: string;
  /** How many filters are set away from their defaults. Shown as a badge. */
  active: number;
  onClear: () => void;
  /** `owner` floats above the owner's tab bar; `console` near the bottom edge. */
  placement?: 'owner' | 'console';
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className={clsx(
          'pointer-events-none fixed inset-x-0 z-30 mx-auto flex justify-end px-4',
          placement === 'owner'
            ? 'bottom-[calc(5.5rem+env(safe-area-inset-bottom))] max-w-3xl'
            : 'bottom-6 max-w-6xl',
        )}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={active > 0 ? `${label} (${active})` : label}
          title={label}
          aria-haspopup="dialog"
          className="pointer-events-auto relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-xl transition hover:bg-brand-700 active:scale-95"
        >
          <FilterIcon className="h-6 w-6" />
          {active > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-500 px-1 text-xs font-semibold tabular-nums text-white ring-2 ring-white">
              {active}
            </span>
          )}
        </button>
      </div>

      <Modal
        open={open}
        title={label}
        onClose={() => setOpen(false)}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={onClear} disabled={active === 0}>
              {clearLabel}
            </Button>
            <Button onClick={() => setOpen(false)} data-autofocus>
              {doneLabel}
            </Button>
          </>
        }
      >
        <div className="space-y-3">{children}</div>
      </Modal>
    </>
  );
}
