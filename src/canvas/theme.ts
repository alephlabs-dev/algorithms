// Canvas can't read Tailwind classes, so it reads the theme's CSS variables
// (see src/index.css) and reads them again when the theme changes.

export type RGB = [number, number, number];

export type CanvasColors = {
  background: string;
  foreground: string;
  bar: string;
  muted: string;
  outline: string;
  ring: string;
  primary: string;
  secondary: string;
  tertiary: string;
  dim: string;
  edge: string;
  mud: string;
  conflict: string;
};

/** The CSS variable each canvas color comes from. */
export const variables: Record<keyof CanvasColors, string> = {
  background: "--color-background",
  foreground: "--color-foreground",
  bar: "--color-bar",
  muted: "--color-muted",
  outline: "--color-outline",
  ring: "--color-ring",
  primary: "--color-primary",
  secondary: "--color-secondary",
  tertiary: "--color-tertiary",
  dim: "--color-dim",
  edge: "--color-edge",
  mud: "--color-mud",
  conflict: "--color-conflict",
};

// The build's CSS minifier rewrites colors in their shortest form ("gold" for #ffd700, #fff).
// A canvas reads back any opaque color it's given as #rrggbb, so colors pass through one.
let probe: CanvasRenderingContext2D | null | undefined;
const toHex = (color: string) => {
  probe ??= document.createElement("canvas").getContext("2d");
  if (!probe) return color;
  probe.fillStyle = "#000000";
  probe.fillStyle = color;
  return String(probe.fillStyle);
};

/** The current theme's colors, as #rrggbb strings. */
export const readColors = (): CanvasColors => {
  const style = getComputedStyle(document.documentElement);
  return Object.fromEntries(
    Object.entries(variables).map(([key, name]) => [key, toHex(style.getPropertyValue(name).trim())])
  ) as CanvasColors;
};

export const hexToRgb = (hex: string): RGB => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
