/**
 * Maze generation on an odd grid where walls are whole cells, shared by the Mazes module and
 * pathfinding's maze preset. Maze cells sit on odd (row, column) positions; carving opens the
 * wall cell between two of them. Cells are numbered row by row: cell = row * cols + col. Each
 * generator describes what it does one decision at a time.
 */

/** The generators, by name. */
export type MazeGeneratorName = "dfs" | "prim" | "kruskal" | "wilson";

/** The walled-in grid a maze is carved from. Odd rows and columns, so walls go all around. */
export type MazeGrid = { rows: number; cols: number };

export type MazeStep = {
  /** Pseudocode line (0-based) this step belongs to. */
  line: number;
} & (
  | /**
     * Carves the start cell, the first one in the maze. DFS pushes it on its stack; Prim
     * puts its neighbours on the frontier, given as `frontier`.
     */ { type: "start"; cell: number; frontier?: number[] }
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
  | /**
     * Prim takes `cell` off the frontier and carves it in through `wall`, which joins it to the
     * maze; `frontier` are the neighbours it adds to the frontier.
     */ {
      type: "pick";
      cell: number;
      wall: number;
      frontier: number[];
    }
  | /** Kruskal carves every cell, each its own region, before testing any wall. */ {
      type: "regions";
      cells: number[];
    }
  | /**
     * Kruskal tests `wall`: the cells on its two sides are in different regions, so it carves
     * the wall and the regions merge. `regions` are their cells (passages included) before
     * merging, the one on the wall's top or left side first. `left` counts the regions after it.
     */ {
      type: "join";
      wall: number;
      regions: [number[], number[]];
      left: number;
    }
  | /** Kruskal tests `wall`: both its sides are in `region` already, so carving it would close a loop. */ {
      type: "skip";
      wall: number;
      region: number[];
    }
  | /** Wilson puts its first cell in the maze: carved, with nothing joined to it yet. */ {
      type: "first";
      cell: number;
    }
  | /** Wilson starts a random walk at `cell`, a cell outside the maze. */ { type: "walkStart"; cell: number }
  | /**
     * Wilson's walk steps from its end through `wall` to `cell`, a random neighbour: a cell
     * not on the walk yet, one already on it (the walk crossed itself, a loop to erase next)
     * or one in the maze (the walk joins it next).
     */ {
      type: "walk";
      cell: number;
      wall: number;
      to: "new" | "loop" | "maze";
    }
  | /**
     * Wilson erases the loop the walk just closed: `erased` are its cells and walls, walled in
     * again. The walk goes on from `cell`, where it crossed itself.
     */ {
      type: "erase";
      cell: number;
      erased: number[];
    }
  | /** Wilson's walk reached the maze: `carved` are its cells and walls, carved in all at once. */ {
      type: "carveWalk";
      carved: number[];
    }
  | /** The maze is done: every dead-end cell gets marked. */ { type: "done"; deadEnds: number[] }
);

/** A generator: given the grid, the start cell and the seeded random source, its decisions in order. */
export type MazeGenerator = (grid: MazeGrid, start: number, random: () => number) => Generator<MazeStep, void>;


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

/** Whether `cell` is a maze cell (odd row and column) rather than a wall between them or a corner. */
export const isMazeCell = ({ cols }: MazeGrid, cell: number) => Math.floor(cell / cols) % 2 === 1 && (cell % cols) % 2 === 1;

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

export const primPseudocode = [
  "carve a random start cell",
  "add its neighbours to the frontier",
  "while the frontier isn't empty:",
  "  cell = a frontier cell, at random",
  "  m = one of its carved neighbours, at random",
  "  carve the wall between, carve cell",
  "  add its uncarved neighbours to the frontier",
  "mark every dead-end cell",
];

/**
 * Randomized Prim: grows the maze from its frontier, the uncarved cells next to it. Each step
 * picks a frontier cell at random, anywhere along the edge of the maze, and joins it through
 * a random wall. Short branching passages and many dead ends.
 */
const prim: MazeGenerator = function* (grid, start, random) {
  const carved = new Set([start]);
  const open = new Set<number>();
  const frontier: number[] = [];
  const onFrontier = new Set<number>();
  /** Adds the cell's neighbours that aren't carved or on the frontier yet; returns them. */
  const grow = (cell: number) => {
    const added = mazeNeighbors(grid, cell)
      .map((n) => n.cell)
      .filter((n) => !carved.has(n) && !onFrontier.has(n));
    for (const n of added) onFrontier.add(n);
    frontier.push(...added);
    return added;
  };
  yield { type: "start", cell: start, frontier: grow(start), line: 0 };
  while (frontier.length) {
    // Swap-remove, so a pick costs O(1) and the order stays seeded.
    const k = Math.floor(random() * frontier.length);
    const cell = frontier[k];
    frontier[k] = frontier[frontier.length - 1];
    frontier.pop();
    onFrontier.delete(cell);
    const joins = mazeNeighbors(grid, cell).filter((n) => carved.has(n.cell));
    const { wall } = joins[Math.floor(random() * joins.length)];
    carved.add(cell);
    open.add(wall);
    yield { type: "pick", cell, wall, frontier: grow(cell), line: 5 };
  }
  yield { type: "done", deadEnds: deadEndsOf(grid, (wall) => open.has(wall)), line: 7 };
};

export const kruskalPseudocode = [
  "carve every cell, each its own region",
  "shuffle the walls between cells",
  "for each wall, in that order:",
  "  a, b = the cells on its two sides",
  "  if a and b are in different regions:",
  "    carve the wall, merge the regions",
  "    if every cell is joined: stop",
  "  else: skip it (it would make a loop)",
  "mark every dead-end cell",
];

/**
 * Randomized Kruskal: every cell starts as its own region, and the walls between cells are
 * tested in a random order. A wall between two regions is carved and they merge; a wall inside
 * one region is skipped, since carving it would close a loop. It stops once every cell is joined.
 * Regions are disjoint sets; each keeps its cells (passages included) so a frame can show them.
 */
const kruskal: MazeGenerator = function* (grid, _start, random) {
  const cells = mazeCells(grid);
  const parent = new Map(cells.map((c) => [c, c]));
  const members = new Map(cells.map((c) => [c, [c]]));
  const find = (cell: number): number => {
    let root = cell;
    while (parent.get(root) !== root) root = parent.get(root)!;
    // Path compression: point every cell on the way straight at the root.
    while (cell !== root) {
      const next = parent.get(cell)!;
      parent.set(cell, root);
      cell = next;
    }
    return root;
  };
  yield { type: "regions", cells, line: 0 };

  // The walls to the right of and below each cell are all the walls between two cells.
  const walls = cells.flatMap((cell) =>
    mazeNeighbors(grid, cell)
      .filter((n) => n.cell > cell)
      .map((n) => ({ wall: n.wall, a: cell, b: n.cell })),
  );
  for (let i = walls.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [walls[i], walls[j]] = [walls[j], walls[i]];
  }

  const open = new Set<number>();
  let regions = cells.length;
  for (const { wall, a, b } of walls) {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) {
      yield { type: "skip", wall, region: members.get(ra)!.slice(), line: 7 };
      continue;
    }
    const left = regions - 1;
    // The wall that joins the last two regions ends the run: it lights up "stop".
    const line = left === 1 ? 6 : 5;
    yield { type: "join", wall, regions: [members.get(ra)!.slice(), members.get(rb)!.slice()], left, line };
    open.add(wall);
    // The smaller region joins the larger, so the lists stay cheap to merge.
    const [big, small] = members.get(ra)!.length >= members.get(rb)!.length ? [ra, rb] : [rb, ra];
    parent.set(small, big);
    members.get(big)!.push(...members.get(small)!, wall);
    members.delete(small);
    if (--regions === 1) break;
  }
  yield { type: "done", deadEnds: deadEndsOf(grid, (w) => open.has(w)), line: 8 };
};

export const wilsonPseudocode = [
  "put a random start cell in the maze",
  "while some cell isn't in the maze:",
  "  walk = a random cell outside the maze",
  "  while the walk's end isn't in the maze:",
  "    step to a random neighbour",
  "    if it's on the walk: erase the loop",
  "  carve the whole walk into the maze",
  "mark every dead-end cell",
];

/**
 * Wilson's algorithm: a loop-erased random walk from a random cell outside the maze until it
 * reaches the maze, then the whole walk is carved in. Every perfect maze is equally likely.
 * The first walks wander long, looking for a maze of one cell; later ones find it fast.
 */
/** A stretch of walk: each cell with the wall it was stepped into through (none for the walk's first). */
type WalkStretch = { cell: number; wall: number | null }[];

/** The grid cells a stretch of walk covers: its cells and the walls between them. */
const cellsAndWalls = (stretch: WalkStretch) => stretch.flatMap((w) => (w.wall === null ? [w.cell] : [w.wall, w.cell]));

const wilson: MazeGenerator = function* (grid, start, random) {
  const inMaze = new Set([start]);
  const open = new Set<number>();
  const pick = <T>(options: T[]) => options[Math.floor(random() * options.length)];
  yield { type: "first", cell: start, line: 0 };
  for (;;) {
    const outside = mazeCells(grid).filter((cell) => !inMaze.has(cell));
    if (!outside.length) break;
    const walk: WalkStretch = [{ cell: pick(outside), wall: null }];
    /** Where each cell on the walk sits in it. */
    const position = new Map([[walk[0].cell, 0]]);
    yield { type: "walkStart", cell: walk[0].cell, line: 2 };
    for (;;) {
      const { cell, wall } = pick(mazeNeighbors(grid, walk[walk.length - 1].cell));
      if (inMaze.has(cell)) {
        yield { type: "walk", cell, wall, to: "maze", line: 4 };
        const carved = [...cellsAndWalls(walk), wall];
        for (const w of walk) inMaze.add(w.cell);
        for (const w of carved) open.add(w);
        yield { type: "carveWalk", carved, line: 6 };
        break;
      }
      const crossed = position.get(cell);
      if (crossed === undefined) {
        position.set(cell, walk.length);
        walk.push({ cell, wall });
        yield { type: "walk", cell, wall, to: "new", line: 4 };
        continue;
      }
      yield { type: "walk", cell, wall, to: "loop", line: 4 };
      // The loop: every cell after the crossing, the walls into them, and the wall that closed it.
      const loop = walk.splice(crossed + 1);
      for (const w of loop) position.delete(w.cell);
      // Stepping straight back closes the loop through the wall it came by: a Set lists it once.
      const erased = new Set([...cellsAndWalls(loop), wall]);
      yield { type: "erase", cell, erased: [...erased], line: 5 };
    }
  }
  yield { type: "done", deadEnds: deadEndsOf(grid, (wall) => open.has(wall)), line: 7 };
};

export const mazeGenerators: Record<MazeGeneratorName, MazeGenerator> = { dfs, prim, kruskal, wilson };

/** Whether the generator grows from the seed's start cell (Kruskal joins regions everywhere at once). */
export const hasStartCell: Record<MazeGeneratorName, boolean> = { dfs: true, prim: true, kruskal: false, wilson: true };

export const mazePseudocode: Record<MazeGeneratorName, string[]> = {
  dfs: dfsPseudocode,
  prim: primPseudocode,
  kruskal: kruskalPseudocode,
  wilson: wilsonPseudocode,
};

/** The start cell a random source picks: its first draw, so every generator on a seed starts there. */
export const startCell = (grid: MazeGrid, random: () => number) => {
  const cells = mazeCells(grid);
  return cells[Math.floor(random() * cells.length)];
};

/** The walls a step carves through for good (Wilson's walk steps aren't: a loop may erase them). */
const carvedBy = (step: MazeStep): number[] => {
  switch (step.type) {
    case "carve":
    case "pick":
    case "join":
      return [step.wall];
    case "carveWalk":
      return step.carved;
    default:
      return [];
  }
};

/** A finished maze: its grid and the cells left open (every maze cell and the walls carved between them). */
export type CarvedMaze = MazeGrid & { open: ReadonlySet<number> };

/**
 * A finished maze's open cells, as a MazeRun on the same random source ends: every maze cell
 * and every wall carved between two of them. The start cell is the source's first draw.
 */
export const carvedCells = (generator: MazeGeneratorName, grid: MazeGrid, random: () => number): Set<number> => {
  const open = new Set(mazeCells(grid));
  for (const step of mazeGenerators[generator](grid, startCell(grid, random), random))
    for (const cell of carvedBy(step)) open.add(cell);
  return open;
};
