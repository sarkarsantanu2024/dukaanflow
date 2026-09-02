'use client';

/**
 * Thin wrapper over the two browser speech APIs:
 *   SpeechRecognition  — mic in  (Chrome, Edge, Android Chrome, iOS Safari 14.5+)
 *   speechSynthesis    — speaker out
 *
 * Both are vendor-prefixed on WebKit and missing entirely on Firefox, so
 * `supported` is exposed and every caller renders the mic only when it is true.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { VoiceLang } from '@/lib/speech';

// The DOM lib has no SpeechRecognition types; only the bits we use are declared.
type RecognitionResult = { transcript: string; isFinal: boolean };

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  onspeechstart: (() => void) | null;
};

/**
 * How long the recogniser may go without a single sign of life before it is
 * torn down and rebuilt.
 *
 * Chrome ends a recognition session of its own accord well inside a minute of
 * silence, and `onend` restarts it — so in a healthy session something touches
 * `lastEventRef` every few seconds whether or not anybody is talking. Ninety
 * seconds of nothing at all is not a quiet shop; it is Chrome's speech service
 * having gone away without telling us, which it does, and which no amount of
 * waiting recovers from.
 */
const SILENT_LIMIT_MS = 90_000;

/** How often to ask whether that has happened. */
const WATCHDOG_MS = 15_000;

/** Long enough for Chrome to finish tearing a session down before the next. */
const RESTART_DELAY_MS = 250;

function recognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type VoiceState = 'idle' | 'listening' | 'denied' | 'error';

/**
 * Why the mic is not running. Chrome collapses several very different causes
 * into one `not-allowed`/`service-not-allowed` pair, so these are separated
 * here — "you blocked the mic" and "this browser cannot reach the speech
 * service" need different fixes from the user.
 */
export type VoiceErrorCode =
  | 'insecure-context'
  | 'not-allowed'
  | 'service-not-allowed'
  | 'no-microphone'
  | 'network'
  | 'unknown';

export type UseVoiceOptions = {
  lang: VoiceLang;
  /**
   * Called once per completed sentence, with the recogniser's ranked guesses —
   * best first. Callers should try them all: on an unclear speaker the top
   * guess is often wrong where the second or third is exactly right.
   */
  onPhrase: (alternatives: string[]) => void;
};

export function useVoice({ lang, onPhrase }: UseVoiceOptions) {
  const [supported, setSupported] = useState(false);
  const [state, setState] = useState<VoiceState>('idle');
  const [errorCode, setErrorCode] = useState<VoiceErrorCode | null>(null);
  const [interim, setInterim] = useState('');

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  // The recogniser stops itself after a pause; `wantedRef` tells onend whether
  // that was the user tapping stop or just silence, so we can restart.
  const wantedRef = useRef(false);
  const restartTimerRef = useRef<number | null>(null);
  /** When this recogniser last showed any sign of life. See `SILENT_LIMIT_MS`. */
  const lastEventRef = useRef(0);
  const onPhraseRef = useRef(onPhrase);
  onPhraseRef.current = onPhrase;
  const langRef = useRef(lang);
  langRef.current = lang;

  useEffect(() => {
    setSupported(recognitionCtor() !== null && 'speechSynthesis' in window);
  }, []);

  const cancelRestart = useCallback(() => {
    if (restartTimerRef.current !== null) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  /**
   * TAKES A RECOGNISER OUT OF SERVICE FOR GOOD.
   *
   * Unhooking the handlers before aborting is the whole point, and it is what
   * was missing. `abort()` makes Chrome fire `onend` on the NEXT tick — by
   * which time `start()` had already built a replacement and set `wantedRef`
   * back to true, so the dead recogniser's own `onend` read "yes, we want to be
   * listening" and called `start()` on ITSELF. Two recognisers then streamed
   * the same microphone, and because `aborted` is treated as routine noise in
   * `onerror`, the pair simply took turns aborting and restarting each other
   * with nothing reaching `onPhrase`.
   *
   * Every spoken reply does a stop/start cycle, so a few of these stacked up
   * within a couple of minutes of ordinary use: the button still said
   * Listening, and the mic had stopped hearing anything.
   */
  const retire = useCallback((recognition: SpeechRecognitionLike | null) => {
    if (!recognition) return;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    recognition.onstart = null;
    recognition.onspeechstart = null;
    try {
      recognition.abort();
    } catch {
      /* already gone */
    }
  }, []);

  const stop = useCallback(() => {
    wantedRef.current = false;
    cancelRestart();
    const current = recognitionRef.current;
    recognitionRef.current = null;
    retire(current);
    setState('idle');
    setInterim('');
  }, [cancelRestart, retire]);

  /**
   * Builds a recogniser and starts it, replacing whatever was running.
   *
   * Split out from `start` so the watchdog and the restart timer can rebuild
   * the session without going back through the permission prompt — that check
   * belongs to the user tapping the mic, not to a recovery that happens while
   * they are mid-sentence.
   */
  const launch = useCallback(() => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;

    cancelRestart();
    const previous = recognitionRef.current;
    recognitionRef.current = null;
    retire(previous);

    const recognition = new Ctor();
    recognition.lang = langRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;
    // Ask for several readings, not just the top one — see `onPhrase`.
    recognition.maxAlternatives = 5;

    /** Ignore anything from an instance that has since been replaced. */
    const current = () => recognitionRef.current === recognition;
    const alive = () => {
      lastEventRef.current = Date.now();
    };

    recognition.onstart = alive;
    recognition.onspeechstart = alive;

    recognition.onresult = (event: any) => {
      if (!current()) return;
      alive();

      let pending = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i] as unknown as ArrayLike<RecognitionResult> & {
          isFinal: boolean;
          length: number;
        };

        if (!result.isFinal) {
          pending += String(result[0]?.transcript ?? '');
          continue;
        }

        const alternatives: string[] = [];
        for (let n = 0; n < result.length; n += 1) {
          const phrase = String(result[n]?.transcript ?? '').trim();
          if (phrase && !alternatives.includes(phrase)) alternatives.push(phrase);
        }
        if (alternatives.length > 0) onPhraseRef.current(alternatives);
      }
      setInterim(pending.trim());
    };

    recognition.onerror = (event: any) => {
      if (!current()) return;
      const code = String(event?.error ?? '');

      // "no-speech" and "aborted" are routine during a long session; onend
      // restarts us, so they must not surface as failures.
      if (!code || code === 'no-speech' || code === 'aborted') {
        alive();
        return;
      }

      wantedRef.current = false;

      if (code === 'not-allowed') {
        setErrorCode('not-allowed');
        setState('denied');
      } else if (code === 'service-not-allowed') {
        // The mic permission is fine — Chrome itself refused to run speech
        // recognition. Enterprise policy on a managed profile and a missing
        // Google speech service both land here.
        setErrorCode('service-not-allowed');
        setState('denied');
      } else if (code === 'network') {
        // Chrome streams audio to Google's servers; offline means no results.
        setErrorCode('network');
        setState('error');
      } else if (code === 'audio-capture') {
        /**
         * The permission was granted and there is still nothing to listen to.
         *
         * A desktop with no microphone, a headset that has just been unplugged,
         * or another application holding the device — all land here, and all of
         * them are "no microphone" as far as the person tapping the mic is
         * concerned. This fell through to `unknown`, which reads "voice is not
         * available on this browser" — sending somebody to change browsers over
         * a mic that was never plugged in. Found by testing on a machine that
         * genuinely has no microphone.
         */
        setErrorCode('no-microphone');
        setState('error');
      } else {
        setErrorCode('unknown');
        setState('error');
      }
    };

    recognition.onend = () => {
      if (!current()) return;
      alive();
      setInterim('');

      if (!wantedRef.current) {
        setState((state) => (state === 'listening' ? 'idle' : state));
        return;
      }

      /**
       * Chrome ends the session on its own after a stretch of silence. Restart,
       * so the shopkeeper can keep dictating without tapping the mic again —
       * but on a later tick, not from inside this handler.
       *
       * Calling `start()` synchronously here throws `InvalidStateError` when
       * the session has not finished tearing down, and the old code answered
       * that by falling through to `idle`: the mic died and only the label
       * said so.
       */
      restartTimerRef.current = window.setTimeout(() => {
        restartTimerRef.current = null;
        if (!current() || !wantedRef.current) return;
        try {
          recognition.start();
          lastEventRef.current = Date.now();
        } catch {
          // Still not ready, or already running again. A full rebuild is
          // always safe and the watchdog would do it anyway.
          launchRef.current?.();
        }
      }, RESTART_DELAY_MS);
    };

    recognitionRef.current = recognition;
    wantedRef.current = true;
    lastEventRef.current = Date.now();
    try {
      recognition.start();
      setState('listening');
    } catch {
      setErrorCode('unknown');
      setState('error');
    }
  }, [cancelRestart, retire]);

  // `onend` may need to rebuild the session, and it closes over `launch`
  // before `launch` exists. A ref is the only way round that ordering.
  const launchRef = useRef<(() => void) | null>(null);
  launchRef.current = launch;

  const start = useCallback(async () => {
    if (!recognitionCtor()) return;

    // A previous failure must not linger on screen once the user retries.
    setErrorCode(null);

    // `http://` on a LAN address (192.168.x.x, a phone testing the dev server)
    // is not a secure context, and Chrome then refuses the mic with the same
    // opaque error as a real block. Say which one it is.
    if (!window.isSecureContext) {
      setErrorCode('insecure-context');
      setState('denied');
      return;
    }

    // Ask for the mic explicitly first. SpeechRecognition asks implicitly, but
    // its rejection carries no reason; getUserMedia distinguishes "user said
    // no" from "this device has no microphone", and it is what actually raises
    // Chrome's permission prompt on the first tap.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // We only wanted the permission — recognition opens its own stream.
      stream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      const name = (error as { name?: string })?.name;
      setErrorCode(name === 'NotFoundError' || name === 'OverconstrainedError' ? 'no-microphone' : 'not-allowed');
      setState('denied');
      return;
    }

    launch();
  }, [launch]);

  const toggle = useCallback(() => {
    if (state === 'listening') stop();
    else void start();
  }, [state, start, stop]);

  /**
   * THE RECOGNISER THAT DIES WITHOUT SAYING SO.
   *
   * Chrome's speech service can stop delivering results and never fire `onend`
   * or `onerror` — the object stays in its "started" state and simply hears
   * nothing, for the rest of the session. Nothing in the callbacks can notice
   * that, because the whole failure is the absence of callbacks.
   *
   * So the session is checked from outside it. A healthy recogniser touches
   * `lastEventRef` every few seconds — Chrome closes and we reopen it far
   * inside the limit even in a silent room — and a minute and a half of total
   * silence from the API means it is gone. Rebuilt from scratch rather than
   * restarted: an instance in that state does not come back.
   */
  useEffect(() => {
    if (state !== 'listening') return;

    const timer = window.setInterval(() => {
      if (!wantedRef.current || restartTimerRef.current !== null) return;
      if (Date.now() - lastEventRef.current < SILENT_LIMIT_MS) return;
      launch();
    }, WATCHDOG_MS);

    return () => window.clearInterval(timer);
  }, [state, launch]);

  // Never leave the mic hot after the component goes away.
  useEffect(() => {
    return () => {
      wantedRef.current = false;
      if (restartTimerRef.current !== null) window.clearTimeout(restartTimerRef.current);
      const current = recognitionRef.current;
      recognitionRef.current = null;
      retire(current);
      if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    };
  }, [retire]);

  // A language change mid-session needs a fresh recogniser.
  useEffect(() => {
    if (wantedRef.current) launch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  return {
    supported,
    state,
    errorCode,
    interim,
    start,
    stop,
    toggle,
    listening: state === 'listening',
  };
}

/**
 * Reads text out of the phone speaker.
 *
 * Speaking while the mic is live makes the recogniser hear itself, so callers
 * stop recognition first and restart it from `onDone`. `onDone` also fires
 * when synthesis is unavailable or errors, so the mic is never left stopped.
 */
export function speak(text: string, lang: VoiceLang, onDone?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onDone?.();
    return;
  }
  const synth = window.speechSynthesis;
  synth.cancel();

  // The voice list is loaded asynchronously in Chrome: the very first
  // `getVoices()` of a session usually returns an empty array, and everything
  // spoken before `voiceschanged` fires therefore got the browser's default
  // voice — on Windows that is a US English one, reading Bengali letter by
  // letter. Waiting for the list is the difference between the app answering
  // in the shopper's language and it answering in gibberish.
  const voices = synth.getVoices();
  if (voices.length === 0) {
    let retried = false;
    const retry = () => {
      if (retried) return;
      retried = true;
      window.speechSynthesis.removeEventListener('voiceschanged', retry);
      speak(text, lang, onDone);
    };
    synth.addEventListener('voiceschanged', retry);
    // If the list never arrives, do not leave the caller hanging: the mic is
    // waiting on `onDone` to come back on.
    window.setTimeout(retry, 1000);
    return;
  }

  // A voice that actually speaks the target language, or none at all.
  const exact = voices.find((voice) => voice.lang.replace('_', '-') === lang);
  const loose = voices.find((voice) => voice.lang.slice(0, 2) === lang.slice(0, 2));
  const chosen = exact ?? loose;

  if (!chosen) {
    // Nothing installed for this language — stay silent rather than read
    // Bengali or Hindi text aloud in an English voice. That is not a spoken
    // reply, it is noise, and the same words are already on the screen where
    // the shopper can read them. Most Windows machines have no Bengali voice;
    // most Android phones do.
    onDone?.();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 1;
  utterance.volume = 1;
  utterance.voice = chosen;

  let finished = false;
  const done = () => {
    if (finished) return;
    finished = true;
    onDone?.();
  };
  utterance.onend = done;
  utterance.onerror = done;
  // Some Android builds drop `onend` when the tab loses focus mid-utterance;
  // a generous ceiling guarantees the mic comes back either way.
  window.setTimeout(done, Math.min(1500 + text.length * 90, 8000));

  synth.speak(utterance);
}
