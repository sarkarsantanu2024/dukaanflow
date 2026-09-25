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
  /**
   * Two rows of the add sheet name the same shelf. Said on the second row,
   * because the first one is the one the owner is being sent back to.
   */
  duplicateRow: string;
  /** The sheet cannot be saved while two rows name the same thing. */
  duplicateRowsHint: string;

  /* --- Simple mode. See `lib/simple-mode.ts` for what it is and why. --- */
  /** Offered while the full app is showing: the way back to the quiet screen. */
  simpleModeOn: string;
  /** Offered while in simple mode: the way to everything else. */
  simpleModeOff: string;
  /** Heads the fold that holds what simple mode put away on this screen. */
  moreSettings: string;

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
  /** "Up to {n} items" — the one line that differs between plans. */
  planUpTo: string;
  planUnlimitedItems: string;
  /** A photographed packet the reader could not make out. */
  photoUnreadPacket: string;
  photoUnreadPhoto: string;
  /** Photographed items that were read but could not be saved; `{names}` lists them. */
  photoSaveFailed: string;
  /** The add sheet's field errors, in place of the server's English. */
  itemErrPrice: string;
  itemErrName: string;
  itemErrUnit: string;
  itemErrStock: string;
  /** What every plan includes, in this language. Mirrors `EVERY_PLAN_INCLUDES`. */
  planIncludes: string[];
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
  /** The finished orders kept under the live ones, grouped by day. */
  ordersHistory: string;
  ordersHistoryHint: string;
  historyToday: string;
  historyYesterday: string;
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
  /** One order to the helper's WhatsApp. */
  orderToHelper: string;
  /** The words of the helper's WhatsApp list. */
  roundHeading: string;
  roundPickup: string;
  roundNoAddress: string;
  roundCustomer: string;
  /** The helper strip above the orders. `{n}` is the number ticked. */
  helperTickHint: string;
  helperSendTicked: string;
  /** The completed-orders section and its filters. `{n}` is a count. */
  ordersLiveTab: string;
  historySearch: string;
  historyMonth: string;
  historyAllMonths: string;
  historyRange: string;
  history7: string;
  history30: string;
  history90: string;
  historyDate: string;
  historyCount: string;
  historyClear: string;
  historyNone: string;
  /** The till's out-of-stock modal and the bill note it writes. */
  shortTitle: string;
  shortLeft: string;
  shortAddTitle: string;
  shortAddHint: string;
  shortAddButton: string;
  shortStockAdded: string;
  shortTellTitle: string;
  shortTellHint: string;
  shortTellButton: string;
  shortTellNote: string;
  shortNotedTitle: string;
  billNotAvailable: string;
  /** The bell in the header: new orders. */
  bellTitle: string;
  bellEmpty: string;
  bellClearAll: string;
  bellRemove: string;
  bellNewOrder: string;
  /** The words of the WhatsApp messages sent to customers. See `CustomerWords`. */
  customerWords: import('./whatsapp').CustomerWords;
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

  /** The always-reachable plan-and-payment screen, /owner/<slug>/renew. */
  renewTitle: string;
  renewOpen: string;
  renewPaidUntil: string;
  renewTrialUntil: string;
  renewEarlyHint: string;
  /**
   * Shown instead of `renewEarlyHint` while the shop is still on its free
   * trial, because that sentence is not true for trial days — they are not
   * carried over, and a shop told otherwise would feel cheated on the day it
   * paid.
   */
  renewTrialPayHint: string;
  renewChoosePlan: string;
  renewFits: string;
  renewNoUpi: string;

  /** Paying the operator: choose a plan, send proof, type the code back. */
  close: string;
  payNow: string;
  perMonth: string;
  perYear: string;
  perMonthShort: string;
  twoMonthsFree: string;
  planTooSmall: string;
  upgradeTitle: string;
  upgradeToPay: string;
  upgradeShowQr: string;
  upgradeUpiLabel: string;
  upgradePhoneLabel: string;
  upgradeScreenshot: string;
  upgradeSubmit: string;
  upgradeSubmitHint: string;
  upgradeWaiting: string;
  upgradeCodeSent: string;
  upgradeCodeLabel: string;
  upgradeActivate: string;
  upgradeDone: string;
  upgradeDoneHint: string;
  upgradeRefused: string;

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

  /**
   * THE BILL, OFFERED AFTER THE SALE RATHER THAN DURING IT.
   *
   * Asked for here and nowhere earlier on purpose: the till is the screen most
   * sensitive to speed, and most counter customers do not want a bill. Putting
   * a phone number field in the sale flow would tax every sale to serve a few.
   * So the sale finishes at the speed it always did, and the bill is a tap
   * afterwards for the customer who asks.
   */
  billTitle: string;
  /** Bill popup: a number that belongs to a stored customer, and the quick-pick of regulars. */
  billKnown: string;
  billPickKnown: string;
  /** In the bill message sent on completing an order: the line before the link to the order page. */
  billOrderLink: string;
  /** Bill popup: the customer's name, their para, the next step, the send and PDF buttons. */
  billName: string;
  billArea: string;
  billNext: string;
  billSendWa: string;
  billPdfShare: string;
  /** The floating filter button, and its panel's clear action. */
  filterOpen: string;
  filterClear: string;
  billPhone: string;
  billSend: string;
  billSkip: string;
  /** Says the file downloads and the owner attaches it — see `BillCard`. */
  billHint: string;
  billBadPhone: string;
  billReady: string;
  /** Words printed on the sheet itself. */
  billDoc: string;
  billTotal: string;
  billPaidBy: string;
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
  /** The fold-away line for customers who owe nothing. */
  /** Said when the share sheet cannot take a file and the PDF was downloaded instead. */
  /** The first page of a multi-customer statement: who owes what. */
  khataSummary: string;
  khataPdfAttach: string;
  khataShowSettled: string;
  khataHideSettled: string;
  khataAllSettled: string;
  khataGave: string;
  khataGot: string;
  khataCustomer: string;
  khataPhone: string;
  /** The phone box was refused: an Indian mobile is 10 digits starting 6-9. */
  khataPhoneInvalid: string;
  khataArea: string;
  khataAmount: string;
  /**
   * Writing the khata by voice, for an owner who cannot write it by hand.
   *
   * Every one of these is also said out loud somewhere nearby, so they are kept
   * short: a label a non-reader never reads still has to fit under a button for
   * everybody else.
   */
  khataVoiceTap: string;
  khataVoiceListening: string;
  /** A worked sentence. The single most useful thing on the card. */
  khataVoiceExample: string;
  khataVoiceWhichWay: string;
  khataVoiceOwes: string;
  khataVoicePaid: string;
  khataVoiceYes: string;
  khataVoiceNo: string;
  khataVoiceNoMatch: string;
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
  /** The stock box on an item row, and what a bad number in it says. */
  stockShort: string;
  /** What a bare count means on an item with no pack size: pieces. */
  pieceShort: string;
  stockBadNumber: string;
  /**
   * The same refusal, for a row that has no pack size to measure against.
   *
   * `stockBadNumber` sends the owner to "the pack size" — which is sound advice
   * on the full screen, where that box is the one next door. In simple mode the
   * pack size is deliberately never asked for, so the box does not exist and
   * the advice named something the owner could not see. This says the thing
   * they can actually do instead.
   */
  stockNoPack: string;
  /** Badge on a row that names the same thing as another row. */
  duplicateName: string;

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

  /**
   * Working one order on the Sell screen, instead of flipping between two tabs.
   *
   * An owner with nobody to help reads the order on Orders and picks the goods
   * off the Sell grid, so the order has to be visible on the screen the items
   * are on — see the note at the head of `SellScreen`.
   *
   * NOT "till", in any of the three languages. That is the English word for the
   * cash drawer, it is what this codebase calls the Sell screen internally, and
   * it leaked out onto a button as "Take to till" — then into Bengali and Hindi
   * as the sound of the English word spelled out, টিল and टिल, which mean
   * nothing whatsoever to the person reading them. A shopkeeper does not "take
   * an order to the till"; they pack it. The button says that now.
   */
  orderToTill: string;
  orderTillHeading: string;
  /** Rendered as "3/7 <this>", so it is the word after the count. */
  orderTillProgress: string;
  orderTillLeave: string;
  /** Why a tap on the grid did nothing while an order is loaded. */
  orderTillLocked: string;
  /** The order finished somewhere else between the tap and the screen. */
  orderTillGone: string;
  orderTillDone: string;

  /** Turning an order away removes it from the queue for good. */
  orderRemoved: string;
  /** "{name}" is substituted — the customer who must still be told. */
  orderRemovedTell: string;

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

  /**
   * What came in today, and in what form — the closing question.
   *
   * Lives inside the Khata tab because that tab is already where the shop's
   * money is read, and a fifth tab on a 375px phone is four tabs nobody can
   * hit.
   */
  takingsView: string;
  khataView: string;
  takingsToday: string;
  takingsMonth: string;
  takingsCash: string;
  takingsUpi: string;
  takingsKhata: string;
  takingsTotal: string;
  /** Orders accepted but not yet settled, held out of the total on purpose. */
  takingsPending: string;
  takingsPendingHint: string;
  /** Old credit repaid in the window — money in, but not a sale. */
  takingsCollected: string;
  takingsNothing: string;

  /**
   * The cash drawer, counted.
   *
   * The opening float is the one figure nothing in the database can derive —
   * see `CashDay` — so the day starts by asking for it.
   */
  drawerStartTitle: string;
  drawerStartHint: string;
  drawerStartSave: string;
  drawerStarted: string;
  drawerTitle: string;
  drawerOpening: string;
  drawerCashSales: string;
  drawerCollected: string;
  drawerExpected: string;
  drawerCount: string;
  drawerCountSave: string;
  drawerMatches: string;
  /** "{n} short" / "{n} over" — the amount is substituted. */
  drawerShort: string;
  drawerOver: string;
  /** Why a difference is usually not a mistake. */
  drawerSpentHint: string;
  /** Repayments with no form recorded, so the expected figure is understated. */
  drawerUnknownHint: string;
  drawerEdit: string;
  /** Asked when a repayment is recorded: did it come in cash or by UPI? */
  khataHowPaid: string;

  /** Taking the khata out of Halkhata. */
  khataExport: string;
  khataExportHint: string;
  khataExportCsv: string;
  khataExportPdf: string;
  khataStatement: string;

  /**
   * The shopkeeper's own shutter, and the smallest basket they will pack.
   *
   * Separate from the console's Pause, which an owner can neither see nor undo
   * — see the note on `Shop.ownerClosed`.
   */
  shutterTitle: string;
  shutterOpen: string;
  shutterClosed: string;
  shutterOpenHint: string;
  shutterClosedHint: string;
  shutterOpenAction: string;
  shutterCloseAction: string;
  shutterOpened: string;
  shutterShut: string;

  /** The list of what has run out, to hand a supplier. */
  restockTitle: string;
  restockHint: string;
  restockNone: string;
  restockOut: string;
  restockLow: string;
  restockAll: string;
  restockClear: string;
  restockSend: string;
  restockPdf: string;
  restockPicked: string;
  restockDownloaded: string;
  /** Words that go on the message and the sheet, so the vendor can read them. */
  restockHeading: string;
  restockItemCol: string;
  /** The box where the owner says how much to order, and its column head. */
  restockWanted: string;
  /** The items-screen stat tile for counted items that are running low. */
  runningLowCount: string;
  /** The button on the common-items card that opens the catalogue. */
  starterChoose: string;
  /** Under the supplier list's send button. {n} is how many lines go. */
  restockWillSend: string;
  restockTotal: string;
  restockEmptyLine: string;

  /** Shown when the phone has lost the network. */
  offline: string;
  offlineHint: string;

  /**
   * The "আজকের দোকান" home — the owner's morning briefing and the app's
   * landing screen. A greeting, prioritised cards for what needs attention, the
   * day's takings at a glance, and one big way back to the till.
   */
  todayTitle: string;
  todayGreetingMorning: string;
  todayGreetingAfternoon: string;
  todayGreetingEvening: string;
  todaySubtitle: string;
  /** Prioritised cards. `{n}` is replaced with the count, so word order stays
   *  the shop's language's own. */
  todayOrdersWaiting: string;
  todayOrdersReady: string;
  todayLowStock: string;
  todayKhataOutstanding: string;
  todayDelivery: string;
  /** One obvious action per card. */
  todaySeeOrders: string;
  todaySeeStock: string;
  todaySeeKhata: string;
  todaySellNow: string;
  /** The day's takings, in one glance. */
  todaySalesLabel: string;
  todayCash: string;
  todayUpi: string;
  todayCredit: string;
  /** Shown in place of the cards when nothing needs attention. */
  todayAllQuiet: string;
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
    duplicateRow: 'already on a row above',
    duplicateRowsHint:
      'The same item is on two rows. One item can only have one price — keep the right one and remove the other.',
    simpleModeOn: 'Show less',
    simpleModeOff: 'Show everything',
    moreSettings: 'More settings',

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
    planUpTo: 'Up to {n} items',
    planUnlimitedItems: 'Unlimited items',
    photoUnreadPacket: 'Could not read that packet. Try a closer, straighter photo — or type the name.',
    photoUnreadPhoto: 'Could not read that photo. Try again, or type the name.',
    photoSaveFailed: 'Not saved — check the internet and try again: {names}',
    itemErrPrice: 'Price must be at least ₹0.50',
    itemErrName: 'Name is blank or too long',
    itemErrUnit: 'Pack size is too long or not recognised',
    itemErrStock: 'Stock is not a usable number',
    planIncludes: [
      'QR shop page and printable poster',
      'Voice listing in English, Hindi and Bengali',
      'Unlimited QR orders, straight into your app',
      'A notification on your phone for every new order',
      'Udhaar khata with WhatsApp reminders',
      'Counter sales and the day’s cash drawer',
      'Order history in the app',
      'Bulk price and stock updates',
      'Storefront and owner photos',
      'Support on WhatsApp',
    ],
    outOfStockCount: 'out of stock',
    ofLimit: 'of',

    orders: 'Orders',
    noOrders: 'No orders yet',
    noOrdersHint: 'Orders appear here the moment a customer sends one from your QR.',
    orderNew: 'Order placed',
    orderConfirmed: 'Preparing',
    orderReady: 'Ready',
    orderCompleted: 'Completed',
    ordersHistory: 'Completed orders',
    ordersHistoryHint: 'Completed orders from the last 3 months. Find one by day, week or month, or by name, and tap WhatsApp to send that order\'s bill to the customer.',
    historyToday: 'Today',
    historyYesterday: 'Yesterday',
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
    orderToHelper: 'Send to helper',
    roundHeading: 'orders to deliver',
    roundPickup: 'PICKUP — customer will collect',
    roundNoAddress: 'No address given — call first',
    roundCustomer: 'Customer',
    helperTickHint: 'Tick the orders your helper should take',
    helperSendTicked: 'Send {n} ticked orders to helper',
    ordersLiveTab: 'To do',
    historySearch: 'Name or number',
    historyMonth: 'Month',
    historyAllMonths: 'All 3 months',
    historyRange: 'How far back',
    history7: '7 days',
    history30: '30 days',
    history90: '3 months',
    historyDate: 'Date',
    historyCount: '{n} orders',
    historyClear: 'Show all',
    historyNone: 'No completed orders match this.',
    shortTitle: 'not enough in stock',
    shortLeft: 'In stock:',
    shortAddTitle: 'Add stock now',
    shortAddHint: 'More came in? Write how much, and the sale carries on.',
    shortAddButton: 'Add',
    shortStockAdded: 'stock added',
    shortTellTitle: 'Tell the customer',
    shortTellHint: 'When will it be back? Printed on the bill, and shown to customers on your shop page.',
    shortTellButton: 'Put on bill',
    shortTellNote: 'A word for customers (optional)',
    shortNotedTitle: 'Will be on the bill:',
    billNotAvailable: 'Out of stock — back on',
    bellTitle: 'New orders',
    bellEmpty: 'No orders waiting.',
    bellClearAll: 'Clear all',
    bellRemove: 'Remove',
    bellNewOrder: 'New order',
    customerWords: {
      namaste: 'Namaste',
      received: 'we have received your order. {shop}',
      preparing: 'we have your order and are getting it ready. {shop}',
      settled: 'thank you — your order is settled. {shop}',
      cancelled: 'sorry — we could not take your order this time. {shop}',
      total: 'Total',
      revisedIntro: 'we did not have everything you asked for. {shop}',
      revisedCanSend: 'This is what we can send:',
      revisedMissing: 'Below items not available right now. We will notify you next day:',
      newTotal: 'New total',
      was: 'was',
    },
    noOrdersHere: 'Nothing here right now',
    delivery: 'Delivery',
    pickup: 'Pickup',
    callCustomer: 'Call',
    messageCustomer: 'WhatsApp',

    planLabel: 'Plan',
    /**
     * Reads as "7 days left, then pay".
     *
     * It used to say "days left in your free trial", which was three problems
     * in five words: "free trial" is a software word a shopkeeper has no reason
     * to know, the sentence never said what happens at the end of it, and in
     * Bengali it ran long enough to wrap the banner onto a second line and eat
     * a row of a screen that has real work on it.
     *
     * Each language now says the plain thing in its own way rather than
     * translating the English one — the Bengali and Hindi are literally "after
     * 7 days you will have to pay", which is the fact the owner needs.
     */
    trialDaysLeft: 'days left, then pay',
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

    renewTitle: 'Your plan',
    renewOpen: 'Plan',
    renewPaidUntil: 'Paid until',
    renewTrialUntil: 'Free trial until',
    renewEarlyHint:
      'Paying early costs you nothing — the paid days you have left are added on top of the time you buy.',
    renewTrialPayHint:
      'Your free trial runs to the date above. Paying starts your plan from that day, so nothing is wasted by waiting — and the trial days themselves are not added on top.',
    renewChoosePlan: 'Choose a plan',
    renewFits: 'Fits your shop',
    renewNoUpi:
      'Payment is not set up yet. Please call us and we will take it another way.',

    close: 'Close',
    payNow: 'Pay',
    perMonth: 'For a month',
    perYear: 'For a year',
    perMonthShort: '/month',
    twoMonthsFree: '2 months free',
    planTooSmall: 'too small for your items',
    upgradeTitle: 'Pay for your shop',
    upgradeToPay: 'To pay',
    upgradeShowQr: 'Show the QR to scan',
    upgradeUpiLabel: 'UPI id',
    upgradePhoneLabel: 'Phone',
    upgradeScreenshot: 'Payment screenshot',
    upgradeSubmit: 'I have paid — send for checking',
    upgradeSubmitHint:
      'We check the payment and send you a 4-digit code on WhatsApp. Type it here and your plan turns on.',
    upgradeWaiting: 'We are checking your payment. Your code comes on WhatsApp.',
    upgradeCodeSent: 'We have sent your 4-digit code on WhatsApp.',
    upgradeCodeLabel: '4-digit code',
    upgradeActivate: 'Turn on my plan',
    upgradeDone: 'Your plan is on',
    upgradeDoneHint: 'Thank you. Everything is open again.',
    upgradeRefused: 'We could not confirm your last payment',

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
    billTitle: 'Send a bill',
    billKnown: 'Saved customer',
    billPickKnown: 'Or pick a regular',
    billOrderLink: 'Your order and bill:',
    billName: 'Customer name',
    billArea: 'Area',
    billNext: 'Next',
    billSendWa: 'Send bill on WhatsApp',
    billPdfShare: 'PDF',
    filterOpen: 'Filter',
    filterClear: 'Clear',
    billPhone: "Customer's WhatsApp number",
    billSend: 'Download bill and open WhatsApp',
    billSkip: 'Not now',
    billHint: 'The bill saves to this phone. In WhatsApp, attach it with the 📎 clip.',
    billBadPhone: 'Enter a 10-digit mobile number',
    billReady: 'Bill saved — attach it in WhatsApp',
    billDoc: 'Bill',
    billTotal: 'Total',
    billPaidBy: 'Paid by',
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
    khataSummary: 'Who owes what',
    khataPdfAttach: 'PDF saved — attach it in WhatsApp.',
    khataShowSettled: 'Paid up',
    khataHideSettled: 'Hide paid up',
    khataAllSettled: 'Everybody has paid up.',
    khataGave: 'Gave goods',
    khataSettle: 'Mark fully paid',
    khataPartHint: 'Part payment? Change the amount before tapping.',
    khataNewCustomer: 'Add someone new',
    khataNewHint: 'For a customer not in the book yet. Anyone already listed above is quicker to update on their own row.',
    khataGot: 'Got payment',
    khataCustomer: 'Name',
    khataPhone: 'Phone',
    khataPhoneInvalid: 'A mobile number is 10 digits and starts with 6, 7, 8 or 9.',
    khataArea: 'Area',
    khataAmount: 'Amount (₹)',
    khataVoiceTap: 'Say a name and an amount',
    khataVoiceListening: 'Listening…',
    khataVoiceExample: 'Say: “Rekha, one hundred rupees, due”',
    khataVoiceWhichWay: 'Which way?',
    khataVoiceOwes: 'Took on credit',
    khataVoicePaid: 'Paid back',
    khataVoiceYes: 'Yes, write it',
    khataVoiceNo: 'No',
    khataVoiceNoMatch: 'Nobody in the book by that name. Say the name on its own, or type it below.',
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
      'How much is on the shelf. Write a plain number for the pack size beside it, or write the amount with its unit — 4.5 kg, 700 g, 12. Every sale takes its share off, and at zero the item comes off your shop page on its own. Leave it empty for anything you are not counting.',
    stockSoldOut: 'Sold out — taken off your shop page',
    stockShort: 'Stock',
    pieceShort: 'pc',
    stockBadNumber: 'write a number, or an amount like 4.5 kg that matches the pack size',
    stockNoPack: 'write a plain number — this item has no pack size yet',
    duplicateName: 'listed twice',

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

    orderToTill: 'Pack this order',
    orderTillHeading: 'Packing this order',
    orderTillProgress: 'packed',
    orderTillLeave: 'Leave this order',
    orderTillLocked: 'Finish or leave this order before ringing up anything else.',
    orderTillGone: 'That order is already finished.',
    orderTillDone: 'Order completed',
    orderRemoved: 'Order removed',
    orderRemovedTell: 'Tell {name} it is cancelled.',

    takingsView: 'Money',
    khataView: 'Credit book',
    takingsToday: 'Today',
    takingsMonth: 'This month',
    takingsCash: 'Cash',
    takingsUpi: 'UPI',
    takingsKhata: 'On credit',
    takingsTotal: 'Total business',
    takingsPending: 'Not settled yet',
    takingsPendingHint: 'Orders taken but not finished. Not counted above.',
    takingsCollected: 'Old credit repaid',
    takingsNothing: 'Nothing yet.',

    drawerStartTitle: "Today's cash",
    drawerStartHint: "Type it once, before you open. Without it the day's cash cannot be checked.",
    drawerStartSave: 'Start the day',
    drawerStarted: 'Day started',
    drawerTitle: 'Cash count',
    drawerOpening: 'Started with',
    drawerCashSales: 'Cash sales',
    drawerCollected: 'Repaid in cash',
    drawerExpected: 'Should be in hand',
    drawerCount: 'Count it and type what you found',
    drawerCountSave: 'Save the count',
    drawerMatches: 'It matches.',
    drawerShort: '{n} short',
    drawerOver: '{n} over',
    drawerSpentHint: 'Money you spent from the drawer is not counted here, so short by that much is normal.',
    drawerUnknownHint: '{n} was repaid without saying cash or UPI, so this figure may be low.',
    drawerEdit: 'Change',
    khataHowPaid: 'How did it come in?',

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

    shutterTitle: 'Taking orders',
    shutterOpen: 'Shop is open',
    shutterClosed: 'Shop is closed',
    shutterOpenHint: 'Customers can see your shop and place orders.',
    shutterClosedHint: 'Customers see a closed sign and cannot order. Orders you already have are not affected.',
    shutterOpenAction: 'Open the shop',
    shutterCloseAction: 'Close the shop',
    shutterOpened: 'Shop is open — customers can order',
    shutterShut: 'Shop is closed — customers cannot order',

    restockTitle: 'Order list for your supplier',
    restockHint: 'What has run out, or is about to. Untick anything you are not buying, then send it.',
    restockNone: 'Nothing has run out. Your shelves are full.',
    restockOut: 'finished',
    restockLow: 'left',
    restockAll: 'Tick all',
    restockClear: 'Untick all',
    restockSend: 'Send on WhatsApp',
    restockPdf: 'Download PDF',
    restockPicked: 'ticked',
    restockDownloaded: 'Order list downloaded',
    restockHeading: 'order list',
    restockItemCol: 'Item',
    restockWanted: 'How much',
    runningLowCount: 'running low',
    starterChoose: 'Choose',
    restockWillSend: '{n} items will be sent',
    restockTotal: 'Items',
    restockEmptyLine: 'nothing to order',

    offline: 'No internet',
    offlineHint: 'Showing what was on this phone. Nothing can be added or changed until the signal is back.',

    todayTitle: 'Today',
    todayGreetingMorning: 'Good morning 👋',
    todayGreetingAfternoon: 'Good afternoon 👋',
    todayGreetingEvening: 'Good evening 👋',
    todaySubtitle: 'Here is your shop today',
    todayOrdersWaiting: '{n} orders waiting',
    todayOrdersReady: '{n} ready to hand over',
    todayLowStock: '{n} items running low',
    todayKhataOutstanding: '{n} customers owe money',
    todayDelivery: '{n} deliveries to make',
    todaySeeOrders: 'See orders',
    todaySeeStock: 'See items',
    todaySeeKhata: 'See khata',
    todaySellNow: 'Sell now',
    todaySalesLabel: "Today's sales",
    todayCash: 'Cash',
    todayUpi: 'UPI',
    todayCredit: 'Udhaar',
    todayAllQuiet: 'All caught up — nothing needs attention right now.',
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
    duplicateRow: 'উপরের ঘরে আগেই আছে',
    duplicateRowsHint:
      'একই জিনিস দুটো ঘরে আছে। এক জিনিসের একটাই দাম হয় — ঠিকটা রাখুন, অন্যটা মুছে দিন।',
    simpleModeOn: 'কম দেখান',
    simpleModeOff: 'সব দেখান',
    moreSettings: 'আরও সেটিং',

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
    planUpTo: '{n}টি পর্যন্ত জিনিস',
    planUnlimitedItems: 'যত খুশি জিনিস',
    photoUnreadPacket: 'প্যাকেটটা পড়া গেল না। আরও কাছ থেকে, সোজা করে ছবি তুলুন — বা নামটা লিখে দিন।',
    photoUnreadPhoto: 'ছবিটা পড়া গেল না। আবার চেষ্টা করুন, বা নামটা লিখে দিন।',
    photoSaveFailed: 'সেভ হয়নি — ইন্টারনেট দেখে আবার চেষ্টা করুন: {names}',
    itemErrPrice: 'দাম অন্তত ₹০.৫০ হতে হবে',
    itemErrName: 'নাম খালি বা খুব লম্বা',
    itemErrUnit: 'মাপটা খুব লম্বা বা চেনা যাচ্ছে না',
    itemErrStock: 'স্টকের সংখ্যাটা ঠিক নয়',
    planIncludes: [
      'QR দোকান-পাতা আর ছাপানো পোস্টার',
      'বাংলা, হিন্দি আর ইংরেজিতে মুখে বলে জিনিস তোলা',
      'যত খুশি QR অর্ডার, সোজা আপনার অ্যাপে',
      'প্রতিটি নতুন অর্ডারে ফোনে নোটিফিকেশন',
      'উধার খাতা, WhatsApp-এ মনে করানো সহ',
      'কাউন্টারের বিক্রি আর দিনের ক্যাশ',
      'অ্যাপে অর্ডারের পুরনো হিসেব',
      'একসাথে দাম আর স্টক বদলানো',
      'দোকান আর মালিকের ছবি',
      'WhatsApp-এ সাহায্য',
    ],
    outOfStockCount: 'টি শেষ',
    ofLimit: '/',

    orders: 'অর্ডার',
    noOrders: 'এখনও কোনো অর্ডার নেই',
    noOrdersHint: 'আপনার QR থেকে কেউ অর্ডার পাঠালেই এখানে দেখাবে।',
    orderNew: 'অর্ডার এসেছে',
    orderConfirmed: 'তৈরি হচ্ছে',
    orderReady: 'তৈরি আছে',
    orderCompleted: 'হয়ে গেছে',
    ordersHistory: 'হয়ে যাওয়া অর্ডার',
    ordersHistoryHint: 'গত ৩ মাসের হয়ে যাওয়া অর্ডার। দিন, সপ্তাহ, মাস বা নাম দিয়ে খুঁজুন, আর WhatsApp চেপে সেই অর্ডারের বিল ক্রেতাকে পাঠান।',
    historyToday: 'আজ',
    historyYesterday: 'গতকাল',
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
    orderToHelper: 'হেল্পারকে পাঠান',
    roundHeading: 'অর্ডারের তালিকা',
    roundPickup: 'দোকান থেকে নেবেন',
    roundNoAddress: 'ঠিকানা নেই — আগে ফোন করুন',
    roundCustomer: 'ক্রেতা',
    helperTickHint: 'হেল্পার যে অর্ডার নেবে, সেগুলোতে টিক দিন',
    helperSendTicked: 'টিক দেওয়া {n}টি অর্ডার হেল্পারকে পাঠান',
    ordersLiveTab: 'চলতি অর্ডার',
    historySearch: 'নাম বা নম্বর',
    historyMonth: 'মাস',
    historyAllMonths: 'গত ৩ মাস',
    historyRange: 'কতদিনের',
    history7: '৭ দিন',
    history30: '৩০ দিন',
    history90: '৩ মাস',
    historyDate: 'তারিখ',
    historyCount: '{n}টি অর্ডার',
    historyClear: 'সব দেখান',
    historyNone: 'এই খোঁজে কোনো অর্ডার নেই।',
    shortTitle: 'স্টকে যথেষ্ট নেই',
    shortLeft: 'স্টকে আছে:',
    shortAddTitle: 'এখনই স্টক যোগ করুন',
    shortAddHint: 'নতুন মাল এসেছে? কত এল লিখুন, বিক্রি চলবে।',
    shortAddButton: 'যোগ করুন',
    shortStockAdded: 'স্টক যোগ হয়েছে',
    shortTellTitle: 'ক্রেতাকে জানান',
    shortTellHint: 'কবে পাওয়া যাবে? বিলে লেখা থাকবে, আর দোকানের পাতায় ক্রেতারাও দেখবেন।',
    shortTellButton: 'বিলে লিখুন',
    shortTellNote: 'ক্রেতাদের জন্য একটা কথা (ইচ্ছে হলে)',
    shortNotedTitle: 'বিলে লেখা থাকবে:',
    billNotAvailable: 'স্টকে নেই — পাওয়া যাবে',
    bellTitle: 'নতুন অর্ডার',
    bellEmpty: 'কোনো অর্ডার বাকি নেই।',
    bellClearAll: 'সব মুছুন',
    bellRemove: 'মুছুন',
    bellNewOrder: 'নতুন অর্ডার',
    customerWords: {
      namaste: 'নমস্কার',
      received: 'আপনার অর্ডার পেয়েছি। {shop}',
      preparing: 'আপনার অর্ডার পেয়েছি, তৈরি করছি। {shop}',
      settled: 'ধন্যবাদ — আপনার অর্ডার সম্পূর্ণ হয়েছে। {shop}',
      cancelled: 'দুঃখিত — এবার আপনার অর্ডার নিতে পারলাম না। {shop}',
      total: 'মোট',
      revisedIntro: 'আপনি যা চেয়েছিলেন তার সবটা আমাদের কাছে ছিল না। {shop}',
      revisedCanSend: 'আমরা যা দিতে পারব:',
      revisedMissing: 'নিচের জিনিসগুলো এখন নেই। পরদিন জানিয়ে দেব:',
      newTotal: 'নতুন মোট',
      was: 'আগে',
      unitLocale: 'bn',
    },
    noOrdersHere: 'এখানে এখন কিছু নেই',
    delivery: 'ডেলিভারি',
    pickup: 'দোকান থেকে',
    callCustomer: 'ফোন',
    messageCustomer: 'WhatsApp',

    planLabel: 'প্ল্যান',
    trialDaysLeft: 'দিন পর টাকা দিতে হবে',
    planFull: 'আপনার প্ল্যান ভরে গেছে',
    planUpgrade: 'বাড়ান',
    planExpired: 'আপনার মেয়াদ শেষ। দোকান আর QR চলছে — জিনিস বদলাতে টাকা দিন।',
    renewOnWhatsApp: 'হোয়াটসঅ্যাপে রিনিউ',

    blockTitle: 'আপনার ফ্রি ট্রায়াল শেষ',
    blockTrialOver:
      'আপনার দোকানের পাতা আর QR এখনো চলছে, খদ্দের অর্ডার দিতে পারছেন। জিনিস যোগ বা বদল করতে মাসের টাকা দেওয়া শুরু করুন।',
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

    renewTitle: 'আপনার প্ল্যান',
    renewOpen: 'প্ল্যান',
    renewPaidUntil: 'টাকা দেওয়া আছে',
    renewTrialUntil: 'ফ্রি ট্রায়াল চলবে',
    renewEarlyHint:
      'আগে টাকা দিলে কিছু নষ্ট হয় না — টাকা দেওয়া যে দিনগুলো হাতে আছে, সেগুলো নতুন সময়ের সঙ্গে যোগ হয়ে যায়।',
    renewTrialPayHint:
      'উপরের তারিখ পর্যন্ত আপনার ফ্রি ট্রায়াল চলবে। টাকা দিলে প্ল্যান ওই দিন থেকেই শুরু হবে, তাই অপেক্ষা করলে কিছু নষ্ট হয় না — তবে ট্রায়ালের দিনগুলো আলাদা করে যোগ হয় না।',
    renewChoosePlan: 'প্ল্যান বাছুন',
    renewFits: 'আপনার দোকানের মাপে',
    renewNoUpi:
      'টাকা নেওয়ার ব্যবস্থা এখনো চালু হয়নি। আমাদের ফোন করুন, অন্যভাবে নিয়ে নেব।',

    close: 'বন্ধ করুন',
    payNow: 'টাকা দিন',
    perMonth: 'এক মাসের জন্য',
    perYear: 'এক বছরের জন্য',
    perMonthShort: '/মাস',
    twoMonthsFree: '২ মাস ফ্রি',
    planTooSmall: 'আপনার জিনিস বেশি',
    upgradeTitle: 'দোকানের টাকা দিন',
    upgradeToPay: 'দিতে হবে',
    upgradeShowQr: 'QR দেখুন, স্ক্যান করুন',
    upgradeUpiLabel: 'UPI আইডি',
    upgradePhoneLabel: 'ফোন',
    upgradeScreenshot: 'টাকা দেওয়ার স্ক্রিনশট',
    upgradeSubmit: 'টাকা দিয়েছি — দেখতে পাঠান',
    upgradeSubmitHint:
      'আমরা টাকা দেখে হোয়াটসঅ্যাপে ৪ সংখ্যার কোড পাঠাব। এখানে লিখলেই প্ল্যান চালু হয়ে যাবে।',
    upgradeWaiting: 'আপনার টাকা আমরা দেখছি। কোড হোয়াটসঅ্যাপে আসবে।',
    upgradeCodeSent: 'হোয়াটসঅ্যাপে ৪ সংখ্যার কোড পাঠিয়ে দিয়েছি।',
    upgradeCodeLabel: '৪ সংখ্যার কোড',
    upgradeActivate: 'প্ল্যান চালু করুন',
    upgradeDone: 'প্ল্যান চালু হয়ে গেছে',
    upgradeDoneHint: 'ধন্যবাদ। সব আবার খুলে গেছে।',
    upgradeRefused: 'আপনার আগের টাকা আমরা মেলাতে পারিনি',

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
    billTitle: 'বিল পাঠান',
    billKnown: 'চেনা কাস্টমার',
    billPickKnown: 'বা আগের কাস্টমার বেছে নিন',
    billOrderLink: 'আপনার অর্ডার ও বিল:',
    billName: 'কাস্টমারের নাম',
    billArea: 'পাড়া',
    billNext: 'এগিয়ে যান',
    billSendWa: 'WhatsApp-এ বিল পাঠান',
    billPdfShare: 'PDF',
    filterOpen: 'ফিল্টার',
    filterClear: 'মুছুন',
    billPhone: 'কাস্টমারের WhatsApp নম্বর',
    billSend: 'বিল নামিয়ে WhatsApp খুলুন',
    billSkip: 'এখন নয়',
    billHint: 'বিলটা এই ফোনে নেমে যাবে। WhatsApp-এ 📎 ক্লিপ দিয়ে জুড়ে দিন।',
    billBadPhone: '১০ সংখ্যার মোবাইল নম্বর লিখুন',
    billReady: 'বিল তৈরি — WhatsApp-এ জুড়ে দিন',
    billDoc: 'বিল',
    billTotal: 'মোট',
    billPaidBy: 'যেভাবে দিলেন',
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
    khataSummary: 'কার কত বাকি',
    khataPdfAttach: 'PDF সেভ হয়েছে — WhatsApp-এ জুড়ে দিন।',
    khataShowSettled: 'শোধ হয়ে গেছে',
    khataHideSettled: 'শোধ হওয়াগুলো লুকান',
    khataAllSettled: 'সবাই শোধ করে দিয়েছে।',
    khataGave: 'জিনিস দিলাম',
    khataSettle: 'সব শোধ হয়েছে',
    khataPartHint: 'কিছুটা দিলে? টাকার অঙ্কটা বদলে নিন।',
    khataNewCustomer: 'নতুন কাউকে যোগ করুন',
    khataNewHint: 'যাঁর নাম খাতায় নেই তাঁর জন্য। উপরে নাম থাকলে সেখানেই তাড়াতাড়ি হবে।',
    khataGot: 'টাকা পেলাম',
    khataCustomer: 'নাম',
    khataPhone: 'ফোন',
    khataPhoneInvalid: 'মোবাইল নম্বর ১০ সংখ্যার, আর শুরু হয় ৬, ৭, ৮ বা ৯ দিয়ে।',
    khataArea: 'পাড়া',
    khataAmount: 'টাকা (₹)',
    khataVoiceTap: 'নাম আর টাকা বলুন',
    khataVoiceListening: 'শুনছি…',
    khataVoiceExample: 'বলুন: “রেখা দি একশো টাকা বাকি”',
    khataVoiceWhichWay: 'কোনটা?',
    khataVoiceOwes: 'বাকি নিল',
    khataVoicePaid: 'টাকা দিল',
    khataVoiceYes: 'হ্যাঁ, লিখুন',
    khataVoiceNo: 'না',
    khataVoiceNoMatch: 'খাতায় এই নামে কেউ নেই। শুধু নামটা বলুন, বা নিচে লিখুন।',
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
      'দোকানে কতটা আছে। পাশের মাপ অনুযায়ী শুধু সংখ্যা লিখুন, বা মাপ সমেত লিখুন — 4.5 kg, 700 g, 12। বিক্রি হলেই যতটা গেছে ততটা কমবে, শূন্য হলে জিনিসটা নিজে থেকেই দোকানের পাতা থেকে সরে যাবে। যেটা গুনছেন না, সেটা ফাঁকা রাখুন।',
    stockSoldOut: 'শেষ — দোকানের পাতা থেকে সরে গেছে',
    stockShort: 'কত আছে',
    pieceShort: 'টি',
    stockBadNumber: 'সংখ্যা লিখুন, বা পাশের মাপের সঙ্গে মেলে এমন মাপ — যেমন 4.5 kg',
    stockNoPack: 'শুধু সংখ্যা লিখুন — এই জিনিসের মাপ এখনো দেওয়া হয়নি',
    duplicateName: 'একই নাম',

    pushTitle: 'এই ফোনে আওয়াজ পান',
    pushHint: 'অর্ডার এলে অ্যাপ বন্ধ থাকলেও এই ফোনটা বাজবে।',
    pushOn: 'চালু করুন',
    pushOff: 'বন্ধ করুন',
    pushEnabled: 'এই ফোনে আওয়াজ চালু',
    pushDisabled: 'আওয়াজ বন্ধ',
    pushDenied:
      'আপনার ব্রাউজার এই সাইটের আওয়াজ বন্ধ করে রেখেছে। ব্রাউজারের সাইট সেটিংসে গিয়ে চালু করে আবার চেষ্টা করুন।',
    pushUnsupported: 'এই ব্রাউজারে আওয়াজ আসে না। অর্ডারের পাতা আগের মতোই চলবে।',
    pushFailed: 'চালু করা গেল না। আবার চেষ্টা করুন।',
    pushNotAPromise:
      'কিছু ফোন ব্যাটারি বাঁচাতে এই আওয়াজ আটকে রাখে। “অর্ডার” পাতাটা দেখতে থাকুন — সব অর্ডার সবসময় ওখানেই থাকে।',

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

    orderToTill: 'অর্ডারটা গোছান',
    orderTillHeading: 'এই অর্ডারটা গোছাচ্ছি',
    orderTillProgress: 'গোছানো হয়েছে',
    orderTillLeave: 'এই অর্ডার ছেড়ে দিন',
    orderTillLocked: 'আগে এই অর্ডারটা শেষ করুন বা ছেড়ে দিন, তারপর অন্য কিছু বিক্রি করুন।',
    orderTillGone: 'ওই অর্ডারটা আগেই শেষ হয়ে গেছে।',
    orderTillDone: 'অর্ডার সম্পূর্ণ হল',
    orderRemoved: 'অর্ডার সরানো হল',
    orderRemovedTell: '{name}-কে জানিয়ে দিন যে অর্ডারটা বাতিল।',

    takingsView: 'হিসাব',
    khataView: 'বাকির খাতা',
    takingsToday: 'আজ',
    takingsMonth: 'এই মাস',
    takingsCash: 'নগদ',
    takingsUpi: 'UPI',
    takingsKhata: 'বাকিতে',
    takingsTotal: 'মোট বিক্রি',
    takingsPending: 'এখনও মেটেনি',
    takingsPendingHint: 'অর্ডার নেওয়া হয়েছে, শেষ হয়নি। উপরের হিসাবে ধরা নেই।',
    takingsCollected: 'পুরনো বাকি আদায়',
    takingsNothing: 'এখনও কিছু হয়নি।',

    drawerStartTitle: 'আজকের নগদ',
    drawerStartHint: 'দোকান খোলার আগে একবার লিখুন। এটা না থাকলে হিসাব মেলানো যায় না।',
    drawerStartSave: 'দিন শুরু করুন',
    drawerStarted: 'দিন শুরু হল',
    drawerTitle: 'নগদের হিসাব',
    drawerOpening: 'শুরুতে ছিল',
    drawerCashSales: 'নগদ বিক্রি',
    drawerCollected: 'নগদে আদায়',
    drawerExpected: 'নগদ থাকার কথা',
    drawerCount: 'গুনে দেখুন, কত পেলেন লিখুন',
    drawerCountSave: 'গোনা টাকা লিখুন',
    drawerMatches: 'মিলে গেছে।',
    drawerShort: '{n} কম',
    drawerOver: '{n} বেশি',
    drawerSpentHint: 'গল্লা থেকে যা খরচ করেছেন তা এখানে ধরা নেই, তাই ততটা কম হওয়া স্বাভাবিক।',
    drawerUnknownHint: '{n} আদায়ে নগদ না UPI বলা হয়নি, তাই এই অঙ্কটা কম হতে পারে।',
    drawerEdit: 'বদলান',
    khataHowPaid: 'কীভাবে পেলেন?',

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

    shutterTitle: 'অর্ডার নেওয়া',
    shutterOpen: 'দোকান খোলা',
    shutterClosed: 'দোকান বন্ধ',
    shutterOpenHint: 'খদ্দের আপনার দোকান দেখতে ও অর্ডার দিতে পারছে।',
    shutterClosedHint: 'খদ্দের দেখবে দোকান বন্ধ, অর্ডার দিতে পারবে না। আগের অর্ডারগুলো ঠিকই থাকবে।',
    shutterOpenAction: 'দোকান খুলুন',
    shutterCloseAction: 'দোকান বন্ধ করুন',
    shutterOpened: 'দোকান খোলা — খদ্দের অর্ডার দিতে পারবে',
    shutterShut: 'দোকান বন্ধ — খদ্দের অর্ডার দিতে পারবে না',

    restockTitle: 'দোকানদারের জন্য অর্ডার লিস্ট',
    restockHint: 'যা শেষ হয়ে গেছে বা প্রায় শেষ। যেটা নেবেন না সেটার টিক তুলে দিন, তারপর পাঠান।',
    restockNone: 'কিছুই শেষ হয়নি। সব মজুত আছে।',
    restockOut: 'শেষ',
    restockLow: 'বাকি',
    restockAll: 'সব টিক',
    restockClear: 'সব টিক তুলুন',
    restockSend: 'হোয়াটসঅ্যাপে পাঠান',
    restockPdf: 'PDF নামান',
    restockPicked: 'টিক করা',
    restockDownloaded: 'অর্ডার লিস্ট নেমে গেছে',
    restockHeading: 'অর্ডার লিস্ট',
    restockItemCol: 'জিনিস',
    restockWanted: 'কত লাগবে',
    runningLowCount: 'টি কম আছে',
    starterChoose: 'বেছে নিন',
    restockWillSend: '{n}টি জিনিস পাঠানো হবে',
    restockTotal: 'মোট',
    restockEmptyLine: 'অর্ডার করার কিছু নেই',

    offline: 'ইন্টারনেট নেই',
    offlineHint: 'ফোনে যা ছিল তাই দেখানো হচ্ছে। নেট না আসা পর্যন্ত নতুন কিছু যোগ বা বদল করা যাবে না।',

    todayTitle: 'আজ',
    todayGreetingMorning: 'সুপ্রভাত 👋',
    todayGreetingAfternoon: 'শুভ অপরাহ্ন 👋',
    todayGreetingEvening: 'শুভ সন্ধ্যা 👋',
    todaySubtitle: 'আজকের দোকানের খবর',
    todayOrdersWaiting: '{n}টি Order অপেক্ষা করছে',
    todayOrdersReady: '{n}টি Order তৈরি',
    todayLowStock: '{n}টি মাল কমে গেছে',
    todayKhataOutstanding: '{n} জনের টাকা বাকি',
    todayDelivery: '{n}টি Delivery বাকি',
    todaySeeOrders: 'Order দেখুন',
    todaySeeStock: 'মাল দেখুন',
    todaySeeKhata: 'বাকি দেখুন',
    todaySellNow: 'বিক্রি করুন',
    todaySalesLabel: 'আজকের বিক্রি',
    todayCash: 'ক্যাশ',
    todayUpi: 'UPI',
    todayCredit: 'বাকি',
    todayAllQuiet: 'সব ঠিক আছে — এখন আলাদা করে কিছু করার নেই।',
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
    duplicateRow: 'ऊपर की पंक्ति में पहले से है',
    duplicateRowsHint:
      'एक ही सामान दो पंक्तियों में है। एक सामान का एक ही दाम होता है — सही वाला रखिए, दूसरा हटा दीजिए।',
    simpleModeOn: 'कम दिखाइए',
    simpleModeOff: 'सब दिखाइए',
    moreSettings: 'और सेटिंग',

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
    planUpTo: '{n} सामान तक',
    planUnlimitedItems: 'जितना चाहें उतना सामान',
    photoUnreadPacket: 'पैकेट पढ़ा नहीं जा सका। और पास से, सीधी फ़ोटो लीजिए — या नाम लिख दीजिए।',
    photoUnreadPhoto: 'फ़ोटो पढ़ी नहीं जा सकी। फिर कोशिश कीजिए, या नाम लिख दीजिए।',
    photoSaveFailed: 'सेव नहीं हुआ — इंटरनेट देखकर फिर कोशिश कीजिए: {names}',
    itemErrPrice: 'दाम कम से कम ₹0.50 होना चाहिए',
    itemErrName: 'नाम खाली है या बहुत लंबा है',
    itemErrUnit: 'पैक का साइज़ बहुत लंबा है या पहचाना नहीं गया',
    itemErrStock: 'स्टॉक की संख्या ठीक नहीं है',
    planIncludes: [
      'QR दुकान-पेज और छपने वाला पोस्टर',
      'हिंदी, बांग्ला और अंग्रेज़ी में बोलकर सामान जोड़ना',
      'जितने चाहें QR ऑर्डर, सीधे आपके ऐप में',
      'हर नए ऑर्डर पर फ़ोन में नोटिफ़िकेशन',
      'उधार खाता, WhatsApp पर याद दिलाने के साथ',
      'काउंटर की बिक्री और दिन का कैश',
      'ऐप में ऑर्डर का पुराना हिसाब',
      'एक साथ दाम और स्टॉक बदलना',
      'दुकान और मालिक की फ़ोटो',
      'WhatsApp पर मदद',
    ],
    outOfStockCount: 'खत्म',
    ofLimit: '/',

    orders: 'ऑर्डर',
    noOrders: 'अभी कोई ऑर्डर नहीं',
    noOrdersHint: 'आपके QR से कोई ऑर्डर भेजते ही यहाँ दिखेगा।',
    orderNew: 'ऑर्डर आया',
    orderConfirmed: 'तैयार हो रहा है',
    orderReady: 'तैयार है',
    orderCompleted: 'हो गया',
    ordersHistory: 'पूरे हुए ऑर्डर',
    ordersHistoryHint: 'पिछले 3 महीने के पूरे हुए ऑर्डर। दिन, हफ़्ते, महीने या नाम से खोजें, और WhatsApp दबाकर उस ऑर्डर का बिल ग्राहक को भेजें।',
    historyToday: 'आज',
    historyYesterday: 'कल',
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
    orderToHelper: 'हेल्पर को भेजें',
    roundHeading: 'ऑर्डर की सूची',
    roundPickup: 'दुकान से ले जाएंगे',
    roundNoAddress: 'पता नहीं — पहले फ़ोन करें',
    roundCustomer: 'ग्राहक',
    helperTickHint: 'हेल्पर जो ऑर्डर ले जाएगा, उन पर टिक करें',
    helperSendTicked: 'टिक किए {n} ऑर्डर हेल्पर को भेजें',
    ordersLiveTab: 'चालू ऑर्डर',
    historySearch: 'नाम या नंबर',
    historyMonth: 'महीना',
    historyAllMonths: 'पिछले 3 महीने',
    historyRange: 'कितने दिन का',
    history7: '7 दिन',
    history30: '30 दिन',
    history90: '3 महीने',
    historyDate: 'तारीख',
    historyCount: '{n} ऑर्डर',
    historyClear: 'सब दिखाएँ',
    historyNone: 'इस खोज में कोई ऑर्डर नहीं।',
    shortTitle: 'स्टॉक में कम है',
    shortLeft: 'स्टॉक में है:',
    shortAddTitle: 'अभी स्टॉक जोड़ें',
    shortAddHint: 'नया माल आया? कितना आया लिखिए, बिक्री चलती रहेगी।',
    shortAddButton: 'जोड़ें',
    shortStockAdded: 'स्टॉक जुड़ गया',
    shortTellTitle: 'ग्राहक को बताएँ',
    shortTellHint: 'कब मिलेगा? बिल पर लिखा रहेगा, और दुकान के पेज पर ग्राहक भी देखेंगे।',
    shortTellButton: 'बिल पर लिखें',
    shortTellNote: 'ग्राहकों के लिए एक बात (चाहें तो)',
    shortNotedTitle: 'बिल पर लिखा रहेगा:',
    billNotAvailable: 'स्टॉक में नहीं — मिलेगा',
    bellTitle: 'नए ऑर्डर',
    bellEmpty: 'कोई ऑर्डर बाकी नहीं।',
    bellClearAll: 'सब हटाएँ',
    bellRemove: 'हटाएँ',
    bellNewOrder: 'नया ऑर्डर',
    customerWords: {
      namaste: 'नमस्ते',
      received: 'आपका ऑर्डर मिल गया। {shop}',
      preparing: 'आपका ऑर्डर मिल गया, तैयार कर रहे हैं। {shop}',
      settled: 'धन्यवाद — आपका ऑर्डर पूरा हुआ। {shop}',
      cancelled: 'माफ़ कीजिए — इस बार आपका ऑर्डर नहीं ले पाए। {shop}',
      total: 'कुल',
      revisedIntro: 'आपने जो माँगा, उसमें से सब कुछ हमारे पास नहीं था। {shop}',
      revisedCanSend: 'हम यह भेज सकते हैं:',
      revisedMissing: 'नीचे का सामान अभी नहीं है। अगले दिन बता देंगे:',
      newTotal: 'नया कुल',
      was: 'पहले',
      unitLocale: 'hi',
    },
    noOrdersHere: 'यहाँ अभी कुछ नहीं',
    delivery: 'डिलीवरी',
    pickup: 'दुकान से',
    callCustomer: 'फ़ोन',
    messageCustomer: 'WhatsApp',

    planLabel: 'प्लान',
    trialDaysLeft: 'दिन बाद पैसे देने होंगे',
    planFull: 'आपका प्लान भर गया',
    planUpgrade: 'बढ़ाएँ',
    planExpired: 'आपकी मियाद खत्म। दुकान और QR चालू हैं — सामान बदलने के लिए पैसे भरें।',
    renewOnWhatsApp: 'व्हाट्सएप पर रिन्यू',

    blockTitle: 'आपका फ्री ट्रायल खत्म हो गया',
    blockTrialOver:
      'आपकी दुकान का पेज और QR अभी भी चालू हैं, ग्राहक ऑर्डर दे सकते हैं। सामान जोड़ने या बदलने के लिए महीने के पैसे भरना शुरू कीजिए।',
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

    renewTitle: 'आपका प्लान',
    renewOpen: 'प्लान',
    renewPaidUntil: 'भुगतान इस तारीख तक',
    renewTrialUntil: 'फ्री ट्रायल इस तारीख तक',
    renewEarlyHint:
      'पहले भुगतान करने से कुछ नहीं जाता — आपके बचे हुए भुगतान किए दिन नए समय में जुड़ जाते हैं।',
    renewTrialPayHint:
      'ऊपर दी तारीख तक आपका फ्री ट्रायल चलेगा। भुगतान करने पर प्लान उसी दिन से शुरू होगा, तो इंतज़ार करने में कुछ नहीं जाता — पर ट्रायल के दिन अलग से नहीं जुड़ते।',
    renewChoosePlan: 'प्लान चुनिए',
    renewFits: 'आपकी दुकान के हिसाब से',
    renewNoUpi:
      'भुगतान की व्यवस्था अभी चालू नहीं है। हमें फोन कीजिए, हम दूसरे तरीके से ले लेंगे।',

    close: 'बंद करें',
    payNow: 'पैसे दें',
    perMonth: 'एक महीने के लिए',
    perYear: 'एक साल के लिए',
    perMonthShort: '/महीना',
    twoMonthsFree: '२ महीने फ्री',
    planTooSmall: 'आपका सामान ज़्यादा है',
    upgradeTitle: 'दुकान के पैसे दें',
    upgradeToPay: 'देने हैं',
    upgradeShowQr: 'QR देखिए, स्कैन कीजिए',
    upgradeUpiLabel: 'UPI आईडी',
    upgradePhoneLabel: 'फोन',
    upgradeScreenshot: 'पैसे देने का स्क्रीनशॉट',
    upgradeSubmit: 'पैसे दे दिए — जाँचने भेजें',
    upgradeSubmitHint:
      'हम पैसे देखकर व्हाट्सएप पर ४ अंकों का कोड भेजेंगे। यहाँ लिखते ही प्लान चालू हो जाएगा।',
    upgradeWaiting: 'हम आपके पैसे देख रहे हैं। कोड व्हाट्सएप पर आएगा।',
    upgradeCodeSent: 'व्हाट्सएप पर ४ अंकों का कोड भेज दिया है।',
    upgradeCodeLabel: '४ अंकों का कोड',
    upgradeActivate: 'प्लान चालू करें',
    upgradeDone: 'प्लान चालू हो गया',
    upgradeDoneHint: 'धन्यवाद। सब फिर से खुल गया है।',
    upgradeRefused: 'आपके पिछले भुगतान का मिलान नहीं हो सका',

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
    billTitle: 'बिल भेजिए',
    billKnown: 'पहचाने ग्राहक',
    billPickKnown: 'या पुराने ग्राहक चुनें',
    billOrderLink: 'आपका ऑर्डर और बिल:',
    billName: 'ग्राहक का नाम',
    billArea: 'मोहल्ला',
    billNext: 'आगे बढ़ें',
    billSendWa: 'WhatsApp पर बिल भेजें',
    billPdfShare: 'PDF',
    filterOpen: 'फ़िल्टर',
    filterClear: 'हटाएं',
    billPhone: 'ग्राहक का WhatsApp नंबर',
    billSend: 'बिल डाउनलोड कर WhatsApp खोलें',
    billSkip: 'अभी नहीं',
    billHint: 'बिल इसी फ़ोन में आ जाएगा। WhatsApp में 📎 क्लिप से जोड़ दीजिए।',
    billBadPhone: '10 अंकों का मोबाइल नंबर लिखिए',
    billReady: 'बिल तैयार — WhatsApp में जोड़ दीजिए',
    billDoc: 'बिल',
    billTotal: 'कुल',
    billPaidBy: 'भुगतान',
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
    khataSummary: 'किसका कितना बाकी',
    khataPdfAttach: 'PDF सेव हो गया — WhatsApp में जोड़ दीजिए।',
    khataShowSettled: 'चुकता हो गया',
    khataHideSettled: 'चुकता वाले छिपाएँ',
    khataAllSettled: 'सबने चुका दिया है।',
    khataGave: 'सामान दिया',
    khataSettle: 'पूरा भुगतान हो गया',
    khataPartHint: 'कुछ हिस्सा दिया? रकम बदल लीजिए।',
    khataNewCustomer: 'नया ग्राहक जोड़ें',
    khataNewHint: 'जिनका नाम खाते में नहीं है उनके लिए। ऊपर नाम हो तो वहीं जल्दी होगा।',
    khataGot: 'पैसा मिला',
    khataCustomer: 'नाम',
    khataPhone: 'फ़ोन',
    khataPhoneInvalid: 'मोबाइल नंबर 10 अंकों का होता है और 6, 7, 8 या 9 से शुरू होता है।',
    khataArea: 'इलाक़ा',
    khataAmount: 'रकम (₹)',
    khataVoiceTap: 'नाम और रकम बोलिए',
    khataVoiceListening: 'सुन रहे हैं…',
    khataVoiceExample: 'बोलिए: “रेखा जी सौ रुपये बाकी”',
    khataVoiceWhichWay: 'कौन सा?',
    khataVoiceOwes: 'उधार लिया',
    khataVoicePaid: 'पैसे दिए',
    khataVoiceYes: 'हाँ, लिखिए',
    khataVoiceNo: 'नहीं',
    khataVoiceNoMatch: 'खाते में इस नाम से कोई नहीं। सिर्फ़ नाम बोलिए, या नीचे लिखिए।',
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
      'दुकान में कितना है। बगल के पैक के हिसाब से सिर्फ़ संख्या लिखिए, या माप के साथ लिखिए — 4.5 kg, 700 g, 12। हर बिक्री पर उतना ही कम होगा, और शून्य होते ही चीज़ दुकान के पेज से अपने आप हट जाएगी। जो नहीं गिन रहे, उसे खाली छोड़िए।',
    stockSoldOut: 'खत्म — दुकान के पेज से हट गया',
    stockShort: 'कितना है',
    pieceShort: 'पीस',
    stockBadNumber: 'संख्या लिखिए, या पैक के माप से मेल खाता माप — जैसे 4.5 kg',
    stockNoPack: 'सिर्फ़ संख्या लिखिए — इस चीज़ का माप अभी तय नहीं है',
    duplicateName: 'दो बार है',

    pushTitle: 'इस फोन पर आवाज़ पाइए',
    pushHint: 'ऑर्डर आते ही यह फोन बजेगा, चाहे ऐप बंद हो।',
    pushOn: 'चालू करें',
    pushOff: 'बंद करें',
    pushEnabled: 'इस फोन पर आवाज़ चालू',
    pushDisabled: 'आवाज़ बंद',
    pushDenied:
      'आपके ब्राउज़र ने इस साइट की आवाज़ रोक रखी है। ब्राउज़र की साइट सेटिंग में जाकर चालू कीजिए, फिर दोबारा कोशिश कीजिए।',
    pushUnsupported: 'इस ब्राउज़र में आवाज़ नहीं आती। ऑर्डर पेज पहले की तरह चलता रहेगा।',
    pushFailed: 'चालू नहीं हो सका। दोबारा कोशिश कीजिए।',
    pushNotAPromise:
      'कुछ फोन बैटरी बचाने के लिए यह आवाज़ रोक लेते हैं। “ऑर्डर” पेज देखते रहिए — हर ऑर्डर हमेशा वहीं रहता है।',

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

    orderToTill: 'यह ऑर्डर पैक करें',
    orderTillHeading: 'यह ऑर्डर पैक कर रहे हैं',
    orderTillProgress: 'पैक हुआ',
    orderTillLeave: 'यह ऑर्डर छोड़ें',
    orderTillLocked: 'पहले यह ऑर्डर पूरा करें या छोड़ें, फिर कुछ और बेचें।',
    orderTillGone: 'वह ऑर्डर पहले ही पूरा हो चुका है।',
    orderTillDone: 'ऑर्डर पूरा हुआ',
    orderRemoved: 'ऑर्डर हटाया गया',
    orderRemovedTell: '{name} को बता दें कि ऑर्डर रद्द है।',

    takingsView: 'हिसाब',
    khataView: 'उधार खाता',
    takingsToday: 'आज',
    takingsMonth: 'इस महीने',
    takingsCash: 'नकद',
    takingsUpi: 'UPI',
    takingsKhata: 'उधार में',
    takingsTotal: 'कुल बिक्री',
    takingsPending: 'अभी बाकी है',
    takingsPendingHint: 'ऑर्डर लिए गए हैं, पूरे नहीं हुए। ऊपर के हिसाब में नहीं हैं।',
    takingsCollected: 'पुराना उधार वसूल',
    takingsNothing: 'अभी कुछ नहीं हुआ।',

    drawerStartTitle: 'आज का नकद',
    drawerStartHint: 'दुकान खोलने से पहले एक बार लिखें। इसके बिना हिसाब मिलाया नहीं जा सकता।',
    drawerStartSave: 'दिन शुरू करें',
    drawerStarted: 'दिन शुरू हुआ',
    drawerTitle: 'नकद का हिसाब',
    drawerOpening: 'शुरू में था',
    drawerCashSales: 'नकद बिक्री',
    drawerCollected: 'नकद में वसूल',
    drawerExpected: 'नकद होना चाहिए',
    drawerCount: 'गिनकर देखें, कितना मिला लिखें',
    drawerCountSave: 'गिनती दर्ज करें',
    drawerMatches: 'मिल गया।',
    drawerShort: '{n} कम',
    drawerOver: '{n} ज़्यादा',
    drawerSpentHint: 'गल्ले से किया गया खर्च यहाँ नहीं गिना जाता, इसलिए उतना कम होना सामान्य है।',
    drawerUnknownHint: '{n} की वसूली में नकद या UPI नहीं बताया गया, इसलिए यह आँकड़ा कम हो सकता है।',
    drawerEdit: 'बदलें',
    khataHowPaid: 'कैसे मिला?',

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

    shutterTitle: 'ऑर्डर लेना',
    shutterOpen: 'दुकान खुली है',
    shutterClosed: 'दुकान बंद है',
    shutterOpenHint: 'ग्राहक आपकी दुकान देख और ऑर्डर कर सकते हैं।',
    shutterClosedHint: 'ग्राहक को दुकान बंद दिखेगी, ऑर्डर नहीं कर पाएंगे। पुराने ऑर्डर वैसे ही रहेंगे।',
    shutterOpenAction: 'दुकान खोलें',
    shutterCloseAction: 'दुकान बंद करें',
    shutterOpened: 'दुकान खुली — ग्राहक ऑर्डर कर सकते हैं',
    shutterShut: 'दुकान बंद — ग्राहक ऑर्डर नहीं कर सकते',

    restockTitle: 'सप्लायर के लिए ऑर्डर लिस्ट',
    restockHint: 'जो खत्म हो गया या होने वाला है। जो नहीं लेना उसका टिक हटा दें, फिर भेजें।',
    restockNone: 'कुछ खत्म नहीं हुआ। सब स्टॉक में है।',
    restockOut: 'खत्म',
    restockLow: 'बचा',
    restockAll: 'सब टिक',
    restockClear: 'सब टिक हटाएं',
    restockSend: 'व्हाट्सएप पर भेजें',
    restockPdf: 'PDF डाउनलोड करें',
    restockPicked: 'टिक किए',
    restockDownloaded: 'ऑर्डर लिस्ट डाउनलोड हो गई',
    restockHeading: 'ऑर्डर लिस्ट',
    restockItemCol: 'सामान',
    restockWanted: 'कितना चाहिए',
    runningLowCount: 'कम बचे',
    starterChoose: 'चुनें',
    restockWillSend: '{n} सामान भेजे जाएंगे',
    restockTotal: 'कुल',
    restockEmptyLine: 'ऑर्डर करने को कुछ नहीं',

    offline: 'इंटरनेट नहीं है',
    offlineHint: 'फोन में जो था वही दिख रहा है। नेट आने तक कुछ जोड़ या बदल नहीं सकते।',

    todayTitle: 'आज',
    todayGreetingMorning: 'सुप्रभात 👋',
    todayGreetingAfternoon: 'नमस्ते 👋',
    todayGreetingEvening: 'शुभ संध्या 👋',
    todaySubtitle: 'आज आपकी दुकान का हाल',
    todayOrdersWaiting: '{n} ऑर्डर बाकी हैं',
    todayOrdersReady: '{n} ऑर्डर तैयार',
    todayLowStock: '{n} सामान कम हैं',
    todayKhataOutstanding: '{n} ग्राहकों का उधार बाकी',
    todayDelivery: '{n} डिलीवरी बाकी',
    todaySeeOrders: 'ऑर्डर देखें',
    todaySeeStock: 'सामान देखें',
    todaySeeKhata: 'उधार देखें',
    todaySellNow: 'बिक्री करें',
    todaySalesLabel: 'आज की बिक्री',
    todayCash: 'नकद',
    todayUpi: 'UPI',
    todayCredit: 'उधार',
    todayAllQuiet: 'सब ठीक है — अभी अलग से कुछ करना नहीं है।',
  },
};

export function ownerDict(locale: Locale): OwnerDictionary {
  return OWNER_DICTIONARIES[locale] ?? OWNER_DICTIONARIES.en;
}

export type { OwnerDictionary };
