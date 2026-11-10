/**
 * Maze generation on an odd grid where walls are whole cells, like pathfinding's maze preset.
 * Maze cells sit on odd (row, column) positions; carving opens the wall cell between two of
 * them. Cells are numbered row by row: cell = row * cols + col. Like the other modules, each
 * generator describes what it does one decision at a time, and a MazeRun records the steps.
 */

export type MazeAlgorithm = "dfs";

/** The walled-in grid a maze is carved from. Odd rows and columns, so walls go all around. */
export type MazeGrid = { rows: number; cols: number };

export type MazeStep = {
  /** Pseudocode line (0-based) this step belongs to. */
  line: number;
} & (
  | /** Carves the start cell, the first one in the maze. DFS pushes it on its stack. */ { type: "start"; cell: number }
  | /** Opens `wall` between the current cell and `cell`, and carves `cell`. DFS pushes it. */ {
      type: "carve";
      wall: number;
      cell: number;
    }
  | /** DFS takes `cell` off its stack, along with `wall`, the passage back to the cell before it (if any). */ {
      type: "backtrack";
      cell: number;
      wall: number | null;
    }
  | /** The maze is done: every dead-end cell gets marked. */ { type: "done"; deadEnds: number[] }
);

/** A generator: given the grid, the start cell and the seeded random source, its decisions in order. */
export type MazeGenerator = (grid: MazeGrid, start: number, random: () => number) => Generator<MazeStep, void>;

/** What a cell shows. A wall is any cell not carved yet (or never: the corners between maze cells). */
export const WALL = 0;
export const CARVED = 1;
/** On DFS's stack: the way it can still go back along. */
export const STACK = 2;
export const DEAD_END = 3;
export type MazeCellState = typeof WALL | typeof CARVED | typeof STACK | typeof DEAD_END;

export type MazeStats = {
  /** Decisions taken so far. */
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
  /** How many cells are on DFS's stack. */
  stack: number;
  stats: MazeStats;
};
