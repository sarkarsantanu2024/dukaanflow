'use client';

/**
 * Writing the credit book by speaking to it.
 *
 * "রেখা দি একশো টাকা বাকি" — a name, a number, and which way the money went.
 *
 * THE TAP IS NOT NEGOTIABLE. Nothing here writes on the strength of a
 * recogniser's guess: the reading is shown, said out loud, and waits. A
 * mis-heard name posts one customer's debt onto another's account, and that is
 * the precise argument the khata exists to end — losing the book's authority is
 * a far worse outcome than one extra tap.
 *
 * WHY SPEAKING IT BACK MATTERS MORE THAN SHOWING IT. The owner this is for
 * cannot read the card. They can hear "রেখা, একশো টাকা বাকি? ঠিক আছে?" and
 * answer it. The card is for everybody else, and for the tick.
 *
 * Only names already in the book can be spoken. A new customer needs a phone
 * number, and dictating ten digits across a counter to a browser recogniser is
 * not something to build a ledger on — that stays on the typed form below.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { MicButton } from '@/components/voice/MicButton';
import { speak, useVoice } from '@/components/voice/useVoice';
import { Button } from '@/components/ui/Button';
import { ownerDict } from '@/lib/owner-i18n';
import { formatPaise } from '@/lib/money';
import type { Locale } from '@/lib/i18n';
import type { VoiceLang } from '@/lib/speech';
import {
  KHATA_CONFIDENT,
  matchCustomer,
  parseSpokenKhata,
  resolveSpokenKhata,
  type KhataKind,
  type MatchableCustomer,
} from '@/lib/khata-speech';
import {
  spokenKhataAsk,
  spokenKhataEntry,
  spokenKhataNoMatch,
} from '@/lib/spoken-money';

const RECOGNITION_LANG: Record<Locale, VoiceLang> = {
  en: 'en-IN',
  hi: 'hi-IN',
  bn: 'bn-IN',
};

export type VoiceCustomer = MatchableCustomer & { balancePaise: number };

type Pending = {
  customer: VoiceCustomer;
  amountPaise: number;
  /** Null when the sentence never said which way — the card asks. */
  kind: KhataKind | null;
  /** Below `KHATA_CONFIDENT` the card says the name louder. */
  sure: boolean;
};

export function KhataVoice({
  customers,
  locale,
  busy,
  onCommit,
}: {
  customers: VoiceCustomer[];
  locale: Locale;
  busy: boolean;
  /** Writes the entry. Resolves true when it actually landed. */
  onCommit: (customer: VoiceCustomer, kind: KhataKind, amountPaise: number) => Promise<boolean>;
}) {
  const t = ownerDict(locale);
  const lang = RECOGNITION_LANG[locale];

  const [pending, setPending] = useState<Pending | null>(null);
  const [missed, setMissed] = useState<string | null>(null);

  // The handler is rebuilt on every render as the customer list changes, and
  // `useVoice` holds it in a ref — but the mic controls have to be reachable
  // from inside the handler too, which is the one direction a ref is needed in.
  const voiceRef = useRef<{ stop: () => void } | null>(null);

  /**
   * Everything `onPhrase` reads, held in refs and declared before it.
   *
   * The recogniser keeps ONE handler for the life of a session. A value closed
   * over directly would be whatever it was when the mic was tapped — so an
   * entry spoken two minutes later would be matched against the customer list
   * as it stood before the last three entries were written, and posted against
   * a stale balance.
   */
  const pendingRef = useRef(pending);
  pendingRef.current = pending;
  const busyRef = useRef(busy);
  busyRef.current = busy;
  const customersRef = useRef(customers);
  customersRef.current = customers;

  /**
   * Say something, with the microphone off.
   *
   * The recogniser hears the phone's own speaker and transcribes it, so a
   * spoken confirmation with a live mic feeds itself: the app says "একশো টাকা
   * বাকি", hears it, and offers to write it again. Every read-back stops first.
   */
  const say = useCallback(
    (text: string) => {
      voiceRef.current?.stop();
      speak(text, lang);
    },
    [lang],
  );

  const onPhrase = useCallback(
    (alternatives: string[]) => {
      // One reading at a time. Anything said while a card is waiting is noise
      // as far as this screen is concerned — the owner is being asked a
      // question, not dictating a second entry.
      if (pendingRef.current || busyRef.current) return;

      const resolved = resolveSpokenKhata(alternatives, customersRef.current);

      if (resolved) {
        const next: Pending = {
          customer: resolved.match.customer,
          amountPaise: resolved.entry.amountPaise,
          kind: resolved.entry.kind,
          sure: resolved.match.confidence >= KHATA_CONFIDENT,
        };
        setMissed(null);
        setPending(next);
        say(spokenKhataAsk(locale, next.customer.name, next.amountPaise, next.kind));
        return;
      }

      /**
       * Nothing matched. Two very different failures hide behind that, and only
       * one of them is worth interrupting for.
       *
       * A sentence that carried a name AND an amount but reached nobody in the
       * book is the owner talking to the app and being missed — say so. A
       * sentence that parsed to nothing at all is a customer talking, a radio,
       * a road; answering that would make the phone shout over the shop.
       */
      const attempted = alternatives
        .map((alternative) => parseSpokenKhata(alternative))
        .find((entry) => entry !== null);

      if (attempted && matchCustomer(attempted.name, customersRef.current) === null) {
        setMissed(attempted.name);
        say(spokenKhataNoMatch(locale, attempted.name));
      }
    },
    [locale, say],
  );

  const voice = useVoice({ lang, onPhrase });
  voiceRef.current = { stop: voice.stop };

  // A card left on screen when the owner walks away should not be waiting to
  // write money the next time the tab is opened.
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    };
  }, []);

  if (!voice.supported) return null;

  async function commit(kind: KhataKind) {
    const entry = pending;
    if (!entry) return;

    setPending(null);
    const ok = await onCommit(entry.customer, kind, entry.amountPaise);
    if (!ok) return;

    // The server does exactly this arithmetic; saying it here means the owner
    // hears the new balance without waiting for the page to come back.
    const balancePaise =
      entry.customer.balancePaise + (kind === 'DEBIT' ? entry.amountPaise : -entry.amountPaise);

    say(spokenKhataEntry(locale, entry.customer.name, entry.amountPaise, kind, balancePaise));
  }

  return (
    <section className="rounded-2xl bg-white p-4 shadow-card">
      <div className="flex items-center gap-4">
        <MicButton
          listening={voice.listening}
          onClick={() => {
            setMissed(null);
            setPending(null);
            voice.toggle();
          }}
          label={voice.listening ? t.khataVoiceListening : t.khataVoiceTap}
        />
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">
            {voice.listening ? t.khataVoiceListening : t.khataVoiceTap}
          </p>
          {/* The worked sentence stays up while listening. It is the only
              instruction that ever taught anybody how to talk to this. */}
          <p className="mt-0.5 text-sm text-slate-500">{t.khataVoiceExample}</p>
          {voice.interim && (
            <p className="mt-1 truncate text-sm italic text-slate-400">{voice.interim}</p>
          )}
        </div>
      </div>

      {missed && (
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {t.khataVoiceNoMatch}
        </p>
      )}

      {pending && (
        <div
          className={clsx(
            'mt-4 rounded-xl border-2 p-4',
            // An unsure match is the one case worth colouring, because the
            // thing to check is the NAME and nothing else on the card says so.
            pending.sure ? 'border-brand-200 bg-brand-50' : 'border-amber-300 bg-amber-50',
          )}
        >
          <p className="text-lg font-bold text-slate-900">{pending.customer.name}</p>
          <p className="text-3xl font-bold tabular-nums text-slate-900">
            {formatPaise(pending.amountPaise)}
          </p>

          {pending.kind === null ? (
            <>
              <p className="mt-2 text-sm font-semibold text-slate-700">{t.khataVoiceWhichWay}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="lg" disabled={busy} onClick={() => void commit('DEBIT')}>
                  {t.khataVoiceOwes}
                </Button>
                <Button size="lg" variant="secondary" disabled={busy} onClick={() => void commit('CREDIT')}>
                  {t.khataVoicePaid}
                </Button>
                <Button size="lg" variant="ghost" onClick={() => setPending(null)}>
                  {t.khataVoiceNo}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm font-semibold text-slate-700">
                {pending.kind === 'DEBIT' ? t.khataVoiceOwes : t.khataVoicePaid}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="lg"
                  disabled={busy}
                  onClick={() => void commit(pending.kind as KhataKind)}
                >
                  {t.khataVoiceYes}
                </Button>
                <Button size="lg" variant="ghost" onClick={() => setPending(null)}>
                  {t.khataVoiceNo}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
