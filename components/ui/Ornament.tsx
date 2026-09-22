/**
 * The vector furniture: a motif for rich panels, and a picture for empty ones.
 *
 * WHY THESE ARE DRAWN AND NOT PHOTOGRAPHED. This app is used on cheap Android
 * phones over rural 4G, on a codebase that agonises over shipping a 468px PNG
 * where a 96px one would do. A stock photograph is hundreds of kilobytes for
 * decoration; everything here is under a kilobyte of markup, scales to any
 * screen without a second file, and takes the brand's colours from the
 * `currentColor` it is given. There is also no licence to get wrong.
 *
 * WHO THEY ARE FOR. The people holding this phone mostly do not read quickly
 * and did not grow up with apps. Nothing here decorates: the motif gives a
 * money panel a surface so it reads as an object rather than a coloured
 * rectangle, and the empty-state drawing replaces a grey sentence that a
 * non-reader gets nothing at all from. A picture of an empty shelf says "there
 * is nothing here yet" to somebody who cannot read "there is nothing here yet".
 */

/**
 * An alpona corner — the rice-flour patterns drawn on a Bengali threshold at
 * Poila Boishakh, which is the same festival the product is named for.
 *
 * Set at a low opacity behind a deep panel, where it does the job a paper
 * texture would: it catches the eye as surface rather than as a drawing, and
 * stops a large flat fill from looking like a rendering error. Deliberately NOT
 * something to look at — if a viewer stops to work out what it is, it is too
 * strong and the opacity comes down, never the geometry.
 *
 * `aria-hidden` throughout: it says nothing, so it must say nothing to a screen
 * reader either.
 */
export function AlponaMotif({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Concentric arcs springing from one corner, the way an alpona is laid
          down: a centre, then petals, then the ring that closes it. */}
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="200" cy="0" r="40" opacity="0.9" />
        <circle cx="200" cy="0" r="72" opacity="0.7" />
        <circle cx="200" cy="0" r="104" opacity="0.5" />
        <circle cx="200" cy="0" r="140" opacity="0.3" />
      </g>
      {/* Petals on the diagonal — the part that makes it read as drawn by hand
          rather than as a set of rings. */}
      <g fill="currentColor" opacity="0.5">
        <path d="M200 52 q-14 22 0 44 q14-22 0-44Z" />
        <path d="M148 0 q22 14 44 0 q-22-14-44 0Z" />
        <path d="M163 37 q4 26 26 26 q-4-26-26-26Z" />
      </g>
      {/* A single dot, off the axis, which is what stops the whole thing
          looking machine-set. */}
      <circle cx="120" cy="80" r="3" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

/**
 * A quiet shop: shutters up, shelves bare, nothing waiting.
 *
 * Drawn in `currentColor` at two opacities so one shape serves a light card and
 * a dark one. Shown where the screen would otherwise say "nothing needs you" in
 * words alone.
 */
export function QuietShopArt({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 120 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* The awning, which is what makes it a shop and not a box. */}
      <path
        d="M18 30 L24 16 Q25 13 28 13 H92 Q95 13 96 16 L102 30 Z"
        fill="currentColor"
        opacity="0.35"
      />
      {/* Counter and shelves, empty. The gaps are the content. */}
      <rect x="22" y="34" width="76" height="48" rx="6" fill="currentColor" opacity="0.14" />
      <rect x="32" y="46" width="56" height="4" rx="2" fill="currentColor" opacity="0.3" />
      <rect x="32" y="60" width="38" height="4" rx="2" fill="currentColor" opacity="0.22" />
      {/* A closed shutter line across the foot. */}
      <rect x="22" y="76" width="76" height="6" rx="3" fill="currentColor" opacity="0.28" />
      {/* Two leaves at the corner, the mark's own, so an empty screen still
          belongs to this product. */}
      <path d="M104 84 q10-12 14-2 q-4 10-14 2Z" fill="currentColor" opacity="0.4" />
      <path d="M104 84 q-2-14 8-14 q2 12-8 14Z" fill="currentColor" opacity="0.28" />
    </svg>
  );
}
