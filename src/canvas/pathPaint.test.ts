import { describe, expect, it } from "vitest";
import { EMPTY, FRONTIER, MUD, ON_PATH, UNSEEN, VISITED, WALL, type Grid, type PathFrame } from "@/pathfinding";
import { pathGridCells, pathPalette } from "./pathPaint";
import type { CanvasColors } from "./theme";

// The theme colors in src/index.css when the renderer stopped knowing about pathfinding (#151).
const dark: CanvasColors = {
  background: "#0b0f0d",
  foreground: "#e9eeeb",
  bar: "#d9dfdb",
  muted: "#8fa39a",
  outline: "#ffffff",
  ring: "#b2b7b4",
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
  ring: "#4d5e78",
  primary: "#128a78",
  secondary: "#e8590c",
  tertiary: "#5b6cff",
  dim: "#b9c4d4",
  edge: "#cfd8e5",
  mud: "#cdb88f",
  conflict: "#d42c2c",
};

type Case = [terrain: number, state: number, rgb: [number, number, number]];

// Captured from the renderer before the change (44ead63), as drawn: each channel truncated.
const before: Record<"dark" | "light", Case[]> = {
  dark: [
    [EMPTY, UNSEEN, [29, 38, 33]],
    [EMPTY, FRONTIER, [176, 124, 255]],
    [EMPTY, VISITED, [73, 56, 104]],
    [EMPTY, ON_PATH, [62, 207, 142]],
    [WALL, UNSEEN, [124, 129, 126]],
    [WALL, FRONTIER, [124, 129, 126]],
    [WALL, VISITED, [124, 129, 126]],
    [WALL, ON_PATH, [124, 129, 126]],
    [MUD, UNSEEN, [110, 90, 59]],
    [MUD, FRONTIER, [176, 124, 255]],
    [MUD, VISITED, [135, 102, 133]],
    [MUD, ON_PATH, [62, 207, 142]],
  ],
  light: [
    [EMPTY, UNSEEN, [222, 229, 238]],
    [EMPTY, FRONTIER, [232, 89, 12]],
    [EMPTY, VISITED, [239, 207, 192]],
    [EMPTY, ON_PATH, [18, 138, 120]],
    [WALL, UNSEEN, [133, 146, 168]],
    [WALL, FRONTIER, [133, 146, 168]],
    [WALL, VISITED, [133, 146, 168]],
    [WALL, ON_PATH, [133, 146, 168]],
    [MUD, UNSEEN, [205, 184, 143]],
    [MUD, FRONTIER, [232, 89, 12]],
    [MUD, VISITED, [211, 161, 111]],
    [MUD, ON_PATH, [18, 138, 120]],
  ],
};

/** One cell per case, in a single row, with the frame giving each its search state. */
const gridOf = (cases: Case[]): { grid: Grid; frame: PathFrame } => ({
  grid: { rows: 1, cols: cases.length, cells: Uint8Array.from(cases.map(([t]) => t)), start: 0, end: cases.length - 1 },
  frame: {
    states: Uint8Array.from(cases.map(([, s]) => s)),
    current: null,
    line: null,
    found: null,
    stats: { visited: 0, pathLength: 0, pathCost: 0 },
  },
});

describe("pathfinding on the shared grid renderer", () => {
  for (const [name, colors] of [["dark", dark], ["light", light]] as const) {
    it(`gives every terrain and search state the same color as before, ${name} theme`, () => {
      const { grid, frame } = gridOf(before[name]);
      const palette = pathPalette(colors);
      const { tones } = pathGridCells(grid, frame);
      const drawn = before[name].map((_, cell) => palette[tones[cell]].rgb.map((v) => v | 0));
      expect(drawn).toEqual(before[name].map(([, , rgb]) => rgb));
    });
  }

  it("ranks a cell higher each time its search state advances, so it pops on frontier, visited and path", () => {
    for (const terrain of [EMPTY, MUD]) {
      const cases: Case[] = [UNSEEN, FRONTIER, VISITED, ON_PATH].map((s) => [terrain, s, [0, 0, 0]]);
      const { grid, frame } = gridOf(cases);
      const { ranks } = pathGridCells(grid, frame);
      expect(ranks[0]).toBeLessThan(ranks[1]);
      expect(ranks[1]).toBeLessThan(ranks[2]);
      expect(ranks[2]).toBeLessThan(ranks[3]);
    }
  });

  it("dots mud everywhere but on the path, so it reads without color", () => {
    const cases: Case[] = [EMPTY, WALL, MUD].flatMap((t) =>
      [UNSEEN, FRONTIER, VISITED, ON_PATH].map((s): Case => [t, s, [0, 0, 0]]),
    );
    const { grid, frame } = gridOf(cases);
    const palette = pathPalette(dark);
    const { tones } = pathGridCells(grid, frame);
    const dotted = cases.map(([t, s], cell) => [t, s, !!palette[tones[cell]].dots]);
    expect(dotted).toEqual(cases.map(([t, s]) => [t, s, t === MUD && s !== ON_PATH]));
  });

  it("hands the renderer the grid's size, start, target and the cell being examined", () => {
    const { grid, frame } = gridOf(before.dark);
    const cells = pathGridCells(grid, { ...frame, current: 3 });
    expect(cells).toMatchObject({ rows: 1, cols: 12, start: 0, end: 11, current: 3 });
  });
});
