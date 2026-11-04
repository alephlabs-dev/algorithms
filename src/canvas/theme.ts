// Canvas can't read Tailwind classes, so the palette lives here too.
// Keep in sync with the @theme block in src/index.css.
export const colors = {
  background: "#0b0f0d",
  foreground: "#e9eeeb",
  /** Plain bars: a touch softer than text, so highlights stand out. */
  bar: "#d9dfdb",
  muted: "#8fa39a",
  primary: "#3ecf8e",
  secondary: "#b07cff",
  tertiary: "#ffd700",
  dim: "#6c7d75",
} as const;

export type RGB = [number, number, number];

export const hexToRgb = (hex: string): RGB => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
