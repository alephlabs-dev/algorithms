/* How mazes look on the shared grid renderer: a tone for each cell state. */

import type { MazeRun } from "./run";
import { ACTIVE, CARVED, DEAD_END, FRONTIER, OTHER_REGION, REGION, SKIPPED, STACK, WALK, WALL, type MazeFrame } from "./types";
import type { GridCells, GridTone } from "@/canvas/gridRenderer";
import { gridFloor, gridWall, hexToRgb, type CanvasColors } from "@/canvas/theme";

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
  // Kruskal's two regions either side of the wall under test. Kruskal has no start dot, so the
  // primary color is free for the second one.
  tones[REGION] = { rgb: hexToRgb(colors.secondary) };
  tones[OTHER_REGION] = { rgb: hexToRgb(colors.primary) };
  // A wall it leaves standing, in the color every module uses for "not allowed", crossed out
  // so it reads without color too.
  tones[SKIPPED] = { rgb: hexToRgb(colors.conflict), cross: true };
  // Like DFS's stack: the path in progress, not in the maze yet.
  tones[WALK] = { rgb: hexToRgb(colors.secondary) };
  return tones;
};

// A cell pops each time it moves along: onto the stack, the frontier or the walk, acted on, carved,
// marked a dead end. So a walk joining the maze pops all at once.
// Kruskal's regions and skipped wall pop as they light up, and again as they settle back.
const RANK = {
  [WALL]: 0,
  [STACK]: 1,
  [FRONTIER]: 1,
  [WALK]: 1,
  [ACTIVE]: 2,
  [REGION]: 2,
  [OTHER_REGION]: 2,
  [SKIPPED]: 2,
  [CARVED]: 3,
  [DEAD_END]: 4,
};

/** A carving frame as the grid renderer draws it, with the start cell's dot. */
export const mazeGridCells = (run: MazeRun, frame: MazeFrame): GridCells => ({
  rows: run.rows,
  cols: run.cols,
  tones: frame.states,
  ranks: Uint8Array.from(frame.states, (state) => RANK[state as keyof typeof RANK]),
  current: frame.current,
  start: run.start ?? undefined,
});
