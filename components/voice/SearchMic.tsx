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
import { useEffect } from 'react';
import { useVoice } from './useVoice';
import { voiceErrorText } from './errors';
import { MicIcon } from '@/components/ui/Icon';
import { useToastIfAny } from '@/components/ui/Toast';
import { dict, type Locale } from '@/lib/i18n';
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
  resolve,
  className,
}: {
  locale: Locale;
  /** Receives what to search for. Put it in the query. */
  onText: (text: string) => void;
  /**
   * Turns the recogniser's alternatives into the text to search for, usually
   * `spokenSearchText` over the list being searched, so a misheard spelling
   * still lands on the item. Without it the first guess is used as heard.
   */
  resolve?: (alternatives: string[]) => string;
  /**
   * The search box's own label. Kept for callers; the mic is announced as
   * "search by voice" so a screen reader can tell the two controls apart.
   */
  label: string;
  className?: string;
}) {
  const voice = useVoice({
    lang: SEARCH_LANG[locale],
    onPhrase: (alternatives) => onText(resolve ? resolve(alternatives) : (alternatives[0] ?? '').trim()),
  });

  // A blocked mic used to do nothing at all when tapped. Say why, once per failure.
  const toast = useToastIfAny();
  const t = dict(locale);
  useEffect(() => {
    if (voice.errorCode) toast?.push(voiceErrorText(voice.errorCode, t), 'error');
    // Only a new failure is news; `t` and `toast` change with nothing to say.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.errorCode]);

  if (!voice.supported) return null;

  return (
    <button
      type="button"
      onClick={voice.toggle}
      aria-label={`${t.searchByVoice} — ${label}`}
      aria-pressed={voice.listening}
      className={clsx(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition',
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
