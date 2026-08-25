'use client';

/**
 * Hands-free ordering for the shopper.
 *
 * "two kg rice and one packet salt" adds both to the cart; the phone reads
 * back what it added so a customer who cannot read the menu can still order.
 *
 * Anything heard only approximately is offered as a tap-to-confirm suggestion
 * instead of being added — putting the wrong thing in someone's cart silently
 * is worse than asking.
 */

import { useCallback, useRef, useState } from 'react';
import { MicButton } from '@/components/voice/MicButton';
import { speak, useVoice } from '@/components/voice/useVoice';
import { parseSpokenOrder, spokenYesNo, type VoiceLang } from '@/lib/speech';
import { dict, type Locale } from '@/lib/i18n';
import { itemName, type CustomerItem } from './ItemCard';

/** The shop page already has a language toggle — reuse it for the mic. */
const RECOGNITION_LANG: Record<Locale, VoiceLang> = {
  en: 'en-IN',
  hi: 'hi-IN',
  bn: 'bn-IN',
};

type Suggestion = { id: string; quantity: number; label: string };

export function VoiceOrder({
  items,
  locale,
  onAdd,
}: {
  items: CustomerItem[];
  locale: Locale;
  /** Adds `quantity` more of `id` to the cart. */
  onAdd: (id: string, quantity: number) => void;
}) {
  const t = dict(locale);
  const lang = RECOGNITION_LANG[locale];
  const [feedback, setFeedback] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const itemsRef = useRef(items);
  itemsRef.current = items;
  const localeRef = useRef(locale);
  localeRef.current = locale;
  const suggestionsRef = useRef(suggestions);
  suggestionsRef.current = suggestions;
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
    speak(text, RECOGNITION_LANG[localeRef.current], () => {
      if (wasListening) voiceRef.current.start();
    });
  }, []);

  const accept = useCallback((entries: Suggestion[]) => {
    for (const entry of entries) onAddRef.current(entry.id, entry.quantity);
  }, []);

  const handlePhrase = useCallback(
    (alternatives: string[]) => {
      const words = dict(localeRef.current);

      // A suggestion is on screen: "yes" takes it, "no" clears it.
      const outstanding = suggestionsRef.current;
      if (outstanding.length > 0) {
        const answer = spokenYesNo(alternatives);
        if (answer === 'yes') {
          accept(outstanding);
          setSuggestions([]);
          const summary = outstanding.map((entry) => `${entry.quantity} ${entry.label}`).join(', ');
          setFeedback(`${summary} — ${words.voiceAdded}`);
          announce(`${summary} ${words.voiceAdded}`);
          return;
        }
        if (answer === 'no') {
          setSuggestions([]);
          setFeedback('');
          return;
        }
        // Neither — treat what was said as a new order and drop the suggestion.
        setSuggestions([]);
      }

      // Out-of-stock items are not orderable, so they must not win a match
      // over an in-stock item the shopper could actually have meant.
      const available = itemsRef.current.filter((item) => item.inStock);
      const { lines, unsure } = parseSpokenOrder(alternatives, available);

      const describe = (id: string, quantity: number): Suggestion | null => {
        const item = available.find((candidate) => candidate.id === id);
        if (!item) return null;
        const name = itemName(item, localeRef.current);
        return { id, quantity, label: item.unit ? `${name} ${item.unit}` : name };
      };

      const added = lines.map((line) => describe(line.id, line.quantity)).filter(Boolean) as Suggestion[];
      const maybe = unsure.map((line) => describe(line.id, line.quantity)).filter(Boolean) as Suggestion[];

      if (added.length > 0) {
        accept(added);
        const summary = added.map((entry) => `${entry.quantity} ${entry.label}`).join(', ');
        setFeedback(`${summary} — ${words.voiceAdded}`);
        announce(`${summary} ${words.voiceAdded}`);
        return;
      }

      if (maybe.length > 0) {
        setSuggestions(maybe);
        const summary = maybe.map((entry) => `${entry.quantity} ${entry.label}`).join(', ');
        setFeedback('');
        announce(`${words.voiceDidYouMean} ${summary}`);
        return;
      }

      setFeedback(`${words.voiceNotHeard} — “${alternatives[0] ?? ''}”`);
      announce(words.voiceNotHeard);
    },
    [announce, accept],
  );

  const { supported, listening, errorCode, interim, toggle, start, stop } = useVoice({
    lang,
    onPhrase: handlePhrase,
  });
  voiceRef.current = { stop, start, listening };

  if (!supported) return null;

  return (
    <div className="mt-2 rounded-2xl bg-white p-3 shadow-card">
      <div className="flex items-center gap-3">
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

      {suggestions.length > 0 && (
        <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3">
          <p className="text-sm text-amber-900">
            {t.voiceDidYouMean}{' '}
            <strong>
              {suggestions.map((entry) => `${entry.quantity} × ${entry.label}`).join(', ')}
            </strong>
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                accept(suggestions);
                setSuggestions([]);
                setFeedback(
                  `${suggestions.map((e) => `${e.quantity} ${e.label}`).join(', ')} — ${t.voiceAdded}`,
                );
              }}
              className="h-10 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
            >
              {t.voiceYes}
            </button>
            <button
              type="button"
              onClick={() => setSuggestions([])}
              className="h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {t.voiceNo}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
