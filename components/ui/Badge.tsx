import clsx from 'clsx';

type Tone = 'green' | 'red' | 'slate' | 'amber';

const TONES: Record<Tone, string> = {
  green: 'bg-brand-50 text-brand-700 ring-brand-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
};

export function Badge({
  tone = 'slate',
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
