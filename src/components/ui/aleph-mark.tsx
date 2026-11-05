import { cn } from "@/utils/cn";

/**
 * The ℵ of the logo, drawn rather than typed so it looks the same on every
 * system (a typed ℵ falls back to whatever font has one). The same strokes as
 * the favicon (public/icon.svg), in the current text color.
 */
export const AlephMark = ({ className }: { className?: string }) => (
  <svg
    aria-hidden
    viewBox="112 112 288 288"
    className={cn("h-[62%] w-[62%]", className)}
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <g transform="translate(0 -10)">
      <path d="M128 170 C 128 140 150 128 176 146 L 366 384" strokeWidth={68} />
      <path d="M282 260 C 340 250 366 214 356 150 C 352 132 372 124 384 136" strokeWidth={40} />
      <path d="M226 270 C 174 290 150 326 162 382 C 166 398 148 404 132 394" strokeWidth={40} />
    </g>
  </svg>
);
