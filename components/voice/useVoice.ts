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
};

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
  const onPhraseRef = useRef(onPhrase);
  onPhraseRef.current = onPhrase;

  useEffect(() => {
    setSupported(recognitionCtor() !== null && 'speechSynthesis' in window);
  }, []);

  const stop = useCallback(() => {
    wantedRef.current = false;
    recognitionRef.current?.stop();
    setState('idle');
    setInterim('');
  }, []);

  const start = useCallback(async () => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;

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

    recognitionRef.current?.abort();

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    // Ask for several readings, not just the top one — see `onPhrase`.
    recognition.maxAlternatives = 5;

    recognition.onresult = (event: any) => {
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
      const code = String(event?.error ?? '');

      // "no-speech" and "aborted" are routine during a long session; onend
      // restarts us, so they must not surface as failures.
      if (!code || code === 'no-speech' || code === 'aborted') return;

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
      } else {
        setErrorCode('unknown');
        setState('error');
      }
    };

    recognition.onend = () => {
      setInterim('');
      if (wantedRef.current) {
        // Chrome ends the session after ~60s of silence. Restart so the
        // shopkeeper can keep dictating without tapping the mic again.
        try {
          recognition.start();
          return;
        } catch {
          /* already restarting */
        }
      }
      setState((current) => (current === 'listening' ? 'idle' : current));
    };

    recognitionRef.current = recognition;
    wantedRef.current = true;
    try {
      recognition.start();
      setState('listening');
    } catch {
      setErrorCode('unknown');
      setState('error');
    }
  }, [lang]);

  const toggle = useCallback(() => {
    if (state === 'listening') stop();
    else void start();
  }, [state, start, stop]);

  // Never leave the mic hot after the component goes away.
  useEffect(() => {
    return () => {
      wantedRef.current = false;
      recognitionRef.current?.abort();
      if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    };
  }, []);

  // A language change mid-session needs a fresh recogniser.
  useEffect(() => {
    if (wantedRef.current) {
      stop();
      void start();
    }
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

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 1;
  utterance.volume = 1;

  // Pick a voice that actually speaks the target language when one is
  // installed; otherwise the default voice reads Hindi with an English accent.
  const voices = synth.getVoices();
  const exact = voices.find((voice) => voice.lang === lang);
  const loose = voices.find((voice) => voice.lang.startsWith(lang.slice(0, 2)));
  const chosen = exact ?? loose;
  if (chosen) utterance.voice = chosen;

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
