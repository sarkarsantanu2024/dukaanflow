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
import { CloseIcon } from '@/components/ui/Icon';
import { speak, useVoice, type VoiceErrorCode } from '@/components/voice/useVoice';
import {
  MOST_PER_LINE,
  parseSpokenOrder,
  spokenYesNo,
  type SpokenOrderLine,
  type VoiceLang,
} from '@/lib/speech';
import { dict, type Locale } from '@/lib/i18n';
import { itemName, sellsAnyAmount, type CustomerItem } from './ItemCard';
import { amountLabel } from '@/lib/units';

/** The shop page already has a language toggle — reuse it for the mic. */
const RECOGNITION_LANG: Record<Locale, VoiceLang> = {
  en: 'en-IN',
  hi: 'hi-IN',
  bn: 'bn-IN',
};

type Suggestion = {
  id: string;
  quantity: number;
  label: string;
  /**
   * Why this is being asked rather than added: "You said 250 g · this shop
   * sells it in 1 kg". Empty when the item itself was what was uncertain.
   */
  note?: string;
};

/**
 * Why the mic did not start, in the shopper's language.
 *
 * Only `not-allowed` is theirs to fix on the spot, but the others still have to
 * be told apart: an http:// LAN address, a managed browser profile refusing the
 * speech service and a dead connection all used to read as "this browser cannot
 * do voice", which sends everybody looking in the wrong place.
 */
function reason(code: VoiceErrorCode, t: ReturnType<typeof dict>): string {
  if (code === 'not-allowed') return t.voiceDenied;
  if (code === 'insecure-context') return t.voiceInsecure;
  if (code === 'service-not-allowed') return t.voiceServiceBlocked;
  if (code === 'no-microphone') return t.voiceNoMic;
  if (code === 'network') return t.voiceNoNetwork;
  return t.voiceUnavailable;
}

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
  const [dismissed, setDismissed] = useState(false);
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
          const summary = outstanding.map((entry) => entry.label).join(', ');
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
      // `loose` travels with the item so the parser reaches the same answer the
      // card and the server do about whether this shop can weigh out any
      // amount of it — three different tests would mean the mic offering 250 g
      // of something the order route then refuses.
      const { lines, unsure, tooMany } = parseSpokenOrder(
        alternatives,
        available.map((item) => ({ ...item, loose: sellsAnyAmount(item) })),
      );

      const describe = (line: SpokenOrderLine): Suggestion | null => {
        const item = available.find((candidate) => candidate.id === line.id);
        if (!item) return null;
        const name = itemName(item, localeRef.current);
        // "চিনি 250 g", not "চিনি 1 kg" with a quantity of 0.25 beside it: the
        // label has to be the amount going into the basket, because it is what
        // the phone reads out and what the shopper checks it against.
        const amount = amountLabel(item.unit, line.quantity);
        return {
          id: line.id,
          quantity: line.quantity,
          // The whole phrase, count included, because every message below reads
          // this out as it stands: "চিনি 250 g" for something weighed, and
          // "2 × চাউমিন 1 plate" for something counted. A bare quantity in
          // front of it would say "0.25 চিনি 250 g".
          label: amount
            ? `${name} ${amount}`
            : `${line.quantity} × ${[name, item.unit].filter(Boolean).join(' ')}`,
          // The amount asked for, when the shop cannot make it up out of whole
          // packs. Both halves of the mismatch, because either on its own reads
          // as the app having misheard: "you said 250 g" invites saying it
          // again, "sold in 1 kg" does not explain why anything is being asked.
          note:
            line.requested && !line.exact
              ? `${words.voiceYouSaid} ${line.requested} · ${words.voiceSoldIn} ${item.unit}`
              : undefined,
        };
      };

      const added = lines.map(describe).filter(Boolean) as Suggestion[];
      const maybe = unsure.map(describe).filter(Boolean) as Suggestion[];

      if (added.length > 0) {
        accept(added);
        const summary = added.map((entry) => entry.label).join(', ');
        setFeedback(`${summary} — ${words.voiceAdded}`);
        announce(`${summary} ${words.voiceAdded}`);
        return;
      }

      if (maybe.length > 0) {
        setSuggestions(maybe);
        const summary = maybe.map((entry) => entry.label).join(', ');
        setFeedback('');
        // The mismatch is spoken as well as printed. A shopper using the mic
        // may be doing so because they cannot read the screen, and "did you
        // mean one kilo" with no mention of the 250 g they asked for sounds
        // like the app simply mis-heard them.
        const notes = maybe.map((entry) => entry.note).filter(Boolean).join('. ');
        announce(`${notes ? `${notes}. ` : ''}${words.voiceDidYouMean} ${summary}`);
        return;
      }

      /**
       * More than one line may hold. Nothing is added and nothing is offered:
       * the shopper is told the limit and asked to say the amount again, which
       * is the only thing that can actually resolve it. "300 chini" used to
       * come back as "did you mean 99 × sugar 1 kg?".
       */
      if (tooMany.length > 0) {
        const message = `${words.voiceTooMuch} ${MOST_PER_LINE}`;
        setFeedback(message);
        announce(message);
        return;
      }

      // "not in this shop" and "did not understand you" are different failures
      // and lead the shopper to different next moves, so they are not merged.
      const heard = (alternatives[0] ?? '').trim();
      const message = heard ? words.voiceNotInShop : words.voiceNotHeard;
      setFeedback(heard ? `“${heard}” — ${message}` : message);
      announce(message);
    },
    [announce, accept],
  );

  const { supported, listening, errorCode, interim, toggle, start, stop } = useVoice({
    lang,
    onPhrase: handlePhrase,
  });
  voiceRef.current = { stop, start, listening };

  if (!supported) return null;

  // What the mic has to say right now, or nothing. Floating, there is no card
  // standing permanently open to hold this — the bubble appears only when
  // there is something to read and gets out of the way again afterwards.
  //
  // `dismissed` is what makes "not available on this browser" closable. That
  // message is set once by the support check and never clears itself, so
  // without a way out it was a box sitting permanently over the menu, covering
  // the items it was telling the shopper to tap instead.
  const line = listening && interim ? interim : feedback;
  const hasSomethingToSay =
    listening || Boolean(line) || Boolean(errorCode) || suggestions.length > 0;
  const speaking = hasSomethingToSay && !dismissed;

  return (
    <div className="pointer-events-auto relative">
      {/* Anchored above the mic rather than stacked with it in the flow: as a
          sibling it was 20rem wide and shoved the search and basket buttons
          across the screen every time the mic had something to say. */}
      {speaking && (
        <div className="absolute bottom-full right-0 mb-3 w-[min(20rem,calc(100vw-2rem))] rounded-2xl bg-white p-3 shadow-lg ring-1 ring-slate-200">
          <div className="flex items-start gap-2">
            <p className="min-w-0 flex-1 text-sm font-semibold text-slate-900">
              {listening ? t.voiceListening : t.voiceOrder}
            </p>
            <button
              type="button"
              onClick={() => {
                setDismissed(true);
                setSuggestions([]);
                setFeedback('');
                if (listening) stop();
              }}
              aria-label={t.close}
              className="-m-1 shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-0.5 text-sm text-slate-500">{line || t.voiceHint}</p>
          {/* Each cause named, rather than one sentence for all of them.
              "Voice is not available on this browser" was shown to somebody
              who had just granted the microphone in a browser that supports
              voice perfectly well — the mic only renders when the browser has
              the API — which reads as the app being broken. */}
          {errorCode && <p className="mt-1 text-sm text-red-600">{reason(errorCode, t)}</p>}

          {suggestions.length > 0 && (
            <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3">
              <p className="text-sm text-amber-900">
                {t.voiceDidYouMean}{' '}
                <strong>
                  {suggestions.map((entry) => entry.label).join(', ')}
                </strong>
              </p>
              {/* Why it is being asked at all. Without this, a shopper who said
                  "250 gram" is shown "1 × sugar 1 kg" and has no way to tell
                  whether the app misheard the item or is rounding the amount —
                  and the two need opposite responses from them. */}
              {suggestions.some((entry) => entry.note) && (
                <ul className="mt-1 space-y-0.5 text-xs text-amber-800">
                  {suggestions
                    .filter((entry) => entry.note)
                    .map((entry) => (
                      <li key={entry.id}>{entry.note}</li>
                    ))}
                </ul>
              )}
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    accept(suggestions);
                    setSuggestions([]);
                    setFeedback(
                      `${suggestions.map((e) => e.label).join(', ')} — ${t.voiceAdded}`,
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
      )}

      {/* Dark, not green. Every card behind this one carries a green Add
          button, and a green mic floating over them read as one more of those
          rather than as the tool it is. */}
      <MicButton
        listening={listening}
        tone="dark"
        onClick={() => {
          // Reaching for the mic is asking for its bubble back.
          setDismissed(false);
          toggle();
        }}
        label={listening ? t.voiceListening : t.voiceOrder}
        className="shadow-lg ring-4 ring-slate-100/70"
      />
    </div>
  );
}
