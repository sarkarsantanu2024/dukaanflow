import type { Words } from './marketing-copy';
import type { Locale } from './i18n';

/**
 * EVERY VIDEO AND SCREENSHOT ON THE LANDING PAGE, IN ONE PLACE.
 *
 * This is the only file to touch when a video is recorded or a screenshot is
 * retaken. Nothing here needs code changes elsewhere:
 *
 * VIDEOS — paste the YouTube link (or just its id) into `youtube`. Any of
 * these work: "https://youtu.be/abc123XYZ00", "https://www.youtube.com/
 * watch?v=abc123XYZ00", "abc123XYZ00". Left empty, the slot shows a tidy
 * "video coming soon" frame. The thumbnail is YouTube's own unless a file is
 * put at `thumb` (16:9, 1280×720 JPG or PNG), which then wins.
 *
 * SCREENSHOTS — put a phone screenshot at `public/landing/screens/<lang>/
 * <id>.png` (portrait, ideally 780×1688 PNG). See `SCREENS` below. The page
 * checks for the files when it is built; rebuild (or redeploy) after adding.
 */

export type LandingVideo = {
  id: string;
  /** YouTube link or id. Empty until the video is recorded. */
  youtube: string;
  /** Optional custom thumbnail under `public/`, 16:9. */
  thumb: string;
  title: Words;
  /** One line under the title, in the gallery. */
  blurb: Words;
};

/** The video beside the headline: the whole product in a couple of minutes. */
export const HERO_VIDEO: LandingVideo = {
  id: 'overview',
  youtube: 'https://youtu.be/XweaBMz-TRc',
  thumb: '/landing/videos/overview.jpg',
  title: {
    en: 'See how Halkhata works',
    bn: 'দেখুন Halkhata কীভাবে কাজ করে',
    hi: 'देखिए Halkhata कैसे काम करता है',
  },
  blurb: {
    en: 'A two-minute tour of the app',
    bn: 'দু’মিনিটে পুরো অ্যাপ',
    hi: 'दो मिनट में पूरा ऐप',
  },
};

/** The video gallery, in the order a new shop meets each feature. */
export const VIDEOS: LandingVideo[] = [
  {
    id: 'setup',
    youtube: '',
    thumb: '/landing/videos/setup.jpg',
    title: { en: 'Setting up your shop', bn: 'দোকান চালু করা', hi: 'दुकान शुरू करना' },
    blurb: {
      en: 'From your first sign-in to your QR code PDF',
      bn: 'প্রথম লগইন থেকে QR কোডের PDF পর্যন্ত',
      hi: 'पहले लॉगिन से QR कोड के PDF तक',
    },
  },
  {
    id: 'voice',
    youtube: '',
    thumb: '/landing/videos/voice.jpg',
    title: { en: 'Adding products by voice', bn: 'মুখে বলে জিনিস যোগ', hi: 'बोलकर सामान जोड़ना' },
    blurb: {
      en: 'Name, quantity and price in one sentence',
      bn: 'এক বাক্যে নাম, পরিমাণ আর দাম',
      hi: 'एक वाक्य में नाम, मात्रा और दाम',
    },
  },
  {
    id: 'photo',
    youtube: '',
    thumb: '/landing/videos/photo.jpg',
    title: { en: 'Adding products from a photo', bn: 'ছবি তুলে জিনিস যোগ', hi: 'फ़ोटो से सामान जोड़ना' },
    blurb: {
      en: 'Photograph a packet and the app reads it',
      bn: 'প্যাকেটের ছবি তুলুন, অ্যাপ পড়ে নেবে',
      hi: 'पैकेट की फ़ोटो लीजिए, ऐप पढ़ लेगा',
    },
  },
  {
    id: 'orders',
    youtube: '',
    thumb: '/landing/videos/orders.jpg',
    title: { en: 'Taking QR orders', bn: 'QR থেকে অর্ডার নেওয়া', hi: 'QR से ऑर्डर लेना' },
    blurb: {
      en: 'What the customer sees, and how the order reaches you',
      bn: 'গ্রাহক কী দেখেন, আর অর্ডার কীভাবে আপনার কাছে আসে',
      hi: 'ग्राहक क्या देखता है, और ऑर्डर आप तक कैसे पहुँचता है',
    },
  },
  {
    id: 'khata',
    youtube: '',
    thumb: '/landing/videos/khata.jpg',
    title: { en: 'Managing the khata', bn: 'বাকির খাতা সামলানো', hi: 'उधार खाता संभालना' },
    blurb: {
      en: 'Credit, payments and WhatsApp reminders',
      bn: 'বাকি, জমা আর হোয়াটসঅ্যাপে তাগাদা',
      hi: 'उधार, जमा और व्हाट्सएप पर याद दिलाना',
    },
  },
  {
    id: 'billing',
    youtube: '',
    thumb: '/landing/videos/billing.jpg',
    title: { en: 'Counter billing', bn: 'কাউন্টারে বিল করা', hi: 'काउंटर पर बिलिंग' },
    blurb: {
      en: 'Ring up a sale and send the bill on WhatsApp',
      bn: 'বিক্রি তুলুন, বিল পাঠান হোয়াটসঅ্যাপে',
      hi: 'बिक्री दर्ज कीजिए, बिल व्हाट्सएप पर भेजिए',
    },
  },
  {
    id: 'stock',
    youtube: '',
    thumb: '/landing/videos/stock.jpg',
    title: { en: 'Stock and restocking', bn: 'স্টক আর মাল তোলা', hi: 'स्टॉक और माल मँगाना' },
    blurb: {
      en: 'Track stock and send a restock list to your supplier',
      bn: 'স্টক দেখুন, সাপ্লায়ারকে মালের তালিকা পাঠান',
      hi: 'स्टॉक देखिए, सप्लायर को माल की लिस्ट भेजिए',
    },
  },
  {
    id: 'reports',
    youtube: '',
    thumb: '/landing/videos/reports.jpg',
    title: { en: 'Checking your takings', bn: 'দিনের হিসাব দেখা', hi: 'दिन का हिसाब देखना' },
    blurb: {
      en: 'Today’s and this month’s cash, UPI and credit',
      bn: 'আজকের আর এই মাসের নগদ, UPI আর বাকি',
      hi: 'आज और इस महीने का नकद, UPI और उधार',
    },
  },
];

/**
 * THE SCREENSHOT SLOTS, ONE FILE PER LANGUAGE.
 *
 * `public/landing/screens/<lang>/<id>.png` — en, bn and hi — so a visitor
 * reading the page in Bengali sees the app in Bengali. A language without its
 * own file shows the English one; a slot with no file at all shows the branded
 * tile. Never the pictures in `public/tour/`: they show an older app.
 *
 * The demo shop's screens are captured by `qa-report/scripts/
 * capture-landing-screens*.ts` (phone size, 780×1688).
 */
export const SCREENS = ['products', 'storefront', 'orders', 'khata', 'billing', 'stock', 'reports', 'setup'] as const;

export type ScreenId = (typeof SCREENS)[number];

export function screenPath(lang: Locale, id: ScreenId): string {
  return `/landing/screens/${lang}/${id}.png`;
}

/** "https://youtu.be/abc" / "…watch?v=abc" / "…/embed/abc" / "abc" → "abc", or '' when empty. */
export function youtubeId(link: string): string {
  const value = link.trim();
  if (!value) return '';
  const match =
    /(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})/.exec(value) ??
    /^([A-Za-z0-9_-]{11})$/.exec(value);
  return match ? match[1]! : '';
}
