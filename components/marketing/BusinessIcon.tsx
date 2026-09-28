/**
 * One drawn icon per kind of business, for the business grid and each
 * business page's badge.
 *
 * Line icons in the site's own green, replacing the emoji that were here first
 * (28 Sep, by request: "not looking good"). Emoji render differently on every
 * phone and clash with the rest of the page; these are one stroke weight, one
 * colour and one grid, like every other icon on the site. Decorative — the
 * name beside each says the same thing in words.
 */

import type { BusinessSlug } from '@/lib/business-types';

type IconProps = { className?: string };

function Svg({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {children}
    </svg>
  );
}

/** A shopping basket: the grocery store. */
function Basket(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 9h18l-1.6 9.2a2 2 0 0 1-2 1.8H6.6a2 2 0 0 1-2-1.8L3 9Z" />
      <path d="M7.5 9 11 3.5M16.5 9 13 3.5" />
      <path d="M9 13v3.5M12 13v3.5M15 13v3.5" />
    </Svg>
  );
}

/** A pleated dumpling: the roll & momo corner. */
function Dumpling(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 15.5C3 11 7 7 12 7s9 4 9 8.5c0 1.4-1.1 2.5-2.5 2.5h-13A2.5 2.5 0 0 1 3 15.5Z" />
      <path d="M12 7v3.5M8.5 8.2l1.3 3M15.5 8.2l-1.3 3" />
    </Svg>
  );
}

/** A cooking pot with steam: the home kitchen. */
function Pot(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 11h16v4.5a4.5 4.5 0 0 1-4.5 4.5h-7A4.5 4.5 0 0 1 4 15.5V11Z" />
      <path d="M2.5 11h19M9 11V9.5a3 3 0 0 1 6 0V11" />
      <path d="M8.5 3.5c.8.8.8 1.7 0 2.5M12 3c.8.8.8 1.7 0 2.5M15.5 3.5c.8.8.8 1.7 0 2.5" />
    </Svg>
  );
}

/** A wrapped sweet: the sweet shop. */
function Sweet(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M7.8 10.3 3 7.5v9l4.8-2.8M16.2 10.3 21 7.5v9l-4.8-2.8" />
      <path d="M10 10.5c1 .8 3 .8 4 0" />
    </Svg>
  );
}

/** A fish: the meat and fish shop. */
function Fish(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 12c2.5-4 6-6 10-6 3.5 0 6 2.5 7 6-1 3.5-3.5 6-7 6-4 0-7.5-2-10-6Z" />
      <path d="M3 12 1.5 8.5M3 12l-1.5 3.5" />
      <circle cx="16" cy="10.5" r="0.9" fill="currentColor" stroke="none" />
      <path d="M11 9.5c.8 1.6.8 3.4 0 5" />
    </Svg>
  );
}

/** A pencil: the stationery counter. */
function Pencil(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M15.5 4.5 19.5 8.5 9 19l-5 1 1-5L15.5 4.5Z" />
      <path d="M13.5 6.5l4 4M5 15l4 4" />
    </Svg>
  );
}

/** A flower: the flower and puja shop. */
function Flower(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="9" r="2" />
      <path d="M12 7c-1.5-3 1.5-4.5 2.5-3s0 3-2.5 3ZM12 7c1.5-3-1.5-4.5-2.5-3s0 3 2.5 3Z" />
      <path d="M14 9c3-1.5 4.5 1.5 3 2.5s-3 0-3-2.5ZM10 9c-3-1.5-4.5 1.5-3 2.5s3 0 3-2.5Z" />
      <path d="M12 11v10M12 17c-2.5 0-4-1.5-4.5-3.5 2.5 0 4 1.5 4.5 3.5ZM12 19c2.5 0 4-1.5 4.5-3.5-2.5 0-4 1.5-4.5 3.5Z" />
    </Svg>
  );
}

export const BUSINESS_ICON: Record<BusinessSlug, (props: IconProps) => React.ReactElement> = {
  grocery: Basket,
  'roll-momo': Dumpling,
  'home-kitchen': Pot,
  'sweet-shop': Sweet,
  'meat-fish': Fish,
  stationery: Pencil,
  'flowers-puja': Flower,
};
