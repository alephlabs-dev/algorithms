import { carvedCells, type CarvedMaze } from "@/utils/mazeGenerators";
import { EMPTY, MUD, MUD_COST, WALL, type Grid, type Terrain } from "./types";

export const cellOf = (grid: Pick<Grid, "cols">, row: number, col: number) => row * grid.cols + col;
export const rowOf = (grid: Pick<Grid, "cols">, cell: number) => Math.floor(cell / grid.cols);
export const colOf = (grid: Pick<Grid, "cols">, cell: number) => cell % grid.cols;

/** Passable cells next to `cell`, in a fixed order: up, right, down, left. */
export const neighbors = (grid: Grid, cell: number): number[] => {
  const row = rowOf(grid, cell);
  const col = colOf(grid, cell);
  const out: number[] = [];
  if (row > 0) out.push(cell - grid.cols);
  if (col < grid.cols - 1) out.push(cell + 1);
  if (row < grid.rows - 1) out.push(cell + grid.cols);
  if (col > 0) out.push(cell - 1);
  return out.filter((n) => grid.cells[n] !== WALL);
};

/** Cost of stepping onto `cell`. */
export const stepCost = (grid: Grid, cell: number) => (grid.cells[cell] === MUD ? MUD_COST : 1);

/** Steps between two cells ignoring walls (Manhattan distance): the A* and greedy heuristic. */
export const manhattan = (grid: Grid, a: number, b: number) =>
  Math.abs(rowOf(grid, a) - rowOf(grid, b)) + Math.abs(colOf(grid, a) - colOf(grid, b));

/** An empty grid with start and end on the middle row, a few cells in from each side. */
export const emptyGrid = (rows: number, cols: number): Grid => {
  const mid = Math.floor(rows / 2);
  const inset = Math.max(1, Math.floor(cols / 6));
  return {
    rows,
    cols,
    cells: new Uint8Array(rows * cols),
    start: cellOf({ cols }, mid, inset),
    end: cellOf({ cols }, mid, cols - 1 - inset),
  };
};

export const withTerrain = (grid: Grid, cell: number, terrain: Terrain): Grid => {
  if (cell === grid.start || cell === grid.end || grid.cells[cell] === terrain) return grid;
  const cells = grid.cells.slice();
  cells[cell] = terrain;
  return { ...grid, cells };
};

/** Moves the start or end marker, clearing whatever terrain was under it. */
export const withMarker = (grid: Grid, marker: "start" | "end", cell: number): Grid => {
  if (cell === grid.start || cell === grid.end) return grid;
  const cells = grid.cells.slice();
  cells[cell] = EMPTY;
  return { ...grid, cells, [marker]: cell };
};

export type Preset = "clear" | "maze" | "walls" | "terrain";

/**
 * A maze carved by the Mazes module's randomized depth-first search: corridors on odd cells,
 * so every open cell is reachable and there's exactly one way between two points, until a few
 * gaps open more.
 */
const carveMaze = (grid: Grid, random: () => number) => {
  const { rows, cols } = grid;
  const cells = new Uint8Array(rows * cols).fill(WALL);
  for (const cell of carvedCells("dfs", grid, random)) cells[cell] = EMPTY;
  // Open a few extra gaps so there's more than one route and searches differ.
  for (let k = 0; k < (rows * cols) / 40; k++) {
    const r = 1 + Math.floor(random() * (rows - 2));
    const c = 1 + Math.floor(random() * (cols - 2));
    if ((r + c) % 2 === 1) cells[cellOf(grid, r, c)] = EMPTY;
  }
  // Start and end may sit on cells the maze never opens (moved by hand, or on
  // even rows and columns); open the shortest way from each into the maze.
  // Every maze cell is joined to every other: the first one stands for them all.
  const root = cellOf(grid, 1, 1);
  for (const marker of [grid.start, grid.end]) {
    cells[marker] = EMPTY;
    joinTo(cells, grid, root, marker);
  }
  return cells;
};

/** All four neighbors of a cell, walls included. */
const around = (grid: Grid, cell: number) => neighbors({ ...grid, cells: new Uint8Array(grid.rows * grid.cols) }, cell);

/** Opens the fewest walls needed so `from` is reachable from `root`. */
const joinTo = (cells: Uint8Array, grid: Grid, root: number, from: number) => {
  // The cells already connected to the root.
  const reached = new Set([root]);
  const queue = [root];
  while (queue.length) {
    for (const n of around(grid, queue.shift()!)) {
      if (cells[n] !== WALL && !reached.has(n)) {
        reached.add(n);
        queue.push(n);
      }
    }
  }
  if (reached.has(from)) return;
  // Walk out from `from`, through walls too, to the nearest connected cell; open the way back.
  const parent = new Map<number, number>([[from, from]]);
  const frontier = [from];
  while (frontier.length) {
    const cell = frontier.shift()!;
    if (reached.has(cell)) {
      for (let c = parent.get(cell)!; c !== from; c = parent.get(c)!) cells[c] = EMPTY;
      return;
    }
    for (const n of around(grid, cell)) {
      if (!parent.has(n)) {
        parent.set(n, cell);
        frontier.push(n);
      }
    }
  }
};

/**
 * A maze from Mazes as it was carved: open cells empty, every other cell a wall, start and end on
 * the maze cells in opposite corners (top left, bottom right), so it stays a perfect maze.
 */
export const gridFromMaze = ({ rows, cols, open }: CarvedMaze): Grid => {
  const cells = new Uint8Array(rows * cols).fill(WALL);
  for (const cell of open) cells[cell] = EMPTY;
  return { rows, cols, cells, start: cellOf({ cols }, 1, 1), end: cellOf({ cols }, rows - 2, cols - 2) };
};

/** Fills the grid with a ready-made layout, keeping start and end where they are (or nearby, for mazes). */
export const applyPreset = (grid: Grid, preset: Preset, random: () => number): Grid => {
  const { rows, cols } = grid;
  let cells: Uint8Array;
  if (preset === "clear") cells = new Uint8Array(rows * cols);
  else if (preset === "maze") cells = carveMaze(grid, random);
  else {
    cells = new Uint8Array(rows * cols);
    for (let i = 0; i < cells.length; i++) {
      const roll = random();
      if (preset === "walls") cells[i] = roll < 0.28 ? WALL : EMPTY;
      // Terrain: mostly mud patches, a few walls, so costs matter more than obstacles.
      else cells[i] = roll < 0.08 ? WALL : roll < 0.4 ? MUD : EMPTY;
    }
    if (preset === "terrain") smoothMud(cells, grid);
  }
  cells[grid.start] = EMPTY;
  cells[grid.end] = EMPTY;
  return { ...grid, cells };
};

/** Turns scattered mud into blobs: a cell becomes mud if most of its neighbours are. */
const smoothMud = (cells: Uint8Array, grid: Grid) => {
  const copy = cells.slice();
  for (let i = 0; i < cells.length; i++) {
    if (copy[i] === WALL) continue;
    const around = [i - grid.cols, i + grid.cols, colOf(grid, i) > 0 ? i - 1 : -1, colOf(grid, i) < grid.cols - 1 ? i + 1 : -1];
    const mud = around.filter((n) => n >= 0 && n < cells.length && copy[n] === MUD).length;
    cells[i] = mud >= 2 ? MUD : mud === 0 ? EMPTY : copy[i];
  }
};

// Sharing: terrain packs 4 cells per byte (2 bits each), then base64url.

export const encodeCells = (cells: Uint8Array): string => {
  const bytes = new Uint8Array(Math.ceil(cells.length / 4));
  cells.forEach((t, i) => (bytes[i >> 2] |= t << ((i & 3) * 2)));
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

export const decodeCells = (text: string, count: number): Uint8Array | null => {
  try {
    const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
    if (binary.length !== Math.ceil(count / 4)) return null;
    const cells = new Uint8Array(count);
    for (let i = 0; i < count; i++) {
      const t = (binary.charCodeAt(i >> 2) >> ((i & 3) * 2)) & 3;
      if (t > MUD) return null;
      cells[i] = t;
    }
    return cells;
  } catch {
    return null;
  }
};
