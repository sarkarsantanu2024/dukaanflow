/**
 * Shape shared by every control in the console's top bar.
 *
 * Exactly 40px square on a phone — the tap target Android and iOS both ask for
 * — and only from `sm` does it grow padding for a label.
 *
 * It lives in a module of its own because the bar's buttons are split across
 * the server/client boundary: the sign-out button needs an event handler, the
 * page actions must not be client components at all (see HeaderAction).
 */
export const HEADER_ACTION =
  'inline-flex h-10 w-10 shrink-0 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition sm:h-9 sm:w-auto sm:px-2.5';
