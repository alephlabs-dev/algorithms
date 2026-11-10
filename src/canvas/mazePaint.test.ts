import { describe, expect, it } from "vitest";
import { ACTIVE, CARVED, DEAD_END, FRONTIER, STACK, WALL } from "@/mazes";
import { mazePalette } from "./mazePaint";
import { hexToRgb, type CanvasColors } from "./theme";

// The theme colors in src/index.css.
const dark: CanvasColors = {
  background: "#0b0f0d",
  foreground: "#e9eeeb",
  bar: "#d9dfdb",
  muted: "#8fa39a",
  outline: "#ffffff",
  primary: "#3ecf8e",
  secondary: "#b07cff",
  tertiary: "#ffd700",
  dim: "#6c7d75",
  edge: "#2c3a33",
  mud: "#6e5a3b",
  conflict: "#ff6b6b",
};
const light: CanvasColors = {
  background: "#f2f5f9",
  foreground: "#13294b",
  bar: "#2c4166",
  muted: "#5b6f8f",
  outline: "#13294b",
  primary: "#128a78",
  secondary: "#e8590c",
  tertiary: "#5b6cff",
  dim: "#b9c4d4",
  edge: "#cfd8e5",
  mud: "#cdb88f",
  conflict: "#d42c2c",
};

describe("maze tones", () => {
  for (const [theme, colors] of Object.entries({ dark, light }))
    it(`the move on stage stands apart from the start dot and every other tone (${theme})`, () => {
      const tones = mazePalette(colors);
      expect(tones[ACTIVE].rgb).not.toEqual(hexToRgb(colors.primary));
      for (const other of [WALL, CARVED, STACK, DEAD_END, FRONTIER]) expect(tones[ACTIVE].rgb).not.toEqual(tones[other].rgb);
    });
});
