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
  addItem: string;
  clashTitle: string;
  clashHint: string;
  /** Shown while items sit at Re 1 and are therefore invisible to customers. */
  unpricedTitle: string;
  unpricedHint: string;
  notOnSale: string;
  photoAdd: string;
  photoAddHint: string;
  photoReading: string;
  voiceAlready: string;
  voiceSetPrice: string;
  otherLanguages: string;
  otherLanguagesHint: string;
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
  orderCompleted: string;
  orderCancelled: string;
  /** The paid-or-khata question asked when finishing an order. */
  paymentAsk: string;
  paymentGot: string;
  paymentKhata: string;
  paymentKhataDone: string;
  soundOn: string;
  soundOff: string;
  newOrderAlert: string;
  /** Shown when a PIN has been reissued and this session no longer counts. */
  sessionEnded: string;
  markConfirmed: string;
  markCompleted: string;
  markCancelled: string;
  ordersAll: string;
  ordersToday: string;
  ordersTakings: string;
  ordersWaiting: string;
  noOrdersHere: string;
  delivery: string;
  pickup: string;
  callCustomer: string;
  messageCustomer: string;

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
  pinLabel: string;
  pinHint: string;
  pinSignIn: string;
  pinWrong: string;
  pinNotSetUp: string;
  starterSearch: string;
  starterSelectAll: string;
  starterClear: string;
  starterRoomLeft: string;
  starterFull: string;

  welcomeTitle: string;
  welcomeBody: string;
  welcomeStart: string;
  welcomeSkip: string;

  installTitle: string;
  installBody: string;
  installNow: string;
  installLater: string;
  installIos: string;
  installDone: string;

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
  sellKhata: string;
  sellWhoseKhata: string;

  tabKhata: string;
  khataTitle: string;
  khataTotal: string;
  khataNobody: string;
  khataNobodyHint: string;
  khataOwes: string;
  khataAdvance: string;
  khataSettled: string;
  khataGave: string;
  khataGot: string;
  khataCustomer: string;
  khataPhone: string;
  khataArea: string;
  khataAmount: string;
  khataNote: string;
  khataSave: string;
  khataRemind: string;
  khataHistory: string;
  khataDelete: string;
  khataDeleteConfirm: string;

  menuTitle: string;
  menuHint: string;
  menuCopy: string;
  menuCopied: string;
  menuSendTo: string;
  menuNoCustomers: string;
  menuToday: string;
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
    voiceExampleAdd: '“rice”',
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
    addItem: 'Add an item',
    clashTitle: 'Two items share a name',
    clashHint: 'Add a pack size to each, so a customer can tell them apart.',
    unpricedTitle: 'Customers cannot see these yet',
    unpricedHint: 'Set a price on each one and save. Until a price is given the item stays off the shop page — better an item nobody sees than rice offered at a price nobody chose.',
    notOnSale: 'No price set',
    photoAdd: 'Add by photo',
    photoAddHint: 'Point the camera at the packet. The photo is not saved.',
    photoReading: 'Reading the packet…',
    voiceAlready: 'already on your list',
    voiceSetPrice: 'added — now set the price',
    otherLanguages: 'Other languages (optional)',
    otherLanguagesHint:
      'Filled in automatically for names the app knows. Left blank, customers see the name above.',
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
    orderNew: 'Order placed',
    orderConfirmed: 'Preparing',
    orderCompleted: 'Completed',
    orderCancelled: 'Cancelled',
    paymentAsk: 'Has the customer paid?',
    paymentGot: 'Paid',
    paymentKhata: 'Not yet — put on khata',
    paymentKhataDone: 'Added to khata',
    soundOn: 'Sound on',
    soundOff: 'Sound off',
    newOrderAlert: 'New order',
    sessionEnded: 'Your session has ended. Please sign in with your PIN again.',
    markConfirmed: 'Accept',
    markCompleted: 'Mark done',
    markCancelled: 'Cancel',
    ordersAll: 'All',
    ordersToday: 'Today',
    ordersTakings: 'Takings',
    ordersWaiting: 'Waiting',
    noOrdersHere: 'Nothing here right now',
    delivery: 'Delivery',
    pickup: 'Pickup',
    callCustomer: 'Call',
    messageCustomer: 'WhatsApp',

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
    pinLabel: 'PIN',
    pinHint: 'Enter the 6-digit PIN from your DukaanFlow contact to manage your prices.',
    pinSignIn: 'Sign in',
    pinWrong: 'Incorrect PIN',
    pinNotSetUp: 'Owner access has not been set up for this shop yet. Ask your DukaanFlow contact to issue a PIN.',
    starterSearch: 'Search the list',
    starterSelectAll: 'All',
    starterClear: 'Clear',
    starterRoomLeft: 'left on your plan',
    starterFull: 'Your plan is full. Upgrade to add more.',

    welcomeTitle: 'Let’s add your first item',
    welcomeBody:
      'Tap the microphone and say the item, its size, then the price — for example “rice one kg sixty eight rupees”. Your phone will repeat it back.',
    welcomeStart: 'Start',
    welcomeSkip: 'Skip',

    installTitle: 'Put your shop on your home screen',
    installBody:
      'Install it once and it opens like any other app — and it remembers the microphone, so voice works straight away every time.',
    installNow: 'Install',
    installLater: 'Later',
    installIos: 'Tap Share, then “Add to Home Screen”.',
    installDone: 'Installed',

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
    sellKhata: 'Udhaar',
    sellWhoseKhata: 'Whose khata?',

    tabKhata: 'Khata',
    khataTitle: 'Udhaar book',
    khataTotal: 'Total outstanding',
    khataNobody: 'Nobody owes you anything',
    khataNobodyHint: 'Add an entry below, or sell on udhaar from the Sell screen.',
    khataOwes: 'owes',
    khataAdvance: 'in advance',
    khataSettled: 'settled',
    khataGave: 'Gave goods',
    khataGot: 'Got payment',
    khataCustomer: 'Name',
    khataPhone: 'Phone',
    khataArea: 'Area',
    khataAmount: 'Amount (₹)',
    khataNote: 'Note',
    khataSave: 'Save entry',
    khataRemind: 'Remind on WhatsApp',
    khataHistory: 'History',
    khataDelete: 'Remove',
    khataDeleteConfirm: 'Remove this entry from the book?',

    menuTitle: 'Send today’s menu',
    menuHint: 'Tell your regulars what is ready today.',
    menuCopy: 'Copy message',
    menuCopied: 'Copied — paste it into your WhatsApp broadcast list',
    menuSendTo: 'Send to',
    menuNoCustomers: 'No saved customers yet. They are added when you use the khata.',
    menuToday: 'Available today',
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
    voiceExampleAdd: '“চাল”',
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
    addItem: 'জিনিস যোগ করুন',
    unpricedTitle: 'খদ্দের এগুলো দেখতে পাচ্ছে না',
    unpricedHint: 'প্রত্যেকটার দাম লিখে সেভ করুন। দাম না দেওয়া পর্যন্ত দোকানের পাতায় দেখা যাবে না।',
    notOnSale: 'দাম দেওয়া হয়নি',
    clashTitle: 'একই নামে দুটি জিনিস',
    clashHint: 'প্রতিটিতে পরিমাণ দিন, তাহলে ক্রেতা আলাদা করতে পারবে।',
    photoAdd: 'ছবি তুলে যোগ করুন',
    photoAddHint: 'প্যাকেটের দিকে ক্যামেরা ধরুন। ছবি রাখা হয় না।',
    photoReading: 'পড়া হচ্ছে…',
    voiceAlready: 'ইতিমধ্যে তালিকায় আছে',
    voiceSetPrice: 'যোগ হয়েছে — এবার দাম দিন',
    otherLanguages: 'অন্য ভাষা (ইচ্ছামতো)',
    otherLanguagesHint:
      'চেনা নাম হলে নিজে থেকেই ভরে যায়। খালি রাখলে ক্রেতা উপরের নামটাই দেখবে।',
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
    orderNew: 'অর্ডার এসেছে',
    orderConfirmed: 'তৈরি হচ্ছে',
    orderCompleted: 'হয়ে গেছে',
    orderCancelled: 'বাতিল',
    paymentAsk: 'খদ্দের কি টাকা দিয়েছে?',
    paymentGot: 'টাকা পেয়েছি',
    paymentKhata: 'এখনও দেয়নি — খাতায় লিখুন',
    paymentKhataDone: 'খাতায় যোগ হয়েছে',
    soundOn: 'আওয়াজ চালু',
    soundOff: 'আওয়াজ বন্ধ',
    newOrderAlert: 'নতুন অর্ডার',
    sessionEnded: 'আপনার সময় শেষ। আবার PIN দিয়ে ঢুকুন।',
    markConfirmed: 'নিলাম',
    markCompleted: 'হয়ে গেছে',
    markCancelled: 'বাতিল',
    ordersAll: 'সব',
    ordersToday: 'আজ',
    ordersTakings: 'আজকের টাকা',
    ordersWaiting: 'বাকি আছে',
    noOrdersHere: 'এখানে এখন কিছু নেই',
    delivery: 'ডেলিভারি',
    pickup: 'দোকান থেকে',
    callCustomer: 'ফোন',
    messageCustomer: 'WhatsApp',

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
    pinLabel: 'পিন',
    pinHint: 'দাম সামলাতে DukaanFlow-এর দেওয়া ৬ অঙ্কের পিন দিন।',
    pinSignIn: 'সাইন ইন',
    pinWrong: 'পিন ভুল',
    pinNotSetUp: 'এই দোকানের জন্য এখনও মালিকের অ্যাক্সেস চালু হয়নি। DukaanFlow-এর সঙ্গে যোগাযোগ করে পিন নিন।',
    starterSearch: 'তালিকায় খুঁজুন',
    starterSelectAll: 'সব',
    starterClear: 'বাদ দিন',
    starterRoomLeft: 'আপনার প্ল্যানে বাকি',
    starterFull: 'আপনার প্ল্যান ভরে গেছে। আরও যোগ করতে প্ল্যান বাড়ান।',

    welcomeTitle: 'চলুন প্রথম জিনিসটি যোগ করি',
    welcomeBody:
      'মাইকে চাপ দিয়ে জিনিসের নাম, পরিমাণ, তারপর দাম বলুন — যেমন “চাল এক কেজি ৬৮ টাকা”। ফোন আপনাকে শুনিয়ে দেবে।',
    welcomeStart: 'শুরু করুন',
    welcomeSkip: 'পরে',

    installTitle: 'দোকানটি হোম স্ক্রিনে রাখুন',
    installBody:
      'একবার ইনস্টল করলে অন্য অ্যাপের মতোই খুলবে — আর মাইকের অনুমতি মনে রাখবে, তাই ভয়েস সঙ্গে সঙ্গে কাজ করবে।',
    installNow: 'ইনস্টল করুন',
    installLater: 'পরে',
    installIos: 'Share চেপে “Add to Home Screen” বেছে নিন।',
    installDone: 'ইনস্টল হয়েছে',

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
    sellKhata: 'ধার',
    sellWhoseKhata: 'কার খাতায়?',

    tabKhata: 'খাতা',
    khataTitle: 'ধারের খাতা',
    khataTotal: 'মোট বাকি',
    khataNobody: 'কারও কাছে বাকি নেই',
    khataNobodyHint: 'নিচে লিখুন, বা “বিক্রি” থেকে ধারে দিন।',
    khataOwes: 'বাকি',
    khataAdvance: 'অগ্রিম',
    khataSettled: 'শোধ',
    khataGave: 'জিনিস দিলাম',
    khataGot: 'টাকা পেলাম',
    khataCustomer: 'নাম',
    khataPhone: 'ফোন',
    khataArea: 'পাড়া',
    khataAmount: 'টাকা (₹)',
    khataNote: 'নোট',
    khataSave: 'লিখুন',
    khataRemind: 'হোয়াটসঅ্যাপে মনে করান',
    khataHistory: 'হিসাব',
    khataDelete: 'মুছুন',
    khataDeleteConfirm: 'এই লেখাটি খাতা থেকে মুছে দেবেন?',

    menuTitle: 'আজকের তালিকা পাঠান',
    menuHint: 'নিয়মিত খদ্দেরদের জানান আজ কী আছে।',
    menuCopy: 'লেখা কপি করুন',
    menuCopied: 'কপি হয়েছে — হোয়াটসঅ্যাপ ব্রডকাস্টে পেস্ট করুন',
    menuSendTo: 'পাঠান',
    menuNoCustomers: 'এখনও কোনো খদ্দের নেই। খাতা ব্যবহার করলে যোগ হবে।',
    menuToday: 'আজ আছে',
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
    voiceExampleAdd: '“चावल”',
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
    addItem: 'सामान जोड़ें',
    unpricedTitle: 'ग्राहक इन्हें नहीं देख पा रहे',
    unpricedHint: 'हर एक का दाम लिखकर सेव करें। दाम दिए बिना दुकान के पेज पर नहीं दिखेगा।',
    notOnSale: 'दाम नहीं दिया',
    clashTitle: 'एक ही नाम के दो सामान',
    clashHint: 'हर एक में मात्रा डालिए, ताकि ग्राहक फर्क समझ सके।',
    photoAdd: 'फोटो से जोड़ें',
    photoAddHint: 'पैकेट की ओर कैमरा कीजिए। फोटो सेव नहीं होती।',
    photoReading: 'पढ़ रहे हैं…',
    voiceAlready: 'पहले से सूची में है',
    voiceSetPrice: 'जुड़ गया — अब दाम डालिए',
    otherLanguages: 'अन्य भाषा (वैकल्पिक)',
    otherLanguagesHint:
      'जाने-पहचाने नाम खुद भर जाते हैं। खाली छोड़ने पर ग्राहक ऊपर वाला नाम देखेंगे।',
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
    orderNew: 'ऑर्डर आया',
    orderConfirmed: 'तैयार हो रहा है',
    orderCompleted: 'हो गया',
    orderCancelled: 'रद्द',
    paymentAsk: 'क्या ग्राहक ने पैसे दिए?',
    paymentGot: 'पैसे मिल गए',
    paymentKhata: 'अभी नहीं — खाते में लिखें',
    paymentKhataDone: 'खाते में जोड़ा गया',
    soundOn: 'आवाज़ चालू',
    soundOff: 'आवाज़ बंद',
    newOrderAlert: 'नया ऑर्डर',
    sessionEnded: 'आपका सत्र समाप्त हो गया। दोबारा PIN से आएँ।',
    markConfirmed: 'लिया',
    markCompleted: 'हो गया',
    markCancelled: 'रद्द',
    ordersAll: 'सब',
    ordersToday: 'आज',
    ordersTakings: 'आज की कमाई',
    ordersWaiting: 'बाकी है',
    noOrdersHere: 'यहाँ अभी कुछ नहीं',
    delivery: 'डिलीवरी',
    pickup: 'दुकान से',
    callCustomer: 'फ़ोन',
    messageCustomer: 'WhatsApp',

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
    pinLabel: 'पिन',
    pinHint: 'दाम संभालने के लिए DukaanFlow से मिला 6 अंकों का पिन डालिए।',
    pinSignIn: 'साइन इन',
    pinWrong: 'पिन गलत है',
    pinNotSetUp: 'इस दुकान के लिए मालिक का एक्सेस अभी चालू नहीं हुआ है। पिन के लिए DukaanFlow से संपर्क कीजिए।',
    starterSearch: 'सूची में खोजें',
    starterSelectAll: 'सभी',
    starterClear: 'हटाएं',
    starterRoomLeft: 'आपके प्लान में बाकी',
    starterFull: 'आपका प्लान भर गया है। और जोड़ने के लिए प्लान बढ़ाएं।',

    welcomeTitle: 'पहला सामान जोड़ते हैं',
    welcomeBody:
      'माइक दबाकर सामान का नाम, मात्रा, फिर दाम बोलिए — जैसे “चावल एक किलो 68 रुपये”। फोन आपको दोहराकर सुनाएगा।',
    welcomeStart: 'शुरू करें',
    welcomeSkip: 'छोड़ें',

    installTitle: 'दुकान को होम स्क्रीन पर रखें',
    installBody:
      'एक बार इंस्टॉल कर लीजिए, फिर यह किसी भी ऐप की तरह खुलेगा — और माइक की अनुमति याद रखेगा, तो आवाज़ तुरंत काम करेगी।',
    installNow: 'इंस्टॉल करें',
    installLater: 'बाद में',
    installIos: 'Share दबाकर “Add to Home Screen” चुनिए।',
    installDone: 'इंस्टॉल हो गया',

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
    sellKhata: 'उधार',
    sellWhoseKhata: 'किसके खाते में?',

    tabKhata: 'खाता',
    khataTitle: 'उधार खाता',
    khataTotal: 'कुल बाकी',
    khataNobody: 'किसी पर कुछ बाकी नहीं',
    khataNobodyHint: 'नीचे लिखिए, या “बिक्री” से उधार पर दीजिए।',
    khataOwes: 'बाकी',
    khataAdvance: 'अग्रिम',
    khataSettled: 'चुकता',
    khataGave: 'सामान दिया',
    khataGot: 'पैसा मिला',
    khataCustomer: 'नाम',
    khataPhone: 'फ़ोन',
    khataArea: 'इलाक़ा',
    khataAmount: 'रकम (₹)',
    khataNote: 'नोट',
    khataSave: 'लिखें',
    khataRemind: 'व्हाट्सएप पर याद दिलाएँ',
    khataHistory: 'हिसाब',
    khataDelete: 'हटाएँ',
    khataDeleteConfirm: 'यह लिखा खाते से हटा दें?',

    menuTitle: 'आज की सूची भेजें',
    menuHint: 'अपने नियमित ग्राहकों को बताइए आज क्या है।',
    menuCopy: 'संदेश कॉपी करें',
    menuCopied: 'कॉपी हो गया — व्हाट्सएप ब्रॉडकास्ट में पेस्ट कीजिए',
    menuSendTo: 'भेजें',
    menuNoCustomers: 'अभी कोई ग्राहक नहीं। खाता इस्तेमाल करने पर जुड़ेंगे।',
    menuToday: 'आज उपलब्ध',
  },
};

export function ownerDict(locale: Locale): OwnerDictionary {
  return OWNER_DICTIONARIES[locale] ?? OWNER_DICTIONARIES.en;
}

export type { OwnerDictionary };
