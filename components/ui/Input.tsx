'use client';

import clsx from 'clsx';
import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

const BASE =
  'w-full rounded-xl border bg-white px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 ' +
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
