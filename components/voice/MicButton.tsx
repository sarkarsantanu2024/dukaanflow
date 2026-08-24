'use client';

import clsx from 'clsx';

/** Big round tap target — thumb-sized, because it is used one-handed. */
export function MicButton({
  listening,
  onClick,
  label,
  className,
}: {
  listening: boolean;
  onClick: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={listening}
      aria-label={label}
      title={label}
      className={clsx(
        'relative inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        listening
          ? 'bg-red-600 text-white focus-visible:outline-red-600'
          : 'bg-brand-600 text-white hover:bg-brand-700 focus-visible:outline-brand-600',
        className,
      )}
    >
      {listening && (
        <span className="absolute inset-0 animate-ping rounded-full bg-red-500 opacity-60" aria-hidden />
      )}
      <svg
        viewBox="0 0 24 24"
        className="relative h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        aria-hidden
      >
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0" />
        <path d="M12 18v4" />
      </svg>
    </button>
  );
}
