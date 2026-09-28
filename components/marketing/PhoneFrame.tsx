/**
 * A realistic phone around a screenshot: a dark bezel with side buttons, a
 * status bar, and the home indicator — big enough to read the screen.
 *
 * The screenshot fills the display at the owner app's own shape (780×1688),
 * so a capture from `tour:shots`-style tooling sits in it uncropped. Pass no
 * `children` image and it shows whatever placeholder the caller puts in.
 *
 * A server component with no state; purely decoration around the picture.
 */

import clsx from 'clsx';

export function PhoneFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('relative mx-auto w-full max-w-[21rem] sm:max-w-[24rem] lg:max-w-[27rem]', className)}>
      {/* Side buttons: volume on the left, power on the right. */}
      <span aria-hidden className="absolute -left-[3px] top-[18%] h-10 w-[4px] rounded-l-md bg-slate-700" />
      <span aria-hidden className="absolute -left-[3px] top-[26%] h-16 w-[4px] rounded-l-md bg-slate-700" />
      <span aria-hidden className="absolute -right-[3px] top-[22%] h-20 w-[4px] rounded-r-md bg-slate-700" />

      <div className="rounded-[3rem] bg-slate-900 p-[11px] shadow-[0_30px_60px_-20px_rgba(3,74,36,0.45),0_0_0_1px_rgba(255,255,255,0.06)_inset] ring-1 ring-slate-950">
        <div className="overflow-hidden rounded-[2.4rem] bg-card">
          {/* Status bar */}
          <div className="flex h-9 items-center justify-between bg-brand-800 px-6 text-base font-semibold text-white">
            <span>9:41</span>
            <span aria-hidden className="flex items-center gap-1.5">
              <svg viewBox="0 0 18 12" className="h-3 w-[18px] fill-current">
                <rect x="0" y="8" width="3" height="4" rx="0.8" />
                <rect x="5" y="5.5" width="3" height="6.5" rx="0.8" />
                <rect x="10" y="3" width="3" height="9" rx="0.8" />
                <rect x="15" y="0" width="3" height="12" rx="0.8" />
              </svg>
              <svg viewBox="0 0 16 12" className="h-3 w-4 fill-current">
                <path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.3-1.4A10.5 10.5 0 0 0 8 .3 10.5 10.5 0 0 0 .7 3.2L2 4.6a8.6 8.6 0 0 1 6-2.4Zm0 3.8c1.3 0 2.5.5 3.4 1.3l1.3-1.4A6.8 6.8 0 0 0 8 4.1 6.8 6.8 0 0 0 3.3 5.9l1.3 1.4C5.5 6.5 6.7 6 8 6Zm0 3.2-1.8 1.9L8 12.9l1.8-1.8L8 9.2Z" />
              </svg>
              <svg viewBox="0 0 26 12" className="h-3 w-[26px]">
                <rect x="0.5" y="0.5" width="22" height="11" rx="3" fill="none" stroke="currentColor" opacity="0.5" />
                <rect x="2" y="2" width="17" height="8" rx="1.8" fill="currentColor" />
                <rect x="23.5" y="4" width="2" height="4" rx="1" fill="currentColor" opacity="0.5" />
              </svg>
            </span>
          </div>

          {/* The screen itself, at the app's own shape. */}
          <div className="relative aspect-[780/1688] w-full">{children}</div>

          {/* Home indicator */}
          <div className="flex h-6 items-center justify-center bg-card">
            <span aria-hidden className="h-1 w-28 rounded-full bg-slate-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
