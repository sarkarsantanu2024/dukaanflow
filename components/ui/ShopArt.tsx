/**
 * Brand illustration: a shutter-front counter shop with a QR taped to it.
 *
 * Drawn rather than photographed, deliberately. Stock photography of grocery
 * shops is overwhelmingly Western supermarket aisles — bright ceilings, long
 * refrigerated runs, trolleys — and putting that on a product built for a
 * counter shop in Dum Dum tells a shopkeeper immediately that it was not made
 * for them. This is the shape they actually stand in front of: a shutter, an
 * awning, a step, jars on a shelf, and the QR on the front.
 *
 * Inline SVG also costs about a kilobyte, scales to any size, needs no image
 * host, and recolours with the brand.
 */

export function ShopArt({ className = 'h-40 w-full' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 180"
      className={className}
      role="img"
      aria-label="A small shop with a QR code on the front"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Ground */}
      <rect x="0" y="152" width="320" height="6" rx="3" className="fill-slate-200" />

      {/* Awning stripes, the one flash of colour */}
      <path d="M64 44h192l14 26H50z" className="fill-brand-600" />
      <path d="M92 44h24l-11 26H81z" className="fill-white/30" />
      <path d="M140 44h24l-11 26h-24z" className="fill-white/30" />
      <path d="M188 44h24l-11 26h-24z" className="fill-white/30" />

      {/* Shopfront body */}
      <rect x="58" y="70" width="204" height="82" rx="4" className="fill-white stroke-slate-300" strokeWidth="2" />

      {/* Shutter slats on the left bay */}
      <rect x="68" y="80" width="72" height="62" rx="3" className="fill-slate-100 stroke-slate-300" strokeWidth="1.5" />
      {[88, 96, 104, 112, 120, 128, 136].map((y) => (
        <line key={y} x1="72" y1={y} x2="136" y2={y} className="stroke-slate-300" strokeWidth="1.5" />
      ))}

      {/* Counter and jars */}
      <rect x="152" y="112" width="98" height="30" rx="3" className="fill-slate-100 stroke-slate-300" strokeWidth="1.5" />
      <rect x="158" y="88" width="16" height="20" rx="3" className="fill-brand-100 stroke-brand-600" strokeWidth="1.5" />
      <rect x="180" y="92" width="14" height="16" rx="3" className="fill-amber-100 stroke-amber-500" strokeWidth="1.5" />
      <rect x="200" y="86" width="18" height="22" rx="3" className="fill-brand-100 stroke-brand-600" strokeWidth="1.5" />
      <rect x="224" y="94" width="14" height="14" rx="3" className="fill-amber-100 stroke-amber-500" strokeWidth="1.5" />

      {/* The QR, taped to the front — the whole product in one object */}
      <g transform="translate(96 92)">
        <rect x="-4" y="-4" width="44" height="44" rx="5" className="fill-white stroke-brand-600" strokeWidth="2" />
        <rect x="2" y="2" width="10" height="10" className="fill-slate-900" />
        <rect x="24" y="2" width="10" height="10" className="fill-slate-900" />
        <rect x="2" y="24" width="10" height="10" className="fill-slate-900" />
        <rect x="5" y="5" width="4" height="4" className="fill-white" />
        <rect x="27" y="5" width="4" height="4" className="fill-white" />
        <rect x="5" y="27" width="4" height="4" className="fill-white" />
        <rect x="16" y="16" width="4" height="4" className="fill-slate-900" />
        <rect x="24" y="20" width="4" height="4" className="fill-slate-900" />
        <rect x="30" y="26" width="4" height="4" className="fill-slate-900" />
        <rect x="20" y="30" width="4" height="4" className="fill-slate-900" />
        <rect x="16" y="6" width="4" height="4" className="fill-slate-900" />
      </g>

      {/* Signboard */}
      <rect x="96" y="26" width="128" height="16" rx="3" className="fill-slate-800" />
      <rect x="106" y="32" width="60" height="4" rx="2" className="fill-white/70" />
      <rect x="172" y="32" width="26" height="4" rx="2" className="fill-brand-400" />
    </svg>
  );
}

/**
 * The same world, told as a speech bubble: what the voice features do. Used
 * where the page is about talking to the shop rather than the shop itself.
 */
export function VoiceArt({ className = 'h-32 w-full' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 140"
      className={className}
      role="img"
      aria-label="Speaking an item into a phone"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Phone */}
      <rect x="126" y="16" width="68" height="112" rx="10" className="fill-white stroke-slate-300" strokeWidth="2" />
      <rect x="134" y="26" width="52" height="82" rx="4" className="fill-slate-50" />
      <circle cx="160" cy="118" r="4" className="fill-slate-200" />

      {/* Mic on screen */}
      <g transform="translate(160 58)">
        <circle r="17" className="fill-brand-600" />
        <rect x="-4" y="-9" width="8" height="13" rx="4" className="fill-white" />
        <path d="M-7 2a7 7 0 0 0 14 0" className="stroke-white" strokeWidth="2" fill="none" strokeLinecap="round" />
        <line x1="0" y1="9" x2="0" y2="12" className="stroke-white" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Sound arriving from the left, answering to the right */}
      {[
        { x: 96, h: 20 },
        { x: 84, h: 34 },
        { x: 72, h: 26 },
        { x: 60, h: 44 },
        { x: 48, h: 18 },
      ].map((bar) => (
        <rect
          key={bar.x}
          x={bar.x}
          y={72 - bar.h / 2}
          width="6"
          height={bar.h}
          rx="3"
          className="fill-brand-300"
        />
      ))}

      <rect x="210" y="44" width="86" height="20" rx="10" className="fill-brand-50 stroke-brand-200" strokeWidth="1.5" />
      <rect x="220" y="52" width="44" height="4" rx="2" className="fill-brand-500" />
      <rect x="270" y="52" width="16" height="4" rx="2" className="fill-brand-300" />

      <rect x="210" y="76" width="66" height="20" rx="10" className="fill-slate-100 stroke-slate-200" strokeWidth="1.5" />
      <rect x="220" y="84" width="30" height="4" rx="2" className="fill-slate-400" />
      <rect x="256" y="84" width="12" height="4" rx="2" className="fill-slate-300" />
    </svg>
  );
}
