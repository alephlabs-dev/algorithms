import { describe, expect, it } from "vitest";
import { gridDimensions, gridSizes, stageGridDimensions } from "./gridSize";

const phone = (stageAspect: number | null) => ({ isMobile: true, isPortrait: true, stageAspect });

describe("stage grid dimensions", () => {
  it("a phone fits as many rows as its stage holds at the width's cell size, an odd number", () => {
    // A 361 × 259 stage (iPhone Safari with its bars): 11 columns of 32px leave room for 7 rows.
    expect(stageGridDimensions("small", phone(259 / 361))).toEqual({ rows: 7, cols: 11 });
    // The same phone with no bars (361 × 452): 13 rows.
    expect(stageGridDimensions("small", phone(452 / 361))).toEqual({ rows: 13, cols: 11 });
    expect(stageGridDimensions("medium", phone(259 / 361))).toEqual({ rows: 9, cols: 15 });
    expect(stageGridDimensions("large", phone(259 / 361))).toEqual({ rows: 15, cols: 21 });
  });

  it("on a phone the width always sets the cell size", () => {
    for (const size of gridSizes)
      for (let height = 200; height <= 700; height += 7) {
        const width = 361;
        const { rows, cols } = stageGridDimensions(size, phone(height / width));
        expect(height / rows).toBeGreaterThanOrEqual(width / cols);
      }
  });

  it("a very short phone stage still gets a grid of five rows", () => {
    expect(stageGridDimensions("small", phone(80 / 288))).toEqual({ rows: 5, cols: 11 });
  });

  it("before the stage is measured, a phone gets the upright grid", () => {
    for (const size of gridSizes) expect(stageGridDimensions(size, phone(null))).toEqual(gridDimensions(size, true));
  });

  it("tablets and desktops keep their grids whatever the stage's shape", () => {
    for (const size of gridSizes) {
      const portrait = { isMobile: false, isPortrait: true, stageAspect: 0.5 };
      const wide = { isMobile: false, isPortrait: false, stageAspect: 0.5 };
      expect(stageGridDimensions(size, portrait)).toEqual(gridDimensions(size, true));
      expect(stageGridDimensions(size, wide)).toEqual(gridDimensions(size, false));
    }
  });
});
