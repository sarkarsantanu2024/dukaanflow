'use client';

/**
 * Opens the browser's own print dialogue.
 *
 * That dialogue is also where "Save as PDF" lives, on every phone and every
 * desktop — which is why the khata statement is a printable page rather than a
 * PDF this app generates. See the note at the top of the statement page: no
 * JavaScript PDF library renders Bengali or Devanagari without shipping fonts
 * for them, and the browser already has both.
 *
 * A component of its own so the statement stays a server page with one small
 * client island in it, rather than the whole thing crossing the boundary for a
 * single call to `window.print`.
 */
export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="h-10 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white"
    >
      {label}
    </button>
  );
}
