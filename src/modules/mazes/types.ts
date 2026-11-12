/**
 * The Mazes module's types. The generators and their steps are shared with pathfinding's maze
 * preset (@/utils/mazeGenerators); a MazeRun records the steps, and each cell shows a state.
 */

import type { MazeGeneratorName } from "@/utils/mazeGenerators";

export type { MazeGenerator, MazeGrid, MazeStep } from "@/utils/mazeGenerators";

export type MazeAlgorithm = MazeGeneratorName;

/** Every generator, in the order the UI shows them. */
export const MAZE_ALGORITHMS: MazeAlgorithm[] = ["dfs", "prim", "kruskal", "wilson"];

/** What a cell shows. A wall is any cell not carved yet (or never: the corners between maze cells). */
export const WALL = 0;
export const CARVED = 1;
/** On DFS's stack: the way it can still go back along. */
export const STACK = 2;
export const DEAD_END = 3;
/** On Prim's frontier: not carved yet, but next to the maze, so it can be picked. */
export const FRONTIER = 4;
/**
 * The cell and wall the generator acts on this frame (Prim's pick and the wall it joins
 * through, the wall Kruskal carves, Wilson's walk step), for one frame. Every generator uses it
 * for its own move.
 */
export const ACTIVE = 5;
/** Kruskal's wall under test lies between two regions: this is the one on its top or left side. */
export const REGION = 6;
/** The region on the other side of Kruskal's wall under test, in a tone of its own. */
export const OTHER_REGION = 7;
/** A wall Kruskal tested and left standing, for one frame: both its sides are in one region. */
export const SKIPPED = 8;
/** On Wilson's walk in progress: not in the maze until the walk reaches it. */
export const WALK = 9;
export type MazeCellState =
  | typeof WALL
  | typeof CARVED
  | typeof STACK
  | typeof DEAD_END
  | typeof FRONTIER
  | typeof ACTIVE
  | typeof REGION
  | typeof OTHER_REGION
  | typeof SKIPPED
  | typeof WALK;

export type MazeStats = {
  /**
   * Decisions taken so far: the start, then each carve and backtrack (DFS), each pick (Prim),
   * each wall tested (Kruskal), or each walk start, walk step, loop erased and walk carved in (Wilson).
   */
  steps: number;
  /** Dead-end cells, counted once the maze is done; null before. */
  deadEnds: number | null;
};

export type MazeFrame = {
  /** A MazeCellState per cell. */
  states: Uint8Array;
  /** The cell the generator is at, if any. */
  current: number | null;
  line: number | null;
  stats: MazeStats;
};
