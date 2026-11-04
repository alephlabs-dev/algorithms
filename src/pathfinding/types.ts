/**
 * Pathfinding on a grid. Cells are numbered row by row: cell = row * cols + col.
 * Like the sorting algorithms, each search is a generator that describes what it
 * does one step at a time; a PathTimeline records the steps so playback can go
 * back and forth.
 */

export type PathAlgorithm = "bfs" | "dfs" | "dijkstra" | "astar" | "greedy";

/** What a cell is made of. Mud can be crossed but costs more. */
export const EMPTY = 0;
export const WALL = 1;
export const MUD = 2;
export type Terrain = typeof EMPTY | typeof WALL | typeof MUD;

/** Cost of stepping onto a cell. */
export const MUD_COST = 5;

export type Grid = {
  rows: number;
  cols: number;
  /** Terrain per cell. */
  cells: Uint8Array;
  start: number;
  end: number;
};

export type PathStep = {
  /** Pseudocode line (0-based) this step belongs to. */
  line?: number;
} & (
  | /** Takes `cell` out of the frontier and looks at it. `cost` is the best known cost to reach it. */ {
      type: "visit";
      cell: number;
      cost: number;
    }
  | /** Adds cells to the frontier (or improves their cost). */ { type: "frontier"; cells: number[] }
  | /** Marks one more cell of the final path, from the start towards the end. */ { type: "path"; cell: number }
  | /** The search is over. */ { type: "done"; found: boolean }
);

export type PathSearch = (grid: Grid) => Generator<PathStep, void>;

/** Cell states shown on screen, besides terrain. */
export const UNSEEN = 0;
export const FRONTIER = 1;
export const VISITED = 2;
export const ON_PATH = 3;

export type PathStats = {
  /** Cells taken out of the frontier and examined. */
  visited: number;
  /** Steps in the path found so far (shown while it's traced). */
  pathLength: number;
  /** Total cost of the path, counting mud. */
  pathCost: number;
};

export type PathFrame = {
  /** UNSEEN, FRONTIER, VISITED or ON_PATH per cell. */
  states: Uint8Array;
  /** The cell being examined, if any. */
  current: number | null;
  line: number | null;
  /** null while searching; then whether the end was reached. */
  found: boolean | null;
  stats: PathStats;
};
