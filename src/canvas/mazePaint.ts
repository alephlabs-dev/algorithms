/* How mazes look on the shared grid renderer: a tone for each cell state. */

import { CARVED, DEAD_END, STACK, WALL, type MazeFrame, type MazeRun } from "@/mazes";
import type { GridCells, GridTone } from "./gridRenderer";
import { hexToRgb, type CanvasColors, type RGB } from "./theme";

const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** Mazes' tones in the current theme, indexed by cell state (WALL, CARVED, STACK, DEAD_END). */
export const mazePalette = (colors: CanvasColors): GridTone[] => {
  const background = hexToRgb(colors.background);
  const tones: GridTone[] = [];
  // The same wall and floor as pathfinding, so a maze looks the same in both modules.
  tones[WALL] = { rgb: mix(background, hexToRgb(colors.bar), 0.55) };
  tones[CARVED] = { rgb: mix(background, hexToRgb(colors.edge), 0.55) };
  tones[STACK] = { rgb: hexToRgb(colors.secondary) };
  tones[DEAD_END] = { rgb: hexToRgb(colors.tertiary) };
  return tones;
};

// A cell pops each time it moves along: carved onto the stack, popped off it, marked a dead end.
const RANK = { [WALL]: 0, [STACK]: 1, [CARVED]: 2, [DEAD_END]: 3 };

/** A carving frame as the grid renderer draws it, with the start cell's dot. */
export const mazeGridCells = (run: MazeRun, frame: MazeFrame): GridCells => ({
  rows: run.rows,
  cols: run.cols,
  tones: frame.states,
  ranks: Uint8Array.from(frame.states, (state) => RANK[state as keyof typeof RANK]),
  current: frame.current,
  start: run.start,
});
