/** A dot in a color from the stage, so the tour's words match what's on screen. */
export const Swatch = ({ className }: { className: string }) => (
  <span aria-hidden className={`mr-1 inline-block h-2.5 w-2.5 rounded-full align-[-1px] ${className}`} />
);
