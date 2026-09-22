import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        /**
         * BLUE AND GREY. The green is gone, and so is the orange that briefly
         * replaced it.
         *
         * THE VIVID BLUE CANNOT CARRY TEXT, and that is the one fact this ramp
         * is built around. The reference blue — #2596b8, the water colour of
         * the dashboard this came from — measures 3.42:1 against white. Not "a
         * bit low": it fails normal text. Every product that uses a cyan like
         * this either puts dark text on it or quietly fails AA.
         *
         * So the ramp splits the job in two:
         *
         *   `500` IS the reference blue. It is for FILLS THAT CARRY NO SMALL
         *         TEXT — icon tiles, the active pill, a big figure, an accent
         *         edge. It is the colour the product looks like.
         *   `600` is deepened to #0e7490, measured at 5.36:1, so white text on
         *         a primary button passes AA. Every existing `bg-brand-600`
         *         call site stays accessible without being touched.
         *   `700` is 7.27:1 — blue text on a light surface, AAA.
         *   `800` at 9.11:1 carries the chrome and the rails.
         *
         * Do not brighten 600 or 700 without re-measuring.
         *
         * BLUE BUYS BACK SOMETHING THE ORANGE HAD SPENT. Red means "unpaid,
         * something is wrong" and amber means "money the shop does not have
         * yet"; against an orange brand both were neighbours and neither could
         * shout. A cool brand puts the whole warm half of the wheel back in the
         * hands of the two states that need it, which is worth more here than
         * any hue preference — this is an app about who has paid.
         */
        brand: {
          50: '#eff8fc',
          100: '#d6eef7',
          200: '#aedded',
          300: '#74c5de',
          400: '#3ea9ca',
          500: '#2596b8',
          600: '#0e7490',
          700: '#155e75',
          800: '#164e63',
          900: '#0d3b4a',
        },

        /**
         * THE SURFACES. THERE IS NO WHITE IN THIS PRODUCT ANY MORE.
         *
         * Every card, bar and panel was `#ffffff`. Against a tinted ground that
         * reads as a hole punched in the page — the eye takes pure white as a
         * light source rather than as a surface, so a screen of white cards on
         * a tinted page looks like a page with its cards missing.
         *
         * These are NEUTRAL GREYS, not tinted with the brand. The surfaces are
         * most of the screen; carrying the brand into them would wash the whole
         * product one colour and leave the accent nothing to stand out
         * against. Grey surfaces are what let one blue read as loud. Three
         * steps, relative to `app` (#f0f0ee):
         *
         *   `card`  — LIGHTER than the ground. What sits on the page: cards,
         *             sheets, the header bar. Raised, because it is paler.
         *   `sunk`  — between the two. What you type INTO: inputs, wells, the
         *             shop-name band. Recessed, because it is darker than the
         *             card it sits in and lighter than nothing else.
         *   `veil`  — for translucent tiles ON the dark hero panel, where a
         *             white overlay would grey it.
         *
         * `card` is a hair off white on purpose, not by accident. It is light
         * enough that slate-900 on it measures the same as it did on white to
         * two decimal places, so nothing anywhere needed re-checking for
         * contrast — only the hole in the page went away.
         */
        /**
         * THE PAGE GROUND, AS A COLOUR.
         *
         * `bg-app` and `bg-aurora` are backgroundIMAGE utilities, and Tailwind's
         * `/95` opacity modifier only applies to background COLOURS — so
         * `bg-app/95` on a sticky strip silently produced no background at all
         * and the list scrolled straight through it. Anything that needs the
         * page's own colour AND a transparency takes this instead.
         *
         * Kept in step with the base of `aurora` below by hand; they are the
         * same colour stated in the two forms Tailwind needs.
         */
        ground: '#eef1f2',
        card: '#fbfbfa',
        sunk: '#e7e7e4',
        veil: '#ffffff1a',

        /**
         * THE GLASS. Translucent surfaces, to be paired with `backdrop-blur`.
         *
         * `glass`     — a light pane over the aurora: cards, sheets, panels.
         * `glass-dark`— the same idea over a dark ground: the top bar.
         * `glass-edge`— the hairline along a pane's top edge, which is most of
         *               what sells it. Real glass catches light where it meets
         *               the air; without this a blurred rectangle just looks
         *               like a rendering fault.
         *
         * USE THIS SPARINGLY AND NEVER ON A LIST. `backdrop-filter` is the most
         * expensive thing in CSS on the phones this product runs on — it forces
         * a separate compositing pass per blurred element, every frame, while
         * scrolling. One pane on a screen is free. Twelve order cards each
         * blurring what is behind them is a screen that drops frames on exactly
         * the hardware this is for. Panes, not lists.
         *
         * OPAQUE ENOUGH TO READ THROUGH. At 55–70% the text on top keeps very
         * nearly its contrast against the solid colour, so nothing needed
         * re-measuring. Thinner glass looks better in a screenshot and starts
         * failing the moment a dark pool of the aurora drifts under a label.
         */
        glass: 'rgba(251,251,250,.68)',
        'glass-dark': 'rgba(38,55,63,.72)',
        'glass-edge': 'rgba(255,255,255,.55)',
      },
      backgroundImage: {
        /**
         * The chrome: the console's rail, the owner app's bar, the tab bars.
         *
         * FLAT, AND ONE COLOUR. It has been a green-to-green gradient and
         * briefly a green-to-blue one; both were movement for its own sake in
         * the largest single field of colour on the screen, and a gradient
         * there is exactly where banding shows on the cheap panels this is
         * operated on. A rail is a ground. It should recede.
         *
         * Still stated as a gradient so every `bg-chrome` call site is
         * unchanged — Tailwind has no "flat backgroundImage".
         *
         * brand-800, measured at 9.39:1 against white, so an icon at the far end
         * of a wide bar is as readable as the one nearest the corner.
         *
         * The OWNER's top bar no longer uses this — it takes `gloss` below.
         */
        chrome: 'linear-gradient(#164e63, #164e63)',
        /**
         * The ground everything sits on: one soft tint, never plain white and
         * never a wash that changes colour as the page scrolls.
         *
         * IT WAS #f5f8f6, WHITE WITH A RUMOUR OF COLOUR IN IT. Against white
         * cards that produced a screen with no ground at all — every card
         * dissolved into the page, nothing read as an object, and the whole app
         * looked like an unfinished form. "Too much white" was the exact and
         * correct complaint.
         *
         * A real tone fixes it at the root rather than card by card: the page
         * is a definite grey and `card` is plainly lighter, so every card is an
         * object without needing a border, a tint or a heavier shadow to say
         * so. One line here does what five card styles were trying to.
         *
         * STILL FLAT. The note on `chrome` above applies with more force to the
         * largest field of colour in the product: a gradient across a whole
         * scrolling page is exactly where banding shows on the cheap panels
         * this is operated on, and it would move as the page moved.
         *
         * Dark text sits directly on this in places, so it stays light: slate-900
         * on it is comfortably past 4.5:1.
         */
        app: 'linear-gradient(#f0f0ee, #f0f0ee)',

        /**
         * THE DEPTH SET — added beside the two flat fills above, never
         * replacing them, so every screen already built keeps the surface it
         * has and only what opts in changes.
         *
         * SMALL AREAS ONLY, AND THE RULE ABOVE SAYS WHY. The chrome is flat
         * because a gradient across the largest field of colour on the screen
         * is where banding shows on the cheap panels this is operated on. That
         * argument does not go away for these; it just stops applying at a
         * card-sized area, where the ramp is short enough to stay smooth. A
         * `hero` stretched across a whole page would be the same mistake with a
         * different token name.
         *
         * BODY TEXT NEVER SITS ON A GRADIENT. `brand-600` is 5.36:1 on white
         * and `brand-700` is 7.27:1 — measured against ONE colour. A figure drifting
         * across a ramp has no contrast ratio, it has a range, and only the
         * dark end was ever measured. `hero` therefore runs 700 → 900, every
         * point of which carries white comfortably; the light fills hold dark
         * text for the same reason in reverse.
         */
        hero: 'linear-gradient(135deg, #155e75 0%, #164e63 55%, #0d3b4a 100%)',

        /**
         * THE TOP BAR: dark blue-grey, with a sheen. NOT BLACK.
         *
         * It was near-black and that was wrong. Pure black is not a colour a
         * product chooses, it is the absence of one — a black bar reads as a
         * hole above the page, it makes every screenshot look like a browser
         * chrome bug, and it has nothing to do with the rest of the palette.
         *
         * #26373f is a dark SLATE with the brand's blue in it: 1.70:1 against
         * #000, so it is plainly a colour rather than an absence, while still
         * carrying white at 12.4:1 with room to spare for a muted secondary
         * tone. It belongs to the same family as `chrome` and `hero` — the same
         * hue, three depths.
         *
         * The sheen is a top-down ramp of about six percent: enough that the
         * bar catches light along its upper edge and reads as a surface rather
         * than a fill, nowhere near enough to band. Allowed here for the reason
         * `hero` is — a 52px strip, not a scrolling page.
         *
         * The gloss is a top-down ramp of about six percent — enough that the
         * bar catches light along its upper edge and reads as a surface rather
         * than a fill, and nowhere near enough to band. It is allowed here for
         * the reason `hero` is: this is a 52px strip, not a scrolling page. The
         * flat rule still stands for `chrome` and `app`.
         *
         */
        /**
         * THE SHOP-NAME BAND: a glossy grey, and NOT glass.
         *
         * Deliberately solid. It sits directly under a pure white bar, and a
         * translucent pane there would pick up whatever happened to be
         * scrolling beneath it — so the one strip that must always read the
         * same, because it says WHICH SHOP YOU ARE SIGNED INTO, would change
         * colour as the page moved. It also costs nothing to render, which
         * matters on a surface that is sticky and therefore recomposited on
         * every scroll frame.
         *
         * The sheen is a short top-down ramp: light at the top edge, settling
         * darker, so the band reads as a surface catching light rather than as
         * a flat grey fill. Short enough not to band on a cheap panel — the
         * same licence `hero` has, for the same reason.
         *
         * Darker than the white above it and than `card`, so the header reads
         * as two parts of one block: white lid, grey shelf, page below.
         */
        band: 'linear-gradient(180deg, #f4f5f6 0%, #e9ebec 55%, #e1e4e5 100%)',

        gloss: 'linear-gradient(180deg, #31454f 0%, #26373f 55%, #1e2c33 100%)',

        /**
         * THE AURORA — what the glass has to refract.
         *
         * Frosted glass is not a colour, it is a LENS. Over a flat grey page it
         * blurs grey into grey and the whole effect costs a GPU pass to produce
         * nothing; every glassmorphic interface that works has something
         * coloured and soft moving underneath it. Photographs are the usual
         * answer and the wrong one here — hundreds of kilobytes over rural 4G,
         * on a codebase that agonises over a 96px PNG, plus a licence to get
         * wrong. Four radial gradients weigh nothing and cannot be unlicensed.
         *
         * Kept faint on purpose. This sits behind every screen in the product,
         * and a backdrop somebody notices on the till at four in the afternoon
         * is a backdrop that is too strong. It is there to give the glass
         * something to find, not to be looked at.
         *
         * Radials, not a linear ramp: a linear gradient across a full scrolling
         * page is the banding case the `chrome` note warns about. Soft radial
         * pools have no long even ramp for a cheap panel to step through.
         */
        // SIZED TO THE PHONE, NOT TO A DESKTOP. The first version used pools of
        // 40–60rem, which on a 375px screen are two to three times the viewport
        // — each one spread so wide it flattened into an even wash, the page
        // read as plain grey, and the glass had nothing to refract. Pools at
        // 16–22rem are comparable to the screen itself, so the colour actually
        // pools and moves. Opacities roughly doubled for the same reason.
        aurora: [
          'radial-gradient(22rem 18rem at 6% -6%, rgba(37,150,184,.42), transparent 66%)',
          'radial-gradient(18rem 16rem at 98% 10%, rgba(116,197,222,.45), transparent 66%)',
          'radial-gradient(20rem 18rem at 86% 92%, rgba(21,94,117,.30), transparent 64%)',
          'radial-gradient(18rem 16rem at -4% 84%, rgba(174,221,237,.50), transparent 66%)',
          'linear-gradient(#eef1f2, #eef1f2)',
        ].join(','),
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.10)',
        /** For the chrome: enough to sit above the page, not a drop shadow. */
        chrome: '0 1px 0 rgba(15,23,42,.06)',
        sheet: '0 -8px 24px rgba(16,24,40,.12)',

        /**
         * Elevation, tinted green rather than grey.
         *
         * LIGHT, AND NEUTRAL. They were tinted with the brand and set deep —
         * a 24px spread at 45% under the bars — which on a pale page read as a
         * grey smear beneath every surface rather than as light. The job of a
         * shadow here is only to say "this sits on top of that"; anything past
         * that is dirt.
         *
         * Two steps: `raised` for anything sitting on the page, `float` for the
         * one thing on a screen that should look lifted off it. A third step is
         * only ever an invitation to use all three at once and flatten the
         * difference between them.
         *
         * `chrome` is now a hairline rather than a shadow at all — the bars it
         * belongs to are separated by a real border instead.
         */
        raised: '0 1px 2px rgba(15,23,42,.04), 0 2px 8px -4px rgba(15,23,42,.08)',
        float: '0 2px 6px rgba(15,23,42,.05), 0 8px 20px -10px rgba(15,23,42,.12)',
      },
      keyframes: {
        'drawer-in': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'drawer-out': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(100%)' },
        },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-out': { from: { opacity: '1' }, to: { opacity: '0' } },

        /**
         * A toast arriving and leaving.
         *
         * It DROPS IN from above and settles, rather than appearing. A message
         * that simply exists on the next frame is one an owner glancing at a
         * counter never sees arrive, and the whole job of a toast is to be
         * noticed without being read immediately. The small scale-up is what
         * makes it read as coming towards the viewer instead of sliding down a
         * track.
         *
         * Out is faster than in, and this is the usual asymmetry: arriving
         * wants to be seen, leaving wants to be out of the way.
         */
        'toast-in': {
          from: { opacity: '0', transform: 'translateY(-14px) scale(0.94)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'toast-out': {
          from: { opacity: '1', transform: 'translateY(0) scale(1)' },
          to: { opacity: '0', transform: 'translateY(-10px) scale(0.96)' },
        },

      },
      animation: {
        // The easing is the decelerating curve panels want: quick to start,
        // settling rather than stopping. Linear would read as mechanical.
        'drawer-in': 'drawer-in 260ms cubic-bezier(0.32, 0.72, 0, 1)',
        'drawer-out': 'drawer-out 200ms cubic-bezier(0.32, 0.72, 0, 1) forwards',
        'fade-in': 'fade-in 220ms ease-out',
        'fade-out': 'fade-out 200ms ease-in forwards',
        // The same settling curve the drawers use, so everything in the
        // product decelerates the same way.
        'toast-in': 'toast-in 300ms cubic-bezier(0.32, 0.72, 0, 1)',
        'toast-out': 'toast-out 220ms cubic-bezier(0.32, 0.72, 0, 1) forwards',
      },
    },
  },
  plugins: [],
};

export default config;
