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
  /** The cart drawer: reviewing and changing what is in the basket. */
  cartTitle: string;
  cartEmpty: string;
  cartClear: string;
  cartClearConfirm: string;
  cartRemove: string;
  cartReview: string;
  close: string;
  cancel: string;
  yourOrder: string;
  name: string;
  namePlaceholder: string;
  phone: string;
  phonePlaceholder: string;
  address: string;
  addressPlaceholder: string;
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
  placeOrder: string;
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
  /**
   * WHY the mic did not start, one message per cause.
   *
   * These were a single sentence — "voice is not available on this browser" —
   * shown for five different failures, so somebody who had just granted the
   * microphone was told the browser could not do it at all, with nothing to
   * act on. Only some of these are the user's to fix, but even the ones that
   * are not are worth naming: "needs https" and "your work profile blocks it"
   * send a shopkeeper to two completely different places.
   */
  voiceInsecure: string;
  voiceServiceBlocked: string;
  voiceNoMic: string;
  voiceNoNetwork: string;
  /** The last resort, when the browser gave no usable reason. */
  voiceUnavailable: string;
  voiceDidYouMean: string;
  voiceYes: string;
  voiceNo: string;
  /**
   * When the amount asked for is not what the shop sells in.
   *
   * "250 g" of sugar sold by the kilo cannot be ordered as asked, and the
   * honest answer names both halves of the mismatch — what was said, and what
   * the shop's pack is — rather than silently putting a kilo in the basket.
   */
  voiceYouSaid: string;
  voiceSoldIn: string;
  /** The label on the amount picker — how much of a weighed item to send. */
  amount: string;
  /** "Any amount" — said on a card whose item is sold loose off a scale. */
  anyAmount: string;
  /**
   * The amount asked for is past what one line of an order may hold.
   *
   * A whole sentence, ending in a full stop, with the limits listed AFTER it as
   * "<item> — <at most> <amount>". It used to trail off in "— at most" and have
   * the item name appended to that, which built "please say the amount again —
   * at most Sabudana — 24.75 kg": the ceiling arrived before the thing it was
   * the ceiling for, in all three languages.
   *
   * Said rather than clamped: "300 chini" answered with "did you mean 99 kg of
   * sugar?" is a question nobody can use, and the number was far more likely to
   * have been grams or rupees.
   */
  voiceTooMuch: string;
  /** Joins an item to its ceiling: "Sabudana — at most 24.75 kg". */
  voiceAtMost: string;
  repeatTitle: string;
  repeatHint: string;
  repeatAdd: string;
  repeatDismiss: string;

  /** How many of a counted item are left. Followed by the number. */
  onlyLeft: string;
  /** What the basket adds up, once delivery has a price. */
  goods: string;
  deliveryCharge: string;
  deliveryFree: string;
  /** "Add ₹40 more for free delivery" — the amount is inserted after this. */
  addMoreForFree: string;
  /** "This shop delivers from ₹200" — the amount follows. */
  minOrder: string;
  /** "Add ₹55 more, or choose Pickup" — the amount follows. */
  addMoreToOrder: string;

  /** Being told what happened to this order, without asking. */
  notifyTitle: string;
  notifyBody: string;
  /**
   * The same offer, for an order the customer has to come and collect.
   *
   * Worth its own wording: somebody waiting to be told when to walk over has a
   * concrete reason to say yes, and the permission prompt is one-shot — the
   * sentence that goes with it is the only lever there is on whether they do.
   */
  notifyTitlePickup: string;
  notifyBodyPickup: string;
  notifyYes: string;
  notifyLater: string;
  notifyOn: string;
  notifyDenied: string;

  /** The page a customer can come back to, and the shop they came from. */
  trackTitle: string;
  trackHint: string;
  trackPlaced: string;
  /** Where the order has got to, in the customer's own words. */
  trackStatePreparing: string;
  trackStateReadyPickup: string;
  /**
   * The end of the line: handed over and settled.
   *
   * Without it a finished order still told the customer it was "on its way",
   * because "ready" and "done" were one state.
   */
  trackStateDone: string;
  trackStateReadyDelivery: string;
  trackStateCancelled: string;
  trackChanged: string;
  trackChangedHint: string;
  trackOrderAgain: string;
  trackNotFound: string;
  trackNotFoundHint: string;

  /** Keeping the shop, so the QR is scanned once and never again. */
  saveShopTitle: string;
  saveShopBody: string;
  saveShopNow: string;
  saveShopLater: string;
  saveShopIos: string;
  savedShopsTitle: string;
  savedShopsHint: string;
  savedShopsForget: string;

  /** When the signal has gone. */
  offlineTitle: string;
  offlineBody: string;
  offlineWhatsApp: string;
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
    cartTitle: 'Your basket',
    cartEmpty: 'Nothing in your basket yet.',
    cartClear: 'Empty basket',
    cartClearConfirm: 'Remove everything from your basket?',
    cartRemove: 'Remove',
    cartReview: 'View basket',
    close: 'Close',
    cancel: 'Cancel',
    yourOrder: 'Your order',
    name: 'Name',
    namePlaceholder: 'Your name',
    phone: 'Phone',
    phonePlaceholder: '10-digit mobile number',
    address: 'Address',
    addressPlaceholder: 'House, street, landmark',
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
    placeOrder: 'Place order',
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
    voiceInsecure:
      'Voice needs a secure (https) address. It works on localhost, but not on an http:// address like 192.168.1.5.',
    voiceServiceBlocked:
      'The browser allowed the mic but refused speech recognition — usually a work or managed profile. Try a personal Chrome profile, or Edge.',
    voiceNoMic: 'No microphone found on this device.',
    voiceNoNetwork: 'Voice needs an internet connection — the browser sends the audio away to read it.',
    voiceUnavailable: 'Voice is not available on this browser. Please tap Add instead.',
    repeatTitle: 'Same as last time?',
    repeatHint: 'Your last order from this shop',
    repeatAdd: 'Add all',
    repeatDismiss: 'No, start fresh',
    voiceDidYouMean: 'Did you mean',
    voiceYes: 'Yes, add',
    voiceNo: 'No',
    voiceYouSaid: 'You said',
    voiceSoldIn: 'this shop sells it in',
    amount: 'Amount',
    anyAmount: 'any amount',
    voiceTooMuch: 'That is more than one order can hold. Please say the amount again.',
    voiceAtMost: 'at most',

    onlyLeft: 'Only left:',
    goods: 'Items',
    deliveryCharge: 'Delivery',
    deliveryFree: 'Free',
    addMoreForFree: 'more for free delivery',
    minOrder: 'This shop delivers orders from',
    addMoreToOrder: 'more, or choose Pickup',

    notifyTitle: 'Shall we tell you when it is ready?',
    notifyBody: 'Your phone will let you know when the shop has it ready. Nothing else, ever.',
    notifyTitlePickup: 'We will tell you when to come',
    notifyBodyPickup:
      'You are collecting this yourself, so let us tell you the moment it is ready — no waiting at the counter, no phone calls. Nothing else, ever.',
    notifyYes: 'Yes, tell me',
    notifyLater: 'No thanks',
    notifyOn: 'We will let you know',
    notifyDenied: 'Your browser has blocked notifications for this site.',

    trackTitle: 'Your order',
    trackHint: 'Keep this page. It shows what the shop is doing with your order.',
    trackPlaced: 'Placed',
    trackStatePreparing: 'The shop has your order and is getting it ready.',
    trackStateReadyPickup: 'Ready. Please collect it from the shop.',
    trackStateDone: 'Done — thank you. This order is settled.',
    trackStateReadyDelivery: 'Ready and on its way to you.',
    trackStateCancelled: 'The shop could not take this order.',
    trackChanged: 'The shop changed this order',
    trackChangedHint: 'They did not have everything. This is what is coming, and what it costs.',
    trackOrderAgain: 'Order again from this shop',
    trackNotFound: 'Order not found',
    trackNotFoundHint: 'This link may be old. Old orders are cleared after a while.',

    saveShopTitle: 'Keep this shop on your phone',
    saveShopBody:
      'Add it to your home screen and order again with one tap — no scanning the code again, from anywhere.',
    saveShopNow: 'Add to home screen',
    saveShopLater: 'Not now',
    saveShopIos: 'Tap Share, then “Add to Home Screen”.',
    savedShopsTitle: 'Shops you have ordered from',
    savedShopsHint: 'Kept on this phone only.',
    savedShopsForget: 'Remove',

    offlineTitle: 'No internet just now',
    offlineBody:
      'Your basket is safe. Try again when the signal is back, or send the order to the shop on WhatsApp.',
    offlineWhatsApp: 'Send on WhatsApp instead',
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
    cartTitle: 'আপনার ঝুড়ি',
    cartEmpty: 'ঝুড়িতে এখনো কিছু নেই।',
    cartClear: 'ঝুড়ি খালি করুন',
    cartClearConfirm: 'ঝুড়ি থেকে সব সরিয়ে দেব?',
    cartRemove: 'সরান',
    cartReview: 'ঝুড়ি দেখুন',
    close: 'বন্ধ করুন',
    cancel: 'থাক',
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
    optional: 'ঐচ্ছিক',
    required: 'আবশ্যক',
    delivery: 'ডেলিভারি',
    pickup: 'দোকান থেকে নেব',
    placeOrder: 'অর্ডার দিন',
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
    voiceInsecure:
      'ভয়েসের জন্য https ঠিকানা লাগে। localhost-এ চলে, কিন্তু 192.168.1.5-এর মতো http:// ঠিকানায় চলে না।',
    voiceServiceBlocked:
      'ব্রাউজার মাইক দিয়েছে কিন্তু ভয়েস চিনতে দেয়নি — সাধারণত অফিসের প্রোফাইলে হয়। নিজের Chrome প্রোফাইল বা Edge দিয়ে দেখুন।',
    voiceNoMic: 'এই ডিভাইসে কোনো মাইক্রোফোন পাওয়া যায়নি।',
    voiceNoNetwork: 'ভয়েসের জন্য ইন্টারনেট লাগে — ব্রাউজার কথা পড়তে বাইরে পাঠায়।',
    voiceUnavailable: 'এই ব্রাউজারে ভয়েস কাজ করছে না। “যোগ করুন” চাপুন।',
    repeatTitle: 'আগের বারের মতোই?',
    repeatHint: 'এই দোকানে আপনার শেষ অর্ডার',
    repeatAdd: 'সব যোগ করুন',
    repeatDismiss: 'না, নতুন করে',
    voiceDidYouMean: 'আপনি কি বলতে চেয়েছেন',
    voiceYes: 'হ্যাঁ, যোগ করুন',
    voiceNo: 'না',
    voiceYouSaid: 'আপনি বলেছেন',
    voiceSoldIn: 'এই দোকানে বিক্রি হয়',
    amount: 'পরিমাণ',
    anyAmount: 'যত খুশি',
    voiceTooMuch: 'একবারে এত নেওয়া যায় না। পরিমাণটা আবার বলুন।',
    voiceAtMost: 'সর্বোচ্চ',

    onlyLeft: 'আছে মাত্র:',
    goods: 'জিনিসপত্র',
    deliveryCharge: 'ডেলিভারি',
    deliveryFree: 'ফ্রি',
    addMoreForFree: 'টাকার জিনিস নিলে ডেলিভারি ফ্রি',
    minOrder: 'এই দোকান ডেলিভারি করে',
    addMoreToOrder: 'টাকার জিনিস নিন, বা দোকান থেকে নিন',

    notifyTitle: 'তৈরি হলে জানিয়ে দেব?',
    notifyBody: 'দোকান তৈরি করে দিলেই আপনার ফোনে জানিয়ে দেব। আর কিছু নয়।',
    notifyTitlePickup: 'কখন আসবেন, জানিয়ে দেব',
    notifyBodyPickup:
      'আপনি নিজে এসে নেবেন, তাই তৈরি হওয়া মাত্রই ফোনে জানিয়ে দেব — দোকানে দাঁড়িয়ে থাকতে হবে না, ফোনও করতে হবে না। আর কিছু নয়।',
    notifyYes: 'হ্যাঁ, জানাবেন',
    notifyLater: 'দরকার নেই',
    notifyOn: 'জানিয়ে দেব',
    notifyDenied: 'আপনার ব্রাউজার এই সাইটের নোটিফিকেশন বন্ধ করে রেখেছে।',

    trackTitle: 'আপনার অর্ডার',
    trackHint: 'পাতাটা রেখে দিন। দোকান আপনার অর্ডার নিয়ে কী করছে এখানে দেখা যাবে।',
    trackPlaced: 'দেওয়া হয়েছে',
    trackStatePreparing: 'দোকান অর্ডারটি পেয়েছে, তৈরি করছে।',
    trackStateReadyPickup: 'তৈরি হয়ে গেছে। দোকান থেকে নিয়ে আসুন।',
    trackStateDone: 'হয়ে গেছে — ধন্যবাদ। এই অর্ডারের হিসাব মেটানো হয়েছে।',
    trackStateReadyDelivery: 'তৈরি — আপনার কাছে রওনা হয়েছে।',
    trackStateCancelled: 'দোকান এই অর্ডারটি নিতে পারেনি।',
    trackChanged: 'দোকান অর্ডারটা বদলেছে',
    trackChangedHint: 'সব জিনিস ছিল না। যা আসছে আর যত টাকা লাগবে, নিচে দেখুন।',
    trackOrderAgain: 'এই দোকানে আবার অর্ডার করুন',
    trackNotFound: 'অর্ডার পাওয়া গেল না',
    trackNotFoundHint: 'লিংকটা পুরনো হতে পারে। পুরনো অর্ডার কিছুদিন পর মুছে যায়।',

    saveShopTitle: 'দোকানটা ফোনে রেখে দিন',
    saveShopBody:
      'হোম স্ক্রিনে রেখে দিলে যেখান থেকেই হোক এক চাপেই অর্ডার — আর QR স্ক্যান করতে হবে না।',
    saveShopNow: 'হোম স্ক্রিনে রাখুন',
    saveShopLater: 'এখন নয়',
    saveShopIos: 'Share চেপে “Add to Home Screen” বেছে নিন।',
    savedShopsTitle: 'যেসব দোকানে অর্ডার করেছেন',
    savedShopsHint: 'শুধু এই ফোনেই রাখা আছে।',
    savedShopsForget: 'সরান',

    offlineTitle: 'এখন ইন্টারনেট নেই',
    offlineBody:
      'আপনার ঝুড়ি ঠিক আছে। নেট এলে আবার চেষ্টা করুন, বা হোয়াটসঅ্যাপে দোকানে অর্ডারটা পাঠিয়ে দিন।',
    offlineWhatsApp: 'হোয়াটসঅ্যাপে পাঠান',
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
    cartTitle: 'आपकी टोकरी',
    cartEmpty: 'टोकरी में अभी कुछ नहीं है।',
    cartClear: 'टोकरी खाली करें',
    cartClearConfirm: 'टोकरी से सब हटा दें?',
    cartRemove: 'हटाएँ',
    cartReview: 'टोकरी देखें',
    close: 'बंद करें',
    cancel: 'रहने दें',
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
    optional: 'वैकल्पिक',
    required: 'आवश्यक',
    delivery: 'डिलीवरी',
    pickup: 'दुकान से लेंगे',
    placeOrder: 'ऑर्डर करें',
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
    voiceInsecure:
      'आवाज़ के लिए https पता चाहिए। localhost पर चलती है, 192.168.1.5 जैसे http:// पते पर नहीं।',
    voiceServiceBlocked:
      'ब्राउज़र ने माइक तो दिया पर आवाज़ पहचानने से मना कर दिया — अक्सर ऑफिस प्रोफ़ाइल में होता है। अपनी Chrome प्रोफ़ाइल या Edge आज़माइए।',
    voiceNoMic: 'इस डिवाइस में कोई माइक्रोफ़ोन नहीं मिला।',
    voiceNoNetwork: 'आवाज़ के लिए इंटरनेट चाहिए — ब्राउज़र बोली को पढ़ने के लिए बाहर भेजता है।',
    voiceUnavailable: 'इस ब्राउज़र में आवाज़ काम नहीं कर रही। “जोड़ें” दबाइए।',
    repeatTitle: 'पिछली बार जैसा ही?',
    repeatHint: 'इस दुकान से आपका पिछला ऑर्डर',
    repeatAdd: 'सब जोड़ें',
    repeatDismiss: 'नहीं, नया',
    voiceDidYouMean: 'क्या आपका मतलब है',
    voiceYes: 'हाँ, जोड़ें',
    voiceNo: 'नहीं',
    voiceYouSaid: 'आपने कहा',
    voiceSoldIn: 'यह दुकान बेचती है',
    amount: 'मात्रा',
    anyAmount: 'जितना चाहें',
    voiceTooMuch: 'एक बार में इतना नहीं लिया जा सकता। मात्रा दोबारा बोलिए।',
    voiceAtMost: 'ज़्यादा से ज़्यादा',

    onlyLeft: 'सिर्फ़ बचा:',
    goods: 'सामान',
    deliveryCharge: 'डिलीवरी',
    deliveryFree: 'मुफ़्त',
    addMoreForFree: 'का सामान और लीजिए, डिलीवरी मुफ़्त',
    minOrder: 'यह दुकान डिलीवरी करती है',
    addMoreToOrder: 'का सामान और लीजिए, या दुकान से ले जाइए',

    notifyTitle: 'तैयार होने पर बता दें?',
    notifyBody: 'दुकान के तैयार करते ही आपके फोन पर बता देंगे। और कुछ नहीं।',
    notifyTitlePickup: 'कब आना है, बता देंगे',
    notifyBodyPickup:
      'आप खुद लेने आ रहे हैं, तो तैयार होते ही फोन पर बता देंगे — काउंटर पर खड़े रहने या फ़ोन करने की ज़रूरत नहीं। और कुछ नहीं।',
    notifyYes: 'हाँ, बताइए',
    notifyLater: 'रहने दीजिए',
    notifyOn: 'बता देंगे',
    notifyDenied: 'आपके ब्राउज़र ने इस साइट की सूचनाएँ रोक रखी हैं।',

    trackTitle: 'आपका ऑर्डर',
    trackHint: 'यह पेज रखिए। दुकान आपके ऑर्डर का क्या कर रही है, यहाँ दिखेगा।',
    trackPlaced: 'दिया गया',
    trackStatePreparing: 'दुकान को ऑर्डर मिल गया है, तैयार हो रहा है।',
    trackStateReadyPickup: 'तैयार है। दुकान से ले जाइए।',
    trackStateDone: 'हो गया — धन्यवाद। इस ऑर्डर का हिसाब पूरा है।',
    trackStateReadyDelivery: 'तैयार — आपकी तरफ़ रवाना हो गया।',
    trackStateCancelled: 'दुकान यह ऑर्डर नहीं ले सकी।',
    trackChanged: 'दुकान ने ऑर्डर बदला है',
    trackChangedHint: 'सब सामान नहीं था। क्या आ रहा है और कितना लगेगा, नीचे देखिए।',
    trackOrderAgain: 'इसी दुकान से दोबारा ऑर्डर करें',
    trackNotFound: 'ऑर्डर नहीं मिला',
    trackNotFoundHint: 'लिंक पुराना हो सकता है। पुराने ऑर्डर कुछ समय बाद हटा दिए जाते हैं।',

    saveShopTitle: 'दुकान को फोन में रख लीजिए',
    saveShopBody:
      'होम स्क्रीन पर रख लीजिए और कहीं से भी एक टैप में ऑर्डर कीजिए — दोबारा QR स्कैन नहीं करना पड़ेगा।',
    saveShopNow: 'होम स्क्रीन पर रखें',
    saveShopLater: 'अभी नहीं',
    saveShopIos: 'Share दबाकर “Add to Home Screen” चुनिए।',
    savedShopsTitle: 'जिन दुकानों से आपने ऑर्डर किया',
    savedShopsHint: 'सिर्फ़ इसी फोन में रखा है।',
    savedShopsForget: 'हटाएँ',

    offlineTitle: 'अभी इंटरनेट नहीं है',
    offlineBody:
      'आपकी टोकरी सुरक्षित है। नेट आने पर दोबारा कोशिश कीजिए, या व्हाट्सएप पर दुकान को ऑर्डर भेज दीजिए।',
    offlineWhatsApp: 'व्हाट्सएप पर भेजें',
  },
};

export function dict(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES.en;
}
