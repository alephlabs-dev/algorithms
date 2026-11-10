/// <reference types="node" />
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ACTIVE, CARVED, DEAD_END, FRONTIER, STACK, WALL } from "@/mazes";
import { mazePalette } from "./mazePaint";
import { hexToRgb, variables, type CanvasColors } from "./theme";

// The theme colors as src/index.css defines them now: dark in @theme, light overriding it.
const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
const block = (selector: string) => {
  const open = css.indexOf(`${selector} {`);
  return css.slice(open, css.indexOf("\n}", open));
};
const colorsIn = (...blocks: string[]) =>
  Object.fromEntries(
    Object.entries(variables).map(([key, name]) => {
      // A later block overrides an earlier one, like the cascade.
      const value = blocks.reduce<string | undefined>(
        (found, b) => b.match(new RegExp(`${name}:\\s*(#[0-9a-f]{6})\\s*;`, "i"))?.[1] ?? found,
        undefined,
      );
      return [key, value];
    }),
  ) as CanvasColors;
const dark = colorsIn(block("@theme"));
const light = colorsIn(block("@theme"), block(':root[data-theme="light"]'));

describe("maze tones", () => {
  for (const [theme, colors] of Object.entries({ dark, light }))
    it(`the move on stage stands apart from the start dot and every other tone (${theme})`, () => {
      for (const [key, value] of Object.entries(colors)) expect(value, `--color-${key} read from index.css`).toMatch(/^#[0-9a-f]{6}$/i);
      const tones = mazePalette(colors);
      expect(tones[ACTIVE].rgb).not.toEqual(hexToRgb(colors.primary));
      for (const other of [WALL, CARVED, STACK, DEAD_END, FRONTIER]) expect(tones[ACTIVE].rgb).not.toEqual(tones[other].rgb);
    });
});
