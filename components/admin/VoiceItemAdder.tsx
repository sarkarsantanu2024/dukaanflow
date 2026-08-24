'use client';

/**
 * Hands-free item entry for the shopkeeper.
 *
 * Tap the mic once and keep talking — "rice one kg sixty eight rupees" — and
 * each sentence becomes an item. The phone speaks the result back so the
 * shopkeeper never has to look at the screen while stocking shelves.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { MicButton } from '@/components/voice/MicButton';
import { speak, useVoice, type VoiceErrorCode } from '@/components/voice/useVoice';
import { useToast } from '@/components/ui/Toast';
import { formatRupees } from '@/lib/money';
import { parseSpokenItem, VOICE_LANGS, type VoiceLang } from '@/lib/speech';

const LANG_STORAGE_KEY = 'dukaanflow:voice-lang';

type LogEntry = {
  key: number;
  heard: string;
  status: 'saved' | 'rejected' | 'failed';
  detail: string;
};

/** Spoken feedback, in the language the shopkeeper is dictating in. */
const PHRASES: Record<VoiceLang, { saved: (n: string, p: number) => string; noPrice: string; failed: string }> = {
  'en-IN': {
    saved: (name, price) => `${name} added at ${price} rupees`,
    noPrice: 'I did not catch the price. Please say the item and the price again.',
    failed: 'Could not save that. Please try again.',
  },
  'hi-IN': {
    saved: (name, price) => `${name} ${price} रुपये में जोड़ दिया`,
    noPrice: 'दाम समझ नहीं आया। सामान और दाम फिर से बोलिए।',
    failed: 'सेव नहीं हो सका। दोबारा कोशिश कीजिए।',
  },
  'bn-IN': {
    saved: (name, price) => `${name} ${price} টাকায় যোগ হয়েছে`,
    noPrice: 'দাম বুঝতে পারিনি। জিনিস আর দাম আবার বলুন।',
    failed: 'সেভ করা যায়নি। আবার চেষ্টা করুন।',
  },
};

/**
 * The admin screen is English-only, and the shopkeeper is the person who can
 * actually fix these, so each message names the cause and the remedy.
 */
const VOICE_ERRORS: Record<VoiceErrorCode, string> = {
  'insecure-context':
    'Voice needs HTTPS. It works on localhost, but an http:// address like 192.168.x.x is blocked by the browser — open the site over https instead.',
  'not-allowed':
    'Microphone blocked. Allow mic access for this site in the browser, and check Windows Settings → Privacy → Microphone lets your browser use it.',
  'service-not-allowed':
    'The browser refused speech recognition even though the mic is allowed. This is usually a managed/work Chrome profile blocking it — try a personal profile, or Edge.',
  'no-microphone': 'No microphone found. Plug one in, or use a phone.',
  network:
    'Speech recognition needs an internet connection — Chrome sends the audio to Google to transcribe it.',
  unknown: 'Voice input stopped unexpectedly. Tap the mic to try again.',
};

const EXAMPLES: Record<VoiceLang, string> = {
  'en-IN': '“rice one kg sixty eight rupees” · “tomato 500 gram 30”',
  'hi-IN': '“चावल एक किलो 68 रुपये” · “टमाटर 500 ग्राम 30”',
  'bn-IN': '“চাল এক কেজি ৬৮ টাকা” · “টমেটো ৫০০ গ্রাম ৩০”',
};

export function VoiceItemAdder({ slug }: { slug: string }) {
  const router = useRouter();
  const { push } = useToast();
  const [lang, setLang] = useState<VoiceLang>('en-IN');
  // A Bengali shopkeeper should not re-pick Bengali on every visit.
  useEffect(() => {
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (saved && VOICE_LANGS.some((option) => option.value === saved)) setLang(saved as VoiceLang);
  }, []);

  function changeLang(next: VoiceLang) {
    setLang(next);
    window.localStorage.setItem(LANG_STORAGE_KEY, next);
  }

  const [log, setLog] = useState<LogEntry[]>([]);
  const [saving, setSaving] = useState(false);

  const langRef = useRef(lang);
  langRef.current = lang;
  // Sentences can arrive faster than the API answers; a promise chain keeps
  // saves in the order they were spoken and stops two upserts from racing.
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const keyRef = useRef(0);

  const voiceRef = useRef<{ stop: () => void; start: () => void; listening: boolean }>({
    stop: () => {},
    start: () => {},
    listening: false,
  });

  /** Says `text`, muting the mic first so the recogniser cannot hear itself. */
  const announce = useCallback((text: string) => {
    const wasListening = voiceRef.current.listening;
    if (wasListening) voiceRef.current.stop();
    speak(text, langRef.current, () => {
      if (wasListening) voiceRef.current.start();
    });
  }, []);

  const addEntry = useCallback((entry: Omit<LogEntry, 'key'>) => {
    keyRef.current += 1;
    const withKey = { ...entry, key: keyRef.current };
    setLog((current) => [withKey, ...current].slice(0, 8));
  }, []);

  const handlePhrase = useCallback(
    (transcript: string) => {
      queueRef.current = queueRef.current.then(async () => {
        const parsed = parseSpokenItem(transcript);
        const phrases = PHRASES[langRef.current];

        if (!parsed) {
          addEntry({ heard: transcript, status: 'rejected', detail: 'No price heard' });
          announce(phrases.noPrice);
          return;
        }

        setSaving(true);
        try {
          const response = await fetch(`/api/admin/shop/${slug}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: parsed.name,
              price: parsed.price,
              unit: parsed.unit,
              category: parsed.category,
              inStock: true,
            }),
          });

          if (!response.ok) {
            const payload = (await response.json().catch(() => ({}))) as { error?: string };
            addEntry({
              heard: transcript,
              status: 'failed',
              detail: payload.error ?? 'Save failed',
            });
            announce(phrases.failed);
            return;
          }

          const label = parsed.unit ? `${parsed.name} · ${parsed.unit}` : parsed.name;
          addEntry({ heard: transcript, status: 'saved', detail: `${label} — ${formatRupees(parsed.price)}` });
          announce(phrases.saved(label.replace(' · ', ' '), parsed.price));
          router.refresh();
        } catch {
          addEntry({ heard: transcript, status: 'failed', detail: 'Network error' });
          announce(phrases.failed);
        } finally {
          setSaving(false);
        }
      });
    },
    [slug, router, announce, addEntry],
  );

  const { supported, listening, errorCode, interim, toggle, start, stop } = useVoice({
    lang,
    onPhrase: handlePhrase,
  });
  voiceRef.current = { stop, start, listening };

  if (!supported) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
        Voice entry needs Chrome, Edge, or Safari. Use the form above on this browser.
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <div className="flex items-start gap-3">
        <MicButton
          listening={listening}
          onClick={toggle}
          label={listening ? 'Stop voice entry' : 'Add items by voice'}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-slate-900">Add items by voice</h2>
            <select
              value={lang}
              onChange={(event) => changeLang(event.target.value as VoiceLang)}
              aria-label="Speaking language"
              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm"
            >
              {VOICE_LANGS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {saving && <span className="text-xs text-slate-400">saving…</span>}
          </div>

          <p className="mt-1 text-sm text-slate-600">
            {listening
              ? interim || 'Listening… say the item, size, then the price.'
              : 'Tap the mic, then say one item per sentence.'}
          </p>
          <p className="mt-1 text-xs text-slate-400">{EXAMPLES[lang]}</p>

          {errorCode && (
            <p className="mt-2 text-sm text-red-600">{VOICE_ERRORS[errorCode]}</p>
          )}
        </div>
      </div>

      {log.length > 0 && (
        <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-3">
          {log.map((entry) => (
            <li key={entry.key} className="flex items-baseline gap-2 text-sm">
              <span
                className={clsx(
                  'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                  entry.status === 'saved' && 'bg-green-50 text-green-700',
                  entry.status === 'rejected' && 'bg-amber-50 text-amber-700',
                  entry.status === 'failed' && 'bg-red-50 text-red-700',
                )}
              >
                {entry.status === 'saved' ? 'Added' : entry.status === 'rejected' ? 'Unclear' : 'Failed'}
              </span>
              <span className="min-w-0 flex-1 text-slate-700">
                {entry.detail}
                <span className="text-slate-400"> — heard “{entry.heard}”</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {log.some((entry) => entry.status !== 'saved') && (
        <button
          type="button"
          onClick={() => setLog([])}
          className="mt-2 text-xs text-slate-400 underline"
        >
          Clear log
        </button>
      )}
    </div>
  );
}
