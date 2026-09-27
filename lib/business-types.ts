/**
 * EVERY KIND OF LOCAL BUSINESS HALKHATA IS BUILT FOR, IN ONE PLACE.
 *
 * Added 2026-09-27, when Halkhata stopped being a grocery app. Each entry is a
 * shop category the console can pick (`ShopType`), and it drives three things
 * that must agree with each other:
 *
 *   - the public page for that kind of shop, at `/<slug>` (`app/[business]`),
 *   - the "For every kind of shop" grid on the landing page,
 *   - the demonstration shop for it, at `/shop/demo-<slug>`, seeded by
 *     `scripts/seed-category-demos.ts`.
 *
 * `OTHER` has no entry: it is the console's "none of these", not something a
 * shopkeeper searches for. Everything a page says is in all three languages —
 * a Bengali or Hindi reader must never meet an English line here.
 *
 * Screenshots for a page live at `public/landing/business/<slug>/<lang>/
 * <screen>.png` (phone portrait, 780×1688), captured from the demo shop on the
 * live site. A missing one shows a branded tile, so a page is never broken by a
 * picture that has not been taken yet.
 */

import type { ShopType } from '@prisma/client';
import type { Words } from './marketing-copy';

export type BusinessSlug =
  | 'grocery'
  | 'roll-momo'
  | 'home-kitchen'
  | 'sweet-shop'
  | 'meat-fish'
  | 'stationery'
  | 'flowers-puja';

export type Business = {
  slug: BusinessSlug;
  type: Exclude<ShopType, 'OTHER'>;
  /** What the shop is called, as a heading. */
  name: Words;
  /** The page's main line. */
  headline: Words;
  lead: Words;
  /** What this kind of shop gets out of Halkhata — specific, not generic. */
  points: Words[];
  /** The demo shop's display name. English, as a shop's own name is. */
  demoName: string;
  /**
   * False when this business has no demo shop, so its page must not link to
   * one. Removed 2026-09-28 at the owner's word, with its data and its
   * screenshots (flowers & puja, stationery, meat & fish); the page shows the
   * branded placeholder tiles until new screens are captured.
   */
  hasDemo?: boolean;
};

/** The demo shop for a kind of business. `demo-grocery` predates this file. */
export function demoSlug(business: Business): string {
  return `demo-${business.slug}`;
}

/** The screenshots each page shows, in order. */
export const BUSINESS_SCREENS = ['storefront', 'products', 'billing'] as const;
export type BusinessScreen = (typeof BUSINESS_SCREENS)[number];

export function businessScreenPath(slug: BusinessSlug, lang: string, screen: BusinessScreen): string {
  return `/landing/business/${slug}/${lang}/${screen}.png`;
}

export const BUSINESSES: Business[] = [
  {
    slug: 'grocery',
    type: 'GROCERY',
    demoName: 'Demo Grocery',
    name: { en: 'Grocery, kirana & dairy', bn: 'মুদি, কিরানা ও দুধের দোকান', hi: 'किराना, ग्रॉसरी और डेयरी' },
    headline: {
      en: 'Monthly ration and daily milk orders, packed before they arrive',
      bn: 'মাসের বাজার আর রোজের দুধের অর্ডার, খদ্দের আসার আগেই গোছানো',
      hi: 'महीने का राशन और रोज़ के दूध के ऑर्डर, ग्राहक आने से पहले पैक',
    },
    lead: {
      en: 'Regulars send their ration list and daily milk order by QR. At the counter, sell loose items by weight in a few taps, keep the udhaar khata and send a restock list to your supplier.',
      bn: 'নিয়মিত খদ্দেররা QR-এ মাসের বাজারের তালিকা আর রোজের দুধের অর্ডার পাঠান। কাউন্টারে কয়েক চাপে খোলা জিনিস ওজনে বেচুন, বাকির খাতা রাখুন আর সাপ্লায়ারকে মাল তোলার তালিকা পাঠান।',
      hi: 'नियमित ग्राहक QR से राशन की लिस्ट और रोज़ का दूध का ऑर्डर भेजते हैं। काउंटर पर कुछ टैप में खुला सामान तौलकर बेचिए, उधार खाता रखिए और सप्लायर को माल की लिस्ट भेजिए।',
    },
    points: [
      {
        en: '540+ ready-made items — groceries, milk, curd, bread and eggs — in three languages',
        bn: '৫৪০+ তৈরি জিনিস — মুদির মাল, দুধ, দই, পাউরুটি আর ডিম — তিন ভাষায়',
        hi: '540+ तैयार सामान — किराना, दूध, दही, ब्रेड और अंडे — तीन भाषाओं में',
      },
      {
        en: 'Sell 250 g, 1.5 kg or half a litre — any amount, priced correctly',
        bn: '২৫০ গ্রাম, দেড় কেজি বা আধ লিটার — যে কোনও পরিমাণ, ঠিক দামে',
        hi: '250 ग्राम, डेढ़ किलो या आधा लीटर — कोई भी मात्रा, सही दाम पर',
      },
      {
        en: 'Low-stock alerts and a supplier list on WhatsApp',
        bn: 'স্টক কমলে খবর, আর সাপ্লায়ারের তালিকা হোয়াটসঅ্যাপে',
        hi: 'स्टॉक कम होने पर सूचना, और सप्लायर की लिस्ट व्हाट्सएप पर',
      },
    ],
  },
  {
    slug: 'roll-momo',
    type: 'ROLL_MOMO',
    demoName: 'Demo Roll & Momo',
    name: { en: 'Roll & momo corners', bn: 'রোল আর মোমোর দোকান', hi: 'रोल और मोमो की दुकान' },
    headline: {
      en: 'Evening rush orders, straight to your phone',
      bn: 'সন্ধের ভিড়ের অর্ডার, সোজা আপনার ফোনে',
      hi: 'शाम की भीड़ के ऑर्डर, सीधे आपके फ़ोन पर',
    },
    lead: {
      en: 'Customers order rolls, momos and chowmein from your QR and collect when it is ready. No queue at the counter.',
      bn: 'গ্রাহক QR থেকে রোল, মোমো, চাউমিন অর্ডার দেন আর তৈরি হলে নিয়ে যান। কাউন্টারে লাইন নেই।',
      hi: 'ग्राहक QR से रोल, मोमो, चाउमिन ऑर्डर करते हैं और तैयार होने पर ले जाते हैं। काउंटर पर लाइन नहीं।',
    },
    points: [
      { en: 'Egg, chicken and paneer rolls, momos and chowmein ready to tick', bn: 'ডিম, চিকেন, পনির রোল, মোমো আর চাউমিন — শুধু টিক দিন', hi: 'अंडा, चिकन, पनीर रोल, मोमो और चाउमिन — बस टिक कीजिए' },
      { en: 'Priced per piece, per plate or per set of eight', bn: 'পিস, প্লেট বা আটটার সেট হিসেবে দাম', hi: 'पीस, प्लेट या आठ के सेट के हिसाब से दाम' },
      { en: 'A loud alert for every new order', bn: 'প্রতিটা নতুন অর্ডারে জোরে আওয়াজ', hi: 'हर नए ऑर्डर पर तेज़ आवाज़' },
    ],
  },
  {
    slug: 'home-kitchen',
    type: 'HOME_KITCHEN',
    demoName: 'Demo Home Kitchen',
    name: { en: 'Home kitchens & tiffin services', bn: 'বাড়ির রান্না ও টিফিন সার্ভিস', hi: 'होम किचन और टिफ़िन सर्विस' },
    headline: {
      en: 'Home-cooked meals, ordered like a restaurant',
      bn: 'ঘরের রান্না, অর্ডার হোক রেস্তোরাঁর মতো',
      hi: 'घर का खाना, ऑर्डर हो रेस्टोरेंट की तरह',
    },
    lead: {
      en: 'Share today’s menu with your regulars, take orders by QR and keep a monthly account for every tiffin customer.',
      bn: 'নিয়মিতদের আজকের মেনু পাঠান, QR-এ অর্ডার নিন আর প্রতিটা টিফিন গ্রাহকের মাসিক হিসাব রাখুন।',
      hi: 'नियमित ग्राहकों को आज का मेन्यू भेजिए, QR से ऑर्डर लीजिए और हर टिफ़िन ग्राहक का मासिक हिसाब रखिए।',
    },
    points: [
      { en: 'Veg, egg, fish and chicken thalis ready to tick', bn: 'ভেজ, ডিম, মাছ আর চিকেন থালি — শুধু টিক দিন', hi: 'वेज, अंडा, मछली और चिकन थाली — बस टिक कीजिए' },
      { en: 'Write today’s menu once and share it on WhatsApp', bn: 'আজকের মেনু একবার লিখে হোয়াটসঅ্যাপে পাঠান', hi: 'आज का मेन्यू एक बार लिखकर व्हाट्सएप पर भेजिए' },
      { en: 'Monthly khata for tiffin customers', bn: 'টিফিন গ্রাহকদের মাসিক খাতা', hi: 'टिफ़िन ग्राहकों का मासिक खाता' },
    ],
  },
  {
    slug: 'sweet-shop',
    type: 'SWEET_SHOP',
    demoName: 'Demo Sweet Shop',
    name: { en: 'Sweet shops', bn: 'মিষ্টির দোকান', hi: 'मिठाई की दुकान' },
    headline: {
      en: 'Your sweet counter, open for orders all day',
      bn: 'আপনার মিষ্টির কাউন্টার, সারাদিন অর্ডারের জন্য খোলা',
      hi: 'आपका मिठाई काउंटर, दिनभर ऑर्डर के लिए खुला',
    },
    lead: {
      en: 'Sell rasgulla by the piece and sandesh by weight, take festival and party orders in advance, and send the bill on WhatsApp.',
      bn: 'রসগোল্লা পিসে আর সন্দেশ ওজনে বেচুন, পুজো-পার্বণ আর অনুষ্ঠানের অর্ডার আগে নিন, বিল পাঠান হোয়াটসঅ্যাপে।',
      hi: 'रसगुल्ला पीस में और संदेश वज़न से बेचिए, त्योहार और पार्टी के ऑर्डर पहले लीजिए, बिल व्हाट्सएप पर भेजिए।',
    },
    points: [
      { en: 'Rasgulla, sandesh, mishti doi, ladoo and more, ready to tick', bn: 'রসগোল্লা, সন্দেশ, মিষ্টি দই, লাড্ডু আর আরও — শুধু টিক দিন', hi: 'रसगुल्ला, संदेश, मीठा दही, लड्डू और भी — बस टिक कीजिए' },
      { en: 'Sell by piece, 250 g, half a kilo or the box', bn: 'পিস, ২৫০ গ্রাম, আধ কেজি বা বাক্স হিসেবে বিক্রি', hi: 'पीस, 250 ग्राम, आधा किलो या डिब्बे के हिसाब से बिक्री' },
      { en: 'A festival notice on your page, and big orders taken ahead', bn: 'পাতায় উৎসবের নোটিস, আর বড় অর্ডার আগে থেকেই', hi: 'पेज पर त्योहार का नोटिस, और बड़े ऑर्डर पहले से' },
    ],
  },
  {
    slug: 'meat-fish',
    type: 'MEAT_FISH',
    hasDemo: false,
    demoName: 'Demo Meat & Fish',
    name: { en: 'Meat & fish shops', bn: 'মাছ ও মাংসের দোকান', hi: 'मीट और मछली की दुकान' },
    headline: {
      en: 'Chicken, mutton and fish — ordered before you open',
      bn: 'মুরগি, খাসি আর মাছ — দোকান খোলার আগেই অর্ডার',
      hi: 'चिकन, मटन और मछली — दुकान खुलने से पहले ऑर्डर',
    },
    lead: {
      en: 'Customers order 750 g of chicken or a kilo of rohu; you see exactly what to cut. Sunday orders arrive the night before.',
      bn: 'গ্রাহক ৭৫০ গ্রাম মুরগি বা এক কেজি রুই অর্ডার দেন; কী কাটতে হবে ঠিক দেখতে পান। রবিবারের অর্ডার আসে আগের রাতেই।',
      hi: 'ग्राहक 750 ग्राम चिकन या एक किलो रोहू ऑर्डर करते हैं; आपको ठीक पता होता है क्या काटना है। रविवार के ऑर्डर पिछली रात आ जाते हैं।',
    },
    points: [
      { en: 'Chicken cuts, mutton, river fish, prawns and eggs ready to tick', bn: 'মুরগির কাট, খাসি, নদীর মাছ, চিংড়ি আর ডিম — শুধু টিক দিন', hi: 'चिकन के कट, मटन, नदी की मछली, झींगा और अंडे — बस टिक कीजिए' },
      { en: 'Sell any weight — 750 g, 1.5 kg — priced by the kilo', bn: 'যে কোনও ওজন — ৭৫০ গ্রাম, দেড় কেজি — কেজি দরে', hi: 'कोई भी वज़न — 750 ग्राम, डेढ़ किलो — किलो के भाव से' },
      { en: 'Change the day’s rate for fish in seconds', bn: 'মাছের আজকের দর বদলান কয়েক সেকেন্ডে', hi: 'मछली का आज का भाव सेकंडों में बदलिए' },
    ],
  },
  {
    slug: 'stationery',
    type: 'STATIONERY',
    hasDemo: false,
    demoName: 'Demo Stationery',
    name: { en: 'Stationery & xerox shops', bn: 'স্টেশনারি ও জেরক্সের দোকান', hi: 'स्टेशनरी और ज़ेरॉक्स की दुकान' },
    headline: {
      en: 'School lists, photocopies and pens — all on one phone',
      bn: 'স্কুলের তালিকা, ফটোকপি আর কলম — সব এক ফোনে',
      hi: 'स्कूल की लिस्ट, फ़ोटोकॉपी और पेन — सब एक फ़ोन पर',
    },
    lead: {
      en: 'Parents order the school list by QR, you bill photocopies and prints in a tap, and regular offices run a monthly account.',
      bn: 'অভিভাবকরা QR-এ স্কুলের তালিকা অর্ডার দেন, এক চাপে ফটোকপি আর প্রিন্টের বিল, আর অফিসের মাসিক হিসাব।',
      hi: 'अभिभावक QR से स्कूल की लिस्ट ऑर्डर करते हैं, एक टैप में फ़ोटोकॉपी और प्रिंट का बिल, और ऑफ़िस का मासिक हिसाब।',
    },
    points: [
      { en: 'Notebooks, pens, geometry boxes, art supplies and office items ready to tick', bn: 'খাতা, কলম, জ্যামিতি বাক্স, আঁকার আর অফিসের জিনিস — শুধু টিক দিন', hi: 'कॉपी, पेन, ज्योमेट्री बॉक्स, ड्रॉइंग और ऑफ़िस का सामान — बस टिक कीजिए' },
      { en: 'Photocopy, colour print and lamination billed per page', bn: 'ফটোকপি, রঙিন প্রিন্ট আর ল্যামিনেশন — পাতা হিসেবে বিল', hi: 'फ़ोटोकॉपी, कलर प्रिंट और लेमिनेशन — पेज के हिसाब से बिल' },
      { en: 'Monthly credit for schools and offices', bn: 'স্কুল আর অফিসের মাসিক বাকি', hi: 'स्कूल और ऑफ़िस का मासिक उधार' },
    ],
  },
  {
    slug: 'flowers-puja',
    type: 'PUJA_FLOWER',
    hasDemo: false,
    demoName: 'Demo Flowers & Puja',
    name: { en: 'Flower & puja shops', bn: 'ফুল ও পুজোর দোকান', hi: 'फूल और पूजा सामग्री की दुकान' },
    headline: {
      en: 'Garlands and puja items, ready before the puja',
      bn: 'মালা আর পুজোর জিনিস, পুজোর আগেই তৈরি',
      hi: 'माला और पूजा सामग्री, पूजा से पहले तैयार',
    },
    lead: {
      en: 'Take garland and festival orders in advance, sell loose flowers by weight and keep daily-puja households on the khata.',
      bn: 'মালা আর উৎসবের অর্ডার আগে নিন, খোলা ফুল ওজনে বেচুন, আর রোজের পুজোর বাড়িগুলোর খাতা রাখুন।',
      hi: 'माला और त्योहार के ऑर्डर पहले लीजिए, खुले फूल वज़न से बेचिए, और रोज़ की पूजा वाले घरों का खाता रखिए।',
    },
    points: [
      { en: 'Flowers, leaves, diyas, incense and puja items ready to tick', bn: 'ফুল, পাতা, প্রদীপ, ধূপ আর পুজোর জিনিস — শুধু টিক দিন', hi: 'फूल, पत्ते, दीये, अगरबत्ती और पूजा सामग्री — बस टिक कीजिए' },
      { en: 'Home delivery or pickup — you choose', bn: 'হোম ডেলিভারি বা দোকান থেকে নেওয়া — আপনি ঠিক করুন', hi: 'होम डिलीवरी या पिकअप — आप तय कीजिए' },
      { en: 'Post a notice for festival timings', bn: 'উৎসবের সময় নোটিসে জানান', hi: 'त्योहार का समय नोटिस में बताइए' },
    ],
  },
];

export function businessBySlug(slug: string): Business | undefined {
  return BUSINESSES.find((business) => business.slug === slug);
}
