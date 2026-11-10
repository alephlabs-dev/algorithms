/* How mazes look on the shared grid renderer: a tone for each cell state. */

import { CARVED, DEAD_END, STACK, WALL, type MazeFrame, type MazeRun } from "@/mazes";
import type { GridCells, GridTone } from "./gridRenderer";
import { gridFloor, gridWall } from "./pathPaint";
import { hexToRgb, type CanvasColors } from "./theme";

/** Mazes' tones in the current theme, indexed by cell state (WALL, CARVED, STACK, DEAD_END). */
export const mazePalette = (colors: CanvasColors): GridTone[] => {
  const tones: GridTone[] = [];
  tones[WALL] = { rgb: gridWall(colors) };
  tones[CARVED] = { rgb: gridFloor(colors) };
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
