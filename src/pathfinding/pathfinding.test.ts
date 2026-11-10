import { describe, expect, it } from "vitest";
import { seededRandom } from "@/utils/random";
import {
  applyPreset,
  decodeCells,
  emptyGrid,
  encodeCells,
  neighbors,
  stepCost,
  withTerrain,
} from "./grid";
import { gridDimensions, gridSizes } from "@/utils/gridSize";
import { pathSearches } from "./searches";
import { PathTimeline } from "./timeline";
import { EMPTY, MUD, ON_PATH, VISITED, WALL, type Grid, type PathAlgorithm } from "./types";

const algorithms = Object.keys(pathSearches) as PathAlgorithm[];

/** Reference answer: cheapest cost from start to end (plain Dijkstra), or null if unreachable. */
const cheapest = (grid: Grid, costOf: (cell: number) => number) => {
  const dist = new Map([[grid.start, 0]]);
  const done = new Set<number>();
  while (true) {
    let best = -1;
    for (const [cell, d] of dist) if (!done.has(cell) && (best === -1 || d < dist.get(best)!)) best = cell;
    if (best === -1) return null;
    if (best === grid.end) return dist.get(best)!;
    done.add(best);
    for (const n of neighbors(grid, best)) {
      const next = dist.get(best)! + costOf(n);
      if (next < (dist.get(n) ?? Infinity)) dist.set(n, next);
    }
  }
};

const finish = (algorithm: PathAlgorithm, grid: Grid) => {
  const timeline = new PathTimeline(pathSearches[algorithm], grid);
  return { timeline, frame: timeline.frameAt(timeline.length - 1) };
};

/** The path in the final frame must be a connected walk from start to end over open cells. */
const expectValidPath = (grid: Grid, states: Uint8Array) => {
  const onPath = [...states.keys()].filter((c) => states[c] === ON_PATH);
  expect(onPath).toContain(grid.start);
  expect(onPath).toContain(grid.end);
  for (const cell of onPath) {
    expect(grid.cells[cell]).not.toBe(WALL);
    if (cell !== grid.start && cell !== grid.end) {
      expect(neighbors(grid, cell).filter((n) => states[n] === ON_PATH).length).toBeGreaterThanOrEqual(2);
    }
  }
};

const grids = (seed: number) => {
  const random = seededRandom(seed);
  const base = emptyGrid(13, 21);
  return [applyPreset(base, "walls", random), applyPreset(base, "terrain", random), applyPreset(base, "maze", random), base];
};

describe("pathfinding", () => {
  it("every algorithm finds a valid path when there is one", () => {
    for (let seed = 1; seed <= 15; seed++) {
      for (const grid of grids(seed)) {
        if (cheapest(grid, () => 1) === null) continue;
        for (const algorithm of algorithms) {
          const { frame } = finish(algorithm, grid);
          expect(frame.found, `${algorithm} seed ${seed}`).toBe(true);
          expectValidPath(grid, frame.states);
        }
      }
    }
  });

  it("BFS finds the fewest steps; Dijkstra and A* the lowest cost", () => {
    for (let seed = 1; seed <= 15; seed++) {
      for (const grid of grids(seed)) {
        const fewest = cheapest(grid, () => 1);
        if (fewest === null) continue;
        expect(finish("bfs", grid).frame.stats.pathLength).toBe(fewest);
        const lowest = cheapest(grid, (c) => stepCost(grid, c));
        expect(finish("dijkstra", grid).frame.stats.pathCost).toBe(lowest);
        expect(finish("astar", grid).frame.stats.pathCost).toBe(lowest);
      }
    }
  });

  it("A* examines no more cells than Dijkstra on an open grid", () => {
    const grid = emptyGrid(15, 25);
    expect(finish("astar", grid).frame.stats.visited).toBeLessThanOrEqual(finish("dijkstra", grid).frame.stats.visited);
  });

  it("reports no path when the target is walled off", () => {
    let grid = emptyGrid(9, 9);
    for (const n of [grid.end - 1, grid.end + 1, grid.end - 9, grid.end + 9]) grid = withTerrain(grid, n, WALL);
    for (const algorithm of algorithms) {
      const { frame } = finish(algorithm, grid);
      expect(frame.found).toBe(false);
      expect(frame.states.includes(ON_PATH)).toBe(false);
    }
  });

  it("rebuilds any frame the same way whether reached forwards or by seeking back", () => {
    const grid = grids(3)[0];
    const { timeline } = finish("astar", grid);
    const middle = Math.floor(timeline.length / 2);
    const forward = timeline.frameAt(middle);
    timeline.frameAt(timeline.length - 1);
    timeline.frameAt(0);
    const again = new PathTimeline(pathSearches.astar, grid).frameAt(middle);
    expect([...forward.states]).toEqual([...again.states]);
    expect(forward.stats.visited).toBe([...forward.states].filter((s) => s === VISITED).length);
  });

  it("runs a race clock in cells examined: frame k has exactly k visits, then the path", () => {
    for (const grid of grids(3)) {
      for (const algorithm of algorithms) {
        const timeline = new PathTimeline(pathSearches[algorithm], grid);
        expect(timeline.totalVisits).toBe(timeline.frameAt(timeline.length - 1).stats.visited);
        for (let visits = 0; visits < timeline.totalVisits; visits++) {
          expect(timeline.frameAt(timeline.frameIndexAtVisits(visits)).stats.visited).toBe(visits);
        }
        expect(timeline.frameIndexAtVisits(timeline.totalVisits)).toBe(timeline.length - 1);
      }
    }
  });

  it("carves mazes where every open cell is reachable", () => {
    const grid = applyPreset(emptyGrid(17, 33), "maze", seededRandom(7));
    const seen = new Set([grid.start]);
    const queue = [grid.start];
    while (queue.length) for (const n of neighbors(grid, queue.shift()!)) if (!seen.has(n) && seen.add(n)) queue.push(n);
    const open = [...grid.cells.keys()].filter((c) => grid.cells[c] !== WALL);
    expect(seen.size).toBe(open.length);
  });

  it("keeps start and end inside every maze, wherever they are", () => {
    const random = seededRandom(3);
    for (const size of gridSizes) {
      for (const phone of [false, true]) {
        const { rows, cols } = gridDimensions(size, phone);
        for (let k = 0; k < 40; k++) {
          // Default spots first, then markers moved anywhere (edges and corners too).
          let grid = emptyGrid(rows, cols);
          if (k > 0) {
            const start = Math.floor(random() * rows * cols);
            const end = (start + 1 + Math.floor(random() * (rows * cols - 1))) % (rows * cols);
            grid = { ...grid, start, end };
          }
          const maze = applyPreset(grid, "maze", seededRandom(k));
          expect(new PathTimeline(pathSearches.bfs, maze).frameAt(Infinity).found).toBe(true);
        }
      }
    }
  });

  it("packs terrain into a URL-safe string and back", () => {
    const grid = applyPreset(emptyGrid(17, 33), "terrain", seededRandom(9));
    const text = encodeCells(grid.cells);
    expect(text).toMatch(/^[A-Za-z0-9_-]+$/);
    expect([...decodeCells(text, grid.cells.length)!]).toEqual([...grid.cells]);
    expect(decodeCells("!!", 10)).toBeNull();
    expect(decodeCells(text, 5)).toBeNull();
    expect([EMPTY, WALL, MUD].every((t) => grid.cells.includes(t))).toBe(true);
  });
});
