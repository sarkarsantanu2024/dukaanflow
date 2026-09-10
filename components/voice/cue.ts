'use client';

/**
 * The two sounds the microphone makes: one when it starts hearing you, one when
 * it stops.
 *
 * WHY THIS EXISTS. The mic's state was written on the screen — "Listening…" —
 * and a shopkeeper who cannot read the word cannot tell a live mic from a dead
 * one. They talk to a button that is not listening, nothing happens, and the
 * conclusion they draw is that voice does not work rather than that they tapped
 * it twice. An audio feature has to answer in audio.
 *
 * Rising for start, falling for stop, because that is the direction every
 * device on earth already uses and nobody has to be taught it.
 *
 * Deliberately synthesised rather than shipped as two audio files: it is a few
 * lines of oscillator against ~10 KB of MP3 that would have to be decoded, and
 * this runs on cheap Android phones on a shop's patchy connection.
 */

/**
 * One AudioContext for the life of the page.
 *
 * Browsers cap how many a document may create — Chrome stops granting them
 * somewhere around six — so a fresh one per beep would leave a mic silent after
 * a few minutes of ordinary use, which is precisely the failure this is meant
 * to prevent.
 */
let context: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
  if (!Ctor) return null;

  try {
    if (!context) context = new Ctor();
    // Created before the first gesture, a context starts suspended and stays
    // that way. Every cue follows a tap, so this always has permission to run.
    if (context.state === 'suspended') void context.resume();
    return context;
  } catch {
    return null;
  }
}

/**
 * A short tone sliding from one pitch to another.
 *
 * The gain envelope is the point: an oscillator switched on and off squarely
 * clicks, and on a phone speaker a click sounds like a fault rather than a
 * cue. Ramping up over 15ms and down to near-silence removes it.
 *
 * Never throws. A phone with audio unavailable should lose the beep and keep
 * the microphone, so every failure here is swallowed.
 */
function tone(fromHz: number, toHz: number, seconds: number) {
  const ctx = audioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    // A sine is the least harsh thing a small speaker can make, and this plays
    // a few inches from someone's ear across a counter.
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(fromHz, now);
    oscillator.frequency.linearRampToValueAtTime(toHz, now + seconds);

    // 0.0001 rather than 0 — an exponential ramp cannot reach zero.
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + seconds);
  } catch {
    /* No audio on this device. The mic still works. */
  }
}

/** Rising — the mic is now listening. */
export function cueStart() {
  tone(660, 990, 0.12);
}

/** Falling — the mic has stopped. */
export function cueStop() {
  tone(880, 520, 0.16);
}
