'use client';

/**
 * Hands-free ordering for the shopper.
 *
 * "two kg rice and one packet salt" adds both to the cart; the phone reads
 * back what it added so a customer who cannot read the menu can still order.
 */

import { useCallback, useRef, useState } from 'react';
import { MicButton } from '@/components/voice/MicButton';
import { speak, useVoice } from '@/components/voice/useVoice';
import { parseSpokenOrder, type MatchableItem, type VoiceLang } from '@/lib/speech';
import { dict, type Locale } from '@/lib/i18n';

/** The shop page already has a language toggle — reuse it for the mic. */
const RECOGNITION_LANG: Record<Locale, VoiceLang> = {
  en: 'en-IN',
  hi: 'hi-IN',
  bn: 'bn-IN',
};

export type VoiceOrderItem = MatchableItem & { price: number; inStock: boolean };

export function VoiceOrder({
  items,
  locale,
  onAdd,
}: {
  items: VoiceOrderItem[];
  locale: Locale;
  /** Adds `quantity` more of `id` to the cart. */
  onAdd: (id: string, quantity: number) => void;
}) {
  const t = dict(locale);
  const lang = RECOGNITION_LANG[locale];
  const [feedback, setFeedback] = useState('');

  const itemsRef = useRef(items);
  itemsRef.current = items;
  const langRef = useRef(lang);
  langRef.current = lang;
  const onAddRef = useRef(onAdd);
  onAddRef.current = onAdd;

  const voiceRef = useRef<{ stop: () => void; start: () => void; listening: boolean }>({
    stop: () => {},
    start: () => {},
    listening: false,
  });

  const announce = useCallback((text: string) => {
    const wasListening = voiceRef.current.listening;
    if (wasListening) voiceRef.current.stop();
    speak(text, langRef.current, () => {
      if (wasListening) voiceRef.current.start();
    });
  }, []);

  const handlePhrase = useCallback(
    (transcript: string) => {
      // Out-of-stock items are not orderable, so they must not win a match
      // over an in-stock item the shopper could actually have meant.
      const available = itemsRef.current.filter((item) => item.inStock);
      const lines = parseSpokenOrder(transcript, available);
      const words = dict(locale);

      if (lines.length === 0) {
        setFeedback(`${words.voiceNotHeard} — “${transcript}”`);
        announce(words.voiceNotHeard);
        return;
      }

      const spoken: string[] = [];
      for (const line of lines) {
        const item = available.find((candidate) => candidate.id === line.id);
        if (!item) continue;
        onAddRef.current(item.id, line.quantity);
        spoken.push(`${line.quantity} ${item.name}${item.unit ? ` ${item.unit}` : ''}`);
      }

      const summary = spoken.join(', ');
      setFeedback(`${summary} — ${words.voiceAdded}`);
      announce(`${summary} ${words.voiceAdded}`);
    },
    [announce, locale],
  );

  const { supported, listening, errorCode, interim, toggle, start, stop } = useVoice({
    lang,
    onPhrase: handlePhrase,
  });
  voiceRef.current = { stop, start, listening };

  if (!supported) return null;

  return (
    <div className="mt-2 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card">
      <MicButton
        listening={listening}
        onClick={toggle}
        label={listening ? t.voiceListening : t.voiceOrder}
      />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900">{listening ? t.voiceListening : t.voiceOrder}</p>
        <p className="mt-0.5 truncate text-sm text-slate-500">
          {listening && interim ? interim : feedback || t.voiceHint}
        </p>
        {/* A shopper can act on a permission prompt; the rest — work-profile
            policy, no HTTPS, no network — they cannot, so those all point back
            to the Add buttons rather than asking for a fix they cannot make. */}
        {errorCode && (
          <p className="mt-1 text-sm text-red-600">
            {errorCode === 'not-allowed' ? t.voiceDenied : t.voiceUnavailable}
          </p>
        )}
      </div>
    </div>
  );
}
