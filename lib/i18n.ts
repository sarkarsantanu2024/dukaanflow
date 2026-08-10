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
    optional: 'optional',
    required: 'required',
    delivery: 'Delivery',
    pickup: 'Pickup',
    sendOnWhatsApp: 'Send order on WhatsApp',
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
    optional: 'ঐচ্ছিক',
    required: 'আবশ্যক',
    delivery: 'ডেলিভারি',
    pickup: 'দোকান থেকে নেব',
    sendOnWhatsApp: 'হোয়াটসঅ্যাপে অর্ডার পাঠান',
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
    optional: 'वैकल्पिक',
    required: 'आवश्यक',
    delivery: 'डिलीवरी',
    pickup: 'दुकान से लेंगे',
    sendOnWhatsApp: 'व्हाट्सएप पर ऑर्डर भेजें',
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
  },
};

export function dict(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES.en;
}
