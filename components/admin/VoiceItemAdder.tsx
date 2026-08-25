'use client';

/**
 * Hands-free item management for the shopkeeper.
 *
 * Tap the mic once and keep talking. Three things can be said:
 *
 *   "rice one kg sixty eight rupees"  → adds it, or re-prices it if it exists
 *   "rice khatam" / "চাল শেষ"          → marks it out of stock
 *   "remove rice" / "चावल हटाओ"        → takes it off the list
 *
 * The phone speaks each result back, so the shopkeeper never has to look at
 * the screen while stocking shelves.
 *
 * Speech on a shop floor is not reliable enough to act on blindly, so there
 * are two safety nets. Anything uncertain — and every removal, certain or not
 * — is read back for a spoken yes/no first. And everything done here keeps an
 * Undo for the rest of the session.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { MicButton } from '@/components/voice/MicButton';
import { speak, useVoice, type VoiceErrorCode } from '@/components/voice/useVoice';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { formatRupees } from '@/lib/money';
import {
  resolveSpokenCommand,
  spokenYesNo,
  VOICE_LANGS,
  type SpokenItemDraft,
  type VoiceCommand,
  type VoiceLang,
} from '@/lib/speech';
import type { AdminItem } from './ItemsManager';
import { ownerDict } from '@/lib/owner-i18n';
import type { Locale } from '@/lib/i18n';

const LANG_STORAGE_KEY = 'dukaanflow:voice-lang';

/** How to put back whatever a spoken command just did. */
type Undo =
  | { type: 'delete'; itemId: string }
  | { type: 'price'; itemId: string; price: number }
  | { type: 'recreate'; item: AdminItem }
  | { type: 'stock'; itemId: string; inStock: boolean };

type LogEntry = {
  key: number;
  heard: string;
  status: 'done' | 'rejected' | 'failed';
  detail: string;
  undo?: Undo;
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

/** Spoken feedback, in the language the shopkeeper is dictating in. */
const PHRASES: Record<
  VoiceLang,
  {
    saved: (name: string, price: number) => string;
    removed: (name: string) => string;
    markedOut: (name: string) => string;
    markedIn: (name: string) => string;
    confirm: (what: string) => string;
    cancelled: string;
    noPrice: string;
    failed: string;
  }
> = {
  'en-IN': {
    saved: (name, price) => `${name} added at ${price} rupees`,
    removed: (name) => `${name} removed`,
    markedOut: (name) => `${name} marked out of stock`,
    markedIn: (name) => `${name} marked in stock`,
    confirm: (what) => `${what}? Say yes or no.`,
    cancelled: 'Cancelled. Please say it again.',
    noPrice: 'I did not catch the price. Please say the item and the price again.',
    failed: 'Could not do that. Please try again.',
  },
  'hi-IN': {
    saved: (name, price) => `${name} ${price} रुपये में जोड़ दिया`,
    removed: (name) => `${name} हटा दिया`,
    markedOut: (name) => `${name} खत्म कर दिया`,
    markedIn: (name) => `${name} उपलब्ध कर दिया`,
    confirm: (what) => `${what}? हाँ या नहीं बोलिए।`,
    cancelled: 'रद्द कर दिया। फिर से बोलिए।',
    noPrice: 'दाम समझ नहीं आया। सामान और दाम फिर से बोलिए।',
    failed: 'यह नहीं हो सका। दोबारा कोशिश कीजिए।',
  },
  'bn-IN': {
    saved: (name, price) => `${name} ${price} টাকায় যোগ হয়েছে`,
    removed: (name) => `${name} মুছে দেওয়া হয়েছে`,
    markedOut: (name) => `${name} শেষ বলে দেওয়া হয়েছে`,
    markedIn: (name) => `${name} আবার আছে বলে দেওয়া হয়েছে`,
    confirm: (what) => `${what}? হ্যাঁ বা না বলুন।`,
    cancelled: 'বাতিল করা হয়েছে। আবার বলুন।',
    noPrice: 'দাম বুঝতে পারিনি। জিনিস আর দাম আবার বলুন।',
    failed: 'করা যায়নি। আবার চেষ্টা করুন।',
  },
};

function draftLabel(draft: SpokenItemDraft): string {
  return draft.unit ? `${draft.name} · ${draft.unit}` : draft.name;
}

/** What a pending command will do, in words, for the confirmation prompt. */
function describe(command: VoiceCommand, t: ReturnType<typeof ownerDict>): string {
  if (command.kind === 'delete') return `${t.labelRemove}: ${command.label}`;
  if (command.kind === 'stock') {
    return `${command.label} — ${command.inStock ? t.inStock : t.outOfStock}`;
  }
  return `${command.label} — ${formatRupees(command.draft.price)}`;
}

/** The owner's reading language maps to the language they will dictate in. */
const LANG_FOR_LOCALE: Record<Locale, VoiceLang> = {
  en: 'en-IN',
  bn: 'bn-IN',
  hi: 'hi-IN',
};

export function VoiceItemAdder({
  slug,
  items,
  locale = 'en',
}: {
  slug: string;
  items: AdminItem[];
  locale?: Locale;
}) {
  const router = useRouter();
  const { push } = useToast();
  const t = ownerDict(locale);
  const [lang, setLang] = useState<VoiceLang>(LANG_FOR_LOCALE[locale]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{ command: VoiceCommand; heard: string } | null>(null);

  // A Bengali shopkeeper should not re-pick Bengali on every visit.
  useEffect(() => {
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (saved && VOICE_LANGS.some((option) => option.value === saved)) setLang(saved as VoiceLang);
  }, []);

  function changeLang(next: VoiceLang) {
    setLang(next);
    window.localStorage.setItem(LANG_STORAGE_KEY, next);
  }

  const langRef = useRef(lang);
  langRef.current = lang;
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const pendingRef = useRef(pending);
  pendingRef.current = pending;
  // Sentences can arrive faster than the API answers; a promise chain keeps
  // work in the order it was spoken and stops two writes from racing.
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
    setLog((current) => [{ ...entry, key: keyRef.current }, ...current].slice(0, 8));
  }, []);

  const call = useCallback(
    async (method: 'POST' | 'PATCH' | 'DELETE', body: unknown) => {
      const response = await fetch(`/api/admin/shop/${slug}/items`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = (await response.json().catch(() => ({}))) as { id?: string; error?: string };
      return { ok: response.ok, payload };
    },
    [slug],
  );

  const run = useCallback(
    async (command: VoiceCommand, heard: string) => {
      const phrases = PHRASES[langRef.current];
      setBusy(true);

      try {
        if (command.kind === 'delete') {
          const before = itemsRef.current.find((item) => item.id === command.item.id);
          const { ok } = await call('DELETE', { id: command.item.id });
          if (!ok || !before) {
            addEntry({ heard, status: 'failed', detail: 'Could not remove' });
            announce(phrases.failed);
            return;
          }
          addEntry({
            heard,
            status: 'done',
            detail: `Removed ${command.label}`,
            undo: { type: 'recreate', item: before },
          });
          announce(phrases.removed(command.label.replace(' · ', ' ')));
          router.refresh();
          return;
        }

        if (command.kind === 'stock') {
          const before = itemsRef.current.find((item) => item.id === command.item.id);
          const { ok } = await call('PATCH', { id: command.item.id, inStock: command.inStock });
          if (!ok) {
            addEntry({ heard, status: 'failed', detail: 'Could not update stock' });
            announce(phrases.failed);
            return;
          }
          addEntry({
            heard,
            status: 'done',
            detail: `${command.label} — ${command.inStock ? 'in stock' : 'out of stock'}`,
            undo: { type: 'stock', itemId: command.item.id, inStock: before?.inStock ?? true },
          });
          const spoken = command.label.replace(' · ', ' ');
          announce(command.inStock ? phrases.markedIn(spoken) : phrases.markedOut(spoken));
          router.refresh();
          return;
        }

        const { draft } = command;
        // Remembered before the write, so Undo knows whether this created a row
        // or merely re-priced one.
        const previous = itemsRef.current.find(
          (item) => item.name === draft.name && item.unit === draft.unit,
        );

        const { ok, payload } = await call('POST', {
          name: draft.name,
          nameBn: draft.nameBn,
          nameHi: draft.nameHi,
          price: draft.price,
          unit: draft.unit,
          category: draft.category,
          inStock: true,
        });

        if (!ok || !payload.id) {
          addEntry({ heard, status: 'failed', detail: payload.error ?? 'Save failed' });
          announce(phrases.failed);
          return;
        }

        addEntry({
          heard,
          status: 'done',
          detail: `${draftLabel(draft)} — ${formatRupees(draft.price)}`,
          undo: previous
            ? { type: 'price', itemId: payload.id, price: previous.price }
            : { type: 'delete', itemId: payload.id },
        });
        announce(phrases.saved(draftLabel(draft).replace(' · ', ' '), draft.price));
        router.refresh();
      } catch {
        addEntry({ heard, status: 'failed', detail: 'Network error' });
        announce(phrases.failed);
      } finally {
        setBusy(false);
      }
    },
    [call, router, announce, addEntry],
  );

  const handlePhrase = useCallback(
    (alternatives: string[]) => {
      queueRef.current = queueRef.current.then(async () => {
        const phrases = PHRASES[langRef.current];
        const heard = alternatives[0] ?? '';

        // A confirmation is outstanding: this sentence is the answer to it.
        const outstanding = pendingRef.current;
        if (outstanding) {
          const answer = spokenYesNo(alternatives);
          if (answer === 'yes') {
            setPending(null);
            await run(outstanding.command, outstanding.heard);
            return;
          }
          if (answer === 'no') {
            setPending(null);
            addEntry({ heard: outstanding.heard, status: 'rejected', detail: 'Not confirmed' });
            announce(phrases.cancelled);
            return;
          }
          // Neither yes nor no — fall through and treat it as a fresh sentence.
          setPending(null);
        }

        const command = resolveSpokenCommand(alternatives, langRef.current, itemsRef.current);
        if (!command) {
          addEntry({ heard, status: 'rejected', detail: 'No price heard' });
          announce(phrases.noPrice);
          return;
        }

        if (command.needsConfirm) {
          setPending({ command, heard });
          announce(phrases.confirm(describe(command, t)));
          return;
        }

        await run(command, heard);
      });
    },
    [run, announce, addEntry],
  );

  const { supported, listening, errorCode, interim, toggle, start, stop } = useVoice({
    lang,
    onPhrase: handlePhrase,
  });
  voiceRef.current = { stop, start, listening };

  async function undo(entry: LogEntry) {
    if (!entry.undo) return;
    const action = entry.undo;

    const result =
      action.type === 'delete'
        ? await call('DELETE', { id: action.itemId })
        : action.type === 'price'
          ? await call('PATCH', { id: action.itemId, price: action.price })
          : action.type === 'stock'
            ? await call('PATCH', { id: action.itemId, inStock: action.inStock })
            : await call('POST', {
                name: action.item.name,
                nameBn: action.item.nameBn,
                nameHi: action.item.nameHi,
                price: action.item.price,
                unit: action.item.unit,
                category: action.item.category,
                inStock: action.item.inStock,
              });

    if (!result.ok) {
      push(t.networkError, 'error');
      return;
    }

    setLog((current) => current.filter((row) => row.key !== entry.key));
    push(t.undone, 'success');
    router.refresh();
  }

  if (!supported) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
        Voice needs Chrome, Edge, or Safari. Use the form below on this browser.
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <div className="flex items-start gap-3">
        <MicButton
          listening={listening}
          onClick={toggle}
          label={t.voiceTitle}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-slate-900">{t.voiceTitle}</h2>
            <select
              value={lang}
              onChange={(event) => changeLang(event.target.value as VoiceLang)}
              aria-label={t.language}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm"
            >
              {VOICE_LANGS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {busy && <span className="text-xs text-slate-400">{t.working}</span>}
          </div>

          <p className="mt-1 text-sm text-slate-600">
            {listening ? interim || t.voiceListening : t.voiceIdle}
          </p>
          <ul className="mt-1 space-y-0.5 text-xs text-slate-400">
            <li>
              {t.labelAdd}: {t.voiceExampleAdd}
            </li>
            <li>
              {t.labelOut}: {t.voiceExampleOut}
            </li>
            <li>
              {t.labelRemove}: {t.voiceExampleRemove}
            </li>
          </ul>

          {errorCode && <p className="mt-2 text-sm text-red-600">{VOICE_ERRORS[errorCode]}</p>}
        </div>
      </div>

      {pending && (
        <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3">
          <p className="text-sm text-amber-900">
            {t.confirmHeard} “{pending.heard}”. <strong>{describe(pending.command, t)}</strong>?
          </p>
          <p className="mt-1 text-xs text-amber-700">{t.confirmSayYesNo}</p>
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                const confirmed = pending;
                setPending(null);
                void run(confirmed.command, confirmed.heard);
              }}
            >
              {t.yes}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setPending(null)}>
              {t.no}
            </Button>
          </div>
        </div>
      )}

      {log.length > 0 && (
        <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-3">
          {log.map((entry) => (
            <li key={entry.key} className="flex items-baseline gap-2 text-sm">
              <span
                className={clsx(
                  'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                  entry.status === 'done' && 'bg-green-50 text-green-700',
                  entry.status === 'rejected' && 'bg-amber-50 text-amber-700',
                  entry.status === 'failed' && 'bg-red-50 text-red-700',
                )}
              >
                {entry.status === 'done'
                  ? t.statusDone
                  : entry.status === 'rejected'
                    ? t.statusUnclear
                    : t.statusFailed}
              </span>
              <span className="min-w-0 flex-1 text-slate-700">
                {entry.detail}
                <span className="text-slate-400"> — heard “{entry.heard}”</span>
              </span>
              {entry.undo && (
                <button
                  type="button"
                  onClick={() => undo(entry)}
                  className="shrink-0 text-xs font-medium text-slate-500 underline hover:text-slate-800"
                >
                  {t.undo}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {log.some((entry) => entry.status !== 'done') && (
        <button
          type="button"
          onClick={() => setLog([])}
          className="mt-2 text-xs text-slate-400 underline"
        >
          {t.clearLog}
        </button>
      )}
    </div>
  );
}
