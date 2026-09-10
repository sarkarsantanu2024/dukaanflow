import type { VoiceErrorCode } from './useVoice';

/**
 * Why the microphone is not running, and what the person holding the phone can
 * do about it.
 *
 * Lifted out of `VoiceItemAdder` so every mic in the owner's app answers a dead
 * microphone the same way. It used to live inside that one component, which
 * meant the next screen to grow a mic either imported from a sibling component
 * or wrote its own second opinion — and two sets of words for one failure is
 * how a product starts telling people different things about the same problem.
 *
 * Each message names the cause AND the remedy, because the shopkeeper is the
 * only person who can actually fix any of these — none of them are things the
 * server can put right.
 *
 * English, matching the rest of the voice error handling in the owner app.
 * Worth translating when the owner-facing copy next gets a pass; a shopkeeper
 * whose mic is blocked is exactly the person least able to read English.
 */
export const VOICE_ERRORS: Record<VoiceErrorCode, string> = {
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
