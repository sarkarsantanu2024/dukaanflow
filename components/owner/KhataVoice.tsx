'use client';

/**
 * Writing the credit book by speaking to it.
 *
 * "রেখা দি একশো টাকা বাকি" — a name, a number, and which way the money went.
 *
 * THE SHAPE IS THE STOREFRONT'S AND THE TILL'S, NOT A NEW ONE. A floating mic
 * in the bottom-right corner above the tab bar, and a bubble that appears over
 * it only when there is something to read. This was built once as a card sitting
 * in the page flow, which put a fifth thing between the shopkeeper and their
 * list of names and looked like nothing else in the product. An owner who has
 * learned the mic on the items screen has already learned this one; a second
 * arrangement for the same tool is a second thing to learn for no reason.
 *
 * THE TAP IS NOT NEGOTIABLE. Nothing here writes on the strength of a
 * recogniser's guess: the reading is shown, said out loud, and waits. A
 * mis-heard name posts one customer's debt onto another's account, and that is
 * the precise argument the khata exists to end — losing the book's authority is
 * a far worse outcome than one extra tap.
 *
 * WHY SPEAKING IT BACK MATTERS MORE THAN SHOWING IT. The owner this is for
 * cannot read the bubble. They can hear "রেখা, একশো টাকা বাকি? ঠিক আছে?" and
 * answer it. The bubble is for everybody else, and for the tick.
 *
 * Only names already in the book can be spoken. A new customer needs a phone
 * number, and dictating ten digits across a counter to a browser recogniser is
 * not something to build a ledger on — that stays on the typed form below.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { MicButton } from '@/components/voice/MicButton';
import { speak, useVoice } from '@/components/voice/useVoice';
import { VOICE_ERRORS } from '@/components/voice/errors';
import { CloseIcon } from '@/components/ui/Icon';
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
import { spokenKhataAsk, spokenKhataEntry, spokenKhataNoMatch } from '@/lib/spoken-money';

const RECOGNITION_LANG: Record<Locale, VoiceLang> = {
  en: 'en-IN',
  hi: 'hi-IN',
  bn: 'bn-IN',
};

export type VoiceCustomer = MatchableCustomer & { balancePaise: number };

type Pending = {
  customer: VoiceCustomer;
  amountPaise: number;
  /** Null when the sentence never said which way — the bubble asks. */
  kind: KhataKind | null;
  /** Below `KHATA_CONFIDENT` the name is the thing to check, and it is coloured. */
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
  /** Closing the bubble, exactly as the storefront's mic allows. */
  const [dismissed, setDismissed] = useState(false);

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
      // One reading at a time. Anything said while the bubble is waiting is
      // noise as far as this screen is concerned — the owner is being asked a
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
        setDismissed(false);
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
        setDismissed(false);
        setMissed(attempted.name);
        say(spokenKhataNoMatch(locale, attempted.name));
      }
    },
    [locale, say],
  );

  const voice = useVoice({ lang, onPhrase });
  voiceRef.current = { stop: voice.stop };

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

  /**
   * Is there anything to show above the mic?
   *
   * Same test the storefront's mic makes: the bubble exists only while it has
   * something to say and gets out of the way again afterwards, because there is
   * no card standing permanently open to hold it.
   */
  const hasSomethingToSay =
    voice.listening || Boolean(pending) || Boolean(missed) || Boolean(voice.errorCode);
  const speaking = hasSomethingToSay && !dismissed;

  /** The inline buttons in the bubble, matching the storefront's suggestion box. */
  const yes =
    'h-10 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60';
  const no =
    'h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50';

  return (
    <div className="no-print pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-3xl flex-col items-end gap-3 px-4">
      <div className="pointer-events-auto relative">
        {/* Anchored above the mic rather than stacked with it in the flow —
            as a sibling it would be 20rem wide and shove the mic across the
            screen every time it had something to say. */}
        {speaking && (
          <div className="absolute bottom-full right-0 mb-3 w-[min(20rem,calc(100vw-2rem))] rounded-2xl bg-white p-3 shadow-lg ring-1 ring-slate-200">
            <div className="flex items-start gap-2">
              <p className="min-w-0 flex-1 text-sm font-semibold text-slate-900">
                {voice.listening ? t.khataVoiceListening : t.khataVoiceTap}
              </p>
              <button
                type="button"
                onClick={() => {
                  setDismissed(true);
                  setPending(null);
                  setMissed(null);
                  if (voice.listening) voice.stop();
                }}
                aria-label={t.khataVoiceNo}
                className="-m-1 shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            {/* The worked sentence, replaced by whatever is being heard. It is
                the only instruction that ever taught anybody how to talk to
                this, so it stays up until there is something better to show. */}
            <p className="mt-0.5 text-sm text-slate-500">
              {voice.interim || t.khataVoiceExample}
            </p>

            {voice.errorCode && (
              <p className="mt-1 text-sm text-red-600">{VOICE_ERRORS[voice.errorCode]}</p>
            )}

            {missed && (
              <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3">
                <p className="text-sm text-amber-900">{t.khataVoiceNoMatch}</p>
              </div>
            )}

            {pending && (
              <div
                className={clsx(
                  'mt-3 rounded-xl border p-3',
                  // An unsure match is the one case worth colouring, because
                  // the thing to check is the NAME and nothing else says so.
                  pending.sure ? 'border-slate-200 bg-slate-50' : 'border-amber-300 bg-amber-50',
                )}
              >
                <p className="text-base font-bold text-slate-900">{pending.customer.name}</p>
                <p className="text-2xl font-bold tabular-nums text-slate-900">
                  {formatPaise(pending.amountPaise)}
                </p>

                {pending.kind === null ? (
                  <>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {t.khataVoiceWhichWay}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void commit('DEBIT')}
                        className={yes}
                      >
                        {t.khataVoiceOwes}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void commit('CREDIT')}
                        className={yes}
                      >
                        {t.khataVoicePaid}
                      </button>
                      <button type="button" onClick={() => setPending(null)} className={no}>
                        {t.khataVoiceNo}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {pending.kind === 'DEBIT' ? t.khataVoiceOwes : t.khataVoicePaid}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void commit(pending.kind as KhataKind)}
                        className={yes}
                      >
                        {t.khataVoiceYes}
                      </button>
                      <button type="button" onClick={() => setPending(null)} className={no}>
                        {t.khataVoiceNo}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Green, and the same 14×14 as the items screen's add button: in the
            owner's app the floating primary action is brand-coloured, and the
            khata's own rows carry no green button for this to be confused
            with. The storefront's mic is dark for the opposite reason. */}
        <MicButton
          listening={voice.listening}
          tone="brand"
          onClick={() => {
            setDismissed(false);
            setMissed(null);
            setPending(null);
            voice.toggle();
          }}
          label={voice.listening ? t.khataVoiceListening : t.khataVoiceTap}
          className="shadow-xl"
        />
      </div>
    </div>
  );
}
