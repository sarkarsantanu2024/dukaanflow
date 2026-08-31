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

const LANG_STORAGE_KEY = 'halkhata:voice-lang';

/** How to put back whatever a spoken command just did. */
type Undo =
  | { type: 'delete'; itemId: string }
  // PAISE, and named so. An undo that quietly restores a hundredth of the old
  // price is the worst kind of bug: it looks like it worked.
  | { type: 'price'; itemId: string; pricePaise: number }
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
    /** Understood the instruction, but the item it named is not on the list. */
    notListed: (name: string) => string;
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
    noPrice: 'I did not catch that. Please say the name of one item.',
    notListed: (name) => `${name} is not on your list.`,
    failed: 'Could not do that. Please try again.',
  },
  'hi-IN': {
    saved: (name, price) => `${name} ${price} रुपये में जोड़ दिया`,
    removed: (name) => `${name} हटा दिया`,
    markedOut: (name) => `${name} खत्म कर दिया`,
    markedIn: (name) => `${name} उपलब्ध कर दिया`,
    confirm: (what) => `${what}? हाँ या नहीं बोलिए।`,
    cancelled: 'रद्द कर दिया। फिर से बोलिए।',
    noPrice: 'समझ नहीं आया। एक सामान का नाम बोलिए।',
    notListed: (name) => `${name} आपकी सूची में नहीं है।`,
    failed: 'यह नहीं हो सका। दोबारा कोशिश कीजिए।',
  },
  'bn-IN': {
    saved: (name, price) => `${name} ${price} টাকায় যোগ হয়েছে`,
    removed: (name) => `${name} মুছে দেওয়া হয়েছে`,
    markedOut: (name) => `${name} শেষ বলে দেওয়া হয়েছে`,
    markedIn: (name) => `${name} আবার আছে বলে দেওয়া হয়েছে`,
    confirm: (what) => `${what}? হ্যাঁ বা না বলুন।`,
    cancelled: 'বাতিল করা হয়েছে। আবার বলুন।',
    noPrice: 'বুঝতে পারিনি। একটা জিনিসের নাম বলুন।',
    notListed: (name) => `${name} আপনার তালিকায় নেই।`,
    failed: 'করা যায়নি। আবার চেষ্টা করুন।',
  },
};

function draftLabel(draft: SpokenItemDraft): string {
  return draft.name;
}

/** What a pending command will do, in words, for the confirmation prompt. */
function describe(command: VoiceCommand, t: ReturnType<typeof ownerDict>): string {
  if (command.kind === 'delete') return `${t.labelRemove}: ${command.label}`;
  if (command.kind === 'stock') {
    return `${command.label} — ${command.inStock ? t.inStock : t.outOfStock}`;
  }
  if (command.kind === 'exists') return `${command.label} — ${t.voiceAlready}`;
  return command.label;
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
  onDraft,
}: {
  slug: string;
  items: AdminItem[];
  locale?: Locale;
  /**
   * Where the mic sits above a form, a new item fills that form instead of
   * saving on its own — the owner reads back what was heard, in the boxes they
   * were going to fill anyway, and one Save covers all of it.
   *
   * The whole sentence comes through, not just the name. An owner who says
   * "বাসমতি চাল ১০০ টাকা কিলো" has already given the price and the pack
   * size; handing back the name and two empty boxes throws away work they did
   * out loud and asks them to do it again by hand.
   *
   * Removals and stock changes still act immediately; those name something
   * already on the list, so there is nothing to review.
   */
  onDraft?: (draft: { name: string; unit: string; pricePaise: number | null }) => void;
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
  // `run` and `handlePhrase` are memoised for the life of the component, so
  // anything from props they reach for has to come through a ref — captured in
  // the closure it would still be whatever it was on first render.
  const onDraftRef = useRef(onDraft);
  onDraftRef.current = onDraft;
  const tRef = useRef(t);
  tRef.current = t;
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
      const t = tRef.current;
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

        // Named something the shop does not have. Nothing to do, and saying
        // so is the whole point — inventing the item would be the opposite of
        // what was asked for.
        if (command.kind === 'missing') {
          addEntry({ heard, status: 'rejected', detail: `${command.label} — ${t.voiceNotListed}` });
          announce(phrases.notListed(command.label));
          return;
        }

        // Already stocked. Saying its name is not an instruction to change
        // anything, and the price on that row is the owner's.
        if (command.kind === 'exists') {
          addEntry({ heard, status: 'done', detail: `${command.label} — ${t.voiceAlready}` });
          announce(`${command.label} ${t.voiceAlready}`);
          return;
        }

        const { draft } = command;

        // Handed to the form rather than saved, when there is a form to hand it
        // to. The word appears in the Name box where the owner can see whether
        // it was heard correctly before anything is written.
        const onDraft = onDraftRef.current;
        if (onDraft) {
          onDraft({ name: draft.name, unit: draft.unit, pricePaise: draft.pricePaise });
          addEntry({ heard, status: 'done', detail: draftLabel(draft) });
          announce(draftLabel(draft));
          return;
        }

        // Listed unpriced, the way a starter item is: the owner said what they
        // sell, not what it costs. Pricing the row is the next thing they do.
        const { ok, payload } = await call('POST', {
          name: draft.name,
          nameBn: draft.nameBn,
          nameHi: draft.nameHi,
          // `pricePaise`, and 100 of them — Re 1.
          //
          // This said `price: 1`, which was wrong twice over. The API takes
          // `pricePaise` and rejects a body without it, so every voice-added
          // item on a wide screen failed validation and the owner was told
          // only "could not save"; and 1 paise would have been refused anyway,
          // the floor being 50.
          pricePaise: 100,
          // A placeholder, not a price. Keeps the row off the shop page until
          // somebody says what it actually costs.
          priced: false,
          unit: '',
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
          detail: `${draftLabel(draft)} — ${t.voiceSetPrice}`,
          undo: { type: 'delete', itemId: payload.id },
        });
        announce(`${draftLabel(draft)} — ${t.voiceSetPrice}`);
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
        const t = tRef.current;
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

        // A spoken yes/no, except where the word is only going into a form.
        // There the owner reads it in the Name box with their thumb over Save,
        // which is a better check than a yes/no they answer without looking —
        // and asking twice for one item is how a tool starts feeling slow.
        if (command.needsConfirm && !(command.kind === 'upsert' && onDraftRef.current)) {
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
          ? await call('PATCH', { id: action.itemId, pricePaise: action.pricePaise })
          : action.type === 'stock'
            ? await call('PATCH', { id: action.itemId, inStock: action.inStock })
            : await call('POST', {
                name: action.item.name,
                nameBn: action.item.nameBn,
                nameHi: action.item.nameHi,
                pricePaise: action.item.pricePaise,
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
