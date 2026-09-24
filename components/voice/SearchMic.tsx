'use client';

/**
 * The mic that sits at the right-hand end of an item search box.
 *
 * It writes what it heard into the same box the keyboard writes into, so what
 * it heard is visible, editable and clearable. It never adds, sells or orders
 * anything: a voice search that acts without showing its work is one nobody
 * trusts twice.
 *
 * The till and the storefront grew this control first. Every other item search
 * uses this one component, so a shopkeeper finds the mic in the same corner of
 * every search box in the product.
 *
 * Renders nothing where the browser has no speech recognition (Firefox, some
 * in-app browsers), leaving the box as a plain text field.
 */

import clsx from 'clsx';
import { useVoice } from './useVoice';
import { MicIcon } from '@/components/ui/Icon';
import type { Locale } from '@/lib/i18n';
import type { VoiceLang } from '@/lib/speech';

const SEARCH_LANG: Record<Locale, VoiceLang> = {
  en: 'en-IN',
  hi: 'hi-IN',
  bn: 'bn-IN',
};

export function SearchMic({
  locale,
  onText,
  label,
  className,
}: {
  locale: Locale;
  /** Receives the recogniser's best guess, trimmed. Put it in the query. */
  onText: (text: string) => void;
  /** The accessible name — the search box's own label reads right. */
  label: string;
  className?: string;
}) {
  const voice = useVoice({
    lang: SEARCH_LANG[locale],
    onPhrase: (alternatives) => onText((alternatives[0] ?? '').trim()),
  });

  if (!voice.supported) return null;

  return (
    <button
      type="button"
      onClick={voice.toggle}
      aria-label={label}
      aria-pressed={voice.listening}
      className={clsx(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition',
        voice.listening
          ? 'bg-red-500 text-white'
          : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700',
        className,
      )}
    >
      <MicIcon className="h-5 w-5" />
    </button>
  );
}
