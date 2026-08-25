/**
 * The shop owner's app, in the owner's own language.
 *
 * The customer page was translated from the start; the owner's side was not,
 * which meant DukaanFlow spoke to a shopkeeper in Bengali and then handed them
 * an English screen. Every word an owner reads while running their shop lives
 * here.
 *
 * The Super Admin console stays English — that is one operator, not thousands
 * of shopkeepers, and translating it would be cost without benefit.
 */

import type { Locale } from './i18n';

type OwnerDictionary = {
  tabSell: string;
  tabInventory: string;
  tabOrders: string;
  myPrices: string;
  viewShop: string;
  signOut: string;
  language: string;

  voiceTitle: string;
  voiceIdle: string;
  voiceListening: string;
  voiceExampleAdd: string;
  voiceExampleOut: string;
  voiceExampleRemove: string;
  labelAdd: string;
  labelOut: string;
  labelRemove: string;
  working: string;

  confirmHeard: string;
  confirmSayYesNo: string;
  yes: string;
  no: string;
  undo: string;
  undone: string;
  clearLog: string;
  statusDone: string;
  statusUnclear: string;
  statusFailed: string;

  typeInstead: string;
  hideForm: string;
  name: string;
  price: string;
  unit: string;
  category: string;
  nameBn: string;
  nameHi: string;
  saveItem: string;
  upsertHint: string;

  searchItems: string;
  allCategories: string;
  inStock: string;
  outOfStock: string;
  markOut: string;
  markIn: string;
  delete: string;
  deleteConfirm: string;
  noItems: string;
  noItemsHint: string;
  noMatch: string;

  itemsCount: string;
  outOfStockCount: string;
  ofLimit: string;

  orders: string;
  noOrders: string;
  noOrdersHint: string;
  orderNew: string;
  orderConfirmed: string;
  orderCancelled: string;
  markConfirmed: string;
  markCancelled: string;
  delivery: string;
  pickup: string;
  callCustomer: string;

  planLabel: string;
  trialDaysLeft: string;
  planFull: string;
  planUpgrade: string;
  planExpired: string;
  renewOnWhatsApp: string;

  starterTitle: string;
  starterHint: string;
  starterAdd: string;
  starterSkip: string;
  starterAdded: string;

  welcomeTitle: string;
  welcomeBody: string;
  welcomeStart: string;
  welcomeSkip: string;

  openInChrome: string;
  openInChromeBody: string;
  copyLink: string;
  linkCopied: string;

  networkError: string;

  sellTitle: string;
  sellHint: string;
  sellSearch: string;
  sellEmpty: string;
  sellTotal: string;
  sellClear: string;
  sellTakePayment: string;
  sellCash: string;
  sellUpi: string;
  sellScanToPay: string;
  sellDone: string;
  sellRecorded: string;
  sellToday: string;
  sellTodayCount: string;
  sellMissingItem: string;
};

export const OWNER_DICTIONARIES: Record<Locale, OwnerDictionary> = {
  en: {
    tabSell: 'Sell',
    tabInventory: 'Items',
    tabOrders: 'Orders',
    myPrices: 'My prices',
    viewShop: 'View my shop',
    signOut: 'Sign out',
    language: 'Language',

    voiceTitle: 'Manage items by voice',
    voiceIdle: 'Tap the mic, then say one instruction per sentence.',
    voiceListening: 'Listening… add a price, mark out of stock, or remove.',
    voiceExampleAdd: '“rice one kg sixty eight rupees”',
    voiceExampleOut: '“rice out of stock”',
    voiceExampleRemove: '“remove rice”',
    labelAdd: 'Add / re-price',
    labelOut: 'Out of stock',
    labelRemove: 'Remove',
    working: 'working…',

    confirmHeard: 'Heard',
    confirmSayYesNo: 'Say “yes” or “no”, or tap below.',
    yes: 'Yes',
    no: 'No',
    undo: 'Undo',
    undone: 'Undone',
    clearLog: 'Clear log',
    statusDone: 'Done',
    statusUnclear: 'Unclear',
    statusFailed: 'Failed',

    typeInstead: 'Type instead',
    hideForm: 'Hide form',
    name: 'Name',
    price: 'Price (₹)',
    unit: 'Unit',
    category: 'Category',
    nameBn: 'Bengali name',
    nameHi: 'Hindi name',
    saveItem: 'Save item',
    upsertHint: 'Same name and unit? The existing item is updated, not duplicated.',

    searchItems: 'Search items',
    allCategories: 'All categories',
    inStock: 'In stock',
    outOfStock: 'Out of stock',
    markOut: 'Mark out',
    markIn: 'Mark in',
    delete: 'Delete',
    deleteConfirm: 'Delete this item? This cannot be undone.',
    noItems: 'No items yet',
    noItemsHint: 'Tap the mic above and say your first item with its price.',
    noMatch: 'No items match that search',

    itemsCount: 'items',
    outOfStockCount: 'out of stock',
    ofLimit: 'of',

    orders: 'Orders',
    noOrders: 'No orders yet',
    noOrdersHint: 'Orders appear here the moment a customer sends one from your QR.',
    orderNew: 'New',
    orderConfirmed: 'Confirmed',
    orderCancelled: 'Cancelled',
    markConfirmed: 'Confirm',
    markCancelled: 'Cancel',
    delivery: 'Delivery',
    pickup: 'Pickup',
    callCustomer: 'Call',

    planLabel: 'Plan',
    trialDaysLeft: 'days left in your free trial',
    planFull: 'Your plan is full',
    planUpgrade: 'Upgrade',
    planExpired: 'Your subscription has ended. Your shop and QR still work — renew to change items.',
    renewOnWhatsApp: 'Renew on WhatsApp',

    starterTitle: 'Add common items in one tap',
    starterHint: 'Pick what you sell, then say or type the prices.',
    starterAdd: 'Add selected',
    starterSkip: 'Not now',
    starterAdded: 'added — now set their prices',

    welcomeTitle: 'Let’s add your first item',
    welcomeBody:
      'Tap the microphone and say the item, its size, then the price — for example “rice one kg sixty eight rupees”. Your phone will repeat it back.',
    welcomeStart: 'Start',
    welcomeSkip: 'Skip',

    openInChrome: 'Open in Chrome to use voice',
    openInChromeBody:
      'WhatsApp’s built-in browser blocks the microphone. Tap the ⋮ menu above and choose “Open in browser”, or copy the link.',
    copyLink: 'Copy link',
    linkCopied: 'Link copied',

    networkError: 'Network error. Please try again.',

    sellTitle: 'Sell',
    sellHint: 'Tap what the customer is buying.',
    sellSearch: 'Search to add',
    sellEmpty: 'Nothing added yet',
    sellTotal: 'Total',
    sellClear: 'Clear',
    sellTakePayment: 'Take payment',
    sellCash: 'Cash',
    sellUpi: 'UPI',
    sellScanToPay: 'Ask the customer to scan',
    sellDone: 'Done',
    sellRecorded: 'Sale recorded',
    sellToday: 'Today',
    sellTodayCount: 'sales',
    sellMissingItem: 'Item not in the list? Add it in Items, then come back.',
  },

  bn: {
    tabSell: 'বিক্রি',
    tabInventory: 'জিনিস',
    tabOrders: 'অর্ডার',
    myPrices: 'আমার দাম',
    viewShop: 'আমার দোকান দেখুন',
    signOut: 'সাইন আউট',
    language: 'ভাষা',

    voiceTitle: 'কথা বলে জিনিস সামলান',
    voiceIdle: 'মাইকে চাপ দিন, তারপর এক বাক্যে একটি নির্দেশ বলুন।',
    voiceListening: 'শুনছি… দাম যোগ করুন, শেষ বলুন, বা মুছে দিন।',
    voiceExampleAdd: '“চাল এক কেজি ৬৮ টাকা”',
    voiceExampleOut: '“চাল শেষ”',
    voiceExampleRemove: '“চাল মুছে দাও”',
    labelAdd: 'যোগ / দাম বদল',
    labelOut: 'শেষ',
    labelRemove: 'মুছুন',
    working: 'হচ্ছে…',

    confirmHeard: 'শুনলাম',
    confirmSayYesNo: '“হ্যাঁ” বা “না” বলুন, বা নিচে চাপুন।',
    yes: 'হ্যাঁ',
    no: 'না',
    undo: 'ফিরিয়ে দিন',
    undone: 'ফিরিয়ে দেওয়া হয়েছে',
    clearLog: 'তালিকা মুছুন',
    statusDone: 'হয়েছে',
    statusUnclear: 'বুঝিনি',
    statusFailed: 'হয়নি',

    typeInstead: 'লিখে দিন',
    hideForm: 'ফর্ম লুকান',
    name: 'নাম',
    price: 'দাম (₹)',
    unit: 'পরিমাণ',
    category: 'ভাগ',
    nameBn: 'বাংলা নাম',
    nameHi: 'হিন্দি নাম',
    saveItem: 'সেভ করুন',
    upsertHint: 'একই নাম আর পরিমাণ? পুরনোটাই বদলে যাবে, নতুন হবে না।',

    searchItems: 'জিনিস খুঁজুন',
    allCategories: 'সব ভাগ',
    inStock: 'আছে',
    outOfStock: 'শেষ',
    markOut: 'শেষ বলুন',
    markIn: 'আছে বলুন',
    delete: 'মুছুন',
    deleteConfirm: 'এই জিনিসটি মুছে দেবেন? আর ফেরানো যাবে না।',
    noItems: 'এখনও কোনো জিনিস নেই',
    noItemsHint: 'উপরের মাইকে চাপ দিয়ে প্রথম জিনিসটি দাম সহ বলুন।',
    noMatch: 'কিছু পাওয়া যায়নি',

    itemsCount: 'টি জিনিস',
    outOfStockCount: 'টি শেষ',
    ofLimit: '/',

    orders: 'অর্ডার',
    noOrders: 'এখনও কোনো অর্ডার নেই',
    noOrdersHint: 'আপনার QR থেকে কেউ অর্ডার পাঠালেই এখানে দেখাবে।',
    orderNew: 'নতুন',
    orderConfirmed: 'নেওয়া হয়েছে',
    orderCancelled: 'বাতিল',
    markConfirmed: 'নিলাম',
    markCancelled: 'বাতিল',
    delivery: 'ডেলিভারি',
    pickup: 'দোকান থেকে',
    callCustomer: 'ফোন',

    planLabel: 'প্ল্যান',
    trialDaysLeft: 'দিন ফ্রি ট্রায়াল বাকি',
    planFull: 'আপনার প্ল্যান ভরে গেছে',
    planUpgrade: 'বাড়ান',
    planExpired: 'সাবস্ক্রিপশন শেষ। দোকান আর QR চলছে — জিনিস বদলাতে রিনিউ করুন।',
    renewOnWhatsApp: 'হোয়াটসঅ্যাপে রিনিউ',

    starterTitle: 'এক চাপে সাধারণ জিনিস যোগ করুন',
    starterHint: 'আপনি যা বিক্রি করেন বেছে নিন, তারপর দাম বলুন বা লিখুন।',
    starterAdd: 'বাছাই করা যোগ করুন',
    starterSkip: 'এখন নয়',
    starterAdded: 'যোগ হয়েছে — এবার দাম দিন',

    welcomeTitle: 'চলুন প্রথম জিনিসটি যোগ করি',
    welcomeBody:
      'মাইকে চাপ দিয়ে জিনিসের নাম, পরিমাণ, তারপর দাম বলুন — যেমন “চাল এক কেজি ৬৮ টাকা”। ফোন আপনাকে শুনিয়ে দেবে।',
    welcomeStart: 'শুরু করুন',
    welcomeSkip: 'পরে',

    openInChrome: 'ভয়েসের জন্য Chrome-এ খুলুন',
    openInChromeBody:
      'হোয়াটসঅ্যাপের ব্রাউজারে মাইক কাজ করে না। উপরের ⋮ মেনু থেকে “Open in browser” বেছে নিন, বা লিংক কপি করুন।',
    copyLink: 'লিংক কপি করুন',
    linkCopied: 'লিংক কপি হয়েছে',

    networkError: 'নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।',

    sellTitle: 'বিক্রি',
    sellHint: 'খদ্দের যা নিচ্ছেন তাতে চাপ দিন।',
    sellSearch: 'খুঁজে যোগ করুন',
    sellEmpty: 'এখনও কিছু যোগ হয়নি',
    sellTotal: 'মোট',
    sellClear: 'মুছুন',
    sellTakePayment: 'টাকা নিন',
    sellCash: 'নগদ',
    sellUpi: 'UPI',
    sellScanToPay: 'খদ্দেরকে স্ক্যান করতে বলুন',
    sellDone: 'হয়ে গেছে',
    sellRecorded: 'বিক্রি লেখা হয়েছে',
    sellToday: 'আজ',
    sellTodayCount: 'বিক্রি',
    sellMissingItem: 'তালিকায় নেই? “জিনিস”-এ গিয়ে যোগ করুন, তারপর ফিরে আসুন।',
  },

  hi: {
    tabSell: 'बिक्री',
    tabInventory: 'सामान',
    tabOrders: 'ऑर्डर',
    myPrices: 'मेरे दाम',
    viewShop: 'मेरी दुकान देखें',
    signOut: 'साइन आउट',
    language: 'भाषा',

    voiceTitle: 'बोलकर सामान संभालें',
    voiceIdle: 'माइक दबाइए, फिर एक बार में एक बात बोलिए।',
    voiceListening: 'सुन रहे हैं… दाम जोड़िए, खत्म बताइए, या हटाइए।',
    voiceExampleAdd: '“चावल एक किलो 68 रुपये”',
    voiceExampleOut: '“चावल खत्म”',
    voiceExampleRemove: '“चावल हटाओ”',
    labelAdd: 'जोड़ें / दाम बदलें',
    labelOut: 'खत्म',
    labelRemove: 'हटाएँ',
    working: 'हो रहा है…',

    confirmHeard: 'सुना',
    confirmSayYesNo: '“हाँ” या “नहीं” बोलिए, या नीचे दबाइए।',
    yes: 'हाँ',
    no: 'नहीं',
    undo: 'वापस लें',
    undone: 'वापस ले लिया',
    clearLog: 'सूची साफ़ करें',
    statusDone: 'हो गया',
    statusUnclear: 'समझ नहीं आया',
    statusFailed: 'नहीं हुआ',

    typeInstead: 'लिखकर डालें',
    hideForm: 'फ़ॉर्म छिपाएँ',
    name: 'नाम',
    price: 'दाम (₹)',
    unit: 'मात्रा',
    category: 'श्रेणी',
    nameBn: 'बंगाली नाम',
    nameHi: 'हिंदी नाम',
    saveItem: 'सेव करें',
    upsertHint: 'वही नाम और मात्रा? पुराना ही बदलेगा, नया नहीं बनेगा।',

    searchItems: 'सामान खोजें',
    allCategories: 'सभी श्रेणी',
    inStock: 'उपलब्ध',
    outOfStock: 'खत्म',
    markOut: 'खत्म करें',
    markIn: 'उपलब्ध करें',
    delete: 'हटाएँ',
    deleteConfirm: 'यह सामान हटा दें? वापस नहीं आएगा।',
    noItems: 'अभी कोई सामान नहीं',
    noItemsHint: 'ऊपर माइक दबाकर पहला सामान दाम के साथ बोलिए।',
    noMatch: 'कोई सामान नहीं मिला',

    itemsCount: 'सामान',
    outOfStockCount: 'खत्म',
    ofLimit: '/',

    orders: 'ऑर्डर',
    noOrders: 'अभी कोई ऑर्डर नहीं',
    noOrdersHint: 'आपके QR से कोई ऑर्डर भेजते ही यहाँ दिखेगा।',
    orderNew: 'नया',
    orderConfirmed: 'लिया',
    orderCancelled: 'रद्द',
    markConfirmed: 'लिया',
    markCancelled: 'रद्द',
    delivery: 'डिलीवरी',
    pickup: 'दुकान से',
    callCustomer: 'फ़ोन',

    planLabel: 'प्लान',
    trialDaysLeft: 'दिन का फ्री ट्रायल बाकी',
    planFull: 'आपका प्लान भर गया',
    planUpgrade: 'बढ़ाएँ',
    planExpired: 'सदस्यता खत्म। दुकान और QR चालू हैं — सामान बदलने के लिए रिन्यू करें।',
    renewOnWhatsApp: 'व्हाट्सएप पर रिन्यू',

    starterTitle: 'एक टैप में आम सामान जोड़ें',
    starterHint: 'जो आप बेचते हैं चुनिए, फिर दाम बोलिए या लिखिए।',
    starterAdd: 'चुने हुए जोड़ें',
    starterSkip: 'अभी नहीं',
    starterAdded: 'जुड़ गए — अब दाम डालिए',

    welcomeTitle: 'पहला सामान जोड़ते हैं',
    welcomeBody:
      'माइक दबाकर सामान का नाम, मात्रा, फिर दाम बोलिए — जैसे “चावल एक किलो 68 रुपये”। फोन आपको दोहराकर सुनाएगा।',
    welcomeStart: 'शुरू करें',
    welcomeSkip: 'छोड़ें',

    openInChrome: 'आवाज़ के लिए Chrome में खोलें',
    openInChromeBody:
      'व्हाट्सएप के ब्राउज़र में माइक नहीं चलता। ऊपर ⋮ मेन्यू से “Open in browser” चुनिए, या लिंक कॉपी कीजिए।',
    copyLink: 'लिंक कॉपी करें',
    linkCopied: 'लिंक कॉपी हो गया',

    networkError: 'नेटवर्क की दिक्कत। दोबारा कोशिश कीजिए।',

    sellTitle: 'बिक्री',
    sellHint: 'ग्राहक जो ले रहा है उस पर दबाइए।',
    sellSearch: 'खोजकर जोड़ें',
    sellEmpty: 'अभी कुछ नहीं जोड़ा',
    sellTotal: 'कुल',
    sellClear: 'मिटाएँ',
    sellTakePayment: 'पैसा लें',
    sellCash: 'नकद',
    sellUpi: 'UPI',
    sellScanToPay: 'ग्राहक से स्कैन कराइए',
    sellDone: 'हो गया',
    sellRecorded: 'बिक्री दर्ज हुई',
    sellToday: 'आज',
    sellTodayCount: 'बिक्री',
    sellMissingItem: 'सूची में नहीं है? “सामान” में जाकर जोड़िए, फिर लौटिए।',
  },
};

export function ownerDict(locale: Locale): OwnerDictionary {
  return OWNER_DICTIONARIES[locale] ?? OWNER_DICTIONARIES.en;
}

export type { OwnerDictionary };
