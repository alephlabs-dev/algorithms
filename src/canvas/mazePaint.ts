/* How mazes look on the shared grid renderer: a tone for each cell state. */

import { CARVED, DEAD_END, FRONTIER, ACTIVE, STACK, WALL, type MazeFrame, type MazeRun } from "@/mazes";
import type { GridCells, GridTone } from "./gridRenderer";
import { gridFloor, gridWall } from "./pathPaint";
import { hexToRgb, type CanvasColors } from "./theme";

/** Mazes' tones in the current theme, indexed by cell state. */
export const mazePalette = (colors: CanvasColors): GridTone[] => {
  const tones: GridTone[] = [];
  tones[WALL] = { rgb: gridWall(colors) };
  tones[CARVED] = { rgb: gridFloor(colors) };
  tones[STACK] = { rgb: hexToRgb(colors.secondary) };
  tones[DEAD_END] = { rgb: hexToRgb(colors.tertiary) };
  // Like pathfinding's frontier: the cells it can reach next.
  tones[FRONTIER] = { rgb: hexToRgb(colors.secondary) };
  // The move this frame: the outline color, apart from every data color and the start dot.
  tones[ACTIVE] = { rgb: hexToRgb(colors.outline) };
  return tones;
};

// A cell pops each time it moves along: onto the stack or the frontier, acted on, carved, marked a dead end.
const RANK = { [WALL]: 0, [STACK]: 1, [FRONTIER]: 1, [ACTIVE]: 2, [CARVED]: 3, [DEAD_END]: 4 };

/** A carving frame as the grid renderer draws it, with the start cell's dot. */
export const mazeGridCells = (run: MazeRun, frame: MazeFrame): GridCells => ({
  rows: run.rows,
  cols: run.cols,
  tones: frame.states,
  ranks: Uint8Array.from(frame.states, (state) => RANK[state as keyof typeof RANK]),
  current: frame.current,
  start: run.start,
});
