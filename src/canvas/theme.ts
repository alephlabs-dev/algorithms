// Canvas can't read Tailwind classes, so it reads the theme's CSS variables
// (see src/index.css) and reads them again when the theme changes.

export type RGB = [number, number, number];

export type CanvasColors = {
  background: string;
  foreground: string;
  bar: string;
  muted: string;
  outline: string;
  primary: string;
  secondary: string;
  tertiary: string;
  dim: string;
  edge: string;
  mud: string;
};

const variables: Record<keyof CanvasColors, string> = {
  background: "--color-background",
  foreground: "--color-foreground",
  bar: "--color-bar",
  muted: "--color-muted",
  outline: "--color-outline",
  primary: "--color-primary",
  secondary: "--color-secondary",
  tertiary: "--color-tertiary",
  dim: "--color-dim",
  edge: "--color-edge",
  mud: "--color-mud",
};

/** The current theme's colors, as hex strings. */
export const readColors = (): CanvasColors => {
  const style = getComputedStyle(document.documentElement);
  return Object.fromEntries(
    Object.entries(variables).map(([key, name]) => [key, style.getPropertyValue(name).trim()])
  ) as CanvasColors;
};

export const hexToRgb = (hex: string): RGB => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
