import { manhattan, neighbors, stepCost } from "./grid";
import type { Grid, PathAlgorithm, PathSearch, PathStep } from "./types";

/** Walks `cameFrom` back from the end and yields the path from the start, one cell per step. */
function* tracePath(grid: Grid, cameFrom: Map<number, number>, line: number): Generator<PathStep, void> {
  const path: number[] = [];
  for (let cell: number | undefined = grid.end; cell !== undefined; cell = cameFrom.get(cell)) path.push(cell);
  for (let k = path.length - 1; k >= 0; k--) yield { type: "path", cell: path[k], line };
  yield { type: "done", found: true, line };
}

export const bfsPseudocode = [
  "queue = [start], seen = {start}",
  "while the queue isn't empty:",
  "  cell = take the first cell in the queue",
  "  if cell is the target: trace the path back, done",
  "  for each open neighbour n of cell:",
  "    if n hasn't been seen:",
  "      seen.add(n), came_from[n] = cell",
  "      add n to the end of the queue",
  "no path: the target can't be reached",
];

/** Breadth-first: explores in rings around the start, so the first path found has the fewest steps. */
const bfs: PathSearch = function* (grid) {
  const queue = [grid.start];
  const seen = new Set([grid.start]);
  const cameFrom = new Map<number, number>();
  const steps = new Map([[grid.start, 0]]);
  yield { type: "frontier", cells: [grid.start], line: 0 };
  while (queue.length) {
    const cell = queue.shift()!;
    yield { type: "visit", cell, cost: steps.get(cell)!, line: 2 };
    if (cell === grid.end) return yield* tracePath(grid, cameFrom, 3);
    const added: number[] = [];
    for (const n of neighbors(grid, cell)) {
      if (seen.has(n)) continue;
      seen.add(n);
      cameFrom.set(n, cell);
      steps.set(n, steps.get(cell)! + 1);
      queue.push(n);
      added.push(n);
    }
    if (added.length) yield { type: "frontier", cells: added, line: 7 };
  }
  yield { type: "done", found: false, line: 8 };
};

export const dfsPseudocode = [
  "stack = [start]",
  "while the stack isn't empty:",
  "  cell = take the last cell off the stack",
  "  if cell was already visited: skip it",
  "  mark cell as visited",
  "  if cell is the target: trace the path back, done",
  "  for each open neighbour n of cell:",
  "    if n isn't visited: came_from[n] = cell, push n",
  "no path: the target can't be reached",
];

/** Depth-first: follows one corridor as far as it goes before backtracking. Finds a path, rarely the shortest. */
const dfs: PathSearch = function* (grid) {
  const stack = [grid.start];
  const visited = new Set<number>();
  const cameFrom = new Map<number, number>();
  const depth = new Map([[grid.start, 0]]);
  yield { type: "frontier", cells: [grid.start], line: 0 };
  while (stack.length) {
    const cell = stack.pop()!;
    if (visited.has(cell)) continue;
    visited.add(cell);
    yield { type: "visit", cell, cost: depth.get(cell)!, line: 4 };
    if (cell === grid.end) return yield* tracePath(grid, cameFrom, 5);
    const pushed: number[] = [];
    // Pushed in reverse so the first neighbour (up) is explored first.
    for (const n of neighbors(grid, cell).reverse()) {
      if (visited.has(n)) continue;
      cameFrom.set(n, cell);
      depth.set(n, depth.get(cell)! + 1);
      stack.push(n);
      pushed.push(n);
    }
    if (pushed.length) yield { type: "frontier", cells: pushed, line: 7 };
  }
  yield { type: "done", found: false, line: 8 };
};

/**
 * Best-first search: always expands the open cell with the lowest priority.
 * Dijkstra ranks by cost so far, A* by cost so far plus the distance left,
 * greedy by the distance left alone. A linear scan of the open set is plenty
 * for grids of a few hundred cells and keeps the order easy to follow.
 */
const bestFirst = (
  priority: (cost: number, distanceLeft: number) => number,
  lines: { pick: number; target: number; push: number; none: number },
  /** Greedy ignores costs: a cell is never reopened once seen. */
  improveCosts: boolean
): PathSearch =>
  function* (grid) {
    const cost = new Map([[grid.start, 0]]);
    const cameFrom = new Map<number, number>();
    const open = new Set([grid.start]);
    const closed = new Set<number>();
    const rank = (cell: number) => priority(cost.get(cell)!, manhattan(grid, cell, grid.end));
    yield { type: "frontier", cells: [grid.start], line: 0 };
    while (open.size) {
      let cell = -1;
      for (const c of open) {
        // Ties go to the cell closer to the target, then to the one opened first.
        if (cell === -1 || rank(c) < rank(cell) || (rank(c) === rank(cell) && manhattan(grid, c, grid.end) < manhattan(grid, cell, grid.end))) cell = c;
      }
      open.delete(cell);
      closed.add(cell);
      yield { type: "visit", cell, cost: cost.get(cell)!, line: lines.pick };
      if (cell === grid.end) return yield* tracePath(grid, cameFrom, lines.target);
      const changed: number[] = [];
      for (const n of neighbors(grid, cell)) {
        if (closed.has(n)) continue;
        const next = cost.get(cell)! + stepCost(grid, n);
        const known = cost.get(n);
        if (known !== undefined && (!improveCosts || next >= known)) continue;
        cost.set(n, next);
        cameFrom.set(n, cell);
        open.add(n);
        changed.push(n);
      }
      if (changed.length) yield { type: "frontier", cells: changed, line: lines.push };
    }
    yield { type: "done", found: false, line: lines.none };
  };

export const dijkstraPseudocode = [
  "cost[start] = 0, open = {start}",
  "while open isn't empty:",
  "  cell = the open cell with the lowest cost",
  "  if cell is the target: trace the path back, done",
  "  for each open neighbour n of cell:",
  "    new_cost = cost[cell] + cost of stepping on n",
  "    if new_cost < cost[n]:",
  "      cost[n] = new_cost, came_from[n] = cell, open n",
  "no path: the target can't be reached",
];

export const astarPseudocode = [
  "cost[start] = 0, open = {start}",
  "while open isn't empty:",
  "  cell = the open cell with the lowest cost + distance left",
  "  if cell is the target: trace the path back, done",
  "  for each open neighbour n of cell:",
  "    new_cost = cost[cell] + cost of stepping on n",
  "    if new_cost < cost[n]:",
  "      cost[n] = new_cost, came_from[n] = cell, open n",
  "no path: the target can't be reached",
];

export const greedyPseudocode = [
  "open = {start}",
  "while open isn't empty:",
  "  cell = the open cell closest to the target",
  "  if cell is the target: trace the path back, done",
  "  for each open neighbour n of cell:",
  "    if n hasn't been seen:",
  "      came_from[n] = cell, open n",
  "no path: the target can't be reached",
];

const lines = (push: number, none: number) => ({ pick: 2, target: 3, push, none });

export const pathSearches: Record<PathAlgorithm, PathSearch> = {
  bfs,
  dfs,
  dijkstra: bestFirst((cost) => cost, lines(7, 8), true),
  astar: bestFirst((cost, left) => cost + left, lines(7, 8), true),
  greedy: bestFirst((_cost, left) => left, lines(6, 7), false),
};

export const pathPseudocode: Record<PathAlgorithm, string[]> = {
  bfs: bfsPseudocode,
  dfs: dfsPseudocode,
  dijkstra: dijkstraPseudocode,
  astar: astarPseudocode,
  greedy: greedyPseudocode,
};
