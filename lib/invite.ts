import { createHash, randomBytes } from 'node:crypto';
import { BRAND_NAME } from './brand';
import type { Locale } from './i18n';

/**
 * Owner invite links.
 *
 * The Super Admin sends the owner a WhatsApp message with a link; opening it
 * signs them in and drops them straight into their shop. No PIN typing on the
 * first run — which is exactly where a shopkeeper who is not sure this is for
 * them gives up. The PIN stays, for coming back afterwards.
 *
 * THE LINK DOES NOT EXPIRE AND MAY BE OPENED MORE THAN ONCE (changed on request):
 * a shopkeeper who taps it a week later, or on a second phone, still lands in
 * their shop. It is invalidated only by minting a fresh one, or by revoking the
 * owner's access. The trade this makes is deliberate — the link is now a
 * standing way into the shop, so it should be sent only to the owner, and
 * revoking access (which reissues the PIN) is what cuts a leaked one off.
 *
 * The token is random and stored only as a SHA-256 hash. SHA-256 rather than
 * bcrypt is safe here: unlike a 6-digit PIN, a 256-bit random token has nothing
 * to brute-force, so the slow hash buys nothing.
 */

export function createInviteToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashInviteToken(token) };
}

export function hashInviteToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * The message the Super Admin sends, in the shop's own language.
 *
 * A shopkeeper whose app is in Bengali should not be handed a paragraph of
 * English on WhatsApp — so this reads in the shop's `locale`. The PIN is always
 * part of it: the link signs them in on the first run, and the PIN is the way
 * back, so it travels with the link rather than in a second message that gets
 * lost.
 */
export function inviteMessage(
  shopName: string,
  url: string,
  pin: string | null,
  locale: Locale = 'en',
): string {
  const t = INVITE_TEXT[locale] ?? INVITE_TEXT.en;
  const lines = [t.ready(shopName), '', t.open(url), '', t.speak];
  if (pin) lines.push('', t.pin(pin));
  return lines.join('\n');
}

/** Per-language pieces of the invite message. `{n}` markers are filled in. */
const INVITE_TEXT: Record<Locale, {
  ready: (shop: string) => string;
  open: (url: string) => string;
  speak: string;
  pin: (pin: string) => string;
}> = {
  en: {
    ready: (shop) => `${shop} — your ${BRAND_NAME} shop is ready.`,
    open: (url) => `Open this link on your phone: ${url}`,
    speak: 'It opens your shop app. Add your items by speaking — in Bengali, Hindi or English.',
    pin: (pin) => `Your PIN is ${pin} — keep it to sign in later.`,
  },
  bn: {
    ready: (shop) => `${shop} — আপনার ${BRAND_NAME} দোকান তৈরি।`,
    open: (url) => `এই লিংকটি আপনার ফোনে খুলুন: ${url}`,
    speak: 'এটি আপনার দোকানের অ্যাপ খুলবে। কথা বলে জিনিস যোগ করুন — বাংলা, হিন্দি বা ইংরেজিতে।',
    pin: (pin) => `আপনার PIN হল ${pin} — পরে ঢুকতে এটি রেখে দিন।`,
  },
  hi: {
    ready: (shop) => `${shop} — आपकी ${BRAND_NAME} दुकान तैयार है।`,
    open: (url) => `यह लिंक अपने फ़ोन पर खोलें: ${url}`,
    speak: 'यह आपकी दुकान का ऐप खोलता है। बोलकर सामान जोड़ें — बंगाली, हिंदी या अंग्रेज़ी में।',
    pin: (pin) => `आपका PIN है ${pin} — बाद में साइन इन करने के लिए इसे रखें।`,
  },
};
