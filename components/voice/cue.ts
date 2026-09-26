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

/** How long `cueOrder` rings, so the voice can wait for it to finish. */
export const ORDER_RING_MS = 2000;

/**
 * THE NEW-ORDER RING. Played before the spoken sentence, so the owner's head is
 * already turning when the first word comes, and so the phone makes a sound
 * even where it has no voice for the owner's language (`speak` stays silent
 * then).
 *
 * IT WAS A SOFT SINE DING-DONG, AND IT WAS TOO QUIET. Owners said so. A sine at
 * 1 kHz is about the weakest thing a phone speaker can make: all its energy is
 * one note in the speaker's thinnest range. This is a square wave, warbling
 * between two pitches like a telephone bell, in the 1.4–1.8 kHz band where
 * both small speakers and ears are most sensitive — the same peak, several
 * times as loud to the ear, and a sound a shop already knows means "answer
 * me". Two bursts, and the phone vibrates with them.
 *
 * A PAGE CANNOT PLAY THE PHONE'S OWN RINGTONE — browsers give it no access. The
 * phone's chosen sound is what the push notification plays (`admin-sw.js`);
 * the owner picks it in Android's notification settings for this site. This
 * ring follows the MEDIA volume, which the page can neither read nor raise.
 */
export function cueOrder() {
  const ctx = audioContext();
  if (ctx) {
    try {
      const now = ctx.currentTime;
      warble(ctx, now, 0.8);
      warble(ctx, now + 1.05, 0.8);
    } catch {
      /* No audio on this device. The words and the bar still come. */
    }
  }
  try {
    navigator.vibrate?.([500, 200, 500, 200, 500]);
  } catch {
    /* No vibration motor, or not allowed yet. */
  }
}

function warble(ctx: AudioContext, start: number, seconds: number) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = 'square';
  // 25 steps a second between the two pitches: a bell's trill, not two notes.
  const step = 0.04;
  for (let at = 0, high = false; at < seconds; at += step, high = !high) {
    oscillator.frequency.setValueAtTime(high ? 1780 : 1420, start + at);
  }
  // Ramped at both ends so it starts and stops without a click; flat and near
  // full scale in between, because loudness is the whole job here.
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(0.7, start + 0.01);
  gain.gain.setValueAtTime(0.7, start + seconds - 0.03);
  gain.gain.linearRampToValueAtTime(0.0001, start + seconds);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + seconds);
}
