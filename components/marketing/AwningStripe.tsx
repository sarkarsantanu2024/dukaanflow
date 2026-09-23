/**
 * The red-and-white awning, as a rule across the page.
 *
 * THE LOGO IS TWO COLOURS AND THE SITE WAS WEARING ONE. The mark is a green
 * shop front under a red-and-white striped awning; a page painted only in the
 * green is wearing half the identity, and the half it drops is the half that
 * makes the thing look like a kirana rather than like enterprise software.
 *
 * So the second colour arrives as the awning itself. Every band of the page
 * starts with this stripe, which is the same shape as the one over the shop in
 * the logo — it dresses the page in the mark's own red without painting a
 * single control red, and a control is the one thing red must never be inside
 * this product (see the note on the `accent` ramp: red means unpaid, and only
 * a marketing page is free of that meaning).
 *
 * A repeating gradient, not an image: a couple of hundred bytes of CSS, sharp
 * at any zoom on any screen, and nothing to download or lose. `aria-hidden`,
 * because it says nothing.
 */

import clsx from 'clsx';

export function AwningStripe({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={clsx('h-2 w-full', className)}
      style={{
        backgroundImage:
          'repeating-linear-gradient(135deg, #e8202a 0 14px, #fbfbfa 14px 28px)',
      }}
    />
  );
}
