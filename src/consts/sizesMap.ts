import type { DisplayMode, Size } from "@/types";

export const sizes: Size[] = [10, 20, 40, 100, 200, 400];

/** Bars get too thin to read past this on a phone. */
export const MAX_MOBILE_SIZE = 200;

/** Numbers mode only fits so many tiles. */
export const NUMBERS_LIMIT = { desktop: 20, mobile: 10 };

/** The sizes the size slider offers: numbers mode only fits so many tiles, and phones only so many bars. */
export const sizesFor = (displayMode: DisplayMode, isMobile: boolean): Size[] => {
  const max =
    displayMode === "numbers"
      ? isMobile ? NUMBERS_LIMIT.mobile : NUMBERS_LIMIT.desktop
      : isMobile ? MAX_MOBILE_SIZE : Infinity;
  return sizes.filter((size) => size <= max);
};
