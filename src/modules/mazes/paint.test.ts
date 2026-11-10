import { describe, expect, it } from "vitest";
import { ACTIVE, CARVED, DEAD_END, FRONTIER, OTHER_REGION, REGION, SKIPPED, STACK, WALK, WALL } from "./types";
import { deltaE2000 } from "@/canvas/colorDifference";
import { cssColors } from "@/canvas/cssColors";
import { mazePalette } from "./paint";
import { hexToRgb } from "@/canvas/theme";

const { dark, light } = cssColors;

describe("maze tones", () => {
  for (const [theme, colors] of Object.entries({ dark, light }))
    it(`the move on stage stands apart from the start dot and every other tone (${theme})`, () => {
      for (const [key, value] of Object.entries(colors)) expect(value, `--color-${key} read from index.css`).toMatch(/^#[0-9a-f]{6}$/i);
      const tones = mazePalette(colors);
      expect(tones[ACTIVE].rgb).not.toEqual(hexToRgb(colors.primary));
      for (const other of [WALL, CARVED, STACK, DEAD_END, FRONTIER, WALK]) expect(tones[ACTIVE].rgb).not.toEqual(tones[other].rgb);
    });

  // ΔE2000 of 12 or more reads as a different color at a glance, even in a small cell.
  const APART = 12;

  // The current-cell ring is two strokes, a dark one inside a light one. They must read as two,
  // and on every tone the ring can sit on, at least one of them must stand apart from it.
  // The grid renderer is shared: pathfinding checks its own tones the same way (pathfinding's paint test).
  for (const [theme, colors] of Object.entries({ dark, light }))
    it(`the current-cell ring has a stroke at least ΔE2000 ${APART} from every tone it can sit on (${theme})`, () => {
      const inner = hexToRgb(colors.ringInner);
      const outer = hexToRgb(colors.ringOuter);
      expect(deltaE2000(inner, outer), "inner vs outer stroke").toBeGreaterThanOrEqual(APART);
      const maze = mazePalette(colors);
      const under = {
        ...Object.fromEntries(Object.entries({ WALL, CARVED, STACK, FRONTIER, DEAD_END, ACTIVE, WALK }).map(([name, s]) => [name, maze[s].rgb])),
        // Half the outer stroke sits on the gap between cells.
        background: hexToRgb(colors.background),
      };
      const tooClose = Object.entries(under)
        .map(([name, rgb]) => [name, Math.max(deltaE2000(inner, rgb), deltaE2000(outer, rgb))] as const)
        .filter(([, d]) => d < APART)
        .map(([name, d]) => `${name}: ΔE2000 ${d.toFixed(1)}`);
      expect(tooClose).toEqual([]);
    });

  // Every tone a Kruskal frame can show at once: the grid, both regions, the carved wall and the skipped one.
  const kruskalFrame = { WALL, CARVED, REGION, OTHER_REGION, ACTIVE, SKIPPED };
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
