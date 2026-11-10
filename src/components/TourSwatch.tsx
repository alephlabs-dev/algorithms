/** An ×, cut out in the background color, for a swatch of a tone the stage crosses out. */
export const SwatchCross = () => (
  <svg viewBox="0 0 10 10" className="h-full w-full text-background">
    <path d="M3 3l4 4M7 3l-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

/** A dot in a color from the stage, so the tour's words match what's on screen. Crossed tones get their ×. */
export const Swatch = ({ className, cross }: { className: string; cross?: boolean }) => (
  <span
    aria-hidden
    className={`mr-1 inline-block align-[-1px] ${cross ? "h-3 w-3 rounded-[3px]" : "h-2.5 w-2.5 rounded-full"} ${className}`}
  >
    {cross && <SwatchCross />}
  </span>
);
