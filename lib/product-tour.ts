import { BRAND_NAME } from './brand';
/**
 * The product, in the order it happens to a shopkeeper.
 *
 * This is the script an operator uses on a first call, and the one place the
 * pitch is written down. It lives in `lib` rather than inside the page because
 * it is content, not layout — it gets edited far more often than the component
 * that renders it, and by somebody thinking about selling rather than about
 * React.
 *
 * `screenshot` names a file in `public/tour/`. Missing files are fine: the tour
 * renders a labelled placeholder saying which screen belongs there, so the deck
 * is usable before anybody has taken a single screenshot and improves one image
 * at a time rather than needing all of them at once.
 */

export type TourStep = {
  id: string;
  /** What the shopkeeper is doing, in their words. */
  title: string;
  /** The one-line reason this step exists at all. */
  point: string;
  detail: string;
  /** File name in `public/tour/`, e.g. "01-add-shop.png". */
  screenshot: string;
  /** Who is holding the phone at this moment. */
  actor: 'operator' | 'owner' | 'customer';
};

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'add-shop',
    actor: 'operator',
    title: 'We set the shop up',
    point: 'The shopkeeper does no setup at all.',
    detail:
      'Name, phone, type, address and hours go in from our side. The shop gets a web address of its own — halkhata.app/shop/their-name — and a 6-digit PIN for the owner. Nothing to install, no form for them to fill in.',
    screenshot: '01-add-shop.png',
  },
  {
    id: 'catalogue',
    actor: 'owner',
    title: 'The items go in',
    point: 'This is where shops give up, so there are four ways through it.',
    detail:
      'One tap from the starter catalogue of things a shop of that kind always carries, already named in Bengali, Hindi and English. Or speak them. Or photograph a written list. Or we catalogue it for them for 50 paise an item. Prices are the only thing the owner must set — nothing reaches a customer unpriced.',
    screenshot: '02-items.png',
  },
  {
    id: 'qr',
    actor: 'operator',
    title: 'The QR goes on the counter',
    point: 'The whole distribution model is one printed sheet.',
    detail:
      'An A4 poster with the shop’s own QR, printed from the console. A customer standing at the counter scans it and is looking at that shop’s menu — no app to download, on either side.',
    screenshot: '03-poster.png',
  },
  {
    id: 'storefront',
    actor: 'customer',
    title: 'The customer orders',
    point: 'A web page, in their language, with no sign-up.',
    detail:
      'Items by category with prices and what is out of stock. They pick, choose delivery or collection, and the order arrives with the owner. No account, no app, no payment gateway standing between them and the shop.',
    screenshot: '04-storefront.png',
  },
  {
    id: 'orders',
    actor: 'owner',
    title: 'The owner works the queue',
    point: 'Orders arrive accepted; the app never makes them wait.',
    detail:
      'New, confirmed, completed — in the order a shopkeeper actually works them. Completing an order unpaid posts it straight to that customer’s khata, because goods that left the shop unpaid are a debt whether or not anybody writes it down.',
    screenshot: '05-orders.png',
  },
  {
    id: 'khata',
    actor: 'owner',
    title: 'The khata replaces the notebook',
    point: 'The paper credit book is what every kirana already keeps.',
    detail:
      'One running balance per regular customer, every line dated, and a reminder that goes out on WhatsApp with the amount and the shop’s UPI in it. The balance is always summed from the entries, never stored — a running total that can drift from its own history is how a paper khata starts an argument.',
    screenshot: '06-khata.png',
  },
  {
    id: 'sell',
    actor: 'owner',
    title: 'Counter sales too',
    point: 'So one day’s takings are one number, not two.',
    detail:
      'Ringing up a walk-in customer happens in the same app, cash or UPI. Without it the till would be a separate book again and the reports would only ever see half the shop.',
    screenshot: '07-sell.png',
  },
  {
    id: 'reports',
    actor: 'owner',
    title: 'What sold, and when',
    point: 'The thing a paper book can never tell them.',
    detail:
      'Best sellers, busiest hours, which para orders most, and festival-by-festival comparison year over year — so an owner knows what to stock before Durga Puja rather than after it.',
    screenshot: '08-reports.png',
  },
];

/** The objections that actually come up, and the honest answer to each. */
export const TOUR_ANSWERS: { question: string; answer: string }[] = [
  {
    question: 'Do my customers need an app?',
    answer:
      'No. They scan the QR and a web page opens. Nothing to install and no account to create — that is the entire point of the QR.',
  },
  {
    question: 'Do you take a commission on my orders?',
    answer:
      'Never. You pay a fixed monthly amount for the size of your catalogue and keep every rupee of every order. Orders, customers and QR scans are unlimited on every plan.',
  },
  {
    question: 'What if I stop paying?',
    answer:
      'Your shop page and QR keep working and customers can still order — you only lose the ability to add or change items. After three months with no payment the page stops taking orders, and it comes straight back when you pay. Nothing is ever deleted.',
  },
  {
    question: 'I cannot type. Can I still list my items?',
    answer:
      'Yes. Speak the item names in Bengali, Hindi or English, or tap them from the ready-made list for your kind of shop. If you would rather not do it at all, we will do it for you and charge for the work.',
  },
  {
    question: 'Where does the money from an order go?',
    answer:
      `Straight to you, exactly as it does today — cash at the counter or your own UPI. ${BRAND_NAME} never touches your customers’ money.`,
  },
];
