// Canvas can't read Tailwind classes, so the palette lives here too.
// Keep in sync with the @theme block in src/index.css.
export const colors = {
  background: "#0a100d",
  foreground: "#eee5e9",
  accent: "#294237",
  primary: "#3ecf8e",
  secondary: "#7828c8",
  tertiary: "#ffd700",
} as const;

export type RGB = [number, number, number];

export const hexToRgb = (hex: string): RGB => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
