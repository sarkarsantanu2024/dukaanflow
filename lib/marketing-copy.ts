import { BRAND_NAME } from './brand';

/**
 * The words on the public pricing page, in English and Bengali.
 *
 * Kept out of the page component on purpose: this is the file somebody edits
 * after a week in the field, and they should be able to change a sentence
 * without reading JSX. Every entry has both languages, so a translation can
 * never quietly go missing — TypeScript refuses the object without it.
 *
 * The Bengali is not a translation of the English so much as the same point
 * made the way a shopkeeper would say it. Where the two differ, the Bengali is
 * the one to trust: it is the language the person using this actually thinks in.
 */

export type Bilingual = { en: string; bn: string };

/** One step of getting started, in the order it happens. */
export const STEPS: Bilingual[] = [
  {
    en: 'We set up your shop and print your QR — send us the name, number and address.',
    bn: 'আমরা আপনার দোকান তৈরি করে QR ছাপিয়ে দিই — শুধু নাম, ফোন নম্বর আর ঠিকানা পাঠান।',
  },
  {
    en: 'You get a link on WhatsApp. Open it, and your shop app is ready. Nothing to download from a store.',
    bn: 'হোয়াটসঅ্যাপে একটা লিংক পাবেন। খুললেই আপনার দোকানের অ্যাপ তৈরি। প্লে স্টোর থেকে কিছু নামাতে হবে না।',
  },
  {
    en: 'Add your items by speaking, in your own language. Your phone reads each one back.',
    bn: 'নিজের ভাষায় বলে বলে জিনিস যোগ করুন। ফোন প্রত্যেকটা পড়ে শোনাবে।',
  },
  {
    // The real lifecycle. WhatsApp appears where it actually belongs — telling
    // the customer their order is ready — and not as the channel orders arrive
    // on, which it is not.
    en: 'Customers scan the QR and choose. The order lands in your app and your phone buzzes.',
    bn: 'খদ্দের QR স্ক্যান করে জিনিস বাছবে। অর্ডার আপনার অ্যাপে আসবে আর ফোন বেজে উঠবে।',
  },
  {
    en: 'Mark it ready, WhatsApp the customer, take the money, and tick it paid. You keep every rupee.',
    bn: 'তৈরি হলে দাগ দিন, খদ্দেরকে হোয়াটসঅ্যাপ করুন, টাকা নিন, পেইড টিক করুন। পুরো টাকাটাই আপনার।',
  },
];

/**
 * The problems a kirana actually has, and what this does about each.
 *
 * Written as complaints first and features second, because a shopkeeper reading
 * a feature list has to do the translation into their own day themselves — and
 * mostly does not bother. Every one of these is a thing the product genuinely
 * fixes; nothing aspirational belongs in this list, because the QR poster goes
 * up on a wall next to the promise.
 */
export type Problem = { problem: Bilingual; answer: Bilingual };

export const PROBLEMS: Problem[] = [
  {
    problem: {
      en: 'The khata is a paper notebook — it gets wet, it gets lost, and only one person can read the handwriting.',
      bn: 'খাতা মানে কাগজের খাতা — ভিজে যায়, হারিয়ে যায়, আর হাতের লেখা একজনই পড়তে পারে।',
    },
    answer: {
      en: 'Every customer has a running balance the app keeps for you, and you can send anyone their khata on WhatsApp when they argue about it.',
      bn: 'প্রত্যেক খদ্দেরের হিসাব অ্যাপ নিজেই রাখে, আর কেউ তর্ক করলে তার পুরো খাতা হোয়াটসঅ্যাপে পাঠিয়ে দিতে পারেন।',
    },
  },
  {
    problem: {
      en: 'You cannot say how much the shop is owed today without adding up every page.',
      bn: 'আজ দোকানের কত টাকা বাকি আছে, সেটা প্রত্যেকটা পাতা যোগ না করে বলা যায় না।',
    },
    answer: {
      en: 'One number at the top of the khata screen: total outstanding, and who has been owing the longest.',
      bn: 'খাতার স্ক্রিনে উপরেই একটা সংখ্যা — মোট কত বাকি, আর কে সবচেয়ে বেশি দিন ধরে ফেলে রেখেছে।',
    },
  },
  {
    problem: {
      en: 'The price list lives in your head, so the price changes with whoever is standing at the counter.',
      bn: 'দামের তালিকা আপনার মাথায় — তাই কে দাঁড়িয়ে আছে তার উপর দাম বদলে যায়।',
    },
    answer: {
      en: 'Say the item and the price once. It is on your QR page the same second, the same for everybody.',
      bn: 'একবার জিনিসের নাম আর দাম বলুন। সঙ্গে সঙ্গে আপনার QR পাতায় উঠে যাবে — সবার জন্য একই দাম।',
    },
  },
  {
    problem: {
      en: 'Orders come as phone calls you miss while serving someone else, and the customer goes to the next shop.',
      bn: 'অর্ডার আসে ফোনে — অন্য খদ্দেরকে দিতে দিতে ফোন ধরা হয় না, আর সে পাশের দোকানে চলে যায়।',
    },
    answer: {
      en: 'The order sits in your app until you look at it, and your phone buzzes when it arrives. Nothing is lost because you were busy.',
      bn: 'অর্ডার আপনার অ্যাপে জমা থাকে যতক্ষণ না দেখছেন, আর এলেই ফোন বেজে ওঠে। ব্যস্ত ছিলেন বলে কিছু হারায় না।',
    },
  },
  {
    problem: {
      en: 'You have served the same families for years and do not have one phone number written down.',
      bn: 'বছরের পর বছর একই পরিবারকে জিনিস দিচ্ছেন, অথচ একটা ফোন নম্বরও লেখা নেই।',
    },
    answer: {
      en: 'Every customer who orders leaves their name and number with you — your list, not a platform’s.',
      bn: 'যে-ই অর্ডার করে, তার নাম আর নম্বর আপনার কাছে থেকে যায় — আপনার তালিকা, কোনও কোম্পানির নয়।',
    },
  },
  {
    problem: {
      en: 'You find out something has run out when a customer asks for it.',
      bn: 'কোন জিনিস শেষ হয়ে গেছে, সেটা জানা যায় খদ্দের চাইলে।',
    },
    answer: {
      en: 'Mark it out of stock in one tap and it comes off your shop page, so nobody orders what you cannot give.',
      bn: 'এক ট্যাপে “শেষ” করে দিন, দোকানের পাতা থেকে উঠে যাবে — যা দিতে পারবেন না, কেউ তার অর্ডার করবে না।',
    },
  },
  {
    problem: {
      en: 'The apps that offer to help take a cut of every order, and then own your customers.',
      bn: 'যেসব অ্যাপ সাহায্য করতে আসে, তারা প্রত্যেক অর্ডার থেকে কমিশন কাটে — তারপর খদ্দেরও তাদের হয়ে যায়।',
    },
    answer: {
      en: `${BRAND_NAME} charges one price a month for your shop and takes nothing from an order, however many you take.`,
      bn: `${BRAND_NAME} মাসে একটাই টাকা নেয় দোকানের জন্য, অর্ডার থেকে এক পয়সাও নয় — যত অর্ডারই আসুক।`,
    },
  },
];
