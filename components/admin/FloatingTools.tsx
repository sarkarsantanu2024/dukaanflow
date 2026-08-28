'use client';

/**
 * The two ways of listing something, as floating buttons.
 *
 * They used to be two large cards at the top of the list — a mic, a language
 * picker, three worked examples, then a camera and its explanation. Together
 * they filled a phone screen before a single item was visible, and an owner
 * scrolled past the same instructions every time they opened the app.
 *
 * A shopkeeper does not need to be told what a microphone is twice. The
 * explanation belongs on the first run; afterwards it is two buttons under a
 * thumb, in the corner every app puts them, above the tab bar rather than
 * behind it. Tapping the mic opens the full voice panel, examples and all, for
 * whoever still wants it.
 */

import { CameraIcon, MicIcon } from '@/components/ui/Icon';
import { Spinner } from '@/components/ui/Spinner';

export function FloatingTools({
  onVoice,
  onPhoto,
  voiceLabel,
  photoLabel,
  photoBusy = false,
  /** Lifted clear of the owner app's tab bar; the console has none. */
  aboveTabBar = false,
}: {
  onVoice: () => void;
  /** Omit to drop the camera entirely — the console has no packet to photograph. */
  onPhoto?: () => void;
  voiceLabel: string;
  photoLabel: string;
  photoBusy?: boolean;
  aboveTabBar?: boolean;
}) {
  return (
    <div
      className={
        'no-print pointer-events-none fixed inset-x-0 z-30 mx-auto flex max-w-3xl justify-end px-4 ' +
        (aboveTabBar
          ? 'bottom-[calc(5.5rem+env(safe-area-inset-bottom))]'
          : 'bottom-[calc(1.5rem+env(safe-area-inset-bottom))]')
      }
    >
      <div className="pointer-events-auto flex flex-col items-end gap-3">
        {/* Secondary, and smaller, so the pair reads as one primary action with
            an alternative rather than two competing buttons. Absent entirely
            where there is nothing to photograph, leaving the mic alone. */}
        {onPhoto && (
          <button
            type="button"
            onClick={onPhoto}
            disabled={photoBusy}
            aria-label={photoLabel}
            title={photoLabel}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-brand-700 shadow-lg transition hover:bg-slate-50 disabled:opacity-60"
          >
            {photoBusy ? <Spinner className="h-5 w-5" /> : <CameraIcon className="h-6 w-6" />}
          </button>
        )}

        <button
          type="button"
          onClick={onVoice}
          aria-label={voiceLabel}
          title={voiceLabel}
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-xl transition hover:bg-brand-700"
        >
          <MicIcon className="h-7 w-7" />
        </button>
      </div>
    </div>
  );
}
