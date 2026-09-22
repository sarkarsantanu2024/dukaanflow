'use client';

import clsx from 'clsx';
import type { ButtonHTMLAttributes } from 'react';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'whatsapp';
type Size = 'sm' | 'md' | 'lg';

/**
 * WHAT A BUTTON LOOKS LIKE, AND WHY IT CHANGED.
 *
 * They were flat rectangles with a 12px radius: a brand-coloured one, and for
 * everything else a white box with a grey hairline round it. On a tinted page a
 * white-boxed button is the least app-like thing on the screen — it is the shape
 * a web form has had since 1998, and against a coloured ground it reads as a gap
 * rather than as something to press.
 *
 * Three things do the work:
 *
 *   - FULL PILLS. `rounded-full` rather than `rounded-xl`. It is the single
 *     cheapest signal that a thing is a control on a phone rather than a box on
 *     a page, and it is what every app this product will be compared against
 *     does.
 *   - A LIFT ON THE SOLID ONES. `shadow-raised` sits them on the page without
 *     reading as dirt beneath it.
 *   - A PRESS. `active:scale-[0.97]` — the button moves under the thumb. On a
 *     cheap phone where the next screen can take a second to arrive, that
 *     response IS the feedback that the tap registered, and its absence is what
 *     makes an app feel dead and gets a button pressed twice.
 *
 * `secondary` loses its border and takes `card`, the same tinted surface the
 * rest of the product sits on, so nothing in the interface is white any more.
 */
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white shadow-raised hover:bg-brand-700 focus-visible:outline-brand-600',
  secondary:
    'bg-card text-slate-800 shadow-raised hover:bg-brand-50 focus-visible:outline-brand-600',
  ghost: 'bg-transparent text-slate-700 hover:bg-brand-50 focus-visible:outline-brand-400',
  danger: 'bg-red-600 text-white shadow-raised hover:bg-red-700 focus-visible:outline-red-600',
  whatsapp: 'bg-[#25D366] text-white shadow-raised hover:bg-[#1eb457] focus-visible:outline-[#25D366]',
};

/**
 * `md` IS 44px, WHICH IS THE FLOOR AND NOT A COINCIDENCE.
 *
 * These are pressed with a thumb, often by somebody in a hurry with one hand on
 * a scoop, and 44px is the touch target every platform guideline gives as the
 * minimum. `md` is the default and sits exactly on it; do not shrink it. `sm`
 * is below that line and is for controls beside other controls — a filter chip,
 * an icon pair — never for the main action on a screen.
 *
 * SIZE CARRIES EMPHASIS HERE, NOT WEIGHT — a rule for the whole product, not
 * just this file. Bold is the cheap way to make something look important and it
 * is the wrong one twice over: heavy weights thicken and close up the counters
 * of Bengali and Devanagari far more than they do Latin, so the exact readers
 * this product is for lose the most; and once everything that matters is bold,
 * weight has stopped saying anything.
 *
 * BUT THE FIRST PASS OVERCORRECTED. Trading every bold for the next size up
 * inflated the whole interface — a till with three 56px buttons on it is not
 * emphatic, it is just big, and it costs the rows underneath. These are back
 * near where they started in SIZE while keeping the lighter weight, which was
 * the half of the trade worth having.
 *
 * So: keep the weight light. Do not reach for `font-bold`, and do not reach for
 * a larger size to make up for it either.
 */
const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-xs',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-full font-medium transition',
        // The press. Excluded while disabled so a button that cannot be used
        // does not answer a tap as though it could.
        'active:scale-[0.97] disabled:active:scale-100',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
