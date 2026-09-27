import { BRAND_NAME } from './brand';
import type { Locale } from './i18n';
import {
  AUTO_PAUSE_DAYS,
  LISTING_PAISE_PER_ITEM,
  PLAN_SPECS,
  SETUP_FEE_PAISE,
  STANDARD_PRICE,
  TRIAL_DAYS,
  planItems,
  type Plan,
} from './plans';
import { READY_ITEMS } from './starter-catalogue';

/**
 * The words on the public landing page, in English, Bengali and Hindi.
 *
 * Kept out of the page component so a sentence can be changed without reading
 * JSX. Every entry has all three languages; TypeScript refuses one without.
 *
 * THE VOICE (rewritten 2026-09-27, by request): clear, professional and short.
 * Plain words a shop owner uses, but no slang, no neighbourhood names, no
 * jokes — one idea per line, the benefit first. All of it is original writing
 * for this product. English is the default and the one search engines index
 * first, so it carries the terms people search for: kirana, grocery store,
 * restaurant, sweet shop, local shop, billing, khata, udhaar, QR code, WhatsApp.
 *
 * NOT A GROCERY APP (2026-09-27). Halkhata is for every kind of local business
 * — see `lib/business-types.ts`. Lines here speak to "your shop" and name the
 * grocery store only as one example among several.
 *
 * NOTHING ASPIRATIONAL. Every line is something a shop can do today; a feature
 * earns a sentence here when it ships, not before.
 *
 * The brand is `BRAND_NAME` in every language: it is a name, not a word to
 * translate.
 */

/** One piece of copy, in every language the page can be read in. */
export type Words = Record<Locale, string>;

/* ------------------------------------------------------------------ */
/* Getting started                                                    */
/* ------------------------------------------------------------------ */

export type Step = { title: Words; body: Words };

export const STEPS: Step[] = [
  {
    title: { en: 'Contact us', bn: 'যোগাযোগ করুন', hi: 'हमसे संपर्क करें' },
    body: {
      en: 'Send your shop’s name, phone number and address on WhatsApp, or give us a call.',
      bn: 'হোয়াটসঅ্যাপে দোকানের নাম, ফোন নম্বর আর ঠিকানা পাঠান, অথবা ফোন করুন।',
      hi: 'व्हाट्सएप पर दुकान का नाम, फ़ोन नंबर और पता भेजिए, या हमें कॉल कीजिए।',
    },
  },
  {
    title: { en: 'We set up your shop', bn: 'আমরা দোকান তৈরি করি', hi: 'हम दुकान तैयार करते हैं' },
    body: {
      en: 'We create your online store, print your QR code and help you sign in. There is nothing to install.',
      bn: 'আমরা আপনার অনলাইন দোকান তৈরি করি, QR কোড ছাপিয়ে দিই আর লগইন করতে সাহায্য করি। কিছু ইনস্টল করতে হয় না।',
      hi: 'हम आपकी ऑनलाइन दुकान बनाते हैं, QR कोड छापते हैं और लॉगिन करने में मदद करते हैं। कुछ इंस्टॉल नहीं करना।',
    },
  },
  {
    title: { en: 'Add your products', bn: 'জিনিস যোগ করুন', hi: 'सामान जोड़ें' },
    body: {
      en: 'Speak them, photograph them or pick from ready-made items. Or let us add them for you.',
      bn: 'মুখে বলে, ছবি তুলে বা তৈরি তালিকা থেকে বেছে নিন। চাইলে আমরাই যোগ করে দিই।',
      hi: 'बोलकर, फ़ोटो खींचकर या तैयार लिस्ट से चुनिए। चाहें तो हम ही जोड़ देते हैं।',
    },
  },
  {
    title: { en: 'Start selling', bn: 'বিক্রি শুরু করুন', hi: 'बिक्री शुरू करें' },
    body: {
      en: 'Display your QR code, take orders, bill customers and keep your khata — all from one app.',
      bn: 'QR কোড লাগান, অর্ডার নিন, বিল করুন আর খাতা রাখুন — সব এক অ্যাপে।',
      hi: 'QR कोड लगाइए, ऑर्डर लीजिए, बिल बनाइए और खाता रखिए — सब एक ही ऐप में।',
    },
  },
];

/* ------------------------------------------------------------------ */
/* Trust                                                              */
/* ------------------------------------------------------------------ */

/**
 * WHAT WE WILL NEVER DO. Keep every line true: if a feature ever needs one of
 * these, the line comes off before the feature ships.
 */
export const SAFETY: Words[] = [
  {
    en: 'We never ask for your OTP, UPI PIN or bank password.',
    bn: 'আমরা কখনও আপনার OTP, UPI পিন বা ব্যাঙ্কের পাসওয়ার্ড চাই না।',
    hi: 'हम कभी आपका OTP, UPI पिन या बैंक पासवर्ड नहीं माँगते।',
  },
  {
    en: 'Customers pay you directly, in cash or to your own UPI.',
    bn: 'গ্রাহক টাকা দেন সরাসরি আপনাকে — নগদে বা আপনার নিজের UPI-তে।',
    hi: 'ग्राहक सीधे आपको भुगतान करते हैं — नकद या आपके अपने UPI में।',
  },
  {
    en: 'Nothing to install. It runs in your phone’s browser.',
    bn: 'কিছু ইনস্টল করতে হয় না। ফোনের ব্রাউজারেই চলে।',
    hi: 'कुछ इंस्टॉल नहीं करना। फ़ोन के ब्राउज़र में ही चलता है।',
  },
  {
    en: 'Cancel any time, and take your khata with you as PDF or CSV.',
    bn: 'যে কোনও সময় বন্ধ করুন, আর খাতা PDF বা CSV করে সঙ্গে নিয়ে যান।',
    hi: 'कभी भी बंद कीजिए, और अपना खाता PDF या CSV में साथ ले जाइए।',
  },
];

/* ------------------------------------------------------------------ */
/* The main features — one band each, with a screenshot                */
/* ------------------------------------------------------------------ */

export type FeatureId = 'products' | 'storefront' | 'orders' | 'khata' | 'billing' | 'stock' | 'reports';

export type Feature = {
  id: FeatureId;
  eyebrow: Words;
  title: Words;
  lead: Words;
  points: Words[];
};

export const FEATURES: Feature[] = [
  {
    id: 'products',
    eyebrow: { en: 'Product catalogue', bn: 'জিনিসের তালিকা', hi: 'सामान की सूची' },
    title: {
      en: 'Add products in seconds, without typing',
      bn: 'টাইপ না করেই কয়েক সেকেন্ডে জিনিস যোগ করুন',
      hi: 'बिना टाइप किए कुछ ही सेकंड में सामान जोड़ें',
    },
    lead: {
      en: 'Build your full product list the way that suits you.',
      bn: 'যেভাবে সুবিধা, সেভাবে পুরো তালিকা তৈরি করুন।',
      hi: 'जैसे आपको आसान लगे, वैसे पूरी सूची बनाइए।',
    },
    points: [
      {
        en: 'Speak the name, quantity and price in English, Bengali or Hindi',
        bn: 'ইংরেজি, বাংলা বা হিন্দিতে নাম, পরিমাণ আর দাম বলুন',
        hi: 'अंग्रेज़ी, बांग्ला या हिंदी में नाम, मात्रा और दाम बोलिए',
      },
      {
        en: 'Photograph a packet — the app reads the brand and pack size',
        bn: 'প্যাকেটের ছবি তুলুন — অ্যাপ ব্র্যান্ড আর মাপ পড়ে নেয়',
        hi: 'पैकेट की फ़ोटो लीजिए — ऐप ब्रांड और पैक साइज़ पढ़ लेता है',
      },
      {
        en: `Choose from ${READY_ITEMS}+ ready-made items for your kind of shop, named in three languages — free`,
        bn: `আপনার দোকানের ধরন অনুযায়ী ${READY_ITEMS}+ তৈরি জিনিস থেকে বেছে নিন, তিন ভাষায় নাম সমেত — বিনামূল্যে`,
        hi: `अपनी दुकान के हिसाब से ${READY_ITEMS}+ तैयार सामान में से चुनिए, तीन भाषाओं में नाम के साथ — मुफ़्त`,
      },
      {
        en: 'Sell by kilo, litre, packet or piece — including loose quantities like 250 g',
        bn: 'কেজি, লিটার, প্যাকেট বা পিস — ২৫০ গ্রামের মতো খুচরো পরিমাণেও বিক্রি',
        hi: 'किलो, लीटर, पैकेट या पीस — 250 ग्राम जैसी खुली मात्रा में भी बिक्री',
      },
    ],
  },
  {
    id: 'storefront',
    eyebrow: { en: 'Online store', bn: 'অনলাইন দোকান', hi: 'ऑनलाइन दुकान' },
    title: {
      en: 'Your own online store, opened with a QR code',
      bn: 'QR কোডে খোলে আপনার নিজের অনলাইন দোকান',
      hi: 'QR कोड से खुलने वाली आपकी अपनी ऑनलाइन दुकान',
    },
    lead: {
      en: 'Customers scan your QR code and order in their own language. No app, no sign-up.',
      bn: 'গ্রাহক QR কোড স্ক্যান করে নিজের ভাষায় অর্ডার দেন। অ্যাপ বা সাইন-আপ লাগে না।',
      hi: 'ग्राहक QR कोड स्कैन करके अपनी भाषा में ऑर्डर देते हैं। न ऐप, न साइन-अप।',
    },
    points: [
      {
        en: 'Home delivery or pickup, with your own delivery charge and minimum order',
        bn: 'হোম ডেলিভারি বা দোকান থেকে নেওয়া — নিজের ডেলিভারি চার্জ আর ন্যূনতম অর্ডার সমেত',
        hi: 'होम डिलीवरी या दुकान से पिकअप — अपने डिलीवरी चार्ज और न्यूनतम ऑर्डर के साथ',
      },
      {
        en: 'Out-of-stock items are hidden automatically',
        bn: 'যা শেষ, তা আপনা থেকেই লুকিয়ে যায়',
        hi: 'जो खत्म है, वह अपने आप छिप जाता है',
      },
      {
        en: 'Post a notice for holidays, offers or delivery changes',
        bn: 'ছুটি, অফার বা ডেলিভারির খবর নোটিসে জানান',
        hi: 'छुट्टी, ऑफ़र या डिलीवरी की जानकारी नोटिस में दीजिए',
      },
      {
        en: 'Customers can follow their order and download the bill',
        bn: 'গ্রাহক অর্ডারের খবর দেখতে পান আর বিল নামিয়ে নিতে পারেন',
        hi: 'ग्राहक अपने ऑर्डर की जानकारी देख सकते हैं और बिल डाउनलोड कर सकते हैं',
      },
    ],
  },
  {
    id: 'orders',
    eyebrow: { en: 'Order alerts', bn: 'অর্ডারের খবর', hi: 'ऑर्डर अलर्ट' },
    title: {
      en: 'Never miss an order, even on a busy day',
      bn: 'ব্যস্ত দিনেও কোনও অর্ডার মিস হবে না',
      hi: 'व्यस्त दिन में भी कोई ऑर्डर न छूटे',
    },
    lead: {
      en: 'Every new order rings and is read aloud in your language until you open it.',
      bn: 'প্রতিটা নতুন অর্ডারে ফোন বাজে আর আপনার ভাষায় বলে শোনায় — যতক্ষণ না খুলছেন।',
      hi: 'हर नया ऑर्डर घंटी बजाता है और आपकी भाषा में बोलकर बताता है — जब तक आप खोल न लें।',
    },
    points: [
      {
        en: 'A large “new order” bar on every screen, plus phone notifications',
        bn: 'প্রতিটা স্ক্রিনে বড় “নতুন অর্ডার” বার, সঙ্গে ফোনে নোটিফিকেশন',
        hi: 'हर स्क्रीन पर बड़ा “नया ऑर्डर” बार, साथ में फ़ोन पर नोटिफ़िकेशन',
      },
      {
        en: 'Short of an item? Edit the order and the customer sees the new total',
        bn: 'কোনও জিনিস কম? অর্ডার বদলান, গ্রাহক নতুন মোট দেখতে পান',
        hi: 'कोई सामान कम है? ऑर्डर बदलिए, ग्राहक को नया कुल दिख जाता है',
      },
      {
        en: 'Customers are told when an order is changed, completed or cancelled',
        bn: 'অর্ডার বদলালে, সম্পূর্ণ হলে বা বাতিল হলে গ্রাহককে জানানো হয়',
        hi: 'ऑर्डर बदलने, पूरा होने या रद्द होने पर ग्राहक को बताया जाता है',
      },
      {
        en: 'The screen stays on during shop hours so no order is missed',
        bn: 'দোকান খোলা থাকার সময় স্ক্রিন জেগে থাকে, যাতে কোনও অর্ডার ফসকে না যায়',
        hi: 'दुकान के समय स्क्रीन चालू रहती है, ताकि कोई ऑर्डर न छूटे',
      },
    ],
  },
  {
    id: 'khata',
    eyebrow: { en: 'Digital khata', bn: 'ডিজিটাল খাতা', hi: 'डिजिटल खाता' },
    title: {
      en: 'A digital khata for customer credit',
      bn: 'গ্রাহকের বাকির জন্য ডিজিটাল খাতা',
      hi: 'ग्राहकों के उधार के लिए डिजिटल खाता',
    },
    lead: {
      en: 'Every customer’s udhaar balance, always added up and up to date.',
      bn: 'প্রত্যেক গ্রাহকের বাকি — সবসময় যোগ করা, সবসময় হালনাগাদ।',
      hi: 'हर ग्राहक का उधार — हमेशा जुड़ा हुआ, हमेशा अपडेट।',
    },
    points: [
      {
        en: 'See your total dues and who has owed the longest',
        bn: 'মোট কত বাকি আর কে সবচেয়ে বেশি দিন বাকি রেখেছেন, এক নজরে',
        hi: 'कुल कितना बाकी है और किसका उधार सबसे पुराना है, एक नज़र में',
      },
      {
        en: 'Send a payment reminder straight to the customer’s WhatsApp chat',
        bn: 'টাকার তাগাদা সোজা গ্রাহকের হোয়াটসঅ্যাপ চ্যাটে পাঠান',
        hi: 'भुगतान की याद सीधे ग्राहक की व्हाट्सएप चैट में भेजिए',
      },
      {
        en: 'Share a full account statement as a PDF',
        bn: 'পুরো হিসাবের স্টেটমেন্ট PDF করে পাঠান',
        hi: 'पूरे हिसाब का स्टेटमेंट PDF में भेजिए',
      },
      {
        en: 'Unpaid orders are added to the khata automatically',
        bn: 'টাকা না দেওয়া অর্ডার আপনা থেকেই খাতায় ওঠে',
        hi: 'बिना भुगतान वाले ऑर्डर अपने आप खाते में जुड़ जाते हैं',
      },
    ],
  },
  {
    id: 'billing',
    eyebrow: { en: 'Billing', bn: 'বিলিং', hi: 'बिलिंग' },
    title: {
      en: 'Fast counter billing, with bills on WhatsApp',
      bn: 'কাউন্টারে দ্রুত বিল, আর বিল হোয়াটসঅ্যাপে',
      hi: 'काउंटर पर तेज़ बिलिंग, और बिल व्हाट्सएप पर',
    },
    lead: {
      en: 'Record walk-in sales in a few taps and keep the day’s cash in order.',
      bn: 'দোকানে আসা গ্রাহকের বিক্রি কয়েক ট্যাপে তুলুন, দিনের ক্যাশ ঠিক রাখুন।',
      hi: 'दुकान पर आए ग्राहक की बिक्री कुछ टैप में दर्ज कीजिए, दिन का कैश ठीक रखिए।',
    },
    points: [
      {
        en: 'Cash, UPI or credit on every sale',
        bn: 'প্রতিটা বিক্রিতে নগদ, UPI বা বাকি',
        hi: 'हर बिक्री पर नकद, UPI या उधार',
      },
      {
        en: 'The bill opens in the customer’s WhatsApp chat — no contact searching',
        bn: 'বিল সোজা গ্রাহকের হোয়াটসঅ্যাপ চ্যাটে খোলে — কনট্যাক্ট খুঁজতে হয় না',
        hi: 'बिल सीधे ग्राहक की व्हाट्सएप चैट में खुलता है — कॉन्टैक्ट ढूँढना नहीं पड़ता',
      },
      {
        en: 'A clean PDF bill in the customer’s language',
        bn: 'গ্রাহকের ভাষায় পরিষ্কার PDF বিল',
        hi: 'ग्राहक की भाषा में साफ़ PDF बिल',
      },
      {
        en: 'Today’s sales at a glance, and a cash drawer to close each night',
        bn: 'আজকের বিক্রি এক নজরে, আর রোজ রাতে ক্যাশ মিলিয়ে বন্ধ',
        hi: 'आज की बिक्री एक नज़र में, और हर रात कैश मिलाकर बंद',
      },
    ],
  },
  {
    id: 'stock',
    eyebrow: { en: 'Stock', bn: 'স্টক', hi: 'स्टॉक' },
    title: {
      en: 'Know what is running low before customers ask',
      bn: 'গ্রাহক চাওয়ার আগেই জানুন কী ফুরিয়ে আসছে',
      hi: 'ग्राहक के माँगने से पहले जानिए क्या खत्म हो रहा है',
    },
    lead: {
      en: 'Stock updates itself with every order and every counter sale.',
      bn: 'প্রতিটা অর্ডার আর বিক্রির সঙ্গে স্টক নিজে থেকেই বদলায়।',
      hi: 'हर ऑर्डर और हर बिक्री के साथ स्टॉक अपने आप बदलता है।',
    },
    points: [
      {
        en: 'A restock list you can send to your supplier on WhatsApp or as a PDF',
        bn: 'মাল তোলার তালিকা — সাপ্লায়ারকে হোয়াটসঅ্যাপে বা PDF-এ পাঠান',
        hi: 'माल मँगाने की लिस्ट — सप्लायर को व्हाट्सएप पर या PDF में भेजिए',
      },
      {
        en: 'Update prices and stock for many items at once',
        bn: 'একসঙ্গে অনেক জিনিসের দাম আর স্টক বদলান',
        hi: 'एक साथ कई सामानों का दाम और स्टॉक बदलिए',
      },
      {
        en: 'Tell customers when a finished item will be back',
        bn: 'শেষ হওয়া জিনিস কবে আবার আসবে, গ্রাহককে জানান',
        hi: 'खत्म हुआ सामान कब वापस आएगा, ग्राहक को बताइए',
      },
    ],
  },
  {
    id: 'reports',
    // WHAT THE OWNER APP ACTUALLY HAS. Full sales reports live in the admin
    // console, not the owner's app — so this promises the takings panel on the
    // owner's home screen and the khata export, and nothing more.
    eyebrow: { en: 'Daily takings', bn: 'দিনের হিসাব', hi: 'दिन का हिसाब' },
    title: {
      en: 'Know exactly what came in, every day',
      bn: 'রোজ ঠিক কত এল, পরিষ্কার জানুন',
      hi: 'हर दिन ठीक कितना आया, साफ़ जानिए',
    },
    lead: {
      en: 'Today’s and this month’s sales, split into cash, UPI and credit.',
      bn: 'আজকের আর এই মাসের বিক্রি — নগদ, UPI আর বাকিতে ভাগ করা।',
      hi: 'आज की और इस महीने की बिक्री — नकद, UPI और उधार में बँटी हुई।',
    },
    points: [
      {
        en: 'Totals that always add up: cash, UPI and khata',
        bn: 'মোট সবসময় মেলে: নগদ, UPI আর খাতা',
        hi: 'कुल हमेशा मिलता है: नकद, UPI और खाता',
      },
      {
        en: 'Orders and counter sales counted together',
        bn: 'অর্ডার আর কাউন্টারের বিক্রি একসঙ্গে গোনা',
        hi: 'ऑर्डर और काउंटर की बिक्री एक साथ गिनी जाती है',
      },
      {
        en: 'Export the khata as PDF or CSV any time',
        bn: 'যে কোনও সময় খাতা PDF বা CSV-তে নামিয়ে নিন',
        hi: 'कभी भी खाता PDF या CSV में निकाल लीजिए',
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Smaller features, as a compact grid                                */
/* ------------------------------------------------------------------ */

export type MoreId = 'today' | 'simple' | 'install' | 'languages' | 'readback' | 'delivery' | 'broadcast' | 'payments';

export const MORE: { id: MoreId; title: Words; body: Words }[] = [
  {
    id: 'today',
    title: { en: 'Today at a glance', bn: 'আজকের দোকান এক নজরে', hi: 'आज की दुकान एक नज़र में' },
    body: {
      en: 'Pending orders, low stock, dues and today’s sales on one screen.',
      bn: 'বাকি অর্ডার, কম স্টক, পাওনা আর আজকের বিক্রি — এক স্ক্রিনে।',
      hi: 'बाकी ऑर्डर, कम स्टॉक, बकाया और आज की बिक्री — एक स्क्रीन पर।',
    },
  },
  {
    id: 'simple',
    title: { en: 'Simple mode', bn: 'সহজ মোড', hi: 'आसान मोड' },
    body: {
      en: 'Show only billing and the khata for a cleaner screen.',
      bn: 'শুধু বিক্রি আর খাতা দেখান, স্ক্রিন থাকে পরিষ্কার।',
      hi: 'सिर्फ़ बिक्री और खाता दिखाइए, स्क्रीन रहे साफ़।',
    },
  },
  {
    id: 'install',
    title: { en: 'Works like an app', bn: 'অ্যাপের মতোই চলে', hi: 'ऐप की तरह चलता है' },
    body: {
      en: 'Add it to your home screen. No Play Store download needed.',
      bn: 'হোম স্ক্রিনে রাখুন। প্লে স্টোর থেকে নামাতে হয় না।',
      hi: 'होम स्क्रीन पर रखिए। प्ले स्टोर से डाउनलोड नहीं करना।',
    },
  },
  {
    id: 'languages',
    title: { en: 'Three languages', bn: 'তিনটি ভাষা', hi: 'तीन भाषाएँ' },
    body: {
      en: 'English, Bengali and Hindi — you and each customer choose your own.',
      bn: 'ইংরেজি, বাংলা আর হিন্দি — আপনি আর প্রত্যেক গ্রাহক নিজের ভাষা বেছে নেন।',
      hi: 'अंग्रेज़ी, बांग्ला और हिंदी — आप और हर ग्राहक अपनी भाषा चुनते हैं।',
    },
  },
  {
    id: 'readback',
    title: { en: 'Read aloud', bn: 'বলে শোনায়', hi: 'बोलकर सुनाता है' },
    body: {
      en: 'Items, amounts and orders are spoken back, for owners who prefer listening.',
      bn: 'জিনিস, টাকার অঙ্ক আর অর্ডার বলে শোনায় — শুনতে যাঁর সুবিধা, তাঁর জন্য।',
      hi: 'सामान, रकम और ऑर्डर बोलकर सुनाता है — जिन्हें सुनना आसान लगे, उनके लिए।',
    },
  },
  {
    id: 'delivery',
    title: { en: 'Delivery list', bn: 'ডেলিভারির তালিকা', hi: 'डिलीवरी सूची' },
    body: {
      en: 'Send the day’s deliveries to your delivery person on WhatsApp.',
      bn: 'দিনের ডেলিভারির তালিকা ডেলিভারির লোককে হোয়াটসঅ্যাপে পাঠান।',
      hi: 'दिन की डिलीवरी की सूची डिलीवरी वाले को व्हाट्सएप पर भेजिए।',
    },
  },
  {
    id: 'broadcast',
    title: { en: 'Daily menu and offers', bn: 'রোজের মেনু আর অফার', hi: 'रोज़ का मेन्यू और ऑफ़र' },
    body: {
      en: 'Write today’s menu or offer once and share it with regular customers.',
      bn: 'আজকের মেনু বা অফার একবার লিখে নিয়মিত গ্রাহকদের পাঠান।',
      hi: 'आज का मेन्यू या ऑफ़र एक बार लिखकर नियमित ग्राहकों को भेजिए।',
    },
  },
  {
    id: 'payments',
    title: { en: 'Your UPI, your money', bn: 'আপনার UPI, আপনার টাকা', hi: 'आपका UPI, आपका पैसा' },
    body: {
      en: 'Show your own UPI QR at checkout. Payments never pass through us.',
      bn: 'অর্ডারের সময় আপনার নিজের UPI QR দেখান। টাকা আমাদের হাত দিয়ে যায় না।',
      hi: 'ऑर्डर के समय अपना UPI QR दिखाइए। पैसा हमारे पास से होकर नहीं जाता।',
    },
  },
];

/* ------------------------------------------------------------------ */
/* Questions                                                          */
/* ------------------------------------------------------------------ */

const LISTING_PRICE = `₹${Math.round(LISTING_PAISE_PER_ITEM / 100)}`;
/** The one-time shop setup fee, "₹499". */
const SETUP_PRICE = `₹${Math.round(SETUP_FEE_PAISE / 100)}`;

/** Also published as FAQ structured data, so the English must stand alone. */
export const FAQ: { q: Words; a: Words }[] = [
  {
    q: {
      en: `Which shops can use ${BRAND_NAME}?`,
      bn: `কোন কোন দোকান ${BRAND_NAME} ব্যবহার করতে পারে?`,
      hi: `कौन-सी दुकानें ${BRAND_NAME} इस्तेमाल कर सकती हैं?`,
    },
    a: {
      en: 'Local shops with daily regulars and a busy counter: grocery and kirana stores (including milk and dairy), sweet shops, meat and fish shops, stationery and xerox shops, flower and puja shops, roll and momo corners and home kitchens.',
      bn: 'রোজের নিয়মিত খদ্দের আর ভিড়ের কাউন্টার আছে এমন স্থানীয় দোকান: মুদি ও কিরানা দোকান (দুধ ও ডেয়ারি সমেত), মিষ্টির দোকান, মাছ-মাংসের দোকান, স্টেশনারি ও জেরক্স, ফুল ও পুজোর দোকান, রোল-মোমোর দোকান আর বাড়ির রান্না।',
      hi: 'रोज़ के नियमित ग्राहकों और भीड़ वाले काउंटर वाली लोकल दुकानें: किराना स्टोर (दूध और डेयरी समेत), मिठाई की दुकान, मीट और मछली की दुकान, स्टेशनरी और ज़ेरॉक्स, फूल और पूजा सामग्री की दुकान, रोल-मोमो की दुकान और होम किचन।',
    },
  },
  {
    q: {
      en: 'How much does it cost?',
      bn: 'খরচ কত?',
      hi: 'कितना खर्च है?',
    },
    a: {
      en: `One plan: ₹${STANDARD_PRICE} a month, with every feature and unlimited products, plus a one-time ${SETUP_PRICE} shop setup. Paying for a year costs 10 months. A very small counter selling only a few items can ask us for a lower custom price.`,
      bn: `একটাই প্ল্যান: মাসে ₹${STANDARD_PRICE}, সব সুবিধা আর যত খুশি জিনিস, সঙ্গে একবারের ${SETUP_PRICE} দোকান সেটআপ। এক বছরের জন্য দিলে লাগে ১০ মাসের দাম। অল্প কয়েকটা জিনিসের খুব ছোট কাউন্টার হলে কম দামের জন্য আমাদের বলুন।`,
      hi: `एक ही प्लान: महीने का ₹${STANDARD_PRICE}, हर सुविधा और असीमित सामान, साथ में एक बार का ${SETUP_PRICE} दुकान सेटअप। साल भर का एक साथ देने पर 10 महीने का दाम। कुछ ही सामान वाला बहुत छोटा काउंटर हो तो कम दाम के लिए हमसे कहिए।`,
    },
  },
  {
    q: {
      en: 'Do my customers need to download an app?',
      bn: 'আমার গ্রাহকদের কি কোনও অ্যাপ নামাতে হবে?',
      hi: 'क्या मेरे ग्राहकों को कोई ऐप डाउनलोड करना होगा?',
    },
    a: {
      en: 'No. They scan your QR code with their phone camera and your store opens in the browser. No account or password.',
      bn: 'না। ফোনের ক্যামেরায় QR কোড স্ক্যান করলেই ব্রাউজারে আপনার দোকান খুলে যায়। অ্যাকাউন্ট বা পাসওয়ার্ড লাগে না।',
      hi: 'नहीं। फ़ोन के कैमरे से QR कोड स्कैन करते ही आपकी दुकान ब्राउज़र में खुल जाती है। न अकाउंट, न पासवर्ड।',
    },
  },
  {
    q: {
      en: 'Do I need a new phone or a computer?',
      bn: 'নতুন ফোন বা কম্পিউটার লাগবে কি?',
      hi: 'क्या नया फ़ोन या कंप्यूटर चाहिए?',
    },
    a: {
      en: `No. ${BRAND_NAME} works on any smartphone with a browser, and you can add it to your home screen like an app.`,
      bn: `না। ব্রাউজার আছে এমন যে কোনও স্মার্টফোনেই ${BRAND_NAME} চলে, আর অ্যাপের মতো হোম স্ক্রিনে রাখা যায়।`,
      hi: `नहीं। ब्राउज़र वाले किसी भी स्मार्टफ़ोन पर ${BRAND_NAME} चलता है, और इसे ऐप की तरह होम स्क्रीन पर रख सकते हैं।`,
    },
  },
  {
    q: {
      en: 'Do you charge a commission on orders?',
      bn: 'অর্ডারে কি কমিশন নেন?',
      hi: 'क्या आप ऑर्डर पर कमीशन लेते हैं?',
    },
    a: {
      en: 'Never. You pay one fixed monthly price. Customers pay you directly, in cash or to your own UPI.',
      bn: 'কখনও না। মাসে একটাই নির্দিষ্ট দাম। গ্রাহক টাকা দেন সরাসরি আপনাকে — নগদে বা আপনার নিজের UPI-তে।',
      hi: 'कभी नहीं। महीने का एक ही तय दाम। ग्राहक सीधे आपको भुगतान करते हैं — नकद या आपके अपने UPI में।',
    },
  },
  {
    q: {
      en: 'Can you add my products for me?',
      bn: 'আপনারা কি আমার জিনিসগুলো যোগ করে দিতে পারেন?',
      hi: 'क्या आप मेरा सामान जोड़ सकते हैं?',
    },
    a: {
      en: `Yes. The one-time ${SETUP_PRICE} shop setup includes adding your items from our ready-made list, in all three languages. Anything not on the list we can add for ${LISTING_PRICE} per item.`,
      bn: `হ্যাঁ। একবারের ${SETUP_PRICE} দোকান সেটআপে আমাদের তৈরি তালিকা থেকে আপনার জিনিস তুলে দেওয়া আছে, তিন ভাষাতেই। তালিকার বাইরের জিনিস জিনিস পিছু ${LISTING_PRICE}-এ তুলে দিই।`,
      hi: `हाँ। एक बार के ${SETUP_PRICE} दुकान सेटअप में हमारी तैयार लिस्ट से आपका सामान जोड़ना शामिल है, तीनों भाषाओं में। लिस्ट से बाहर का सामान ${LISTING_PRICE} प्रति सामान में जोड़ देते हैं।`,
    },
  },
  {
    q: {
      en: 'Can I use it if I am not comfortable reading?',
      bn: 'পড়তে অসুবিধা হলেও কি ব্যবহার করা যাবে?',
      hi: 'अगर पढ़ने में दिक्कत हो, तब भी चला सकते हैं?',
    },
    a: {
      en: 'Yes. You can add items by speaking, and the app reads items, amounts and new orders aloud.',
      bn: 'হ্যাঁ। মুখে বলেই জিনিস যোগ করা যায়, আর অ্যাপ জিনিস, টাকার অঙ্ক আর নতুন অর্ডার বলে শোনায়।',
      hi: 'हाँ। बोलकर सामान जोड़ सकते हैं, और ऐप सामान, रकम और नए ऑर्डर बोलकर सुनाता है।',
    },
  },
  {
    q: {
      en: 'What happens if I stop paying?',
      bn: 'টাকা দেওয়া বন্ধ করলে কী হবে?',
      hi: 'भुगतान बंद करने पर क्या होगा?',
    },
    a: {
      en: `You are reminded before your plan ends. Your store keeps taking orders for ${AUTO_PAUSE_DAYS} days, then pauses until you pay. Your data is never deleted.`,
      bn: `প্ল্যান শেষের আগেই মনে করিয়ে দেওয়া হয়। দোকান আরও ${AUTO_PAUSE_DAYS} দিন অর্ডার নেয়, তারপর টাকা দেওয়া পর্যন্ত বন্ধ থাকে। আপনার তথ্য কখনও মোছা হয় না।`,
      hi: `प्लान खत्म होने से पहले याद दिलाया जाता है। दुकान ${AUTO_PAUSE_DAYS} दिन और ऑर्डर लेती है, फिर भुगतान तक रुकी रहती है। आपका डेटा कभी मिटाया नहीं जाता।`,
    },
  },
  {
    q: {
      en: 'Is my shop’s data safe, and is it mine?',
      bn: 'দোকানের তথ্য কি নিরাপদ, আর তা কি আমারই?',
      hi: 'क्या दुकान का डेटा सुरक्षित है, और क्या वह मेरा है?',
    },
    a: {
      en: 'Yes. Your products, customers, khata and sales belong to your shop, and you can export the khata as PDF or CSV at any time.',
      bn: 'হ্যাঁ। আপনার জিনিস, গ্রাহক, খাতা আর বিক্রি — সবই আপনার দোকানের, আর খাতা যে কোনও সময় PDF বা CSV-তে নিয়ে নিতে পারেন।',
      hi: 'हाँ। आपका सामान, ग्राहक, खाता और बिक्री — सब आपकी दुकान का है, और खाता कभी भी PDF या CSV में निकाल सकते हैं।',
    },
  },
];

/* ------------------------------------------------------------------ */
/* Plans                                                              */
/* ------------------------------------------------------------------ */

/** One plan, so one line — for any kind of shop, of any size. */
const PLAN_TAGLINE: Words = {
  en: 'For any kind of shop, of any size',
  bn: 'যে কোনও ধরনের, যে কোনও মাপের দোকানের জন্য',
  hi: 'किसी भी तरह की, किसी भी आकार की दुकान के लिए',
};

export function planTagline(_plan: Plan): Words {
  return PLAN_TAGLINE;
}

/** What the one plan includes, in the reader's language. */
export const PLAN_INCLUDES: Words[] = [
  { en: 'Your own online store and QR code', bn: 'নিজের অনলাইন দোকান আর QR কোড', hi: 'अपनी ऑनलाइन दुकान और QR कोड' },
  { en: 'Unlimited orders, with a loud alert for each', bn: 'যত খুশি অর্ডার, প্রতিটায় জোরে আওয়াজ', hi: 'असीमित ऑर्डर, हर एक पर तेज़ आवाज़' },
  { en: 'Counter billing and bills on WhatsApp', bn: 'কাউন্টারে বিল আর হোয়াটসঅ্যাপে বিল', hi: 'काउंटर बिलिंग और व्हाट्सएप पर बिल' },
  { en: 'Digital khata with payment reminders', bn: 'তাগাদা সহ ডিজিটাল খাতা', hi: 'भुगतान की याद के साथ डिजिटल खाता' },
  { en: 'Stock, restock list and daily takings', bn: 'স্টক, মাল তোলার তালিকা আর দিনের হিসাব', hi: 'स्टॉक, माल की लिस्ट और दिन का हिसाब' },
  { en: 'English, Bengali and Hindi, with voice', bn: 'ইংরেজি, বাংলা আর হিন্দি, মুখে বলার সুবিধা সমেত', hi: 'अंग्रेज़ी, बांग्ला और हिंदी, बोलकर चलाने की सुविधा के साथ' },
];

/** "300 products", or the unlimited plan's word for it. */
export function planItemsLine(plan: Plan): Words {
  if (PLAN_SPECS[plan].unlimited) {
    return { en: 'Unlimited products', bn: 'যত খুশি জিনিস', hi: 'असीमित सामान' };
  }
  const n = planItems(plan);
  return { en: `Up to ${n} products`, bn: `${n}টি পর্যন্ত জিনিস`, hi: `${n} तक सामान` };
}

/** "₹X a year", and what paying yearly saves, in the reader's language. */
export function yearLine(year: string, saving: string): { price: Words; save: Words } {
  return {
    price: { en: `₹${year} a year`, bn: `বছরে ₹${year}`, hi: `साल का ₹${year}` },
    save: {
      en: ` — save ₹${saving}`,
      bn: ` — ₹${saving} সাশ্রয়`,
      hi: ` — ₹${saving} की बचत`,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Everything else, top to bottom                                     */
/* ------------------------------------------------------------------ */

export const LANDING = {
  nav: {
    features: { en: 'Features', bn: 'সুবিধা', hi: 'सुविधाएँ' },
    videos: { en: 'Videos', bn: 'ভিডিও', hi: 'वीडियो' },
    how: { en: 'How it works', bn: 'কীভাবে শুরু', hi: 'कैसे शुरू करें' },
    plans: { en: 'Pricing', bn: 'দাম', hi: 'कीमत' },
    faq: { en: 'FAQ', bn: 'প্রশ্ন', hi: 'सवाल' },
    businesses: { en: 'Shops', bn: 'দোকান', hi: 'दुकानें' },
    /** What a screen reader calls the list of section links. */
    label: { en: 'Sections of this page', bn: 'এই পাতার অংশগুলো', hi: 'इस पेज के हिस्से' },
  },
  adminSignIn: { en: 'Sign in', bn: 'লগইন', hi: 'लॉगिन' },
  getYourShop: { en: 'Start free trial', bn: 'বিনামূল্যে শুরু করুন', hi: 'मुफ़्त शुरू करें' },
  prices: { en: 'Pricing', bn: 'দাম', hi: 'कीमत' },
  openMenu: { en: 'Open menu', bn: 'মেনু খুলুন', hi: 'मेनू खोलें' },
  closeMenu: { en: 'Close menu', bn: 'মেনু বন্ধ করুন', hi: 'मेनू बंद करें' },
  backToTop: { en: 'Top', bn: 'উপরে', hi: 'ऊपर' },
  language: { en: 'Language', bn: 'ভাষা', hi: 'भाषा' },

  hero: {
    eyebrow: {
      en: 'Shop management app for every local business',
      bn: 'প্রতিটা স্থানীয় ব্যবসার জন্য শপ ম্যানেজমেন্ট অ্যাপ',
      hi: 'हर लोकल व्यापार के लिए शॉप मैनेजमेंट ऐप',
    },
    headline: {
      en: 'Take the daily orders ahead. Clear the counter crowd fast.',
      bn: 'রোজের অর্ডার আগেই নিন। কাউন্টারের ভিড় সামলান দ্রুত।',
      hi: 'रोज़ के ऑर्डर पहले ही लीजिए। काउंटर की भीड़ जल्दी निपटाइए।',
    },
    lead: {
      en: 'Regular customers send their daily and bulk orders through your QR code, so they are packed before anyone arrives. At the counter, bill each customer in a few taps and keep the queue moving. Khata, stock and bills on WhatsApp are included — and customers pay you directly, with no commission.',
      bn: 'নিয়মিত খদ্দেররা আপনার QR কোডে রোজের আর বড় অর্ডার পাঠান, তাই কেউ আসার আগেই মাল গোছানো থাকে। কাউন্টারে কয়েক চাপে প্রত্যেকের বিল করুন, লাইন এগিয়ে চলুক। খাতা, স্টক আর হোয়াটসঅ্যাপে বিল — সব আছে। গ্রাহক টাকা দেন সরাসরি আপনাকে, কোনও কমিশন নেই।',
      hi: 'नियमित ग्राहक आपके QR कोड से रोज़ के और थोक ऑर्डर भेजते हैं, तो किसी के आने से पहले सामान पैक रहता है। काउंटर पर कुछ टैप में हर ग्राहक का बिल बनाइए, लाइन चलती रहे। खाता, स्टॉक और व्हाट्सएप पर बिल — सब शामिल है। ग्राहक सीधे आपको भुगतान करते हैं, कोई कमीशन नहीं।',
    },
    watch: { en: 'Watch the videos', bn: 'ভিডিও দেখুন', hi: 'वीडियो देखें' },
    checks: [
      {
        en: `${TRIAL_DAYS}-day free trial`,
        bn: `${TRIAL_DAYS} দিন বিনামূল্যে`,
        hi: `${TRIAL_DAYS} दिन मुफ़्त`,
      },
      { en: 'Zero commission', bn: 'শূন্য কমিশন', hi: 'ज़ीरो कमीशन' },
      { en: 'No app to install', bn: 'অ্যাপ ইনস্টল নয়', hi: 'ऐप इंस्टॉल नहीं' },
      { en: 'Setup help included', bn: 'চালু করতে সাহায্য', hi: 'सेटअप में मदद' },
    ] satisfies Words[],
  },

  stats: [
    {
      accent: true,
      value: { en: '0%', bn: '0%', hi: '0%' },
      label: { en: 'Commission on orders', bn: 'অর্ডারে কমিশন', hi: 'ऑर्डर पर कमीशन' },
    },
    {
      accent: false,
      value: { en: `${READY_ITEMS}+`, bn: `${READY_ITEMS}+`, hi: `${READY_ITEMS}+` },
      label: {
        en: 'Ready-made items, free for every shop',
        bn: 'তৈরি জিনিস, প্রতিটা দোকানের জন্য বিনামূল্যে',
        hi: 'तैयार सामान, हर दुकान के लिए मुफ़्त',
      },
    },
    {
      accent: false,
      value: { en: '3', bn: '3', hi: '3' },
      label: { en: 'Languages: English, Bengali, Hindi', bn: 'ভাষা: ইংরেজি, বাংলা, হিন্দি', hi: 'भाषाएँ: अंग्रेज़ी, बांग्ला, हिंदी' },
    },
    {
      accent: false,
      value: { en: `${TRIAL_DAYS} days`, bn: `${TRIAL_DAYS} দিন`, hi: `${TRIAL_DAYS} दिन` },
      label: { en: 'Free trial, no advance payment', bn: 'বিনামূল্যে, আগাম টাকা নয়', hi: 'मुफ़्त, कोई एडवांस नहीं' },
    },
  ],

  features: {
    eyebrow: { en: 'Features', bn: 'সুবিধা', hi: 'सुविधाएँ' },
    title: {
      en: 'Everything your shop needs, in one app',
      bn: 'দোকানের যা দরকার, সব এক অ্যাপে',
      hi: 'दुकान की हर ज़रूरत, एक ही ऐप में',
    },
    lead: {
      en: 'One plan with every feature and unlimited products.',
      bn: 'একটাই প্ল্যান — সব সুবিধা আর যত খুশি জিনিস।',
      hi: 'एक ही प्लान — हर सुविधा और असीमित सामान।',
    },
  },

  businesses: {
    eyebrow: { en: 'For every kind of shop', bn: 'সব ধরনের দোকানের জন্য', hi: 'हर तरह की दुकान के लिए' },
    title: {
      en: 'Built for your kind of business',
      bn: 'আপনার ধরনের ব্যবসার জন্য তৈরি',
      hi: 'आपके तरह के व्यापार के लिए बना',
    },
    lead: {
      en: 'Each kind of shop gets its own ready-made item list, units and screens. Pick yours to see how it works.',
      bn: 'প্রতিটা ধরনের দোকান পায় নিজের তৈরি জিনিসের তালিকা, মাপ আর স্ক্রিন। আপনারটা বেছে দেখুন কীভাবে কাজ করে।',
      hi: 'हर तरह की दुकान को मिलती है अपनी तैयार सामान की लिस्ट, नाप और स्क्रीन। अपनी चुनिए और देखिए कैसे काम करता है।',
    },
    see: { en: 'See how it works', bn: 'কীভাবে কাজ করে দেখুন', hi: 'देखिए कैसे काम करता है' },
  },

  /** The page for one kind of business, at `/<slug>`. */
  business: {
    back: { en: 'All kinds of shop', bn: 'সব ধরনের দোকান', hi: 'सभी तरह की दुकानें' },
    /** The page's own links in the top bar — short, so the bar fits. */
    navItems: { en: 'Items', bn: 'জিনিস', hi: 'सामान' },
    navScreens: { en: 'Screens', bn: 'স্ক্রিন', hi: 'स्क्रीन' },
    readyTitle: {
      en: 'Ready-made items for your shop',
      bn: 'আপনার দোকানের জন্য তৈরি জিনিস',
      hi: 'आपकी दुकान के लिए तैयार सामान',
    },
    readyLead: {
      en: 'Tick what you sell and correct the prices. Every name is already in English, Bengali and Hindi.',
      bn: 'যা বিক্রি করেন তাতে টিক দিন আর দাম ঠিক করুন। প্রতিটা নাম আগে থেকেই ইংরেজি, বাংলা আর হিন্দিতে।',
      hi: 'जो बेचते हैं उस पर टिक कीजिए और दाम ठीक कीजिए। हर नाम पहले से अंग्रेज़ी, बांग्ला और हिंदी में है।',
    },
    readyCount: {
      en: 'items ready to add, free',
      bn: 'টি জিনিস যোগ করার জন্য তৈরি, বিনামূল্যে',
      hi: 'सामान जोड़ने के लिए तैयार, मुफ़्त',
    },
    screensTitle: {
      en: 'See it in a real shop',
      bn: 'আসল দোকানে দেখুন',
      hi: 'असली दुकान में देखिए',
    },
    screensLead: {
      en: 'Screens from our demonstration shop. Open it yourself and try ordering.',
      bn: 'আমাদের ডেমো দোকানের স্ক্রিন। নিজে খুলে অর্ডার দিয়ে দেখুন।',
      hi: 'हमारी डेमो दुकान की स्क्रीन। खुद खोलकर ऑर्डर करके देखिए।',
    },
    screensLeadNoDemo: {
      en: 'Real screens from Halkhata, set up for this kind of shop.',
      bn: 'Halkhata-র আসল স্ক্রিন, এই ধরনের দোকানের জন্য সাজানো।',
      hi: 'Halkhata की असली स्क्रीन, इस तरह की दुकान के लिए तैयार।',
    },
    openDemo: { en: 'Open the demo shop', bn: 'ডেমো দোকান খুলুন', hi: 'डेमो दुकान खोलिए' },
    screens: {
      storefront: { en: 'What your customers see', bn: 'গ্রাহক যা দেখেন', hi: 'ग्राहक क्या देखते हैं' },
      products: { en: 'Your item list', bn: 'আপনার জিনিসের তালিকা', hi: 'आपकी सामान की सूची' },
      billing: { en: 'Counter billing', bn: 'কাউন্টারে বিল', hi: 'काउंटर बिलिंग' },
    },
    alsoTitle: { en: 'Everything else is included', bn: 'বাকি সবকিছুও আছে', hi: 'बाकी सब कुछ भी शामिल है' },
  },

  more: {
    eyebrow: { en: 'And more', bn: 'আরও আছে', hi: 'और भी' },
    title: {
      en: 'Thoughtful details that save time every day',
      bn: 'ছোট ছোট সুবিধা, যা রোজ সময় বাঁচায়',
      hi: 'छोटी-छोटी सुविधाएँ, जो रोज़ समय बचाती हैं',
    },
  },

  videos: {
    eyebrow: { en: 'Video guides', bn: 'ভিডিও গাইড', hi: 'वीडियो गाइड' },
    title: {
      en: 'See every feature in action',
      bn: 'প্রতিটা সুবিধা চোখে দেখুন',
      hi: 'हर सुविधा को चलते हुए देखिए',
    },
    lead: {
      en: 'Short videos that show exactly how each part of the app works.',
      bn: 'ছোট ছোট ভিডিওতে দেখুন অ্যাপের প্রতিটা অংশ কীভাবে কাজ করে।',
      hi: 'छोटे वीडियो में देखिए कि ऐप का हर हिस्सा कैसे काम करता है।',
    },
  },

  how: {
    eyebrow: { en: 'How it works', bn: 'কীভাবে শুরু', hi: 'कैसे शुरू करें' },
    title: {
      en: 'Get started in four simple steps',
      bn: 'চারটি সহজ ধাপে শুরু করুন',
      hi: 'चार आसान कदमों में शुरू करें',
    },
    lead: {
      en: 'No forms and no training. We set everything up with you.',
      bn: 'কোনও ফর্ম নেই, কোনও ট্রেনিং নেই। আমরা আপনার সঙ্গে থেকে সব চালু করি।',
      hi: 'न कोई फ़ॉर्म, न कोई ट्रेनिंग। हम आपके साथ मिलकर सब शुरू करते हैं।',
    },
  },

  trust: {
    eyebrow: { en: 'Safe and simple', bn: 'নিরাপদ আর সহজ', hi: 'सुरक्षित और आसान' },
    title: {
      en: 'Your shop, your customers, your money',
      bn: 'আপনার দোকান, আপনার গ্রাহক, আপনার টাকা',
      hi: 'आपकी दुकान, आपके ग्राहक, आपका पैसा',
    },
  },

  plans: {
    eyebrow: { en: 'Pricing', bn: 'দাম', hi: 'कीमत' },
    title: {
      en: 'Simple monthly pricing. Zero commission.',
      bn: 'মাসে একটাই দাম। কোনও কমিশন নেই।',
      hi: 'महीने का एक ही दाम। कोई कमीशन नहीं।',
    },
    lead: {
      en: `One plan with everything. Start with a free ${TRIAL_DAYS}-day trial — no advance payment.`,
      bn: `একটাই প্ল্যান, সব কিছু সমেত। ${TRIAL_DAYS} দিন বিনামূল্যে শুরু করুন — আগাম টাকা লাগে না।`,
      hi: `एक ही प्लान, सब कुछ शामिल। ${TRIAL_DAYS} दिन मुफ़्त शुरू कीजिए — कोई एडवांस नहीं।`,
    },
    popular: { en: 'Everything included', bn: 'সব কিছু সমেত', hi: 'सब कुछ शामिल' },
    perMonth: { en: '/month', bn: '/মাস', hi: '/महीना' },
    customTitle: {
      en: 'A small counter?',
      bn: 'ছোট কাউন্টার?',
      hi: 'छोटा काउंटर?',
    },
    customBody: {
      en: 'Selling only a handful of items — a few curries and roti, or just tea? Ask us for a custom price, from ₹99 a month.',
      bn: 'মাত্র কয়েকটা জিনিস বেচেন — কয়েকটা তরকারি আর রুটি, বা শুধু চা? কম দামের জন্য আমাদের বলুন, মাসে ₹৯৯ থেকে।',
      hi: 'सिर्फ़ कुछ ही सामान बेचते हैं — कुछ सब्ज़ियाँ और रोटी, या सिर्फ़ चाय? कम दाम के लिए हमसे कहिए, महीने के ₹99 से।',
    },
    setupLine: {
      en: `+ ${SETUP_PRICE} one-time shop setup: we create your shop, add your items and print your QR code`,
      bn: `+ একবারের ${SETUP_PRICE} দোকান সেটআপ: আমরা দোকান তৈরি করি, জিনিস তুলে দিই আর QR কোড ছাপিয়ে দিই`,
      hi: `+ एक बार का ${SETUP_PRICE} दुकान सेटअप: हम दुकान बनाते हैं, सामान जोड़ते हैं और QR कोड छापते हैं`,
    },
    customCta: { en: 'Ask on WhatsApp', bn: 'হোয়াটসঅ্যাপে জিজ্ঞেস করুন', hi: 'व्हाट्सएप पर पूछिए' },
  },

  faq: {
    eyebrow: { en: 'FAQ', bn: 'প্রশ্ন', hi: 'सवाल' },
    title: {
      en: 'Frequently asked questions',
      bn: 'প্রায়ই যা জানতে চাওয়া হয়',
      hi: 'अक्सर पूछे जाने वाले सवाल',
    },
  },

  cta: {
    title: {
      en: 'Ready to bring your shop online?',
      bn: 'দোকান অনলাইনে আনতে তৈরি?',
      hi: 'दुकान ऑनलाइन लाने के लिए तैयार?',
    },
    body: {
      en: `Start your free ${TRIAL_DAYS}-day trial today. We will set up your store and QR code with you.`,
      bn: `আজই ${TRIAL_DAYS} দিনের বিনামূল্যে ট্রায়াল শুরু করুন। আমরা আপনার সঙ্গে থেকে দোকান আর QR কোড তৈরি করে দেব।`,
      hi: `आज ही ${TRIAL_DAYS} दिन का मुफ़्त ट्रायल शुरू कीजिए। हम आपके साथ मिलकर दुकान और QR कोड तैयार करेंगे।`,
    },
    whatsapp: { en: 'Chat on WhatsApp', bn: 'হোয়াটসঅ্যাপে কথা বলুন', hi: 'व्हाट्सएप पर बात करें' },
  },

  /** The shared footer's words, handed to it only by this page. */
  footer: {
    poweredBy: { en: 'Powered by', bn: 'পরিচালনায়', hi: 'संचालन:' },
    privacy: { en: 'Privacy', bn: 'গোপনীয়তা', hi: 'गोपनीयता' },
    terms: { en: 'Terms', bn: 'শর্তাবলি', hi: 'शर्तें' },
    refund: { en: 'Refunds', bn: 'টাকা ফেরত', hi: 'रिफ़ंड' },
    contact: { en: 'Contact', bn: 'যোগাযোগ', hi: 'संपर्क' },
  },
} as const;
