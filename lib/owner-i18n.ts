/**
 * The shop owner's app, in the owner's own language.
 *
 * The customer page was translated from the start; the owner's side was not,
 * which meant Halkhata spoke to a shopkeeper in Bengali and then handed them
 * an English screen. Every word an owner reads while running their shop lives
 * here.
 *
 * The Super Admin console stays English — that is one operator, not thousands
 * of shopkeepers, and translating it would be cost without benefit.
 */

import type { Locale } from './i18n';
import { BRAND_NAME } from './brand';

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
  /** Refusal when a rename would leave the item with almost no name at all. */
  nameTooShort: string;
  /** The list's own size: "1 item" / "14 items". */
  itemOne: string;
  itemMany: string;
  /** Ticking rows to delete them together. */
  selectedCount: string;
  clearSelection: string;
  /** Heading for items with no category of their own. */
  categoryNone: string;
  /** Label over the catalogue items this shop has not listed yet. */
  alsoSold: string;
  selectAll: string;
  /** Emptying the whole catalogue, and the question asked before it. */
  deleteAll: string;
  deleteAllConfirm: string;
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
  /** Heard the instruction, but the item it named is not in this shop. */
  voiceNotListed: string;
  voiceSetPrice: string;
  otherLanguages: string;
  otherLanguagesHint: string;
  saveItem: string;
  upsertHint: string;
  /** One more blank row on the add sheet, for an owner listing several at once. */
  addRow: string;
  /** Said above the rows, so the mic's silence is understood as working. */
  rowsHint: string;
  /** Nothing was typed or spoken into any row, so Save had nothing to save. */
  nothingToSave: string;

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
  /** Packed and waiting — for collection, or for the round to go out. */
  orderReady: string;
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
  /** Says which screen settles a WhatsApp order, so nobody rings one up twice. */
  tillOrdersNote: string;
  /** The notice a shopkeeper writes for their own customers. */
  noticeTitle: string;
  noticeNone: string;
  noticeWrite: string;
  noticeChange: string;
  noticeLabel: string;
  noticePlaceholder: string;
  noticeHint: string;
  noticeFrom: string;
  noticeTo: string;
  noticeDatesHint: string;
  noticeSaved: string;
  noticeRemove: string;
  noticeRemoved: string;
  /** Whether customers can see it yet, said plainly on the card. */
  noticeLive: string;
  noticeScheduled: string;
  noticeFinished: string;
  markConfirmed: string;
  /**
   * The button that says an order is packed and tells the customer so.
   *
   * One tap for both, because they are one act: an owner who marks it ready and
   * does not tell anybody has done nothing the customer can act on.
   */
  markReady: string;
  markCompleted: string;
  markCancelled: string;
  /** Asked before an order is turned away — the one act here with no undo. */
  markCancelledConfirm: string;
  ordersAll: string;
  ordersToday: string;
  ordersTakings: string;
  ordersWaiting: string;
  /** Forwards the whole round to whoever is running the deliveries. */
  ordersSendRound: string;
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

  /** The roadblock an owner meets once the trial or a paid period has ended. */
  blockTitle: string;
  blockTrialOver: string;
  blockPausedTitle: string;
  blockPaused: string;
  blockPlanFor: string;
  blockScan: string;
  blockAfterPaying: string;
  blockMonth: string;
  /** The period a price is for, and the two buttons that choose it. */
  blockYear: string;
  blockPerMonth: string;
  blockPerYear: string;
  blockHelp: string;
  blockItems: string;

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

  sellTakePayment: string;
  sellCash: string;
  sellUpi: string;
  sellScanToPay: string;
  sellRecorded: string;
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
  /**
   * How long the current debt has run. `{n}` is the number.
   *
   * "Who owes me" was answered; "who has owed me since June" was not, and that
   * is the one a shopkeeper acts on.
   */
  khataOwingDays: string;
  khataOwingMonths: string;
  khataSettled: string;
  khataGave: string;
  khataGot: string;
  khataCustomer: string;
  khataPhone: string;
  khataArea: string;
  khataAmount: string;
  /** Picking what was handed over, from the shop's own list. */
  khataItems: string;
  khataItemsPick: string;
  khataItemsClose: string;
  khataItemsUseTotal: string;
  khataSave: string;
  khataRemind: string;
  khataHistory: string;
  khataSettle: string;
  khataPartHint: string;
  khataNewCustomer: string;
  khataNewHint: string;
  khataDelete: string;
  khataDeleteConfirm: string;

  menuTitle: string;
  menuHint: string;
  menuCopy: string;
  menuCopied: string;
  menuSendTo: string;
  menuNoCustomers: string;
  menuToday: string;

  /** Counting the countable half of the shop. */
  stockLeft: string;
  stockCount: string;
  stockStop: string;
  stockHint: string;
  stockSoldOut: string;

  /** The sound on this phone when an order arrives. */
  pushTitle: string;
  pushHint: string;
  pushOn: string;
  pushOff: string;
  pushEnabled: string;
  pushDisabled: string;
  pushDenied: string;
  pushUnsupported: string;
  pushFailed: string;
  /** Said out loud, because a promise here is the one that costs trust. */
  pushNotAPromise: string;

  /** Cutting an order down to what the shop actually has. */
  reviseOpen: string;
  reviseTitle: string;
  reviseHint: string;
  reviseSave: string;
  reviseCancel: string;
  reviseDone: string;
  reviseNothingLeft: string;
  reviseTellCustomer: string;
  /** Shown instead, when the server already reached the customer itself. */
  reviseToldCustomer: string;
  reviseSendAnyway: string;
  reviseWas: string;
  revisedBadge: string;

  /** What the shop charges to send an order out. */
  deliveryTitle: string;
  deliveryOpen: string;
  deliveryFee: string;
  deliveryFeeHint: string;
  deliveryFree: string;
  deliveryFreeHint: string;
  deliveryMin: string;
  deliveryMinHint: string;
  deliverySaved: string;
  deliveryOff: string;
  save: string;

  /** Taking the khata out of Halkhata. */
  khataExport: string;
  khataExportHint: string;
  khataExportCsv: string;
  khataExportPdf: string;
  khataStatement: string;

  /** Shown when the phone has lost the network. */
  offline: string;
  offlineHint: string;
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
    voiceExampleAdd: '“rice 1 kg 100”',
    voiceExampleOut: '“rice out of stock”',
    voiceExampleRemove: '“rice delete”',
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
    nameTooShort: 'too short',
    itemOne: 'item',
    itemMany: 'items',
    selectedCount: 'selected',
    clearSelection: 'Clear',
    categoryNone: 'Other',
    alsoSold: 'Usually sold here, not on your list yet — tap to add:',
    selectAll: 'Select all',
    deleteAll: 'Delete all items',
    deleteAllConfirm: 'This removes every item from your shop, with their prices and stock counts. Your orders, khata and takings are not touched. There is no undo.',
    price: 'Price (₹)',
    unit: 'Unit',
    category: 'Category',
    nameBn: 'Bengali name',
    nameHi: 'Hindi name',
    addItem: 'Add an item',
    clashTitle: 'Two items share a name',
    clashHint: 'Add a pack size to each, so a customer can tell them apart.',
    unpricedTitle: 'Customers cannot see these yet',
    unpricedHint: 'Each one shows a suggested price. Check it against what you actually charge, correct it if it is wrong, then press Enter to put the item on sale. Until you do, it stays off your shop page — better an item nobody sees than rice offered at a price nobody chose.',
    notOnSale: 'No price set',
    photoAdd: 'Add by photo',
    photoAddHint: 'Point the camera at the packet. The photo is not saved.',
    photoReading: 'Reading the packet…',
    voiceAlready: 'already on your list',
    voiceNotListed: 'not on your list',
    voiceSetPrice: 'added — now set the price',
    otherLanguages: 'Other languages (optional)',
    otherLanguagesHint:
      'Filled in automatically for names the app knows. Left blank, customers see the name above.',
    saveItem: 'Save item',
    upsertHint: 'Same name and unit? The existing item is updated, not duplicated.',
    addRow: 'One more row',
    rowsHint: 'Speak or type as many as you like — one row each. Save writes them all.',
    nothingToSave: 'Nothing to save yet — give at least one item a name.',

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
    orderReady: 'Ready',
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
    tillOrdersNote: 'This is for customers at the counter. Orders from your QR page are paid for on the Orders page — ringing one up here would count it twice.',
    noticeTitle: 'Notice for customers',
    noticeNone: 'No notice',
    noticeWrite: 'Write',
    noticeChange: 'Change',
    noticeLabel: 'What you want to tell customers',
    noticePlaceholder: 'No delivery this week · puja orders close Friday',
    noticeHint: 'Customers see this at the top of your shop page.',
    noticeFrom: 'From',
    noticeTo: 'Until',
    noticeDatesHint: 'Leave the dates blank to show it until you remove it.',
    noticeSaved: 'Notice saved',
    noticeRemove: 'Remove',
    noticeRemoved: 'Notice removed',
    noticeLive: 'Customers can see this now',
    noticeScheduled: 'Starts later — customers cannot see it yet',
    noticeFinished: 'Finished — customers can no longer see it',
    markConfirmed: 'Accept',
    markReady: 'Ready — tell them',
    markCompleted: 'Mark done',
    markCancelled: 'Cancel order',
    markCancelledConfirm: 'The customer is not served and the order cannot be brought back.',
    ordersAll: 'All',
    ordersToday: 'Today',
    ordersTakings: 'Takings',
    ordersWaiting: 'Waiting',
    ordersSendRound: 'Send list on WhatsApp',
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

    blockTitle: 'Your free trial has ended',
    blockTrialOver:
      'Your shop page and QR are still working and customers can still order. To add or change items, start your subscription.',
    blockPausedTitle: 'Your shop is paused',
    blockPaused:
      'There has been no payment for three months, so your shop page is no longer taking orders. Pay to bring it back — your items, customers and khata are all still here.',
    blockPlanFor: 'For your',
    blockItems: 'items',
    blockScan: 'Scan and pay',
    blockAfterPaying:
      'After paying, send us the payment screenshot on WhatsApp. Your shop opens as soon as we confirm it.',
    blockMonth: 'per month',
    blockYear: 'per year',
    blockPerMonth: 'Monthly',
    blockPerYear: 'Yearly',
    blockHelp: 'Talk to us on WhatsApp',

    starterTitle: 'Add common items in one tap',
    starterHint: 'Pick what you sell, then say or type the prices.',
    starterAdd: 'Add selected',
    starterSkip: 'Not now',
    starterAdded: 'added — now set their prices',
    pinLabel: 'PIN',
    // What signing in is FOR, not what the box below already says.
    // "Enter the 6-digit PIN" sat above a labelled, six-character PIN box and
    // told an owner nothing they could not see — and nothing about why they
    // should bother.
    pinHint: 'Run your shop from your phone — prices, stock, orders and khata. Sign in with your 6-digit PIN.',
    pinSignIn: 'Sign in',
    pinWrong: 'Incorrect PIN',
    pinNotSetUp: `Owner access has not been set up for this shop yet. Ask your ${BRAND_NAME} contact to issue a PIN.`,
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

    sellTakePayment: 'Take payment',
    sellCash: 'Cash',
    sellUpi: 'UPI',
    sellScanToPay: 'Ask the customer to scan',
    sellRecorded: 'Sale recorded',
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
    khataOwingDays: 'owing {n} days',
    khataOwingMonths: 'owing {n} months',
    khataSettled: 'settled',
    khataGave: 'Gave goods',
    khataSettle: 'Mark fully paid',
    khataPartHint: 'Part payment? Change the amount before tapping.',
    khataNewCustomer: 'Add someone new',
    khataNewHint: 'For a customer not in the book yet. Anyone already listed above is quicker to update on their own row.',
    khataGot: 'Got payment',
    khataCustomer: 'Name',
    khataPhone: 'Phone',
    khataArea: 'Area',
    khataAmount: 'Amount (₹)',
    khataItems: 'What did they take?',
    khataItemsPick: 'Pick items',
    khataItemsClose: 'Close',
    khataItemsUseTotal: 'use this amount',
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

    stockLeft: 'Left',
    stockCount: 'Count how many are left',
    stockStop: 'Stop counting',
    stockHint:
      'For things you can count — packets, bottles, bread. Each sale takes one off, and at zero it comes off your shop page on its own. Leave rice and anything you weigh out uncounted: a counted item can only be sold whole, so a customer could not ask for 250 g of it.',
    stockSoldOut: 'Sold out — taken off your shop page',

    pushTitle: 'Get a sound on this phone',
    pushHint: 'When an order comes in, this phone will ring even if the app is shut.',
    pushOn: 'Turn on',
    pushOff: 'Turn off',
    pushEnabled: 'Sound on for this phone',
    pushDisabled: 'Sound off',
    pushDenied:
      'Your browser has blocked notifications for this site. Turn them back on in the browser’s site settings, then try again.',
    pushUnsupported: 'This browser cannot do notifications. The orders page still works as always.',
    pushFailed: 'Could not turn it on. Please try again.',
    pushNotAPromise:
      'Some phones hold notifications back to save battery. Keep checking the Orders page — that is where every order always is.',

    reviseOpen: 'Change amounts',
    reviseTitle: 'What can you actually give?',
    reviseHint:
      'Short of something? Lower the amount here instead of cancelling. The total is worked out again and the customer is told what changed.',
    reviseSave: 'Save and tell the customer',
    reviseCancel: 'Leave it',
    reviseDone: 'Order changed',
    reviseNothingLeft: 'Nothing would be left. Cancel the order instead, so the customer is told properly.',
    reviseTellCustomer: 'Send the change on WhatsApp',
    reviseToldCustomer: 'Customer has been told',
    reviseSendAnyway: 'Send anyway',
    reviseWas: 'was',
    revisedBadge: 'Changed',

    deliveryTitle: 'Delivery charge',
    deliveryOpen: 'Delivery charge and minimum order',
    deliveryFee: 'Delivery charge (₹)',
    deliveryFeeHint: 'Leave it at 0 if you deliver free.',
    deliveryFree: 'Free delivery above (₹)',
    deliveryFreeHint: 'Big orders go free. Leave it at 0 to always charge.',
    deliveryMin: 'Smallest order you will deliver (₹)',
    deliveryMinHint: 'Leave it at 0 to deliver any order. Pickup is never blocked.',
    deliverySaved: 'Delivery charge saved',
    deliveryOff: 'This shop is collection only, so none of this applies.',
    save: 'Save',

    khataExport: 'Download the book',
    khataExportHint: 'Your khata as a file you keep — a spreadsheet, or a statement to print.',
    khataExportCsv: 'Spreadsheet (CSV)',
    khataExportPdf: 'Statement (PDF)',
    khataStatement: 'Statement',

    offline: 'No internet',
    offlineHint: 'Showing what was on this phone. It will catch up when the signal comes back.',
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
    voiceExampleAdd: '“চাল ১ কেজি ১০০”',
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
    nameTooShort: 'খুব ছোট',
    itemOne: 'জিনিস',
    itemMany: 'জিনিস',
    selectedCount: 'বাছা হয়েছে',
    clearSelection: 'বাতিল',
    categoryNone: 'অন্যান্য',
    alsoSold: 'এই ধরনের দোকানে থাকে, আপনার তালিকায় নেই — চাপ দিয়ে যোগ করুন:',
    selectAll: 'সব বাছুন',
    deleteAll: 'সব জিনিস মুছুন',
    deleteAllConfirm: 'আপনার দোকানের সব জিনিস, তার দাম আর স্টক মুছে যাবে। অর্ডার, খাতা আর বিক্রির হিসাব ঠিক থাকবে। এটা আর ফেরানো যাবে না।',
    price: 'দাম (₹)',
    unit: 'পরিমাণ',
    category: 'ভাগ',
    nameBn: 'বাংলা নাম',
    nameHi: 'হিন্দি নাম',
    addItem: 'জিনিস যোগ করুন',
    unpricedTitle: 'খদ্দের এগুলো দেখতে পাচ্ছে না',
    unpricedHint: 'প্রত্যেকটায় একটা আন্দাজের দাম দেওয়া আছে। আপনি যা নেন সেটা ঠিক আছে কিনা দেখে নিন, দরকার হলে বদলান, তারপর এন্টার চাপুন। ততক্ষণ দোকানের পাতায় দেখা যাবে না।',
    notOnSale: 'দাম দেওয়া হয়নি',
    clashTitle: 'একই নামে দুটি জিনিস',
    clashHint: 'প্রতিটিতে পরিমাণ দিন, তাহলে ক্রেতা আলাদা করতে পারবে।',
    photoAdd: 'ছবি তুলে যোগ করুন',
    photoAddHint: 'প্যাকেটের দিকে ক্যামেরা ধরুন। ছবি রাখা হয় না।',
    photoReading: 'পড়া হচ্ছে…',
    voiceAlready: 'ইতিমধ্যে তালিকায় আছে',
    voiceNotListed: 'তালিকায় নেই',
    voiceSetPrice: 'যোগ হয়েছে — এবার দাম দিন',
    otherLanguages: 'অন্য ভাষা (ইচ্ছামতো)',
    otherLanguagesHint:
      'চেনা নাম হলে নিজে থেকেই ভরে যায়। খালি রাখলে ক্রেতা উপরের নামটাই দেখবে।',
    saveItem: 'সেভ করুন',
    upsertHint: 'একই নাম আর পরিমাণ? পুরনোটাই বদলে যাবে, নতুন হবে না।',
    addRow: 'আরও একটা ঘর',
    rowsHint: 'যত খুশি বলুন বা লিখুন — এক জিনিস এক ঘরে। সেভ করলে সবগুলো এক সঙ্গে যোগ হবে।',
    nothingToSave: 'এখনও কিছু নেই — অন্তত একটা জিনিসের নাম দিন।',

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
    orderReady: 'তৈরি আছে',
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
    tillOrdersNote: 'এটা দোকানে আসা খদ্দেরের জন্য। অনলাইন অর্ডারের টাকা “অর্ডার” পাতায় নিন — এখানে তুললে দুবার হিসাব হবে।',
    noticeTitle: 'খদ্দেরদের জন্য নোটিশ',
    noticeNone: 'কোনো নোটিশ নেই',
    noticeWrite: 'লিখুন',
    noticeChange: 'বদলান',
    noticeLabel: 'খদ্দেরদের যা জানাতে চান',
    noticePlaceholder: 'এ সপ্তাহে ডেলিভারি নেই · পুজোর অর্ডার শুক্রবার পর্যন্ত',
    noticeHint: 'খদ্দের এটা আপনার দোকানের পাতার উপরে দেখবে।',
    noticeFrom: 'থেকে',
    noticeTo: 'পর্যন্ত',
    noticeDatesHint: 'তারিখ না দিলে যতক্ষণ না মুছছেন ততক্ষণ দেখা যাবে।',
    noticeSaved: 'নোটিশ সেভ হয়েছে',
    noticeRemove: 'মুছুন',
    noticeRemoved: 'নোটিশ মুছে গেছে',
    noticeLive: 'খদ্দের এখন এটা দেখতে পাচ্ছে',
    noticeScheduled: 'পরে শুরু হবে — খদ্দের এখনো দেখতে পাচ্ছে না',
    noticeFinished: 'শেষ হয়ে গেছে — খদ্দের আর দেখতে পাচ্ছে না',
    markConfirmed: 'নিলাম',
    markReady: 'তৈরি — জানিয়ে দিন',
    markCompleted: 'হয়ে গেছে',
    markCancelled: 'অর্ডার বাতিল',
    markCancelledConfirm: 'খদ্দের জিনিস পাবে না, আর অর্ডারটা আর ফেরানো যাবে না।',
    ordersAll: 'সব',
    ordersToday: 'আজ',
    ordersTakings: 'আজকের টাকা',
    ordersWaiting: 'বাকি আছে',
    ordersSendRound: 'তালিকা WhatsApp-এ পাঠান',
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

    blockTitle: 'আপনার ফ্রি ট্রায়াল শেষ',
    blockTrialOver:
      'আপনার দোকানের পাতা আর QR এখনো চলছে, খদ্দের অর্ডার দিতে পারছেন। জিনিস যোগ বা বদল করতে সাবস্ক্রিপশন শুরু করুন।',
    blockPausedTitle: 'আপনার দোকান বন্ধ আছে',
    blockPaused:
      'তিন মাস কোনো টাকা আসেনি, তাই দোকানের পাতা আর অর্ডার নিচ্ছে না। টাকা দিলেই আবার চালু — আপনার জিনিস, খদ্দের আর খাতা সব রয়ে গেছে।',
    blockPlanFor: 'আপনার',
    blockItems: 'জিনিসের জন্য',
    blockScan: 'স্ক্যান করে টাকা দিন',
    blockAfterPaying:
      'টাকা দেওয়ার পর হোয়াটসঅ্যাপে স্ক্রিনশট পাঠান। আমরা দেখে নিলেই দোকান খুলে যাবে।',
    blockMonth: 'প্রতি মাস',
    blockYear: 'প্রতি বছর',
    blockPerMonth: 'মাসে',
    blockPerYear: 'বছরে',
    blockHelp: 'হোয়াটসঅ্যাপে কথা বলুন',

    starterTitle: 'এক চাপে সাধারণ জিনিস যোগ করুন',
    starterHint: 'আপনি যা বিক্রি করেন বেছে নিন, তারপর দাম বলুন বা লিখুন।',
    starterAdd: 'বাছাই করা যোগ করুন',
    starterSkip: 'এখন নয়',
    starterAdded: 'যোগ হয়েছে — এবার দাম দিন',
    pinLabel: 'পিন',
    pinHint: 'ফোন থেকেই দোকান চালান — দাম, স্টক, অর্ডার আর খাতা। ৬ অঙ্কের পিন দিয়ে ঢুকুন।',
    pinSignIn: 'সাইন ইন',
    pinWrong: 'পিন ভুল',
    pinNotSetUp: `এই দোকানের জন্য এখনও মালিকের অ্যাক্সেস চালু হয়নি। ${BRAND_NAME}-এর সঙ্গে যোগাযোগ করে পিন নিন।`,
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

    sellTakePayment: 'টাকা নিন',
    sellCash: 'নগদ',
    sellUpi: 'UPI',
    sellScanToPay: 'খদ্দেরকে স্ক্যান করতে বলুন',
    sellRecorded: 'বিক্রি লেখা হয়েছে',
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
    khataOwingDays: '{n} দিন ধরে বাকি',
    khataOwingMonths: '{n} মাস ধরে বাকি',
    khataSettled: 'শোধ',
    khataGave: 'জিনিস দিলাম',
    khataSettle: 'সব শোধ হয়েছে',
    khataPartHint: 'কিছুটা দিলে? টাকার অঙ্কটা বদলে নিন।',
    khataNewCustomer: 'নতুন কাউকে যোগ করুন',
    khataNewHint: 'যাঁর নাম খাতায় নেই তাঁর জন্য। উপরে নাম থাকলে সেখানেই তাড়াতাড়ি হবে।',
    khataGot: 'টাকা পেলাম',
    khataCustomer: 'নাম',
    khataPhone: 'ফোন',
    khataArea: 'পাড়া',
    khataAmount: 'টাকা (₹)',
    khataItems: 'কী কী নিল?',
    khataItemsPick: 'জিনিস বাছুন',
    khataItemsClose: 'বন্ধ করুন',
    khataItemsUseTotal: 'এই টাকাটা বসান',
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

    stockLeft: 'আছে',
    stockCount: 'কটা আছে গুনে রাখুন',
    stockStop: 'গোনা বন্ধ',
    stockHint:
      'যা গোনা যায় তার জন্য — প্যাকেট, বোতল, পাউরুটি। বিক্রি হলেই একটা কমবে, শূন্য হলে নিজে থেকেই দোকানের পাতা থেকে সরে যাবে। চাল-ডালের মতো মেপে দেওয়া জিনিস গুনবেন না: গোনা জিনিস গোটা হিসেবেই বিক্রি হয়, খদ্দের ২৫০ গ্রাম চাইতে পারবেন না।',
    stockSoldOut: 'শেষ — দোকানের পাতা থেকে সরে গেছে',

    pushTitle: 'এই ফোনে আওয়াজ পান',
    pushHint: 'অর্ডার এলে অ্যাপ বন্ধ থাকলেও এই ফোনটা বাজবে।',
    pushOn: 'চালু করুন',
    pushOff: 'বন্ধ করুন',
    pushEnabled: 'এই ফোনে আওয়াজ চালু',
    pushDisabled: 'আওয়াজ বন্ধ',
    pushDenied:
      'আপনার ব্রাউজার এই সাইটের নোটিফিকেশন বন্ধ করে রেখেছে। ব্রাউজারের সাইট সেটিংসে গিয়ে চালু করে আবার চেষ্টা করুন।',
    pushUnsupported: 'এই ব্রাউজারে নোটিফিকেশন হয় না। অর্ডারের পাতা আগের মতোই চলবে।',
    pushFailed: 'চালু করা গেল না। আবার চেষ্টা করুন।',
    pushNotAPromise:
      'কিছু ফোন ব্যাটারি বাঁচাতে নোটিফিকেশন আটকে রাখে। “অর্ডার” পাতাটা দেখতে থাকুন — সব অর্ডার সবসময় ওখানেই থাকে।',

    reviseOpen: 'পরিমাণ বদলান',
    reviseTitle: 'আসলে কতটা দিতে পারবেন?',
    reviseHint:
      'কিছু কম পড়েছে? বাতিল না করে এখানে পরিমাণটা কমিয়ে দিন। মোট টাকা আবার হিসাব হবে আর খদ্দেরকে জানিয়ে দেওয়া হবে।',
    reviseSave: 'সেভ করে খদ্দেরকে জানান',
    reviseCancel: 'থাক',
    reviseDone: 'অর্ডার বদলেছে',
    reviseNothingLeft: 'কিছুই থাকবে না। বরং অর্ডারটা বাতিল করুন, তাহলে খদ্দের ঠিকভাবে জানবে।',
    reviseTellCustomer: 'হোয়াটসঅ্যাপে বদলটা পাঠান',
    reviseToldCustomer: 'খদ্দেরকে জানানো হয়ে গেছে',
    reviseSendAnyway: 'তবু পাঠান',
    reviseWas: 'ছিল',
    revisedBadge: 'বদলেছে',

    deliveryTitle: 'ডেলিভারি চার্জ',
    deliveryOpen: 'ডেলিভারি চার্জ আর সর্বনিম্ন অর্ডার',
    deliveryFee: 'ডেলিভারি চার্জ (₹)',
    deliveryFeeHint: 'বিনা পয়সায় পৌঁছে দিলে ০ রাখুন।',
    deliveryFree: 'এত টাকার উপরে ফ্রি (₹)',
    deliveryFreeHint: 'বড় অর্ডার ফ্রি যাবে। সবসময় চার্জ নিতে চাইলে ০ রাখুন।',
    deliveryMin: 'কত টাকার নিচে পাঠাবেন না (₹)',
    deliveryMinHint: '০ রাখলে যে কোনো অর্ডার যাবে। দোকান থেকে নেওয়া কখনো আটকায় না।',
    deliverySaved: 'ডেলিভারি চার্জ সেভ হয়েছে',
    deliveryOff: 'এই দোকান শুধু দোকান থেকে দেয়, তাই এটা লাগবে না।',
    save: 'সেভ করুন',

    khataExport: 'খাতা নামিয়ে নিন',
    khataExportHint: 'আপনার খাতা একটা ফাইলে — এক্সেলে খোলার জন্য, বা ছাপার জন্য।',
    khataExportCsv: 'এক্সেল ফাইল (CSV)',
    khataExportPdf: 'হিসাবের কাগজ (PDF)',
    khataStatement: 'হিসাব',

    offline: 'ইন্টারনেট নেই',
    offlineHint: 'ফোনে যা ছিল তাই দেখানো হচ্ছে। নেট এলে নিজেই ঠিক হয়ে যাবে।',
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
    voiceExampleAdd: '“चावल 1 किलो 100”',
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
    nameTooShort: 'बहुत छोटा',
    itemOne: 'सामान',
    itemMany: 'सामान',
    selectedCount: 'चुने गए',
    clearSelection: 'हटाएँ',
    categoryNone: 'अन्य',
    alsoSold: 'ऐसी दुकान में आम तौर पर रहता है, आपकी सूची में नहीं — जोड़ने के लिए दबाएँ:',
    selectAll: 'सब चुनें',
    deleteAll: 'सब सामान हटाएँ',
    deleteAllConfirm: 'आपकी दुकान का हर सामान, उसका दाम और स्टॉक मिट जाएगा। ऑर्डर, खाता और बिक्री का हिसाब नहीं बदलेगा। यह वापस नहीं होगा।',
    price: 'दाम (₹)',
    unit: 'मात्रा',
    category: 'श्रेणी',
    nameBn: 'बंगाली नाम',
    nameHi: 'हिंदी नाम',
    addItem: 'सामान जोड़ें',
    unpricedTitle: 'ग्राहक इन्हें नहीं देख पा रहे',
    unpricedHint: 'हर एक पर एक अनुमानित दाम दिया है। आप जो लेते हैं वही है या नहीं, देख लीजिए, जरूरत हो तो बदलिए, फिर एंटर दबाइए। तब तक दुकान के पेज पर नहीं दिखेगा।',
    notOnSale: 'दाम नहीं दिया',
    clashTitle: 'एक ही नाम के दो सामान',
    clashHint: 'हर एक में मात्रा डालिए, ताकि ग्राहक फर्क समझ सके।',
    photoAdd: 'फोटो से जोड़ें',
    photoAddHint: 'पैकेट की ओर कैमरा कीजिए। फोटो सेव नहीं होती।',
    photoReading: 'पढ़ रहे हैं…',
    voiceAlready: 'पहले से सूची में है',
    voiceNotListed: 'सूची में नहीं है',
    voiceSetPrice: 'जुड़ गया — अब दाम डालिए',
    otherLanguages: 'अन्य भाषा (वैकल्पिक)',
    otherLanguagesHint:
      'जाने-पहचाने नाम खुद भर जाते हैं। खाली छोड़ने पर ग्राहक ऊपर वाला नाम देखेंगे।',
    saveItem: 'सेव करें',
    upsertHint: 'वही नाम और मात्रा? पुराना ही बदलेगा, नया नहीं बनेगा।',
    addRow: 'एक और खाना',
    rowsHint: 'जितने चाहें बोलिए या लिखिए — एक सामान एक पंक्ति में। सेव करते ही सब जुड़ जाएंगे।',
    nothingToSave: 'अभी कुछ नहीं है — कम से कम एक सामान का नाम दीजिए।',

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
    orderReady: 'तैयार है',
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
    tillOrdersNote: 'यह दुकान पर आए ग्राहक के लिए है। QR से आए ऑर्डर का पैसा “ऑर्डर” पेज पर लें — यहाँ जोड़ने से दो बार गिना जाएगा।',
    noticeTitle: 'ग्राहकों के लिए सूचना',
    noticeNone: 'कोई सूचना नहीं',
    noticeWrite: 'लिखें',
    noticeChange: 'बदलें',
    noticeLabel: 'ग्राहकों को क्या बताना है',
    noticePlaceholder: 'इस हफ्ते डिलीवरी नहीं · पूजा के ऑर्डर शुक्रवार तक',
    noticeHint: 'ग्राहक इसे आपके दुकान पेज के ऊपर देखेंगे।',
    noticeFrom: 'से',
    noticeTo: 'तक',
    noticeDatesHint: 'तारीख न दें तो जब तक हटाएँ नहीं, दिखती रहेगी।',
    noticeSaved: 'सूचना सेव हो गई',
    noticeRemove: 'हटाएँ',
    noticeRemoved: 'सूचना हटा दी गई',
    noticeLive: 'ग्राहक इसे अभी देख सकते हैं',
    noticeScheduled: 'बाद में शुरू होगी — ग्राहक अभी नहीं देख सकते',
    noticeFinished: 'खत्म — ग्राहक अब नहीं देख सकते',
    markConfirmed: 'लिया',
    markReady: 'तैयार — बता दें',
    markCompleted: 'हो गया',
    markCancelled: 'ऑर्डर रद्द',
    markCancelledConfirm: 'ग्राहक को सामान नहीं मिलेगा, और ऑर्डर वापस नहीं आएगा।',
    ordersAll: 'सब',
    ordersToday: 'आज',
    ordersTakings: 'आज की कमाई',
    ordersWaiting: 'बाकी है',
    ordersSendRound: 'सूची WhatsApp पर भेजें',
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

    blockTitle: 'आपका फ्री ट्रायल खत्म हो गया',
    blockTrialOver:
      'आपकी दुकान का पेज और QR अभी भी चालू हैं, ग्राहक ऑर्डर दे सकते हैं। सामान जोड़ने या बदलने के लिए सदस्यता शुरू करें।',
    blockPausedTitle: 'आपकी दुकान बंद है',
    blockPaused:
      'तीन महीने से कोई भुगतान नहीं आया, इसलिए दुकान का पेज अब ऑर्डर नहीं ले रहा। भुगतान करते ही वापस चालू — आपका सामान, ग्राहक और खाता सब मौजूद है।',
    blockPlanFor: 'आपके',
    blockItems: 'सामान के लिए',
    blockScan: 'स्कैन करके भुगतान करें',
    blockAfterPaying:
      'भुगतान के बाद व्हाट्सएप पर स्क्रीनशॉट भेजें। पुष्टि होते ही दुकान खुल जाएगी।',
    blockMonth: 'प्रति माह',
    blockYear: 'प्रति साल',
    blockPerMonth: 'माहवारी',
    blockPerYear: 'सालाना',
    blockHelp: 'व्हाट्सएप पर बात करें',

    starterTitle: 'एक टैप में आम सामान जोड़ें',
    starterHint: 'जो आप बेचते हैं चुनिए, फिर दाम बोलिए या लिखिए।',
    starterAdd: 'चुने हुए जोड़ें',
    starterSkip: 'अभी नहीं',
    starterAdded: 'जुड़ गए — अब दाम डालिए',
    pinLabel: 'पिन',
    pinHint: 'फोन से ही दुकान चलाइए — दाम, स्टॉक, ऑर्डर और खाता। 6 अंकों के पिन से साइन इन कीजिए।',
    pinSignIn: 'साइन इन',
    pinWrong: 'पिन गलत है',
    pinNotSetUp: `इस दुकान के लिए मालिक का एक्सेस अभी चालू नहीं हुआ है। पिन के लिए ${BRAND_NAME} से संपर्क कीजिए।`,
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

    sellTakePayment: 'पैसा लें',
    sellCash: 'नकद',
    sellUpi: 'UPI',
    sellScanToPay: 'ग्राहक से स्कैन कराइए',
    sellRecorded: 'बिक्री दर्ज हुई',
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
    khataOwingDays: '{n} दिन से बाकी',
    khataOwingMonths: '{n} महीने से बाकी',
    khataSettled: 'चुकता',
    khataGave: 'सामान दिया',
    khataSettle: 'पूरा भुगतान हो गया',
    khataPartHint: 'कुछ हिस्सा दिया? रकम बदल लीजिए।',
    khataNewCustomer: 'नया ग्राहक जोड़ें',
    khataNewHint: 'जिनका नाम खाते में नहीं है उनके लिए। ऊपर नाम हो तो वहीं जल्दी होगा।',
    khataGot: 'पैसा मिला',
    khataCustomer: 'नाम',
    khataPhone: 'फ़ोन',
    khataArea: 'इलाक़ा',
    khataAmount: 'रकम (₹)',
    khataItems: 'क्या-क्या लिया?',
    khataItemsPick: 'सामान चुनें',
    khataItemsClose: 'बंद करें',
    khataItemsUseTotal: 'यही रकम भरें',
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

    stockLeft: 'बचा',
    stockCount: 'कितने बचे हैं, गिनती रखें',
    stockStop: 'गिनती बंद',
    stockHint:
      'जो गिना जा सके उसके लिए — पैकेट, बोतल, ब्रेड। हर बिक्री पर एक कम होगा, और शून्य होते ही दुकान के पेज से अपने आप हट जाएगा। चावल जैसी तौलकर दी जाने वाली चीज़ें मत गिनिए: गिनी हुई चीज़ पूरी ही बिकती है, ग्राहक 250 ग्राम नहीं मांग पाएगा।',
    stockSoldOut: 'खत्म — दुकान के पेज से हट गया',

    pushTitle: 'इस फोन पर आवाज़ पाइए',
    pushHint: 'ऑर्डर आते ही यह फोन बजेगा, चाहे ऐप बंद हो।',
    pushOn: 'चालू करें',
    pushOff: 'बंद करें',
    pushEnabled: 'इस फोन पर आवाज़ चालू',
    pushDisabled: 'आवाज़ बंद',
    pushDenied:
      'आपके ब्राउज़र ने इस साइट की सूचनाएँ रोक रखी हैं। ब्राउज़र की साइट सेटिंग में जाकर चालू कीजिए, फिर दोबारा कोशिश कीजिए।',
    pushUnsupported: 'इस ब्राउज़र में सूचनाएँ नहीं चलतीं। ऑर्डर पेज पहले की तरह चलता रहेगा।',
    pushFailed: 'चालू नहीं हो सका। दोबारा कोशिश कीजिए।',
    pushNotAPromise:
      'कुछ फोन बैटरी बचाने के लिए सूचनाएँ रोक लेते हैं। “ऑर्डर” पेज देखते रहिए — हर ऑर्डर हमेशा वहीं रहता है।',

    reviseOpen: 'मात्रा बदलें',
    reviseTitle: 'असल में कितना दे सकते हैं?',
    reviseHint:
      'कुछ कम पड़ गया? रद्द करने के बजाय यहीं मात्रा घटा दीजिए। कुल रकम दोबारा जुड़ेगी और ग्राहक को बता दिया जाएगा।',
    reviseSave: 'सेव करके ग्राहक को बताएँ',
    reviseCancel: 'रहने दें',
    reviseDone: 'ऑर्डर बदल गया',
    reviseNothingLeft: 'कुछ भी नहीं बचेगा। बेहतर है ऑर्डर रद्द कीजिए, ताकि ग्राहक को ठीक से पता चले।',
    reviseTellCustomer: 'बदलाव व्हाट्सएप पर भेजें',
    reviseToldCustomer: 'ग्राहक को बता दिया गया है',
    reviseSendAnyway: 'फिर भी भेजें',
    reviseWas: 'था',
    revisedBadge: 'बदला',

    deliveryTitle: 'डिलीवरी चार्ज',
    deliveryOpen: 'डिलीवरी चार्ज और कम से कम ऑर्डर',
    deliveryFee: 'डिलीवरी चार्ज (₹)',
    deliveryFeeHint: 'मुफ़्त पहुँचाते हैं तो 0 रहने दीजिए।',
    deliveryFree: 'इससे ऊपर मुफ़्त (₹)',
    deliveryFreeHint: 'बड़े ऑर्डर मुफ़्त जाएँगे। हमेशा चार्ज लेना हो तो 0 रखिए।',
    deliveryMin: 'कम से कम कितने का ऑर्डर भेजेंगे (₹)',
    deliveryMinHint: '0 रखने पर हर ऑर्डर जाएगा। दुकान से लेना कभी नहीं रुकता।',
    deliverySaved: 'डिलीवरी चार्ज सेव हो गया',
    deliveryOff: 'यह दुकान सिर्फ़ काउंटर से देती है, तो इसकी ज़रूरत नहीं।',
    save: 'सेव करें',

    khataExport: 'खाता डाउनलोड करें',
    khataExportHint: 'आपका खाता एक फाइल में — एक्सेल के लिए, या छापने के लिए।',
    khataExportCsv: 'एक्सेल फाइल (CSV)',
    khataExportPdf: 'हिसाब का कागज़ (PDF)',
    khataStatement: 'हिसाब',

    offline: 'इंटरनेट नहीं है',
    offlineHint: 'फोन में जो था वही दिख रहा है। नेट आते ही अपने आप ठीक हो जाएगा।',
  },
};

export function ownerDict(locale: Locale): OwnerDictionary {
  return OWNER_DICTIONARIES[locale] ?? OWNER_DICTIONARIES.en;
}

export type { OwnerDictionary };
