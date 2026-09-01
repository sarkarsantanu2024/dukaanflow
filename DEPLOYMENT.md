# Deploying Halkhata

From empty account to a QR printed and stuck on a shop counter. Roughly 30 minutes.

---

## 1. Create the Neon database

1. Sign up at <https://neon.tech> and create a project — name it `halkhata`,
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
DATABASE_URL="postgresql://…-pooler….neon.tech/halkhata?sslmode=require"
DIRECT_URL="postgresql://…….neon.tech/halkhata?sslmode=require"
NEXT_PUBLIC_BASE_URL="https://dukaanflow.vercel.app"
```

Generate the three secrets:

```bash
npm run hash -- "your-strong-admin-password"        # → ADMIN_PASSWORD_HASH
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # → COOKIE_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # → CRON_SECRET
```

`CRON_SECRET` signs the nightly retention purge — see **Data retention** in the
operating notes. It must be identical in `.env` and in Vercel, or the job stops
running and nobody is told.

Then the web push key pair, which is what makes a shopkeeper's phone ring when
an order arrives and tells a customer when theirs is ready:

```bash
node -e "console.log(JSON.stringify(require('web-push').generateVAPIDKeys()))"
```

`publicKey` → `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `privateKey` →
`VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` is who a push service contacts if it
has a problem with our traffic. It takes a `mailto:` or an `https:` URL and
refuses an empty string; **use the site's own URL** —
`https://dukaanflow.vercel.app`. It is already public, it keeps a personal or
work mailbox out of a header sent to Google and Mozilla on every notification,
and it does not go stale when somebody changes job.

In Vercel, `VAPID_PRIVATE_KEY` is the only one of the three that is a secret —
mark it **Sensitive**. `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is compiled into the
JavaScript every customer downloads, so marking it sensitive protects nothing
and only stops you reading it back; `VAPID_SUBJECT` is a public URL.

> **Generate this pair once and never change it.** The key pair is the identity
> every subscription was issued against. Replacing it silently stops every phone
> that has already said yes — no error, no warning, just no more notifications —
> and the browser permission prompt is one-shot, so some of those people can
> never be asked again.

Leaving all three blank is a supported state: push is simply off, and every
screen behaves exactly as it does with it on. Push is an accelerator, never the
system of record.

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
git commit -m "Halkhata MVP"
git branch -M main
git remote add origin https://github.com/<you>/halkhata.git
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
   | `ADMIN_USERNAME` | the login name, e.g. `admin` (plain text) |
   | `ADMIN_PASSWORD_HASH` | output of `npm run hash` |
   | `COOKIE_SECRET` | 64 hex characters |
   | `NEXT_PUBLIC_BASE_URL` | `https://dukaanflow.vercel.app` (no trailing slash) |
   | `NEXT_PUBLIC_SUPPORT_PHONE` | your WhatsApp number, digits only with country code |
   | `CRON_SECRET` | 64 hex characters — without it the nightly purge never runs |
   | `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `publicKey` from the pair above |
   | `VAPID_PRIVATE_KEY` | `privateKey` from the pair above |
   | `VAPID_SUBJECT` | `mailto:you@example.com` |
   | `ANTHROPIC_API_KEY` | optional — only for "Add by photo" |

3. Deploy.

`NEXT_PUBLIC_BASE_URL` is baked into the client bundle at build time and is what
every generated QR points at. **Set it before generating QR codes**, and redeploy
after changing it — otherwise printed posters will point at the old origin.

## 7. Apply schema changes

> **Local `.env` points at PRODUCTION.** That is how, on 2026-08-28, a schema
> command run from a laptop dropped and recreated every table in the live
> database. Until a dev branch exists, every `prisma` command you run here is a
> production operation.
>
> `npm run db:push` (and `db:migrate`, `db:deploy`) now go through
> `scripts/db-target.ts`, which prints the host and **refuses** if it is
> production. Deliberate production work is still possible:
>
> ```bash
> ALLOW_PROD_DB=1 npm run db:push
> ```

### Get yourself a dev branch (do this once)

1. Neon console → this project → **Branches** → **New branch** from `main`.
   Name it `dev`. It is a copy-on-write clone, so it costs almost nothing.
2. Copy its **pooled** and **direct** connection strings.
3. Put them in local `.env` as `DATABASE_URL` and `DIRECT_URL`. Vercel keeps
   pointing at `main` — production is unaffected.
4. Add the new branch host to `PRODUCTION_HOSTS` in `scripts/db-target.ts`?
   No — the opposite: leave that list naming only production, so the guard stays
   quiet on `dev` and loud on `main`.
5. `npm run db:push` now shows `branch: non-production` and runs without a flag.

### The schema change itself

```bash
npm run db:push                # against dev, freely
git push                       # Vercel redeploys the code
ALLOW_PROD_DB=1 npm run db:push  # then production, deliberately
```

Order matters when a change is additive-but-required — a new enum value the new
code writes, say. Apply it to production **before** the code that uses it
deploys, or the first request to use it fails.

To run migrations automatically on every deploy, change the build command to
`prisma migrate deploy && prisma generate && next build`. Only do this once you
are comfortable that a failed migration blocks the deploy.

## 8. Custom domain

1. Vercel → Project → **Settings → Domains** → add `halkhata.in`.
2. At your registrar, add the records Vercel shows — usually an `A` record to
   `76.76.21.21` for the apex, and a `CNAME` to `cname.vercel-dns.com` for `www`.
3. Wait for DNS to propagate; Vercel issues the TLS certificate automatically.
4. Update `NEXT_PUBLIC_BASE_URL` to `https://halkhata.in` and **redeploy**.

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

### Data retention

Each shop keeps the orders and counter sales of its **current subscription
year**. On every anniversary of the day its subscription began, everything from
before that anniversary is deleted. A shop that started in March is cleared each
March, one that started in November each November — the window a shop pays for
is the window it can report on.

The anchor is the earliest `Payment.periodStart` for that shop; a shop that has
never paid falls back to `createdAt`, when its trial began. A shop inside its
first year loses nothing.

Orders and sales are the only two tables that grow without limit, and after a
year they are read by nothing — last year's Tuesday rush does not predict this
year's.

`vercel.json` runs `/api/cron/purge` daily at 20:30 UTC, which is 2 am in the
shop. Vercel signs the call with `Authorization: Bearer $CRON_SECRET`; the route
refuses anything else, and refuses everything when `CRON_SECRET` is unset —
better a job that visibly stops than a URL that anyone can use to delete rows.

**Never purged:** the khata ledger (a balance is summed from its entries, so
dropping old ones changes what a customer owes), payment records (which are also
the anchor this policy is computed from — purging them would move the window),
`ItemPeriodStat` and `AreaPeriodStat` (see below), and shops, items and
customers, which do not grow with trade.

**The rollup runs first, and the order is not negotiable.** The same cron rolls
each year's trade up into `ItemPeriodStat` (per item, per year, and per occasion
inside it) and `AreaPeriodStat` (per pincode, per year) *before* deleting the
rows those totals came from. Reverse the two and a shop's first year is deleted
before it is ever summarised — and unlike raw rows, a summary cannot be
recomputed from nothing afterwards. This is what makes "did Durga Puja sell
better than last year" answerable at all: the second Puja arrives long after the
first one's orders were deleted.

Rolling up by hand, for a year that already happened or after entering its
occasions late:

```bash
npm run rollup            # the current year
npm run rollup -- 2026    # one year
npm run rollup -- 2024 2026
```

**The cost, stated plainly:** once a period falls before a shop's cutoff, no
report can be produced for it. Reports say so themselves rather than showing
zeroes. If more history matters to you, either export the CSVs before they age
out or raise `RETENTION_YEARS` in `lib/retention.ts`.

Run it by hand — a dry run first, which deletes nothing:

```bash
npm run purge            # what would go
npm run purge -- --write # delete
```
