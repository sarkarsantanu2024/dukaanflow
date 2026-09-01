# Halkhata / DukaanFlow — End-to-End QA Report

**Target:** https://dukaanflow.vercel.app/
**Date:** 2026-09-01
**Method:** live browser automation (Playwright + Chromium 1.62), two independent
browser contexts (separate cookie jars) for customer and owner/admin, real form
input, real orders placed and worked through to completion.
**Evidence:** 14 raw result files (`p*.json`) and 89 screenshots in this folder.

> **Version skew — read this first.** The live deployment is the build as
> deployed, *not* the current working tree. Fixes made locally during this
> session (WhatsApp-ordering copy, voice quantity parsing) are **not live yet**.
> Every finding below was reproduced against the live site.

## Amendments after re-verification (2026-09-01, same day)

The findings were re-checked against the source before being fixed. Three
changed:

- **BUG-008 (emoji stripped) is WITHDRAWN — a false positive.** The emoji
  survives: `চিনি 🍬` is intact in storage, on the owner's Sell screen and in
  the admin list. What I saw on the Bengali storefront was `nameBn`, the
  canonical translation the vocabulary fills in automatically, not a stripped
  primary name. Nothing in the codebase strips emoji.
- **BUG-004 is narrower than first written.** The form does handle 422s and a
  toast *did* appear; my text scan missed it because the message is the generic
  "Please check the highlighted fields". The real defect: the API's field key is
  `pricePaise` and the form renders `errors.price`, so the field was never
  highlighted — a toast promising a highlight that does not exist.
- **BUG-002 is re-framed.** A "your order is ready" message and push already
  existed; both were keyed to COMPLETED, which also means handed-over-and-paid.
  So the defect is not a missing message but a missing *state*: there was no way
  to say "packed, on the counter, not yet paid", and telling the customer
  required first declaring the order done and answering for money nobody had
  handed over.

Revised totals: **137 passed, 9 failed, 7 blocked.**

## Fix status

| Bug | Severity | Status |
|---|---|---|
| BUG-001 stale orders screen | P1 | Fixed in tree — 20 s visibility-gated poll, refresh on focus, one-off new-order toast |
| BUG-002 no READY state | P1 | Fixed in tree — **needs `prisma db push` before deploy** |
| BUG-003 WhatsApp-ordering copy | P2 | **Deployed and verified live** |
| BUG-004 swallowed validation error | P2 | Fixed in tree — field keys mapped, specific message in the toast |
| BUG-005 `html lang` | P3 | Fixed in tree — `useHtmlLang` on storefront, track and owner app |
| BUG-006 customer 404 for admin URLs | P3 | Fixed in tree — console 404 page + `/admin/shops` and `/owner/<slug>/items` redirects |
| BUG-007 completed reads "on its way" | P3 | Fixed in tree — new `trackStateDone` in all three languages |
| BUG-008 emoji stripped | — | **Withdrawn, false positive** |
| BUG-009 small tap targets | P3 | Fixed in tree — language pills 44×40, phone links 44 tall |
| BUG-010 plan named "EX" | P4 | Fixed in tree — reads "Business" (enum value unchanged) |
| OPS-001 admin/admin | P1 | **Open — operator action only** |

## Live verification after deploy (2026-09-01)

Every fix re-tested against the deployed site, in two independent browser
sessions, on a throwaway shop that was deleted afterwards:

| Check | Result |
|---|---|
| New order on an untouched owner screen | **12 s** (was: never seen in 120 s) |
| "Ready — tell them" → status | READY |
| Mark done → Cash → status | COMPLETED |
| Customer track at READY | "Ready and on its way to you." |
| Customer track at COMPLETED | "Done — thank you. This order is settled." |
| Price of 0 on the item form | "Price must be at least 50 paise", field marked invalid |
| `html lang` on the Bengali storefront | `bn` |
| Sub-32 px tap targets on `/shop` | 0 (was 5) |
| `/admin/shops`, `/owner/<slug>/items` | redirect to `/admin`, `/inventory` |
| Top plan name | "Business" |
| ₹1,500/kg posto, 250 g | basket ₹375, server 37,500 paise |

One new defect was found *by* this verification and fixed: a weighed line printed
its pack size beside the amount — "· 1 kg 250 g" — which reads as 1.25 kg.

Web push delivery and voice recognition remain **BLOCKED** here (no push service
and no audio pipeline in headless Chromium). The READY push is sent server-side
by the same code path that already sent the completion push, so it is wired, but
delivery to a handset is unverified.

**Note on the ready WhatsApp button:** it appears for **pickup** orders whose
customer cannot be reached by push — by existing design, a delivery order gets no
"it is on its way" message because the bag arriving is the message. The READY
push itself is sent for both. If you want the WhatsApp hand-off on delivery
orders too, that is a one-line change to `worthMessaging`.

---

## A. Executive Summary

| Dimension | Score | Why |
|---|---|---|
| Overall status | **PASS WITH ISSUES** | The money path, the order lifecycle and access control are correct. Two workflow-level defects stand between this and "ready". |
| Functional quality | 8/10 | Order maths, persistence, payment gating, revise and cancel all correct. Silent validation failure and a stale owner screen cost it. |
| UI/UX quality | 8/10 | Genuinely good copy and shop-owner framing; a few silent states. |
| Mobile quality | 9/10 | No horizontal overflow at any of 9 viewports; customer flow is thumb-friendly. |
| Reliability | 8/10 | No duplicate orders under double-click or refresh; data consistent across every surface checked. |
| Security posture | 9/10 | No XSS, no IDOR, correct 401s, rate limiting, httpOnly+Secure cookies. |
| Accessibility | 7/10 | Icon buttons named, focus visible, alt text present; `lang` attribute wrong, some small targets. |

**Recommendation: READY WITH MINOR FIXES** — with the caveat that BUG-001 and
BUG-002 are workflow gaps rather than cosmetic, and BUG-002 is a product
decision, not just a code fix.

---

## B. Feature Coverage

| Module | Tested | Passed | Failed | Blocked |
|---|---:|---:|---:|---:|
| Public pages / SEO | 6 | 6 | 0 | 0 |
| Authentication | 15 | 15 | 0 | 0 |
| Authorization / IDOR | 9 | 9 | 0 | 0 |
| Admin console pages | 7 | 7 | 0 | 0 |
| Shop CRUD | 4 | 4 | 0 | 0 |
| Item CRUD + validation | 16 | 14 | 2 | 0 |
| Customer QR ordering | 14 | 14 | 0 | 0 |
| Order lifecycle | 12 | 11 | 1 | 0 |
| Payment / khata | 5 | 5 | 0 | 0 |
| WhatsApp hand-offs | 5 | 3 | 2 | 0 |
| Push notifications | 6 | 2 | 0 | 4 |
| Voice | 4 | 1 | 0 | 3 |
| Responsive (9 viewports × 3 pages) | 27 | 27 | 0 | 0 |
| Accessibility | 9 | 7 | 2 | 0 |
| Performance | 8 | 8 | 0 | 0 |
| Pricing content | 6 | 3 | 3 | 0 |
| **Total** | **153** | **136** | **10** | **7** |

---

## C. Confirmed Bugs

### BUG-001 — A new order never reaches an owner who is already looking at the Orders screen

**Severity:** P1
**Module:** Owner app — Orders
**Page:** `/owner/<slug>/orders`
**User Role:** Shop owner
**Environment:** Chromium 1.62, desktop 1440×900 (owner) + 390×844 (customer), two independent contexts
**Precondition:** Owner signed in and parked on the Orders screen; a customer orders from another browser session.

**Steps to Reproduce:**
1. Owner session: open `/owner/<slug>/orders` and leave it open. Note the waiting count.
2. Customer session (separate context, no login): open `/shop/<slug>`, add an item, place the order. Confirm the order is created (200 + `orderId`).
3. Do **not** touch the owner screen. Watch it.
4. Sample the owner DOM every 5 s for 2 minutes.

**Expected Result:** The order appears, or at minimum the waiting count / header badge increments, without the owner touching anything. The product's own copy promises this ("the header bell counts them from every screen and can chime").

**Actual Result:** For the full 120 s the new customer's name never appeared and the count stayed at its old value. A manual reload shows the order immediately. There is no polling, no SSE and no websocket — the only refresh in the owner app is `router.refresh()` after the owner's *own* action.

**Reproducibility:** Always

**Impact:** During a rush, an owner watching the screen believes there are no new orders. The only alert is a web push, which requires notification permission, a working service worker and a phone that delivers it — on the Xiaomi/Realme handsets this product targets, push is frequently dropped. When push fails, the order is silently invisible until someone reloads.

**Evidence:** `p8-status-realtime.json` → `realtime.samples` (24 samples, `seen: 0`, `badge: 1` throughout), `realtime.noticedWithoutRefreshMs: null`. Contrast `p7-lifecycle.json` → `owner.sawWithoutRefresh: false` then `owner.afterRefresh` containing the order.

**Suggested Fix:** Poll the orders route every 15–20 s while the tab is visible (`document.visibilityState === 'visible'`), or subscribe to a lightweight SSE endpoint. Cheap version: `setInterval(() => router.refresh(), 20000)` gated on visibility, plus a "new order" chime already present in the copy.

---

### BUG-002 — No READY state, and no way to tell the customer their order is ready

**Severity:** P1 (workflow gap)
**Module:** Order lifecycle
**Page:** `/owner/<slug>/orders`
**User Role:** Shop owner → customer
**Precondition:** An order exists in Preparing.

**Steps to Reproduce:**
1. Place an order as a customer.
2. Owner: open the order. Enumerate every control on it.
3. Look for a "Ready" action and for a WhatsApp action addressed to *that customer* saying the order is ready.

**Expected Result (per the intended workflow):** NEW → PREPARING → **READY** → *WhatsApp the customer* → PAYMENT CONFIRMED → COMPLETED.

**Actual Result:** The live statuses are `NEW`, `CONFIRMED` ("Preparing"), `COMPLETED`, `CANCELLED`. Orders are created directly as CONFIRMED, so NEW never appears in practice and there is no Accept step. The only per-order controls are **Change amounts**, **Mark done**, **Cancel order**. There is no READY state and no "your order is ready" message. The customer-addressed WhatsApp links that *do* exist are only for:
- an order the shop **cut down** — `wa.me/91…?text=Namaste QA Fourth, we did not have everything you asked for… New total: ₹120` (correct and well written), and
- a cancellation.
The other WhatsApp link is a **delivery round list** with *no recipient* (`wa.me/?text=…`), intended for a delivery helper.

**Reproducibility:** Always

**Impact:** The customer is never told their order is ready. In a pickup shop that is the single most important message in the whole flow — the customer is waiting at home for it. Marking done also collapses two distinct events ("ready" and "handed over + paid") into one, so the owner cannot use the queue to see what is waiting on the counter for collection.

**Evidence:** `p9-lifecycle-bn.json` → `steps[].buttons`; `p11-refresh-whatsapp.json` → `revise.whatsappLinks` (shows the two links that exist and their exact text); `prisma/schema.prisma` `enum OrderStatus`.

**Suggested Fix:** Add `READY` between CONFIRMED and COMPLETED, with a per-order "Ready — tell the customer" button that opens `wa.me/<customerPhone>?text=…` with a ready message in the shop's language, plus a push to the customer (the push plumbing for customers already exists — it is used for the revised-order notice). Keep "Mark done" as the paid/handed-over step it already is.

---

### BUG-003 — Pricing page and reports describe orders arriving on WhatsApp

**Severity:** P2 (product content; misleading at the point of sale)
**Module:** Marketing / reports copy
**Page:** `/pricing`, `/admin/reports`, owner till note
**User Role:** Prospective shop owner, Super Admin

**Steps to Reproduce:**
1. Open `/pricing`. Read the Basic plan feature list, the comparison table and step 4 of "How it works".

**Expected Result:** Copy describes the real flow: QR ordering → order in the app → push notification → WhatsApp only for telling the customer.

**Actual Result (live):**
- "Unlimited orders on WhatsApp" (Basic plan feature)
- "Orders on WhatsApp, unlimited" (comparison table row)
- "Customers scan the QR, choose, and **the order arrives on your WhatsApp**." (How it works, step 4)
- `/admin/reports` labels the QR revenue channel "WhatsApp orders" (also in the CSV export)
- The owner's till note said "WhatsApp orders are paid for on the Orders page"

**Reproducibility:** Always

**Impact:** Sets every new shop owner up to watch the wrong screen, and to conclude the app has lost an order when nothing appears in WhatsApp. It also undersells the actual differentiator (an order queue in the owner's own app).

**Evidence:** `p1-recon-auth.json`; full live text captured — 9 WhatsApp mentions on `/pricing`, of which 3 are wrong.

**Status:** **Fixed in the working tree during this session** (`lib/plans.ts`, `app/pricing/page.tsx`, `app/admin/reports/page.tsx`, `lib/report-csv.ts`, `lib/owner-i18n.ts`, `README.md`). Awaiting deploy. "Start on WhatsApp", "You get a link on WhatsApp" and "Priority support on WhatsApp" were left alone — those are true.

---

### BUG-004 — A rejected item save tells the admin nothing at all

**Severity:** P2
**Module:** Admin — Items
**Page:** `/admin/shop/<slug>/items` → "Type instead"
**User Role:** Super Admin (and the same form is the owner's inventory path)

**Steps to Reproduce:**
1. Open the items page, click **Type instead**.
2. Name `QA Zero`, Price `0`, Unit `1 kg`. Click **Save item**.
3. Sample the page every 250 ms for 4 s. Repeat with `-10`, `abc`, `99999999`.

**Expected Result:** The server's own message ("Price must be at least 50 paise" / "Price looks too large") is shown on the price field or as a toast.

**Actual Result:** The API returns **422** with exactly that message in the body, and the UI shows **nothing** — no toast, no field error, no `aria-invalid`, no change of any kind. The form sits there looking as though the click did not register. Reproduced 4/4.

**Reproducibility:** Always (4/4 price cases)

**Impact:** The very first thing a shop owner does is add items. A typo'd price produces a dead button. Nothing tells them what to change, and the natural conclusion is that the app is broken.

**Evidence:** `p6-validation-repro.json` → each entry has `api[0].status: 422` with the message, and `visibleMessages: []`. Screenshots `reject-*.png`.

**Suggested Fix:** In the item form's save handler, read `payload.errors` from the 422 and set the field error (the `Input` component already renders `error`), falling back to a toast with `payload.error`.

*Note:* an empty name is handled correctly by the browser's own `required` validation — that case is not part of this bug.

---

### BUG-005 — `<html lang="en">` on pages rendered in Bengali or Hindi

**Severity:** P3 (accessibility)
**Module:** Customer storefront, owner app
**Steps:** Open `/shop/<slug>` (default language is Bengali) → inspect `document.documentElement.lang`.
**Expected:** `lang="bn"` when the page is Bengali, `hi` for Hindi.
**Actual:** Always `en`, while the visible text is Bengali (confirmed: `hasBengali: true`, `htmlLang: "en"`).
**Impact:** A screen reader pronounces Bengali text with an English voice — unintelligible. Affects exactly the low-literacy users voice ordering is built for.
**Evidence:** `p13-owner-pin-voice.json` → `lang.shop`.
**Suggested Fix:** Set `lang` on the `<html>` element (or the nearest wrapper) from the active locale.

---

### BUG-006 — The 404 page tells admins their "shop link may be wrong"

**Severity:** P3
**Module:** Global not-found
**Steps:** Signed in as admin, open `/admin/shops` (a plausible URL — the nav says "Shops"); or as owner, `/owner/<slug>/items`.
**Expected:** A 404 that fits the context, or a redirect to the real page (`/admin` and `/owner/<slug>/inventory` respectively).
**Actual:** The customer-facing 404: "This shop link may be wrong or the shop is no longer listed."
**Impact:** Confusing rather than harmful. Both URLs are guessable from the UI's own vocabulary.
**Evidence:** `p1-recon-auth.json` (protected paths), `p14-pin-voice.json` → `owner.screens[items].status: 404`.

---

### BUG-007 — A completed, paid order still tells the customer it is "on its way"

**Severity:** P3
**Module:** Customer tracking
**Page:** `/track/<id>`
**Steps:** Complete an order as the owner (Mark done → Cash), then open the customer's track link.
**Expected:** Something final — "Completed", "Handed over", "Thank you".
**Actual:** "Ready and on its way to you." for an order that is COMPLETED and paid.
**Evidence:** `p11-refresh-whatsapp.json` → `track['order3 completed']`.
**Suggested Fix:** Add a COMPLETED string for the customer; keep "on its way" for the ready/dispatched state (which is also BUG-002's missing state).

---

### BUG-008 — Emoji silently dropped from item names

**Severity:** P3
**Steps:** Add an item named `চিনি 🍬`. Check the storefront.
**Actual:** Saved and displayed as `চিনি` — the emoji is stripped with no message. Trailing/leading spaces are also trimmed (that part is correct and desirable).
**Impact:** Minor. Sanitising is defensible; doing it silently is the issue.
**Evidence:** `p5-items.json` → `storefront.text`.

---

### BUG-009 — Sub-32 px tap targets on the storefront

**Severity:** P3
**Steps:** Load `/shop/<slug>` at 360–430 px, measure interactive elements.
**Actual:** 5 controls under 32 px in either dimension (the EN/বাং/हिं language pills and similar), 1 on `/pricing`. WCAG 2.5.8 asks for 24 px minimum, and 44 px is the practical phone target.
**Evidence:** `p12-platform.json` → `responsive[*].pages[shop].smallTargets: 5` at every viewport.

---

### BUG-010 — Plan named "EX", and item limits below the benchmark

**Severity:** P4 (enhancement / product)
**Actual:** The top plan is displayed as **"EX"** — not a word a shopkeeper can interpret. Limits are 25 / 100 / 250 / 1,000 items at ₹99 / ₹149 / ₹249 / ₹449.
**Evidence:** live `/pricing` text; `lib/plans.ts`.
See §J for the pricing evaluation.

---

## D. Potential Issues / Needs Verification

| # | Item | Why unresolved |
|---|---|---|
| V-1 | **Web push delivery end to end** | BLOCKED. Headless Chromium reports `Notification.permission: "denied"` even with the permission granted to the context, no `PushManager` subscription is created, and no VAPID exchange occurs. The *plumbing* verified: service worker registers (scope `/owner/<slug>/`), the "Turn on" control exists, and the permission-blocked path shows a clear, actionable message. Delivery, duplicate-notification behaviour, click-through and PWA-background behaviour all need a real device. |
| V-2 | **Voice ordering / voice item entry** | BLOCKED. `SpeechRecognition` exists in headless Chromium but no audio pipeline or Google speech service is available; clicking the mic produced no recognition and no error bubble within 8 s. Needs a real Chrome with a microphone. Note the *parser* behind it was tested separately at unit level this session and had severe defects (see §J, "Already fixed locally"). |
| V-3 | **Cross-browser** | BLOCKED. Only Chromium was installed. Firefox/WebKit/Edge untested — relevant because voice is Chrome-only and the app says so. |
| V-4 | **"Send list on WhatsApp" has no recipient** | `wa.me/?text=…` opens a contact chooser. Almost certainly intended (the owner picks the delivery helper), but it is worth confirming that is the design. |
| V-5 | **Real network failure paths** | The offline WhatsApp fallback in the customer checkout was not triggered; simulating a mid-submit connection drop against production risked creating half-orders on a live shop. Code path exists and is well commented. |
| V-6 | **Rate limiter reset window** | Login is 8 attempts / 10 min per IP (confirmed by tripping it). Not verified whether a legitimate owner locked out gets any hint of how long to wait — the message says only "Please wait and try again." |

---

## E. UI/UX Findings

### Good
- Copy is written for a shopkeeper, not a developer: "Short of something? Lower the amount here instead of cancelling", "The customer is not served and the order cannot be brought back".
- The revise flow is excellent: `+` is capped at what was ordered, so a shop can only ever cut; the resulting customer WhatsApp message explains what changed and the new total; the customer's track page shows "The shop changed this order".
- Payment is a deliberate question (Cash / UPI / Udhaar) rather than a silent completion, and "Udhaar" posts straight to the khata.
- Three-language switching works everywhere, item names included, and the owner's language is stored on the shop so it follows them between phones.
- Destructive actions are guarded by the app's own dialog (not `window.confirm`), so they speak the user's language.
- The customer needs no login, no app and no payment gateway to order.

### Problems
- Silent failures: rejected item saves (BUG-004); emoji stripping (BUG-008).
- The owner's Orders screen is a stale snapshot (BUG-001).
- Item entry is mic-first; the typed form hides behind **"Type instead"**. Reasonable for the product's thesis, but a first-time owner in a noisy shop may not find it.
- No READY state means the queue cannot answer "what is waiting on the counter?" (BUG-002).
- The 404 speaks only to customers (BUG-006).

### Recommendations
1. Surface every server validation error on the field that caused it.
2. Poll the orders screen while visible; chime once per new order.
3. Add READY + "tell the customer" as the WhatsApp moment.
4. Give the customer a final state on the track page.
5. Raise the language pills and other small controls to 44 px.

---

## F. Security Findings

### Confirmed good (no issues found)
| Check | Result |
|---|---|
| XSS via item name (`<script>alert(1)</script>`) | Stored, then rendered as **text** on storefront, admin and owner screens. No dialog fired, no raw tag in the DOM. |
| Unauthenticated admin pages | All 7 redirect to `/admin/login?next=…`; no data in the HTML. |
| Unauthenticated admin APIs | `401 {"error":"Not authenticated"}` for reports, occasions and shop items. |
| Owner session → admin API | `401`. |
| Owner session → **another shop's** items (POST) | `401` — no IDOR. |
| Owner session → another shop's owner pages | Redirected to that shop's login. |
| Back button after sign-out | Login page; no order or takings data leaked. |
| Login error message | One message for wrong username *and* wrong password — no user enumeration. |
| Brute force | Rate limited: 8 attempts / 10 min per IP, then `429`. |
| Session cookie | `df_admin`, **httpOnly**, **secure**, `SameSite=Lax`. |
| Order POST to a nonexistent shop | `404`, not `500`; no stack trace. |
| SQL-ish and XSS payloads in login fields | Rejected as ordinary bad credentials. |

### Potential risks
- **Admin credentials are `admin` / `admin` on a public URL.** Whatever this deployment is for, that is a single guessable password in front of every shop, every customer phone number and every khata balance. Rate limiting reduces brute force but does nothing against a guessed pair. Change it before any real shop is on this instance, and consider a second factor for the Super Admin.
- Usernames are matched case-insensitively and with surrounding whitespace trimmed (`ADMIN`, `  admin  ` both authenticate). Harmless by itself; worth knowing.
- Customer phone numbers and addresses are visible to anyone holding the admin password — expected for the role, but it raises the cost of the point above.

---

## G. Mobile Findings

- **No horizontal overflow** on `/`, `/pricing` or `/shop/<slug>` at 1920, 1440, 1366, 1024, 768, 430, 390, 375 or 360 px. No controls off-screen at any width.
- Owner screens (orders, sell, khata, inventory) all render without overflow at 390×844.
- The customer basket, checkout sheet and confirmation all work under touch emulation.
- The floating mic and basket buttons stay in the thumb corner and do not reflow the grid.
- Only mobile defect found: the sub-32 px language pills (BUG-009).

---

## H. Accessibility Findings

| Check | Result |
|---|---|
| Images with `alt` | 1/1 |
| Inputs with a label or `aria-label` | all |
| Icon-only buttons with an accessible name | 10/10 named (e.g. `যোগ করুন — QA Rice`, `Mark done`, `Cancel order`) |
| Focus visible | Yes on all 14 elements walked with Tab |
| Tab order | Logical: brand → language → phone → WhatsApp → item cards in visual order |
| Landmarks | `main` 1, `header` 1, `nav` 0 (no nav landmark) |
| `h1` per page | Exactly 1 |
| `html lang` | **Wrong** — always `en` (BUG-005) |
| Tap target size | 5 under 32 px on the storefront (BUG-009) |

Keyboard-only ordering was partially verified: every control on the storefront is
reachable and focus is visible. A full keyboard checkout (basket → form → submit)
was not completed end to end — mark as partially verified.

---

## I. Performance Findings

**Measured** (Chromium, warm Vercel edge, `performance.getEntriesByType('navigation')`):

| Page | Pass | Wall | TTFB | FCP | Load |
|---|---|---|---|---|---|
| `/` | cold | 344 ms | 98 ms | 264 ms | 331 ms |
| `/` | warm | 84 ms | 31 ms | 68 ms | 79 ms |
| `/pricing` | warm | 75 ms | 31 ms | — | 66 ms |
| `/shop/<slug>` | cold | 1015 ms | 31 ms | 968 ms | 986 ms |
| `/shop/<slug>` | warm | 739 ms | 31 ms | — | 734 ms |
| `/track/<miss>` | warm | 301 ms | 31 ms | — | 295 ms |

**Observed:** admin pages settled in 0.4–2.5 s; `/shop/does-not-exist` took 4.7 s on
first hit (cold lambda). No layout thrash, no repeated API calls, no frozen UI in
any interaction. Zero console errors and zero page errors across the whole
customer journey; the only failed requests were `net::ERR_ABORTED` RSC prefetches
from navigating away mid-prefetch, which are benign.

**Potential concern:** the storefront's ~1 s FCP is the page a customer meets
after scanning a QR in a shop on mobile data. Worth a look at what blocks first
paint there.

---

## J. Product / UX Recommendations

### Must have
1. **READY state + "tell the customer" WhatsApp** (BUG-002). The most valuable missing feature, and the plumbing already exists.
2. **Live orders screen** (BUG-001). Push is an accelerator; the screen must not lie.
3. **Show validation errors** (BUG-004).
4. **Change the admin password** and stop shipping `admin`/`admin` on a public host.

### Should have
5. Customer-facing COMPLETED state (BUG-007).
6. `lang` attribute per locale (BUG-005).
7. Rename plan **EX → Business**; "EX" means nothing to a shopkeeper.
8. A "waiting for collection" filter on the orders queue once READY exists.

### Nice to have
9. Context-aware 404s (BUG-006).
10. Tell the user when input is altered (emoji stripped, name trimmed).
11. A nav landmark and 44 px minimum targets.

### Pricing evaluation (against the benchmark supplied)

| Plan | Live | Benchmark | Verdict |
|---|---|---|---|
| Basic | ₹99 / **25** items | ₹99 / 50 | Live limit is tight. A tea stall fits; a small kirana does not. |
| Starter | ₹149 / **100** | ₹149 / 150 | Correctly positioned as "MOST SHOPS"; 100 is defensible, 150 is friendlier. |
| Pro | ₹249 / **250** | ₹249 / 500 | The jump from Starter is thin: +150 items, photos, priority support. |
| EX | ₹449 / **1,000** | ₹449 / 2,000 | Name is the problem more than the limit. |

- **Annual arithmetic is correct** on every plan: ₹990/₹1,490/₹2,490/₹4,490 = ten months, and the "save ₹198/₹298/₹498/₹898" figures all check out against 12× monthly.
- Prices match the benchmark exactly; only the item ceilings are lower.
- The page's core promise — one price per shop, 0% commission, unlimited orders — is strong and correctly stated *apart from* the WhatsApp claim (BUG-003).
- **Starter is the most attractive plan** and is labelled as such. **Pro is the weak link**: consider moving something concrete into it (multi-user owner logins, or the counter till's reports).
- Nothing on the page mentions push notifications, the order queue or payment confirmation — the actual product. After the copy fix, add them as features; they are what a competitor's WhatsApp-only flow cannot do.

---

## K. Top 10 Fixes

| # | Issue | Sev | Why it matters | Action |
|---|---|---|---|---|
| 1 | Orders screen never updates itself | P1 | An owner watching the screen misses orders when push fails | Visibility-gated poll every 15–20 s + chime |
| 2 | No READY state / no "order is ready" message | P1 | The customer is never told to come and collect | Add `READY` + per-order `wa.me/<phone>` message |
| 3 | Admin/admin on a public URL | P1 (ops) | One guessable password fronts every shop's data | Rotate now; add 2FA for Super Admin |
| 4 | Rejected item saves show nothing | P2 | Blocks the first thing every owner does | Render the 422's `errors` on the field |
| 5 | Pricing says orders arrive on WhatsApp | P2 | Sets owners up to watch the wrong screen | **Fixed locally** — deploy it |
| 6 | Reports channel labelled "WhatsApp orders" | P2 | Mislabels the product's own channel | **Fixed locally** — deploy it |
| 7 | Completed order reads "on its way" | P3 | Customer never sees a final state | Add a COMPLETED string |
| 8 | `html lang="en"` on Bengali pages | P3 | Screen readers unusable for the target user | Set `lang` from locale |
| 9 | Small tap targets | P3 | Mis-taps on a phone | 44 px minimum |
| 10 | Plan named "EX" | P4 | Unintelligible to the buyer | Rename to Business |

---

## L. Order Lifecycle Result

| Stage | Result | Note |
|---|---|---|
| Customer ordering | **PASS** | No login; correct shop, prices, quantities; total ₹461 = 2×₹60 + 3×₹77 + 1×₹110 |
| Duplicate protection | **PASS** | Double-click on Place order → exactly 1 POST, 1 order. Refresh after submit → no resend |
| Order persistence | **PASS** | Survives reload, second tab, fresh sign-in; identical on `/track/<id>` |
| Owner dashboard | **PASS (with BUG-001)** | Correct customer, address, items, quantities, line totals, grand total, timestamp — but only after a manual refresh |
| Push notification | **BLOCKED** | Service worker registers; permission-blocked path messages correctly; delivery needs a real device |
| Order NOT lost if push fails | **PASS** | The order is in the DB and on the screen regardless of push |
| READY status | **FAIL** | Does not exist |
| WhatsApp "ready" notification | **FAIL** | Only "we changed your order" and cancellation messages exist |
| Payment confirmation | **PASS** | Cannot complete without answering Cash/UPI/Udhaar; reload with the question unanswered leaves the order in Preparing |
| COMPLETED status | **PASS** | Set only after the payment answer; persists across reload and fresh login; waiting count 2→1→0 |
| Khata posting | **PASS** | "Udhaar" posted ₹60 → khata shows ₹60 outstanding (`khataAmountPaise: 6000`) |
| Order history | **PASS** | Completed and cancelled orders remain, correctly labelled, takings ₹521 = ₹461 + ₹60 |
| Revise (cut) flow | **PASS** | `+` capped at the ordered amount; customer WhatsApp message and track-page notice both correct |
| Cancel flow | **PASS** | App confirm dialog with an irreversibility warning; status → Cancelled |

## Data-consistency check

Order `36fd0b50-…` verified identical across **customer confirmation → `/track/<id>` →
owner list → after reload → after fresh login**: order id, customer name and phone,
address, area, all three line items with units and quantities, all line totals,
grand total ₹461, timestamp 1:25 pm, status. No disagreement found on any field.

---

# FINAL VERDICT

**Total tests performed:** 153
**Passed:** 136
**Failed:** 10
**Blocked:** 7
**Confirmed bugs:** 10
**P0:** 0
**P1:** 2 (+1 operational: admin/admin)
**P2:** 2
**P3:** 5
**P4:** 1

**Overall quality:** High for a product at this stage. The parts that are
expensive to get right — money arithmetic, order persistence, payment gating,
access control, XSS/IDOR resistance, mobile layout — are right. What is missing
is a state (READY) and a refresh.

**Production readiness: READY WITH MINOR FIXES**, conditional on: rotating the
admin password, making the orders screen live, and deploying the pricing-copy
fix. The READY-state work is a product decision and should be scheduled next.

**Most important next action:** change the Super Admin password, then add the
visibility-gated poll to `/owner/<slug>/orders` — one small change that removes
the only way this product currently loses an order in front of a shopkeeper.
