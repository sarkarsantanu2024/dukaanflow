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
  | 'restaurant'
  | 'street-food'
  | 'tea-stall'
  | 'roll-momo'
  | 'home-kitchen'
  | 'bakery'
  | 'sweet-shop'
  | 'vegetables-fruits'
  | 'dairy'
  | 'meat-fish'
  | 'stationery'
  | 'cosmetics'
  | 'hardware'
  | 'flowers-puja'
  | 'garments';

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
    name: { en: 'Grocery & kirana stores', bn: 'মুদি ও কিরানা দোকান', hi: 'किराना और ग्रॉसरी स्टोर' },
    headline: {
      en: 'Run your grocery store from one phone',
      bn: 'এক ফোনেই চালান আপনার মুদির দোকান',
      hi: 'एक फ़ोन से चलाइए अपनी किराना दुकान',
    },
    lead: {
      en: 'Take orders by QR, sell loose items by weight, keep the udhaar khata and send a restock list to your supplier.',
      bn: 'QR-এ অর্ডার নিন, খোলা জিনিস ওজনে বেচুন, বাকির খাতা রাখুন আর সাপ্লায়ারকে মাল তোলার তালিকা পাঠান।',
      hi: 'QR से ऑर्डर लीजिए, खुला सामान तौलकर बेचिए, उधार खाता रखिए और सप्लायर को माल की लिस्ट भेजिए।',
    },
    points: [
      {
        en: '500+ ready-made grocery items, named in three languages',
        bn: '৫০০+ তৈরি মুদির জিনিস, তিন ভাষায় নাম সমেত',
        hi: '500+ तैयार किराना सामान, तीन भाषाओं में नाम के साथ',
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
    slug: 'restaurant',
    type: 'RESTAURANT',
    demoName: 'Demo Restaurant',
    name: { en: 'Restaurants & dhabas', bn: 'রেস্তোরাঁ ও ধাবা', hi: 'रेस्टोरेंट और ढाबा' },
    headline: {
      en: 'A digital menu your customers order from',
      bn: 'ডিজিটাল মেনু, যা থেকে গ্রাহক নিজেই অর্ডার দেন',
      hi: 'डिजिटल मेन्यू, जिससे ग्राहक खुद ऑर्डर करते हैं',
    },
    lead: {
      en: 'Put your menu behind a QR code for home delivery and pickup, ring up table bills fast and share today’s specials.',
      bn: 'মেনু রাখুন QR কোডে — হোম ডেলিভারি আর পিকআপের জন্য, দ্রুত বিল করুন আর আজকের স্পেশাল জানান।',
      hi: 'मेन्यू को QR कोड पर रखिए — होम डिलीवरी और पिकअप के लिए, तेज़ी से बिल बनाइए और आज का स्पेशल बताइए।',
    },
    points: [
      {
        en: 'Ready menu of chowmein, biryani, rolls, curries and more',
        bn: 'চাউমিন, বিরিয়ানি, রোল, কারি সমেত তৈরি মেনু',
        hi: 'चाउमिन, बिरयानी, रोल, करी समेत तैयार मेन्यू',
      },
      {
        en: 'Priced by plate, half plate or piece',
        bn: 'প্লেট, হাফ প্লেট বা পিস হিসেবে দাম',
        hi: 'प्लेट, हाफ़ प्लेट या पीस के हिसाब से दाम',
      },
      {
        en: 'Every order rings until you open it — nothing is missed in the rush',
        bn: 'প্রতিটা অর্ডারে ফোন বাজে যতক্ষণ না খোলেন — ভিড়েও কিছু মিস হয় না',
        hi: 'हर ऑर्डर पर फ़ोन बजता है जब तक आप खोलें नहीं — भीड़ में भी कुछ नहीं छूटता',
      },
    ],
  },
  {
    slug: 'street-food',
    type: 'STREET_FOOD',
    demoName: 'Demo Food Counter',
    name: { en: 'Street food & food counters', bn: 'রাস্তার খাবার ও খাবারের কাউন্টার', hi: 'स्ट्रीट फ़ूड और खाने के काउंटर' },
    headline: {
      en: 'Your food counter, open for orders on every phone',
      bn: 'আপনার খাবারের কাউন্টার, প্রতিটা ফোনে অর্ডারের জন্য খোলা',
      hi: 'आपका खाने का काउंटर, हर फ़ोन पर ऑर्डर के लिए खुला',
    },
    lead: {
      en: 'Even three curries and fresh roti deserve an online menu. Customers order ahead, you cook, they collect.',
      bn: 'তিনটে তরকারি আর গরম রুটিরও অনলাইন মেনু হয়। গ্রাহক আগে অর্ডার দেন, আপনি রাঁধেন, তাঁরা নিয়ে যান।',
      hi: 'तीन सब्ज़ी और गरम रोटी का भी ऑनलाइन मेन्यू हो सकता है। ग्राहक पहले ऑर्डर करें, आप बनाएँ, वे ले जाएँ।',
    },
    points: [
      {
        en: 'Phuchka, chaat, rolls, thalis and tea — ready to tick',
        bn: 'ফুচকা, চাট, রোল, থালি আর চা — শুধু টিক দিন',
        hi: 'पानी पूरी, चाट, रोल, थाली और चाय — बस टिक कीजिए',
      },
      {
        en: 'A small-counter price for stalls with only a few items',
        bn: 'অল্প কয়েকটা জিনিসের দোকানের জন্য ছোট দাম',
        hi: 'कुछ ही सामान वाली दुकान के लिए छोटा दाम',
      },
      {
        en: 'Cash, UPI and credit, counted at the end of the day',
        bn: 'নগদ, UPI আর বাকি — দিনের শেষে হিসাব মেলানো',
        hi: 'नकद, UPI और उधार — दिन के अंत में हिसाब मिलाइए',
      },
    ],
  },
  {
    slug: 'tea-stall',
    type: 'TEA_STALL',
    demoName: 'Demo Tea Stall',
    name: { en: 'Tea stalls', bn: 'চায়ের দোকান', hi: 'चाय की दुकान' },
    headline: {
      en: 'Every cup counted, every regular’s tab kept',
      bn: 'প্রতিটা কাপের হিসাব, প্রতিটা নিয়মিত খদ্দেরের খাতা',
      hi: 'हर कप का हिसाब, हर नियमित ग्राहक का खाता',
    },
    lead: {
      en: 'Ring up tea and snacks in one tap, keep the regulars’ monthly tab and take office orders by QR.',
      bn: 'এক চাপে চা আর জলখাবারের বিল, নিয়মিত খদ্দেরের মাসিক খাতা, আর অফিসের অর্ডার QR-এ।',
      hi: 'एक टैप में चाय-नाश्ते का बिल, नियमित ग्राहकों का महीने का खाता, और ऑफ़िस के ऑर्डर QR से।',
    },
    points: [
      { en: 'Tea, coffee, toast, omelette and chop — ready to tick', bn: 'চা, কফি, টোস্ট, অমলেট আর চপ — শুধু টিক দিন', hi: 'चाय, कॉफ़ी, टोस्ट, ऑमलेट और चॉप — बस टिक कीजिए' },
      { en: 'Monthly credit for office and shop regulars', bn: 'অফিস আর দোকানের নিয়মিতদের মাসিক বাকি', hi: 'ऑफ़िस और दुकान के नियमित ग्राहकों का मासिक उधार' },
      { en: 'Today’s sales at a glance', bn: 'আজকের বিক্রি এক নজরে', hi: 'आज की बिक्री एक नज़र में' },
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
    slug: 'bakery',
    type: 'BAKERY',
    demoName: 'Demo Bakery',
    name: { en: 'Bakeries & cake shops', bn: 'বেকারি ও কেকের দোকান', hi: 'बेकरी और केक शॉप' },
    headline: {
      en: 'Cakes, bread and puffs — ordered ahead',
      bn: 'কেক, পাউরুটি আর পাফ — আগে থেকেই অর্ডার',
      hi: 'केक, ब्रेड और पफ़ — पहले से ऑर्डर',
    },
    lead: {
      en: 'Take birthday-cake orders ahead, sell by piece or by weight, and tell regulars when fresh bread is in.',
      bn: 'জন্মদিনের কেকের অর্ডার আগে নিন, পিস বা ওজনে বেচুন, আর টাটকা পাউরুটি এলে নিয়মিতদের জানান।',
      hi: 'बर्थडे केक का ऑर्डर पहले लीजिए, पीस या वज़न से बेचिए, और ताज़ी ब्रेड आने पर नियमित ग्राहकों को बताइए।',
    },
    points: [
      { en: 'Bread, buns, pastries, cakes and cookies ready to tick', bn: 'পাউরুটি, বান, পেস্ট্রি, কেক আর কুকিজ — শুধু টিক দিন', hi: 'ब्रेड, बन, पेस्ट्री, केक और कुकीज़ — बस टिक कीजिए' },
      { en: 'Cakes by weight — 500 g or a whole kilo', bn: 'ওজনে কেক — ৫০০ গ্রাম বা পুরো এক কেজি', hi: 'वज़न से केक — 500 ग्राम या पूरा एक किलो' },
      { en: 'Mark sold-out items and say when they are back', bn: 'শেষ হওয়া জিনিস চিহ্নিত করুন, কবে ফিরবে জানান', hi: 'खत्म सामान को चिह्नित कीजिए, कब लौटेगा बताइए' },
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
    slug: 'vegetables-fruits',
    type: 'FRUIT_VEG',
    demoName: 'Demo Sabzi Shop',
    name: { en: 'Vegetable & fruit sellers', bn: 'সবজি ও ফলের দোকান', hi: 'सब्ज़ी और फल की दुकान' },
    headline: {
      en: 'Fresh vegetables, ordered by the kilo',
      bn: 'টাটকা সবজি, কেজি ধরে অর্ডার',
      hi: 'ताज़ी सब्ज़ी, किलो के हिसाब से ऑर्डर',
    },
    lead: {
      en: 'Customers order 250 g of this and 2 kg of that; the price works itself out. Change today’s rates in seconds.',
      bn: 'গ্রাহক এটা ২৫০ গ্রাম, ওটা ২ কেজি অর্ডার দেন; দাম নিজেই হিসাব হয়। আজকের দর বদলান কয়েক সেকেন্ডে।',
      hi: 'ग्राहक यह 250 ग्राम, वह 2 किलो ऑर्डर करते हैं; दाम अपने आप बनता है। आज के भाव सेकंडों में बदलिए।',
    },
    points: [
      { en: 'Every common vegetable, leafy green and fruit ready to tick', bn: 'সব চেনা সবজি, শাক আর ফল — শুধু টিক দিন', hi: 'हर आम सब्ज़ी, साग और फल — बस टिक कीजिए' },
      { en: 'Update many prices at once when the mandi rate moves', bn: 'মান্ডির দর বদলালে একসঙ্গে অনেক দাম বদলান', hi: 'मंडी का भाव बदले तो एक साथ कई दाम बदलिए' },
      { en: 'Home delivery with your own delivery charge', bn: 'নিজের ডেলিভারি চার্জে হোম ডেলিভারি', hi: 'अपने डिलीवरी चार्ज पर होम डिलीवरी' },
    ],
  },
  {
    slug: 'dairy',
    type: 'DAIRY',
    demoName: 'Demo Dairy',
    name: { en: 'Dairy & milk booths', bn: 'দুধের দোকান ও ডেয়ারি', hi: 'डेयरी और दूध की दुकान' },
    headline: {
      en: 'Milk, curd and paneer — with the monthly account kept for you',
      bn: 'দুধ, দই আর পনির — মাসিক হিসাব আপনার হয়ে রাখা',
      hi: 'दूध, दही और पनीर — महीने का हिसाब आपके लिए रखा हुआ',
    },
    lead: {
      en: 'Keep every household’s daily milk on the khata, send the month’s statement on WhatsApp and take extra orders by QR.',
      bn: 'প্রতিটা বাড়ির রোজের দুধ খাতায় তুলুন, মাসের হিসাব হোয়াটসঅ্যাপে পাঠান আর বাড়তি অর্ডার নিন QR-এ।',
      hi: 'हर घर का रोज़ का दूध खाते में लिखिए, महीने का हिसाब व्हाट्सएप पर भेजिए और अतिरिक्त ऑर्डर QR से लीजिए।',
    },
    points: [
      { en: 'Milk, curd, paneer, ghee, eggs and bread ready to tick', bn: 'দুধ, দই, পনির, ঘি, ডিম আর পাউরুটি — শুধু টিক দিন', hi: 'दूध, दही, पनीर, घी, अंडे और ब्रेड — बस टिक कीजिए' },
      { en: 'A statement PDF for each customer at month end', bn: 'মাসের শেষে প্রতিটা গ্রাহকের হিসাবের PDF', hi: 'महीने के अंत में हर ग्राहक का हिसाब PDF में' },
      { en: 'Payment reminders straight to their WhatsApp', bn: 'টাকার তাগাদা সোজা তাঁদের হোয়াটসঅ্যাপে', hi: 'भुगतान की याद सीधे उनके व्हाट्सएप पर' },
    ],
  },
  {
    slug: 'meat-fish',
    type: 'MEAT_FISH',
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
    slug: 'cosmetics',
    type: 'COSMETICS',
    demoName: 'Demo Cosmetics',
    name: { en: 'Cosmetics & fancy stores', bn: 'প্রসাধনী ও ফ্যান্সি স্টোর', hi: 'कॉस्मेटिक्स और फ़ैंसी स्टोर' },
    headline: {
      en: 'Your beauty counter, online in an afternoon',
      bn: 'আপনার প্রসাধনীর কাউন্টার, এক বিকেলেই অনলাইনে',
      hi: 'आपका ब्यूटी काउंटर, एक दोपहर में ऑनलाइन',
    },
    lead: {
      en: 'List creams, bangles and baby care in minutes, photograph a product to add it, and let customers order from home.',
      bn: 'কয়েক মিনিটে ক্রিম, চুড়ি আর শিশুর জিনিস তুলুন, ছবি তুলেই জিনিস যোগ করুন, আর গ্রাহক বাড়ি থেকেই অর্ডার দিন।',
      hi: 'कुछ मिनटों में क्रीम, चूड़ियाँ और बच्चों का सामान जोड़िए, फ़ोटो से सामान जोड़िए, और ग्राहक घर से ऑर्डर करें।',
    },
    points: [
      { en: 'Personal care, cosmetics, accessories and baby care ready to tick', bn: 'ব্যক্তিগত যত্ন, প্রসাধনী, টুকিটাকি আর শিশুর জিনিস — শুধু টিক দিন', hi: 'निजी देखभाल, कॉस्मेटिक्स, एक्सेसरीज़ और बच्चों का सामान — बस टिक कीजिए' },
      { en: 'Photograph a product and the app reads the brand', bn: 'জিনিসের ছবি তুলুন, অ্যাপ ব্র্যান্ড পড়ে নেয়', hi: 'सामान की फ़ोटो लीजिए, ऐप ब्रांड पढ़ लेता है' },
      { en: 'Hide what is out of stock automatically', bn: 'যা নেই তা আপনা থেকেই লুকিয়ে যায়', hi: 'जो नहीं है वह अपने आप छिप जाता है' },
    ],
  },
  {
    slug: 'hardware',
    type: 'HARDWARE',
    demoName: 'Demo Hardware',
    name: { en: 'Hardware & electrical shops', bn: 'হার্ডওয়্যার ও ইলেকট্রিকের দোকান', hi: 'हार्डवेयर और बिजली की दुकान' },
    headline: {
      en: 'Nails, taps and wires — billed and tracked',
      bn: 'পেরেক, কল আর তার — বিল আর হিসাব দুটোই',
      hi: 'कील, नल और तार — बिल और हिसाब दोनों',
    },
    lead: {
      en: 'Give contractors and electricians a running account, bill walk-in customers fast and keep stock of every fitting.',
      bn: 'ঠিকাদার আর ইলেকট্রিশিয়ানদের চলতি খাতা, দোকানে আসা গ্রাহকের দ্রুত বিল, আর প্রতিটা ফিটিংসের স্টক।',
      hi: 'ठेकेदार और इलेक्ट्रीशियन का चालू खाता, दुकान पर आए ग्राहक का तेज़ बिल, और हर फ़िटिंग का स्टॉक।',
    },
    points: [
      { en: 'Electricals, tools, fittings, plumbing and paint ready to tick', bn: 'ইলেকট্রিক, যন্ত্রপাতি, ফিটিংস, প্লাম্বিং আর রং — শুধু টিক দিন', hi: 'बिजली, औज़ार, फ़िटिंग्स, प्लंबिंग और पेंट — बस टिक कीजिए' },
      { en: 'Credit accounts for contractors, with reminders', bn: 'ঠিকাদারদের বাকির খাতা, তাগাদা সমেত', hi: 'ठेकेदारों का उधार खाता, याद दिलाने के साथ' },
      { en: 'A restock list for your wholesaler', bn: 'পাইকারের জন্য মাল তোলার তালিকা', hi: 'थोक विक्रेता के लिए माल की लिस्ट' },
    ],
  },
  {
    slug: 'flowers-puja',
    type: 'PUJA_FLOWER',
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
  {
    slug: 'garments',
    type: 'GARMENTS',
    demoName: 'Demo Garments',
    name: { en: 'Garment & hosiery shops', bn: 'জামাকাপড় ও হোসিয়ারির দোকান', hi: 'कपड़े और होज़री की दुकान' },
    headline: {
      en: 'Your clothes shop, open on every customer’s phone',
      bn: 'আপনার জামাকাপড়ের দোকান, প্রতিটা গ্রাহকের ফোনে খোলা',
      hi: 'आपकी कपड़ों की दुकान, हर ग्राहक के फ़ोन पर खुली',
    },
    lead: {
      en: 'List sarees, shirts and school uniforms, take orders by QR and keep festival-season credit in order.',
      bn: 'শাড়ি, শার্ট আর স্কুলের পোশাক তুলুন, QR-এ অর্ডার নিন আর পুজোর মরসুমের বাকি গুছিয়ে রাখুন।',
      hi: 'साड़ी, शर्ट और स्कूल यूनिफ़ॉर्म जोड़िए, QR से ऑर्डर लीजिए और त्योहार के मौसम का उधार व्यवस्थित रखिए।',
    },
    points: [
      { en: 'Menswear, womenswear, kidswear and home linen ready to tick', bn: 'ছেলেদের, মেয়েদের, বাচ্চাদের পোশাক আর ঘরের কাপড় — শুধু টিক দিন', hi: 'पुरुषों, महिलाओं, बच्चों के कपड़े और घर के कपड़े — बस टिक कीजिए' },
      { en: 'Priced per piece, with each size listed as its own item', bn: 'পিস হিসেবে দাম, প্রতিটা মাপ আলাদা জিনিস হিসেবে', hi: 'पीस के हिसाब से दाम, हर साइज़ अलग सामान के रूप में' },
      { en: 'Festival credit with WhatsApp reminders', bn: 'উৎসবের বাকি, হোয়াটসঅ্যাপে তাগাদা', hi: 'त्योहार का उधार, व्हाट्सएप पर याद' },
    ],
  },
];

export function businessBySlug(slug: string): Business | undefined {
  return BUSINESSES.find((business) => business.slug === slug);
}
