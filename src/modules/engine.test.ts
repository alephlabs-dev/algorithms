import { describe, expect, it } from "vitest";
import { sortAlgorithms } from "@/algorithms";
import { Timeline } from "@/algorithms/timeline";
import { makeGraph } from "@/graphs";
import { applyPreset, emptyGrid } from "@/pathfinding";
import { moduleOf, routeFromPath, routePath } from "@/routes";
import type { StoreState } from "@/store";
import { readLocation } from "@/urlState";
import { generateItems } from "@/utils/generateItems";
import { seededRandom } from "@/utils/random";
import { engines, type ModuleId } from "./engine";

const SORTING = {
  algorithm: "heap",
  size: 40,
  inputOrder: "reversed",
  displayMode: "bars",
  seed: 12345,
  racers: ["insertion", "quick", "merge"],
};

const PATHFINDING = {
  algorithm: "dijkstra",
  gridSize: "medium",
  grid: applyPreset(emptyGrid(17, 33), "maze", seededRandom(3)),
  racers: ["bfs", "astar"],
};

const GRAPHS = {
  algorithm: "dijkstra",
  size: "large",
  preset: "tree",
  graph: makeGraph("tree", "large", false, seededRandom(5)),
  racers: ["prim", "kruskal"],
};

const DP = {
  algorithm: "lcs",
  a: "KITTEN",
  b: "SITTING",
  items: [
    { weight: 3, value: 4 },
    { weight: 4, value: 5 },
  ],
  capacity: 7,
};

const STRUCTURES = {
  algorithm: "avl",
  size: "medium",
  preset: "ascending",
  ops: [
    { kind: "insert", value: 10 },
    { kind: "insert", value: 20 },
  ],
};

const BACKTRACKING = { problem: "queens", queensN: 5, sudokuPuzzle: "easy", sudokuOrder: "rows" };

const FOURIER = {
  algorithm: "epicycles",
  circles: 25,
  shape: "custom",
  path: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
  ],
};

// Just the fields the engines read; each slice gets only its settings.
const stateFor = (module: ModuleId, view: "single" | "race", isModuleStart: boolean) =>
  ({
    module,
    view,
    isModuleStart,
    isLanding: false,
    speedPreset: "2x",
    sorting: SORTING,
    pathfinding: PATHFINDING,
    graphs: GRAPHS,
    structures: STRUCTURES,
    dp: DP,
    backtracking: BACKTRACKING,
    fourier: FOURIER,
  }) as unknown as StoreState;

/** A store change to one module's slice. */
const within = (module: ModuleId, base: object, change: object) =>
  ({ [module]: { ...base, ...change } }) as Partial<StoreState>;

describe("module engines", () => {
  for (const module of Object.keys(engines) as ModuleId[]) {
    it(`${module}: every page it can be on belongs to it and survives its URL`, () => {
      for (const view of ["single", "race"] as const) {
        for (const isModuleStart of [false, true]) {
          const state = stateFor(module, view, isModuleStart);
          const route = engines[module].route(state);
          const path = routePath(route);
          expect(moduleOf(route)).toBe(module);
          expect(routeFromPath(path)).toEqual(route);
          const location = readLocation(path, engines[module].search(state));
          expect(location.module).toBe(module);
          // Fourier and backtracking have no race: their pages are single view whatever the store's view says.
          const hasRace = module !== "fourier" && module !== "backtracking";
          expect(location.view ?? "single").toBe(hasRace ? view : "single");
          expect(location.speed).toBe("2x");
        }
      }
    });
  }

  it("puts every setting a module shares in its link, so editing it changes the link", () => {
    const changes: [ModuleId, Partial<StoreState>][] = [
      ["sorting", within("sorting", SORTING, { size: 80 })],
      ["sorting", within("sorting", SORTING, { inputOrder: "sorted" })],
      ["sorting", within("sorting", SORTING, { seed: 99 })],
      ["sorting", within("sorting", SORTING, { racers: ["quick", "merge"] })],
      [
        "pathfinding",
        within("pathfinding", PATHFINDING, { grid: applyPreset(emptyGrid(17, 33), "walls", seededRandom(8)) }),
      ],
      ["pathfinding", within("pathfinding", PATHFINDING, { racers: ["dfs", "greedy"] })],
      ["graphs", within("graphs", GRAPHS, { graph: makeGraph("grid", "large", false, seededRandom(2)) })],
      ["graphs", within("graphs", GRAPHS, { preset: "dag" })],
      ["graphs", within("graphs", GRAPHS, { racers: ["bfs", "topo"] })],
      ["fourier", within("fourier", FOURIER, { circles: 100 })],
      ["fourier", within("fourier", FOURIER, { shape: "star" })],
      ["fourier", within("fourier", FOURIER, { path: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }] })],
      ["fourier", { speedPreset: "4x" }],
      [
        "structures",
        within("structures", STRUCTURES, {
          ops: [
            { kind: "insert", value: 10 },
            { kind: "delete", value: 10 },
          ],
        }),
      ],
      ["structures", within("structures", STRUCTURES, { preset: "random" })],
      ["dp", within("dp", DP, { a: "SUNDAY" })],
      ["dp", within("dp", DP, { b: "SATURDAY" })],
      ["dp", within("dp", DP, { algorithm: "knapsack", capacity: 9 })],
      ["backtracking", within("backtracking", BACKTRACKING, { queensN: 8 })],
    ];
    for (const [module, change] of changes) {
      const state = stateFor(module, "single", false);
      expect(engines[module].search({ ...state, ...change } as StoreState)).not.toBe(engines[module].search(state));
    }
  });

  it("puts the Sudoku puzzle in its link", () => {
    const sudokuWith = (change: object) =>
      ({
        ...stateFor("backtracking", "single", false),
        backtracking: { ...BACKTRACKING, problem: "sudoku", ...change },
      }) as unknown as StoreState;
    const sudoku = sudokuWith({});
    const route = engines.backtracking.route(sudoku);
    expect(routePath(route)).toBe("/backtracking/sudoku");
    const hard = engines.backtracking.search(sudokuWith({ sudokuPuzzle: "hard" }));
    expect(hard).not.toBe(engines.backtracking.search(sudoku));
    expect(readLocation(routePath(route), hard).backtracking).toEqual({ puzzle: "hard" });
    const mrv = engines.backtracking.search(sudokuWith({ sudokuOrder: "mrv" }));
    expect(readLocation(routePath(route), mrv).backtracking).toEqual({ puzzle: "easy", order: "mrv" });
  });

  it("sorting has guess mode with 10 or 20 items, and none with more", () => {
    const sortingWith = (size: number) => ({
      ...stateFor("sorting", "single", false),
      ...within("sorting", SORTING, {
        algorithm: "insertion",
        size,
        run: new Timeline(sortAlgorithms.insertion, generateItems(size, "random", seededRandom(4))),
      }),
    });
    const game = engines.sorting.game;
    expect(game).toBeDefined();
    expect(game!(sortingWith(10)).length).toBeGreaterThan(0);
    expect(game!(sortingWith(20)).length).toBeGreaterThan(0);
    expect(game!(sortingWith(40))).toEqual([]);
    expect(game!(sortingWith(400))).toEqual([]);
  });
});
