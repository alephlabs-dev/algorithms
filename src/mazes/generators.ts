import type { MazeAlgorithm, MazeGenerator, MazeGrid } from "./types";

/** Maze cells two steps away (up, right, down, left) inside the border, with the wall between. */
export const mazeNeighbors = ({ rows, cols }: MazeGrid, cell: number) => {
  const row = Math.floor(cell / cols);
  const col = cell % cols;
  const out: { cell: number; wall: number }[] = [];
  if (row > 1) out.push({ cell: cell - 2 * cols, wall: cell - cols });
  if (col < cols - 2) out.push({ cell: cell + 2, wall: cell + 1 });
  if (row < rows - 2) out.push({ cell: cell + 2 * cols, wall: cell + cols });
  if (col > 1) out.push({ cell: cell - 2, wall: cell - 1 });
  return out;
};

/** Every maze cell of the grid: the odd rows and columns. */
export const mazeCells = ({ rows, cols }: MazeGrid) => {
  const cells: number[] = [];
  for (let r = 1; r < rows; r += 2) for (let c = 1; c < cols; c += 2) cells.push(r * cols + c);
  return cells;
};

/** Maze cells with only one way out, once every passage in `open` is carved. */
export const deadEndsOf = (grid: MazeGrid, open: (cell: number) => boolean) =>
  mazeCells(grid).filter((cell) => mazeNeighbors(grid, cell).filter((n) => open(n.wall)).length === 1);

export const dfsPseudocode = [
  "carve a random start cell, push it",
  "while the stack isn't empty:",
  "  cell = the top of the stack",
  "  if cell has uncarved neighbours:",
  "    n = one of them, at random",
  "    carve the wall between, carve n",
  "    push n",
  "  else: pop cell (backtrack)",
  "mark every dead-end cell",
];

/**
 * Randomized depth-first search: carves on from the newest cell until it's stuck, then
 * backtracks along its stack to the last cell that still has an uncarved neighbour.
 * Long winding corridors and few dead ends.
 */
const dfs: MazeGenerator = function* (grid, start, random) {
  const carved = new Set([start]);
  const open = new Set<number>();
  /** Each cell on the stack, with the wall it was carved through. */
  const stack: { cell: number; wall: number | null }[] = [{ cell: start, wall: null }];
  yield { type: "start", cell: start, line: 0 };
  while (stack.length) {
    const { cell, wall } = stack[stack.length - 1];
    const options = mazeNeighbors(grid, cell).filter((n) => !carved.has(n.cell));
    if (!options.length) {
      stack.pop();
      yield { type: "backtrack", cell, wall, line: 7 };
      continue;
    }
    const next = options[Math.floor(random() * options.length)];
    carved.add(next.cell);
    open.add(next.wall);
    stack.push(next);
    yield { type: "carve", wall: next.wall, cell: next.cell, line: 5 };
  }
  yield { type: "done", deadEnds: deadEndsOf(grid, (wall) => open.has(wall)), line: 8 };
};

/** Every generator, in the order the UI shows them. */
export const MAZE_ALGORITHMS: MazeAlgorithm[] = ["dfs"];

export const mazeGenerators: Record<MazeAlgorithm, MazeGenerator> = { dfs };

export const mazePseudocode: Record<MazeAlgorithm, string[]> = { dfs: dfsPseudocode };
