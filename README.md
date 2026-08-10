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
| QR shop page, live total, WhatsApp handoff | POS / billing |
| Super Admin CRUD for shops and items | Delivery tracking |
| Bulk price & stock paste | Loyalty, CRM, coupons |
| Shop QR + UPI payment QR + A4 printable poster | WhatsApp Business API |
| Order snapshots for history | Shop-owner logins, payment gateway |

Keeping this list short is the product.

---

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

One password, no usernames.

```text
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
  api/admin/login|logout                 Session
  api/admin/shop[/[slug][/items|/bulk]]  Shop & item mutations
  api/order                              Server-priced order + WhatsApp URL
components/customer|admin|ui
lib/  prisma auth password guard http validators whatsapp qr slug money bulk rate-limit i18n
prisma/  schema.prisma  seed.ts
middleware.ts
```

## Data model

`Shop` (unique `slug`, indexed `active`) → `Item` (unique `shopId+name+unit`,
indexed `shopId`, `shopId+inStock`) → `Order` (immutable `itemsJson` snapshot +
`totalAmount`).

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

## Admin features

**Shops** — create (auto slug from name, editable, uniqueness enforced), edit,
activate/deactivate, delete (typed-name confirmation), search, counts.

**Items** — add/upsert by `name+unit`, inline price edit (commits on blur/Enter),
stock toggle, delete, categories, search.

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
