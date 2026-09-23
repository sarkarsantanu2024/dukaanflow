"use client";

/**
 * The owner app's top bar — the same bar the shop page has, with the shop's own
 * name and picture under it.
 *
 * THE CONTROLS AND THE IDENTITY ARE TWO ROWS, NOT ONE, and that is the whole
 * design here. They were one row once: a green chrome strip carrying the photo,
 * the name, the language switch, the install button and the way out, all
 * fighting for the width of a cheap phone. The name was dropped to make room —
 * on the reasoning that an owner knows whose shop they are in, which is true of
 * the owner and false of everybody else who holds that phone. A shopkeeper hands
 * it to a son, a helper, an operator on a support call; a demo phone carries
 * four shops; and an owner with two shops has no way at all to tell which one
 * they just signed into.
 *
 * So both are here and neither is squeezed. The top row is the product's bar,
 * unchanged: white, sticky, hairline under it, the mark on the left and the
 * controls on the right. Underneath it, on the same sticky block, one short
 * strip with the owner's picture and the shop's name — the same pairing the
 * customer sees on the storefront, at the size of a line rather than a card.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import clsx from "clsx";
import { GearIcon, HomeIcon, SignOutIcon } from "@/components/ui/Icon";
import { BrandMark } from "@/components/ui/BrandMark";
import { ShopClock } from "./ShopClock";
import { Spinner } from "@/components/ui/Spinner";
import { OwnerInstallButton } from "./OwnerInstallButton";
import { ShutterSwitch } from "./ShutterSwitch";
import { ownerDict } from "@/lib/owner-i18n";
import { LOCALE_LABELS, LOCALES, type Locale } from "@/lib/i18n";

export function OwnerHeader({
  slug,
  locale,
  shopName,
  ownerClosed,
  ownerImageData,
  onOpenSettings,
  settingsOpen = false,
  onCloseSettings,
  settingsPanel,
}: {
  slug: string;
  locale: Locale;
  /** The shop this owner is signed into, shown on every screen. */
  shopName: string;
  /** The shopkeeper's own shutter. True means customers see a closed sign. */
  ownerClosed: boolean;
  /**
   * The owner's photo as a data URL, or '' when they have not set one. Blank
   * falls back to the shop's initial on a brand tile — the same stand-in the
   * storefront uses, so one shop does not have two different faces.
   */
  ownerImageData: string;
  /**
   * Opens the once-a-shop settings tray, or undefined where this screen does
   * not carry them — see `showSettings` in `OwnerShell`. Undefined draws no
   * gear at all rather than a gear that does nothing.
   */
  onOpenSettings?: () => void;
  settingsOpen?: boolean;
  onCloseSettings?: () => void;
  /** The settings themselves, drawn inside the dropdown. */
  settingsPanel?: React.ReactNode;
}) {
  const router = useRouter();

  /**
   * Is this already the home screen?
   *
   * A house icon that returns you to the screen you are looking at is a control
   * that does nothing, and on a row this narrow it costs the shop name the
   * width it needs. Matched on the exact path — with and without the trailing
   * slash, because the installed app's start_url carries one (see
   * `app/owner.webmanifest`) and would otherwise land here showing the icon.
   */
  const pathname = usePathname();
  const atHome =
    pathname === `/owner/${slug}` || pathname === `/owner/${slug}/`;
  const { push } = useToast();
  const t = ownerDict(locale);
  const [busy, setBusy] = useState(false);


  /**
   * A DROPDOWN HAS TO CLOSE THE WAY EVERY OTHER DROPDOWN DOES.
   *
   * Escape, and a tap anywhere outside it. Without both, the only way out is
   * the gear you opened it with — which is the one thing a panel covering the
   * screen makes hard to find again.
   *
   * `mousedown` rather than `click`: a tap that starts outside and ends inside
   * should still close it, and waiting for `click` lets the panel swallow the
   * event first.
   */
  const settingsRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!settingsOpen || !onCloseSettings) return;
    function onPointer(event: MouseEvent | TouchEvent) {
      if (!settingsRef.current?.contains(event.target as Node))
        onCloseSettings!();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseSettings!();
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [settingsOpen, onCloseSettings]);

  async function signOut() {
    setBusy(true);
    try {
      await fetch("/api/owner/logout", { method: "POST" });
      router.replace(`/owner/${slug}/login`);
      router.refresh();
    } catch {
      push(t.networkError, "error");
      setBusy(false);
    }
  }

  /**
   * The owner's language is stored on the shop, so it follows them to any
   * phone they sign in from rather than living in one browser's storage.
   */
  async function changeLocale(next: Locale) {
    try {
      await fetch(`/api/owner/${slug}/locale`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: next }),
      });
      router.refresh();
    } catch {
      push(t.networkError, "error");
    }
  }

  return (
    <header className="sticky top-0 z-20 bg-chrome">
      <div className="mx-auto flex max-w-3xl items-center px-3 py-2">
        {/* The mark leads home, where a logo leads everywhere else. It used to
            go to the item list on the reasoning that stock is where an owner
            starts their day — but the day's takings, the waiting orders and who
            owes now live on the home screen, so that is the answer to "take me
            back". The item list is one tap away on the tab bar. */}
        {/* MARK ONLY, no name. This bar carries the shop's own name, a clock
            and a bell on a 360px phone, and "Halkhata" beside all of that is
            the one thing on it the owner already knows — they are inside the
            app. The link keeps its accessible name, so a screen reader still
            hears where it goes. */}
        <BrandMark
          href={`/owner/${slug}`}
          tone="dark"
          name={false}
          className="mr-auto text-sm"
        />

        {/* One control instead of three buttons. A native select is also the
            one thing on this bar that a shopkeeper's phone already knows how
            to render large and legible. */}
        <label className="sr-only" htmlFor="owner-language">
          {t.language}
        </label>
        <select
          id="owner-language"
          value={locale}
          onChange={(event) => changeLocale(event.target.value as Locale)}
          className="h-6 shrink-0 rounded-lg border border-white/20 bg-white/10 px-2 text-sm font-medium text-white"
        >
          {LOCALES.map((option) => (
            <option key={option} value={option}>
              {LOCALE_LABELS[option]}
            </option>
          ))}
        </select>

        <OwnerInstallButton slug={slug} label={t.installNow} />

        {/* THE SHUTTER TOOK THE PAY LINK'S PLACE, and the swap is the point.
            A route to the payment screen is important and wanted about twice a
            year; whether the shop is open is wanted on an ordinary Tuesday
            morning, in a hurry, by somebody who has just decided not to open.
            Only one of those earns a permanent seat on a phone header. Paying
            moved into the folded-away block at the foot of every screen, where
            the rest of the once-a-year settings already live — it is still one
            tap from everywhere, and `PlanBanner` and the roadblock still put it
            in front of an owner who actually needs it. */}
        <ShutterSwitch slug={slug} locale={locale} ownerClosed={ownerClosed} />

        <button
          type="button"
          onClick={signOut}
          disabled={busy}
          aria-label={t.signOut}
          title={t.signOut}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/75 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
        >
          {busy ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <SignOutIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* WHOSE SHOP THIS IS.
          Its own band under the controls rather than a squeeze beside them, so
          the name may run the full width of a 375px phone and the buttons above
          keep every pixel they had.

          THE PROPORTIONS ARE THE DESIGN HERE, and the first attempt got them
          wrong: a 28px circle and a small grey name on a white row, which read
          as a stray caption somebody had forgotten to delete rather than as the
          title of the app you are in. The fixes are all one idea — make it look
          deliberate:

          - A tinted ground. White under white is not a band, it is a gap. The
            slate tint says the header is two parts of one block and ends here.
          - A SQUARE tile, not a circle. This photo is a shopfront as often as
            it is a face, and a circle crops a shutter and a signboard into a
            meaningless dot. It is the same rounded tile the customer sees on
            the storefront card — one shop, one picture, one shape.
          - Big enough to see: 36px, the size at which a face is a face.
          - The name in the weight a title is set in, not the weight a footnote
            is. It is the most important word on the screen for anybody holding
            this phone who is not its owner. */}
      {/* `relative` so the clock can hang off the bottom edge of this band —
          see `ShopClock`. The band is inside the sticky header, so the badge
          stays on screen with it as the page scrolls. */}
      <div className="relative border-t border-slate-200/70 bg-sunk">
        {/* THE HOME SCREEN ONLY. It rode on every owner screen, which put a
            wall clock over the till, the khata and the orders queue — three
            screens with a job in hand, none of which is asking what day it is.
            The home screen is the one where every figure means "today", so it
            is the one place the date earns its space.

            `atHome` is the same test the way-home icon uses, so the two can
            never disagree about which screen this is. */}
        {atHome && <ShopClock />}

        <div className="mx-auto flex max-w-3xl items-center gap-2.5 px-3 py-2 sm:px-4">
          {ownerImageData ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ownerImageData}
              alt=""
              className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
            />
          ) : (
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-base font-semibold text-brand-800"
            >
              {shopName.trim().charAt(0).toUpperCase()}
            </span>
          )}
          {/* A size ABOVE the wordmark sitting directly over it. Set level with
              "Halkhata" the two read as a pair of competing titles and the eye
              picks neither; a step up settles it, and the right one wins — in
              the owner's own app the shop is the subject and the product is the
              stationery it is printed on. */}
          <span className="min-w-0 flex-1 truncate text-base font-semibold leading-tight text-slate-900">
            {shopName}
          </span>

          {/* THE SETTINGS, AS A GEAR RATHER THAN A ROW.
              They were a full-width "আরও সেটিং" line at the foot of the home
              screen — a permanent row, on the screen an owner opens twenty
              times a day, for things a shop sets once in its life: the notice,
              the delivery terms, the way to pay. A gear beside the shop's own
              name is where a phone owner already looks for "settings for this
              thing", and it costs 36px instead of a row.

              Only where the screen carries them, so it is never a control that
              does nothing. */}
          {onOpenSettings && (
            <div className="relative shrink-0" ref={settingsRef}>
              <button
                type="button"
                onClick={onOpenSettings}
                aria-expanded={settingsOpen}
                aria-label={t.moreSettings}
                title={t.moreSettings}
                className={clsx(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition",
                  settingsOpen
                    ? "bg-slate-200 text-slate-800"
                    : "text-slate-400 hover:bg-slate-200 hover:text-slate-800",
                )}
              >
                <GearIcon className="h-5 w-5" />
              </button>

              {/* THE PANEL HANGS OFF THE GEAR, and is anchored to its RIGHT edge
                so it can never run off the side of a 375px phone. Width is
                capped to the viewport for the same reason, and it scrolls
                rather than growing past the screen when a shop has a notice, a
                plan line and delivery terms all at once. */}
              {settingsOpen && settingsPanel && (
                <div className="absolute right-0 top-full z-30 mt-2 w-[min(20rem,calc(100vw-1.5rem))] max-h-[70vh] overflow-y-auto rounded-2xl bg-sunk p-2 shadow-float ring-1 ring-slate-200">
                  {settingsPanel}
                </div>
              )}
            </div>
          )}

          {/* The way home, and NOT on the home screen itself — see `atHome`.
              "আজকের দোকান" is the screen the app opens on; from any other tab
              this returns to it, and a house is the one icon every phone owner
              already reads as "back to the start".

              The clock briefly lived here, between the shop name and this. It
              sits on the home screen under the float instead: on a 375px phone
              this row is the shop name, a language select, a shutter switch and
              a sign-out, and a fifth thing left "Maa Tara Mudi D…" truncated
              mid-word. */}
          {!atHome && (
            <Link
              href={`/owner/${slug}`}
              aria-label={t.todayTitle}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition "
            >
              <HomeIcon className="h-5 w-5" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
