/**
 * A page action for the console's top bar — the icon always shows, the label
 * appears from `sm` up, which is what keeps a phone's bar to a single row.
 *
 * Deliberately NOT a client component, and deliberately not declared alongside
 * AdminHeader, which is one. Taking the icon as a component (`icon={PlusIcon}`)
 * rather than a rendered element is the ergonomic API, but a function cannot
 * cross the server/client boundary — passing one to a client component throws
 * "Functions cannot be passed directly to Client Components". Kept server-side,
 * the whole thing renders on the server and reaches AdminHeader as `children`,
 * which is plain serialisable element data.
 *
 * So: import this from server pages. If a client component ever needs it, it
 * needs the element form instead, not this one.
 */

import Link from 'next/link';
import clsx from 'clsx';
import { HEADER_ACTION } from './headerStyles';

export function HeaderAction({
  href,
  label,
  icon: Icon,
  variant = 'secondary',
  hideOnMobile = false,
}: {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactElement;
  variant?: 'primary' | 'secondary';
  /**
   * For actions that are not a phone job — printing a poster, say. A bar with
   * five controls on a 375px screen has no primary action, only a row of
   * competing ones.
   */
  hideOnMobile?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={clsx(
        HEADER_ACTION,
        hideOnMobile && 'hidden sm:inline-flex',
        variant === 'primary'
          ? 'bg-brand-600 text-white hover:bg-brand-700'
          : 'border border-slate-300 text-slate-700 hover:bg-slate-50',
      )}
    >
      <Icon className="h-[18px] w-[18px]" />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
