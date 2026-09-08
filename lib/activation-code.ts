import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';

/**
 * The 4-digit code the operator sends a shop on WhatsApp once they have seen
 * the money arrive.
 *
 * WHY FOUR DIGITS IS SAFE HERE, when four digits is normally not safe anywhere.
 * Ten thousand combinations is nothing to a machine, so the length is carried
 * entirely by what surrounds it, and all four of these have to hold:
 *
 *  1. A code only exists after a human looked at a bank feed. Nothing can make
 *     the system issue one, so there is no code to guess until a shop has
 *     genuinely paid for the thing the code unlocks.
 *  2. It is bound to ONE payment request — one shop, one plan, one number of
 *     months, at a price already fixed. Redeeming it cannot buy anything other
 *     than what was paid for, so a stolen code is worth precisely the plan its
 *     owner already bought.
 *  3. Guessing happens behind that shop's own owner session. An attacker needs
 *     the shop's PIN before they can type a single digit.
 *  4. Attempts are counted IN POSTGRES, on the request row — see
 *     `ACTIVATION_MAX_ATTEMPTS`. The in-memory rate limiter cannot do this job:
 *     it is per serverless instance, so spreading guesses across instances
 *     would walk straight past it.
 *
 * Take any of those away and this must get longer.
 */

export const ACTIVATION_CODE_LENGTH = 4;

/**
 * Wrong guesses before the code is dead and the operator must issue another.
 *
 * Five, against ten thousand combinations: a one-in-two-thousand chance for
 * somebody who has already stolen a shop's PIN. Low enough to be nothing, high
 * enough that a shopkeeper mistyping on a cracked screen in the dark still gets
 * there. Locking is deliberately not silent — the owner is told to ask for a
 * new code, because a screen that just says "wrong" forever is one they will
 * ring about.
 */
export const ACTIVATION_MAX_ATTEMPTS = 5;

/**
 * How long a code stays good.
 *
 * Fourteen days, not one. The operator sends this on WhatsApp and the shopkeeper
 * reads it when the shop is quiet — which may be tomorrow evening. A code that
 * expires overnight generates a support call for every shop that went to bed.
 */
export const ACTIVATION_VALID_DAYS = 14;

/** Cheap by bcrypt standards: this is checked on a phone, at a counter. */
const ROUNDS = 10;

/**
 * Four digits from a CSPRNG — never `Math.random`, whose output is predictable
 * enough that seeing a few codes would narrow the next one to a handful.
 * Leading zeros are kept: "0417" is a perfectly good code.
 */
export function generateActivationCode(): string {
  let code = '';
  for (let i = 0; i < ACTIVATION_CODE_LENGTH; i += 1) code += String(randomInt(0, 10));
  return code;
}

export function hashActivationCode(code: string): Promise<string> {
  return bcrypt.hash(code, ROUNDS);
}

/** Only ever safe behind the attempt counter on the request row. Never loop this. */
export async function verifyActivationCode(code: string, hash: string | null): Promise<boolean> {
  if (!hash) return false;
  try {
    return await bcrypt.compare(code, hash);
  } catch {
    return false;
  }
}

/** When a code generated now stops working. */
export function activationExpiry(from = new Date()): Date {
  return new Date(from.getTime() + ACTIVATION_VALID_DAYS * 86_400_000);
}
