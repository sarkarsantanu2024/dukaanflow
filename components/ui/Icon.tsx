/**
 * The icon set.
 *
 * Emoji were standing in for icons across the product — 💬 for WhatsApp, 📍 for
 * an address, ↗ for an external link. Emoji render differently on every
 * platform, sit on the text baseline rather than aligning with it, and read as
 * a placeholder rather than a decision. These are one consistent 24px stroke
 * family instead: same weight, same corner treatment, sized in `em` so they
 * scale with whatever text they sit beside.
 */

type IconProps = {
  className?: string;
  /** Icons are decorative by default; pass a label when one carries meaning. */
  label?: string;
};

function Svg({
  children,
  className = 'h-[1.15em] w-[1.15em]',
  label,
  filled = false,
}: IconProps & { children: React.ReactNode; filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {children}
    </svg>
  );
}

export function WhatsAppIcon(props: IconProps) {
  return (
    <Svg {...props} filled>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.16c-.25.7-1.44 1.33-2 1.37-.53.04-1 .23-3.37-.7-2.84-1.12-4.64-4.03-4.78-4.22-.14-.19-1.14-1.51-1.14-2.89 0-1.37.72-2.05.97-2.33.25-.28.55-.35.73-.35.18 0 .37 0 .53.01.17 0 .4-.06.62.48.23.55.78 1.92.85 2.06.07.14.11.3.02.49-.09.19-.14.3-.28.47-.14.16-.29.36-.41.49-.14.14-.28.29-.12.57.16.28.71 1.17 1.52 1.9 1.04.93 1.92 1.21 2.2 1.35.28.14.44.12.6-.07.16-.19.69-.81.88-1.08.18-.28.37-.23.62-.14.25.09 1.61.76 1.89.9.28.14.46.21.53.32.07.12.07.65-.18 1.35Z" />
    </Svg>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 21s7-5.3 7-11a7 7 0 1 0-14 0c0 5.7 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </Svg>
  );
}

export function RupeeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 4h12M6 9h12M6 20l7-7a4.5 4.5 0 0 0-3.2-7.7H6" />
    </Svg>
  );
}

export function ExternalIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14 4h6v6" />
      <path d="M20 4 11 13" />
      <path d="M18 14v5a1.8 1.8 0 0 1-1.8 1.8H5.8A1.8 1.8 0 0 1 4 19V8.6A1.8 1.8 0 0 1 5.8 6.8H10" />
    </Svg>
  );
}

export function PrinterIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 9V3h10v6" />
      <path d="M7 19H5.5A2.5 2.5 0 0 1 3 16.5v-4A2.5 2.5 0 0 1 5.5 10h13a2.5 2.5 0 0 1 2.5 2.5v4a2.5 2.5 0 0 1-2.5 2.5H17" />
      <path d="M7 15h10v6H7z" />
    </Svg>
  );
}

export function BoxIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 7h16v13H4z" />
      <path d="m4 7 2-3h12l2 3" />
      <path d="M10 12h4" />
    </Svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 4h3.4l1.6 4-2 1.4a12 12 0 0 0 5.6 5.6l1.4-2 4 1.6V19a1.6 1.6 0 0 1-1.8 1.6A15.8 15.8 0 0 1 3.4 5.8 1.6 1.6 0 0 1 5 4Z" />
    </Svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </Svg>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </Svg>
  );
}

export function SignOutIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 8l-4 4 4 4" />
      <path d="M6 12h9" />
    </Svg>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="M14.5 6.5l3 3" />
    </Svg>
  );
}

export function QrIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" />
      <path d="M14 14h2.5v2.5H14zM17.5 17.5H20V20h-2.5z" />
    </Svg>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 8v5" />
      <path d="M12 17h.01" />
      <circle cx="12" cy="12" r="9" />
    </Svg>
  );
}
