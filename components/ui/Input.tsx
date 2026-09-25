'use client';

import clsx from 'clsx';
import { forwardRef, useId, useState } from 'react';
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { rateUnit } from '@/lib/units';

const BASE =
  'w-full rounded-xl border bg-card px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 ' +
  'focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-brand-600 disabled:bg-slate-100';

function borderFor(error?: string) {
  return error ? 'border-red-400' : 'border-slate-300';
}

type FieldChrome = { label?: string; hint?: string; error?: string };

function Chrome({
  id,
  label,
  hint,
  error,
  children,
}: FieldChrome & { id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">
          {label}
          {hint && <span className="ml-1 font-normal text-slate-400">({hint})</span>}
        </label>
      )}
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & FieldChrome & {
    /**
     * A unit or currency written faintly INSIDE the right-hand end of the box —
     * "kg", "packet" — so a field that wants a bare number can say what the
     * number will be counted in without spending a second box on it.
     *
     * Optional, and absent it renders exactly what it always did: the wrapper
     * and the padding only appear when there is something to show, so no
     * existing caller moves by a pixel.
     *
     * Context, never a control: it does not take the pointer, so a tap anywhere
     * over it still lands in the field underneath.
     */
    suffix?: string;
  }
>(function Input({ label, hint, error, className, id, suffix, ...rest }, ref) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const field = (
    <input
      {...rest}
      id={fieldId}
      ref={ref}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${fieldId}-error` : undefined}
      className={clsx(BASE, borderFor(error), suffix && 'pr-10', className)}
    />
  );
  return (
    <Chrome id={fieldId} label={label} hint={hint} error={error}>
      {suffix ? (
        <div className="relative">
          {field}
          <span className="pointer-events-none absolute right-3 top-1/2 max-w-[2.5rem] -translate-y-1/2 truncate text-xs text-slate-400">
            {suffix}
          </span>
        </div>
      ) : (
        field
      )}
    </Chrome>
  );
});

/**
 * A price and the pack size it is a price FOR, in one box.
 *
 * TWO BOXES SAID THE SAME THING TWICE. The price box has faded "/ kg" written
 * in its right-hand end, and the box next to it said "1 kg" — so the row asked
 * for the pack size twice and looked, to the owner, like a second price field
 * they had not been told about. It is one fact: what this item costs, and per
 * how much.
 *
 * So the "/ kg" IS the control now. Tap it and it takes the shop's own unit
 * list; type in it and it takes anything, because a shop that sells by the
 * thonga is not wrong — see `lib/units.ts`, which has never offered a closed
 * list and must not start.
 *
 * WHY THE UNIT READS DIFFERENTLY WHEN IT IS NOT BEING EDITED. Stored, a pack
 * size is "1 kg"; as a rate it reads "/ kg", because a price per one kilo is a
 * price per kilo. Both are true and only one of them is the thing being typed,
 * so the field shows the rate at rest and the stored text the moment it has the
 * cursor. Nothing is rewritten behind the owner's back: what they type is what
 * is saved.
 *
 * Passing no `unit` leaves the price alone in the box, which is what simple
 * mode wants — the pack size is the one question a first-time owner has never
 * been asked, and blank is already the right answer for anything off a scale.
 */
export function PriceRateField({
  label,
  hint,
  error,
  currency = '₹',
  price,
  unit,
}: FieldChrome & {
  currency?: string;
  price: {
    value: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    placeholder?: string;
    'aria-label'?: string;
  };
  unit?: {
    value: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    listId?: string;
    placeholder?: string;
    'aria-label'?: string;
    /** How the unit reads while not being edited. Defaults to `rateUnit`. */
    display?: (value: string) => string;
  };
}) {
  const fieldId = useId();
  const [editingUnit, setEditingUnit] = useState(false);

  return (
    <Chrome id={fieldId} label={label} hint={hint} error={error}>
      {/* The ring is on the wrapper, so the whole thing lights up as one
          control however it was reached — tab, tap on the rupee sign, tap on
          the rate. */}
      <div
        className={clsx(
          'flex items-stretch rounded-xl border bg-card',
          'focus-within:outline focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-brand-600',
          borderFor(error),
        )}
      >
        <span aria-hidden className="flex items-center pl-3 text-sm text-slate-400">
          {currency}
        </span>
        {/* `decimal` rather than `number`: paise mean this takes "12.50", and a
            number spinner offers some Android keyboards a keypad with no
            decimal point on it. */}
        <input
          id={fieldId}
          type="text"
          inputMode="decimal"
          aria-label={price['aria-label']}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          value={price.value}
          placeholder={price.placeholder}
          onChange={(event) => price.onChange(event.target.value)}
          onBlur={price.onBlur}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
          }}
          className="min-w-0 flex-1 rounded-l-xl bg-transparent py-2.5 pl-1 pr-2 text-base tabular-nums text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />

        {unit && (
          <div className="flex shrink-0 items-center gap-0.5 border-l border-slate-200 pl-2 pr-2.5">
            <span aria-hidden className="text-sm text-slate-400">
              /
            </span>
            <input
              type="text"
              list={unit.listId}
              aria-label={unit['aria-label']}
              value={editingUnit ? unit.value : (unit.display ?? rateUnit)(unit.value)}
              placeholder={unit.placeholder}
              onChange={(event) => unit.onChange(event.target.value)}
              onFocus={() => setEditingUnit(true)}
              onBlur={() => {
                setEditingUnit(false);
                unit.onBlur?.();
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') event.currentTarget.blur();
              }}
              className="w-16 bg-transparent py-2.5 text-sm text-slate-500 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        )}
      </div>
    </Chrome>
  );
}

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & FieldChrome
>(function Textarea({ label, hint, error, className, id, ...rest }, ref) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <Chrome id={fieldId} label={label} hint={hint} error={error}>
      <textarea
        {...rest}
        id={fieldId}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={clsx(BASE, borderFor(error), className)}
      />
    </Chrome>
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & FieldChrome
>(function Select({ label, hint, error, className, id, children, ...rest }, ref) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <Chrome id={fieldId} label={label} hint={hint} error={error}>
      <select
        {...rest}
        id={fieldId}
        ref={ref}
        aria-invalid={error ? true : undefined}
        className={clsx(BASE, borderFor(error), className)}
      >
        {children}
      </select>
    </Chrome>
  );
});
