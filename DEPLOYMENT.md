# Deploying DukaanFlow

From empty account to a QR printed and stuck on a shop counter. Roughly 30 minutes.

---

## 1. Create the Neon database

1. Sign up at <https://neon.tech> and create a project — name it `dukaanflow`,
   region **AWS ap-south-1 (Mumbai)** so latency stays low for Indian customers.
2. Open **Connection Details** and copy **two** strings:
   - **Pooled** (host contains `-pooler`) → `DATABASE_URL`. Serverless functions
     open and drop connections constantly; the pooler is what keeps Neon from
     running out of them.
   - **Direct** (uncheck "Pooled connection") → `DIRECT_URL`. Prisma Migrate needs
     a direct session because it takes advisory locks the pooler will not carry.
3. Keep `?sslmode=require` on both.

## 2. Configure the local environment

```bash
cp .env.example .env
```

Fill in:

```env
DATABASE_URL="postgresql://…-pooler….neon.tech/dukaanflow?sslmode=require"
DIRECT_URL="postgresql://…….neon.tech/dukaanflow?sslmode=require"
NEXT_PUBLIC_BASE_URL="https://dukaanflow.vercel.app"
```

Generate the two secrets:

```bash
npm run hash -- "your-strong-admin-password"        # → ADMIN_PASSWORD_HASH
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # → COOKIE_SECRET
```

> **The single most common setup failure.** A bcrypt hash starts `$2a$12$…`, and
> Next.js runs variable expansion over `.env` files — so `$2a`, `$12` and the
> following segment are treated as variable names and silently deleted. The app
> then rejects the correct password with "Incorrect password".
>
> In `.env`, escape every `$` as `\$`:
>
> ```env
> ADMIN_PASSWORD_HASH="\$2a\$12\$abcdefghijklmnopqrstuv.EXAMPLEONLY0123456789abcdefghi"
> ```
>
> In **Vercel's env UI, paste the raw hash with no backslashes** — values set
> there are injected straight into `process.env` and are never expanded.
>
> To check what the app actually sees:
>
> ```bash
> node -e "require('@next/env').loadEnvConfig(process.cwd(),true,{info(){},error(){}});const h=process.env.ADMIN_PASSWORD_HASH||'';console.log(JSON.stringify(h),h.length)"
> ```
>
> A correct hash prints as exactly **60** characters.

## 3. Run the migration

```bash
npm install
npx prisma migrate dev --name init
```

This writes `prisma/migrations/` — commit that folder. Production replays exactly
these files rather than inferring a schema.

## 4. Seed sample data

```bash
npm run db:seed
```

Creates **Ramu Grocery** (`/shop/ramu-grocery`) and **Tasty Roll Corner**
(`/shop/tasty-roll-corner`). Idempotent — safe to re-run.

Verify locally:

```bash
npm run dev
```

The dev server itself is served from `localhost:3000` — that address is the local
process, not a setting:

- <http://localhost:3000/shop/ramu-grocery> — add items, send a test order.
- <http://localhost:3000/admin> — sign in with the password you hashed.

Note that QR codes and shop links generated here point at
`https://dukaanflow.vercel.app`, because that is what `NEXT_PUBLIC_BASE_URL`
says. That is intentional — a printed QR must work for a customer in the street,
not only on the machine that generated it. To make QRs point at your laptop for
a scanning test, temporarily set `NEXT_PUBLIC_BASE_URL="http://localhost:3000"`
and restart the dev server.

## 5. Push to GitHub

```bash
git init
git add .
git commit -m "DukaanFlow MVP"
git branch -M main
git remote add origin https://github.com/<you>/dukaanflow.git
git push -u origin main
```

`.env` is gitignored. Confirm with `git status` before pushing — a leaked
`ADMIN_PASSWORD_HASH` plus database URL is full control of every shop.

## 6. Deploy to Vercel

1. <https://vercel.com/new> → import the repository. Framework auto-detects as
   Next.js; leave the build settings alone (`npm run build` already runs
   `prisma generate`, which Vercel's build cache would otherwise skip).
2. Add environment variables (Production **and** Preview):

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | Neon **pooled** string |
   | `DIRECT_URL` | Neon **direct** string |
   | `ADMIN_PASSWORD_HASH` | output of `npm run hash` |
   | `COOKIE_SECRET` | 64 hex characters |
   | `NEXT_PUBLIC_BASE_URL` | `https://dukaanflow.vercel.app` (no trailing slash) |

3. Deploy.

`NEXT_PUBLIC_BASE_URL` is baked into the client bundle at build time and is what
every generated QR points at. **Set it before generating QR codes**, and redeploy
after changing it — otherwise printed posters will point at the old origin.

## 7. Apply migrations to production

Local `.env` already points at the same Neon database, so step 3 covered it. For
later schema changes:

```bash
npx prisma migrate dev --name add_something   # locally, creates the migration
git push                                       # Vercel redeploys
npx prisma migrate deploy                      # apply to production
```

To run migrations automatically on every deploy, change the build command to
`prisma migrate deploy && prisma generate && next build`. Only do this once you
are comfortable that a failed migration blocks the deploy.

## 8. Custom domain

1. Vercel → Project → **Settings → Domains** → add `dukaanflow.in`.
2. At your registrar, add the records Vercel shows — usually an `A` record to
   `76.76.21.21` for the apex, and a `CNAME` to `cname.vercel-dns.com` for `www`.
3. Wait for DNS to propagate; Vercel issues the TLS certificate automatically.
4. Update `NEXT_PUBLIC_BASE_URL` to `https://dukaanflow.in` and **redeploy**.

Short domains matter here: the URL is printed under the QR and read aloud over
the phone.

## 9. Generate the first QR

1. Sign in at <https://dukaanflow.vercel.app/admin>.
2. **+ Add shop** — name, WhatsApp number (10 digits), address, UPI ID. The slug
   auto-fills from the name and stays editable.
3. **Items** — add them one by one, or paste the whole list into **Bulk update**:

   ```text
   Rice 1 kg = 68
   Dal 500 g = 82
   Mustard Oil 1 L = 165
   ```

4. **Edit & QR** → download the shop QR PNG, or **🖨 QR poster** for the A4
   "Scan to Order" sheet in English, Bengali and Hindi. Print it, laminate it,
   stick it on the counter.
5. Scan it with a real phone and send a test order to confirm it lands in the
   shop's WhatsApp.

---

## Operating notes

- **Free-tier sleep.** Neon's free compute suspends when idle; the first request
  after a quiet spell takes a few extra seconds. Paid compute removes this.
- **Changing the admin password.** Re-run `npm run hash`, update the Vercel env
  var, redeploy. Existing sessions stay valid until the 12-hour cookie expires;
  rotate `COOKIE_SECRET` too if you need to invalidate them immediately.
- **Deactivating a shop** (uncheck "Accepting orders") keeps the QR working but
  shows a closed message in all three languages. Use this rather than deleting —
  deletion also removes order history and cannot be undone.
- **Backups.** Neon keeps point-in-time restore on paid plans. On free, take a
  periodic `pg_dump` if any shop's catalogue is expensive to re-enter.
- **If logins fail after deploying**, check `ADMIN_PASSWORD_HASH` first — a
  truncated or shell-expanded `$2a$12$…` value is by far the most common cause.
