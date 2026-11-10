import { describe, expect, it } from "vitest";
import { applyPreset, manhattan, neighbors, emptyGrid } from "./grid";
import { WALL, type Grid, type PathAlgorithm } from "./types";
import { pathSearches } from "./searches";
import { PathTimeline } from "./timeline";
import { seededRandom } from "@/utils/random";
import { pathQuestions } from "./questions";
import { MAX_QUESTIONS } from "@/game/spread";

const algorithms = Object.keys(pathSearches) as PathAlgorithm[];

/** A few grids of each kind, the same every time. */
const grids: [string, Grid][] = [
  ["clear", emptyGrid(11, 21)],
  ...([1, 2, 3] as const).flatMap((seed): [string, Grid][] => [
    [`maze ${seed}`, applyPreset(emptyGrid(17, 33), "maze", seededRandom(seed))],
    [`walls ${seed}`, applyPreset(emptyGrid(17, 33), "walls", seededRandom(seed))],
    [`terrain ${seed}`, applyPreset(emptyGrid(13, 11), "terrain", seededRandom(seed))],
  ]),
];

const cases = algorithms.flatMap((a) => grids.map(([name, grid]) => [a, name, grid] as const));

describe("pathfinding guess mode questions", () => {
  it.each(algorithms)("%s asks on an open grid", (algorithm) => {
    const run = new PathTimeline(pathSearches[algorithm], emptyGrid(11, 21));
    expect(pathQuestions(run, algorithm).length).toBeGreaterThan(0);
  });

  it.each(cases)("%s on %s: the answer is the cell visited next, among three or four marked cells", (algorithm, _, grid) => {
    const run = new PathTimeline(pathSearches[algorithm], grid);
    for (const q of pathQuestions(run, algorithm)) {
      if (q.kind !== "choice" || !q.gridCells) throw new Error("a cell question");
      const step = run.stepAt(q.at);
      expect(step?.type).toBe("visit");
      expect(q.answer).toBe(step?.type === "visit" && step.cell);
      expect([3, 4]).toContain(q.options.length);
      expect(q.options).toContain(q.answer);
    }
  });

  it.each(cases)("%s on %s: every other marked cell is visited later, or never", (algorithm, _, grid) => {
    const run = new PathTimeline(pathSearches[algorithm], grid);
    const visitedAt = new Map<number, number>();
    for (let f = 1; f < run.length; f++) {
      const step = run.stepAt(f);
      if (step?.type === "visit") visitedAt.set(step.cell, f);
    }
    for (const q of pathQuestions(run, algorithm)) {
      if (q.kind !== "choice") throw new Error("a cell question");
      for (const cell of q.options) {
        if (cell === q.answer) continue;
        expect(visitedAt.get(cell) ?? Infinity).toBeGreaterThan(q.at);
      }
    }
  });

  it.each(grids)("BFS on %s: the other marked cells are a ring farther from the start", (_, grid) => {
    // Steps from the start, worked out here on their own.
    const steps = new Map([[grid.start, 0]]);
    for (const queue = [grid.start]; queue.length; ) {
      const cell = queue.shift()!;
      for (const n of neighbors(grid, cell)) {
        if (steps.has(n)) continue;
        steps.set(n, steps.get(cell)! + 1);
        queue.push(n);
      }
    }
    const run = new PathTimeline(pathSearches.bfs, grid);
    for (const q of pathQuestions(run, "bfs")) {
      if (q.kind !== "choice") throw new Error("a cell question");
      for (const cell of q.options)
        if (cell !== q.answer) expect(steps.get(cell)).toBe(steps.get(q.answer)! + 1);
    }
  });

  it.each(grids)("greedy on %s: the other marked cells are farther from the target", (_, grid) => {
    const run = new PathTimeline(pathSearches.greedy, grid);
    for (const q of pathQuestions(run, "greedy")) {
      if (q.kind !== "choice") throw new Error("a cell question");
      const answer = manhattan(grid, q.answer, grid.end);
      for (const cell of q.options) if (cell !== q.answer) expect(manhattan(grid, cell, grid.end)).toBeGreaterThan(answer);
    }
  });

  it.each(grids)("DFS on %s: never another neighbour of the cell just visited", (_, grid) => {
    const run = new PathTimeline(pathSearches.dfs, grid);
    for (const q of pathQuestions(run, "dfs")) {
      if (q.kind !== "choice") throw new Error("a cell question");
      const current = run.frameAt(q.at - 1).current;
      const beside = current === null ? [] : neighbors(grid, current);
      for (const cell of q.options) if (cell !== q.answer) expect(beside).not.toContain(cell);
    }
  });

  it.each(cases)("%s on %s: the explanation shows each other cell losing by its numbers", (algorithm, _, grid) => {
    const run = new PathTimeline(pathSearches[algorithm], grid);
    for (const q of pathQuestions(run, algorithm)) {
      // The answer's number comes before the ";", the others' after it. In A* the sum decides; in DFS fewer visits ago wins.
      const [mine, theirs] = q.explain(true).split("; ");
      const decisive = (part: string) =>
        [...part.matchAll(algorithm === "astar" ? /= (\d+)/g : /(\d+)/g)].map((m) => Number(m[1]));
      const numbers = [...(/on the last visit/.test(mine) ? [0] : decisive(mine)), ...decisive(theirs)];
      expect(numbers.length).toBeGreaterThanOrEqual(2);
      const [answer, ...others] = numbers;
      for (const n of others) expect(n).toBeGreaterThan(answer);
    }
  });

  it.each(cases)("%s on %s: at most ten, at least six visits apart", (algorithm, _, grid) => {
    const run = new PathTimeline(pathSearches[algorithm], grid);
    const visitsBefore = (at: number) => run.frameAt(at - 1).stats.visited;
    const asked = pathQuestions(run, algorithm).map((q) => visitsBefore(q.at));
    expect(asked.length).toBeLessThanOrEqual(MAX_QUESTIONS);
    for (let k = 1; k < asked.length; k++) expect(asked[k] - asked[k - 1]).toBeGreaterThanOrEqual(6);
  });

  it.each(algorithms)("%s asks nothing in a corridor: never two other cells waiting", (algorithm) => {
    // One row open between two rows of wall.
    const grid = emptyGrid(3, 21);
    const cells = grid.cells.slice();
    for (let col = 0; col < 21; col++) [cells[col], cells[42 + col]] = [WALL, WALL];
    const run = new PathTimeline(pathSearches[algorithm], { ...grid, cells });
    expect(pathQuestions(run, algorithm)).toEqual([]);
  });

  it("labels the marked cells A to D in reading order", () => {
    const run = new PathTimeline(pathSearches.bfs, emptyGrid(11, 21));
    for (const q of pathQuestions(run, "bfs")) {
      if (q.kind !== "choice") throw new Error("a cell question");
      expect(q.optionLabels).toEqual(["A", "B", "C", "D"].slice(0, q.options.length));
      expect(q.options).toEqual([...q.options].sort((a, b) => a - b));
    }
  });

  it("BFS on an open grid: a worked example", () => {
    // Start at row 6, column 4 (from 1). Its four neighbours are a step away; visiting the one above it
    // added three cells two steps away. Next comes the right neighbour, D, still one step away.
    const grid = emptyGrid(11, 21);
    const [q] = pathQuestions(new PathTimeline(pathSearches.bfs, grid), "bfs");
    if (q.kind !== "choice") throw new Error("a cell question");
    const at = (row: number, col: number) => (row - 1) * 21 + col - 1;
    expect(q.options).toEqual([at(4, 4), at(5, 3), at(5, 5), at(6, 5)]);
    expect(q.answer).toBe(at(6, 5));
    expect(q.explain(true)).toBe("Right. BFS takes the nearest ring first. D is 1 step from the start; A, B and C are 2.");
    expect(q.explain(false)).toMatch(/^It's D\. /);
    expect(q.marksText).toBe("A: row 4, column 4; B: row 5, column 3; C: row 5, column 5; D: row 6, column 5");
  });

  it.each(algorithms)("%s in mazes: asks with three cells where only two lose, four where three do", (algorithm) => {
    const sizes = new Set<number>();
    for (let seed = 1; seed <= 20; seed++) {
      const grid = applyPreset(emptyGrid(17, 33), "maze", seededRandom(seed));
      for (const q of pathQuestions(new PathTimeline(pathSearches[algorithm], grid), algorithm))
        if (q.kind === "choice") sizes.add(q.options.length);
    }
    expect([...sizes].sort()).toEqual([3, 4]);
  });
});
