import { BRAND_NAME } from './brand';
import type { Locale } from './i18n';
import {
  AUTO_PAUSE_DAYS,
  PLAN_SPECS,
  TRIAL_DAYS,
  planItems,
  type Plan,
} from './plans';

/**
 * The words on the public landing page, in English, Bengali and Hindi.
 *
 * Kept out of the page component on purpose: this is the file somebody edits
 * after a week in the field, and they should be able to change a sentence
 * without reading JSX. Every entry has all three languages, so a translation
 * can never quietly go missing — TypeScript refuses the object without it.
 *
 * The Bengali and the Hindi are not translations of the English so much as the
 * same point made the way a shopkeeper would say it. Where they differ, the
 * local one is the one to trust: it is the language the person using this
 * actually thinks in. Plain words, the ones said across a counter — "বাকি",
 * "उधार", "খদ্দের", "ग्राहक" — never the dictionary word nobody uses.
 *
 * THE WHOLE PAGE SWITCHES, NOT ONE SECTION OF IT. It used to be English with
 * two tabbed lists in Bengali, and a reader who pressed বাংলা got two cards
 * changed and a page that otherwise stayed English — the menu, the prices, the
 * questions, the button that says what to do next. Everything a visitor reads
 * is here now, in all three, and `LangTabs` picks one for the whole page.
 *
 * The brand is `BRAND_NAME` in every language, exactly as the owner app does:
 * it is a name printed on a poster, not a word to translate.
 */

/** One piece of copy, in every language the page can be read in. */
export type Words = Record<Locale, string>;

/** One step of getting started, in the order it happens. */
export const STEPS: Words[] = [
  {
    en: 'Call us with your shop’s name, phone number and address. We build the shop and print your QR.',
    bn: 'ফোন করে দোকানের নাম, নম্বর আর ঠিকানা বলুন। আমরা দোকান তৈরি করে QR ছাপিয়ে দিই।',
    hi: 'फ़ोन करके दुकान का नाम, नंबर और पता बताइए। हम दुकान बनाकर QR छाप देते हैं।',
  },
  {
    /**
     * THIS STEP USED TO READ LIKE A SCAM, and it was the one step a new
     * shopkeeper had to trust.
     *
     * "You get a link on WhatsApp. Open it, and your shop app is ready" is,
     * word for word, what every fraud in India sounds like — an unexpected
     * message, a link, and something that installs itself. A shopkeeper who
     * has been warned about exactly that by their bank reads it as a warning,
     * not as an instruction, and the more careful they are the less likely
     * they are to continue.
     *
     * So the link stops being the subject of the sentence. What the shopkeeper
     * is told is the thing that is true and reassuring: it opens in the
     * browser they already have, there is nothing to install, nothing to
     * remember, and the handover happens with a person they have spoken to —
     * to a number they gave us, never out of the blue. See `SAFETY` below,
     * which says in plain words what we will never ask them for.
     */
    en: 'Your shop opens in the phone’s own browser — nothing to install, no password to remember. We set it up with you, on the number you gave us.',
    bn: 'আপনার দোকান ফোনের নিজের ব্রাউজারেই খোলে — কিছু নামাতে হয় না, পাসওয়ার্ড মনে রাখতে হয় না। আপনার দেওয়া নম্বরেই আমরা সঙ্গে থেকে চালু করে দিই।',
    hi: 'आपकी दुकान फ़ोन के अपने ब्राउज़र में ही खुलती है — कुछ इंस्टॉल नहीं करना, कोई पासवर्ड याद नहीं रखना। आपके दिए नंबर पर हम साथ रहकर चालू करवाते हैं।',
  },
  {
    en: 'Add your items by speaking, in your own language. Your phone reads each one back.',
    bn: 'নিজের ভাষায় বলে বলে জিনিস যোগ করুন। ফোন প্রত্যেকটা পড়ে শোনাবে।',
    hi: 'अपनी भाषा में बोलकर सामान जोड़िए। फ़ोन हर एक को पढ़कर सुनाएगा।',
  },
  {
    // The real lifecycle. WhatsApp appears where it actually belongs — telling
    // the customer their order is ready — and not as the channel orders arrive
    // on, which it is not.
    en: 'Customers scan the QR and choose. The order lands in your app and your phone buzzes.',
    bn: 'খদ্দের QR স্ক্যান করে জিনিস বাছবে। অর্ডার আপনার অ্যাপে আসবে আর ফোন বেজে উঠবে।',
    hi: 'ग्राहक QR स्कैन करके सामान चुनता है। ऑर्डर आपके ऐप में आता है और फ़ोन बज उठता है।',
  },
  {
    en: 'Mark it ready, WhatsApp the customer, take the money, and tick it paid. You keep every rupee.',
    bn: 'তৈরি হলে দাগ দিন, খদ্দেরকে হোয়াটসঅ্যাপ করুন, টাকা নিন, পেইড টিক করুন। পুরো টাকাটাই আপনার।',
    hi: 'तैयार होने पर निशान लगाइए, ग्राहक को व्हाट्सएप कीजिए, पैसे लीजिए और “पेड” पर टिक कीजिए। पूरा पैसा आपका।',
  },
];

/**
 * WHAT WE WILL NEVER ASK FOR — said out loud, on the public pages.
 *
 * A shopkeeper being offered a shop app by a company they have not heard of is
 * right to be suspicious, and the honest response to that is not softer
 * marketing but a plain list of the things a fraud would ask for and we do
 * not. It costs nothing to promise, because none of it is anything the product
 * has ever needed: Halkhata never touches the money from an order, so it has
 * no reason to know a PIN, a card or a bank password, ever.
 *
 * KEEP THIS TRUE. If some future feature genuinely needs one of these, the
 * line comes off this list before the feature ships — a promise on a public
 * page that quietly stopped being true is worse than never making it.
 */
export const SAFETY: Words[] = [
  {
    en: 'We never ask for your OTP, UPI PIN, card number or bank password. Nobody from here ever will.',
    bn: 'আমরা কখনও আপনার OTP, UPI পিন, কার্ড নম্বর বা ব্যাঙ্কের পাসওয়ার্ড চাই না। এখান থেকে কেউ কখনও চাইবে না।',
    hi: 'हम आपसे कभी OTP, UPI पिन, कार्ड नंबर या बैंक का पासवर्ड नहीं माँगते। यहाँ से कोई कभी नहीं माँगेगा।',
  },
  {
    en: 'Customers pay you — in cash, or straight into your own UPI. The money never comes to us.',
    bn: 'খদ্দের টাকা দেয় আপনাকেই — নগদে, নয়তো সোজা আপনার নিজের UPI-তে। টাকা আমাদের কাছে আসে না।',
    hi: 'ग्राहक पैसे आपको ही देता है — नकद, या सीधे आपके अपने UPI में। पैसा हमारे पास कभी नहीं आता।',
  },
  {
    en: 'There is nothing to install. Your shop runs in the browser your phone already has.',
    bn: 'কিছু নামাতে হবে না। আপনার ফোনে যে ব্রাউজার আছে, দোকান তাতেই চলে।',
    hi: 'कुछ इंस्टॉल नहीं करना है। आपके फ़ोन में जो ब्राउज़र पहले से है, दुकान उसी में चलती है।',
  },
  {
    en: 'You can stop any month. Your khata and your reports come out as PDF or CSV whenever you want them.',
    bn: 'যে কোনও মাসে বন্ধ করতে পারেন। খাতা আর হিসাব যখন খুশি PDF বা CSV করে নিয়ে নিতে পারেন।',
    hi: 'किसी भी महीने बंद कर सकते हैं। खाता और हिसाब जब चाहें PDF या CSV में निकाल लीजिए।',
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
export type Problem = { problem: Words; answer: Words };

export const PROBLEMS: Problem[] = [
  {
    problem: {
      en: 'The khata is a paper notebook — it gets wet, it gets lost, and only one person can read the handwriting.',
      bn: 'খাতা মানে কাগজের খাতা — ভিজে যায়, হারিয়ে যায়, আর হাতের লেখা একজনই পড়তে পারে।',
      hi: 'खाता मतलब कागज़ की कॉपी — भीग जाती है, खो जाती है, और लिखावट सिर्फ़ एक ही आदमी पढ़ पाता है।',
    },
    answer: {
      en: 'Every customer has a running balance the app keeps for you, and you can send anyone their khata on WhatsApp when they argue about it.',
      bn: 'প্রত্যেক খদ্দেরের হিসাব অ্যাপ নিজেই রাখে, আর কেউ তর্ক করলে তার পুরো খাতা হোয়াটসঅ্যাপে পাঠিয়ে দিতে পারেন।',
      hi: 'हर ग्राहक का हिसाब ऐप खुद रखता है, और कोई बहस करे तो उसका पूरा खाता व्हाट्सएप पर भेज सकते हैं।',
    },
  },
  {
    problem: {
      en: 'You cannot say how much the shop is owed today without adding up every page.',
      bn: 'আজ দোকানের কত টাকা বাকি আছে, সেটা প্রত্যেকটা পাতা যোগ না করে বলা যায় না।',
      hi: 'आज दुकान का कितना उधार बाकी है, यह हर पन्ना जोड़े बिना नहीं बता सकते।',
    },
    answer: {
      en: 'One number at the top of the khata screen: total outstanding, and who has been owing the longest.',
      bn: 'খাতার স্ক্রিনে উপরেই একটা সংখ্যা — মোট কত বাকি, আর কে সবচেয়ে বেশি দিন ধরে ফেলে রেখেছে।',
      hi: 'खाते की स्क्रीन पर सबसे ऊपर एक ही नंबर — कुल कितना बाकी, और किसका उधार सबसे पुराना है।',
    },
  },
  {
    problem: {
      en: 'The price list lives in your head, so the price changes with whoever is standing at the counter.',
      bn: 'দামের তালিকা আপনার মাথায় — তাই কে দাঁড়িয়ে আছে তার উপর দাম বদলে যায়।',
      hi: 'दाम की लिस्ट आपके दिमाग़ में है — इसलिए काउंटर पर कौन खड़ा है, उसके हिसाब से दाम बदल जाता है।',
    },
    answer: {
      en: 'Say the item and the price once. It is on your QR page the same second, the same for everybody.',
      bn: 'একবার জিনিসের নাম আর দাম বলুন। সঙ্গে সঙ্গে আপনার QR পাতায় উঠে যাবে — সবার জন্য একই দাম।',
      hi: 'एक बार सामान का नाम और दाम बोलिए। उसी पल आपके QR पेज पर आ जाएगा — सबके लिए एक ही दाम।',
    },
  },
  {
    problem: {
      en: 'Orders come as phone calls you miss while serving someone else, and the customer goes to the next shop.',
      bn: 'অর্ডার আসে ফোনে — অন্য খদ্দেরকে দিতে দিতে ফোন ধরা হয় না, আর সে পাশের দোকানে চলে যায়।',
      hi: 'ऑर्डर फ़ोन पर आते हैं — दूसरे ग्राहक को सामान देते-देते फ़ोन छूट जाता है, और ग्राहक बगल की दुकान पर चला जाता है।',
    },
    answer: {
      en: 'The order sits in your app until you look at it, and your phone buzzes when it arrives. Nothing is lost because you were busy.',
      bn: 'অর্ডার আপনার অ্যাপে জমা থাকে যতক্ষণ না দেখছেন, আর এলেই ফোন বেজে ওঠে। ব্যস্ত ছিলেন বলে কিছু হারায় না।',
      hi: 'जब तक आप देख न लें, ऑर्डर आपके ऐप में रुका रहता है, और आते ही फ़ोन बजता है। व्यस्त थे, इसलिए कुछ नहीं छूटता।',
    },
  },
  {
    problem: {
      en: 'You have served the same families for years and do not have one phone number written down.',
      bn: 'বছরের পর বছর একই পরিবারকে জিনিস দিচ্ছেন, অথচ একটা ফোন নম্বরও লেখা নেই।',
      hi: 'सालों से उन्हीं परिवारों को सामान दे रहे हैं, पर एक भी फ़ोन नंबर लिखा हुआ नहीं है।',
    },
    answer: {
      en: 'Every customer who orders leaves their name and number with you — your list, not a platform’s.',
      bn: 'যে-ই অর্ডার করে, তার নাম আর নম্বর আপনার কাছে থেকে যায় — আপনার তালিকা, কোনও কোম্পানির নয়।',
      hi: 'जो भी ऑर्डर करता है, उसका नाम और नंबर आपके पास रह जाता है — आपकी लिस्ट, किसी कंपनी की नहीं।',
    },
  },
  {
    problem: {
      en: 'You find out something has run out when a customer asks for it.',
      bn: 'কোন জিনিস শেষ হয়ে গেছে, সেটা জানা যায় খদ্দের চাইলে।',
      hi: 'कौन-सा सामान खत्म हो गया, यह तब पता चलता है जब ग्राहक माँगता है।',
    },
    answer: {
      en: 'Mark it out of stock in one tap and it comes off your shop page, so nobody orders what you cannot give.',
      bn: 'এক ট্যাপে “শেষ” করে দিন, দোকানের পাতা থেকে উঠে যাবে — যা দিতে পারবেন না, কেউ তার অর্ডার করবে না।',
      hi: 'एक टैप में “खत्म” कर दीजिए, दुकान के पेज से हट जाएगा — जो दे नहीं सकते, उसका कोई ऑर्डर नहीं करेगा।',
    },
  },
  {
    problem: {
      en: 'The apps that offer to help take a cut of every order, and then own your customers.',
      bn: 'যেসব অ্যাপ সাহায্য করতে আসে, তারা প্রত্যেক অর্ডার থেকে কমিশন কাটে — তারপর খদ্দেরও তাদের হয়ে যায়।',
      hi: 'जो ऐप मदद करने आते हैं, वे हर ऑर्डर से कमीशन काटते हैं — और फिर ग्राहक भी उन्हीं के हो जाते हैं।',
    },
    answer: {
      en: `${BRAND_NAME} charges one price a month for your shop and takes nothing from an order, however many you take.`,
      bn: `${BRAND_NAME} মাসে একটাই টাকা নেয় দোকানের জন্য, অর্ডার থেকে এক পয়সাও নয় — যত অর্ডারই আসুক।`,
      hi: `${BRAND_NAME} दुकान के लिए महीने में एक ही दाम लेता है, ऑर्डर से एक पैसा भी नहीं — चाहे जितने ऑर्डर आएँ।`,
    },
  },
];

/**
 * What the product actually does, written as the job rather than the feature.
 *
 * NOTHING ASPIRATIONAL IS ALLOWED IN HERE. This page is the promise a QR poster
 * goes up next to, and every line below is a thing a shop can do this
 * afternoon. When something is built, it earns a card; until then it does not
 * get a sentence, however good the sentence would be.
 *
 * The page draws the icon; this carries only the words, keyed by `id` so the
 * two stay matched when a card is added or moved.
 */
export type FeatureId =
  | 'speak'
  | 'catalogue'
  | 'qr'
  | 'orders'
  | 'khata'
  | 'till'
  | 'units'
  | 'stock'
  | 'reports'
  | 'bill'
  | 'simple'
  | 'customers';

export const FEATURES: { id: FeatureId; title: Words; body: Words }[] = [
  {
    id: 'speak',
    title: { en: 'List by speaking', bn: 'বলে বলে তালিকা', hi: 'बोलकर लिस्ट बनाइए' },
    body: {
      en: 'Say “চাল ১ কেজি ১০০” and the item is on your shop page with its price. Bangla, Hindi or English, in the shop, with the fan on. Nothing to type.',
      bn: 'বলুন “চাল ১ কেজি ১০০” — জিনিসটা দামসহ আপনার দোকানের পাতায় উঠে যাবে। বাংলা, হিন্দি বা ইংরেজিতে, দোকানে পাখা চললেও। কিছু টাইপ করতে হবে না।',
      hi: 'बोलिए “चावल 1 किलो 100” — सामान दाम के साथ आपकी दुकान के पेज पर आ जाएगा। हिंदी, बांग्ला या अंग्रेज़ी में, दुकान में पंखा चलते हुए भी। कुछ टाइप नहीं करना।',
    },
  },
  {
    id: 'catalogue',
    title: {
      en: 'Five hundred items, already written',
      bn: 'চেনা জিনিস এক ট্যাপে',
      hi: 'जाना-पहचाना सामान, एक टैप में',
    },
    body: {
      en: 'The usual things a kirana carries come ready — named in three languages, with pack sizes and a starting price. Tick what you sell and correct the prices as you trade.',
      bn: 'মুদির দোকানের চেনা জিনিসগুলো তৈরি করা আছে — তিন ভাষায় নাম, প্যাকের মাপ আর একটা শুরুর দাম সমেত। যা বেচেন তাতে টিক দিন, বেচতে বেচতে দাম ঠিক করে নিন।',
      hi: 'किराना दुकान का आम सामान पहले से तैयार है — तीन भाषाओं में नाम, पैक का साइज़ और शुरुआती दाम के साथ। जो बेचते हैं उस पर टिक कीजिए, और बेचते-बेचते दाम ठीक कर लीजिए।',
    },
  },
  {
    id: 'qr',
    title: { en: 'A QR at your counter', bn: 'কাউন্টারে একটা QR', hi: 'काउंटर पर एक QR' },
    body: {
      en: 'Customers scan and see your shelf, in their own language. No app to install, no account to make, no login for anybody.',
      bn: 'খদ্দের স্ক্যান করলেই আপনার তাক দেখতে পায়, নিজের ভাষায়। কোনও অ্যাপ নামাতে হয় না, অ্যাকাউন্ট খুলতে হয় না, কারও লগইন লাগে না।',
      hi: 'ग्राहक स्कैन करते ही आपकी दुकान का सामान देख लेता है, अपनी भाषा में। न कोई ऐप इंस्टॉल, न अकाउंट, न किसी का लॉगिन।',
    },
  },
  {
    id: 'orders',
    title: {
      en: 'Orders land in your app',
      bn: 'অর্ডার সোজা আপনার অ্যাপে',
      hi: 'ऑर्डर सीधे आपके ऐप में',
    },
    body: {
      en: 'The phone buzzes and a bell counts the new ones from every screen. The order waits until you look at it — nothing is lost because you were serving someone.',
      bn: 'ফোন বেজে ওঠে, আর প্রতিটা স্ক্রিনে একটা ঘণ্টি নতুন অর্ডার গুনে রাখে। আপনি না দেখা পর্যন্ত অর্ডার অপেক্ষা করে — অন্য খদ্দেরকে দিচ্ছিলেন বলে কিছু হারায় না।',
      hi: 'फ़ोन बजता है, और हर स्क्रीन पर एक घंटी नए ऑर्डर गिनती रहती है। जब तक आप देख न लें, ऑर्डर वहीं रुका रहता है — किसी और ग्राहक को सामान दे रहे थे, तो भी कुछ नहीं छूटता।',
    },
  },
  {
    id: 'khata',
    title: { en: 'The udhaar khata', bn: 'বাকির খাতা', hi: 'उधार खाता' },
    body: {
      en: 'Every customer has a running balance the app keeps. One number says what the whole para owes you, and who has owed it longest.',
      bn: 'প্রত্যেক খদ্দেরের চলতি হিসাব অ্যাপ নিজেই রাখে। একটা সংখ্যাতেই দেখে নিন পুরো পাড়ার কাছে কত পাওনা, আর কে সবচেয়ে বেশি দিন ধরে বাকি রেখেছে।',
      hi: 'हर ग्राहक का चलता हिसाब ऐप खुद रखता है। एक ही नंबर बताता है कि पूरे मोहल्ले पर कितना उधार है, और किसका सबसे पुराना है।',
    },
  },
  {
    id: 'till',
    title: {
      en: 'Counter sales and the day’s cash',
      bn: 'দোকানের বিক্রি আর দিনের হিসাব',
      hi: 'काउंटर की बिक्री और दिन का कैश',
    },
    body: {
      en: 'The walk-in who buys two things and pays cash belongs in the same day’s total. Ring it up at the till and close the drawer at night.',
      bn: 'যে খদ্দের দোকানে এসে দুটো জিনিস কিনে নগদ দিয়ে গেল, সেটাও দিনের হিসাবে ঢোকা দরকার। কাউন্টারেই বিক্রি তুলে নিন, রাতে ক্যাশ মিলিয়ে বন্ধ করুন।',
      hi: 'जो ग्राहक दुकान पर आकर दो चीज़ें लेकर नकद दे गया, वह भी उसी दिन के हिसाब में जुड़ना चाहिए। काउंटर पर ही बिक्री चढ़ाइए, और रात को गल्ला मिलाकर बंद कीजिए।',
    },
  },
  {
    /**
     * THIS CARD USED TO SAY "SELL BY WEIGHT, NOT BY PACKET", WHICH WAS WRONG
     * ABOUT THE PRODUCT AND ABOUT THE SHOP.
     *
     * A kirana sells biscuits by the packet, matches by the box, oil by the
     * litre, greens by the bundle and rice by the kilo, and no shopkeeper
     * reading "not by packet" would recognise their own counter in it. What
     * the product actually does is take the unit the shop already uses — and
     * then let the things that CAN be divided be divided: see `isLooseUnit`
     * and `sellsAnyAmount`, where mass and volume split and counted goods do
     * not, because nothing can keep the 700 g left over from a packet.
     */
    id: 'units',
    title: {
      en: 'Sold the way you already sell it',
      bn: 'যেভাবে বেচেন, সেভাবেই',
      hi: 'जैसे बेचते हैं, वैसे ही',
    },
    body: {
      en: 'Kilo, gram, litre, ml, piece, packet, bottle or bundle — the pack size is whatever you use, and you can type one we have not thought of. What you weigh or pour can be asked for in any amount: posto priced by the kilo, sold as 50 g. What you count — a packet, a bottle, a bundle — sells whole.',
      bn: 'কেজি, গ্রাম, লিটার, মিলি, পিস, প্যাকেট, বোতল বা আঁটি — প্যাকের মাপ আপনি যেটা ব্যবহার করেন সেটাই, আর আমাদের তালিকায় না থাকলে নিজেই লিখে নিন। যা ওজন করে বা মেপে দেন, তা যে কোনও পরিমাণে চাওয়া যায়: পোস্ত কেজির দরে, বিক্রি ৫০ গ্রাম। যা গুনে দেন — প্যাকেট, বোতল, আঁটি — তা গোটাই বিক্রি হয়।',
      hi: 'किलो, ग्राम, लीटर, ml, पीस, पैकेट, बोतल या गड्डी — पैक का साइज़ वही जो आप इस्तेमाल करते हैं, और हमारी लिस्ट में न हो तो खुद लिख लीजिए। जो तौलकर या नापकर देते हैं, वह किसी भी मात्रा में माँगा जा सकता है: खसखस किलो के भाव से, बिके 50 ग्राम। जो गिनकर देते हैं — पैकेट, बोतल, गड्डी — वह पूरा ही बिकता है।',
    },
  },
  {
    id: 'stock',
    title: {
      en: 'What is finished, comes off',
      bn: 'শেষ হলে পাতা থেকে উঠে যায়',
      hi: 'खत्म हुआ, तो पेज से हटा',
    },
    body: {
      en: 'One tap marks an item out of stock and customers stop being offered it. Keep counts if you want them, or leave it alone.',
      bn: 'এক ট্যাপে জিনিসটা “শেষ” করে দিন, খদ্দেররা আর সেটা দেখতে পাবে না। চাইলে স্টক গুনে রাখুন, না চাইলে থাক।',
      hi: 'एक टैप में सामान को “खत्म” कीजिए, ग्राहकों को वह दिखना बंद हो जाएगा। चाहें तो स्टॉक गिनकर रखिए, नहीं तो रहने दीजिए।',
    },
  },
  {
    id: 'reports',
    title: { en: 'Reports you can read', bn: 'বোঝার মতো হিসাব', hi: 'समझ में आने वाला हिसाब' },
    body: {
      en: 'What sold, what it earned, which para it went to, and what the festival week did. Enough to order stock with, not a dashboard to study.',
      bn: 'কী বিক্রি হল, কত আয় হল, কোন পাড়ায় গেল, আর পুজোর সপ্তাহে কেমন গেল। মাল তোলার জন্য যতটুকু দরকার — বসে বসে বুঝতে হবে এমন ড্যাশবোর্ড নয়।',
      hi: 'क्या बिका, कितनी कमाई हुई, किस मोहल्ले में गया, और त्योहार वाले हफ़्ते में कैसा रहा। माल मँगाने के लिए जितना चाहिए उतना — बैठकर समझना पड़े, ऐसा डैशबोर्ड नहीं।',
    },
  },
  {
    id: 'bill',
    title: { en: 'A bill on WhatsApp', bn: 'হোয়াটসঅ্যাপে বিল', hi: 'व्हाट्सएप पर बिल' },
    body: {
      en: 'Send a customer their bill or their whole khata as a PDF, and the delivery round to whoever is carrying it — from the phone already in your hand.',
      bn: 'খদ্দেরকে তার বিল বা পুরো খাতা PDF করে পাঠান, আর ডেলিভারির তালিকা পাঠান যে মাল নিয়ে যাচ্ছে তাকে — হাতের ফোন থেকেই।',
      hi: 'ग्राहक को उसका बिल या पूरा खाता PDF में भेजिए, और डिलीवरी की लिस्ट उसे जो सामान पहुँचाने जा रहा है — हाथ के फ़ोन से ही।',
    },
  },
  {
    id: 'simple',
    title: { en: 'Simple mode', bn: 'সহজ মোড', hi: 'आसान मोड' },
    body: {
      en: 'For an owner who wants the till, the khata and nothing else on the screen. Everything still works; it is just not in the way.',
      bn: 'যে মালিক স্ক্রিনে শুধু বিক্রি আর খাতা চান, আর কিছু না — তাঁর জন্য। বাকি সবই কাজ করে, শুধু চোখের সামনে থাকে না।',
      hi: 'उस मालिक के लिए जो स्क्रीन पर सिर्फ़ बिक्री और खाता चाहता है, और कुछ नहीं। बाकी सब चलता रहता है, बस सामने नहीं आता।',
    },
  },
  {
    id: 'customers',
    title: {
      en: 'Your customers stay yours',
      bn: 'খদ্দের আপনারই থাকে',
      hi: 'ग्राहक आपके ही रहते हैं',
    },
    body: {
      en: 'Every order leaves a name and a number on your list, not a platform’s. No commission is taken from any order, however many you take.',
      bn: 'প্রতিটা অর্ডারে একটা নাম আর নম্বর আপনার তালিকায় জমা হয়, কোনও কোম্পানির তালিকায় নয়। কোনও অর্ডার থেকে কমিশন কাটা হয় না, যত অর্ডারই আসুক।',
      hi: 'हर ऑर्डर से एक नाम और नंबर आपकी लिस्ट में जुड़ता है, किसी कंपनी की लिस्ट में नहीं। किसी ऑर्डर से कमीशन नहीं कटता, चाहे जितने ऑर्डर आएँ।',
    },
  },
];

/** The questions a shopkeeper asks before saying yes, in the order they ask them. */
export const FAQ: { q: Words; a: Words }[] = [
  {
    q: {
      en: 'Do my customers need to install anything?',
      bn: 'আমার খদ্দেরদের কি কিছু নামাতে হবে?',
      hi: 'क्या मेरे ग्राहकों को कुछ इंस्टॉल करना होगा?',
    },
    a: {
      en: 'No. They scan the QR with the camera they already have and your shop opens in the browser. No account, no download, no password.',
      bn: 'না। ফোনের ক্যামেরা দিয়ে QR স্ক্যান করলেই ব্রাউজারে আপনার দোকান খুলে যায়। অ্যাকাউন্ট নেই, ডাউনলোড নেই, পাসওয়ার্ড নেই।',
      hi: 'नहीं। फ़ोन के कैमरे से QR स्कैन करते ही आपकी दुकान ब्राउज़र में खुल जाती है। न अकाउंट, न डाउनलोड, न पासवर्ड।',
    },
  },
  {
    q: {
      en: 'Do I need a new phone?',
      bn: 'নতুন ফোন কিনতে হবে?',
      hi: 'क्या नया फ़ोन लेना पड़ेगा?',
    },
    a: {
      en: `No. ${BRAND_NAME} runs in the browser on the phone you have, and you can keep it on your home screen like any other app. There is nothing to get from the Play Store.`,
      bn: `না। ${BRAND_NAME} আপনার এখনকার ফোনের ব্রাউজারেই চলে, আর অন্য অ্যাপের মতো হোম স্ক্রিনে রেখে দিতে পারেন। প্লে স্টোর থেকে কিছু নামাতে হয় না।`,
      hi: `नहीं। ${BRAND_NAME} आपके अभी वाले फ़ोन के ब्राउज़र में चलता है, और बाकी ऐप की तरह होम स्क्रीन पर रख सकते हैं। प्ले स्टोर से कुछ नहीं लेना।`,
    },
  },
  {
    q: {
      en: 'What if I cannot read?',
      bn: 'আমি যদি পড়তে না পারি?',
      hi: 'अगर मैं पढ़ नहीं सकता, तो?',
    },
    a: {
      en: 'You can list items by speaking, and the phone reads each one back to you, amounts and all. The screens an owner uses every day are built to be workable that way.',
      bn: 'বলে বলেই জিনিস তুলতে পারবেন, আর ফোন প্রত্যেকটা পড়ে শোনায় — পরিমাণ আর দাম সমেত। মালিক রোজ যে স্ক্রিনগুলো ব্যবহার করেন, সেগুলো এভাবেই চালানোর মতো করে বানানো।',
      hi: 'बोलकर ही सामान जोड़ सकते हैं, और फ़ोन हर एक को मात्रा और दाम के साथ पढ़कर सुनाता है। मालिक रोज़ जो स्क्रीन इस्तेमाल करता है, वे इसी तरह चलाने लायक बनाई गई हैं।',
    },
  },
  {
    q: {
      en: 'Do you take a cut of my orders?',
      bn: 'আমার অর্ডার থেকে কি আপনারা ভাগ নেন?',
      hi: 'क्या आप मेरे ऑर्डर में से हिस्सा लेते हैं?',
    },
    a: {
      en: `Never. One price a month for the shop, and nothing from an order. ${BRAND_NAME} does not handle your money at all — the customer pays you, in cash or straight into your own UPI.`,
      bn: `কখনও না। দোকানের জন্য মাসে একটাই দাম, অর্ডার থেকে কিছু নয়। ${BRAND_NAME} আপনার টাকায় হাতই দেয় না — খদ্দের টাকা দেন আপনাকে, নগদে বা সোজা আপনার নিজের UPI-তে।`,
      hi: `कभी नहीं। दुकान का महीने में एक ही दाम, ऑर्डर से कुछ नहीं। ${BRAND_NAME} आपके पैसे को हाथ ही नहीं लगाता — ग्राहक पैसे आपको देता है, नकद या सीधे आपके अपने UPI में।`,
    },
  },
  {
    q: {
      en: 'What happens if I stop paying?',
      bn: 'টাকা দেওয়া বন্ধ করলে কী হবে?',
      hi: 'पैसे देना बंद कर दूँ, तो क्या होगा?',
    },
    a: {
      en: `Nothing sudden. You are told before the period ends, item editing pauses a week later, and the shop goes on trading for ${AUTO_PAUSE_DAYS} days. After that the page closes to customers — and reopens the moment a payment is recorded. Nothing is ever deleted.`,
      bn: `হঠাৎ কিছু হবে না। মেয়াদ ফুরোনোর আগেই জানিয়ে দেওয়া হয়, তার এক সপ্তাহ পরে জিনিস বদলানো বন্ধ হয়, আর দোকান আরও ${AUTO_PAUSE_DAYS} দিন বেচাকেনা চালিয়ে যায়। তারপর খদ্দেরদের জন্য পাতা বন্ধ হয় — আর টাকা জমা পড়লেই আবার খুলে যায়। কিছুই কখনও মোছা হয় না।`,
      hi: `अचानक कुछ नहीं। अवधि खत्म होने से पहले बता दिया जाता है, उसके एक हफ़्ते बाद सामान बदलना रुकता है, और दुकान ${AUTO_PAUSE_DAYS} दिन तक बिक्री करती रहती है। उसके बाद ग्राहकों के लिए पेज बंद होता है — और पैसे जमा होते ही फिर खुल जाता है। कुछ भी कभी मिटाया नहीं जाता।`,
    },
  },
  {
    q: {
      en: 'Is my shop’s data mine?',
      bn: 'দোকানের সব তথ্য কি আমারই?',
      hi: 'क्या दुकान का डेटा मेरा ही है?',
    },
    a: {
      en: 'Yes. Your items, your customers, your khata and your day’s takings belong to your shop, and the khata and the reports come out as PDF or CSV whenever you want them.',
      bn: 'হ্যাঁ। আপনার জিনিস, আপনার খদ্দের, আপনার খাতা আর দিনের বিক্রি — সব আপনার দোকানের। খাতা আর হিসাব যখন খুশি PDF বা CSV করে নিয়ে নিতে পারেন।',
      hi: 'हाँ। आपका सामान, आपके ग्राहक, आपका खाता और दिन की बिक्री — सब आपकी दुकान का है। खाता और हिसाब जब चाहें PDF या CSV में निकाल सकते हैं।',
    },
  },
];

/**
 * A plan's one-line description, in the reader's language.
 *
 * The English is read off `PLAN_SPECS` rather than retyped — the renew screen
 * shows the same line, and a tagline that lives in two files is one that will
 * be wrong in one of them.
 */
const PLAN_TAGLINES: Record<Plan, Omit<Words, 'en'>> = {
  FREE: {
    bn: 'চায়ের দোকান বা ছোট কাউন্টারের জন্য যথেষ্ট।',
    hi: 'चाय की दुकान या छोटे काउंटर के लिए काफ़ी।',
  },
  STARTER: { bn: 'রোজকার মুদির দোকানের প্ল্যান।', hi: 'रोज़ की किराना दुकान का प्लान।' },
  PRO: { bn: 'ভরা মুদির দোকানের জন্য।', hi: 'पूरी भरी किराना दुकान के लिए।' },
  EX: { bn: 'বড় মুদিখানা আর রেস্তোরাঁর জন্য।', hi: 'बड़े ग्रोसरी स्टोर और रेस्टोरेंट के लिए।' },
  ENTERPRISE: {
    bn: 'পাইকার, একাধিক দোকান, আর হাজারের বেশি জিনিস যাঁদের।',
    hi: 'थोक वाले, कई दुकानों वाले, और जिनके पास हज़ार से ज़्यादा सामान है।',
  },
};

export function planTagline(plan: Plan): Words {
  return { en: PLAN_SPECS[plan].tagline, ...PLAN_TAGLINES[plan] };
}

/** "300 items", or the unlimited plan's word for it. */
export function planItemsLine(plan: Plan): Words {
  if (PLAN_SPECS[plan].unlimited) {
    return { en: 'Unlimited items', bn: 'যত খুশি জিনিস', hi: 'जितना चाहें सामान' };
  }
  const n = planItems(plan);
  return { en: `${n} items`, bn: `${n}টা জিনিস`, hi: `${n} सामान` };
}

/**
 * `EVERY_PLAN_INCLUDES`, line by line, keyed by its English.
 *
 * KEYED, NOT PARALLEL. A second array in the same order would be right until
 * somebody adds a line to the list in `lib/plans.ts`, and from then on every
 * translation below it would sit under the wrong English. Keyed, a new line
 * simply shows in English until it is given its Bengali and Hindi.
 */
const INCLUDES: Record<string, Omit<Words, 'en'>> = {
  'QR shop page and printable poster': {
    bn: 'QR দিয়ে দোকানের পাতা, আর ছাপানোর পোস্টার',
    hi: 'QR वाला दुकान का पेज और छापने लायक पोस्टर',
  },
  'Voice listing in English, Hindi and Bengali': {
    bn: 'বাংলা, হিন্দি আর ইংরেজিতে বলে জিনিস তোলা',
    hi: 'हिंदी, बांग्ला और अंग्रेज़ी में बोलकर सामान जोड़ना',
  },
  'Unlimited QR orders, straight into your app': {
    bn: 'QR থেকে যত খুশি অর্ডার, সোজা আপনার অ্যাপে',
    hi: 'QR से जितने चाहें ऑर्डर, सीधे आपके ऐप में',
  },
  'A notification on your phone for every new order': {
    bn: 'প্রতিটা নতুন অর্ডারে ফোনে খবর',
    hi: 'हर नए ऑर्डर पर फ़ोन पर सूचना',
  },
  'Udhaar khata with WhatsApp reminders': {
    bn: 'বাকির খাতা, হোয়াটসঅ্যাপে তাগাদা সমেত',
    hi: 'उधार खाता, व्हाट्सएप पर याद दिलाने के साथ',
  },
  'Counter sales and the day’s cash drawer': {
    bn: 'কাউন্টারের বিক্রি আর দিনের ক্যাশবাক্স',
    hi: 'काउंटर की बिक्री और दिन का गल्ला',
  },
  'Order history in the app': {
    bn: 'অ্যাপেই পুরনো সব অর্ডার',
    hi: 'ऐप में ही पुराने सारे ऑर्डर',
  },
  'Bulk price and stock updates': {
    bn: 'একসঙ্গে অনেক জিনিসের দাম আর স্টক বদল',
    hi: 'एक साथ कई सामान का दाम और स्टॉक बदलना',
  },
  'Storefront and owner photos': {
    bn: 'দোকানের আর মালিকের ছবি',
    hi: 'दुकान और मालिक की फ़ोटो',
  },
  'Support on WhatsApp': { bn: 'হোয়াটসঅ্যাপে সাহায্য', hi: 'व्हाट्सएप पर मदद' },
};

export function includesLine(english: string): Words {
  const local = INCLUDES[english];
  return local ? { en: english, ...local } : { en: english, bn: english, hi: english };
}

/**
 * Everything else on the page: the bar, the hero, the section headings, the
 * buttons and the foot. Grouped by where it appears, top to bottom, so the
 * person editing it can find a sentence by scrolling the page beside it.
 */
export const LANDING = {
  nav: {
    what: { en: 'What you get', bn: 'যা যা পাবেন', hi: 'क्या-क्या मिलेगा' },
    how: { en: 'How it works', bn: 'কীভাবে চলে', hi: 'कैसे चलता है' },
    why: { en: 'Why shops switch', bn: 'দোকানিরা কেন নিচ্ছেন', hi: 'दुकानदार क्यों अपना रहे हैं' },
    plans: { en: 'Pricing', bn: 'দাম', hi: 'दाम' },
    /** What a screen reader calls the list of section links. */
    label: { en: 'Sections of this page', bn: 'এই পাতার অংশগুলো', hi: 'इस पेज के हिस्से' },
  },
  adminSignIn: { en: 'Admin sign in', bn: 'অ্যাডমিন লগইন', hi: 'एडमिन लॉगिन' },
  getYourShop: { en: 'Get your shop', bn: 'দোকান খুলুন', hi: 'दुकान खोलिए' },
  prices: { en: 'Prices', bn: 'দাম', hi: 'दाम' },
  openMenu: { en: 'Open menu', bn: 'মেনু খুলুন', hi: 'मेनू खोलिए' },
  closeMenu: { en: 'Close menu', bn: 'মেনু বন্ধ করুন', hi: 'मेनू बंद कीजिए' },
  backToTop: { en: 'Top', bn: 'উপরে', hi: 'ऊपर' },
  language: { en: 'Language', bn: 'ভাষা', hi: 'भाषा' },

  hero: {
    badge: { en: 'Set up your shop by speaking', bn: 'দোকান সাজান মুখে বলে', hi: 'दुकान सजाइए, बोलकर' },
    /**
     * THE HEADLINE IS THE SENTENCE AN OWNER SAYS, and in English it stays in
     * Bengali — see the note on the hero in `app/page.tsx`. Nobody lists rice
     * by saying "rice, one kilo, a hundred" in English; the Bengali is the
     * demonstration. In Hindi it is the Hindi sentence, said the way the
     * owner app's own voice hint says it.
     */
    headline: { en: '“চাল ১ কেজি ১০০”', bn: '“চাল ১ কেজি ১০০”', hi: '“चावल 1 किलो 100”' },
    said: {
      en: 'Say it — the item is on your list with its price, and your customers can see it.',
      bn: 'বলুন — জিনিসটা দামসহ তালিকায় উঠে গেল, খদ্দের দেখতে পেল।',
      hi: 'बोलिए — सामान दाम के साथ लिस्ट में आ गया, ग्राहक को दिखने लगा।',
    },
    anyLanguage: {
      en: 'In Bangla, Hindi or English. Nothing to type.',
      bn: 'বাংলা, হিন্দি বা ইংরেজিতে। টাইপ করতে হবে না।',
      hi: 'हिंदी, बांग्ला या अंग्रेज़ी में। टाइप नहीं करना पड़ेगा।',
    },
    qr: {
      en: 'Customers scan the QR at your counter and the order lands in your app — with a bell that counts it from every screen. The khata, the till and the day’s cash are in the same place. No login, no training.',
      bn: 'খদ্দের কাউন্টারের QR স্ক্যান করলেই অর্ডার আপনার অ্যাপে চলে আসে — আর প্রতিটা স্ক্রিনে একটা ঘণ্টি গুনে দেখায় কটা এল। বাকির খাতা, কাউন্টারের বিক্রি আর দিনের ক্যাশ — সব এক জায়গায়। লগইন নেই, শেখার ঝামেলা নেই।',
      hi: 'ग्राहक काउंटर पर लगा QR स्कैन करता है और ऑर्डर सीधे आपके ऐप में आ जाता है — हर स्क्रीन पर घंटी बताती है कि कितने नए आए। उधार खाता, काउंटर की बिक्री और दिन का कैश, सब एक ही जगह। न लॉगिन, न ट्रेनिंग।',
    },
    seePricing: { en: 'See pricing', bn: 'দাম দেখুন', hi: 'दाम देखिए' },
    checks: [
      {
        en: `${TRIAL_DAYS} days free, no advance`,
        bn: `${TRIAL_DAYS} দিন বিনা পয়সায়, আগাম কিছু নয়`,
        hi: `${TRIAL_DAYS} दिन मुफ़्त, कोई एडवांस नहीं`,
      },
      { en: 'No commission, ever', bn: 'কোনও কমিশন নেই, কখনও না', hi: 'कभी कोई कमीशन नहीं' },
      { en: 'Nothing to install', bn: 'কিছু নামাতে হবে না', hi: 'कुछ इंस्टॉल नहीं करना' },
    ] satisfies Words[],
  },

  stats: [
    {
      accent: true,
      value: { en: '0%', bn: '0%', hi: '0%' },
      label: {
        en: 'commission on every order, on every plan',
        bn: 'কমিশন — প্রতিটা অর্ডারে, প্রতিটা প্ল্যানে',
        hi: 'कमीशन — हर ऑर्डर पर, हर प्लान में',
      },
    },
    {
      accent: false,
      value: { en: '500+', bn: '500+', hi: '500+' },
      label: {
        en: 'kirana items already named and priced',
        bn: 'মুদির জিনিস আগে থেকেই নাম আর দামসহ লেখা',
        hi: 'किराने का सामान पहले से नाम और दाम के साथ लिखा हुआ',
      },
    },
    {
      accent: false,
      value: { en: '3', bn: '3', hi: '3' },
      label: {
        en: 'languages the shop speaks — বাংলা, हिन्दी, English',
        bn: 'ভাষায় দোকান চলে — বাংলা, हिन्दी, English',
        hi: 'भाषाओं में दुकान चलती है — বাংলা, हिन्दी, English',
      },
    },
    {
      accent: false,
      value: { en: `${TRIAL_DAYS} days`, bn: `${TRIAL_DAYS} দিন`, hi: `${TRIAL_DAYS} दिन` },
      label: {
        en: 'of the top plan free, nothing paid up front',
        bn: 'সবচেয়ে বড় প্ল্যান বিনা পয়সায়, আগে কিছু দিতে হবে না',
        hi: 'सबसे बड़ा प्लान मुफ़्त, पहले कुछ नहीं देना',
      },
    },
  ],

  what: {
    eyebrow: { en: 'What you get', bn: 'যা যা পাবেন', hi: 'क्या-क्या मिलेगा' },
    title: {
      en: 'A shop’s whole counter, on the phone in your pocket',
      bn: 'পুরো দোকানের কাউন্টার, আপনার পকেটের ফোনে',
      hi: 'पूरी दुकान का काउंटर, आपकी जेब के फ़ोन में',
    },
    lead: {
      en: 'Every plan includes all of it. The plans differ by how many items your shop lists, and by nothing else.',
      bn: 'প্রতিটা প্ল্যানে এর সবকিছুই আছে। প্ল্যানে তফাত শুধু দোকানে কটা জিনিস রাখা যায় তাতে, আর কিছুতে নয়।',
      hi: 'हर प्लान में यह सब कुछ है। प्लान में फ़र्क़ सिर्फ़ इतना है कि दुकान में कितना सामान रख सकते हैं, और कुछ नहीं।',
    },
  },

  screens: {
    eyebrow: { en: 'The real screens', bn: 'আসল স্ক্রিন', hi: 'असली स्क्रीन' },
    title: {
      en: 'Nothing here is a mock-up',
      bn: 'এখানে কিছুই বানানো ছবি নয়',
      hi: 'यहाँ कुछ भी नकली तस्वीर नहीं',
    },
    lead: {
      en: 'These are the screens a shop uses every day, photographed from a working shop.',
      bn: 'চালু দোকান থেকে তোলা — এই স্ক্রিনগুলোই দোকান রোজ ব্যবহার করে।',
      hi: 'चालू दुकान से ली गई — यही स्क्रीन दुकान रोज़ इस्तेमाल करती है।',
    },
    items: {
      en: 'Your list — spoken, not typed',
      bn: 'আপনার তালিকা — বলে বানানো, টাইপ করে নয়',
      hi: 'आपकी लिस्ट — बोलकर बनी, टाइप करके नहीं',
    },
    orders: {
      en: 'Orders, in the order you work them',
      bn: 'অর্ডার, যে ক্রমে আপনি সামলান',
      hi: 'ऑर्डर, उसी क्रम में जैसे आप निपटाते हैं',
    },
    khata: {
      en: 'The khata, always added up',
      bn: 'খাতা, সবসময় যোগ করা',
      hi: 'खाता, हमेशा जुड़ा हुआ',
    },
    till: {
      en: 'The till for walk-ins',
      bn: 'দোকানে এসে কেনার বিক্রি',
      hi: 'दुकान पर आए ग्राहक की बिक्री',
    },
  },

  how: {
    eyebrow: { en: 'How it works', bn: 'কীভাবে চলে', hi: 'कैसे चलता है' },
    title: {
      en: 'Five steps, and we do the first one for you',
      bn: 'পাঁচটা ধাপ — প্রথমটা আমরাই করে দিই',
      hi: 'पाँच कदम — पहला हम खुद कर देते हैं',
    },
    lead: {
      en: 'Nobody has to fill in a form, learn a screen, or be talked through a menu on the phone.',
      bn: 'কোনও ফর্ম ভরতে হবে না, কোনও স্ক্রিন শিখতে হবে না, ফোনে কেউ মেনু বোঝাবে — তারও দরকার নেই।',
      hi: 'न कोई फ़ॉर्म भरना, न कोई स्क्रीन सीखना, न फ़ोन पर किसी से मेनू समझना।',
    },
    /** Under the drawing of the owner speaking. The quote is what he says. */
    ownerSays: {
      en: '“চাল এক কেজি ৬৮ টাকা” — say it, and it is on the list, priced.',
      bn: '“চাল এক কেজি ৬৮ টাকা” — বললেই তালিকায়, দামসহ।',
      hi: '“चावल एक किलो 68 रुपये” — बोलते ही लिस्ट में, दाम के साथ।',
    },
  },

  why: {
    eyebrow: { en: 'Why shops switch', bn: 'দোকানিরা কেন নিচ্ছেন', hi: 'दुकानदार क्यों अपना रहे हैं' },
    title: {
      en: 'The complaint first, the answer second',
      bn: 'আগে সমস্যা, তারপর সমাধান',
      hi: 'पहले परेशानी, फिर उसका हल',
    },
    lead: {
      en: 'A feature list leaves the shopkeeper to translate it into their own day — and mostly they do not bother.',
      bn: 'শুধু সুবিধার তালিকা দিলে দোকানিকে নিজেকেই ভেবে বের করতে হয় তাঁর দিনে কোনটা কাজে লাগবে — বেশিরভাগ সময় সেটা আর হয়ে ওঠে না।',
      hi: 'सिर्फ़ खूबियों की लिस्ट दे दो, तो दुकानदार को खुद सोचना पड़ता है कि उसके दिन में क्या काम आएगा — और ज़्यादातर यह सोचा ही नहीं जाता।',
    },
  },

  plans: {
    eyebrow: { en: 'Pricing', bn: 'দাম', hi: 'दाम' },
    title: {
      en: 'One price a month. Nothing per order.',
      bn: 'মাসে একটাই দাম। অর্ডার পিছু কিছু নয়।',
      hi: 'महीने का एक ही दाम। हर ऑर्डर पर कुछ नहीं।',
    },
    lead: {
      en: `A new shop starts on ${TRIAL_DAYS} days of the top plan, free, with nothing to pay up front.`,
      bn: `নতুন দোকান শুরু করে সবচেয়ে বড় প্ল্যানে, ${TRIAL_DAYS} দিন বিনা পয়সায় — আগে কিছু দিতে হয় না।`,
      hi: `नई दुकान सबसे बड़े प्लान पर ${TRIAL_DAYS} दिन मुफ़्त शुरू करती है — पहले कुछ नहीं देना।`,
    },
    popular: { en: 'Most kiranas', bn: 'বেশিরভাগ মুদি দোকান', hi: 'ज़्यादातर किराना दुकानें' },
    perMonth: { en: '/mo', bn: '/মাস', hi: '/महीना' },
    everyPlan: {
      en: 'Every plan includes all of it',
      bn: 'প্রতিটা প্ল্যানে সবকিছু আছে',
      hi: 'हर प्लान में सब कुछ है',
    },
    listForYou: {
      en: 'Do not want to list the items yourself?',
      bn: 'নিজে জিনিস তুলতে চান না?',
      hi: 'खुद सामान नहीं जोड़ना चाहते?',
    },
    stopPaying: { en: 'If you stop paying', bn: 'টাকা দেওয়া বন্ধ করলে', hi: 'पैसे देना बंद करें, तो' },
    stopPayingBody: {
      en: `Your shop page and QR keep working for ${AUTO_PAUSE_DAYS} days and nothing is ever deleted. Pay by UPI, by the month or the year, no contract, stop whenever you like.`,
      bn: `আপনার দোকানের পাতা আর QR আরও ${AUTO_PAUSE_DAYS} দিন চালু থাকে, আর কিছুই কখনও মোছা হয় না। UPI-তে মাসে বা বছরে দিন — কোনও চুক্তি নেই, যখন খুশি বন্ধ করুন।`,
      hi: `आपकी दुकान का पेज और QR ${AUTO_PAUSE_DAYS} दिन और चलता रहता है, और कुछ भी कभी मिटाया नहीं जाता। UPI से महीने या साल का दीजिए — कोई कॉन्ट्रैक्ट नहीं, जब चाहें बंद कीजिए।`,
    },
    money: {
      en: `Customers pay you in cash or straight into your own UPI. ${BRAND_NAME} never touches the money from an order.`,
      bn: `খদ্দের টাকা দেন আপনাকেই — নগদে, নয়তো সোজা আপনার নিজের UPI-তে। অর্ডারের টাকায় ${BRAND_NAME} কখনও হাত দেয় না।`,
      hi: `ग्राहक पैसे आपको ही देते हैं — नकद, या सीधे आपके अपने UPI में। ऑर्डर के पैसे को ${BRAND_NAME} कभी हाथ नहीं लगाता।`,
    },
  },

  faq: {
    eyebrow: { en: 'Questions', bn: 'প্রশ্ন', hi: 'सवाल' },
    title: {
      en: 'What shopkeepers actually ask',
      bn: 'দোকানিরা আসলে যা জিজ্ঞেস করেন',
      hi: 'दुकानदार असल में जो पूछते हैं',
    },
  },

  cta: {
    title: {
      en: 'Bring your shop online today',
      bn: 'আজই দোকান অনলাইনে আনুন',
      hi: 'आज ही अपनी दुकान ऑनलाइन लाइए',
    },
    body: {
      en: 'Tell us your shop’s name, phone number and address. We build the shop, print your QR and set it up with you — you start by speaking your first item.',
      bn: 'দোকানের নাম, ফোন নম্বর আর ঠিকানা বলুন। আমরা দোকান তৈরি করি, QR ছাপিয়ে দিই, আর আপনার সঙ্গে থেকে চালু করি — শুরু করবেন প্রথম জিনিসটা মুখে বলে।',
      hi: 'दुकान का नाम, फ़ोन नंबर और पता बताइए। हम दुकान बनाते हैं, QR छापकर देते हैं, और आपके साथ मिलकर चालू करते हैं — शुरुआत आप पहला सामान बोलकर करेंगे।',
    },
    whatsapp: { en: 'WhatsApp us', bn: 'হোয়াটসঅ্যাপ করুন', hi: 'व्हाट्सएप कीजिए' },
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

/** "₹X a year", and what paying yearly saves, in the reader's language. */
export function yearLine(year: string, saving: string): { price: Words; save: Words } {
  return {
    price: { en: `₹${year} a year`, bn: `বছরে ₹${year}`, hi: `साल का ₹${year}` },
    save: {
      en: ` — save ₹${saving}`,
      bn: ` — ₹${saving} বাঁচে`,
      hi: ` — ₹${saving} की बचत`,
    },
  };
}

/**
 * The offer to catalogue the shop for them, split round the price so the page
 * can set the price in bold wherever the language puts it in the sentence.
 */
export function listingOffer(price: string): { before: Words; strong: Words; after: Words } {
  return {
    before: {
      en: 'We will catalogue the shop for you at ',
      bn: 'আমরাই আপনার দোকানের সব জিনিস তুলে দেব, ',
      hi: 'हम आपकी दुकान का सारा सामान जोड़ देंगे, ',
    },
    strong: {
      en: `${price} an item`,
      bn: `জিনিস পিছু ${price}`,
      hi: `${price} प्रति सामान`,
    },
    after: {
      en: ', once — names, prices and pack sizes, in all three languages.',
      bn: ', একবারই — নাম, দাম আর প্যাকের মাপ, তিন ভাষাতেই।',
      hi: ', बस एक बार — नाम, दाम और पैक साइज़, तीनों भाषाओं में।',
    },
  };
}
