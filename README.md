# DukaanFlow

## Scan → Select → WhatsApp

QR-to-WhatsApp ordering for Indian kirana shops, tea stalls, roll & momo counters,
home kitchens and bakeries.

The shop owner never logs in and never learns new software. A customer scans the
QR taped to the counter, taps quantities, and the finished order lands in the
owner's WhatsApp as a plain message. One Super Admin runs everything.

---

## What it is — and deliberately is not

| Included | Excluded on purpose |
| --- | --- |
| QR shop page, live total, WhatsApp handoff | Delivery tracking |
| Super Admin CRUD for shops and items | Loyalty, CRM, coupons |
| Owner app: sell, items, orders — in 3 languages | WhatsApp Business API |
| Voice listing and a counter till with UPI QR | Owner self-signup, email accounts |
| Shop QR + UPI payment QR + A4 printable poster | Payment gateway (UPI + manual record instead) |
| Subscription plans metered by catalogue size | Commission on orders — ever |

Keeping this list short is the product.

---

## How it is sold

One price per shop, set by **catalogue size** — the one number a shopkeeper and
DukaanFlow both already understand, and the one that tracks the value of the
software. Orders, customers and QR scans are unlimited on every plan: charging a
shop more for selling more is not a partnership, and a commission model is
exactly what small shops fear about going online.

| Plan | Items | Price |
| --- | --- | --- |
| Free | 25 | ₹0 |
| Starter | 150 | ₹199/month |
| Pro | 2,000 | ₹499/month |

Every shop starts on 14 days of Pro. Payment is UPI, recorded by the Super Admin
in the shop's Subscription panel — [`app/api/admin/shop/[slug]/subscription`](app/api/admin/shop/%5Bslug%5D/subscription/route.ts)
writes the same rows a Razorpay webhook would, so a gateway can take over later
without the rest moving.

Enforcement lives in [`lib/billing.ts`](lib/billing.ts) and runs on every path
that can create an item — the form, voice, the starter catalogue and the bulk
paste. Two rules keep it humane:

- **Editing is not adding.** A shop at its limit can still correct a price;
  only *new* items are refused.
- **A lapsed shop keeps trading.** Its QR, its page and its customers carry on
  working; only item editing stops, and only after a 7-day grace period. Taking
  a live shop offline over a late payment costs the owner real sales, and nobody
  renews software that did that to them.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS · Prisma · Neon Postgres ·
Zod · React Hook Form · qrcode.react · jsPDF · Vercel.

## Architecture rules

- **Reads go straight to Prisma from Server Components.** There is no `GET /api/shop`.
- **Route Handlers exist only for mutations.** Every one is `POST`/`PATCH`/`DELETE`.
- **The server owns money.** The client posts item ids and quantities; prices,
  stock checks and the total are re-resolved from the database in
  [`app/api/order/route.ts`](app/api/order/route.ts). A tampered payload cannot
  change what the shop is asked to charge.
- **Integer rupees end to end.** No floats, no paise.
- **No secrets in the browser.** The only public env var is `NEXT_PUBLIC_BASE_URL`.

### Auth

One fixed username and one password — a single Super Admin, no user table.

```text
username → case-insensitive match against ADMIN_USERNAME (plain text)
password → bcrypt.compare against ADMIN_PASSWORD_HASH   (lib/password.ts, Node only)
        → HMAC-SHA256 signed token                      (lib/auth.ts, Web Crypto)
        → HttpOnly; Secure in prod; SameSite=Lax cookie
        → verified in middleware.ts on the Edge         (no DB hit, no bcrypt)
```

`lib/auth.ts` is deliberately Web-Crypto-only so Edge middleware can import it;
bcrypt lives in `lib/password.ts`, imported solely by the login route. The cookie
signature covers the expiry, so a client cannot extend its own session. Every
mutating handler re-checks auth via `requireAdmin()` — a middleware matcher typo
must not become an open write endpoint.

The username is an identifier rather than a secret, so it is stored in plain
text; only the password is hashed. A wrong username and a wrong password return
the identical message, and a username miss is still compared against a decoy
bcrypt hash so both paths cost the same ~400ms — otherwise an instant rejection
would confirm which usernames exist.

Changing either credential:

```bash
npm run hash -- "new-password"   # → ADMIN_PASSWORD_HASH
# ADMIN_USERNAME is plain text — edit it directly
```

There is no password recovery. Only the bcrypt hash is stored and bcrypt is
one-way, so a forgotten password is replaced, never retrieved.

### Shop owner access

A second, much smaller sign-in. The Super Admin issues a shop a 6-digit PIN;
its owner opens `/owner/<slug>` on their phone and manages that shop's price
list — nothing else.

```text
PIN  → bcrypt.compare against Shop.ownerPinHash   (lib/password.ts)
     → HMAC-signed token `<expiry>.<slug>.<pinVersion>`   (lib/auth.ts)
     → verified on the Edge in middleware.ts      (signature + slug)
     → re-verified on Node in lib/guard.ts        (pinVersion vs ownerPinSetAt)
```

The token carries the shop's slug, so a session for one shop is never
authorisation for another, and `pinVersion` is what makes revocation real:
the token is self-contained and lives 30 days, so without it, clearing a PIN
would leave every phone already holding one signed in for a month. Reissuing
or revoking moves `ownerPinSetAt`, and every older token stops authorising
anything — verified by test, not by hope.

Six digits is only a million codes, so the login route carries two rate-limit
buckets: 5 per 15 minutes per client, and 30 per hour against a given shop no
matter where the attempts come from.

Owners write through the same item endpoints the admin uses, which authorise
per shop via `requireShopWrite(slug)`. Shop settings, QR codes, the WhatsApp
number, deleting a shop and issuing PINs all stay on `requireAdmin`. The PIN is
displayed once, at generation; only its hash is stored.

### CSRF

Cookie-authenticated mutations require `Origin` to match `Host`
([`sameOrigin()`](lib/http.ts)). Browsers cannot forge `Origin` cross-site, so
this blocks classic form-post CSRF without token plumbing.

---

## Project layout

```text
app/
  (customer)/shop/[slug]/page.tsx        Server Component → Prisma → <StoreFront/>
  admin/login|shops/new|shop/[slug]/...  Dashboard, items, QR, A4 poster
  owner/[slug]/sell|inventory|orders     The owner's three screens (PIN or invite)
  join/[token]                           One-time invite link → signs the owner in
  pricing                                Public plans page
  admin.webmanifest|owner.webmanifest    Installable apps (root-served, see below)
  admin-icon|admin-sw.js                 Generated icons, network-only worker
  api/admin/login|logout                 Session
  api/owner/[slug]/login, api/owner/logout   Owner PIN session
  api/admin/shop/[slug]/{items,bulk,pin,invite,sale,order,starter,subscription,images}
  api/order                              Server-priced order + WhatsApp URL
components/customer|admin|ui
lib/  prisma auth password guard http validators whatsapp qr slug money bulk rate-limit i18n
prisma/  schema.prisma  seed.ts
middleware.ts
```

## Data model

`Shop` (unique `slug`, indexed `active` and `subscriptionStatus`; owner PIN,
invite token, photos, locale and billing columns) → `Item` (unique
`shopId+name+unit`, plus optional `nameBn`/`nameHi`,
indexed `shopId`, `shopId+inStock`) → `Order` (immutable `itemsJson` snapshot +
`totalAmount`).

`Sale` records counter sales and `Order` records what arrived from the QR —
separate models because they answer different questions: orders are a queue to
work through, sales are what the day took. `Payment` is the subscription ledger.

Photos are held as resized data URLs on `Shop`, not in a blob store. One ~90 KB
image per shop keeps DukaanFlow deployable with nothing but a database, and the
column takes a URL unchanged if that ever needs to change.

`totalAmount` is the reporting column. Totals are **never** recomputed from
`itemsJson` later — the snapshot records what was quoted, even after prices move.

---

## Quick start

```bash
npm install
cp .env.example .env            # fill DATABASE_URL, DIRECT_URL, COOKIE_SECRET

npm run hash -- "your-strong-admin-password"   # paste output into .env
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

> **Escape the `$` in the hash.** Next.js expands `$name` inside `.env` files, so
> a raw `$2a$12$…` bcrypt hash is silently truncated and the correct password is
> then rejected. Write it as `"\$2a\$12\$…"` in `.env`; paste the **raw** hash
> (no backslashes) into Vercel, where values are never expanded.

Live: <https://dukaanflow.vercel.app>

Locally the dev server answers on `localhost:3000`:

- Customer: <http://localhost:3000/shop/ramu-grocery>
- Admin: <http://localhost:3000/admin>

Generated QR codes and shop links always use `NEXT_PUBLIC_BASE_URL`
(`https://dukaanflow.vercel.app`), never the address you happen to be browsing —
a printed QR has to work for a customer in the street.

Seeded shops: **Ramu Grocery** (Rice ₹68, Dal ₹82, Mustard Oil ₹165, Biscuit ₹20)
and **Tasty Roll Corner** (Egg Roll ₹60, Chicken Roll ₹90, Veg Chowmein ₹80,
Momo ₹70). The seed is idempotent — re-running refreshes prices, never duplicates.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | `prisma generate` + production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run hash -- "pw"` | Print `ADMIN_PASSWORD_HASH` |
| `npm run db:migrate` / `db:deploy` | Migrate (dev / prod) |
| `npm run db:seed` | Seed sample shops |
| `npx tsx scripts/backfill-item-names.ts` | Fill Bengali/Hindi item names (`--write`) |
| `npx tsx scripts/fix-legacy-stock.ts` | Put Re 1 starter items back in stock (`--write`) |
| `npm run purge` | Delete each shop's orders/sales past its subscription year (`-- --write`) |
| `npm run rollup` | Roll a year up into the permanent stat tables (`-- 2026`) |
| `npm run demo` | Create the demo grocery shop (`-- --orders`, `-- --remove`) |
| `npm run vercel:env` | Print deployment-ready env values |
| `npm run db:studio` | Prisma Studio |

---

## The WhatsApp message

Built server-side in [`lib/whatsapp.ts`](lib/whatsapp.ts) from database prices,
then opened as `https://wa.me/91<phone>?text=<encoded>`:

```text
🛒 New Order

Shop: Ramu Grocery

Items
• Rice 1 kg ×2 = ₹136
• Dal 500 g ×1 = ₹80

Total: ₹216

Customer
Name: Rahul
Phone: 9876543210
Address: Dum Dum
Order Type: Delivery

Thank you.
```

WhatsApp treats `* _ ~ \`` as formatting, so admin-entered shop and item names are
neutralised before they reach the message — a stray asterisk cannot reflow an order.

> **One deviation from the original spec:** the `Order Type: Delivery` line. The
> spec's sample message omitted it, but Delivery/Pickup is a required checkout
> field and WhatsApp is the shop's only view of the order — without this line the
> owner cannot tell whether to send a delivery boy. Delete the line in
> `buildOrderMessage()` if you want a byte-exact match to the original format.

---

## The owner's app

Three screens, bottom tabs, one thumb — used standing at a counter while a
customer waits.

**Sell** — the till. Tap items, watch the total, take cash or show a UPI QR
carrying the exact amount so nobody types figures. Each sale is recorded, and
the day's takings sit at the top of the screen. Kept apart from Items on
purpose: selling and cataloguing are different jobs at different moments, and
mixing them means hunting past a form while somebody waits with a ten-rupee
note.

**Items** — the catalogue. Voice listing, the starter catalogue, the full list
with search and inline prices. The typed form starts folded away behind “type
instead”, because on a phone the mic is the primary control.

**Khata** — the udhaar book. The most-asked-for thing in this market, and built
to look like the paper book it replaces: a name, what they took, what they paid,
what is left. Two verbs — *gave goods* and *got payment* — because that is the
whole vocabulary a shopkeeper uses for it. Selling on credit is a payment mode
at the till, so goods leaving on udhaar records the sale and the debt in one
action. Each name carries a WhatsApp reminder with the amount already written.

Balances are always summed from entries and never stored: a running total that
can drift from its own history is how a paper khata starts an argument, and
ending those is the point. The book is also **not gated on the subscription** —
locking a shopkeeper out of their own debts over a late payment would be
indefensible.

**Orders** — what arrived from the QR. Orders still land on WhatsApp; this turns
that thread into a worklist the owner can mark off.

**Today's menu** sits on the till: tick what is ready, and it writes the message
with prices and the shop link. It is a composer, not a sender — WhatsApp will
not let a web page message many people at once, only the paid Business API does
that. So it copies out for a Broadcast List the shopkeeper already knows how to
use, or sends to one saved regular at a time.

Everything an owner reads is in their own language, stored on the shop so it
follows them to any phone: [`lib/owner-i18n.ts`](lib/owner-i18n.ts). The Super
Admin console stays English — that is one operator, not thousands of
shopkeepers.

### Getting the app to the owner

There is no APK to forward. DukaanFlow is a PWA, so what the owner receives is
a link:

1. Super Admin taps **Send app link on WhatsApp** on the shop page.
2. WhatsApp opens, addressed to the shop's own number, message already written.
3. The owner taps the link — it signs them in, spends itself, and drops them on
   their items screen with a walkthrough. No PIN on the first run; the PIN is
   how they come back afterwards.

The link is a 256-bit random token, stored only as a SHA-256 hash, single use,
7-day expiry ([`lib/invite.ts`](lib/invite.ts)).

Once inside, an install card offers to put the shop on the owner's home screen —
given real estate rather than a header button, because "install the app" is what
the WhatsApp message told them to do. Each shop gets its own manifest, named
after the shop and scoped to it, so an installed app opens on that shop's till.
The payoff is the microphone: an installed app keeps the permission between
visits, and an owner who has to grant it every morning stops using voice by the
third day. On iPhone the card says which Share-sheet taps to make, because
Safari offers no install prompt to hook.

Because that link arrives *inside WhatsApp*, whose browser refuses the
microphone, the owner app detects that webview and says so in the owner's
language rather than letting voice fail silently
([`OpenInChromeNotice`](components/owner/OpenInChromeNotice.tsx)). Without it,
the very first thing we ask a shopkeeper to do does nothing at all.

### Starter catalogue

Dictating two hundred items is an evening's work, and an owner facing a blank
list very often just stops. [`lib/starter-catalogue.ts`](lib/starter-catalogue.ts)
holds what each type of shop almost always carries — already named in all three
languages with the right units. The owner ticks what they sell and is left with
the one job only they can do: setting prices.

Starter items arrive **out of stock at ₹1** on purpose. A suggested price is a
wrong price, and nothing reaches a customer until the owner has said what it
costs.

## Admin features

**Shops** — create (auto slug from name, editable, uniqueness enforced), edit,
activate/deactivate, delete (typed-name confirmation), search, counts.

**Items** — add/upsert by `name+unit`, inline price edit (commits on blur/Enter),
stock toggle, delete, categories, search.

**Reports** (`/admin/reports`) — a monthly or yearly business report for **one
shop or one business type**, printable and downloadable as CSV. What sells and
what takes the money; the busiest hour and the busiest weekday, bucketed on the
shop's own clock rather than the server's; the shape of the period day by day or
month by month; WhatsApp orders against counter sales; payment mode, delivery
against pickup, and what became of each order; a shop leaderboard; proven
sellers currently marked out of stock; and items listed that sold nothing.

**Occasions** — what each festival moved, and how that compares with the same
festival last year, from the calendar kept under **Occasions**. **Localities** —
where customers ordered from, by pincode, with the number who left it blank
stated rather than hidden.

Every number comes from the immutable snapshot on each `Order` and `Sale`, so
re-pricing or renaming an item cannot rewrite last month's report.

**Occasions** (`/admin/occasions`) — the Super Admin's festival calendar. An
occasion is **a name**, entered once and never re-entered; one click loads the
36 common Indian ones.

**Nobody types dates.** Fixed festivals (Independence Day, Christmas, Pongal)
are placed by arithmetic on `fixedMonth`/`fixedDay`. Moving ones (Diwali, Eid,
Durga Puja) take their dates from `lib/occasion-dates.ts`, shipped with the
software for 2025–2027 — good to about a day, and overridable per year per
occasion from the list when regional practice differs. `lib/occasions.ts` is the
one place that resolves a name into a span of days; the report and the rollup
both ask it.

`Shop.state` decides which regional occasions reach a shop; a shop with no state
set sees all-India ones only, and an occasion scoped to a state the report does
not cover is dropped rather than shown at ₹0. Totals are rolled up nightly into
`ItemPeriodStat` **before** the retention purge deletes the orders behind them,
which is the only reason a year-over-year comparison is possible at all.

**The order queue** — three states an owner works through: **Order placed** →
**Preparing** → **Completed**, plus Cancelled. Completing asks one question,
*has the customer paid?*, at the only moment the owner knows the answer.

**Unpaid means khata.** Answering "not yet" posts the order total to that
customer's credit book as a DEBIT in the same breath — goods that left the shop
unpaid are a debt whether or not anybody wrote it down, and not writing it down
is what DukaanFlow exists to end. `LedgerEntry.orderId` is unique, so a second
tap cannot double what is owed, and correcting the answer to "paid" lifts the
entry again.

**A chime for new orders** — `NewOrderChime` polls every 20s and rings two
synthesised notes when the unanswered count rises. No audio file: an oscillator
cannot 404 and stays audible on a cheap handset. Browsers refuse sound the user
did not ask for, so the owner arms it with a tap and that tap is what unlocks
the audio; the choice is remembered per device.

**Home delivery is optional per shop.** `Shop.deliveryEnabled` off means the
storefront shows pickup only — no disabled button, which would read as
something that might work later — and `POST /api/order` refuses a DELIVERY
order outright. Hiding is not enforcing.

**Demo shops** — `Shop.isDemo` marks a demonstration shop. Hidden everywhere in
the console by default, behind a toggle on the shops page (a cookie, so the
server can filter in the query rather than shipping rows to hide); shown, they
carry a Demo badge. Reports exclude them unless the toggle is on or the shop is
named outright, so a demo never inflates a live count.

**Three-language item names** — every item carries an English, Bengali and
Hindi name, and the customer page shows the one matching their toggle, falling
back to the primary name when a translation is blank. For everyday kirana and
street-food vocabulary the other two languages fill in by themselves, whether
the name was typed or spoken; compound names translate only when every word is
known, so "Biscuit Pack" becomes "বিস্কুট প্যাকেট" while "Basmati Rice" is
left alone rather than half-translated. `npx tsx scripts/backfill-item-names.ts`
fills in existing rows (`--write` to apply) and lists what it could not.

Category chips translate the same way, from a separate short list — an invented
category shows as typed, because a filter chip reading in English beats one
reading as nonsense.

**Voice management** — tap the mic on the items page and speak one instruction
per sentence, in English, Hindi or Bengali. Three things can be said:

```text
add / re-price   "rice one kg sixty eight rupees"   → Rice · 1 kg · ₹68
                 "basmati rice 5 kg 450 in staples" → Basmati Rice · 5 kg · Staples
out of stock     "rice out of stock" · "चावल खत्म" · "চাল শেষ"
back in stock    "rice in stock" · "आ गया" · "এসে গেছে"
remove           "remove rice" · "चावल हटाओ" · "চাল মুছে দাও"
```

Removal always asks for a spoken yes/no first — it is the one action here that
saying the sentence again cannot put back. Everything else keeps an Undo.

Each sentence upserts through the same `POST /api/admin/shop/<slug>/items`
endpoint as the form, and the phone speaks the result back so the shopkeeper can
stock shelves without looking at the screen.

Speech on a shop floor is not reliable enough to act on blindly, so accuracy is
defended in four places: every alternative the recogniser offers is tried and
the reading that lands on an existing item wins ("Rise 1 kg 68" re-prices Rice
rather than creating a misspelt twin); matching is fuzzy, so "tomatto" still
resolves; a near-but-not-certain match is read back for a spoken yes/no before
anything is saved; and every save keeps an Undo for the session. The parser
([`lib/speech.ts`](lib/speech.ts)) resolves the price as the last number that is
*not* followed by a unit word — so "rice 1 kg 68" prices the item at ₹68, never
₹1 — and refuses rather than guesses when no price was heard. Number words
("sixty eight") and Devanagari/Bengali digits are converted first.

**Bulk update** — paste a list, one line per item:

```text
Prices                Stock
Rice 1 kg = 68        Rice 1 kg = out
Dal 500 g = ₹82       Dal 500 g = in
Oil 1 L = 165         Biscuit Pack = true
```

Price mode creates missing items; stock mode only updates existing ones (a stock
line for an unknown item is a typo, so it is reported, not silently created).
`₹`, commas and `/-` are tolerated. Response: `{updated, created, failed, failedRows}` —
skipped lines are listed back rather than dropped quietly.

**Installable (PWA)** — an "Install app" button in the admin header gives the
shopkeeper a home-screen icon and a standalone window, which is where voice pays
off: an installed app keeps its microphone permission instead of re-asking every
visit. Admin-only by design — the customer shop page links no manifest, because
its whole promise is that there is nothing to install.

The manifest, icons and service worker are served from the site root
(`/admin.webmanifest`, `/admin-icon?size=…`, `/admin-sw.js`) rather than under
`/admin`, because the middleware gate would redirect the browser's
credential-less manifest fetch to the login page. Icons are drawn on the fly with
`next/og`, so there are no binary assets to regenerate when the brand colour
changes. The service worker is network-only — Chrome wants a registered worker
with a fetch handler before offering a real install, but caching admin pages
would risk showing a stale price or a deleted shop.

**QR** — shop QR (`/shop/<slug>`) and UPI QR (`upi://pay?pa=…&pn=…&cu=INR`, no
amount, no gateway), both downloadable as 512px PNG.

**A4 poster** (`/admin/shop/<slug>/poster`) — "Scan to Order" in English, Bengali
and Hindi, shop QR, WhatsApp number, optional UPI QR. Print via the browser for
full multilingual fidelity; the jsPDF export is English-only because jsPDF's
built-in fonts carry no Devanagari or Bengali glyphs and embedding one would add
roughly a megabyte for a rarely-used button.

## Customer experience

Mobile-first, no login. Sticky cart bar, bottom-sheet checkout, out-of-stock items
greyed out with quantity disabled, search + category chips, EN/বাং/हिं toggle
(remembered in `localStorage`), toasts for errors, empty states throughout.

**Voice ordering** — a mic above the item list. "two kg rice and one packet salt"
adds both to the cart; the phone reads back what it added, so a shopper who
cannot read the menu can still order. Clauses split on and/aur/আর, quantity comes
from the spoken number, and a number that merely restates the pack size ("basmati
rice 5 kg") counts as one pack rather than five. Out-of-stock items are excluded
from matching. Recognition follows the EN/বাং/हिं toggle.

The shopper's language need not match the shopkeeper's: a bidirectional synonym
table in [`lib/speech.ts`](lib/speech.ts) covers everyday kirana vocabulary, so
"দুই কেজি চাল" and "दो किलो चावल" both find an item typed as **Rice**. Items
outside the table still match on their own name. Note that Indic vowel signs are
combining *marks*, not letters — the matching regexes keep `\p{M}`, or "चावल"
would be shredded into "च व ल" and match nothing.

Both mics use the browser's built-in `SpeechRecognition` and `speechSynthesis` —
no audio leaves the device and there is no speech API key. Firefox has neither,
so the mic simply does not render there and the typed flows are untouched.
Failures are separated rather than lumped into one "blocked" message: a denied
permission, a page served over plain `http://`, a managed Chrome profile
refusing the speech service, and a dead network each say what they are.

**Same as last time** — a returning shopper is offered their previous basket in
one tap, since that is how a kirana actually works. The last order is kept in
that browser's own storage, not looked up on the server: the page has no login,
and asking for a phone number before showing anything would cost more orders
than it saves.

Name and address are optional; phone is required and normalised — `+91 98765 43210`,
`098765-43210` and `9876543210` all validate to the same 10 digits.

---

## Security notes

- HttpOnly · `Secure` in production · `SameSite=Lax` session cookie, HMAC-signed.
- Login rate-limited to 8 attempts / 10 min per IP; `/api/order` to 12 / 5 min.
- All input validated with Zod on the server; structured `{error, errors}` responses.
- Prisma parameterises every query.
- Item mutations are scoped by `shopId`, so one shop's id cannot touch another's rows.
- Duplicate item ids in an order payload are collapsed before the quantity cap.
- `robots: noindex` — shop pages are for people holding the QR, not for search.

**Known limitation:** the rate limiter is in-memory, so on Vercel it is per
serverless instance rather than global ([`lib/rate-limit.ts`](lib/rate-limit.ts)).
That is an accepted MVP trade-off; swap in Upstash Redis if abuse becomes real.

## Deploying

See [DEPLOYMENT.md](DEPLOYMENT.md) — Neon, migrations, Vercel, env vars, custom
domain, and printing the first QR.

## Roadmap

- **Phase 1 (this repo)** — QR shop page, WhatsApp ordering, admin CRUD, QR generation.
- **Phase 2** — order history views, analytics, richer categories.
- **Phase 3** — item images, variants, multiple branches, owner logins, WhatsApp API.
