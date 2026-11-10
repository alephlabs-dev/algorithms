// Canvas can't read Tailwind classes, so it reads the theme's CSS variables
// (see src/index.css) and reads them again when the theme changes.

export type RGB = [number, number, number];

export type CanvasColors = {
  background: string;
  foreground: string;
  bar: string;
  muted: string;
  outline: string;
  ringInner: string;
  ringOuter: string;
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
  ringInner: "--color-ring-inner",
  ringOuter: "--color-ring-outer",
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

/** A linear blend from `a` (t = 0) to `b` (t = 1), per channel; not rounded or clamped. */
export const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

/** The floor and walls of a grid, shared by pathfinding and mazes so a maze looks the same in both. */
export const gridFloor = (colors: CanvasColors): RGB => mix(hexToRgb(colors.background), hexToRgb(colors.edge), 0.55);
export const gridWall = (colors: CanvasColors): RGB => mix(hexToRgb(colors.background), hexToRgb(colors.bar), 0.55);
