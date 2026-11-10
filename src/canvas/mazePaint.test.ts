/// <reference types="node" />
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ACTIVE, CARVED, DEAD_END, FRONTIER, OTHER_REGION, REGION, SKIPPED, STACK, WALL } from "@/mazes";
import { deltaE2000 } from "./colorDifference";
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

  // Every tone a Kruskal frame can show at once: the grid, both regions, the carved wall and the skipped one.
  const kruskalFrame = { WALL, CARVED, REGION, OTHER_REGION, ACTIVE, SKIPPED };
  // ΔE2000 of 12 or more reads as a different color at a glance, even in a small cell.
  const APART = 12;
  for (const [theme, colors] of Object.entries({ dark, light }))
    it(`every tone in a Kruskal frame is at least ΔE2000 ${APART} from the others (${theme})`, () => {
      const tones = mazePalette(colors);
      const entries = Object.entries(kruskalFrame);
      const tooClose: string[] = [];
      for (const [i, [a, sa]] of entries.entries())
        for (const [b, sb] of entries.slice(i + 1)) {
          const d = deltaE2000(tones[sa].rgb, tones[sb].rgb);
          if (d < APART) tooClose.push(`${a} vs ${b}: ΔE2000 ${d.toFixed(1)}`);
        }
      expect(tooClose).toEqual([]);
    });

  it("a skipped wall reads without color: it's crossed out, and no other maze tone is", () => {
    const tones = mazePalette(dark);
    expect(tones[SKIPPED].cross).toBe(true);
    for (const [state, tone] of tones.entries()) if (state !== SKIPPED) expect(tone.cross, `state ${state}`).toBeFalsy();
  });
});
