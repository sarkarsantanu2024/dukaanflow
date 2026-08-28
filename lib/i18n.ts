/**
 * Three-language dictionary for the customer-facing shop page.
 * Deliberately a plain object, not next-intl — the surface is ~30 strings and
 * the admin side stays English-only.
 */

export const LOCALES = ['en', 'bn', 'hi'] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'EN',
  bn: 'বাং',
  hi: 'हिं',
};

type Dictionary = {
  scanToOrder: string;
  menu: string;
  inStock: string;
  outOfStock: string;
  add: string;
  items: string;
  total: string;
  continue: string;
  yourOrder: string;
  name: string;
  namePlaceholder: string;
  phone: string;
  phonePlaceholder: string;
  address: string;
  addressPlaceholder: string;
  pincode: string;
  pincodePlaceholder: string;
  orderPlacedTitle: string;
  orderPlacedHint: string;
  orderPlacedDone: string;
  area: string;
  areaPlaceholder: string;
  savedForNextTime: string;
  optional: string;
  required: string;
  delivery: string;
  pickup: string;
  sendOnWhatsApp: string;
  sending: string;
  back: string;
  emptyShop: string;
  emptyShopHint: string;
  noResults: string;
  search: string;
  shopClosed: string;
  shopClosedHint: string;
  orderFailed: string;
  openingWhatsApp: string;
  payViaUpi: string;
  all: string;
  voiceOrder: string;
  voiceListening: string;
  voiceHint: string;
  voiceAdded: string;
  voiceNotHeard: string;
  voiceNotInShop: string;
  voiceDenied: string;
  voiceUnavailable: string;
  voiceDidYouMean: string;
  voiceYes: string;
  voiceNo: string;
  repeatTitle: string;
  repeatHint: string;
  repeatAdd: string;
  repeatDismiss: string;
};

export const DICTIONARIES: Record<Locale, Dictionary> = {
  en: {
    scanToOrder: 'Scan to Order',
    menu: 'Menu',
    inStock: 'In stock',
    outOfStock: 'Out of stock',
    add: 'Add',
    items: 'items',
    total: 'Total',
    continue: 'Continue',
    yourOrder: 'Your order',
    name: 'Name',
    namePlaceholder: 'Your name',
    phone: 'Phone',
    phonePlaceholder: '10-digit mobile number',
    address: 'Address',
    addressPlaceholder: 'House, street, landmark',
    pincode: 'Pincode',
    pincodePlaceholder: '700028',
    orderPlacedTitle: 'Order sent to the shop',
    orderPlacedHint: 'The shop has it now. They will call you when it is ready.',
    orderPlacedDone: 'Done',
    area: 'Area',
    areaPlaceholder: 'Bazaar side, near the school',
    savedForNextTime: 'Saved on this phone — next time you only tap Place order.',
    optional: 'optional',
    required: 'required',
    delivery: 'Delivery',
    pickup: 'Pickup',
    sendOnWhatsApp: 'Place order',
    sending: 'Sending…',
    back: 'Back',
    emptyShop: 'No items yet',
    emptyShopHint: 'This shop has not added items. Please check back soon.',
    noResults: 'No items match your search',
    search: 'Search items',
    shopClosed: 'Shop is closed',
    shopClosedHint: 'This shop is not accepting orders right now.',
    orderFailed: 'Could not place the order. Please try again.',
    openingWhatsApp: 'Opening WhatsApp…',
    payViaUpi: 'Pay via UPI',
    all: 'All',
    voiceOrder: 'Order by voice',
    voiceListening: 'Listening…',
    voiceHint: 'Tap the mic and say “two kg rice and one packet salt”',
    voiceAdded: 'added to cart',
    voiceNotHeard: 'Could not find that item. Please say it again.',
    voiceNotInShop: 'This shop does not have that item.',
    voiceDenied: 'Microphone blocked. Allow mic access for this site.',
    voiceUnavailable: 'Voice is not available on this browser. Please tap Add instead.',
    repeatTitle: 'Same as last time?',
    repeatHint: 'Your last order from this shop',
    repeatAdd: 'Add all',
    repeatDismiss: 'No, start fresh',
    voiceDidYouMean: 'Did you mean',
    voiceYes: 'Yes, add',
    voiceNo: 'No',
  },
  bn: {
    scanToOrder: 'স্ক্যান করে অর্ডার করুন',
    menu: 'তালিকা',
    inStock: 'আছে',
    outOfStock: 'শেষ',
    add: 'যোগ করুন',
    items: 'টি জিনিস',
    total: 'মোট',
    continue: 'এগিয়ে যান',
    yourOrder: 'আপনার অর্ডার',
    name: 'নাম',
    namePlaceholder: 'আপনার নাম',
    phone: 'ফোন',
    phonePlaceholder: '১০ সংখ্যার মোবাইল নম্বর',
    address: 'ঠিকানা',
    addressPlaceholder: 'বাড়ি, রাস্তা, ল্যান্ডমার্ক',
    orderPlacedTitle: 'অর্ডার দোকানে পৌঁছে গেছে',
    orderPlacedHint: 'দোকান অর্ডারটি পেয়েছে। তৈরি হলে ওঁরা ফোন করবেন।',
    orderPlacedDone: 'ঠিক আছে',
    area: 'পাড়া',
    areaPlaceholder: 'বাজারের দিকে, স্কুলের কাছে',
    savedForNextTime: 'এই ফোনে সেভ হয়ে গেল — পরের বার শুধু অর্ডার দিন।',
    pincode: 'পিন কোড',
    // ASCII digits even in Bengali: the field takes ASCII, and a placeholder
    // showing ৭০০ invites a value the validator will reject.
    pincodePlaceholder: '700028',
    optional: 'ঐচ্ছিক',
    required: 'আবশ্যক',
    delivery: 'ডেলিভারি',
    pickup: 'দোকান থেকে নেব',
    sendOnWhatsApp: 'অর্ডার দিন',
    sending: 'পাঠানো হচ্ছে…',
    back: 'পিছনে',
    emptyShop: 'এখনও কোনো জিনিস নেই',
    emptyShopHint: 'দোকানটি এখনও জিনিস যোগ করেনি। একটু পরে দেখুন।',
    noResults: 'কিছু পাওয়া যায়নি',
    search: 'জিনিস খুঁজুন',
    shopClosed: 'দোকান বন্ধ',
    shopClosedHint: 'এই দোকান এখন অর্ডার নিচ্ছে না।',
    orderFailed: 'অর্ডার পাঠানো যায়নি। আবার চেষ্টা করুন।',
    openingWhatsApp: 'হোয়াটসঅ্যাপ খুলছে…',
    payViaUpi: 'UPI-তে পেমেন্ট',
    all: 'সব',
    voiceOrder: 'বলে অর্ডার করুন',
    voiceListening: 'শুনছি…',
    voiceHint: 'মাইকে চাপ দিয়ে বলুন “দুই কেজি চাল আর এক প্যাকেট নুন”',
    voiceAdded: 'কার্টে যোগ হয়েছে',
    voiceNotHeard: 'জিনিসটি খুঁজে পাইনি। আবার বলুন।',
    voiceNotInShop: 'এই দোকানে সেই জিনিসটি নেই।',
    voiceDenied: 'মাইক্রোফোন বন্ধ। এই সাইটে মাইক ব্যবহারের অনুমতি দিন।',
    voiceUnavailable: 'এই ব্রাউজারে ভয়েস কাজ করছে না। “যোগ করুন” চাপুন।',
    repeatTitle: 'আগের বারের মতোই?',
    repeatHint: 'এই দোকানে আপনার শেষ অর্ডার',
    repeatAdd: 'সব যোগ করুন',
    repeatDismiss: 'না, নতুন করে',
    voiceDidYouMean: 'আপনি কি বলতে চেয়েছেন',
    voiceYes: 'হ্যাঁ, যোগ করুন',
    voiceNo: 'না',
  },
  hi: {
    scanToOrder: 'स्कैन करके ऑर्डर करें',
    menu: 'सूची',
    inStock: 'उपलब्ध',
    outOfStock: 'खत्म',
    add: 'जोड़ें',
    items: 'सामान',
    total: 'कुल',
    continue: 'आगे बढ़ें',
    yourOrder: 'आपका ऑर्डर',
    name: 'नाम',
    namePlaceholder: 'आपका नाम',
    phone: 'फ़ोन',
    phonePlaceholder: '10 अंकों का मोबाइल नंबर',
    address: 'पता',
    addressPlaceholder: 'मकान, गली, लैंडमार्क',
    orderPlacedTitle: 'ऑर्डर दुकान तक पहुँच गया',
    orderPlacedHint: 'दुकान को ऑर्डर मिल गया है। तैयार होने पर वे फ़ोन करेंगे।',
    orderPlacedDone: 'ठीक है',
    area: 'इलाक़ा',
    areaPlaceholder: 'बाज़ार की तरफ़, स्कूल के पास',
    savedForNextTime: 'इस फ़ोन में सेव हो गया — अगली बार सिर्फ़ ऑर्डर करें।',
    pincode: 'पिन कोड',
    pincodePlaceholder: '700028',
    optional: 'वैकल्पिक',
    required: 'आवश्यक',
    delivery: 'डिलीवरी',
    pickup: 'दुकान से लेंगे',
    sendOnWhatsApp: 'ऑर्डर करें',
    sending: 'भेजा जा रहा है…',
    back: 'वापस',
    emptyShop: 'अभी कोई सामान नहीं',
    emptyShopHint: 'इस दुकान ने अभी सामान नहीं जोड़ा है। थोड़ी देर बाद देखें।',
    noResults: 'कोई सामान नहीं मिला',
    search: 'सामान खोजें',
    shopClosed: 'दुकान बंद है',
    shopClosedHint: 'यह दुकान अभी ऑर्डर नहीं ले रही है।',
    orderFailed: 'ऑर्डर नहीं भेजा जा सका। दोबारा कोशिश करें।',
    openingWhatsApp: 'व्हाट्सएप खुल रहा है…',
    payViaUpi: 'UPI से भुगतान',
    all: 'सभी',
    voiceOrder: 'बोलकर ऑर्डर करें',
    voiceListening: 'सुन रहे हैं…',
    voiceHint: 'माइक दबाकर बोलिए “दो किलो चावल और एक पैकेट नमक”',
    voiceAdded: 'कार्ट में जोड़ दिया',
    voiceNotHeard: 'यह सामान नहीं मिला। दोबारा बोलिए।',
    voiceNotInShop: 'इस दुकान में यह सामान नहीं है।',
    voiceDenied: 'माइक्रोफ़ोन बंद है। इस साइट को माइक की अनुमति दें।',
    voiceUnavailable: 'इस ब्राउज़र में आवाज़ काम नहीं कर रही। “जोड़ें” दबाइए।',
    repeatTitle: 'पिछली बार जैसा ही?',
    repeatHint: 'इस दुकान से आपका पिछला ऑर्डर',
    repeatAdd: 'सब जोड़ें',
    repeatDismiss: 'नहीं, नया',
    voiceDidYouMean: 'क्या आपका मतलब है',
    voiceYes: 'हाँ, जोड़ें',
    voiceNo: 'नहीं',
  },
};

export function dict(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES.en;
}
